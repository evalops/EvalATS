import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { internalMutation, mutation, query } from './_generated/server'

// Create a workflow
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    trigger: v.object({
      type: v.union(
        v.literal('status_change'),
        v.literal('time_based'),
        v.literal('score_threshold'),
        v.literal('stage_duration')
      ),
      conditions: v.any(),
    }),
    actions: v.array(
      v.object({
        type: v.union(
          v.literal('send_email'),
          v.literal('change_status'),
          v.literal('assign_task'),
          v.literal('add_tag'),
          v.literal('notify_team')
        ),
        config: v.any(),
        delay: v.optional(v.number()),
      })
    ),
    scope: v.object({
      jobs: v.optional(v.array(v.id('jobs'))),
      departments: v.optional(v.array(v.string())),
    }),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('workflows', {
      ...args,
      isActive: true,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    })
  },
})

// Get all workflows
export const getWorkflows = query({
  args: {
    isActive: v.optional(v.boolean()),
    jobId: v.optional(v.id('jobs')),
  },
  handler: async (ctx, args) => {
    let workflows

    if (args.isActive !== undefined) {
      workflows = await ctx.db
        .query('workflows')
        .withIndex('by_active', (q) => q.eq('isActive', args.isActive!))
        .collect()
    } else {
      workflows = await ctx.db.query('workflows').collect()
    }

    // Filter by job if specified
    if (args.jobId) {
      return workflows.filter((w) => !w.scope.jobs || w.scope.jobs.includes(args.jobId!))
    }

    return workflows
  },
})

// Toggle workflow active status
export const toggleWorkflow = mutation({
  args: {
    workflowId: v.id('workflows'),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.workflowId, {
      isActive: args.isActive,
    })
  },
})

// Check and execute workflows based on trigger
export const checkWorkflowTriggers = internalMutation({
  args: {
    triggerType: v.union(
      v.literal('status_change'),
      v.literal('time_based'),
      v.literal('score_threshold'),
      v.literal('stage_duration')
    ),
    context: v.any(), // Context data for evaluation
  },
  handler: async (ctx, args) => {
    // Get active workflows for this trigger type
    const workflows = await ctx.db
      .query('workflows')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .filter((q) => q.eq(q.field('trigger.type'), args.triggerType))
      .collect()

    for (const workflow of workflows) {
      if (await evaluateWorkflowConditions(ctx, workflow, args.context)) {
        await executeWorkflowActions(ctx, workflow, args.context)

        // Update workflow stats
        await ctx.db.patch(workflow._id, {
          lastTriggered: new Date().toISOString(),
          triggerCount: workflow.triggerCount + 1,
        })
      }
    }
  },
})

// Evaluate workflow conditions
async function evaluateWorkflowConditions(ctx: any, workflow: any, context: any): Promise<boolean> {
  const { trigger } = workflow
  const conditions = trigger.conditions

  switch (trigger.type) {
    case 'status_change':
      return (
        conditions.fromStatus === context.fromStatus && conditions.toStatus === context.toStatus
      )

    case 'time_based': {
      // Check if enough time has passed
      const timeSince = Date.now() - new Date(context.timestamp).getTime()
      const requiredTime = conditions.afterMinutes * 60 * 1000
      return timeSince >= requiredTime
    }

    case 'score_threshold':
      return context.score >= conditions.minScore

    case 'stage_duration': {
      // Check if candidate has been in stage too long
      const duration = Date.now() - new Date(context.enteredStage).getTime()
      const maxDuration = conditions.maxDays * 24 * 60 * 60 * 1000
      return duration >= maxDuration
    }

    default:
      return false
  }
}

// Execute workflow actions
async function executeWorkflowActions(ctx: any, workflow: any, context: any) {
  for (const action of workflow.actions) {
    // Apply delay if specified
    if (action.delay) {
      // In production, this would be scheduled
      // For now, we'll execute immediately
      console.log(`Would delay action by ${action.delay} minutes`)
    }

    switch (action.type) {
      case 'send_email':
        await sendWorkflowEmail(ctx, action.config, context)
        break

      case 'change_status':
        await changeStatus(ctx, action.config, context)
        break

      case 'assign_task':
        await assignTask(ctx, action.config, context)
        break

      case 'add_tag':
        await addTag(ctx, action.config, context)
        break

      case 'notify_team':
        await notifyTeam(ctx, action.config, context)
        break
    }
  }
}

