import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) return null;
    // Don't expose passwordHash to client
    const { passwordHash: _, ...rest } = user;
    return rest;
  },
});

export const get = query({
  args: { id: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) return existing._id;

    const id = await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });

    // Schedule setup email for new clients
    if (args.role === "client") {
      await ctx.scheduler.runAfter(0, internal.authEmails.sendSetupEmail, {
        email: args.email,
        name: args.name,
      });
    }

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .collect();
    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .collect();
    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const listClients = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.role === "client")
      .map(({ passwordHash: _, ...rest }) => rest);
  },
});
