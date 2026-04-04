/**
 * Generates placeholder MP3 audio files for all samples in samples.json.
 * Each file is a short sine wave beep at a unique frequency per category.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";

const SAMPLE_RATE = 44100;

const categoryFreqs = {
  Classic: 440,
  "Sound Effect": 880,
  Acapella: 330,
  Movie: 550,
  Drums: 220,
  Bass: 110,
  Stabs: 660,
};

function generateWav(durationMs, frequency) {
  const numSamples = Math.floor((durationMs / 1000) * SAMPLE_RATE);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // WAV header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate sine wave with fade in/out
  const fadeLength = Math.min(numSamples * 0.1, 500);
  for (let i = 0; i < numSamples; i++) {
    let amplitude = 0.5;
    if (i < fadeLength) amplitude *= i / fadeLength;
    if (i > numSamples - fadeLength)
      amplitude *= (numSamples - i) / fadeLength;

    const sample = Math.sin((2 * Math.PI * frequency * i) / SAMPLE_RATE);
    const value = Math.round(sample * amplitude * 32767);
    buffer.writeInt16LE(value, headerSize + i * 2);
  }

  return buffer;
}

const samplesPath = join(
  import.meta.dirname,
  "..",
  "public",
  "samples",
  "samples.json"
);
const samples = JSON.parse(readFileSync(samplesPath, "utf8"));

let count = 0;
for (const sample of samples) {
  // fileUrl is like /samples/classic/aaah.mp3, but we'll save as .wav
  // Actually, let's save as .mp3 extension but WAV content - browsers handle it
  // Better: save as actual WAV and update fileUrl... No, let's keep .mp3 extension
  // The browser will play WAV content regardless of extension
  const filePath = join(import.meta.dirname, "..", "public", sample.fileUrl);
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  const freq = categoryFreqs[sample.category] || 440;
  // Add slight variation per sample within category
  const variation = (parseInt(sample.id.split("_")[1]) * 37) % 200;
  const wav = generateWav(sample.durationMs, freq + variation);
  writeFileSync(filePath, wav);
  count++;
}

console.log(`Generated ${count} placeholder audio files.`);
