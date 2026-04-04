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
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-surface-alt text-text-muted hover:text-text transition-colors"
          >
            Clear
          </button>
          <ExportButton samples={samples} />
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

        {/* Right side - Waveform + Vinyl */}
        <div className="flex-1 flex flex-col min-h-0 gap-2 md:gap-3">
          {/* Waveform panel */}
          <div
            className="shrink-0 bg-surface rounded-[var(--radius)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <WaveformToolbar
              playbackState={playbackState}
              onPlay={() => play(composition.placedSamples)}
              onPause={pause}
              onStop={stop}
              disabled={composition.placedSamples.length === 0}
            />
            <Waveform
              samples={samples}
              playbackState={playbackState}
              currentTimeMs={currentTimeMs}
            />
          </div>

          {/* Vinyl panel */}
          <div className="flex-1 flex flex-col items-center justify-center relative bg-surface rounded-[var(--radius)] p-4 min-h-0 overflow-hidden">
            <div onClick={(e) => e.stopPropagation()}><PitchControl samples={samples} /></div>
            <VinylDisk
              samples={samples}
              playbackState={playbackState}
              currentTimeMs={currentTimeMs}
              totalElapsedMs={totalElapsedMs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
