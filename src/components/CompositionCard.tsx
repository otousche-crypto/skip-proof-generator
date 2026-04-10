"use client";

import type { Sample, SavedComposition } from "@/types";
import { useTranslation } from "@/i18n/LanguageContext";

const TOTAL_MS = 1800;
const CENTER = 50;
const RADIUS = 46;
const INNER_RADIUS = 12;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
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

function msToAngle(ms: number): number {
  return ((TOTAL_MS - ms) / TOTAL_MS) * 360;
}

interface CompositionCardProps {
  composition: SavedComposition;
  samples: Sample[];
  onLoad: (composition: SavedComposition) => void;
  onDelete: (id: string) => void;
}

export function CompositionCard({
  composition,
  samples,
  onLoad,
  onDelete,
}: CompositionCardProps) {
  const { t } = useTranslation();
  const sampleCount = composition.data.placedSamples?.length ?? 0;
  const date = new Date(composition.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const sampleMap = new Map(samples.map((s) => [s.id, s]));
  const placedSamples = composition.data.placedSamples ?? [];

  // Compute empty space end
  const lastSample = placedSamples[placedSamples.length - 1];
  const endMs = lastSample ? lastSample.startMs + lastSample.durationMs : 0;

  return (
    <div className="bg-surface-alt rounded-[var(--radius)] border border-border p-4 flex flex-col items-center gap-3">
      {/* Mini vinyl */}
      <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
        {/* Disc background */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#1a1a1a" />

        {/* Sample arcs */}
        {placedSamples.map((ps, i) => {
          const sample = sampleMap.get(ps.sampleId);
          const color = sample?.color ?? "#666";
          const startAngle = msToAngle(ps.startMs + ps.durationMs);
          const endAngle = msToAngle(ps.startMs);
          return (
            <path
              key={i}
              d={arcPath(startAngle, endAngle, RADIUS, INNER_RADIUS)}
              fill={color}
              stroke="#0a0a0a"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Empty space */}
        {endMs < TOTAL_MS && (
          <path
            d={arcPath(0, msToAngle(endMs), RADIUS, INNER_RADIUS)}
            fill="#2a2a2a"
          />
        )}

        {/* Center hole */}
        <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="#0a0a0a" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS - 1}
          fill="none"
          stroke="#2a2a2a"
          strokeWidth={0.5}
        />

        {/* Grooves */}
        {[18, 26, 34, 42].map((r) => (
          <circle
            key={r}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="#ffffff08"
            strokeWidth={0.3}
          />
        ))}
      </svg>

      {/* Info */}
      <div className="w-full text-center">
        <h3 className="text-sm font-medium text-text truncate">
          {composition.name}
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          {date} · {sampleCount} sample{sampleCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={() => onLoad(composition)}
          className="flex-1 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{
            backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
          }}
        >
          {t.card.load}
        </button>
        <button
          onClick={() => onDelete(composition.id)}
          className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors"
        >
          {t.card.delete}
        </button>
      </div>
    </div>
  );
}
