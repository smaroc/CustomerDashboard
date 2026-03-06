import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("client")),
    passwordHash: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  passwordTokens: defineTable({
    email: v.string(),
    token: v.string(),
    type: v.union(v.literal("setup"), v.literal("reset")),
    expiresAt: v.number(),
    used: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  projects: defineTable({
    name: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    adminId: v.id("users"),
    createdAt: v.number(),
  }).index("by_admin", ["adminId"]),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"]),

  tickets: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    projectId: v.id("projects"),
    createdBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_created_by", ["createdBy"])
    .index("by_status", ["status"]),

  ticketFiles: defineTable({
    ticketId: v.id("tickets"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
  }).index("by_ticket", ["ticketId"]),

  ticketComments: defineTable({
    ticketId: v.id("tickets"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_ticket", ["ticketId"]),

  invitations: defineTable({
    email: v.string(),
    projectId: v.id("projects"),
    invitedBy: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired")
    ),
    token: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_project", ["projectId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("new_ticket"),
      v.literal("ticket_update"),
      v.literal("new_comment"),
      v.literal("invitation")
    ),
    message: v.string(),
    projectId: v.optional(v.id("projects")),
    ticketId: v.optional(v.id("tickets")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),
});
