import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all candidates
export const list = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let candidates = await ctx.db.query("candidates").collect();

    if (args.status && args.status !== "all") {
      candidates = candidates.filter(c => c.status === args.status);
    }

    if (args.search) {
      const search = args.search.toLowerCase();
      candidates = candidates.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.position.toLowerCase().includes(search)
      );
    }

    return candidates;
  },
});

// Get single candidate with full details
export const get = query({
  args: { id: v.id("candidates") },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.id);
    if (!candidate) return null;

    // Get related data
    const [timeline, assessments, notes, interviews] = await Promise.all([
      ctx.db.query("timeline")
        .withIndex("by_candidate", q => q.eq("candidateId", args.id))
        .collect(),
      ctx.db.query("assessments")
        .withIndex("by_candidate", q => q.eq("candidateId", args.id))
        .collect(),
      ctx.db.query("notes")
        .withIndex("by_candidate", q => q.eq("candidateId", args.id))
        .collect(),
      ctx.db.query("interviews")
        .withIndex("by_candidate", q => q.eq("candidateId", args.id))
        .collect(),
    ]);

    return {
      ...candidate,
      timeline,
      assessments,
      notes,
      interviews,
    };
  },
});

// Create new candidate
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    location: v.string(),
    position: v.string(),
    experience: v.string(),
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const candidateId = await ctx.db.insert("candidates", {
      ...args,
      appliedDate: new Date().toISOString().split('T')[0],
      status: "applied",
      evaluation: {
        overall: 0,
        technical: 0,
        cultural: 0,
        communication: 0,
      },
    });

    // Add to timeline
    await ctx.db.insert("timeline", {
      candidateId,
      date: new Date().toISOString().split('T')[0],
      type: "applied",
      title: "Application Received",
      description: `Applied for ${args.position} position`,
      status: "completed",
    });

    return candidateId;
  },
});

// Update candidate status
export const updateStatus = mutation({
  args: {
    id: v.id("candidates"),
    status: v.union(
      v.literal("applied"),
      v.literal("screening"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
      v.literal("withdrawn")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });

    // Add to timeline
    await ctx.db.insert("timeline", {
      candidateId: args.id,
      date: new Date().toISOString().split('T')[0],
      type: args.status as any,
      title: `Status changed to ${args.status}`,
      description: `Candidate moved to ${args.status} stage`,
      status: "completed",
    });
  },
});

// Update candidate evaluation
export const updateEvaluation = mutation({
  args: {
    id: v.id("candidates"),
    evaluation: v.object({
      overall: v.number(),
      technical: v.number(),
      cultural: v.number(),
      communication: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { evaluation: args.evaluation });
  },
});

// Add note to candidate
export const addNote = mutation({
  args: {
    candidateId: v.id("candidates"),
    author: v.string(),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notes", {
      ...args,
      date: new Date().toISOString().split('T')[0],
    });
  },
});