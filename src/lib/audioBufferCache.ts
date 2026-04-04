const audioBufferCache = new Map<string, AudioBuffer>();

let sharedCtx: AudioContext | null = null;

function getOrCreateCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AudioContext({ sampleRate: 44100 });
  }
  return sharedCtx;
}

export async function loadAudioBuffer(
  ctx: AudioContext | null,
  url: string
): Promise<AudioBuffer> {
  const cached = audioBufferCache.get(url);
  if (cached) return cached;

  const audioCtx = ctx ?? getOrCreateCtx();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioBufferCache.set(url, audioBuffer);
  return audioBuffer;
}
