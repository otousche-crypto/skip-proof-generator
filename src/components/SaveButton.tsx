"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompositionStore } from "@/store/composition";
import { createClient } from "@/lib/supabase/client";

export function SaveButton() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const state = useCompositionStore.getState();
    const data = state.getSerializableState();
    const name = state.compositionName;
    const compositionId = state.currentCompositionId;

    if (compositionId) {
      await supabase
        .from("compositions")
        .update({ name, data, updated_at: new Date().toISOString() })
        .eq("id", compositionId);
    } else {
      const { data: inserted } = await supabase
        .from("compositions")
        .insert({ user_id: user.id, name, data })
        .select("id")
        .single();

      if (inserted) {
        useCompositionStore.setState({ currentCompositionId: inserted.id });
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-surface-alt text-text-muted hover:text-text transition-colors disabled:opacity-50"
      title="Sauvegarder la composition"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      {saving ? "..." : saved ? "Sauvegardé" : "Sauvegarder"}
    </button>
  );
}
