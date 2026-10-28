import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "../public/sounds");
fs.mkdirSync(outputDir, { recursive: true });

function createWavHeader(numSamples, sampleRate = 44100) {
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

/**
 * Generate an authentic physical gunshot sound model:
 * 1. Supersonic N-wave sonic boom impulse (0-3ms)
 * 2. Muzzle gas explosive turbulence with non-linear acoustic saturation (3-60ms)
 * 3. Metal chamber & barrel resonant ring (15-90ms)
 * 4. Heavy kinetic low-end displacement shockwave (5-180ms)
 * 5. Diffuse atmospheric decay & ground reflections (50-380ms)
 */
function generateGunshot(options = {}) {
  const sampleRate = 44100;
  const duration = options.duration || 0.42; // ~420ms
  const numSamples = Math.floor(sampleRate * duration);
  const pcmBuffer = Buffer.alloc(numSamples * 2);

  const bassFreqStart = options.bassFreqStart || 210;
  const bassFreqEnd = options.bassFreqEnd || 45;
  const punchDecay = options.punchDecay || 0.12;
  const noiseCutoff = options.noiseCutoff || 0.15;
  const boomGain = options.boomGain || 0.95;

  let bassPhase = 0;
  let barrelPhase1 = 0;
  let barrelPhase2 = 0;

  // Simple stateful IIR lowpass filter for noise
  let lastNoiseSample = 0;
  const noiseFilterCoeff = 0.35 + Math.random() * 0.1;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // 1. Initial Supersonic Shockwave Impulse (0 - 4ms)
    let impulse = 0;
    if (t < 0.0035) {
      const impPhase = (t / 0.0035) * Math.PI * 2;
      // Sharp asymmetric N-wave
      impulse = Math.sin(impPhase) * Math.exp(-t * 800) * 1.4;
    }

    // 2. Explosive Muzzle Blast (Non-linear saturated turbulence)
    const rawNoise = Math.random() * 2 - 1;
    lastNoiseSample = lastNoiseSample + noiseFilterCoeff * (rawNoise - lastNoiseSample);
    const noiseEnvelope = Math.exp(-t / noiseCutoff);
    let blast = lastNoiseSample * noiseEnvelope * 1.1;

    // 3. Heavy Kinetic Bass Shockwave & Chest Punch
    const bassEnvelope = Math.exp(-t / punchDecay);
    const currentBassFreq = bassFreqEnd + (bassFreqStart - bassFreqEnd) * Math.exp(-t * 22);
    bassPhase += (currentBassFreq * 2 * Math.PI) / sampleRate;
    // Blend triangle-like harmonic warmth with pure sub sine
    const bassSine = Math.sin(bassPhase);
    const bassTri = Math.asin(Math.sin(bassPhase)) * (2 / Math.PI);
    const bassPunch = (bassSine * 0.65 + bassTri * 0.35) * bassEnvelope * boomGain;

    // 4. Firearm Barrel & Chamber Acoustic Ring
    const barrelEnvelope = Math.exp(-t / 0.06);
    barrelPhase1 += (520 * 2 * Math.PI) / sampleRate;
    barrelPhase2 += (1150 * 2 * Math.PI) / sampleRate;
    const barrelRing =
      (Math.sin(barrelPhase1) * 0.2 + Math.sin(barrelPhase2) * 0.1) * barrelEnvelope;

    // 5. Environmental Echo & Tail
    const tailEnvelope = Math.exp(-t / 0.24) * 0.28;
    const tail = (Math.random() * 2 - 1) * tailEnvelope;

    // 6. Mechanical Shell Ejection / Action Click (at ~65ms)
    let mechClick = 0;
    if (t > 0.055 && t < 0.075) {
      const mt = t - 0.055;
      mechClick = Math.sin(mt * 3200 * 2 * Math.PI) * Math.exp(-mt * 250) * 0.3;
    }

    // Sum all layers
    let combined = impulse + blast + bassPunch + barrelRing + tail + mechClick;

    // Non-linear acoustic compression / soft-clipping (tanh-like distortion for realistic punch)
    combined = Math.tanh(combined * 1.35);

    // Fade out smoothly at end to prevent pop
    if (t > duration - 0.03) {
      const fade = (duration - t) / 0.03;
      combined *= fade;
    }

    // 16-bit PCM quantization (-32767 to 32767)
    const intSample = Math.max(-32767, Math.min(32767, Math.floor(combined * 32000)));
    pcmBuffer.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(numSamples, sampleRate);
  return Buffer.concat([header, pcmBuffer]);
}

// Generate 4 distinct realistic gunshot variations
const gunshots = [
  { name: "gunshot-1.wav", bassFreqStart: 220, bassFreqEnd: 48, punchDecay: 0.14, boomGain: 1.0 },
  { name: "gunshot-2.wav", bassFreqStart: 240, bassFreqEnd: 42, punchDecay: 0.12, boomGain: 0.95 },
  { name: "gunshot-3.wav", bassFreqStart: 195, bassFreqEnd: 50, punchDecay: 0.16, boomGain: 1.05 },
  { name: "gunshot-4.wav", bassFreqStart: 230, bassFreqEnd: 44, punchDecay: 0.13, boomGain: 0.98 },
];

for (const g of gunshots) {
  const wavData = generateGunshot(g);
  const targetPath = path.join(outputDir, g.name);
  fs.writeFileSync(targetPath, wavData);
  console.log(`Generated: ${g.name} (${wavData.length} bytes)`);
}

console.log("All realistic gunshot sound files generated successfully!");

