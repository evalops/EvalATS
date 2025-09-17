import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendEmail = mutation({
  args: {
    candidateId: v.id("candidates"),
    jobId: v.optional(v.id("jobs")),
    to: v.string(),
    cc: v.optional(v.array(v.string())),
    bcc: v.optional(v.array(v.string())),
    subject: v.string(),
    content: v.string(),
    template: v.optional(v.string()),
    threadId: v.optional(v.string()),
    replyTo: v.optional(v.id("emails")),
    attachments: v.optional(v.array(v.object({
      filename: v.string(),
      storageId: v.id("_storage"),
      contentType: v.string(),
      size: v.number()
    }))),
    sender: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const threadId = args.threadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const emailId = await ctx.db.insert("emails", {
      candidateId: args.candidateId,
      jobId: args.jobId,
      from: "noreply@evalats.com", // This would be configured in settings
      to: args.to,
      cc: args.cc,
      bcc: args.bcc,
      subject: args.subject,
      content: args.content,
      template: args.template,
      status: "sent", // In real implementation, this would be "draft" initially
      sentAt: now,
      threadId: threadId,
      replyTo: args.replyTo,
      attachments: args.attachments,
      createdAt: now,
      sender: args.sender,
    });

    // In a real implementation, you'd integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll just mark it as sent

    return emailId;
  },
});

export const getEmailsByCandidate = query({
  args: {
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("emails")
      .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
      .order("desc")
      .collect();

    return emails;
  },
});

export const getEmailThread = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("emails")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();

    return emails;
  },
});

export const createEmailTemplate = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const templateId = await ctx.db.insert("emailTemplates", {
      name: args.name,
      subject: args.subject,
      content: args.content,
      type: args.type,
      variables: args.variables,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

export const getEmailTemplates = query({
  args: {
    type: v.optional(v.union(
      v.literal("interview_invitation"),
      v.literal("rejection"),
      v.literal("offer"),
      v.literal("follow_up"),
      v.literal("assessment"),
      v.literal("custom")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("emailTemplates")
      .withIndex("by_active", (q) => q.eq("isActive", true));

    if (args.type) {
      const templates = await ctx.db
        .query("emailTemplates")
        .withIndex("by_type", (q) => q.eq("type", args.type))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      return templates;
    }

    return await query.collect();
  },
});

export const updateEmailTemplate = mutation({
  args: {
    id: v.id("emailTemplates"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    return id;
  },
});

export const markEmailAsRead = mutation({
  args: {
    id: v.id("emails"),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    await ctx.db.patch(args.id, {
      readAt: now,
    });

    return args.id;
  },
});

// Utility function to process template variables
export const processEmailTemplate = mutation({
  args: {
    templateId: v.id("emailTemplates"),
    variables: v.object({}), // This would be a key-value object in real use
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // In a real implementation, you'd process the template variables
    // For now, we'll just return the template as-is
    let processedSubject = template.subject;
    let processedContent = template.content;

    // Simple variable replacement (in real app, use a proper template engine)
    // This is just a placeholder for the concept

    return {
      subject: processedSubject,
      content: processedContent,
      template: template.name,
    };
  },
});