"use client";

import { useCompositionStore } from "@/store/composition";
import type { Sample } from "@/types";

export function PitchControl({ samples }: { samples: Sample[] }) {
  const selectedId = useCompositionStore((s) => s.selectedPlacedSampleId);
  const composition = useCompositionStore((s) => s.composition);
  const updatePitch = useCompositionStore((s) => s.updatePitch);
  const removeSample = useCompositionStore((s) => s.removeSample);
  const selectSample = useCompositionStore((s) => s.selectSample);

  if (!selectedId) return null;

  const placed = composition.placedSamples.find((s) => s.id === selectedId);
  if (!placed) return null;

  const sampleInfo = samples.find((s) => s.id === placed.sampleId);

  return (
    <div className="bg-surface-alt rounded-[var(--radius)] p-3 md:p-4 w-[calc(100vw-2rem)] max-w-64 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {sampleInfo && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: sampleInfo.color }}
            />
          )}
          <span className="text-sm font-bold">{sampleInfo?.name ?? "Sample"}</span>
        </div>
        <button
          onClick={() => selectSample(null)}
          className="text-text-muted hover:text-foreground text-xs"
        >
          ✕
        </button>
      </div>

      <div className="mb-3">
        <label className="text-xs text-text-muted block mb-1">Pitch</label>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.01}
          value={placed.pitch}
          onChange={(e) => updatePitch(placed.id, parseFloat(e.target.value))}
          className="w-full accent-accent-violet"
        />
        <div className="text-center font-mono text-sm text-accent-violet">
          {placed.pitch.toFixed(2)}x
        </div>
      </div>

      <div className="text-xs text-text-muted space-y-1 mb-3">
        <div>
          Duration:{" "}
          <span className="font-mono text-foreground">
            {placed.durationMs.toFixed(0)}ms
          </span>
        </div>
        <div>
          Start:{" "}
          <span className="font-mono text-foreground">
            {placed.startMs.toFixed(0)}ms
          </span>
        </div>
      </div>

      <button
        onClick={() => {
          removeSample(placed.id);
        }}
        className="w-full text-xs py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
      >
        Remove
      </button>
    </div>
  );
}
