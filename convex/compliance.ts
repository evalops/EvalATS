import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Store EEO data for a candidate
export const storeEEOData = mutation({
  args: {
    candidateId: v.id("candidates"),
    race: v.optional(v.union(
      v.literal("american_indian_alaska_native"),
      v.literal("asian"),
      v.literal("black_african_american"),
      v.literal("hispanic_latino"),
      v.literal("native_hawaiian_pacific_islander"),
      v.literal("white"),
      v.literal("two_or_more_races"),
      v.literal("decline_to_answer")
    )),
    gender: v.optional(v.union(
      v.literal("male"),
      v.literal("female"),
      v.literal("non_binary"),
      v.literal("decline_to_answer")
    )),
    veteranStatus: v.optional(v.union(
      v.literal("protected_veteran"),
      v.literal("not_protected_veteran"),
      v.literal("decline_to_answer")
    )),
    disabilityStatus: v.optional(v.union(
      v.literal("yes"),
      v.literal("no"),
      v.literal("decline_to_answer")
    )),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("eeoData")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .first()

    if (existing) {
      // Update existing record
      return await ctx.db.patch(existing._id, {
        ...args,
        collectedDate: new Date().toISOString(),
      })
    } else {
      // Create new record
      return await ctx.db.insert("eeoData", {
        ...args,
        collectedDate: new Date().toISOString(),
        isVoluntary: true,
      })
    }
  },
})

// Log an AI decision for audit trail
export const logAIDecision = mutation({
  args: {
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    decisionType: v.union(
      v.literal("resume_screening"),
      v.literal("skill_matching"),
      v.literal("ranking"),
      v.literal("recommendation")
    ),
    modelUsed: v.string(),
    modelVersion: v.string(),
    inputData: v.string(),
    outputData: v.string(),
    score: v.optional(v.number()),
    reasoning: v.string(),
    protected_attributes_masked: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiDecisions", {
      ...args,
      timestamp: new Date().toISOString(),
    })
  },
})

// Add human review to an AI decision
export const addHumanReview = mutation({
  args: {
    decisionId: v.id("aiDecisions"),
    reviewerId: v.string(),
    agreedWithAI: v.boolean(),
    overrideReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.decisionId, {
      humanReview: {
        reviewerId: args.reviewerId,
        reviewDate: new Date().toISOString(),
        agreedWithAI: args.agreedWithAI,
        overrideReason: args.overrideReason,
      }
    })
  },
})

// Get AI decisions for review
export const getAIDecisions = query({
  args: {
    jobId: v.optional(v.id("jobs")),
    candidateId: v.optional(v.id("candidates")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let decisions

    if (args.jobId !== undefined) {
      decisions = await ctx.db
        .query("aiDecisions")
        .withIndex("by_job", (q) => q.eq("jobId", args.jobId!))
        .order("desc")
        .take(args.limit || 100)
    } else if (args.candidateId !== undefined) {
      decisions = await ctx.db
        .query("aiDecisions")
        .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId!))
        .order("desc")
        .take(args.limit || 100)
    } else {
      decisions = await ctx.db
        .query("aiDecisions")
        .order("desc")
        .take(args.limit || 100)
    }

    // Get candidate names
    const decisionsWithNames = await Promise.all(
      decisions.map(async (decision) => {
        const candidate = await ctx.db.get(decision.candidateId)
        return {
          ...decision,
          candidateName: candidate?.name || "Unknown",
        }
      })
    )

    return decisionsWithNames
  },
})

