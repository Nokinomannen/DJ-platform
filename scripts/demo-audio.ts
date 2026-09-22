/**
 * Synthesises short demo loops (kick, hi-hat, bass, chord stabs) as WAV files so the
 * seeded profiles have something playable without shipping copyrighted audio.
 */
const SAMPLE_RATE = 22050;

type Style = { bpm: number; rootHz: number; seconds: number; swing?: number; minor?: boolean };

function writeWav(samples: Float32Array) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buffer;
}

export function renderDemoLoop({ bpm, rootHz, seconds, swing = 0, minor = true }: Style) {
  const total = Math.floor(seconds * SAMPLE_RATE);
  const out = new Float32Array(total);
  const beat = (60 / bpm) * SAMPLE_RATE;
  const sixteenth = beat / 4;
  const third = minor ? 1.1892 : 1.2599;
  const chord = [1, third, 1.4983];
  const bassPattern = [1, 1, 1.4983, 1, 0.8909, 1, 1.3348, 1];

  // Deterministic noise so every seed run produces identical files.
  let seed = Math.round(bpm * 1000 + rootHz);
  const noise = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 2147483648 - 1;
  };

  for (let step = 0; step * sixteenth < total; step++) {
    const start = Math.floor(step * sixteenth + (step % 2 === 1 ? swing * sixteenth : 0));
    const inBeat = step % 4;
    const bar = Math.floor(step / 16);

    if (inBeat === 0) {
      // Kick: pitch-swept sine.
      const len = Math.floor(0.35 * SAMPLE_RATE);
      let phase = 0;
      for (let i = 0; i < len && start + i < total; i++) {
        const t = i / SAMPLE_RATE;
        phase += (2 * Math.PI * (45 + 110 * Math.exp(-t * 30))) / SAMPLE_RATE;
        out[start + i]! += Math.sin(phase) * Math.exp(-t * 7) * 0.9;
      }
    }

    // Hi-hats on the off-beats, softer ghost notes on the rest.
    const hatGain = inBeat === 2 ? 0.28 : 0.08;
    const hatLen = Math.floor((inBeat === 2 ? 0.09 : 0.03) * SAMPLE_RATE);
    let prev = 0;
    for (let i = 0; i < hatLen && start + i < total; i++) {
      const n = noise();
      const high = n - prev;
      prev = n;
      out[start + i]! += high * Math.exp(-(i / SAMPLE_RATE) * 60) * hatGain;
    }

    if (inBeat === 2 || inBeat === 3) {
      // Rolling bass on the off-beat sixteenths.
      const freq = (rootHz / 2) * bassPattern[(bar * 2 + (inBeat === 3 ? 1 : 0)) % bassPattern.length]!;
      const len = Math.floor(sixteenth * 0.9);
      for (let i = 0; i < len && start + i < total; i++) {
        const t = i / SAMPLE_RATE;
        const saw = 2 * ((t * freq) % 1) - 1;
        out[start + i]! += (Math.sin(2 * Math.PI * freq * t) * 0.6 + saw * 0.15) * Math.exp(-t * 6) * 0.45;
      }
    }

    if (step % 16 === 6 || step % 16 === 14) {
      // Chord stab.
      const len = Math.floor(0.25 * SAMPLE_RATE);
      for (let i = 0; i < len && start + i < total; i++) {
        const t = i / SAMPLE_RATE;
        let v = 0;
        for (const ratio of chord) v += Math.sin(2 * Math.PI * rootHz * 2 * ratio * t);
        out[start + i]! += (v / chord.length) * Math.exp(-t * 9) * 0.22;
      }
    }
  }

  // Fade in/out and normalise.
  const fade = Math.floor(0.5 * SAMPLE_RATE);
  let peak = 0;
  for (let i = 0; i < total; i++) {
    const gain = Math.min(1, i / fade, (total - i) / fade);
    out[i]! *= gain;
    peak = Math.max(peak, Math.abs(out[i]!));
  }
  if (peak > 0) for (let i = 0; i < total; i++) out[i]! *= 0.9 / peak;

  return writeWav(out);
}