// Action: Send email
async function sendWorkflowEmail(ctx: any, config: any, context: any) {
  const { templateId, to, subject, body } = config

  // Get recipient email
  let recipientEmail = ''
  if (to === 'candidate') {
    const candidate = await ctx.db.get(context.candidateId)
    recipientEmail = candidate?.email || ''
  } else if (to === 'hiring_manager') {
    // Get primary hiring manager for the job
    const hiringTeam = await ctx.db
      .query('hiringTeams')
      .withIndex('by_job', (q: any) => q.eq('jobId', context.jobId))
      .filter((q: any) =>
        q.and(q.eq(q.field('role'), 'hiring_manager'), q.eq(q.field('isPrimary'), true))
      )
      .first()

    if (hiringTeam) {
      const member = await ctx.db.get(hiringTeam.teamMemberId)
      recipientEmail = member?.email || ''
    }
  }

  if (recipientEmail) {
    // Create email record
    await ctx.db.insert('emails', {
      candidateId: context.candidateId,
      jobId: context.jobId,
      from: 'system@company.com',
      to: recipientEmail,
      subject: substituteVariables(subject, context),
      content: substituteVariables(body, context),
      template: templateId,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      sender: 'Workflow Automation',
    })
  }
}

// Action: Change candidate status
async function changeStatus(ctx: any, config: any, context: any) {
  const { newStatus } = config

  if (context.candidateId) {
    await ctx.db.patch(context.candidateId, {
      status: newStatus,
    })

    // Add to timeline
    await ctx.db.insert('timeline', {
      candidateId: context.candidateId,
      date: new Date().toISOString(),
      type: 'status_change',
      title: `Status changed to ${newStatus}`,
      description: 'Automated by workflow',
      status: 'completed',
    })
  }
}

// Action: Assign task
async function assignTask(ctx: any, config: any, context: any) {
  const { taskType, assignTo, title, description, priority, dueDays } = config

  // Determine assignee
  let assigneeId: Id<'teamMembers'> | null = null

  if (assignTo === 'recruiter') {
    // Get primary recruiter for the job
    const hiringTeam = await ctx.db
      .query('hiringTeams')
      .withIndex('by_job', (q: any) => q.eq('jobId', context.jobId))
      .filter((q: any) =>
        q.and(q.eq(q.field('role'), 'recruiter'), q.eq(q.field('isPrimary'), true))
      )
      .first()

    assigneeId = hiringTeam?.teamMemberId || null
  } else if (assignTo === 'hiring_manager') {
    // Get primary hiring manager
    const hiringTeam = await ctx.db
      .query('hiringTeams')
      .withIndex('by_job', (q: any) => q.eq('jobId', context.jobId))
      .filter((q: any) =>
        q.and(q.eq(q.field('role'), 'hiring_manager'), q.eq(q.field('isPrimary'), true))
      )
      .first()

    assigneeId = hiringTeam?.teamMemberId || null
  }

  if (assigneeId) {
    // Create task
    await ctx.db.insert('tasks', {
      title: substituteVariables(title, context),
      description: substituteVariables(description, context),
      type: taskType,
      assigneeId,
      creatorId: assigneeId, // Self-assigned by workflow
      relatedTo: {
        type: 'candidate',
        id: context.candidateId,
      },
      priority,
      status: 'pending',
      dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      automatedBy: context.workflowId,
    })
  }
}

// Action: Add tag to candidate
async function addTag(ctx: any, config: any, context: any) {
  const { tag } = config

  if (context.candidateId) {
    const candidate = await ctx.db.get(context.candidateId)
    if (candidate) {
      const tags = candidate.tags || []
      if (!tags.includes(tag)) {
        tags.push(tag)
        await ctx.db.patch(context.candidateId, { tags })
      }
    }
  }
}

// Action: Notify team
async function notifyTeam(ctx: any, config: any, context: any) {
  const { message, notifyRoles } = config

  // Get team members to notify
  const hiringTeam = await ctx.db
    .query('hiringTeams')
    .withIndex('by_job', (q: any) => q.eq('jobId', context.jobId))
    .collect()

  for (const member of hiringTeam) {
    if (notifyRoles.includes(member.role)) {
      // Create notification (could be integrated with external service)
      console.log(
        `Notifying team member ${member.teamMemberId}: ${substituteVariables(message, context)}`
      )

      // Add to activity feed
      await ctx.db.insert('activityFeed', {
        actor: {
          id: member.teamMemberId,
          name: 'System',
        },
        action: 'notification' as any,
        target: {
          type: 'candidate',
          id: context.candidateId,
          name: context.candidateName || 'Candidate',
        },
        metadata: { message: substituteVariables(message, context) },
        jobId: context.jobId,
        isRead: false,
        timestamp: new Date().toISOString(),
      })
    }
  }
}

