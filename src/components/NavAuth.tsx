"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/UserMenu";

export function NavAuth() {
  const { user, loading } = useAuth();

  if (loading) return <div className="w-8 h-8" />;

  if (user) return <UserMenu />;

  return (
    <Link
      href="/login"
      className="px-5 py-2 text-sm font-bold text-white rounded-[var(--radius-sm)] transition-opacity hover:opacity-90"
      style={{ backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)" }}
    >
      Se connecter
    </Link>
  );
}
