import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getPasswordToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("passwordTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

export const createPasswordToken = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    type: v.union(v.literal("setup"), v.literal("reset")),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Invalidate old tokens for this email
    const existing = await ctx.db
      .query("passwordTokens")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    for (const t of existing) {
      if (!t.used) {
        await ctx.db.patch(t._id, { used: true });
      }
    }

    return await ctx.db.insert("passwordTokens", {
      email: args.email,
      token: args.token,
      type: args.type,
      expiresAt: args.expiresAt,
      used: false,
      createdAt: Date.now(),
    });
  },
});

export const createAdmin = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { passwordHash: args.passwordHash });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      name: "Admin",
      email: args.email,
      role: "admin",
      passwordHash: args.passwordHash,
      createdAt: Date.now(),
    });
  },
});

export const updatePassword = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    tokenId: v.id("passwordTokens"),
  },
  handler: async (ctx, args) => {
    // Mark token as used
    await ctx.db.patch(args.tokenId, { used: true });

    // Update user password
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { passwordHash: args.passwordHash });
    }
  },
});
