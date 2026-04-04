"use client";

import { useCallback, useRef, useState } from "react";
import type { PlacedSample, Sample } from "@/types";
import { loadAudioBuffer } from "@/lib/audioBufferCache";

export type PlaybackState = "stopped" | "playing" | "paused";

export function useAudioEngine(getSampleById: (id: string) => Sample | undefined, masterPitch: number = 1) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [totalElapsedMs, setTotalElapsedMs] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const startTimeRef = useRef(0);
  const pauseOffsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const placedSamplesRef = useRef<PlacedSample[]>([]);
  const loopCountRef = useRef(0);
  const masterPitchRef = useRef(masterPitch);
  masterPitchRef.current = masterPitch;

  const stopAll = useCallback(() => {
    sourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    sourcesRef.current = [];
    cancelAnimationFrame(rafRef.current);
  }, []);

  const scheduleLoop = useCallback(async (ctx: AudioContext, placedSamples: PlacedSample[]) => {
    // Stop old sources
    sourcesRef.current.forEach((s) => {
      try { s.stop(); } catch { /* already stopped */ }
    });
    sourcesRef.current = [];

    const mp = masterPitchRef.current;
    for (const ps of placedSamples) {
      const sample = getSampleById(ps.sampleId);
      if (!sample) continue;
      const buffer = await loadAudioBuffer(ctx, sample.fileUrl);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = ps.pitch * mp;
      source.connect(ctx.destination);
      source.start(ctx.currentTime + ps.startMs / 1000 / mp);
      sourcesRef.current.push(source);
    }
  }, [getSampleById]);

  const updateTime = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== "running") return;
    const elapsed = (ctx.currentTime - startTimeRef.current) * 1000 * masterPitchRef.current + pauseOffsetRef.current;
    if (elapsed >= 1818) {
      // Loop: reset timing and re-schedule
      loopCountRef.current += 1;
      pauseOffsetRef.current = 0;
      startTimeRef.current = ctx.currentTime;
      scheduleLoop(ctx, placedSamplesRef.current);
      setCurrentTimeMs(0);
      setTotalElapsedMs(loopCountRef.current * 1818);
      rafRef.current = requestAnimationFrame(updateTime);
    } else {
      setCurrentTimeMs(elapsed);
      setTotalElapsedMs(loopCountRef.current * 1818 + elapsed);
      rafRef.current = requestAnimationFrame(updateTime);
    }
  }, [scheduleLoop]);

  const play = useCallback(
    async (placedSamples: PlacedSample[]) => {
      if (placedSamples.length === 0) return;

      let ctx = audioCtxRef.current;
      if (!ctx) {
        ctx = new AudioContext({ sampleRate: 44100 });
        audioCtxRef.current = ctx;
      }

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const mp = masterPitchRef.current;

      // If paused, just resume
      if (playbackState === "paused") {
        startTimeRef.current = ctx.currentTime;
        placedSamplesRef.current = placedSamples;
        // Re-schedule remaining samples
        const offset = pauseOffsetRef.current;
        stopAll();

        for (const ps of placedSamples) {
          const sample = getSampleById(ps.sampleId);
          if (!sample) continue;

          const sampleEndMs = ps.startMs + ps.durationMs;
          if (sampleEndMs <= offset) continue;

          const buffer = await loadAudioBuffer(ctx, sample.fileUrl);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = ps.pitch * mp;
          source.connect(ctx.destination);

          const delayMs = Math.max(0, ps.startMs - offset);
          const startOffset = Math.max(0, offset - ps.startMs) / 1000 * ps.pitch * mp;
          source.start(ctx.currentTime + delayMs / 1000 / mp, startOffset);
          sourcesRef.current.push(source);
        }

        setPlaybackState("playing");
        rafRef.current = requestAnimationFrame(updateTime);
        return;
      }

      // Fresh play
      stopAll();
      pauseOffsetRef.current = 0;
      startTimeRef.current = ctx.currentTime;
      loopCountRef.current = 0;
      placedSamplesRef.current = placedSamples;

      for (const ps of placedSamples) {
        const sample = getSampleById(ps.sampleId);
        if (!sample) continue;

        const buffer = await loadAudioBuffer(ctx, sample.fileUrl);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = ps.pitch * mp;
        source.connect(ctx.destination);
        source.start(ctx.currentTime + ps.startMs / 1000 / mp);
        sourcesRef.current.push(source);
      }

      setPlaybackState("playing");
      rafRef.current = requestAnimationFrame(updateTime);
    },
    [playbackState, getSampleById, stopAll, updateTime]
  );

  const pause = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    pauseOffsetRef.current += (ctx.currentTime - startTimeRef.current) * 1000;
    stopAll();
    setPlaybackState("paused");
  }, [stopAll]);

  const stop = useCallback(() => {
    stopAll();
    pauseOffsetRef.current = 0;
    loopCountRef.current = 0;
    setCurrentTimeMs(0);
    setTotalElapsedMs(0);
    setPlaybackState("stopped");
  }, [stopAll]);

  const previewSample = useCallback(async (fileUrl: string, onEnded?: () => void) => {
    const ctx = new AudioContext({ sampleRate: 44100 });
    const buffer = await loadAudioBuffer(ctx, fileUrl);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    source.onended = () => {
      ctx.close();
      onEnded?.();
    };
    return () => {
      try {
        source.stop();
        ctx.close();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return {
    playbackState,
    currentTimeMs,
    totalElapsedMs,
    play,
    pause,
    stop,
    previewSample,
  };
}
