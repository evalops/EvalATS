import { v } from "convex/values"
import { query, mutation } from "./_generated/server"

// Get current user profile from teamMembers table
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    // Look up user in teamMembers table
    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first()

    if (!teamMember) {
      // If user doesn't exist in teamMembers yet, return Clerk data
      return {
        _id: identity.subject,
        userId: identity.subject,
        name: identity.name || identity.email?.split('@')[0] || "User",
        email: identity.email || "",
        avatar: identity.picture || "",
        role: "admin", // Default role
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: [],
      }
    }

    return teamMember
  },
})

// Create or update team member profile
export const createOrUpdateTeamMember = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("hiring_manager"),
      v.literal("recruiter"),
      v.literal("interviewer"),
      v.literal("coordinator"),
      v.literal("viewer")
    )),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()

    if (existing) {
      // Update existing team member
      return await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        avatar: args.avatar,
        role: args.role || existing.role,
        department: args.department,
      })
    } else {
      // Create new team member
      return await ctx.db.insert("teamMembers", {
        userId: args.userId,
        name: args.name,
        email: args.email,
        avatar: args.avatar || "",
        role: args.role || "admin",
        department: args.department,
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: ["read", "write"], // Default permissions
      })
    }
  },
})

// Update current user's profile
export const updateCurrentUserProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const teamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first()

    if (!teamMember) {
      throw new Error("Team member not found")
    }

    return await ctx.db.patch(teamMember._id, {
      name: args.name,
      email: args.email,
      avatar: args.avatar,
      department: args.department,
    })
  },
})