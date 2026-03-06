"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const basePath = isAdmin ? "/dashboard" : "/client";

  const links = isAdmin
    ? [
        { href: "/dashboard", label: "Vue d'ensemble", icon: GridIcon },
        { href: "/dashboard/projects", label: "Projets", icon: FolderIcon },
        { href: "/dashboard/clients", label: "Clients", icon: UsersIcon },
      ]
    : [
        { href: "/client", label: "Mes projets", icon: FolderIcon },
      ];

  // Initials for avatar — Law of Pragnanz: simple recognizable shape
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col h-screen fixed left-0 top-0">
      {/* Brand — Serial Position: first item is most memorable */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200/50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {isAdmin ? "Administration" : "Espace client"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation — Hick's Law: max 3-4 items, clear labels */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </p>
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== basePath && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <link.icon active={isActive} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User — Serial Position: last item is second most memorable */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            title="Se deconnecter"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 2H4a2 2 0 00-2 2v8a2 2 0 002 2h2M11 11l3-3-3-3M6 8h8" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function GridIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={active ? "#4f46e5" : "currentColor"} strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="5.5" height="5.5" rx="1.5" />
      <rect x="10.5" y="2" width="5.5" height="5.5" rx="1.5" />
      <rect x="2" y="10.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="10.5" y="10.5" width="5.5" height="5.5" rx="1.5" />
    </svg>
  );
}

function FolderIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={active ? "#4f46e5" : "currentColor"} strokeWidth="1.5" strokeLinecap="round">
      <path d="M2.5 5A1.5 1.5 0 014 3.5h3l1.5 2h5.5A1.5 1.5 0 0115.5 7v6a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 13V5z" />
    </svg>
  );
}

function UsersIcon({ active }: { active?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={active ? "#4f46e5" : "currentColor"} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="5.5" r="2.5" />
      <path d="M2.5 15c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
      <circle cx="13" cy="6" r="1.5" />
      <path d="M15.5 15c0-1.66-1.12-3-2.5-3-.56 0-1.08.16-1.5.44" />
    </svg>
  );
}
