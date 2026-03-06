"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminSetup, setIsAdminSetup] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();
  const login = useAction(api.auth.login);
  const checkAdmin = useAction(api.auth.checkAdminStatus);
  const setupAdmin = useAction(api.auth.setupAdmin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Admin setup mode
      if (isAdminSetup) {
        if (password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caracteres.");
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Les mots de passe ne correspondent pas.");
          setIsSubmitting(false);
          return;
        }

        const result = await setupAdmin({ email: normalizedEmail, password });
        if (!result.success) {
          setError(result.error ?? "Erreur inconnue");
          setIsSubmitting(false);
          return;
        }
        if (result.user) {
          setUser(result.user as Parameters<typeof setUser>[0]);
          router.push("/dashboard");
        }
        return;
      }

      // Check if this is the admin email and needs first-time setup
      if (normalizedEmail === ADMIN_EMAIL) {
        const status = await checkAdmin({ email: normalizedEmail });
        if (!status.exists || !status.hasPassword) {
          setIsAdminSetup(true);
          setIsSubmitting(false);
          return;
        }
      }

      // Normal login
      const result = await login({ email: normalizedEmail, password });
      if (!result.success) {
        setError(result.error ?? "Erreur inconnue");
        setIsSubmitting(false);
        return;
      }

      if (result.user) {
        setUser(result.user as Parameters<typeof setUser>[0]);
        router.push(result.user.role === "admin" ? "/dashboard" : "/client");
      }
    } catch {
      setError("Erreur de connexion. Veuillez reessayer.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-100/60 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200/50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {isAdminSetup
              ? "Premiere connexion — creez votre mot de passe"
              : "Connectez-vous a votre espace"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200/60 p-7 space-y-5"
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                  <rect x="1.5" y="3" width="13" height="10" rx="2" />
                  <path d="M1.5 5.5L8 9l6.5-3.5" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); setIsAdminSetup(false); }}
                required
                autoFocus={!isAdminSetup}
                autoComplete="email"
                disabled={isAdminSetup}
                className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none disabled:opacity-60"
                placeholder="vous@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                {isAdminSetup ? "Choisir un mot de passe" : "Mot de passe"}
              </label>
              {!isAdminSetup && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Mot de passe oublie ?
                </Link>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
                  <rect x="3" y="7" width="10" height="7" rx="2" />
                  <path d="M5 7V5a3 3 0 016 0v2" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
                autoFocus={isAdminSetup}
                minLength={isAdminSetup ? 8 : undefined}
                autoComplete={isAdminSetup ? "new-password" : "current-password"}
                className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
                placeholder={isAdminSetup ? "Minimum 8 caracteres" : "Votre mot de passe"}
              />
            </div>
          </div>

          {/* Confirm password (admin setup only) */}
          {isAdminSetup && (
            <div className="animate-in">
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                required
                autoComplete="new-password"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 focus:outline-none"
                placeholder="Repeter le mot de passe"
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-in">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 mt-0.5">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v3.5M8 10.5v.5" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-sm shadow-indigo-200/50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {isAdminSetup ? "Creation..." : "Connexion..."}
              </span>
            ) : (
              isAdminSetup ? "Creer le compte admin" : "Se connecter"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Pas encore de compte ? Contactez votre administrateur.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
