import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    console.log("[users.getByEmail] Looking up:", args.email);
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    console.log("[users.getByEmail] Found:", user ? user._id : "null");
    if (!user) return null;
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
    console.log("[users.create] Creating user:", args.name, args.email, args.role);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      console.log("[users.create] User already exists:", existing._id);
      return existing._id;
    }

    const id = await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
    console.log("[users.create] User created:", id);

    // Schedule setup email for new clients
    if (args.role === "client") {
      console.log("[users.create] Scheduling setup email for:", args.email);
      await ctx.scheduler.runAfter(0, internal.authEmails.sendSetupEmail, {
        email: args.email,
        name: args.name,
      });
      console.log("[users.create] Setup email scheduled");
    }

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    console.log("[users.remove] Removing user:", args.id);
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
    console.log("[users.remove] User removed");
  },
});

export const listClients = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const clients = users
      .filter((u) => u.role === "client")
      .map(({ passwordHash: _, ...rest }) => rest);
    console.log("[users.listClients] Found", clients.length, "clients");
    return clients;
  },
});
