import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Get all interviews
export const list = query({
  args: {
    status: v.optional(v.string()),
    date: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let interviews = await ctx.db.query('interviews').collect()

    if (args.status && args.status !== 'all') {
      interviews = interviews.filter((i) => i.status === args.status)
    }

    if (args.date) {
      interviews = interviews.filter((i) => i.date === args.date)
    }

    // Get candidate and job details for each interview
    let interviewsWithDetails = await Promise.all(
      interviews.map(async (interview) => {
        const [candidate, job] = await Promise.all([
          ctx.db.get(interview.candidateId),
          ctx.db.get(interview.jobId),
        ])
        return {
          ...interview,
          candidateName: candidate?.name || 'Unknown',
          position: job?.title || 'Unknown Position',
        }
      })
    )

    // Apply search filter on enriched data
    if (args.search) {
      const search = args.search.toLowerCase()
      interviewsWithDetails = interviewsWithDetails.filter(
        (interview) =>
          interview.candidateName.toLowerCase().includes(search) ||
          interview.position.toLowerCase().includes(search) ||
          interview.type.toLowerCase().includes(search)
      )
    }

    return interviewsWithDetails
  },
})

// Get single interview with full details
export const get = query({
  args: { id: v.id('interviews') },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id)
    if (!interview) return null

    const [candidate, job] = await Promise.all([
      ctx.db.get(interview.candidateId),
      ctx.db.get(interview.jobId),
    ])

    return {
      ...interview,
      candidate,
      job,
    }
  },
})

// Create new interview
export const create = mutation({
  args: {
    candidateId: v.id('candidates'),
    jobId: v.id('jobs'),
    type: v.string(),
    date: v.string(),
    time: v.string(),
    duration: v.string(),
    interviewers: v.array(v.string()),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const interviewId = await ctx.db.insert('interviews', {
      ...args,
      status: 'scheduled',
    })

    return interviewId
  },
})

// Update interview status
export const updateStatus = mutation({
  args: {
    id: v.id('interviews'),
    status: v.union(
      v.literal('scheduled'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('no-show')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status })
  },
})

// Add interview feedback
export const addFeedback = mutation({
  args: {
    id: v.id('interviews'),
    feedback: v.string(),
    rating: v.number(),
    technicalSkills: v.optional(v.number()),
    culturalFit: v.optional(v.number()),
    communication: v.optional(v.number()),
    problemSolving: v.optional(v.number()),
    experience: v.optional(v.number()),
    strengths: v.optional(v.string()),
    concerns: v.optional(v.string()),
    recommendation: v.optional(
      v.union(
        v.literal('strong_hire'),
        v.literal('hire'),
        v.literal('no_hire'),
        v.literal('strong_no_hire')
      )
    ),
    wouldWorkWithAgain: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      feedback: args.feedback,
      rating: args.rating,
      technicalSkills: args.technicalSkills,
      culturalFit: args.culturalFit,
      communication: args.communication,
      problemSolving: args.problemSolving,
      experience: args.experience,
      strengths: args.strengths,
      concerns: args.concerns,
      recommendation: args.recommendation,
      wouldWorkWithAgain: args.wouldWorkWithAgain,
    })
  },
})

// Get interviews by candidate
export const getByCandidate = query({
  args: { candidateId: v.id('candidates') },
  handler: async (ctx, args) => {
    const interviews = await ctx.db
      .query('interviews')
      .withIndex('by_candidate', (q) => q.eq('candidateId', args.candidateId))
      .collect()

    return interviews
  },
})

// Schedule interview (alias for create with more specific name)
export const schedule = mutation({
  args: {
    candidateId: v.id('candidates'),
    jobId: v.id('jobs'),
    type: v.string(),
    date: v.string(),
    time: v.string(),
    duration: v.string(),
    interviewers: v.array(v.string()),
    location: v.string(),
    status: v.union(
      v.literal('scheduled'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('no-show')
    ),
  },
  handler: async (ctx, args) => {
    const interviewId = await ctx.db.insert('interviews', args)

    // Add to candidate timeline
    await ctx.db.insert('timeline', {
      candidateId: args.candidateId,
      date: new Date().toISOString().split('T')[0],
      type: 'interview',
      title: `${args.type} interview scheduled`,
      description: `Scheduled for ${args.date} at ${args.time}`,
      status: 'scheduled',
    })

    return interviewId
  },
})

// Update interview
export const update = mutation({
  args: {
    id: v.id('interviews'),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    duration: v.optional(v.string()),
    location: v.optional(v.string()),
    interviewers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
  },
})

// Cancel interview
export const cancel = mutation({
  args: {
    id: v.id('interviews'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: 'cancelled',
      feedback: args.reason || 'Interview cancelled',
    })

    const interview = await ctx.db.get(args.id)
    if (interview) {
      // Add to timeline
      await ctx.db.insert('timeline', {
        candidateId: interview.candidateId,
        date: new Date().toISOString().split('T')[0],
        type: 'interview',
        title: 'Interview cancelled',
        description: args.reason || 'Interview was cancelled',
        status: 'completed',
      })
    }
  },
})

// Send interview invite
export const sendInvite = mutation({
  args: {
    interviewId: v.id('interviews'),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.interviewId)
    if (!interview) throw new Error('Interview not found')

    const candidate = await ctx.db.get(interview.candidateId)
    if (!candidate) throw new Error('Candidate not found')

    // Create email record
    await ctx.db.insert('emails', {
      candidateId: interview.candidateId,
      jobId: interview.jobId,
      from: 'noreply@company.com',
      to: candidate.email,
      subject: `Interview Invitation - ${interview.type} Interview`,
      content:
        args.message ||
        `You have been scheduled for an interview on ${interview.date} at ${interview.time}`,
      template: 'interview_invite',
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      sender: 'System',
    })

    return args.interviewId
  },
})
