"use client";

import { useCallback, useEffect, useState } from "react";
import { useSamples } from "@/hooks/useSamples";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useCompositionStore } from "@/store/composition";
import { useWaveformPeaksStore } from "@/store/waveformPeaks";
import { SampleLibrary } from "@/components/SampleLibrary";
import { VinylDisk } from "@/components/VinylDisk";
import { Waveform } from "@/components/Waveform";
import { WaveformToolbar } from "@/components/WaveformToolbar";
import { PitchControl } from "@/components/PitchControl";
import { ExportButton } from "@/components/ExportButton";
import type { Sample } from "@/types";

export default function Home() {
  const { samples, loading } = useSamples();
  const composition = useCompositionStore((s) => s.composition);
  const reset = useCompositionStore((s) => s.reset);

  const getSampleById = useCallback(
    (id: string): Sample | undefined => samples.find((s) => s.id === id),
    [samples]
  );

  const selectSample = useCompositionStore((s) => s.selectSample);

  const masterPitch = useCompositionStore((s) => s.masterPitch);
  const loadPeaks = useWaveformPeaksStore((s) => s.loadPeaks);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    for (const ps of composition.placedSamples) {
      const sample = getSampleById(ps.sampleId);
      if (sample) loadPeaks(sample.fileUrl);
    }
  }, [composition.placedSamples, getSampleById, loadPeaks]);

  const { playbackState, currentTimeMs, totalElapsedMs, play, pause, stop, previewSample } =
    useAudioEngine(getSampleById, masterPitch);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text-muted">
        Loading samples...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background p-2 md:p-3 gap-2 md:gap-3" onClick={() => selectSample(null)}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2.5 bg-surface rounded-[var(--radius)] shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden w-8 h-8 rounded-[var(--radius-sm)] bg-surface-alt flex items-center justify-center text-text-muted hover:text-text transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="1.5" rx="0.75" />
              <rect x="2" y="7.25" width="12" height="1.5" rx="0.75" />
              <rect x="2" y="11.5" width="12" height="1.5" rx="0.75" />
            </svg>
          </button>
          <h1
            className="text-base md:text-lg font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
            }}
          >
            Skip Proof Generator
          </h1>
          <span className="hidden sm:inline text-xs text-text-muted font-mono">
            {composition.remainingMs.toFixed(0)}ms free
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 gap-2 md:gap-3">
        {/* Sidebar - Sample Library */}
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`
            fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 md:transition-none
            md:static md:z-auto md:w-[260px] lg:w-[280px] shrink-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <SampleLibrary samples={samples} previewSample={previewSample} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Right side - Waveform + Vinyl (single panel) */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface rounded-[var(--radius)] overflow-hidden">
          <div onClick={(e) => e.stopPropagation()}>
            <WaveformToolbar
              playbackState={playbackState}
              onPlay={() => play(composition.placedSamples)}
              onPause={pause}
              onStop={stop}
              disabled={composition.placedSamples.length === 0}
              actions={
                <>
                  <button
                    onClick={reset}
                    className="px-2.5 h-6 rounded-lg text-[10px] font-mono bg-surface-alt text-text-muted hover:text-text transition-colors"
                  >
                    Clear
                  </button>
                  <ExportButton samples={samples} />
                </>
              }
            />
            <Waveform
              samples={samples}
              playbackState={playbackState}
              currentTimeMs={currentTimeMs}
            />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative p-2 md:p-4 min-h-0 min-w-0 overflow-hidden">
            <div className="flex-1 flex items-center justify-center min-h-0 min-w-0 w-full">
              <VinylDisk
                samples={samples}
                playbackState={playbackState}
                currentTimeMs={currentTimeMs}
                totalElapsedMs={totalElapsedMs}
              />
            </div>
            {/* Master Pitch — horizontal bar below vinyl */}
            <div
              className="flex items-center gap-3 shrink-0 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] text-text-muted font-mono">Pitch</span>
              <input
                type="range"
                min={-50}
                max={50}
                value={Math.round((masterPitch - 1) * 100)}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const snapped = Math.abs(raw) <= 3 ? 0 : raw;
                  useCompositionStore.getState().setMasterPitch(1 + snapped / 100);
                }}
                className="w-32 md:w-40 h-1 accent-accent-orange cursor-pointer"
                title={`Master pitch: ${masterPitch >= 1 ? "+" : ""}${Math.round((masterPitch - 1) * 100)}%`}
              />
              <button
                onClick={() => useCompositionStore.getState().setMasterPitch(1)}
                className={`text-[10px] font-mono tabular-nums ${
                  masterPitch === 1 ? "text-text-muted" : "text-accent-orange cursor-pointer hover:underline"
                }`}
                title="Reset pitch to 0%"
              >
                {masterPitch >= 1 ? "+" : "−"}{String(Math.abs(Math.round((masterPitch - 1) * 100))).padStart(2, "\u2007")}%
              </button>
            </div>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:bottom-auto md:left-auto md:translate-x-0 md:right-4 md:top-1/2 md:-translate-y-1/2 z-10" onClick={(e) => e.stopPropagation()}>
              <PitchControl samples={samples} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
