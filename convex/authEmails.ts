"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendSetupEmail = internalAction({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const token = crypto.randomUUID() + "-" + Date.now().toString(36);

    await ctx.runMutation(internal.authHelpers.createPasswordToken, {
      email: args.email,
      token,
      type: "setup",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Dashboard <onboarding@resend.dev>",
        to: [args.email],
        subject: "Bienvenue - Configurez votre mot de passe",
        html: emailTemplate(
          `Bienvenue ${args.name}`,
          `Un compte a ete cree pour vous. Cliquez ci-dessous pour definir votre mot de passe et acceder a votre espace client.`,
          `${appUrl}/set-password?token=${token}`,
          "Configurer mon mot de passe",
        ),
      });
    } catch (e) {
      console.warn("Failed to send setup email:", e);
    }
  },
});

function emailTemplate(title: string, body: string, link: string, cta: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #6366f1; width: 40px; height: 40px; border-radius: 12px; margin-bottom: 24px;"></div>
      <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">${title}</h2>
      <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">${body}</p>
      <a href="${link}" style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: 600;">
        ${cta}
      </a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; line-height: 1.5;">
        Si vous n'avez pas demande cet email, ignorez-le simplement.
      </p>
    </div>
  `;
}
