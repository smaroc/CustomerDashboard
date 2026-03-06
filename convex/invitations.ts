import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    email: v.string(),
    projectId: v.id("projects"),
    invitedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const invitationId = await ctx.db.insert("invitations", {
      email: args.email,
      projectId: args.projectId,
      invitedBy: args.invitedBy,
      status: "pending",
      token,
      createdAt: Date.now(),
    });
    return { invitationId, token };
  },
});

export const getByToken = query({
  args: { token: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

export const accept = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!invitation || invitation.status !== "pending") return null;

    await ctx.db.patch(invitation._id, { status: "accepted" });

    // Check if already a member
    const existing = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", invitation.projectId).eq("userId", args.userId)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("projectMembers", {
        projectId: invitation.projectId,
        userId: args.userId,
        joinedAt: Date.now(),
      });
    }

    return invitation.projectId;
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const listPending = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const invitations = await ctx.db
      .query("invitations")
      .order("desc")
      .collect();
    const pending = invitations.filter((i) => i.status === "pending");
    const withDetails = await Promise.all(
      pending.map(async (inv) => {
        const project = await ctx.db.get(inv.projectId);
        return { ...inv, project };
      })
    );
    return withDetails;
  },
});
