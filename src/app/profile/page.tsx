"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSamples } from "@/hooks/useSamples";
import { useCompositionStore } from "@/store/composition";
import { createClient } from "@/lib/supabase/client";
import { CompositionCard } from "@/components/CompositionCard";
import { NavAuth } from "@/components/NavAuth";
import type { SavedComposition } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { samples } = useSamples();
  const router = useRouter();
  const [compositions, setCompositions] = useState<SavedComposition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const supabase = createClient();
    supabase
      .from("compositions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setCompositions((data as SavedComposition[]) ?? []);
        setLoading(false);
      });
  }, [user, authLoading]);

  const handleLoad = (comp: SavedComposition) => {
    useCompositionStore
      .getState()
      .loadComposition(comp.id, comp.name, comp.data);
    router.push("/composer");
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("compositions").delete().eq("id", id);
    setCompositions((prev) => prev.filter((c) => c.id !== id));
  };

if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text-muted">
        Chargement...
      </div>
    );
  }

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "?";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <nav className="relative flex items-center justify-center px-6 py-4 max-w-3xl mx-auto w-full">
        <Link
          href="/"
          className="text-lg font-bold bg-clip-text text-transparent"
          style={{
            backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
          }}
        >
          Sklip
        </Link>
        <div className="absolute right-6">
          <NavAuth />
        </div>
      </nav>

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        {/* User info */}
        <div className="flex items-center gap-4 mb-10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
            style={{
              backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text truncate">
              {displayName}
            </h1>
            <p className="text-sm text-text-muted truncate">{user?.email}</p>
          </div>
        </div>

        {/* Compositions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text">
            Mes compositions
          </h2>
          <Link
            href="/composer"
            className="px-4 py-2 rounded-[var(--radius-sm)] text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
            }}
          >
            + New
          </Link>
        </div>

        {loading ? (
          <p className="text-text-muted text-sm">Chargement...</p>
        ) : compositions.length === 0 ? (
          <div className="bg-surface rounded-[var(--radius)] border border-border p-8 text-center">
            <p className="text-text-muted">Aucune composition sauvegardée.</p>
            <Link
              href="/composer"
              className="inline-block mt-3 text-sm text-[#FF6B00] hover:underline"
            >
              Créer une composition
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {compositions.map((comp) => (
              <CompositionCard
                key={comp.id}
                composition={comp}
                samples={samples}
                onLoad={handleLoad}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
