"use client";

import { useEffect, useRef } from "react";
import { useCompositionStore } from "@/store/composition";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export function useAutoSave() {
  const { user } = useAuth();
  const composition = useCompositionStore((s) => s.composition);
  const compositionName = useCompositionStore((s) => s.compositionName);
  const masterPitch = useCompositionStore((s) => s.masterPitch);
  const bpm = useCompositionStore((s) => s.bpm);
  const loopMode = useCompositionStore((s) => s.loopMode);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Skip the initial mount
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (!user) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const state = useCompositionStore.getState();
      const data = state.getSerializableState();
      const name = state.compositionName;
      const compositionId = state.currentCompositionId;
      const supabase = createClient();

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
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, composition, compositionName, masterPitch, bpm, loopMode]);
}
