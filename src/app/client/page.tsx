"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function ClientDashboard() {
  const { user } = useAuth();
  const projects = useQuery(
    api.projects.listByMember,
    user ? { userId: user._id } : "skip"
  );

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Mes projets</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Suivez vos projets et creez des tickets
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
        {!projects?.length ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M3 7A1.5 1.5 0 014.5 5.5H9l2 2.5h8.5A1.5 1.5 0 0121 9.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5V7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">Aucun projet</p>
            <p className="text-xs text-slate-400 mt-1">
              Vous serez notifie quand un projet vous sera assigne
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 stagger">
            {projects.map((project) => project && (
              <Link
                key={project._id}
                href={`/client/projects/${project._id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 text-sm font-bold shrink-0">
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
                <div className="flex items-center gap-3">
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
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300 group-hover:text-teal-400">
                    <path d="M6 4l4 4-4 4" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
