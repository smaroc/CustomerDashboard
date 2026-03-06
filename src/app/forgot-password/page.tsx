"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ConvexClientProvider } from "@/components/convex-provider";
import Link from "next/link";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestReset = useAction(api.auth.requestPasswordReset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await requestReset({ email: email.toLowerCase().trim() });
    } catch {
      // Still show success to avoid email enumeration
    }

    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-100/60 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-200/50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="3" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Mot de passe oublie
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Entrez votre email pour recevoir un lien de reinitialisation
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200/60 p-7 text-center animate-in">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <path d="M2 7l10 6 10-6" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Email envoye</h2>
            <p className="text-sm text-slate-500 mt-1">
              Si un compte existe avec cette adresse, vous recevrez un email avec un lien de reinitialisation.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 text-sm text-teal-600 font-semibold hover:text-teal-700"
            >
              Retour a la connexion
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-200/60 p-7 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-300 focus:ring-4 focus:ring-teal-100 focus:outline-none"
                placeholder="vous@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50 shadow-sm shadow-teal-200/50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Envoi...
                </span>
              ) : (
                "Envoyer le lien"
              )}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                Retour a la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <ConvexClientProvider>
      <ForgotPasswordForm />
    </ConvexClientProvider>
  );
}
