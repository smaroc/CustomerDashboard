"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

function ClientShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64">
        <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-lg border-b border-slate-200/60">
          <div className="flex items-center justify-end px-8 py-3">
            <NotificationBell />
          </div>
        </header>
        <main className="px-8 py-6 animate-in">{children}</main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ClientShell>{children}</ClientShell>
    </AuthProvider>
  );
}
