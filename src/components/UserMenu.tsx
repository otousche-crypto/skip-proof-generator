"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export function UserMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (loading || !user) return null;

  const displayName =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "?";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{
          backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
        }}
        title={displayName}
      >
        {initials}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-surface border border-border rounded-[var(--radius-sm)] shadow-lg py-1 min-w-[160px]">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm text-text font-medium truncate">
                {displayName}
              </p>
              <p className="text-xs text-text-muted truncate">{user.email}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
            >
              Profil
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-surface-alt transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </>
      )}
    </div>
  );
}
