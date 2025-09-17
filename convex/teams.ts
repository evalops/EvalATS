import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Create or update team member
export const upsertTeamMember = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("hiring_manager"),
      v.literal("recruiter"),
      v.literal("interviewer"),
      v.literal("coordinator"),
      v.literal("viewer")
    ),
    department: v.optional(v.string()),
    avatar: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if member already exists
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...args,
        isActive: true,
      })
    }

    return await ctx.db.insert("teamMembers", {
      ...args,
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: args.permissions || getDefaultPermissions(args.role),
    })
  },
})

// Get default permissions for a role
function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    admin: ["all"],
    hiring_manager: [
      "view_candidates",
      "edit_candidates",
      "schedule_interviews",
      "provide_feedback",
      "make_decisions",
      "view_analytics",
    ],
    recruiter: [
      "view_candidates",
      "edit_candidates",
      "schedule_interviews",
      "provide_feedback",
      "send_emails",
      "manage_pipeline",
    ],
    interviewer: [
      "view_assigned_candidates",
      "provide_feedback",
    ],
    coordinator: [
      "view_candidates",
      "schedule_interviews",
      "send_emails",
    ],
    viewer: ["view_candidates", "view_analytics"],
  }
  return permissions[role] || []
}

// Add team member to a job
export const addToHiringTeam = mutation({
  args: {
    jobId: v.id("jobs"),
    teamMemberId: v.id("teamMembers"),
    role: v.union(
      v.literal("hiring_manager"),
      v.literal("recruiter"),
      v.literal("interviewer"),
      v.literal("coordinator")
    ),
    isPrimary: v.boolean(),
    addedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already on team
    const existing = await ctx.db
      .query("hiringTeams")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .filter((q) => q.eq(q.field("teamMemberId"), args.teamMemberId))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        role: args.role,
        isPrimary: args.isPrimary,
      })
    }

    const hiringTeamId = await ctx.db.insert("hiringTeams", {
      ...args,
      addedAt: new Date().toISOString(),
    })

    // Log activity
    await logActivity(ctx, {
      action: "team_member_added",
      actorId: args.addedBy,
      targetType: "job",
      targetId: args.jobId,
      jobId: args.jobId,
    })

    return hiringTeamId
  },
})

// Get hiring team for a job
export const getHiringTeam = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, args) => {
    const teamAssignments = await ctx.db
      .query("hiringTeams")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect()

    const teamWithDetails = await Promise.all(
      teamAssignments.map(async (assignment) => {
        const member = await ctx.db.get(assignment.teamMemberId)
        return {
          ...assignment,
          member,
        }
      })
    )

    return teamWithDetails
  },
})

// Add comment to an entity
export const addComment = mutation({
  args: {
    entityType: v.union(
      v.literal("candidate"),
      v.literal("job"),
      v.literal("interview")
    ),
    entityId: v.string(),
    authorId: v.id("teamMembers"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
    mentions: v.optional(v.array(v.id("teamMembers"))),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      ...args,
      mentions: args.mentions || [],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    })

    // Notify mentioned users
    if (args.mentions && args.mentions.length > 0) {
      for (const mentionedId of args.mentions) {
        await createNotification(ctx, {
          userId: mentionedId,
          type: "mention",
          fromId: args.authorId,
          entityType: args.entityType,
          entityId: args.entityId,
          commentId,
        })
      }
    }

    // Log activity
    await logActivity(ctx, {
      action: "comment_added",
      actorId: args.authorId,
      targetType: args.entityType,
      targetId: args.entityId,
    })

    return commentId
  },
})

// Get comments for an entity
export const getComments = query({
  args: {
    entityType: v.union(
      v.literal("candidate"),
      v.literal("job"),
      v.literal("interview")
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .order("desc")
      .collect()

    // Get author details for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId)
        const mentions = await Promise.all(
          comment.mentions.map(id => ctx.db.get(id))
        )
        return {
          ...comment,
          author,
          mentionedUsers: mentions.filter(Boolean),
        }
      })
    )

    return commentsWithAuthors
  },
})

// Edit a comment
export const editComment = mutation({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, {
      content: args.content,
      isEdited: true,
      editedAt: new Date().toISOString(),
    })
    return args.commentId
  },
})

// Delete a comment (soft delete)
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, {
      isDeleted: true,
    })
    return args.commentId
  },
})

