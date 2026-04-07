"use client";

import { useState, useRef, useCallback } from "react";
import type { Category, Sample } from "@/types";
import { useCompositionStore } from "@/store/composition";

const CATEGORIES: (Category | "All")[] = [
  "All",
  "Classic FX",
  "Sentences",
  "Words",
];

export function SampleLibrary({
  samples,
  previewSample,
  onClose,
}: {
  samples: Sample[];
  previewSample: (url: string, onEnded?: () => void) => Promise<() => void>;
  onClose?: () => void;
}) {
  const [openCategories, setOpenCategories] = useState<Set<Category | "All">>(
    () => new Set(["Classic FX"])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const addSample = useCompositionStore((s) => s.addSample);
  const composition = useCompositionStore((s) => s.composition);
  const stopPreviewRef = useRef<(() => void) | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const toggleCategory = (cat: Category | "All") => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const searchLower = searchQuery.toLowerCase();

  const stopCurrentPreview = useCallback(() => {
    if (stopPreviewRef.current) {
      stopPreviewRef.current();
      stopPreviewRef.current = null;
    }
    setPreviewingId(null);
  }, []);

  const togglePreview = useCallback(
    async (sample: Sample) => {
      if (previewingId === sample.id) {
        stopCurrentPreview();
        return;
      }
      stopCurrentPreview();
      const stop = await previewSample(sample.fileUrl, () => {
        setPreviewingId(null);
        stopPreviewRef.current = null;
      });
      stopPreviewRef.current = stop;
      setPreviewingId(sample.id);
    },
    [previewSample, previewingId, stopCurrentPreview]
  );

  const compositionName = useCompositionStore((s) => s.compositionName);
  const setCompositionName = useCompositionStore((s) => s.setCompositionName);

  return (
    <div className="flex flex-col h-full bg-surface md:rounded-[var(--radius)] overflow-hidden">
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-7 h-7 rounded-full bg-surface-alt flex items-center justify-center text-text-muted hover:text-text"
            >
              ✕
            </button>
          )}
        </div>
        {/* Project name */}
        <input
          type="text"
          value={compositionName}
          onChange={(e) => setCompositionName(e.target.value)}
          className="w-full bg-transparent text-text font-bold text-sm border-b border-transparent hover:border-border focus:border-accent-orange focus:outline-none py-1 truncate"
          placeholder="Nom du projet"
        />
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide uppercase text-text-muted">
            Samples
          </h2>
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-surface-alt rounded-[var(--radius-sm)] px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-orange"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {CATEGORIES.map((cat) => {
          const isOpen = openCategories.has(cat);
          const filtered = samples.filter(
            (s) =>
              (cat === "All" || s.category === cat) &&
              (!searchQuery || s.name.toLowerCase().includes(searchLower))
          );
          return (
            <div key={cat} className="mb-1">
              <button
                onClick={() => toggleCategory(cat)}
                className="flex items-center w-full px-3 py-2 text-left rounded-[var(--radius-sm)] hover:bg-surface-alt transition-colors"
              >
                <span
                  className="text-xs text-text-muted mr-2 transition-transform inline-block"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                >
                  ▶
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-text-muted flex-1">
                  {cat}
                </span>
                <span className="text-xs text-text-muted font-mono">
                  {filtered.length}
                </span>
              </button>
              {isOpen && (
                <div className="space-y-0.5 mt-0.5">
                  {filtered.map((sample) => {
                    return (
                      <div
                        key={sample.id}
                        className="flex items-center gap-2 px-3 pl-7 py-1.5 rounded-[var(--radius-sm)] transition-colors hover:bg-surface-alt"
                      >
                        <button
                          className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-colors ${
                            previewingId === sample.id
                              ? "bg-accent-orange text-black"
                              : "hover:bg-surface-alt"
                          }`}
                          style={{
                            backgroundColor:
                              previewingId === sample.id
                                ? sample.color
                                : undefined,
                            border:
                              previewingId !== sample.id
                                ? `2px solid ${sample.color}`
                                : "none",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePreview(sample);
                          }}
                          title="Pré-écouter"
                        >
                          {previewingId === sample.id ? (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                              <rect x="1" y="1" width="3" height="8" rx="0.5" />
                              <rect x="6" y="1" width="3" height="8" rx="0.5" />
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill={sample.color}>
                              <polygon points="2,0 10,5 2,10" />
                            </svg>
                          )}
                        </button>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => addSample(sample)}
                        >
                          <div className="text-sm font-medium truncate">
                            {sample.name}
                          </div>
                          <div className="text-xs text-text-muted font-mono">
                            {sample.durationMs}ms
                          </div>
                        </div>
                        <button
                          className="text-xs px-2 py-1 rounded-lg font-medium transition-colors bg-accent-orange/20 text-accent-orange hover:bg-accent-orange/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            addSample(sample);
                          }}
                        >
                          +
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2.5 text-xs text-text-muted font-mono">
        {composition.usedMs.toFixed(0)}ms / 1818ms
      </div>
    </div>
  );
}
