import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all jobs
export const list = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let jobs = await ctx.db.query("jobs").collect();

    if (args.status && args.status !== "all") {
      jobs = jobs.filter(j => j.status === args.status);
    }

    if (args.search) {
      const search = args.search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(search) ||
        j.department.toLowerCase().includes(search)
      );
    }

    // Get applicant count for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicants = await ctx.db
          .query("applications")
          .withIndex("by_job", q => q.eq("jobId", job._id))
          .collect();
        return { ...job, applicantCount: applicants.length };
      })
    );

    return jobsWithCounts;
  },
});

// Get single job with applicants
export const get = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return null;

    // Get applicants for this job
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_job", q => q.eq("jobId", args.id))
      .collect();

    const applicants = await Promise.all(
      applications.map(async (app) => {
        const candidate = await ctx.db.get(app.candidateId);
        return { ...candidate, applicationId: app._id, applicationStatus: app.status };
      })
    );

    return {
      ...job,
      applicants,
    };
  },
});

// Create new job
export const create = mutation({
  args: {
    title: v.string(),
    department: v.string(),
    location: v.string(),
    type: v.union(v.literal("full-time"), v.literal("part-time"), v.literal("contract")),
    description: v.string(),
    requirements: v.array(v.string()),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("jobs", {
      ...args,
      postedDate: new Date().toISOString().split('T')[0],
      status: "active",
      urgency: "medium",
    });

    return jobId;
  },
});

// Update job status
export const updateStatus = mutation({
  args: {
    id: v.id("jobs"),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});