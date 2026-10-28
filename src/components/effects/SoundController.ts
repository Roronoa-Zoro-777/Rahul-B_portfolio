"use client";

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastShotTime = 0;
  private customBuffer: AudioBuffer | null = null;
  private audioPool: HTMLAudioElement[] = [];
  private poolIndex = 0;
  private isPreloading = false;

  constructor() {
    this.enabled = true;

    if (typeof window !== "undefined") {
      // Pre-create an audio pool of 6 elements for instant overlapping playback
      for (let i = 0; i < 6; i++) {
        try {
          const audio = new Audio("/sounds/custom-shoot.mp3");
          audio.preload = "auto";
          this.audioPool.push(audio);
        } catch {
          // Fallback
        }
      }

      const triggerSound = () => {
        this.playShot();
      };

      // Listen on window for pointerdown (instant 0ms trigger) and click
      window.addEventListener("pointerdown", triggerSound, { passive: true });
      window.addEventListener("click", triggerSound, { passive: true });

      // Preload and decode custom sound into Web Audio buffer
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
   * Preload and decode the user's custom shoot sound into Web Audio memory
   */
  private async preloadAudio() {
    if (this.isPreloading || typeof window === "undefined") return;
    this.isPreloading = true;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const res = await fetch("/sounds/custom-shoot.mp3");
      const arrayBuffer = await res.arrayBuffer();
      this.customBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch {
      // Audio pool fallback handles it
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

      gain.gain.setValueAtTime(0.035, now);
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
   * Play the user's exact custom shoot sound on every click
   * Uses Web Audio API buffer when ready, with cycling HTML5 Audio pool fallback
   */
  public playShot() {
    if (!this.enabled) return;
    const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
    // 50ms debounce to prevent double-triggering on identical click event
    if (nowMs - this.lastShotTime < 50) return;
    this.lastShotTime = nowMs;

    // 1. Try Web Audio API (high fidelity, instant zero-latency overlapping)
    try {
      const ctx = this.initContext();
      if (ctx && this.customBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = this.customBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(ctx.currentTime);
        return;
      }
    } catch {
      // Fall through to audio pool
    }

    // 2. Cycling Audio Pool fallback (ensures guaranteed immediate playback)
    try {
      if (this.audioPool.length > 0) {
        const sound = this.audioPool[this.poolIndex];
        this.poolIndex = (this.poolIndex + 1) % this.audioPool.length;
        sound.currentTime = 0;
        sound.volume = 1.0;
        sound.play().catch(() => {});
      }
    } catch {
      // Audio policy fallback
    }
  }
}

export const soundController = new SoundManager();
