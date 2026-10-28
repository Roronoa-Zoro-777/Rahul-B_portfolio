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
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

/**
 * Clean, smooth tactical rifle shot:
 * 1. Crisp firing pin / bolt snap (sharp, dry, zero static hiss)
 * 2. Deep warm acoustic rifle thud (exponential bass sweep)
 * 3. Metal chamber & stock resonance (tactile "thock")
 * 4. Concise ~170ms envelope for snappy click satisfaction
 */
function generateCleanRifle(options = {}) {
  const sampleRate = 44100;
  const duration = options.duration || 0.17; // Snappy 170ms
  const numSamples = Math.floor(sampleRate * duration);
  const pcmBuffer = Buffer.alloc(numSamples * 2);

  const startFreq = options.startFreq || 185;
  const endFreq = options.endFreq || 50;
  const bodyPunchDecay = options.bodyPunchDecay || 0.08;
  const clickFreq = options.clickFreq || 1350;
  const chamberFreq = options.chamberFreq || 310;

  let phaseBass = 0;
  let phaseChamber = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // 1. Crisp firing pin snap (0 to 10ms) - completely clean, no noise hiss
    let click = 0;
    if (t < 0.010) {
      const clickEnv = Math.exp(-t * 600);
      const curClickFreq = clickFreq * (1 - t / 0.010);
      click = Math.sin(t * curClickFreq * 2 * Math.PI) * clickEnv * 0.42;
    }

    // 2. Smooth deep rifle thud (185Hz down to 50Hz) - warm, clean, punchy bass
    const freq = endFreq + (startFreq - endFreq) * Math.exp(-t * 38);
    phaseBass += (freq * 2 * Math.PI) / sampleRate;
    const bassEnv = Math.exp(-t / bodyPunchDecay);
    const bass = Math.sin(phaseBass) * bassEnv * 0.88;

    // 3. Rifle stock & receiver chamber resonance ("thock")
    phaseChamber += (chamberFreq * 2 * Math.PI) / sampleRate;
    const chamberEnv = Math.exp(-t / 0.042);
    const chamber = Math.sin(phaseChamber) * chamberEnv * 0.32;

    // 4. Soft low-frequency acoustic pressure thump
    const puffEnv = Math.exp(-t / 0.038);
    const puff = Math.sin(t * 90 * 2 * Math.PI) * puffEnv * 0.22;

    // Sum all clean acoustic layers (NO random white noise generator!)
    let s = click + bass + chamber + puff;

    // Soft warm analog compression
    s = Math.tanh(s * 1.12);

    // Clean fade out at end
    if (t > duration - 0.018) {
      s *= (duration - t) / 0.018;
    }

    const intSample = Math.max(-32767, Math.min(32767, Math.floor(s * 32000)));
    pcmBuffer.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(numSamples, sampleRate);
  return Buffer.concat([header, pcmBuffer]);
}

// 4 clean, smooth rifle variations with subtle caliber/acoustic tuning
const rifleVariations = [
  { name: "gunshot-1.wav", startFreq: 185, endFreq: 48, bodyPunchDecay: 0.082, clickFreq: 1350, chamberFreq: 310 },
  { name: "gunshot-2.wav", startFreq: 195, endFreq: 52, bodyPunchDecay: 0.076, clickFreq: 1420, chamberFreq: 330 },
  { name: "gunshot-3.wav", startFreq: 175, endFreq: 45, bodyPunchDecay: 0.088, clickFreq: 1280, chamberFreq: 295 },
  { name: "gunshot-4.wav", startFreq: 190, endFreq: 50, bodyPunchDecay: 0.080, clickFreq: 1380, chamberFreq: 320 },
];

for (const r of rifleVariations) {
  const wav = generateCleanRifle(r);
  const outPath = path.join(outputDir, r.name);
  fs.writeFileSync(outPath, wav);
  console.log(`Updated clean rifle: ${r.name} (${wav.length} bytes)`);
}

console.log("All clean smooth rifle audio files written successfully!");

