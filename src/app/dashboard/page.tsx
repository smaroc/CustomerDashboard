"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const statusColors: Record<string, string> = {
  open: "bg-blue-50 text-blue-600 ring-blue-100",
  in_progress: "bg-amber-50 text-amber-600 ring-amber-100",
  resolved: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  closed: "bg-slate-50 text-slate-400 ring-slate-100",
};

const priorityDots: Record<string, string> = {
  low: "bg-slate-300",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const projects = useQuery(api.projects.list);
  const tickets = useQuery(api.tickets.listAll);

  const stats = [
    {
      label: "Projets",
      value: projects?.length ?? 0,
      color: "from-teal-500 to-teal-600",
      iconBg: "bg-teal-100",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0d9488" strokeWidth="1.5">
          <path d="M3 6A1.5 1.5 0 014.5 4.5H8l1.5 2h6A1.5 1.5 0 0117 8v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15V6z" />
        </svg>
      ),
    },
    {
      label: "Tickets ouverts",
      value: tickets?.filter((t) => t.status === "open").length ?? 0,
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3b82f6" strokeWidth="1.5">
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 6.5v4l2.5 2.5" />
        </svg>
      ),
    },
    {
      label: "En cours",
      value: tickets?.filter((t) => t.status === "in_progress").length ?? 0,
      color: "from-amber-500 to-amber-600",
      iconBg: "bg-amber-100",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f59e0b" strokeWidth="1.5">
          <path d="M10 2.5v5l3 3" />
          <circle cx="10" cy="10" r="7.5" />
        </svg>
      ),
    },
    {
      label: "Resolus",
      value: tickets?.filter((t) => t.status === "resolved").length ?? 0,
      color: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-100",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 10l3 3 5-6" />
          <circle cx="10" cy="10" r="7.5" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header — Law of Pragnanz: clean, simple greeting */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900">
          Bonjour, {user?.name?.split(" ")[0]}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Voici un resume de votre activite
        </p>
      </div>

      {/* Stats — Miller's Law: 4 items, chunked + Von Restorff: color-coded icons */}
      <div className="grid grid-cols-4 gap-4 mb-8 stagger">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm shadow-slate-100/50 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Projects — Law of Proximity: grouped with clear section headers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Projets recents</h3>
          <Link
            href="/dashboard/projects"
            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          >
            Voir tout
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
          {!projects?.length ? (
            <EmptyState
              message="Aucun projet"
              sub="Creez votre premier projet pour commencer"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <path d="M3 7A1.5 1.5 0 014.5 5.5H9l2 2.5h8.5A1.5 1.5 0 0121 9.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5V7z" />
                </svg>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 stagger">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project._id}
                  href={`/dashboard/projects/${project._id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 text-sm font-bold shrink-0">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-600">
                        {project.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {project.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold ring-1 ${
                      project.status === "active"
                        ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                        : project.status === "paused"
                          ? "bg-amber-50 text-amber-600 ring-amber-100"
                          : "bg-slate-50 text-slate-400 ring-slate-100"
                    }`}
                  >
                    {project.status === "active" ? "Actif" : project.status === "paused" ? "En pause" : "Termine"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Tickets */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Tickets recents</h3>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
          {!tickets?.length ? (
            <EmptyState
              message="Aucun ticket"
              sub="Les tickets de vos clients apparaitront ici"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M9 9h6M9 13h4" />
                </svg>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100 stagger">
              {tickets.slice(0, 8).map((ticket) => (
                <Link
                  key={ticket._id}
                  href={`/dashboard/projects/${ticket.projectId}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white ${priorityDots[ticket.priority]}`}
                    />
                    <div>
                      <p className="text-sm text-slate-900 group-hover:text-teal-600 font-medium">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ticket.project?.name} &middot; {ticket.creator?.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold ring-1 ${statusColors[ticket.status]}`}
                  >
                    {ticket.status === "in_progress" ? "En cours" : ticket.status === "open" ? "Ouvert" : ticket.status === "resolved" ? "Resolu" : "Ferme"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, sub, icon }: { message: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-400">{message}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}
