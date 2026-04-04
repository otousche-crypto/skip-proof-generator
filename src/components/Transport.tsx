"use client";

import type { PlaybackState } from "@/hooks/useAudioEngine";

export function Transport({
  playbackState,
  onPlay,
  onPause,
  onStop,
  currentTimeMs,
  disabled,
}: {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  currentTimeMs: number;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-4 py-3">
      {/* Stop */}
      <button
        onClick={onStop}
        disabled={playbackState === "stopped"}
        className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center transition-colors hover:bg-border disabled:opacity-30"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
          <rect x="3" y="3" width="10" height="10" rx="1" />
        </svg>
      </button>

      {/* Play / Pause */}
      {playbackState === "playing" ? (
        <button
          onClick={onPause}
          className="w-12 h-12 rounded-full bg-accent-orange flex items-center justify-center transition-colors hover:brightness-110"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <rect x="3" y="2" width="3.5" height="12" rx="1" />
            <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          onClick={onPlay}
          disabled={disabled}
          className="w-12 h-12 rounded-full bg-accent-orange flex items-center justify-center transition-colors hover:brightness-110 disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <polygon points="4,2 14,8 4,14" />
          </svg>
        </button>
      )}

      {/* Time */}
      <div className="font-mono text-sm text-text-muted min-w-[80px] text-center">
        {(currentTimeMs / 1000).toFixed(2)}s
      </div>
    </div>
  );
}
