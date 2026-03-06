"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function NewTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProject = searchParams.get("project");

  const projects = useQuery(
    api.projects.listByMember,
    user ? { userId: user._id } : "skip"
  );
  const createTicket = useMutation(api.tickets.create);
  const generateUploadUrl = useMutation(api.tickets.generateUploadUrl);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [projectId, setProjectId] = useState(preselectedProject ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectId) return;
    setSubmitting(true);

    try {
      const fileIds: Id<"_storage">[] = [];
      const fileNames: string[] = [];
      const fileTypes: string[] = [];

      for (const file of files) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        fileIds.push(storageId);
        fileNames.push(file.name);
        fileTypes.push(file.type);
      }

      await createTicket({
        title,
        description,
        priority,
        projectId: projectId as Id<"projects">,
        createdBy: user._id,
        fileIds: fileIds.length ? fileIds : undefined,
        fileNames: fileNames.length ? fileNames : undefined,
        fileTypes: fileTypes.length ? fileTypes : undefined,
      });

      router.push(`/client/projects/${projectId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const priorityConfig = {
    low: { label: "Basse", color: "bg-slate-100 text-slate-700 ring-slate-200", activeColor: "bg-slate-200 text-slate-900 ring-slate-300" },
    medium: { label: "Moyenne", color: "bg-amber-50 text-amber-700 ring-amber-200", activeColor: "bg-amber-100 text-amber-900 ring-amber-300" },
    high: { label: "Haute", color: "bg-red-50 text-red-700 ring-red-200", activeColor: "bg-red-100 text-red-900 ring-red-300" },
  } as const;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Nouveau ticket</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Decrivez votre demande et joignez les fichiers utiles
        </p>
      </div>

      {/* Tesler's Law: absorb complexity, keep the form clean */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-100/50 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Projet</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
          >
            <option value="">Selectionner un projet</option>
            {projects?.map((p) => p && (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
            placeholder="Resume de votre demande"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none resize-none leading-relaxed"
            placeholder="Expliquez en detail ce que vous souhaitez..."
          />
        </div>

        {/* Priority — Hick's Law: 3 clear choices + Von Restorff: color-coded */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Priorite</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 h-11 rounded-xl text-sm font-semibold ring-1 cursor-pointer ${
                  priority === p ? priorityConfig[p].activeColor : "bg-white text-slate-400 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {priorityConfig[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload — Fitts's Law: large drop zone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Pieces jointes</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 group"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400 group-hover:text-indigo-500">
                <path d="M12 16V8M9 11l3-3 3 3" />
                <path d="M20 16.7V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-2.3" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500 group-hover:text-indigo-600">
              Cliquez pour ajouter des fichiers
            </p>
            <p className="text-xs text-slate-400 mt-1">Images, PDF, documents</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {files.length > 0 && (
            <div className="mt-3 space-y-2 stagger">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#6366f1" strokeWidth="1.5">
                        <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA — Fitts's Law: 48px + Von Restorff: accent color */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-sm shadow-indigo-200/50 cursor-pointer"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Creation en cours...
            </span>
          ) : (
            "Creer le ticket"
          )}
        </button>
      </form>
    </div>
  );
}
