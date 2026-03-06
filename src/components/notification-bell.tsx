"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/auth-context";

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const unreadCount = useQuery(
    api.notifications.unreadCount,
    user ? { userId: user._id } : "skip"
  );
  const notifications = useQuery(
    api.notifications.list,
    user ? { userId: user._id } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (!user) return null;

  const hasUnread = (unreadCount ?? 0) > 0;

  return (
    <div className="relative">
      {/* Fitts's Law: 40px touch target */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer ${
          hasUnread
            ? "bg-indigo-50 text-indigo-600"
            : "hover:bg-slate-100 text-slate-500"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M15 7.5a5 5 0 10-10 0c0 5.833-2.5 7.5-2.5 7.5h15S15 13.333 15 7.5zM11.45 17.5a2 2 0 01-2.9 0" />
        </svg>
        {hasUnread && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">
                Notifications
              </span>
              {hasUnread && (
                <button
                  onClick={() => markAllAsRead({ userId: user._id })}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!notifications?.length ? (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                      <path d="M15 7.5a5 5 0 10-10 0c0 5.833-2.5 7.5-2.5 7.5h15S15 13.333 15 7.5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">Aucune notification</p>
                </div>
              ) : (
                <div className="stagger">
                  {notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => {
                        if (!n.read) markAsRead({ id: n._id });
                      }}
                      className={`w-full text-left px-5 py-3.5 hover:bg-slate-50 cursor-pointer ${
                        !n.read ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!n.read && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1.5" />
                        )}
                        <div className={!n.read ? "" : "ml-5"}>
                          <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "A l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(timestamp).toLocaleDateString("fr-FR");
}
