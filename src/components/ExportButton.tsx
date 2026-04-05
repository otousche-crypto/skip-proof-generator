"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useCompositionStore } from "@/store/composition";
import type { Sample } from "@/types";

type ExportFormat = "mp3" | "wav";

function loadLameJs(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).lamejs) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "/lib/lame.all.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load lamejs"));
    document.head.appendChild(script);
  });
}

function ExportModal({
  samples,
  onClose,
}: {
  samples: Sample[];
  onClose: () => void;
}) {
  const composition = useCompositionStore((s) => s.composition);
  const [trackName, setTrackName] = useState("skip-proof");
  const [loops, setLoops] = useState(10);
  const [format, setFormat] = useState<ExportFormat>("mp3");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const backdropRef = useRef<HTMLDivElement>(null);

  const sampleMap = new Map(samples.map((s) => [s.id, s]));

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exporting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, exporting]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current && !exporting) onClose();
  };

  const handleExport = useCallback(async () => {
    if (composition.placedSamples.length === 0) return;
    setExporting(true);
    setProgress(0);

    try {
      const sampleRate = 44100;
      const singleLoopFrames = Math.ceil((1818 / 1000) * sampleRate);
      const totalFrames = singleLoopFrames * loops;
      const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

      // Schedule all samples for each loop iteration
      for (let loop = 0; loop < loops; loop++) {
        const loopOffsetSec = (loop * 1818) / 1000;
        for (const ps of composition.placedSamples) {
          const sample = sampleMap.get(ps.sampleId);
          if (!sample) continue;

          const response = await fetch(sample.fileUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);

          const source = offlineCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.playbackRate.value = ps.pitch;
          source.connect(offlineCtx.destination);
          source.start(loopOffsetSec + ps.startMs / 1000);
        }
        setProgress(Math.round(((loop + 1) / loops) * 30));
      }

      setProgress(40);
      const renderedBuffer = await offlineCtx.startRendering();
      setProgress(60);

      const leftChannel = renderedBuffer.getChannelData(0);
      const rightChannel =
        renderedBuffer.numberOfChannels > 1
          ? renderedBuffer.getChannelData(1)
          : leftChannel;

      let blob: Blob;
      let ext: string;

      if (format === "wav") {
        blob = encodeWav(leftChannel, rightChannel, sampleRate);
        ext = "wav";
        setProgress(100);
      } else {
        await loadLameJs();
        const lamejs = // eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).lamejs as {
          Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => {
            encodeBuffer(left: Int16Array, right: Int16Array): Int8Array;
            flush(): Int8Array;
          };
        };
        const mp3Encoder = new lamejs.Mp3Encoder(2, sampleRate, 192);
        const blockSize = 1152;
        const mp3Data: Int8Array[] = [];

        for (let i = 0; i < leftChannel.length; i += blockSize) {
          const leftChunk = new Int16Array(blockSize);
          const rightChunk = new Int16Array(blockSize);
          for (let j = 0; j < blockSize && i + j < leftChannel.length; j++) {
            leftChunk[j] = Math.max(
              -32768,
              Math.min(32767, leftChannel[i + j] * 32768)
            );
            rightChunk[j] = Math.max(
              -32768,
              Math.min(32767, rightChannel[i + j] * 32768)
            );
          }
          const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
          if (mp3buf.length > 0) mp3Data.push(mp3buf);

          setProgress(
            60 + Math.round((i / leftChannel.length) * 40)
          );
        }

        const end = mp3Encoder.flush();
        if (end.length > 0) mp3Data.push(end);
        blob = new Blob(mp3Data as BlobPart[], { type: "audio/mp3" });
        ext = "mp3";
        setProgress(100);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trackName || "skip-proof"}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [composition.placedSamples, sampleMap, loops, format, trackName, onClose]);

  const totalDurationSec = ((1818 * loops) / 1000).toFixed(1);

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div
        className="bg-surface rounded-[var(--radius)] w-full max-w-md mx-3 md:mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2
            className="text-base font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #FF6B00, #7C3AED)",
            }}
          >
            Exporter
          </h2>
          {!exporting && (
            <button
              onClick={onClose}
              className="text-text-muted hover:text-foreground transition-colors text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Track name */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
              Nom de la piste
            </label>
            <input
              type="text"
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="skip-proof"
              disabled={exporting}
              className="w-full bg-surface-alt rounded-[var(--radius-sm)] px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-orange disabled:opacity-50"
            />
          </div>

          {/* Loops */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
              Nombre de loops
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={50}
                value={loops}
                onChange={(e) => setLoops(Number(e.target.value))}
                disabled={exporting}
                className="flex-1 accent-accent-orange"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={loops}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 1 && v <= 100) setLoops(v);
                }}
                disabled={exporting}
                className="w-16 bg-surface-alt rounded-[var(--radius-sm)] px-2 py-2 text-sm text-foreground text-center font-mono focus:outline-none focus:ring-1 focus:ring-accent-orange disabled:opacity-50"
              />
            </div>
            <div className="text-xs text-text-muted font-mono mt-1">
              Durée totale : {totalDurationSec}s
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
              Format
            </label>
            <div className="flex gap-2">
              {(["mp3", "wav"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  disabled={exporting}
                  className={`flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-bold uppercase transition-all ${
                    format === f
                      ? "text-accent-orange bg-accent-orange/15 ring-1 ring-accent-orange"
                      : "text-text-muted hover:text-text bg-surface-alt"
                  } disabled:opacity-50`}
                >
                  .{f}
                </button>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          {exporting && (
            <div>
              <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, #FF6B00, #7C3AED)",
                  }}
                />
              </div>
              <div className="text-xs text-text-muted font-mono text-center mt-1.5">
                Export en cours... {progress}%
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={exporting}
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-bold bg-surface-alt text-text-muted hover:text-text transition-colors disabled:opacity-30"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 px-4 py-2.5 rounded-[var(--radius-sm)] text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FF6B00, #7C3AED)",
            }}
          >
            {exporting ? "Export..." : "Télécharger"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Encode raw PCM data as a WAV Blob */
function encodeWav(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number
): Blob {
  const numChannels = 2;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = left.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < left.length; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
    offset += 2;
    view.setInt16(offset, r < 0 ? r * 0x8000 : r * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function ExportButton({ samples }: { samples: Sample[] }) {
  const composition = useCompositionStore((s) => s.composition);
  const [showModal, setShowModal] = useState(false);

  const disabled = composition.placedSamples.length === 0;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className="px-4 py-2 rounded-[var(--radius-sm)] text-sm font-bold transition-all disabled:opacity-30"
        style={{
          background: disabled
            ? "#2a2a2a"
            : "linear-gradient(135deg, #FF6B00, #7C3AED)",
        }}
      >
        Exporter
      </button>
      {showModal && (
        <ExportModal samples={samples} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
