import { create } from "zustand";
import { loadAudioBuffer } from "@/lib/audioBufferCache";
import { computePeaks } from "@/lib/waveformPeaks";

interface WaveformPeaksStore {
  peaks: Map<string, Float32Array>;
  _loading: Set<string>;
  loadPeaks: (fileUrl: string) => Promise<void>;
}

export const useWaveformPeaksStore = create<WaveformPeaksStore>((set, get) => ({
  peaks: new Map(),
  _loading: new Set(),

  loadPeaks: async (fileUrl: string) => {
    const state = get();
    if (state.peaks.has(fileUrl) || state._loading.has(fileUrl)) return;

    state._loading.add(fileUrl);

    try {
      const audioBuffer = await loadAudioBuffer(null, fileUrl);
      const peakData = computePeaks(audioBuffer);
      set({ peaks: new Map(get().peaks).set(fileUrl, peakData) });
    } catch (err) {
      console.error("Failed to load peaks for", fileUrl, err);
    } finally {
      state._loading.delete(fileUrl);
    }
  },
}));
