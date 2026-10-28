"use client";

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastShotTime = 0;

  constructor() {
    this.enabled = true;

    if (typeof window !== "undefined") {
      // Global click listener: every click anywhere on the page triggers the shoot sound
      window.addEventListener(
        "pointerdown",
        () => {
          this.playShot();
        },
        { passive: true }
      );
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
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
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.016);
    } catch {
      // AudioContext policy fallback
    }
  }

  /**
   * Tactical blaster / repulsor shoot sound on click
   * Combines high-energy laser sweep with sub-bass kinetic punch
   */
  public playShot() {
    if (!this.enabled) return;
    const nowMs = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (nowMs - this.lastShotTime < 60) return; // Prevent duplicate triggers on same click
    this.lastShotTime = nowMs;

    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Layer 1: High-energy laser/blaster sweep (850Hz -> 120Hz)
      const oscBlaster = this.ctx.createOscillator();
      const gainBlaster = this.ctx.createGain();
      oscBlaster.type = "triangle";
      oscBlaster.frequency.setValueAtTime(850, now);
      oscBlaster.frequency.exponentialRampToValueAtTime(120, now + 0.055);

      gainBlaster.gain.setValueAtTime(0.08, now);
      gainBlaster.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      oscBlaster.connect(gainBlaster);
      gainBlaster.connect(this.ctx.destination);

      oscBlaster.start(now);
      oscBlaster.stop(now + 0.058);

      // Layer 2: Sub-bass kinetic body punch (180Hz -> 38Hz)
      const oscPunch = this.ctx.createOscillator();
      const gainPunch = this.ctx.createGain();
      oscPunch.type = "sine";
      oscPunch.frequency.setValueAtTime(180, now);
      oscPunch.frequency.exponentialRampToValueAtTime(38, now + 0.075);

      gainPunch.gain.setValueAtTime(0.12, now);
      gainPunch.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

      oscPunch.connect(gainPunch);
      gainPunch.connect(this.ctx.destination);

      oscPunch.start(now);
      oscPunch.stop(now + 0.08);
    } catch {
      // AudioContext policy fallback
    }
  }
}

export const soundController = new SoundManager();