// Helper: Substitute variables in text
function substituteVariables(text: string, context: any): string {
  return text
    .replace(/{{candidateName}}/g, context.candidateName || '')
    .replace(/{{jobTitle}}/g, context.jobTitle || '')
    .replace(/{{companyName}}/g, context.companyName || '')
    .replace(/{{days}}/g, context.days || '')
}

// Predefined workflow templates
export const workflowTemplates = [
  {
    name: 'Auto-reject after 30 days',
    description: "Automatically reject candidates who haven't progressed in 30 days",
    trigger: {
      type: 'stage_duration',
      conditions: {
        stages: ['applied', 'screening'],
        maxDays: 30,
      },
    },
    actions: [
      {
        type: 'change_status',
        config: {
          newStatus: 'rejected',
        },
      },
      {
        type: 'send_email',
        config: {
          templateId: 'rejection_no_progress',
          to: 'candidate',
          subject: 'Update on your application for {{jobTitle}}',
          body: "Thank you for your interest in {{jobTitle}}. After careful consideration, we've decided to move forward with other candidates...",
        },
      },
    ],
  },
  {
    name: 'Follow-up after interview',
    description: 'Send follow-up email 24 hours after interview',
    trigger: {
      type: 'status_change',
      conditions: {
        fromStatus: 'interview',
        toStatus: 'interview_complete',
      },
    },
    actions: [
      {
        type: 'send_email',
        config: {
          templateId: 'interview_followup',
          to: 'candidate',
          subject: 'Thank you for interviewing with us',
          body: 'Dear {{candidateName}}, Thank you for taking the time to interview with us...',
        },
        delay: 1440, // 24 hours
      },
      {
        type: 'assign_task',
        config: {
          taskType: 'provide_feedback',
          assignTo: 'hiring_manager',
          title: 'Provide interview feedback for {{candidateName}}',
          description: 'Please submit your feedback for the interview',
          priority: 'high',
          dueDays: 2,
        },
      },
    ],
  },
  {
    name: 'High-score fast track',
    description: 'Fast-track candidates with high assessment scores',
    trigger: {
      type: 'score_threshold',
      conditions: {
        minScore: 90,
      },
    },
    actions: [
      {
        type: 'change_status',
        config: {
          newStatus: 'interview',
        },
      },
      {
        type: 'add_tag',
        config: {
          tag: 'high_potential',
        },
      },
      {
        type: 'notify_team',
        config: {
          message: 'High-scoring candidate {{candidateName}} ready for interview',
          notifyRoles: ['hiring_manager', 'recruiter'],
        },
      },
      {
        type: 'assign_task',
        config: {
          taskType: 'schedule_interview',
          assignTo: 'coordinator',
          title: 'Schedule interview for {{candidateName}} (High Priority)',
          description: 'High-scoring candidate - please prioritize scheduling',
          priority: 'urgent',
          dueDays: 1,
        },
      },
    ],
  },
  {
    name: 'New application notification',
    description: 'Notify team when new applications come in',
    trigger: {
      type: 'status_change',
      conditions: {
        fromStatus: null,
        toStatus: 'applied',
      },
    },
    actions: [
      {
        type: 'notify_team',
        config: {
          message: 'New application received for {{jobTitle}}',
          notifyRoles: ['recruiter'],
        },
      },
      {
        type: 'assign_task',
        config: {
          taskType: 'review_application',
          assignTo: 'recruiter',
          title: 'Review application from {{candidateName}}',
          description: 'Initial screening required',
          priority: 'medium',
          dueDays: 3,
        },
      },
    ],
  },
]

// Get workflow templates
export const getWorkflowTemplates = query({
  handler: async () => {
    return workflowTemplates
  },
})

// Create workflow from template
export const createWorkflowFromTemplate = mutation({
  args: {
    templateIndex: v.number(),
    scope: v.object({
      jobs: v.optional(v.array(v.id('jobs'))),
      departments: v.optional(v.array(v.string())),
    }),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const template = workflowTemplates[args.templateIndex]
    if (!template) {
      throw new Error('Template not found')
    }

    return await ctx.db.insert('workflows', {
      name: template.name,
      description: template.description,
      trigger: template.trigger as any,
      actions: template.actions as any,
      scope: args.scope,
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: args.createdBy,
      triggerCount: 0,
    })
  },
})
