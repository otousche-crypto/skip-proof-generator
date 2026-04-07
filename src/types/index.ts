export type Category =
  | "Classic FX"
  | "Sentences"
  | "Words";

export type Sample = {
  id: string;
  name: string;
  category: Category;
  fileUrl: string;
  durationMs: number;
  color: string;
};

export type PlacedSample = {
  id: string;
  sampleId: string;
  pitch: number;
  durationMs: number; // sample.durationMs / pitch
  startMs: number; // sum of previous placed samples' durationMs
};

export type Composition = {
  totalDurationMs: 1818;
  placedSamples: PlacedSample[];
  usedMs: number;
  remainingMs: number;
};

export type SavedCompositionData = {
  placedSamples: PlacedSample[];
  bpm: number;
  loopMode: "2bars" | "3bars" | "4bars";
  masterPitch: number;
};

export type SavedComposition = {
  id: string;
  user_id: string;
  name: string;
  data: SavedCompositionData;
  created_at: string;
  updated_at: string;
};
