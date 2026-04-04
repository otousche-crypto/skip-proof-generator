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
