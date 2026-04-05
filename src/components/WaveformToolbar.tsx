"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useCompositionStore } from "@/store/composition";
import type { PlaybackState } from "@/hooks/useAudioEngine";

export function WaveformToolbar({
  playbackState,
  onPlay,
  onPause,
  onStop,
  disabled,
  actions,
}: {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  disabled: boolean;
  actions?: ReactNode;
}) {
  const loopMode = useCompositionStore((s) => s.loopMode);
  const setLoopMode = useCompositionStore((s) => s.setLoopMode);
  const bpm = useCompositionStore((s) => s.bpm);
  const snapEnabled = useCompositionStore((s) => s.snapEnabled);
  const toggleSnap = useCompositionStore((s) => s.toggleSnap);


  const [metronomeOn, setMetronomeOn] = useState(false);
  const metroCtxRef = useRef<AudioContext | null>(null);
  const metroIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    const ctx = metroCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  useEffect(() => {
    if (metroIntervalRef.current) {
      clearInterval(metroIntervalRef.current);
      metroIntervalRef.current = null;
    }
    if (metronomeOn) {
      if (!metroCtxRef.current) {
        metroCtxRef.current = new AudioContext({ sampleRate: 44100 });
      }
      tick();
      metroIntervalRef.current = setInterval(tick, 60000 / bpm);
    }
    return () => {
      if (metroIntervalRef.current) clearInterval(metroIntervalRef.current);
    };
  }, [metronomeOn, bpm, tick]);

  useEffect(() => {
    return () => {
      if (metroCtxRef.current) {
        metroCtxRef.current.close();
      }
    };
  }, []);

  const options = [
    { value: "2bars" as const, label: "133⅓" },
    { value: "3bars" as const, label: "100" },
    { value: "4bars" as const, label: "66⅔" },
  ];

  const pillClass = (active: boolean) =>
    `px-2.5 h-6 rounded-lg text-[10px] font-mono transition-colors ${
      active
        ? "bg-accent-violet text-white"
        : "bg-surface-alt text-text-muted hover:text-text"
    }`;

  return (
    <div
      className="flex flex-col gap-2 px-2 md:px-3 py-1.5 md:py-2 border-b border-border"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Row 1 — BPM (left) + Magnet (right) */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-text-muted font-mono">BPM:</span>
          <select
            value={loopMode}
            onChange={(e) => setLoopMode(e.target.value as "2bars" | "3bars" | "4bars")}
            className="h-6 rounded-lg text-[10px] font-mono bg-accent-violet text-white border-none px-1.5 outline-none cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={toggleSnap}
          className={pillClass(snapEnabled)}
          title="Snap magnétique"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="inline mr-0.5 -mt-px">
            <path d="M8 0C5.8 0 4 1.8 4 4v5a4 4 0 0 0 8 0V4c0-2.2-1.8-4-4-4zM6 4c0-1.1.9-2 2-2s2 .9 2 2v5a2 2 0 1 1-4 0V4zM1 7h2v2a5 5 0 0 0 10 0V7h2v2a7 7 0 0 1-14 0V7z"/>
          </svg>
          Magnet
        </button>
      </div>

      <div className="h-px bg-border/50 md:hidden" />
      {/* Row 2 mobile / Single row desktop — Transport + Actions */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 md:gap-2">
        {/* Left — BPM + Magnet (desktop only) */}
        <div className="hidden md:flex items-center gap-1">
          <span className="text-[10px] text-text-muted font-mono">BPM:</span>
          <select
            value={loopMode}
            onChange={(e) => setLoopMode(e.target.value as "2bars" | "3bars" | "4bars")}
            className="h-6 rounded-lg text-[10px] font-mono bg-accent-violet text-white border-none px-1.5 outline-none cursor-pointer"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={toggleSnap}
            className={pillClass(snapEnabled)}
            title="Snap magnétique"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="inline mr-0.5 -mt-px">
              <path d="M8 0C5.8 0 4 1.8 4 4v5a4 4 0 0 0 8 0V4c0-2.2-1.8-4-4-4zM6 4c0-1.1.9-2 2-2s2 .9 2 2v5a2 2 0 1 1-4 0V4zM1 7h2v2a5 5 0 0 0 10 0V7h2v2a7 7 0 0 1-14 0V7z"/>
            </svg>
            Magnet
          </button>
        </div>
        {/* Left spacer (mobile only) */}
        <div className="md:hidden" />

        {/* Center — Transport */}
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={onStop}
            disabled={playbackState === "stopped"}
            className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center transition-colors hover:bg-border disabled:opacity-30"
            title="Stop"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="white">
              <rect x="3" y="3" width="10" height="10" rx="1" />
            </svg>
          </button>
          <button
            onClick={playbackState === "playing" ? onPause : onPlay}
            disabled={playbackState !== "playing" && disabled}
            className="w-9 h-9 rounded-full bg-accent-orange flex items-center justify-center transition-colors hover:brightness-110 disabled:opacity-30"
            title={playbackState === "playing" ? "Pause" : "Play"}
          >
            {playbackState === "playing" ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
                <rect x="3" y="2" width="3.5" height="12" rx="1" />
                <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="white">
                <polygon points="4,2 14,8 4,14" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setMetronomeOn((v) => !v)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              metronomeOn
                ? "bg-accent-violet text-white"
                : "bg-surface-alt text-text-muted hover:bg-border"
            }`}
            title="Métronome"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 0h4l2 14H4L6 0zM7 2L5.5 13h5L9 2H7zM7.5 4h1v5h-1V4zM3 14h10v2H3v-2z"/>
            </svg>
          </button>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center justify-end gap-1.5">
          {actions}
        </div>
      </div>
    </div>
  );
}
