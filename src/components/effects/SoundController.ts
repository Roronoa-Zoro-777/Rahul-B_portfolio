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

      // Start preloading clean rifle sound files
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
   * Preload clean rifle sound files into memory for instant playback
   */
  private async preloadAudio() {
    if (this.isPreloading || typeof window === "undefined") return;
    this.isPreloading = true;

    const urls = [
      "/sounds/gunshot-1.wav?v=2",
      "/sounds/gunshot-2.wav?v=2",
      "/sounds/gunshot-3.wav?v=2",
      "/sounds/gunshot-4.wav?v=2",
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
   * Clean, Smooth Tactical Rifle Shot on Click
   * Crisp firing-pin transient with warm, deep acoustic bass thud.
   * Completely clean with zero static noise or harsh distortion.
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

      if (this.gunshotBuffers.length === 0) {
        this.preloadAudio();
      }

      const now = ctx.currentTime;

      // Master Compressor for smooth, controlled loudness
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, now);
      compressor.knee.setValueAtTime(8, now);
      compressor.ratio.setValueAtTime(4, now);
      compressor.attack.setValueAtTime(0.002, now);
      compressor.release.setValueAtTime(0.12, now);

      // Warm low-end peak (110Hz) for deep solid rifle punch
      const warmEq = ctx.createBiquadFilter();
      warmEq.type = "peaking";
      warmEq.frequency.setValueAtTime(110, now);
      warmEq.gain.setValueAtTime(3.0, now);
      warmEq.Q.setValueAtTime(1.2, now);

      // Gentle smooth lowpass (3800Hz) to remove any digital harshness
      const smoothFilter = ctx.createBiquadFilter();
      smoothFilter.type = "lowpass";
      smoothFilter.frequency.setValueAtTime(3800, now);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, now);

      warmEq.connect(smoothFilter);
      smoothFilter.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Play pre-rendered clean rifle variation
      if (this.gunshotBuffers.length > 0) {
        let nextIndex = Math.floor(Math.random() * this.gunshotBuffers.length);
        if (nextIndex === this.lastVariationIndex && this.gunshotBuffers.length > 1) {
          nextIndex = (nextIndex + 1) % this.gunshotBuffers.length;
        }
        this.lastVariationIndex = nextIndex;

        const buffer = this.gunshotBuffers[nextIndex];
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // Subtle randomized micro-pitch (0.96x to 1.04x) for natural realism
        const pitchShift = 0.96 + Math.random() * 0.08;
        source.playbackRate.setValueAtTime(pitchShift, now);

        source.connect(warmEq);
        source.start(now);
      } else {
        // Immediate clean procedural rifle fallback
        this.playProceduralCleanRifle(ctx, warmEq);
      }
    } catch {
      // AudioContext policy fallback
    }
  }

  /**
   * Clean procedural rifle backup (no noise, pure acoustic snap and warm thud)
   */
  private playProceduralCleanRifle(ctx: AudioContext, destination: AudioNode) {
    const now = ctx.currentTime;

    // 1. Crisp firing pin click (damped sine sweep 1200Hz -> 400Hz, 8ms)
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = "sine";
    oscClick.frequency.setValueAtTime(1200, now);
    oscClick.frequency.exponentialRampToValueAtTime(400, now + 0.008);
    gainClick.gain.setValueAtTime(0.5, now);
    gainClick.gain.exponentialRampToValueAtTime(0.0001, now + 0.010);
    oscClick.connect(gainClick);
    gainClick.connect(destination);
    oscClick.start(now);
    oscClick.stop(now + 0.012);

    // 2. Smooth deep rifle thud (180Hz -> 50Hz, 120ms)
    const oscBass = ctx.createOscillator();
    const gainBass = ctx.createGain();
    oscBass.type = "triangle";
    oscBass.frequency.setValueAtTime(180, now);
    oscBass.frequency.exponentialRampToValueAtTime(50, now + 0.12);
    gainBass.gain.setValueAtTime(0.85, now);
    gainBass.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    oscBass.connect(gainBass);
    gainBass.connect(destination);
    oscBass.start(now);
    oscBass.stop(now + 0.15);

    // 3. Chamber resonance (310Hz body "thock")
    const oscChamber = ctx.createOscillator();
    const gainChamber = ctx.createGain();
    oscChamber.type = "sine";
    oscChamber.frequency.setValueAtTime(310, now);
    gainChamber.gain.setValueAtTime(0.35, now);
    gainChamber.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    oscChamber.connect(gainChamber);
    gainChamber.connect(destination);
    oscChamber.start(now);
    oscChamber.stop(now + 0.06);
  }
}

export const soundController = new SoundManager();
