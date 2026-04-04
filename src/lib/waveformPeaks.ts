const WAVEFORM_BUCKETS = 256;

export function computePeaks(
  audioBuffer: AudioBuffer,
  numBuckets: number = WAVEFORM_BUCKETS
): Float32Array {
  const channelData = audioBuffer.getChannelData(0);
  const peaks = new Float32Array(numBuckets);
  const samplesPerBucket = channelData.length / numBuckets;

  let globalMax = 0;

  for (let i = 0; i < numBuckets; i++) {
    const start = Math.floor(i * samplesPerBucket);
    const end = Math.floor((i + 1) * samplesPerBucket);
    let max = 0;
    for (let j = start; j < end && j < channelData.length; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks[i] = max;
    if (max > globalMax) globalMax = max;
  }

  if (globalMax > 0) {
    for (let i = 0; i < numBuckets; i++) {
      peaks[i] /= globalMax;
    }
  }

  return peaks;
}