// Add reaction to comment
export const addReaction = mutation({
  args: {
    commentId: v.id("comments"),
    emoji: v.string(),
    userId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new Error("Comment not found")

    const reactions = comment.reactions || []

    // Check if user already has this reaction
    const existingIndex = reactions.findIndex(
      r => r.userId === args.userId && r.emoji === args.emoji
    )

    if (existingIndex === -1) {
      reactions.push({
        emoji: args.emoji,
        userId: args.userId,
      })

      await ctx.db.patch(args.commentId, {
        reactions,
      })
    }

    return args.commentId
  },
})

// Remove reaction from comment
export const removeReaction = mutation({
  args: {
    commentId: v.id("comments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId)
    if (!comment) throw new Error("Comment not found")

    const reactions = comment.reactions || []
    const filteredReactions = reactions.filter(r => r.emoji !== args.emoji)

    await ctx.db.patch(args.commentId, {
      reactions: filteredReactions,
    })

    return args.commentId
  },
})

// Get all team members
export const getTeamMembers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
  },
})

// Submit interview feedback
export const submitInterviewFeedback = mutation({
  args: {
    interviewId: v.id("interviews"),
    candidateId: v.id("candidates"),
    interviewerId: v.id("teamMembers"),
    scorecardId: v.optional(v.id("scorecards")),
    ratings: v.object({
      technical: v.optional(v.number()),
      communication: v.optional(v.number()),
      problemSolving: v.optional(v.number()),
      culturalFit: v.optional(v.number()),
      leadership: v.optional(v.number()),
      overall: v.number(),
    }),
    strengths: v.array(v.string()),
    concerns: v.array(v.string()),
    questions: v.array(v.object({
      question: v.string(),
      answer: v.string(),
      rating: v.optional(v.number()),
    })),
    recommendation: v.union(
      v.literal("strong_hire"),
      v.literal("hire"),
      v.literal("no_hire"),
      v.literal("strong_no_hire")
    ),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if feedback already exists
    const existing = await ctx.db
      .query("interviewFeedback")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .filter((q) => q.eq(q.field("interviewerId"), args.interviewerId))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...args,
        submittedAt: new Date().toISOString(),
        isComplete: true,
      })
    }

    const feedbackId = await ctx.db.insert("interviewFeedback", {
      ...args,
      submittedAt: new Date().toISOString(),
      isComplete: true,
    })

    // Update interview status
    await ctx.db.patch(args.interviewId, {
      status: "completed",
    })

    // Log activity
    await logActivity(ctx, {
      action: "feedback_submitted",
      actorId: args.interviewerId,
      targetType: "interview",
      targetId: args.interviewId,
    })

    return feedbackId
  },
})

// Get interview feedback
export const getInterviewFeedback = query({
  args: {
    interviewId: v.optional(v.id("interviews")),
    candidateId: v.optional(v.id("candidates")),
  },
  handler: async (ctx, args) => {
    let feedback

    if (args.interviewId !== undefined) {
      feedback = await ctx.db
        .query("interviewFeedback")
        .withIndex("by_interview", (q) =>
          q.eq("interviewId", args.interviewId!)
        )
        .collect()
    } else if (args.candidateId !== undefined) {
      feedback = await ctx.db
        .query("interviewFeedback")
        .withIndex("by_candidate", (q) =>
          q.eq("candidateId", args.candidateId!)
        )
        .collect()
    } else {
      feedback = await ctx.db
        .query("interviewFeedback")
        .collect()
    }

    // Get interviewer details
    const feedbackWithDetails = await Promise.all(
      feedback.map(async (fb) => {
        const interviewer = await ctx.db.get(fb.interviewerId)
        const interview = await ctx.db.get(fb.interviewId)
        return {
          ...fb,
          interviewer,
          interview,
        }
      })
    )

    return feedbackWithDetails
  },
})

// Create a task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("review_application"),
      v.literal("schedule_interview"),
      v.literal("provide_feedback"),
      v.literal("check_references"),
      v.literal("send_offer"),
      v.literal("follow_up"),
      v.literal("custom")
    ),
    assigneeId: v.id("teamMembers"),
    creatorId: v.id("teamMembers"),
    relatedTo: v.optional(v.object({
      type: v.union(
        v.literal("candidate"),
        v.literal("job"),
        v.literal("interview")
      ),
      id: v.string(),
    })),
    priority: v.union(
      v.literal("urgent"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    dueDate: v.string(),
    automatedBy: v.optional(v.id("workflows")),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      ...args,
      status: "pending",
      createdAt: new Date().toISOString(),
    })

    // Notify assignee
    await createNotification(ctx, {
      userId: args.assigneeId,
      type: "task_assigned",
      fromId: args.creatorId,
      taskId,
    })

    return taskId
  },
})

// Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    }

    if (args.status === "completed") {
      updates.completedAt = new Date().toISOString()
    }

    await ctx.db.patch(args.taskId, updates)

    // Log activity
    const task = await ctx.db.get(args.taskId)
    if (task) {
      await logActivity(ctx, {
        action: "task_completed",
        actorId: task.assigneeId,
        targetType: "task",
        targetId: args.taskId,
      })
    }

    return args.taskId
  },
})

// Get tasks for a team member
export const getMyTasks = query({
  args: {
    teamMemberId: v.id("teamMembers"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.teamMemberId))

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status))
    }

    const tasks = await query.order("desc").collect()

    // Get related entity details
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        let relatedEntity = null
        if (task.relatedTo) {
          if (task.relatedTo.type === "candidate") {
            relatedEntity = await ctx.db.get(task.relatedTo.id as Id<"candidates">)
          } else if (task.relatedTo.type === "job") {
            relatedEntity = await ctx.db.get(task.relatedTo.id as Id<"jobs">)
          } else if (task.relatedTo.type === "interview") {
            relatedEntity = await ctx.db.get(task.relatedTo.id as Id<"interviews">)
          }
        }

        const creator = await ctx.db.get(task.creatorId)

        return {
          ...task,
          relatedEntity,
          creator,
        }
      })
    )

    return tasksWithDetails
  },
})

// Create or update an offer
export const upsertOffer = mutation({
  args: {
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    details: v.object({
      salary: v.number(),
      currency: v.string(),
      bonus: v.optional(v.number()),
      equity: v.optional(v.string()),
      startDate: v.string(),
      location: v.string(),
      employmentType: v.string(),
      benefits: v.array(v.string()),
    }),
    customTerms: v.optional(v.string()),
    expiresAt: v.string(),
    createdBy: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    // Check if offer exists
    const existing = await ctx.db
      .query("offers")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .filter((q) => q.eq(q.field("jobId"), args.jobId))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        details: args.details,
        customTerms: args.customTerms,
        expiresAt: args.expiresAt,
        status: "draft",
      })
    }

    return await ctx.db.insert("offers", {
      ...args,
      status: "draft",
      approvals: [],
      createdAt: new Date().toISOString(),
    })
  },
})

// Send offer to candidate
export const sendOffer = mutation({
  args: {
    offerId: v.id("offers"),
    letterUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.offerId)
    if (!offer) throw new Error("Offer not found")

    if (offer.status !== "approved") {
      throw new Error("Offer must be approved before sending")
    }

    await ctx.db.patch(args.offerId, {
      status: "sent",
      sentAt: new Date().toISOString(),
      letterUrl: args.letterUrl,
    })

    // Update candidate status
    await ctx.db.patch(offer.candidateId, {
      status: "offer",
    })

    // Log activity
    await logActivity(ctx, {
      action: "offer_sent",
      actorId: offer.createdBy,
      targetType: "offer",
      targetId: args.offerId,
      jobId: offer.jobId,
    })

    return args.offerId
  },
})

