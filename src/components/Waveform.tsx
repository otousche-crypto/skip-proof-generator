"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCompositionStore, snapToGrid } from "@/store/composition";
import { useWaveformPeaksStore } from "@/store/waveformPeaks";
import type { Sample } from "@/types";
import type { PlaybackState } from "@/hooks/useAudioEngine";

const TOTAL_MS = 1818; // 33⅓ RPM
const HANDLE_HIT_ZONE = 10; // px from edge to trigger resize

type DragMode =
  | { type: "move"; id: string; offsetMs: number }
  | { type: "resize"; id: string };

export function Waveform({
  samples,
  playbackState,
  currentTimeMs,
}: {
  samples: Sample[];
  playbackState: PlaybackState;
  currentTimeMs: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const composition = useCompositionStore((s) => s.composition);
  const selectedId = useCompositionStore((s) => s.selectedPlacedSampleId);
  const selectSample = useCompositionStore((s) => s.selectSample);
  const moveSample = useCompositionStore((s) => s.moveSample);
  const updatePitch = useCompositionStore((s) => s.updatePitch);
  const resizeSample = useCompositionStore((s) => s.resizeSample);
  const _sampleDurations = useCompositionStore((s) => s._sampleDurations);
  const bpm = useCompositionStore((s) => s.bpm);
  const snapEnabled = useCompositionStore((s) => s.snapEnabled);

  const peaksMap = useWaveformPeaksStore((s) => s.peaks);
  const sampleMap = new Map(samples.map((s) => [s.id, s]));

  const dragRef = useRef<DragMode | null>(null);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, w, h);

    // Full timeline background
    ctx.fillStyle = "#252525";
    ctx.fillRect(0, 4, w, h - 8);

    // Beat grid lines: thick for strong beats, thin for half-beats
    const beatIntervalMs = 60000 / bpm;
    const halfBeatMs = beatIntervalMs / 2;
    const numHalfBeats = Math.floor(TOTAL_MS / halfBeatMs);
    for (let i = 0; i <= numHalfBeats; i++) {
      const ms = i * halfBeatMs;
      const x = (ms / TOTAL_MS) * w;
      const isBeat = i % 2 === 0;
      if (isBeat) {
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 4);
        ctx.lineTo(x, h - 4);
        ctx.stroke();
      }
    }

    // Draw sample blocks
    for (const ps of composition.placedSamples) {
      const sample = sampleMap.get(ps.sampleId);
      if (!sample) continue;

      const x = (ps.startMs / TOTAL_MS) * w;
      const blockW = (ps.durationMs / TOTAL_MS) * w;
      const isSelected = ps.id === selectedId;

      // Block fill
      ctx.fillStyle = sample.color;
      ctx.fillRect(x, 4, blockW, h - 8);

      // Selection highlight
      if (isSelected) {
        ctx.strokeStyle = "#7C3AED";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 4, blockW, h - 8);
      }

      // Real waveform from audio peaks
      const peaks = sample ? peaksMap.get(sample.fileUrl) : undefined;
      if (peaks) {
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 1.5;
        const midY = h / 2;
        const maxAmp = (h - 8) * 0.45;
        ctx.beginPath();
        for (let px = 0; px < blockW; px += 2) {
          const peakIdx = Math.min(
            Math.floor((px / blockW) * peaks.length),
            peaks.length - 1
          );
          const amp = peaks[peakIdx] * maxAmp;
          ctx.moveTo(x + px, midY - amp);
          ctx.lineTo(x + px, midY + amp);
        }
        ctx.stroke();
      }

      // Label
      if (blockW > 30) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.fillText(sample.name, x + 4, h / 2 + 3);
      }

      // Handles — only on selected sample
      if (isSelected) {
        // Left handle (move) — white circle with cross
        const lhX = x + 1;
        const lhY = h / 2;
        const hr = 8;

        ctx.beginPath();
        ctx.arc(lhX, lhY, hr, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#0a0a0a";
        ctx.lineWidth = 0.75;
        ctx.stroke();

        // Arrow icon (4-direction move)
        ctx.strokeStyle = "#0a0a0a";
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const as = 4; // arrow half-size
        const at = 1.8; // arrowhead size
        ctx.beginPath();
        // Horizontal line
        ctx.moveTo(lhX - as, lhY);
        ctx.lineTo(lhX + as, lhY);
        // Vertical line
        ctx.moveTo(lhX, lhY - as);
        ctx.lineTo(lhX, lhY + as);
        // Left arrowhead
        ctx.moveTo(lhX - as + at, lhY - at);
        ctx.lineTo(lhX - as, lhY);
        ctx.lineTo(lhX - as + at, lhY + at);
        // Right arrowhead
        ctx.moveTo(lhX + as - at, lhY - at);
        ctx.lineTo(lhX + as, lhY);
        ctx.lineTo(lhX + as - at, lhY + at);
        // Up arrowhead
        ctx.moveTo(lhX - at, lhY - as + at);
        ctx.lineTo(lhX, lhY - as);
        ctx.lineTo(lhX + at, lhY - as + at);
        // Down arrowhead
        ctx.moveTo(lhX - at, lhY + as - at);
        ctx.lineTo(lhX, lhY + as);
        ctx.lineTo(lhX + at, lhY + as - at);
        ctx.stroke();

        // Right handle (resize/pitch) — colored circle with arrows
        const rhX = x + blockW - 1;
        const rhY = h / 2;

        ctx.beginPath();
        ctx.arc(rhX, rhY, hr, 0, Math.PI * 2);
        ctx.fillStyle = sample.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 0.75;
        ctx.stroke();

        // +/- pitch icon
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+/−", rhX, rhY + 0.5);
      } else {
        // Drag handle hint (vertical dots on left edge)
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        for (let dy = h * 0.25; dy < h * 0.75; dy += 6) {
          ctx.fillRect(x + 2, dy, 2, 2);
        }
      }
    }

    // Playback cursor
    if (playbackState !== "stopped") {
      const cursorX = (currentTimeMs / TOTAL_MS) * w;
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, h);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [composition, selectedId, playbackState, currentTimeMs, sampleMap, bpm, peaksMap]);

  const pxToMs = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(TOTAL_MS, ratio * TOTAL_MS));
  }, []);

  const findSampleAtPx = useCallback(
    (clientX: number): { ps: (typeof composition.placedSamples)[0]; zone: "move" | "resize" } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const px = clientX - rect.left;

      for (const ps of composition.placedSamples) {
        const x = (ps.startMs / TOTAL_MS) * w;
        const blockW = (ps.durationMs / TOTAL_MS) * w;

        if (px >= x && px <= x + blockW) {
          // If selected, check if near right edge for resize
          if (ps.id === selectedId && px >= x + blockW - HANDLE_HIT_ZONE) {
            return { ps, zone: "resize" };
          }
          return { ps, zone: "move" };
        }
      }
      return null;
    },
    [composition.placedSamples, selectedId]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const hit = findSampleAtPx(e.clientX);
      if (hit) {
        e.stopPropagation();
        e.preventDefault();
        const canvas = canvasRef.current;
        if (canvas) canvas.setPointerCapture(e.pointerId);
        selectSample(hit.ps.id);
        if (hit.zone === "resize") {
          dragRef.current = { type: "resize", id: hit.ps.id };
        } else {
          const ms = pxToMs(e.clientX);
          dragRef.current = { type: "move", id: hit.ps.id, offsetMs: ms - hit.ps.startMs };
        }
      } else {
        selectSample(null);
      }
    },
    [findSampleAtPx, pxToMs, selectSample]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const drag = dragRef.current;
      if (drag) {
        const ms = pxToMs(e.clientX);

        if (drag.type === "move") {
          let targetMs = ms - drag.offsetMs;
          if (snapEnabled) {
            targetMs = snapToGrid(targetMs, bpm);
          }
          moveSample(drag.id, targetMs);
          canvas.style.cursor = "grabbing";
        } else {
          // Resize: change pitch
          const ps = composition.placedSamples.find((s) => s.id === drag.id);
          if (!ps) return;

          let endMs = ms;
          if (snapEnabled) {
            endMs = snapToGrid(endMs, bpm);
          }
          const newDurationMs = endMs - ps.startMs;
          if (newDurationMs < 20) return;

          const originalDuration = _sampleDurations.get(ps.sampleId) ?? ps.durationMs;
          const newPitch = originalDuration / newDurationMs;
          if (newPitch < 0.2 || newPitch > 5) return;

          resizeSample(drag.id, newDurationMs);
          canvas.style.cursor = "ew-resize";
        }
        return;
      }

      // Hover cursor
      const hit = findSampleAtPx(e.clientX);
      if (hit) {
        canvas.style.cursor = hit.zone === "resize" ? "ew-resize" : "grab";
      } else {
        canvas.style.cursor = "default";
      }
    },
    [pxToMs, findSampleAtPx, moveSample, updatePitch, composition.placedSamples, _sampleDurations, snapEnabled, bpm]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = "default";
    }
  }, []);

  return (
    <div className="mx-4 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-14 md:h-20"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}
