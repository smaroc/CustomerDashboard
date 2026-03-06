"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function HomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(user.role === "admin" ? "/dashboard" : "/client");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-neutral-400 text-sm">Loading...</div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeRedirect />
    </AuthProvider>
  );
}