// Calculate bias metrics for a job posting
export const calculateBiasMetrics = query({
  args: {
    jobId: v.id("jobs"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all applications for this job
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect()

    // Get EEO data for all candidates
    const candidateEEOData = await Promise.all(
      applications.map(async (app) => {
        const eeoData = await ctx.db
          .query("eeoData")
          .withIndex("by_candidate", (q) => q.eq("candidateId", app.candidateId))
          .first()

        return {
          candidateId: app.candidateId,
          status: app.status,
          race: eeoData?.race,
          gender: eeoData?.gender,
          veteranStatus: eeoData?.veteranStatus,
          disabilityStatus: eeoData?.disabilityStatus,
        }
      })
    )

    // Calculate selection rates by group
    const calculateRates = (category: string, field: keyof typeof candidateEEOData[0]) => {
      const groups = new Map<string, { selected: number, total: number }>()

      candidateEEOData.forEach(data => {
        const value = data[field] as string
        if (value && value !== 'decline_to_answer') {
          if (!groups.has(value)) {
            groups.set(value, { selected: 0, total: 0 })
          }
          const group = groups.get(value)!
          group.total++
          if (data.status === 'approved') {
            group.selected++
          }
        }
      })

      return Array.from(groups.entries()).map(([group, stats]) => ({
        group,
        category,
        rate: stats.total > 0 ? stats.selected / stats.total : 0,
        count: stats.selected,
        total: stats.total,
      }))
    }

    const raceRates = calculateRates('Race', 'race')
    const genderRates = calculateRates('Gender', 'gender')
    const veteranRates = calculateRates('Veteran Status', 'veteranStatus')
    const disabilityRates = calculateRates('Disability', 'disabilityStatus')

    const allRates = [...raceRates, ...genderRates, ...veteranRates, ...disabilityRates]

    // Calculate overall selection rate
    const totalApplicants = candidateEEOData.length
    const selectedApplicants = candidateEEOData.filter(d => d.status === 'approved').length
    const overallRate = totalApplicants > 0 ? selectedApplicants / totalApplicants : 0

    // Calculate impact ratios (Four-Fifths Rule)
    const calculateImpactRatios = (rates: typeof raceRates) => {
      const ratios: any[] = []

      if (rates.length > 1) {
        // Compare each group to the group with the highest selection rate
        const maxRate = Math.max(...rates.map(r => r.rate))
        const maxGroup = rates.find(r => r.rate === maxRate)

        rates.forEach(group => {
          if (group !== maxGroup && maxGroup) {
            const ratio = maxRate > 0 ? group.rate / maxRate : 0
            ratios.push({
              category: group.category,
              group1: group.group,
              group2: maxGroup.group,
              ratio,
              passes_four_fifths: ratio >= 0.8,
            })
          }
        })
      }

      return ratios
    }

    const impactRatios = [
      ...calculateImpactRatios(raceRates),
      ...calculateImpactRatios(genderRates),
      ...calculateImpactRatios(veteranRates),
      ...calculateImpactRatios(disabilityRates),
    ]

    return {
      jobId: args.jobId,
      period: {
        start: args.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: args.endDate || new Date().toISOString(),
      },
      metrics: {
        selectionRates: {
          overall: overallRate,
          byGroup: allRates,
        },
        impactRatios,
      },
      fourFifthsCompliant: impactRatios.every(r => r.passes_four_fifths),
      recommendations: generateRecommendations(impactRatios),
    }
  },
})

// Generate compliance recommendations based on metrics
function generateRecommendations(impactRatios: any[]): string[] {
  const recommendations = []

  const failingCategories = new Set(
    impactRatios
      .filter(r => !r.passes_four_fifths)
      .map(r => r.category)
  )

  if (failingCategories.size > 0) {
    recommendations.push(
      "Review job requirements to ensure they are essential and job-related",
      "Expand recruitment sources to reach more diverse candidate pools",
      "Implement structured interviews with standardized questions",
      "Consider using blind resume review for initial screening"
    )

    if (failingCategories.has('Gender')) {
      recommendations.push(
        "Review job descriptions for gendered language that may discourage applicants",
        "Ensure diverse interview panels"
      )
    }

    if (failingCategories.has('Race')) {
      recommendations.push(
        "Partner with diverse professional organizations and universities",
        "Review recruitment materials for inclusive imagery and language"
      )
    }

    if (failingCategories.has('Disability')) {
      recommendations.push(
        "Ensure job postings include accommodation statements",
        "Review physical requirements to ensure they are essential"
      )
    }
  }

  recommendations.push(
    "Continue monitoring selection rates across all protected categories",
    "Provide unconscious bias training to all hiring team members",
    "Document all hiring decisions and the rationale behind them"
  )

  return recommendations
}

// Create or update a bias audit report
export const createBiasAudit = mutation({
  args: {
    jobId: v.optional(v.id("jobs")),
    metrics: v.object({
      selectionRates: v.object({
        overall: v.number(),
        byGroup: v.array(v.object({
          group: v.string(),
          category: v.string(),
          rate: v.number(),
          count: v.number(),
          total: v.number(),
        })),
      }),
      impactRatios: v.array(v.object({
        category: v.string(),
        group1: v.string(),
        group2: v.string(),
        ratio: v.number(),
        passes_four_fifths: v.boolean(),
      })),
      statisticalTests: v.optional(v.array(v.object({
        test: v.string(),
        pValue: v.number(),
        significant: v.boolean(),
      }))),
    }),
    recommendations: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const auditId = `audit-${Date.now()}`

    return await ctx.db.insert("biasAudits", {
      auditId,
      jobId: args.jobId,
      auditDate: new Date().toISOString(),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      metrics: args.metrics,
      recommendations: args.recommendations,
      status: "draft",
    })
  },
})

// Get the latest bias audit
export const getLatestAudit = query({
  args: {
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, args) => {
    let audit

    if (args.jobId !== undefined) {
      audit = await ctx.db
        .query("biasAudits")
        .withIndex("by_job", (q) => q.eq("jobId", args.jobId!))
        .order("desc")
        .first()
    } else {
      audit = await ctx.db
        .query("biasAudits")
        .order("desc")
        .first()
    }

    if (audit && audit.jobId) {
      const job = await ctx.db.get(audit.jobId)
      return {
        ...audit,
        jobTitle: job?.title,
      }
    }

    return audit
  },
})

// Update compliance settings
export const updateComplianceSettings = mutation({
  args: {
    settingKey: v.string(),
    value: v.any(),
    category: v.union(
      v.literal("eeo"),
      v.literal("ofccp"),
      v.literal("state"),
      v.literal("ai_governance")
    ),
    description: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("complianceSettings")
      .withIndex("by_key", (q) => q.eq("settingKey", args.settingKey))
      .first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        value: args.value,
        lastUpdated: new Date().toISOString(),
        updatedBy: args.updatedBy,
      })
    } else {
      return await ctx.db.insert("complianceSettings", {
        ...args,
        lastUpdated: new Date().toISOString(),
      })
    }
  },
})

// Get compliance settings
export const getComplianceSettings = query({
  args: {
    category: v.optional(v.union(
      v.literal("eeo"),
      v.literal("ofccp"),
      v.literal("state"),
      v.literal("ai_governance")
    )),
  },
  handler: async (ctx, args) => {
    if (args.category !== undefined) {
      return await ctx.db
        .query("complianceSettings")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect()
    } else {
      return await ctx.db
        .query("complianceSettings")
        .collect()
    }
  },
})