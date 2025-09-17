import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  candidates: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    linkedin: v.optional(v.string()),
    github: v.optional(v.string()),
    portfolio: v.optional(v.string()),
    position: v.string(),
    appliedDate: v.string(),
    status: v.union(
      v.literal("applied"),
      v.literal("screening"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
    experience: v.string(),
    currentCompany: v.optional(v.string()),
    education: v.optional(v.string()),
    skills: v.array(v.string()),
    resumeUrl: v.optional(v.id("_storage")),
    resumeFilename: v.optional(v.string()),
    coverLetter: v.optional(v.id("_storage")),
    coverLetterFilename: v.optional(v.string()),
    evaluation: v.object({
      overall: v.number(),
      technical: v.number(),
      cultural: v.number(),
      communication: v.number(),
    }),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_position", ["position"]),

  jobs: defineTable({
    title: v.string(),
    department: v.string(),
    location: v.string(),
    type: v.union(v.literal("full-time"), v.literal("part-time"), v.literal("contract")),
    description: v.string(),
    requirements: v.array(v.string()),
    postedDate: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("closed")),
    urgency: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_department", ["department"]),

  interviews: defineTable({
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    type: v.string(),
    date: v.string(),
    time: v.string(),
    duration: v.string(),
    interviewers: v.array(v.string()),
    location: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no-show")
    ),
    feedback: v.optional(v.string()),
    rating: v.optional(v.number()),
    technicalSkills: v.optional(v.number()),
    culturalFit: v.optional(v.number()),
    communication: v.optional(v.number()),
    problemSolving: v.optional(v.number()),
    experience: v.optional(v.number()),
    strengths: v.optional(v.string()),
    concerns: v.optional(v.string()),
    recommendation: v.optional(v.union(
      v.literal("strong_hire"),
      v.literal("hire"),
      v.literal("no_hire"),
      v.literal("strong_no_hire")
    )),
    wouldWorkWithAgain: v.optional(v.boolean()),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"]),

  timeline: defineTable({
    candidateId: v.id("candidates"),
    date: v.string(),
    type: v.union(
      v.literal("applied"),
      v.literal("screening"),
      v.literal("review"),
      v.literal("interview"),
      v.literal("assessment"),
      v.literal("offer"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("completed"), v.literal("scheduled"), v.literal("pending")),
    score: v.optional(v.number()),
    notes: v.optional(v.string()),
    interviewer: v.optional(v.string()),
    duration: v.optional(v.string()),
    feedback: v.optional(v.string()),
    rating: v.optional(v.number()),
  }).index("by_candidate", ["candidateId"]),

  assessments: defineTable({
    candidateId: v.id("candidates"),
    name: v.string(),
    score: v.number(),
    maxScore: v.number(),
    completedDate: v.string(),
    details: v.optional(v.string()),
  }).index("by_candidate", ["candidateId"]),

  notes: defineTable({
    candidateId: v.id("candidates"),
    author: v.string(),
    role: v.string(),
    date: v.string(),
    content: v.string(),
  }).index("by_candidate", ["candidateId"]),

  applications: defineTable({
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    appliedDate: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_job", ["jobId"]),

  emails: defineTable({
    candidateId: v.id("candidates"),
    jobId: v.optional(v.id("jobs")),
    from: v.string(),
    to: v.string(),
    cc: v.optional(v.array(v.string())),
    bcc: v.optional(v.array(v.string())),
    subject: v.string(),
    content: v.string(),
    template: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    sentAt: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
    readAt: v.optional(v.string()),
    threadId: v.optional(v.string()),
    replyTo: v.optional(v.id("emails")),
    attachments: v.optional(v.array(v.object({
      filename: v.string(),
      storageId: v.id("_storage"),
      contentType: v.string(),
      size: v.number()
    }))),
    createdAt: v.string(),
    sender: v.string(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_thread", ["threadId"])
    .index("by_status", ["status"])
    .index("by_job", ["jobId"]),

  emailTemplates: defineTable({
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("interview_invitation"),
      v.literal("rejection"),
      v.literal("offer"),
      v.literal("follow_up"),
      v.literal("assessment"),
      v.literal("custom")
    ),
    variables: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["isActive"]),

  // EEOC Compliance Tables
  eeoData: defineTable({
    candidateId: v.id("candidates"),
    // Voluntary self-identification data
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
    collectedDate: v.string(),
    // Store separately from main candidate data for compliance
    isVoluntary: v.boolean(),
  })
    .index("by_candidate", ["candidateId"]),

  // AI Decision Audit Trail
  aiDecisions: defineTable({
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
    inputData: v.string(), // JSON string of inputs
    outputData: v.string(), // JSON string of outputs
    score: v.optional(v.number()),
    reasoning: v.string(),
    humanReview: v.optional(v.object({
      reviewerId: v.string(),
      reviewDate: v.string(),
      agreedWithAI: v.boolean(),
      overrideReason: v.optional(v.string()),
    })),
    timestamp: v.string(),
    // For bias monitoring
    protected_attributes_masked: v.boolean(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_job", ["jobId"])
    .index("by_timestamp", ["timestamp"]),

  // Bias Audit Reports
  biasAudits: defineTable({
    auditId: v.string(),
    jobId: v.optional(v.id("jobs")),
    auditDate: v.string(),
    period: v.object({
      start: v.string(),
      end: v.string(),
    }),
    metrics: v.object({
      // Four-fifths rule compliance
      selectionRates: v.object({
        overall: v.number(),
        byGroup: v.array(v.object({
          group: v.string(),
          category: v.string(), // race, gender, etc.
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
      // Statistical significance
      statisticalTests: v.optional(v.array(v.object({
        test: v.string(),
        pValue: v.number(),
        significant: v.boolean(),
      }))),
    }),
    recommendations: v.array(v.string()),
    certifiedBy: v.optional(v.object({
      name: v.string(),
      title: v.string(),
      date: v.string(),
    })),
    status: v.union(
      v.literal("draft"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("archived")
    ),
  })
    .index("by_date", ["auditDate"])
    .index("by_job", ["jobId"])
    .index("by_status", ["status"]),

  // Compliance Settings
  complianceSettings: defineTable({
    settingKey: v.string(),
    value: v.any(),
    category: v.union(
      v.literal("eeo"),
      v.literal("ofccp"),
      v.literal("state"),
      v.literal("ai_governance")
    ),
    description: v.string(),
    lastUpdated: v.string(),
    updatedBy: v.string(),
  })
    .index("by_key", ["settingKey"])
    .index("by_category", ["category"]),
});