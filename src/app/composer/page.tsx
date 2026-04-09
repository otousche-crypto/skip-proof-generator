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
import { ExportButton } from "@/components/ExportButton";
import { useAutoSave } from "@/hooks/useAutoSave";
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
  const selectedId = useCompositionStore((s) => s.selectedPlacedSampleId);

  const masterPitch = useCompositionStore((s) => s.masterPitch);
  const loadPeaks = useWaveformPeaksStore((s) => s.loadPeaks);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useAutoSave();

  useEffect(() => {
    for (const ps of composition.placedSamples) {
      const sample = getSampleById(ps.sampleId);
      if (sample) loadPeaks(sample.fileUrl);
    }
  }, [composition.placedSamples, getSampleById, loadPeaks]);

  const { playbackState, currentTimeMs, totalElapsedMs, play, pause, stop, previewSample } =
    useAudioEngine(getSampleById, masterPitch);

  // Spacebar play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (playbackState === "playing") {
        pause();
      } else {
        play(useCompositionStore.getState().composition.placedSamples);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playbackState, play, pause]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-text-muted">
        Loading samples...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background pt-16 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:px-3 md:pb-3 gap-2 md:gap-3" onClick={() => selectSample(null)}>
      {/* Main content */}
      <div className="flex flex-1 min-h-0 gap-2 md:gap-3">
        {/* Mobile: vertical "Library" tab */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-surface border border-border border-l-0 rounded-r-[var(--radius-sm)] px-4 py-3 flex items-center justify-center"
          style={{ writingMode: "vertical-rl" }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            + Add Samples
          </span>
        </button>

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
                <ExportButton samples={samples} />
              }
            />
            <Waveform
              samples={samples}
              playbackState={playbackState}
              currentTimeMs={currentTimeMs}
            />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative p-2 md:p-4 min-h-0 min-w-0">
            <div className="flex-1 flex items-center justify-center min-h-0 min-w-0 w-full">
              <VinylDisk
                samples={samples}
                playbackState={playbackState}
                currentTimeMs={currentTimeMs}
                totalElapsedMs={totalElapsedMs}
              />
            </div>
            {/* Bottom bar: Delete when selected, Pitch otherwise */}
            <div
              className="flex items-center justify-center gap-3 shrink-0 py-1 h-8"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedId && composition.placedSamples.find((s) => s.id === selectedId) ? (
                <button
                  onClick={() => {
                    useCompositionStore.getState().removeSample(selectedId);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                  title="Supprimer le sample"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1.5,3 10.5,3" />
                    <path d="M4.5,3 V1.5 H7.5 V3" />
                    <path d="M2.5,3 V10.5 H9.5 V3" />
                    <line x1="5" y1="5.5" x2="5" y2="8.5" />
                    <line x1="7" y1="5.5" x2="7" y2="8.5" />
                  </svg>
                  Delete
                </button>
              ) : (
                <>
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
                    className="w-32 md:w-40 h-2 accent-accent-orange cursor-pointer py-2"
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
