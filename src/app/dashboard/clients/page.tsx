"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ClientsPage() {
  const clients = useQuery(api.users.listClients);
  const createUser = useMutation(api.users.create);
  const removeUser = useMutation(api.users.remove);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createUser({
        name,
        email: email.toLowerCase().trim(),
        role: "client",
      });
      setName("");
      setEmail("");
      setShowCreate(false);
    } catch {
      setError("Erreur lors de la creation du client.");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    await removeUser({ id: id as Id<"users"> });
    setConfirmDelete(null);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clients</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {clients?.length ?? 0} client{(clients?.length ?? 0) !== 1 ? "s" : ""} enregistre{(clients?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="h-11 bg-indigo-600 text-white px-5 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] shadow-sm shadow-indigo-200/50 flex items-center gap-2 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Nouveau client
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 p-6 mb-6 space-y-5 animate-in"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
              placeholder="Nom complet du client"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
              placeholder="client@example.com"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-in">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v3.5M8 10.5v.5" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="h-11 bg-indigo-600 text-white px-6 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-200/50 cursor-pointer"
            >
              {creating ? "Creation..." : "Creer le client"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setError(""); }}
              className="h-11 px-5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 overflow-hidden">
        {!clients?.length ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <circle cx="9" cy="7" r="3.5" />
                <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
                <circle cx="17.5" cy="7.5" r="2" />
                <path d="M21 20c0-2.21-1.57-4-3.5-4-.7 0-1.35.2-1.9.53" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">Aucun client</p>
            <p className="text-xs text-slate-400 mt-1">Ajoutez votre premier client</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 stagger">
            {clients.map((client) => {
              const initials = client.name
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={client._id}
                  className="flex items-center justify-between px-5 py-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                      {initials || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                      Client
                    </span>
                    {confirmDelete === client._id ? (
                      <div className="flex items-center gap-1 animate-in">
                        <button
                          onClick={() => handleDelete(client._id)}
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
                        onClick={() => setConfirmDelete(client._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
