import { create } from "zustand";
import type { Composition, PlacedSample, Sample } from "@/types";

const TOTAL_DURATION_MS = 1818;

/**
 * Magnetic snap: if `ms` is within a threshold of a grid line (beat or half-beat),
 * pull it onto that line. Otherwise return `ms` unchanged.
 * Threshold is ~8% of a half-beat interval — close enough to feel magnetic,
 * far enough to allow free positioning between lines.
 */
export function snapToGrid(ms: number, bpm: number): number {
  const halfBeatMs = 60000 / bpm / 2;
  const threshold = halfBeatMs * 0.08;
  const nearest = Math.round(ms / halfBeatMs) * halfBeatMs;
  return Math.abs(ms - nearest) <= threshold ? nearest : ms;
}

/** Sort by startMs */
function sortByStart(samples: PlacedSample[]): PlacedSample[] {
  return [...samples].sort((a, b) => a.startMs - b.startMs);
}

/**
 * After placing/moving/resizing a sample at `movedIdx`,
 * push neighbours outward to resolve overlaps while preserving
 * existing gaps between samples that come after the moved one.
 * Returns null if it can't fit within bounds.
 */
function resolveOverlaps(
  samples: PlacedSample[],
  movedIdx: number,
  originalSamples?: PlacedSample[]
): PlacedSample[] | null {
  const result = samples.map((s) => ({ ...s }));
  const orig = originalSamples ?? samples;

  // Capture original gaps between consecutive samples after the moved one
  // Use the original (pre-modification) array so the gap between the moved
  // sample and its neighbour is the true gap before the move/resize.
  const origSorted = sortByStart([...orig]);
  const gaps: number[] = [];
  for (let i = movedIdx + 1; i < result.length; i++) {
    // Find this sample's original gap with its predecessor in the original layout
    const cur = result[i];
    const origIdx = origSorted.findIndex((s) => s.id === cur.id);
    if (origIdx > 0) {
      const prevOrig = origSorted[origIdx - 1];
      const prevEnd = prevOrig.startMs + prevOrig.durationMs;
      gaps.push(Math.max(0, origSorted[origIdx].startMs - prevEnd));
    } else {
      gaps.push(0);
    }
  }

  // Samples after the moved one: resolve overlap then preserve original gaps
  for (let i = movedIdx + 1; i < result.length; i++) {
    const prevEnd = result[i - 1].startMs + result[i - 1].durationMs;
    const gap = gaps[i - movedIdx - 1];
    result[i].startMs = prevEnd + gap;
  }

  // Push samples before the moved one backward
  for (let i = movedIdx - 1; i >= 0; i--) {
    const nextStart = result[i + 1].startMs;
    const thisEnd = result[i].startMs + result[i].durationMs;
    if (thisEnd > nextStart) {
      result[i].startMs = nextStart - result[i].durationMs;
    }
  }

  // Check bounds
  if (result[0].startMs < 0) return null;
  const last = result[result.length - 1];
  if (last.startMs + last.durationMs > TOTAL_DURATION_MS) return null;

  return result;
}

function computeUsedMs(samples: PlacedSample[]): number {
  if (samples.length === 0) return 0;
  let maxEnd = 0;
  for (const s of samples) {
    maxEnd = Math.max(maxEnd, s.startMs + s.durationMs);
  }
  return maxEnd;
}

function makeComposition(samples: PlacedSample[]): Composition {
  const usedMs = computeUsedMs(samples);
  return {
    totalDurationMs: TOTAL_DURATION_MS,
    placedSamples: samples,
    usedMs,
    remainingMs: TOTAL_DURATION_MS - usedMs,
  };
}

interface CompositionStore {
  composition: Composition;
  selectedPlacedSampleId: string | null;
  bpm: number;
  snapEnabled: boolean;
  loopMode: "2bars" | "3bars" | "4bars";
  masterPitch: number;
  setMasterPitch: (pitch: number) => void;
  toggleSnap: () => void;
  addSample: (sample: Sample) => void;
  removeSample: (id: string) => void;
  moveSample: (id: string, newStartMs: number) => void;
  updatePitch: (id: string, pitch: number) => void;
  resizeSample: (id: string, newDurationMs: number) => void;
  selectSample: (id: string | null) => void;
  setLoopMode: (mode: "2bars" | "3bars" | "4bars") => void;
  reset: () => void;
  _sampleDurations: Map<string, number>;
}

const initialComposition: Composition = {
  totalDurationMs: TOTAL_DURATION_MS,
  placedSamples: [],
  usedMs: 0,
  remainingMs: TOTAL_DURATION_MS,
};

