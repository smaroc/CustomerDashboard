import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    console.log("[authHelpers.getUserByEmail] Looking up:", args.email);
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    console.log("[authHelpers.getUserByEmail] Found:", user ? `${user._id} (${user.role}, hasPassword: ${!!user.passwordHash})` : "null");
    return user;
  },
});

export const getPasswordToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    console.log("[authHelpers.getPasswordToken] Looking up token:", args.token.slice(0, 20) + "...");
    const tokenDoc = await ctx.db
      .query("passwordTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    console.log("[authHelpers.getPasswordToken] Found:", tokenDoc ? `${tokenDoc._id} (email: ${tokenDoc.email}, used: ${tokenDoc.used}, type: ${tokenDoc.type})` : "null");
    return tokenDoc;
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
    console.log("[authHelpers.createPasswordToken] Creating token for:", args.email, "type:", args.type);

    // Invalidate old tokens for this email
    const existing = await ctx.db
      .query("passwordTokens")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    console.log("[authHelpers.createPasswordToken] Invalidating", existing.filter(t => !t.used).length, "old tokens");
    for (const t of existing) {
      if (!t.used) {
        await ctx.db.patch(t._id, { used: true });
      }
    }

    const id = await ctx.db.insert("passwordTokens", {
      email: args.email,
      token: args.token,
      type: args.type,
      expiresAt: args.expiresAt,
      used: false,
      createdAt: Date.now(),
    });
    console.log("[authHelpers.createPasswordToken] Token created:", id);
    return id;
  },
});

export const createAdmin = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[authHelpers.createAdmin] Creating/updating admin:", args.email);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      console.log("[authHelpers.createAdmin] Admin exists, updating password:", existing._id);
      await ctx.db.patch(existing._id, { passwordHash: args.passwordHash });
      return existing._id;
    }

    const id = await ctx.db.insert("users", {
      name: "Admin",
      email: args.email,
      role: "admin",
      passwordHash: args.passwordHash,
      createdAt: Date.now(),
    });
    console.log("[authHelpers.createAdmin] Admin created:", id);
    return id;
  },
});

export const updatePassword = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    tokenId: v.id("passwordTokens"),
  },
  handler: async (ctx, args) => {
    console.log("[authHelpers.updatePassword] Updating password for:", args.email);

    // Mark token as used
    await ctx.db.patch(args.tokenId, { used: true });
    console.log("[authHelpers.updatePassword] Token marked as used:", args.tokenId);

    // Update user password
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { passwordHash: args.passwordHash });
      console.log("[authHelpers.updatePassword] Password updated for user:", user._id);
    } else {
      console.error("[authHelpers.updatePassword] USER NOT FOUND:", args.email);
    }
  },
});
