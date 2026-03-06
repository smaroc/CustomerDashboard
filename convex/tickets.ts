import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
    const withCreators = await Promise.all(
      tickets.map(async (ticket) => {
        const creator = await ctx.db.get(ticket.createdBy);
        return { ...ticket, creator };
      })
    );
    return withCreators;
  },
});

export const listAll = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const tickets = await ctx.db.query("tickets").order("desc").take(50);
    const withDetails = await Promise.all(
      tickets.map(async (ticket) => {
        const creator = await ctx.db.get(ticket.createdBy);
        const project = await ctx.db.get(ticket.projectId);
        return { ...ticket, creator, project };
      })
    );
    return withDetails;
  },
});

export const get = query({
  args: { id: v.id("tickets") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.id);
    if (!ticket) return null;
    const creator = await ctx.db.get(ticket.createdBy);
    const project = await ctx.db.get(ticket.projectId);
    const files = await ctx.db
      .query("ticketFiles")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.id))
      .collect();
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await ctx.storage.getUrl(file.storageId);
        return { ...file, url };
      })
    );
    const comments = await ctx.db
      .query("ticketComments")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.id))
      .collect();
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return { ...comment, user };
      })
    );
    return { ...ticket, creator, project, files: filesWithUrls, comments: commentsWithUsers };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    fileIds: v.optional(v.array(v.id("_storage"))),
    fileNames: v.optional(v.array(v.string())),
    fileTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ticketId = await ctx.db.insert("tickets", {
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: "open",
      projectId: args.projectId,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    if (args.fileIds && args.fileNames && args.fileTypes) {
      for (let i = 0; i < args.fileIds.length; i++) {
        await ctx.db.insert("ticketFiles", {
          ticketId,
          storageId: args.fileIds[i],
          fileName: args.fileNames[i],
          fileType: args.fileTypes[i],
          uploadedBy: args.createdBy,
          uploadedAt: now,
        });
      }
    }

    // Create notification for admin
    const project = await ctx.db.get(args.projectId);
    if (project) {
      await ctx.db.insert("notifications", {
        userId: project.adminId,
        type: "new_ticket",
        message: `Nouveau ticket : "${args.title}"`,
        projectId: args.projectId,
        ticketId,
        read: false,
        createdAt: now,
      });

      // Send email to admin
      const admin = await ctx.db.get(project.adminId);
      const creator = await ctx.db.get(args.createdBy);
      if (admin && creator) {
        await ctx.scheduler.runAfter(0, internal.authEmails.sendNewTicketEmail, {
          adminEmail: admin.email,
          clientName: creator.name,
          ticketTitle: args.title,
          projectName: project.name,
          projectId: args.projectId,
        });
      }
    }

    return ticketId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.id);
    if (!ticket) return;

    const oldStatus = ticket.status;
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    if (oldStatus !== args.status) {
      const statusLabels: Record<string, string> = {
        open: "Ouvert",
        in_progress: "En cours",
        resolved: "Resolu",
        closed: "Ferme",
      };

      // Notify the ticket creator (client)
      await ctx.db.insert("notifications", {
        userId: ticket.createdBy,
        type: "ticket_update",
        message: `Ticket "${ticket.title}" passe en "${statusLabels[args.status]}"`,
        projectId: ticket.projectId,
        ticketId: args.id,
        read: false,
        createdAt: Date.now(),
      });
    }
  },
});

export const addComment = mutation({
  args: {
    ticketId: v.id("tickets"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("ticketComments", {
      ticketId: args.ticketId,
      userId: args.userId,
      content: args.content,
      createdAt: Date.now(),
    });

    const ticket = await ctx.db.get(args.ticketId);
    if (ticket) {
      const user = await ctx.db.get(args.userId);
      // Notify the other party
      const notifyUserId =
        args.userId === ticket.createdBy
          ? (await ctx.db.get(ticket.projectId))?.adminId
          : ticket.createdBy;

      if (notifyUserId) {
        await ctx.db.insert("notifications", {
          userId: notifyUserId,
          type: "new_comment",
          message: `${user?.name ?? "Quelqu'un"} a commente sur "${ticket.title}"`,
          projectId: ticket.projectId,
          ticketId: args.ticketId,
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    return commentId;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
