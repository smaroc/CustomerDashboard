"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendInvitationEmail = action({
  args: {
    to: v.string(),
    projectName: v.string(),
    inviterName: v.string(),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Projects <onboarding@resend.dev>",
      to: [args.to],
      subject: `You've been invited to ${args.projectName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #0a0a0a; font-size: 20px; font-weight: 600;">Project Invitation</h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            ${args.inviterName} has invited you to collaborate on <strong>${args.projectName}</strong>.
          </p>
          <a href="${appUrl}/login?invite=${args.token}"
             style="display: inline-block; background: #0a0a0a; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 16px;">
            Accept Invitation
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            If you didn't expect this invitation, you can ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },
});

export const sendTicketNotification = action({
  args: {
    to: v.string(),
    ticketTitle: v.string(),
    projectName: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Projects <onboarding@resend.dev>",
      to: [args.to],
      subject: `${args.projectName}: ${args.ticketTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #0a0a0a; font-size: 20px; font-weight: 600;">${args.projectName}</h2>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">${args.message}</p>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            Log in to your dashboard to view details.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },
});
