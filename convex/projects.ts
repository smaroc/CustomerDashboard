import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").order("desc").collect();
    const withClients = await Promise.all(
      projects.map(async (project) => {
        const members = await ctx.db
          .query("projectMembers")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        const clientMember = members.length > 0 ? await ctx.db.get(members[0].userId) : null;
        return { ...project, client: clientMember };
      })
    );
    return withClients;
  },
});

export const listByMember = query({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const projects = await Promise.all(
      memberships.map((m) => ctx.db.get(m.projectId))
    );
    return projects.filter(Boolean);
  },
});

export const get = query({
  args: { id: v.id("projects") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    adminId: v.id("users"),
    clientId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      status: "active",
      adminId: args.adminId,
      createdAt: Date.now(),
    });

    // Add client as project member
    await ctx.db.insert("projectMembers", {
      projectId,
      userId: args.clientId,
      joinedAt: Date.now(),
    });

    // Notify the client
    await ctx.db.insert("notifications", {
      userId: args.clientId,
      type: "invitation",
      message: `Vous avez ete ajoute au projet "${args.name}"`,
      projectId,
      read: false,
      createdAt: Date.now(),
    });

    return projectId;
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    // Delete all project members
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }
    // Delete all tickets and their files/comments
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const ticket of tickets) {
      const files = await ctx.db
        .query("ticketFiles")
        .withIndex("by_ticket", (q) => q.eq("ticketId", ticket._id))
        .collect();
      for (const f of files) {
        await ctx.storage.delete(f.storageId);
        await ctx.db.delete(f._id);
      }
      const comments = await ctx.db
        .query("ticketComments")
        .withIndex("by_ticket", (q) => q.eq("ticketId", ticket._id))
        .collect();
      for (const c of comments) {
        await ctx.db.delete(c._id);
      }
      await ctx.db.delete(ticket._id);
    }
    // Delete invitations
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const inv of invitations) {
      await ctx.db.delete(inv._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("paused"), v.literal("completed"))
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const getMembers = query({
  args: { projectId: v.id("projects") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const users = await Promise.all(
      memberships.map((m) => ctx.db.get(m.userId))
    );
    return users.filter(Boolean);
  },
});

export const getStats = query({
  args: { projectId: v.id("projects") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return {
      totalTickets: tickets.length,
      openTickets: tickets.filter((t) => t.status === "open").length,
      inProgressTickets: tickets.filter((t) => t.status === "in_progress")
        .length,
      resolvedTickets: tickets.filter((t) => t.status === "resolved").length,
      memberCount: members.length,
    };
  },
});