export const useCompositionStore = create<CompositionStore>((set, get) => ({
  composition: initialComposition,
  selectedPlacedSampleId: null,
  bpm: 400 / 3, // 133⅓ BPM (default: 2 bars)
  snapEnabled: false,
  loopMode: "2bars" as "2bars" | "3bars" | "4bars",
  masterPitch: 1,
  _sampleDurations: new Map(),

  setMasterPitch: (pitch: number) => {
    set({ masterPitch: Math.max(0.5, Math.min(1.5, pitch)) });
  },

  toggleSnap: () => {
    set((state) => ({ snapEnabled: !state.snapEnabled }));
  },

  addSample: (sample: Sample) => {
    const state = get();
    const effectiveDuration = sample.durationMs;

    const currentEnd = computeUsedMs(state.composition.placedSamples);
    if (currentEnd + effectiveDuration > TOTAL_DURATION_MS) return;

    state._sampleDurations.set(sample.id, sample.durationMs);

    const newPlaced: PlacedSample = {
      id: crypto.randomUUID(),
      sampleId: sample.id,
      pitch: 1,
      durationMs: effectiveDuration,
      startMs: currentEnd,
    };

    const newSamples = sortByStart([
      ...state.composition.placedSamples,
      newPlaced,
    ]);

    set({ composition: makeComposition(newSamples) });
  },

  removeSample: (id: string) => {
    const state = get();
    const filtered = state.composition.placedSamples.filter((s) => s.id !== id);
    set({
      composition: makeComposition(filtered),
      selectedPlacedSampleId:
        state.selectedPlacedSampleId === id
          ? null
          : state.selectedPlacedSampleId,
    });
  },

  moveSample: (id: string, newStartMs: number) => {
    const state = get();
    const samples = state.composition.placedSamples;
    const sample = samples.find((s) => s.id === id);
    if (!sample) return;

    // Clamp to bounds
    const clampedStart = Math.max(
      0,
      Math.min(newStartMs, TOTAL_DURATION_MS - sample.durationMs)
    );

    // Build new array with updated position, then sort
    const updated = samples.map((s) =>
      s.id === id ? { ...s, startMs: clampedStart } : s
    );
    const sorted = sortByStart(updated);
    const movedIdx = sorted.findIndex((s) => s.id === id);

    const resolved = resolveOverlaps(sorted, movedIdx, samples);
    if (!resolved) return;

    set({ composition: makeComposition(resolved) });
  },

  updatePitch: (id: string, pitch: number) => {
    const state = get();
    const samples = state.composition.placedSamples;
    const idx = samples.findIndex((s) => s.id === id);
    if (idx === -1) return;

    const s = samples[idx];
    const originalDuration =
      state._sampleDurations.get(s.sampleId) ?? s.durationMs;
    const newDuration = originalDuration / pitch;

    // Update the sample's duration/pitch
    const sorted = sortByStart(
      samples.map((sample) =>
        sample.id === id
          ? { ...sample, pitch, durationMs: newDuration }
          : sample
      )
    );
    const movedIdx = sorted.findIndex((sample) => sample.id === id);

    const resolved = resolveOverlaps(sorted, movedIdx, samples);
    if (!resolved) return;

    set({ composition: makeComposition(resolved) });
  },

  resizeSample: (id: string, newDurationMs: number) => {
    const state = get();
    const samples = state.composition.placedSamples;
    const idx = samples.findIndex((s) => s.id === id);
    if (idx === -1) return;

    const s = samples[idx];
    const originalDuration =
      state._sampleDurations.get(s.sampleId) ?? s.durationMs;
    const newPitch = originalDuration / newDurationMs;

    const sorted = sortByStart(
      samples.map((sample) =>
        sample.id === id
          ? { ...sample, pitch: newPitch, durationMs: newDurationMs }
          : sample
      )
    );
    const movedIdx = sorted.findIndex((sample) => sample.id === id);

    const resolved = resolveOverlaps(sorted, movedIdx, samples);
    if (!resolved) return;

    set({ composition: makeComposition(resolved) });
  },

  selectSample: (id: string | null) => {
    set({ selectedPlacedSampleId: id });
  },

  setLoopMode: (mode: "2bars" | "3bars" | "4bars") => {
    const bpmMap = { "2bars": 400 / 3, "3bars": 100, "4bars": 200 / 3 };
    set({ loopMode: mode, bpm: bpmMap[mode] });
  },

  reset: () => {
    set({
      composition: initialComposition,
      selectedPlacedSampleId: null,
      bpm: 400 / 3,
      loopMode: "2bars" as "2bars" | "3bars" | "4bars",
    });
  },
}));