// Approve/reject offer
export const reviewOffer = mutation({
  args: {
    offerId: v.id("offers"),
    approverId: v.id("teamMembers"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const offer = await ctx.db.get(args.offerId)
    if (!offer) throw new Error("Offer not found")

    // Update approval in array
    const approvals = offer.approvals || []
    const existingIndex = approvals.findIndex(a => a.approverId === args.approverId)

    const approval = {
      approverId: args.approverId,
      role: "approver", // Could be determined from team member
      status: args.status as "approved" | "rejected",
      comments: args.comments,
      timestamp: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      approvals[existingIndex] = approval
    } else {
      approvals.push(approval)
    }

    // Check if all required approvals are complete
    const allApproved = approvals.every(a => a.status === "approved")
    const anyRejected = approvals.some(a => a.status === "rejected")

    let newStatus = offer.status
    if (anyRejected) {
      newStatus = "draft" // Back to draft if rejected
    } else if (allApproved && approvals.length >= 1) { // Adjust required approvals
      newStatus = "approved"
    }

    await ctx.db.patch(args.offerId, {
      approvals,
      status: newStatus,
    })

    return args.offerId
  },
})

// Get activity feed
export const getActivityFeed = query({
  args: {
    jobId: v.optional(v.id("jobs")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let activities

    if (args.jobId !== undefined) {
      activities = await ctx.db
        .query("activityFeed")
        .withIndex("by_job", (q) => q.eq("jobId", args.jobId!))
        .order("desc")
        .take(args.limit || 50)
    } else {
      activities = await ctx.db
        .query("activityFeed")
        .order("desc")
        .take(args.limit || 50)
    }

    return activities
  },
})

// Helper function to log activity
async function logActivity(
  ctx: any,
  data: {
    action: string
    actorId: string | Id<"teamMembers">
    targetType: string
    targetId: string | Id<any>
    jobId?: Id<"jobs">
  }
) {
  // Get actor details
  let actorName = "System"
  let actorAvatar: string | undefined

  if (typeof data.actorId === "string") {
    // It's a userId, need to look up team member
    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q: any) => q.eq("userId", data.actorId))
      .first()

    if (teamMember) {
      actorName = teamMember.name
      actorAvatar = teamMember.avatar
      data.actorId = teamMember._id
    }
  } else {
    // It's already a teamMember ID
    const teamMember = await ctx.db.get(data.actorId)
    if (teamMember) {
      actorName = teamMember.name
      actorAvatar = teamMember.avatar
    }
  }

  // Get target name
  let targetName = "Unknown"
  if (data.targetType === "candidate") {
    const candidate = await ctx.db.get(data.targetId as Id<"candidates">)
    targetName = candidate?.name || targetName
  } else if (data.targetType === "job") {
    const job = await ctx.db.get(data.targetId as Id<"jobs">)
    targetName = job?.title || targetName
  }

  await ctx.db.insert("activityFeed", {
    actor: {
      id: data.actorId as Id<"teamMembers">,
      name: actorName,
      avatar: actorAvatar,
    },
    action: data.action as any,
    target: {
      type: data.targetType as any,
      id: data.targetId as string,
      name: targetName,
    },
    jobId: data.jobId,
    isRead: false,
    timestamp: new Date().toISOString(),
  })
}

// Helper function to create notifications
async function createNotification(
  ctx: any,
  data: {
    userId: Id<"teamMembers">
    type: string
    fromId: Id<"teamMembers">
    entityType?: string
    entityId?: string
    commentId?: Id<"comments">
    taskId?: Id<"tasks">
  }
) {
  // This would integrate with your notification system
  // For now, we'll just log it to activity feed
  const from = await ctx.db.get(data.fromId)

  // You could create a separate notifications table
  // or integrate with external notification service
  console.log(`Notification: ${data.type} for user ${data.userId}`)
}

// Save search configuration
export const saveSearch = mutation({
  args: {
    name: v.string(),
    query: v.string(),
    filters: v.any(),
    entity: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("savedSearches", {
      name: args.name,
      query: args.query,
      filters: args.filters,
      entity: args.entity,
      createdAt: new Date().toISOString(),
    })
  },
})

// Get saved searches
export const getSavedSearches = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("savedSearches").collect()
  },
})

// Delete saved search
export const deleteSavedSearch = mutation({
  args: {
    id: v.id("savedSearches"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

// Add search to history
export const addSearchHistory = mutation({
  args: {
    query: v.string(),
    entity: v.string(),
    filters: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("searchHistory", {
      query: args.query,
      entity: args.entity,
      filters: args.filters,
      timestamp: new Date().toISOString(),
    })
  },
})

// Get search history
export const getSearchHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10
    return await ctx.db
      .query("searchHistory")
      .order("desc")
      .take(limit)
  },
})

// Get email templates
export const getEmailTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("emailTemplates").collect()
  },
})

// Save email template
export const saveEmailTemplate = mutation({
  args: {
    _id: v.optional(v.id("emailTemplates")),
    name: v.string(),
    category: v.string(),
    subject: v.string(),
    content: v.string(),
    variables: v.array(v.string()),
    tags: v.array(v.string()),
    isActive: v.boolean(),
    useCount: v.number(),
  },
  handler: async (ctx, args) => {
    const { _id, ...data } = args

    if (_id) {
      await ctx.db.patch(_id, data)
      return _id
    } else {
      return await ctx.db.insert("emailTemplates", {
        ...data,
        createdAt: new Date().toISOString(),
        lastUsed: undefined,
      })
    }
  },
})

// Delete email template
export const deleteEmailTemplate = mutation({
  args: {
    id: v.id("emailTemplates"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

// Duplicate email template
export const duplicateEmailTemplate = mutation({
  args: {
    id: v.id("emailTemplates"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.id)
    if (!original) throw new Error("Template not found")

    const { _id, _creationTime, ...templateData } = original as any
    return await ctx.db.insert("emailTemplates", {
      ...templateData,
      name: args.name,
      useCount: 0,
      createdAt: new Date().toISOString(),
      lastUsed: null,
    })
  },
})