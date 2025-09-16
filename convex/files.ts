import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for file uploads
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get file URL from storage ID
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Update candidate with uploaded resume
export const updateCandidateResume = mutation({
  args: {
    candidateId: v.id("candidates"),
    storageId: v.optional(v.id("_storage")),
    filename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      resumeUrl: args.storageId,
      resumeFilename: args.filename,
    });
    return { success: true };
  },
});

// Update candidate with uploaded cover letter
export const updateCandidateCoverLetter = mutation({
  args: {
    candidateId: v.id("candidates"),
    storageId: v.optional(v.id("_storage")),
    filename: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.candidateId, {
      coverLetter: args.storageId,
      coverLetterFilename: args.filename,
    });
    return { success: true };
  },
});

// Delete file from storage
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});