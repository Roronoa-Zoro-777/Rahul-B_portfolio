"use client";

class SoundManager {
  private audioPool: HTMLAudioElement[] = [];
  private poolIndex = 0;
  private lastShotTime = 0;

  constructor() {
    if (typeof window !== "undefined") {
      // Pre-create a pool of audio elements for zero-latency overlapping playback of the exact MP3
      for (let i = 0; i < 8; i++) {
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

      // Trigger the exact sound on click / tap / right-click
      window.addEventListener("pointerdown", triggerSound, { capture: true, passive: true });
      window.addEventListener("contextmenu", triggerSound, { capture: true });
    }
  }

  public isEnabled(): boolean {
    return true;
  }

  public toggle(): boolean {
    return true;
  }

  /**
   * Hover tick disabled: removed extra features and background noise
   */
  public playTick() {
    // Intentionally empty: all extra sounds/noise removed per user request
  }

  /**
   * Plays the exact MP3 sound uploaded by the user with zero modifications,
   * zero filters, and original waveform.
   */
  public playShot() {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    // 50ms debounce for duplicate pointer events
    if (now - this.lastShotTime < 50) return;
    this.lastShotTime = now;

    try {
      if (this.audioPool.length > 0) {
        const sound = this.audioPool[this.poolIndex];
        this.poolIndex = (this.poolIndex + 1) % this.audioPool.length;
        sound.currentTime = 0;
        sound.play().catch(() => {});
      } else {
        const fallback = new Audio("/sounds/custom-shoot.mp3");
        fallback.play().catch(() => {});
      }
    } catch {
      // Audio playback policy fallback
    }
  }
}

export const soundController = new SoundManager();
