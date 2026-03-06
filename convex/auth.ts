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

    const user = await ctx.runQuery(getUserByEmail, { email });
    if (!user) return { success: false, error: "Email ou mot de passe incorrect." };
    if (!user.passwordHash) return { success: false, error: "Mot de passe non configure. Verifiez vos emails." };

    const valid = await bcrypt.compare(args.password, user.passwordHash);
    if (!valid) return { success: false, error: "Email ou mot de passe incorrect." };

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

    if (args.password.length < 8) {
      return { success: false, error: "Le mot de passe doit contenir au moins 8 caracteres." };
    }

    const hash = await bcrypt.hash(args.password, 10);

    const userId = await ctx.runMutation(createAdmin, {
      email,
      passwordHash: hash,
    });

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
    const user = await ctx.runQuery(getUserByEmail, { email: args.email.toLowerCase().trim() });
    if (!user) return { exists: false, hasPassword: false };
    return { exists: true, hasPassword: !!user.passwordHash };
  },
});

// Set password (initial setup or reset via token)
export const setPassword = action({
  args: { token: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; user?: { _id: Id<"users">; name: string; email: string; role: string } | null }> => {
    const tokenDoc = await ctx.runQuery(getPasswordToken, { token: args.token });
    if (!tokenDoc) return { success: false, error: "Lien invalide ou expire." };
    if (tokenDoc.used) return { success: false, error: "Ce lien a deja ete utilise." };
    if (tokenDoc.expiresAt < Date.now()) return { success: false, error: "Ce lien a expire." };

    if (args.password.length < 8) {
      return { success: false, error: "Le mot de passe doit contenir au moins 8 caracteres." };
    }

    const hash = await bcrypt.hash(args.password, 10);

    await ctx.runMutation(updatePassword, {
      email: tokenDoc.email,
      passwordHash: hash,
      tokenId: tokenDoc._id,
    });

    const user = await ctx.runQuery(getUserByEmail, { email: tokenDoc.email });

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
    const user = await ctx.runQuery(getUserByEmail, { email });

    if (!user) return { success: true };

    const token = crypto.randomUUID() + "-" + Date.now().toString(36);

    await ctx.runMutation(createPasswordToken, {
      email,
      token,
      type: "reset",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Dashboard <onboarding@resend.dev>",
        to: [email],
        subject: "Reinitialisation de votre mot de passe",
        html: emailTemplate(
          "Reinitialisation du mot de passe",
          `Cliquez sur le bouton ci-dessous pour reinitialiser votre mot de passe.`,
          `${appUrl}/reset-password?token=${token}`,
          "Reinitialiser le mot de passe",
        ),
      });
    } catch {
      console.warn("Failed to send reset email");
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
