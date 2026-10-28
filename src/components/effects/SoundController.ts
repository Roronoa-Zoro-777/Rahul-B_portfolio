"use client";

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastShotTime = 0;
  private gunshotBuffers: AudioBuffer[] = [];
  private lastVariationIndex = -1;
  private isPreloading = false;

  constructor() {
    this.enabled = true;

    if (typeof window !== "undefined") {
      const triggerSound = () => {
        this.playShot();
      };

      // Listen on window for pointerdown (instant 0ms trigger) and click
      window.addEventListener("pointerdown", triggerSound, { passive: true });
      window.addEventListener("click", triggerSound, { passive: true });

      // Start preloading gunshot audio files in background
      this.preloadAudio();
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

    return this.ctx;
  }

  /**
   * Preload the 4 realistic gunshot sound files into memory for instant 0ms playback
   */
  private async preloadAudio() {
    if (this.isPreloading || typeof window === "undefined") return;
    this.isPreloading = true;

    const urls = [
      "/sounds/gunshot-1.wav",
      "/sounds/gunshot-2.wav",
      "/sounds/gunshot-3.wav",
      "/sounds/gunshot-4.wav",
    ];

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const loadedBuffers = await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url);
            const arrayBuffer = await res.arrayBuffer();
            return await ctx.decodeAudioData(arrayBuffer);
          } catch {
            return null;
          }
        })
      );

      this.gunshotBuffers = loadedBuffers.filter((b): b is AudioBuffer => b !== null);
    } catch {
      // Fetch fallback
    }
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
   * High-Fidelity Realistic Gunshot Audio on Click
   * Uses real multi-layer gunshot audio samples with heavy bass punch,
   * high volume, and distinct sound variation on every click.
   */
  public playShot() {
    if (!this.enabled) return;
    const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
    // 60ms debounce to prevent double-triggering on identical click event
    if (nowMs - this.lastShotTime < 60) return;
    this.lastShotTime = nowMs;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      // Ensure audio files are loaded
      if (this.gunshotBuffers.length === 0) {
        this.preloadAudio();
      }

      const now = ctx.currentTime;

      // Master Compressor to maximize loudness and thunderous bass without distortion
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, now);
      compressor.knee.setValueAtTime(6, now);
      compressor.ratio.setValueAtTime(5, now);
      compressor.attack.setValueAtTime(0.001, now);
      compressor.release.setValueAtTime(0.18, now);

      // Bass EQ boost around 90-180Hz for chest-thumping gunshot punch
      const bassBoost = ctx.createBiquadFilter();
      bassBoost.type = "peaking";
      bassBoost.frequency.setValueAtTime(120, now);
      bassBoost.gain.setValueAtTime(4.5, now);
      bassBoost.Q.setValueAtTime(1.4, now);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.15, now); // High volume punch

      bassBoost.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Pick next gunshot variation (ensuring different sound on each click)
      if (this.gunshotBuffers.length > 0) {
        let nextIndex = Math.floor(Math.random() * this.gunshotBuffers.length);
        if (nextIndex === this.lastVariationIndex && this.gunshotBuffers.length > 1) {
          nextIndex = (nextIndex + 1) % this.gunshotBuffers.length;
        }
        this.lastVariationIndex = nextIndex;

        const buffer = this.gunshotBuffers[nextIndex];
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Subtle randomized pitch shifting for organic realism
        const pitchShift = 0.94 + Math.random() * 0.12; // 0.94x to 1.06x
        source.playbackRate.setValueAtTime(pitchShift, now);

        source.connect(bassBoost);
        source.start(now);
      } else {
        // Instant acoustic fallback if buffers are still decoding
        this.playSynthesizedGunshot(ctx, compressor);
      }
    } catch {
      // AudioContext policy fallback
    }
  }

  /**
   * Procedural acoustic gunshot backup
   */
  private playSynthesizedGunshot(ctx: AudioContext, destination: AudioNode) {
    const now = ctx.currentTime;

    // Supersonic crack
    const oscCrack = ctx.createOscillator();
    const gainCrack = ctx.createGain();
    oscCrack.type = "sawtooth";
    oscCrack.frequency.setValueAtTime(1800, now);
    oscCrack.frequency.exponentialRampToValueAtTime(140, now + 0.04);
    gainCrack.gain.setValueAtTime(0.9, now);
    gainCrack.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    oscCrack.connect(gainCrack);
    gainCrack.connect(destination);
    oscCrack.start(now);
    oscCrack.stop(now + 0.045);

    // Deep explosive thud
    const oscThud = ctx.createOscillator();
    const gainThud = ctx.createGain();
    oscThud.type = "triangle";
    oscThud.frequency.setValueAtTime(220, now);
    oscThud.frequency.exponentialRampToValueAtTime(45, now + 0.18);
    gainThud.gain.setValueAtTime(0.95, now);
    gainThud.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscThud.connect(gainThud);
    gainThud.connect(destination);
    oscThud.start(now);
    oscThud.stop(now + 0.23);
  }
}

export const soundController = new SoundManager();
