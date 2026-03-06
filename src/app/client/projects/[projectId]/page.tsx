"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  open: "bg-blue-50 text-blue-600 ring-blue-100",
  in_progress: "bg-amber-50 text-amber-600 ring-amber-100",
  resolved: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  closed: "bg-slate-50 text-slate-400 ring-slate-100",
};

const statusLabels: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Resolu",
  closed: "Ferme",
};

const priorityDots: Record<string, string> = {
  low: "bg-slate-300",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

export default function ClientProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const project = useQuery(api.projects.get, { id: projectId as Id<"projects"> });
  const tickets = useQuery(api.tickets.listByProject, { projectId: projectId as Id<"projects"> });

  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const addComment = useMutation(api.tickets.addComment);

  const ticketDetail = useQuery(
    api.tickets.get,
    selectedTicket ? { id: selectedTicket as Id<"tickets"> } : "skip"
  );

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <Link
        href="/client"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 font-medium"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M10 12l-4-4 4-4" />
        </svg>
        Mes projets
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-lg font-bold shrink-0">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>
          </div>
        </div>
        <Link
          href={`/client/tickets/new?project=${projectId}`}
          className="h-11 bg-indigo-600 text-white px-5 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] shadow-sm shadow-indigo-200/50 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Nouveau ticket
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Tickets</h3>
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
            {!tickets?.length ? (
              <div className="py-12 text-center">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <rect x="3" y="3" width="14" height="14" rx="2.5" />
                    <path d="M7 7.5h6M7 10.5h4" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">Aucun ticket</p>
                <Link
                  href={`/client/tickets/new?project=${projectId}`}
                  className="text-xs text-indigo-600 font-medium hover:underline mt-1 inline-block"
                >
                  Creer votre premier ticket
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket._id)}
                    className={`w-full text-left px-5 py-3.5 hover:bg-slate-50/80 cursor-pointer ${
                      selectedTicket === ticket._id ? "bg-indigo-50/40 border-l-2 border-l-indigo-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white ${priorityDots[ticket.priority]}`} />
                        <span className="text-sm font-medium text-slate-900">{ticket.title}</span>
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold ring-1 ${statusColors[ticket.status]}`}>
                        {statusLabels[ticket.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-[22px]">
                      {new Date(ticket.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {selectedTicket && ticketDetail ? (
            <div className="slide-in">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Detail du ticket</h3>
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 p-5">
                <h4 className="text-sm font-bold text-slate-900">{ticketDetail.title}</h4>
                <p className="text-xs text-slate-500 mt-2 whitespace-pre-wrap leading-relaxed">{ticketDetail.description}</p>

                {ticketDetail.files?.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-2">Pieces jointes</p>
                    <div className="space-y-1.5">
                      {ticketDetail.files.map(
                        (file: { _id: string; fileName: string; url: string | null }) => (
                          <a
                            key={file._id}
                            href={file.url ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 py-1 font-medium"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" />
                            </svg>
                            {file.fileName}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700 mb-3">Commentaires</p>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {ticketDetail.comments?.map(
                      (c: { _id: string; content: string; createdAt: number; user: { name: string } | null }) => (
                        <div key={c._id} className="bg-slate-50 rounded-xl px-3.5 py-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-700">{c.user?.name}</p>
                            <p className="text-[10px] text-slate-400">{formatTimeAgo(c.createdAt)}</p>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.content}</p>
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && comment.trim() && user) {
                          addComment({ ticketId: selectedTicket as Id<"tickets">, userId: user._id, content: comment });
                          setComment("");
                        }
                      }}
                      placeholder="Ecrire un commentaire..."
                      className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (comment.trim() && user) {
                          addComment({ ticketId: selectedTicket as Id<"tickets">, userId: user._id, content: comment });
                          setComment("");
                        }
                      }}
                      className="h-9 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 p-8 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">Selectionnez un ticket</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "A l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(timestamp).toLocaleDateString("fr-FR");
}
