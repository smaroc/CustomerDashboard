"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ProjectsPage() {
  const { user } = useAuth();
  const projects = useQuery(api.projects.list);
  const clients = useQuery(api.users.listClients);
  const createProject = useMutation(api.projects.create);
  const removeProject = useMutation(api.projects.remove);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clientId) return;
    setCreating(true);
    await createProject({
      name,
      description,
      adminId: user._id,
      clientId: clientId as Id<"users">,
    });
    setName("");
    setDescription("");
    setClientId("");
    setShowCreate(false);
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    await removeProject({ id: id as Id<"projects"> });
    setConfirmDelete(null);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Projets</h2>
          <p className="text-sm text-slate-500 mt-0.5">Gerez tous vos projets clients</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="h-11 bg-indigo-600 text-white px-5 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] shadow-sm shadow-indigo-200/50 flex items-center gap-2 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Nouveau projet
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 p-6 mb-6 space-y-5 animate-in"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
            >
              <option value="">Selectionner un client</option>
              {clients?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
            {clients && clients.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Aucun client.{" "}
                <Link href="/dashboard/clients" className="text-indigo-600 font-medium hover:underline">
                  Creer un client
                </Link>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nom du projet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
              placeholder="ex: Refonte du site web"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none resize-none"
              placeholder="Breve description du projet"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={creating || !clientId}
              className="h-11 bg-indigo-600 text-white px-6 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200/50 cursor-pointer"
            >
              {creating ? "Creation..." : "Creer le projet"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="h-11 px-5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
        {!projects?.length ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <path d="M3 7A1.5 1.5 0 014.5 5.5H9l2 2.5h8.5A1.5 1.5 0 0121 9.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5V7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">Aucun projet</p>
            <p className="text-xs text-slate-400 mt-1">Creez votre premier projet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 stagger">
            {projects.map((project) => (
              <div key={project._id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 group">
                <Link
                  href={`/dashboard/projects/${project._id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                      {project.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {project.client?.name ?? "Aucun client"} &middot; {project.description}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0 ml-4">
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
                  {confirmDelete === project._id ? (
                    <div className="flex items-center gap-1 animate-in">
                      <button
                        onClick={() => handleDelete(project._id)}
                        className="h-8 px-3 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="h-8 px-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(project._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
