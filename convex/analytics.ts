import { query } from './_generated/server'
import { v } from 'convex/values'

export const getHiringMetrics = query({
  handler: async (ctx) => {
    const [jobs, candidates, interviews] = await Promise.all([
      ctx.db.query('jobs').collect(),
      ctx.db.query('candidates').collect(),
      ctx.db.query('interviews').collect(),
    ])

    // Calculate total counts
    const totalJobs = jobs.length
    const totalCandidates = candidates.length
    const totalInterviews = interviews.length

    // Active jobs (open status)
    const activeJobs = jobs.filter(job => job.status === 'active').length

    // Candidates by status
    const candidatesByStatus = candidates.reduce((acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Interview completion rate
    const completedInterviews = interviews.filter(
      interview => interview.status === 'completed'
    ).length
    const interviewCompletionRate = totalInterviews > 0
      ? Math.round((completedInterviews / totalInterviews) * 100)
      : 0

    // Recent activity (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const recentCandidates = candidates.filter(
      candidate => candidate._creationTime > thirtyDaysAgo
    ).length

    return {
      totalJobs,
      activeJobs,
      totalCandidates,
      totalInterviews,
      candidatesByStatus,
      interviewCompletionRate,
      recentCandidates,
    }
  },
})

export const getFunnelAnalysis = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query('candidates').collect()

    // Funnel stages with counts
    const funnelData = [
      { stage: 'Applied', count: candidates.length, color: '#3b82f6' },
      {
        stage: 'Screening',
        count: candidates.filter(c => ['screening', 'interview', 'offer', 'hired'].includes(c.status)).length,
        color: '#8b5cf6'
      },
      {
        stage: 'Interview',
        count: candidates.filter(c => ['interview', 'offer', 'hired'].includes(c.status)).length,
        color: '#06b6d4'
      },
      {
        stage: 'Offer',
        count: candidates.filter(c => ['offer', 'hired'].includes(c.status)).length,
        color: '#10b981'
      },
      {
        stage: 'Hired',
        count: candidates.filter(c => c.status === 'hired').length,
        color: '#059669'
      },
    ]

    // Calculate conversion rates
    const conversionRates = funnelData.map((stage, index) => {
      if (index === 0) return { ...stage, conversionRate: 100 }
      const previousCount = funnelData[index - 1].count
      const conversionRate = previousCount > 0
        ? Math.round((stage.count / previousCount) * 100)
        : 0
      return { ...stage, conversionRate }
    })

    return conversionRates
  },
})

export const getTimeToHire = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query('candidates')
      .filter(q => q.eq(q.field('status'), 'hired'))
      .collect()

    const timeToHireData = candidates.map(candidate => {
      const applicationDate = candidate._creationTime
      const hireDate = candidate.hiredAt || candidate.updatedAt || Date.now()
      const daysToHire = Math.ceil((hireDate - applicationDate) / (1000 * 60 * 60 * 24))

      return {
        candidateId: candidate._id,
        candidateName: candidate.name,
        daysToHire,
        jobTitle: candidate.position,
      }
    })

    // Calculate average time to hire
    const avgTimeToHire = timeToHireData.length > 0
      ? Math.round(timeToHireData.reduce((sum, item) => sum + item.daysToHire, 0) / timeToHireData.length)
      : 0

    return {
      avgTimeToHire,
      recentHires: timeToHireData.slice(-10), // Last 10 hires
    }
  },
})

export const getSourceEffectiveness = query({
  handler: async (ctx) => {
    const candidates = await ctx.db.query('candidates').collect()

    // Group by source and calculate metrics
    const sourceData = candidates.reduce((acc, candidate) => {
      const source = candidate.source || 'Unknown'
      if (!acc[source]) {
        acc[source] = {
          source,
          totalApplications: 0,
          hired: 0,
          interviewed: 0,
        }
      }

      acc[source].totalApplications++
      if (candidate.status === 'hired') acc[source].hired++
      if (['interview', 'offer', 'hired'].includes(candidate.status)) {
        acc[source].interviewed++
      }

      return acc
    }, {} as Record<string, any>)

    // Convert to array and calculate rates
    const sourceEffectiveness = Object.values(sourceData).map((source: any) => ({
      ...source,
      hireRate: source.totalApplications > 0
        ? Math.round((source.hired / source.totalApplications) * 100)
        : 0,
      interviewRate: source.totalApplications > 0
        ? Math.round((source.interviewed / source.totalApplications) * 100)
        : 0,
    })).sort((a, b) => b.totalApplications - a.totalApplications)

    return sourceEffectiveness
  },
})

export const getInterviewMetrics = query({
  handler: async (ctx) => {
    const interviews = await ctx.db.query('interviews').collect()

    // Interview feedback analysis
    const interviewsWithFeedback = interviews.filter(i => i.feedback && i.rating)
    const avgRating = interviewsWithFeedback.length > 0
      ? (interviewsWithFeedback.reduce((sum, i) => sum + (i.rating || 0), 0) / interviewsWithFeedback.length).toFixed(1)
      : '0.0'

    // Feedback distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: interviewsWithFeedback.filter(i => Math.round(i.rating || 0) === rating).length
    }))

    // Interview outcomes
    const outcomes = {
      completed: interviews.filter(i => i.status === 'completed').length,
      scheduled: interviews.filter(i => i.status === 'scheduled').length,
      cancelled: interviews.filter(i => i.status === 'cancelled').length,
    }

    return {
      totalInterviews: interviews.length,
      avgRating: parseFloat(avgRating),
      ratingDistribution,
      outcomes,
      feedbackRate: interviews.length > 0
        ? Math.round((interviewsWithFeedback.length / interviews.length) * 100)
        : 0
    }
  },
})