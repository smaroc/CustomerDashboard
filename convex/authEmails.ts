"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendSetupEmail = internalAction({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    console.log("[authEmails.sendSetupEmail] START for:", args.email, args.name);

    const token = crypto.randomUUID() + "-" + Date.now().toString(36);
    console.log("[authEmails.sendSetupEmail] Generated token:", token.slice(0, 20) + "...");

    await ctx.runMutation(internal.authHelpers.createPasswordToken, {
      email: args.email,
      token,
      type: "setup",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    console.log("[authEmails.sendSetupEmail] Token saved to DB");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM ?? "Dashboard <onboarding@resend.dev>";

    console.log("[authEmails.sendSetupEmail] ENV check:");
    console.log("  NEXT_PUBLIC_APP_URL:", appUrl);
    console.log("  RESEND_API_KEY:", apiKey ? `set (${apiKey.slice(0, 8)}...)` : "NOT SET");
    console.log("  EMAIL_FROM:", emailFrom);

    const link = `${appUrl}/set-password?token=${token}`;
    console.log("[authEmails.sendSetupEmail] Password link:", link);

    try {
      const resend = new Resend(apiKey);
      console.log("[authEmails.sendSetupEmail] Sending email to:", args.email);
      const result = await resend.emails.send({
        from: emailFrom,
        to: [args.email],
        subject: "Bienvenue - Configurez votre mot de passe",
        html: emailTemplate(
          `Bienvenue ${args.name}`,
          `Un compte a ete cree pour vous. Cliquez ci-dessous pour definir votre mot de passe et acceder a votre espace client.`,
          link,
          "Configurer mon mot de passe",
        ),
      });
      console.log("[authEmails.sendSetupEmail] Email sent! Result:", JSON.stringify(result));
    } catch (e) {
      console.error("[authEmails.sendSetupEmail] FAILED to send email:", e);
    }
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
