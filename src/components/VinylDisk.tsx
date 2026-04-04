"use client";

import { useCallback, useRef, useState } from "react";
import { useCompositionStore, snapToGrid } from "@/store/composition";
import { useWaveformPeaksStore } from "@/store/waveformPeaks";
import type { Sample } from "@/types";
import type { PlaybackState } from "@/hooks/useAudioEngine";

const TOTAL_MS = 1800; // 33⅓ RPM: 60000ms / 33.333 = 1800ms per revolution
const CENTER = 150;
const RADIUS = 130;
const INNER_RADIUS = 30;
const MID_RADIUS = (RADIUS + INNER_RADIUS) / 2;
const WAVE_MAX_AMP = (RADIUS - INNER_RADIUS) / 2 - 4;
const HANDLE_RADIUS = 6;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(startAngle: number, endAngle: number, outerR: number, innerR: number) {
  const outerStart = polarToCartesian(CENTER, CENTER, outerR, startAngle);
  const outerEnd = polarToCartesian(CENTER, CENTER, outerR, endAngle);
  const innerStart = polarToCartesian(CENTER, CENTER, innerR, endAngle);
  const innerEnd = polarToCartesian(CENTER, CENTER, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function waveformLines(
  startAngle: number,
  endAngle: number,
  peaks: Float32Array | undefined
): string {
  const span = endAngle - startAngle;
  if (span < 2 || !peaks) return "";

  const steps = Math.max(8, Math.floor(span / 1.5));
  const lines: string[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const angle = startAngle + t * span;
    const peakIdx = Math.min(Math.floor(t * peaks.length), peaks.length - 1);
    const amp = peaks[peakIdx] * WAVE_MAX_AMP;

    const rInner = MID_RADIUS - amp;
    const rOuter = MID_RADIUS + amp;

    const pInner = polarToCartesian(CENTER, CENTER, rInner, angle);
    const pOuter = polarToCartesian(CENTER, CENTER, rOuter, angle);

    lines.push(`M ${pInner.x} ${pInner.y} L ${pOuter.x} ${pOuter.y}`);
  }

  return lines.join(" ");
}

/** Convert a pointer event to an angle (0-360) relative to the SVG center */
function pointerToAngle(e: PointerEvent, svgEl: SVGSVGElement, rotationDeg: number): number {
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return 0;
  // Convert screen coords to SVG coords
  const pt = svgEl.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const svgPt = pt.matrixTransform(ctm.inverse());

  const dx = svgPt.x - CENTER;
  const dy = svgPt.y - CENTER;
  // atan2 gives angle from positive X axis, we need angle from top (negative Y)
  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  // Subtract the disk rotation so we work in composition space
  angleDeg -= rotationDeg;
  // Normalize to 0-360
  angleDeg = ((angleDeg % 360) + 360) % 360;
  return angleDeg;
}

function msToDiscAngle(ms: number): number {
  return ((TOTAL_MS - ms) / TOTAL_MS) * 360;
}

function angleToMs(angleDeg: number): number {
  return ((360 - angleDeg) / 360) * TOTAL_MS;
}

type DragMode = { type: "move"; sampleId: string; offsetMs: number } | { type: "resize"; sampleId: string };

export function VinylDisk({
  samples,
  playbackState,
  currentTimeMs,
  totalElapsedMs = 0,
}: {
  samples: Sample[];
  playbackState: PlaybackState;
  currentTimeMs: number;
  totalElapsedMs?: number;
}) {
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

  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragMode | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);

  const sampleMap = new Map(samples.map((s) => [s.id, s]));

  const rotationDeg =
    playbackState === "stopped" ? 0 : (totalElapsedMs / TOTAL_MS) * 360;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      const target = e.currentTarget as SVGElement;
      target.setPointerCapture(e.pointerId);
      dragRef.current = mode;
      // Select the sample being dragged
      selectSample(mode.sampleId);
    },
    [selectSample]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !svgRef.current) return;

      const angleDeg = pointerToAngle(e.nativeEvent, svgRef.current, rotationDeg);
      const ms = angleToMs(angleDeg);

      if (drag.type === "move") {
        let targetMs = ms - drag.offsetMs;
        if (snapEnabled) {
          targetMs = snapToGrid(targetMs, bpm);
        }
        moveSample(drag.sampleId, targetMs);
      } else {
        // Resize: change pitch based on new end position
        const ps = composition.placedSamples.find((s) => s.id === drag.sampleId);
        if (!ps) return;

        let endMs = ms;
        if (snapEnabled) {
          endMs = snapToGrid(endMs, bpm);
        }
        let newDurationMs = endMs - ps.startMs;
        // Handle wrapping (if end angle < start angle)
        if (newDurationMs < 0) newDurationMs += TOTAL_MS;
        // Minimum duration
        if (newDurationMs < 20) return;

        const originalDuration = _sampleDurations.get(ps.sampleId) ?? ps.durationMs;
        const newPitch = originalDuration / newDurationMs;
        // Clamp pitch to reasonable range
        if (newPitch < 0.5 || newPitch > 1.5) return;

        resizeSample(drag.sampleId, newDurationMs);
      }
    },
    [rotationDeg, moveSample, updatePitch, composition.placedSamples, _sampleDurations, snapEnabled, bpm]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div className="flex items-center justify-center flex-1 min-h-0">
      <div className="relative h-full max-h-[800px] aspect-square" style={{ transform: "rotate(22deg)" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        className="w-full h-full"
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          transition:
            playbackState === "stopped" ? "transform 0.3s ease" : "none",
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          {composition.placedSamples.map((ps) => {
            const startAngle = msToDiscAngle(ps.startMs + ps.durationMs);
            const endAngle = msToDiscAngle(ps.startMs);
            return (
              <clipPath key={`clip-${ps.id}`} id={`clip-${ps.id}`}>
                <path d={arcPath(startAngle, endAngle, RADIUS, INNER_RADIUS)} />
              </clipPath>
            );
          })}
        </defs>

        {/* Background disc — click to deselect */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#1a1a1a" onClick={() => selectSample(null)} />

        {/* Sample slices */}
        {composition.placedSamples.map((ps) => {
          const sample = sampleMap.get(ps.sampleId);
          if (!sample) return null;

          const startAngle = msToDiscAngle(ps.startMs + ps.durationMs);
          const endAngle = msToDiscAngle(ps.startMs);
          const isSelected = selectedId === ps.id;
          const peaks = peaksMap.get(sample.fileUrl);

          // Handle positions at mid-radius on the arc edges
          const startHandlePos = polarToCartesian(CENTER, CENTER, MID_RADIUS, endAngle);
          const endHandlePos = polarToCartesian(CENTER, CENTER, MID_RADIUS, startAngle);

          const startHandleId = `start-${ps.id}`;
          const endHandleId = `end-${ps.id}`;

          return (
            <g key={ps.id}>
              {/* Colored arc background */}
              <path
                d={arcPath(startAngle, endAngle, RADIUS, INNER_RADIUS)}
                fill={sample.color}
                stroke={isSelected ? "#7C3AED" : "#0a0a0a"}
                strokeWidth={isSelected ? 2 : 0.5}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); selectSample(ps.id); }}
                style={
                  isSelected
                    ? { filter: "drop-shadow(0 0 6px #7C3AED)" }
                    : undefined
                }
              />

              {/* Waveform lines */}
              <path
                d={waveformLines(startAngle, endAngle, peaks)}
                fill="none"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={1.5}
                strokeLinecap="round"
                clipPath={`url(#clip-${ps.id})`}
                className="pointer-events-none"
              />

              {/* Handles rendered in overlay layer below */}
            </g>
          );
        })}

        {/* Empty space arc */}
        {(() => {
          const last =
            composition.placedSamples[composition.placedSamples.length - 1];
          const endMs = last ? last.startMs + last.durationMs : 0;
          return endMs < TOTAL_MS ? (
            <path
              d={arcPath(0, msToDiscAngle(endMs), RADIUS, INNER_RADIUS)}
              fill="#2a2a2a"
              stroke="none"
              className="cursor-pointer"
              onClick={() => selectSample(null)}
            />
          ) : null;
        })()}

        {/* Center hole */}
        <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="#0a0a0a" onClick={() => selectSample(null)} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS - 2}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={1}
        />

        {/* Grooves */}
        {[50, 70, 90, 110].map((r) => (
          <circle
            key={r}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="#ffffff08"
            strokeWidth={0.5}
          />
        ))}

        {/* Beat grid lines (beats + half-beats) */}
        {(() => {
          const beatIntervalMs = 60000 / bpm;
          const halfBeatMs = beatIntervalMs / 2;
          const numHalfBeats = Math.round(TOTAL_MS / halfBeatMs);
          const lines: React.ReactElement[] = [];
          for (let i = 0; i < numHalfBeats; i++) {
            const ms = i * halfBeatMs;
            const angle = msToDiscAngle(ms);
            const isBeat = i % 2 === 0;
            const outerR = isBeat ? RADIUS + 4 : RADIUS - 1;
            const innerR = isBeat ? INNER_RADIUS - 3 : INNER_RADIUS + 1;
            const outer = polarToCartesian(CENTER, CENTER, outerR, angle);
            const inner = polarToCartesian(CENTER, CENTER, innerR, angle);
            lines.push(
              <line
                key={`beat-${i}`}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={isBeat ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)"}
                strokeWidth={isBeat ? 1 : 0.5}
                className="pointer-events-none"
              />
            );
          }
          return lines;
        })()}

        {/* Handle overlay — rendered last so handles are never clipped */}
        {composition.placedSamples.map((ps) => {
          if (selectedId !== ps.id) return null;
          const sample = sampleMap.get(ps.sampleId);
          if (!sample) return null;

          const startAngle = msToDiscAngle(ps.startMs + ps.durationMs);
          const endAngle = msToDiscAngle(ps.startMs);
          const startHandlePos = polarToCartesian(CENTER, CENTER, MID_RADIUS, endAngle);
          const endHandlePos = polarToCartesian(CENTER, CENTER, MID_RADIUS, startAngle);
          const startHandleId = `start-${ps.id}`;
          const endHandleId = `end-${ps.id}`;

          return (
            <g key={`handles-${ps.id}`} onClick={(e) => e.stopPropagation()}>
              {/* Start handle — move sample */}
              <circle
                cx={startHandlePos.x}
                cy={startHandlePos.y}
                r={hoveredHandle === startHandleId ? HANDLE_RADIUS + 1 : HANDLE_RADIUS}
                fill="#ffffff"
                stroke="#0a0a0a"
                strokeWidth={0.75}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => {
                  const offsetAngle = pointerToAngle(e.nativeEvent, svgRef.current!, rotationDeg);
                  const offsetMs = angleToMs(offsetAngle) - ps.startMs;
                  handlePointerDown(e, { type: "move", sampleId: ps.id, offsetMs });
                }}
                onPointerEnter={() => setHoveredHandle(startHandleId)}
                onPointerLeave={() => setHoveredHandle(null)}
              />
              {/* Arrow move icon */}
              <g
                transform={`translate(${startHandlePos.x}, ${startHandlePos.y})`}
                className="pointer-events-none"
              >
                <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#0a0a0a" strokeWidth={0.7} strokeLinecap="round" />
                <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#0a0a0a" strokeWidth={0.7} strokeLinecap="round" />
                <polyline points="-2,1.5 -3.5,0 -2,-1.5" fill="none" stroke="#0a0a0a" strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="2,1.5 3.5,0 2,-1.5" fill="none" stroke="#0a0a0a" strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="-1.5,-2 0,-3.5 1.5,-2" fill="none" stroke="#0a0a0a" strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="-1.5,2 0,3.5 1.5,2" fill="none" stroke="#0a0a0a" strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* End handle — resize / pitch */}
              <circle
                cx={endHandlePos.x}
                cy={endHandlePos.y}
                r={hoveredHandle === endHandleId ? HANDLE_RADIUS + 1 : HANDLE_RADIUS}
                fill={sample.color}
                stroke="#ffffff"
                strokeWidth={0.75}
                className="cursor-ew-resize"
                onPointerDown={(e) => {
                  handlePointerDown(e, { type: "resize", sampleId: ps.id });
                }}
                onPointerEnter={() => setHoveredHandle(endHandleId)}
                onPointerLeave={() => setHoveredHandle(null)}
              />
              <text
                x={endHandlePos.x}
                y={endHandlePos.y + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize="8"
                fontWeight="bold"
                fontFamily="Inter, sans-serif"
                className="pointer-events-none"
              >+/−</text>
            </g>
          );
        })}
      </svg>
      {/* Needle line — fixed, does not rotate */}
      <div
        className="absolute left-1/2 top-0 h-1/2 pointer-events-none"
        style={{ width: 2, transform: "translateX(-50%)" }}
      >
        <div className="w-full h-full bg-orange-500 opacity-90" />
      </div>
      </div>
    </div>
  );
}
