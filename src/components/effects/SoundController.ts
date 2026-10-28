"use client";

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastShotTime = 0;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    this.enabled = true;

    if (typeof window !== "undefined") {
      const triggerSound = () => {
        this.playShot();
      };

      // Listen on window for pointerdown (instant 0ms trigger) and click
      window.addEventListener("pointerdown", triggerSound, { passive: true });
      window.addEventListener("click", triggerSound, { passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    // Generate reusable white-noise buffer for shotgun blast
    if (this.ctx && !this.noiseBuffer) {
      const sampleRate = this.ctx.sampleRate;
      const bufferLength = Math.floor(sampleRate * 0.35); // 350ms noise
      const buffer = this.ctx.createBuffer(1, bufferLength, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) {
        // Brown/pink-weighted noise for deeper explosion texture
        data[i] = (Math.random() * 2 - 1) * 0.85;
      }
      this.noiseBuffer = buffer;
    }

    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Subtle mechanical hover tick (15ms, 1400Hz sine drop)
   */
  public playTick() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.016);
    } catch {
      // AudioContext policy fallback
    }
  }

  /**
   * Heavy Shotgun Blast with Deep High-Bass & Dynamic Click Variation
   * High volume, clear bass punch (80-240Hz), explosive noise crack, and mechanical pump
   */
  public playShot() {
    if (!this.enabled) return;
    const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
    // 70ms debounce to prevent multiple simultaneous triggers on the same click
    if (nowMs - this.lastShotTime < 70) return;
    this.lastShotTime = nowMs;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master Compressor to maximize loudness and punch without harsh clipping
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, now);
      compressor.knee.setValueAtTime(8, now);
      compressor.ratio.setValueAtTime(6, now);
      compressor.attack.setValueAtTime(0.002, now);
      compressor.release.setValueAtTime(0.15, now);
      compressor.connect(ctx.destination);

      // Random variation factors so EVERY click sounds like a distinct shotgun blast
      const pitchFactor = 0.88 + Math.random() * 0.24; // 0.88x to 1.12x variation
      const blastFilterCutoff = 850 + Math.random() * 450; // 850Hz to 1300Hz
      const blastDuration = 0.22 + Math.random() * 0.08; // 220ms to 300ms

      // ========================================================
      // LAYER 1: Explosive Gunpowder Muzzle Blast (Filtered Noise)
      // ========================================================
      if (this.noiseBuffer) {
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "lowpass";
        noiseFilter.frequency.setValueAtTime(blastFilterCutoff * pitchFactor, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(180, now + blastDuration);
        noiseFilter.Q.setValueAtTime(2.2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.75, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + blastDuration);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(compressor);

        noiseSource.start(now);
        noiseSource.stop(now + blastDuration + 0.02);
      }

      // ========================================================
      // LAYER 2: Heavy High-Bass Kick & Punch (220Hz -> 50Hz)
      // Highly audible through laptop speakers & powerful on headphones
      // ========================================================
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = "triangle"; // Rich odd harmonics for high-bass punch presence
      
      const startBassFreq = (220 + Math.random() * 30) * pitchFactor;
      bassOsc.frequency.setValueAtTime(startBassFreq, now);
      bassOsc.frequency.exponentialRampToValueAtTime(85, now + 0.06);
      bassOsc.frequency.exponentialRampToValueAtTime(38, now + blastDuration);

      bassGain.gain.setValueAtTime(0.85, now);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + blastDuration);

      bassOsc.connect(bassGain);
      bassGain.connect(compressor);

      bassOsc.start(now);
      bassOsc.stop(now + blastDuration + 0.02);

      // ========================================================
      // LAYER 3: Sub-Bass Air Pressure Boom (130Hz -> 30Hz)
      // ========================================================
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(135 * pitchFactor, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + blastDuration * 1.1);

      subGain.gain.setValueAtTime(0.70, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + blastDuration * 1.1);

      subOsc.connect(subGain);
      subGain.connect(compressor);

      subOsc.start(now);
      subOsc.stop(now + blastDuration * 1.1 + 0.02);

      // ========================================================
      // LAYER 4: Mechanical Cock / Shell Ejection Click (Metallic snap)
      // ========================================================
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = "square";
      clickOsc.frequency.setValueAtTime(2600 * pitchFactor, now);
      clickOsc.frequency.exponentialRampToValueAtTime(600, now + 0.022);

      clickGain.gain.setValueAtTime(0.35, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      clickOsc.connect(clickGain);
      clickGain.connect(compressor);

      clickOsc.start(now);
      clickOsc.stop(now + 0.03);
    } catch {
      // AudioContext policy fallback
    }
  }
}

export const soundController = new SoundManager();
