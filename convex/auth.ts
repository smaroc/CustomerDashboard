"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { makeFunctionReference } from "convex/server";
import type { Id } from "./_generated/dataModel";

// Internal function references to avoid circular type imports
const getUserByEmail = makeFunctionReference<
  "query",
  { email: string },
  { _id: Id<"users">; name: string; email: string; role: string; passwordHash?: string } | null
>("authHelpers:getUserByEmail");

const getPasswordToken = makeFunctionReference<
  "query",
  { token: string },
  { _id: Id<"passwordTokens">; email: string; token: string; type: string; expiresAt: number; used: boolean } | null
>("authHelpers:getPasswordToken");

const createAdmin = makeFunctionReference<
  "mutation",
  { email: string; passwordHash: string },
  Id<"users">
>("authHelpers:createAdmin");

const createPasswordToken = makeFunctionReference<
  "mutation",
  { email: string; token: string; type: "setup" | "reset"; expiresAt: number },
  Id<"passwordTokens">
>("authHelpers:createPasswordToken");

const updatePassword = makeFunctionReference<
  "mutation",
  { email: string; passwordHash: string; tokenId: Id<"passwordTokens"> },
  void
>("authHelpers:updatePassword");

// Login with email + password
export const login = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; user?: { _id: Id<"users">; name: string; email: string; role: string } }> => {
    const email = args.email.toLowerCase().trim();
    console.log("[auth.login] Attempting login for:", email);

    const user = await ctx.runQuery(getUserByEmail, { email });
    if (!user) {
      console.log("[auth.login] User not found:", email);
      return { success: false, error: "Email ou mot de passe incorrect." };
    }
    console.log("[auth.login] User found:", user._id, "role:", user.role, "hasPassword:", !!user.passwordHash);

    if (!user.passwordHash) {
      console.log("[auth.login] No password set for:", email);
      return { success: false, error: "Mot de passe non configure. Verifiez vos emails." };
    }

    const valid = await bcrypt.compare(args.password, user.passwordHash);
    console.log("[auth.login] Password valid:", valid);
    if (!valid) return { success: false, error: "Email ou mot de passe incorrect." };

    console.log("[auth.login] Login successful for:", email);
    return {
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    };
  },
});

// Admin first-time setup
export const setupAdmin = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; user?: { _id: Id<"users">; name: string; email: string; role: string } }> => {
    const email = args.email.toLowerCase().trim();
    console.log("[auth.setupAdmin] Setting up admin:", email);

    if (args.password.length < 8) {
      return { success: false, error: "Le mot de passe doit contenir au moins 8 caracteres." };
    }

    const hash = await bcrypt.hash(args.password, 10);
    console.log("[auth.setupAdmin] Password hashed");

    const userId = await ctx.runMutation(createAdmin, {
      email,
      passwordHash: hash,
    });
    console.log("[auth.setupAdmin] Admin created/updated:", userId);

    return {
      success: true,
      user: { _id: userId, name: "Admin", email, role: "admin" },
    };
  },
});

// Check if admin account exists and has a password
export const checkAdminStatus = action({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ exists: boolean; hasPassword: boolean }> => {
    const email = args.email.toLowerCase().trim();
    console.log("[auth.checkAdminStatus] Checking:", email);
    const user = await ctx.runQuery(getUserByEmail, { email });
    const result = user
      ? { exists: true, hasPassword: !!user.passwordHash }
      : { exists: false, hasPassword: false };
    console.log("[auth.checkAdminStatus] Result:", JSON.stringify(result));
    return result;
  },
});

// Set password (initial setup or reset via token)
export const setPassword = action({
  args: { token: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; user?: { _id: Id<"users">; name: string; email: string; role: string } | null }> => {
    console.log("[auth.setPassword] Token:", args.token.slice(0, 20) + "...");

    const tokenDoc = await ctx.runQuery(getPasswordToken, { token: args.token });
    if (!tokenDoc) {
      console.log("[auth.setPassword] Token not found");
      return { success: false, error: "Lien invalide ou expire." };
    }
    console.log("[auth.setPassword] Token found for:", tokenDoc.email, "type:", tokenDoc.type, "used:", tokenDoc.used, "expires:", new Date(tokenDoc.expiresAt).toISOString());

    if (tokenDoc.used) return { success: false, error: "Ce lien a deja ete utilise." };
    if (tokenDoc.expiresAt < Date.now()) return { success: false, error: "Ce lien a expire." };

    if (args.password.length < 8) {
      return { success: false, error: "Le mot de passe doit contenir au moins 8 caracteres." };
    }

    const hash = await bcrypt.hash(args.password, 10);
    console.log("[auth.setPassword] Password hashed, updating for:", tokenDoc.email);

    await ctx.runMutation(updatePassword, {
      email: tokenDoc.email,
      passwordHash: hash,
      tokenId: tokenDoc._id,
    });
    console.log("[auth.setPassword] Password updated");

    const user = await ctx.runQuery(getUserByEmail, { email: tokenDoc.email });
    console.log("[auth.setPassword] User after update:", user ? user._id : "null");

    return {
      success: true,
      user: user ? { _id: user._id, name: user.name, email: user.email, role: user.role } : null,
    };
  },
});

// Request password reset
export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const email = args.email.toLowerCase().trim();
    console.log("[auth.requestPasswordReset] Request for:", email);

    const user = await ctx.runQuery(getUserByEmail, { email });
    if (!user) {
      console.log("[auth.requestPasswordReset] User not found, returning success anyway");
      return { success: true };
    }

    const token = crypto.randomUUID() + "-" + Date.now().toString(36);
    console.log("[auth.requestPasswordReset] Token created:", token.slice(0, 20) + "...");

    await ctx.runMutation(createPasswordToken, {
      email,
      token,
      type: "reset",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM ?? "Dashboard <onboarding@resend.dev>";

    console.log("[auth.requestPasswordReset] ENV check:");
    console.log("  NEXT_PUBLIC_APP_URL:", appUrl);
    console.log("  RESEND_API_KEY:", apiKey ? `set (${apiKey.slice(0, 8)}...)` : "NOT SET");
    console.log("  EMAIL_FROM:", emailFrom);

    try {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: emailFrom,
        to: [email],
        subject: "Reinitialisation de votre mot de passe",
        html: emailTemplate(
          "Reinitialisation du mot de passe",
          `Cliquez sur le bouton ci-dessous pour reinitialiser votre mot de passe.`,
          `${appUrl}/reset-password?token=${token}`,
          "Reinitialiser le mot de passe",
        ),
      });
      console.log("[auth.requestPasswordReset] Email sent! Result:", JSON.stringify(result));
    } catch (e) {
      console.error("[auth.requestPasswordReset] FAILED to send email:", e);
    }

    return { success: true };
  },
});

function emailTemplate(title: string, body: string, link: string, cta: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #0d9488; width: 40px; height: 40px; border-radius: 12px; margin-bottom: 24px;"></div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">${title}</h2>
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">${body}</p>
      <a href="${link}" style="display: inline-block; background: #0d9488; color: #fff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 600;">
        ${cta}
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; line-height: 1.5;">
        Si vous n'avez pas demande cet email, ignorez-le simplement.
      </p>
    </div>
  `;
}
