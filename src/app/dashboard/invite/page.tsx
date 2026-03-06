"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { Id } from "../../../../convex/_generated/dataModel";

export default function InvitePage() {
  const { user } = useAuth();
  const projects = useQuery(api.projects.list);
  const pendingInvitations = useQuery(api.invitations.listPending);
  const createInvitation = useMutation(api.invitations.create);
  const sendInvitationEmail = useAction(api.sendEmail.sendInvitationEmail);

  const [email, setEmail] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) return;
    setSending(true);
    setSuccess(false);

    try {
      const { token } = await createInvitation({
        email,
        projectId: selectedProject as Id<"projects">,
        invitedBy: user._id,
      });

      const project = projects?.find((p) => p._id === selectedProject);

      try {
        await sendInvitationEmail({
          to: email,
          projectName: project?.name ?? "Project",
          inviterName: user.name,
          token,
        });
      } catch {
        // Email sending may fail if Resend isn't configured
        console.warn("Email sending failed — invitation still created");
      }

      setEmail("");
      setSelectedProject("");
      setSuccess(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-neutral-900 mb-1">
        Invite Client
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        Send an invitation to a client to join a project
      </p>

      <form
        onSubmit={handleInvite}
        className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Client Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            placeholder="client@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            required
            className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          >
            <option value="">Select a project</option>
            {projects?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-md">
            Invitation sent successfully
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="bg-neutral-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {sending ? "Sending..." : "Send Invitation"}
        </button>
      </form>

      {/* Pending Invitations */}
      {(pendingInvitations?.length ?? 0) > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-neutral-900 mb-3">
            Pending Invitations
          </h3>
          <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
            {pendingInvitations?.map((inv) => (
              <div
                key={inv._id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-neutral-900">{inv.email}</p>
                  <p className="text-xs text-neutral-500">
                    {inv.project?.name} &middot;{" "}
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                  pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
