/**
 * HIGH-PERFORMANCE FRAME SEQUENCE & MEMORY ENGINE
 * 
 * - Off-main-thread decoding via createImageBitmap() (fallback: Image.decode())
 * - Sliding window LRU memory cache with GPU memory cleanup (.close())
 * - Nearest loaded frame fallback (zero blank screens)
 * - Progressive loading: immediate initial batch (~40 frames) + idle-time background loading
 * - Hardware & mobile concurrency adaptation
 */

import { portfolioConfig } from "@/config/portfolio.config";

export type FrameDrawable = ImageBitmap | HTMLImageElement;

interface CacheEntry {
  drawable: FrameDrawable;
  lastAccess: number;
}

export class FrameSequenceEngine {
  private totalFrames: number;
  private frameStep: number;
  private maxCacheSize: number;
  private cache: Map<number, CacheEntry> = new Map();
  private pendingLoads: Set<number> = new Set();
  private initialBatchSize: number;
  private isLowEnd: boolean = false;
  private isCancelled: boolean = false;

  private onProgressCallback?: (progress: number) => void;
  private onInitialBatchReady?: () => void;
  private hasReportedInitialReady: boolean = false;
  private initialLoadedCount: number = 0;

  constructor(options?: {
    totalFrames?: number;
    frameStep?: number;
    maxCacheSize?: number;
    initialBatchSize?: number;
  }) {
    this.totalFrames = options?.totalFrames ?? portfolioConfig.sequence.totalFrames;
    this.initialBatchSize = options?.initialBatchSize ?? portfolioConfig.sequence.initialPreloadBatch;

    // Detect hardware capabilities
    if (typeof window !== "undefined") {
      const concurrency = navigator.hardwareConcurrency || 4;
      const isMobileWidth = window.innerWidth < portfolioConfig.hardware.mobileBreakpoint;
      this.isLowEnd = concurrency <= portfolioConfig.hardware.lowConcurrencyThreshold || isMobileWidth;
      this.frameStep = options?.frameStep ?? (this.isLowEnd ? portfolioConfig.sequence.mobileFrameStep : 1);
      this.maxCacheSize = options?.maxCacheSize ?? (this.isLowEnd ? portfolioConfig.sequence.maxCachedFramesMobile : portfolioConfig.sequence.maxCachedFramesDesktop);
    } else {
      this.frameStep = 1;
      this.maxCacheSize = portfolioConfig.sequence.maxCachedFramesDesktop;
    }
  }

  public getIsLowEnd(): boolean {
    return this.isLowEnd;
  }

  public getFrameStep(): number {
    return this.frameStep;
  }

  public getTotalFrames(): number {
    return this.totalFrames;
  }

  /**
   * Resolve frame URL with automatic WebP / PNG handling
   */
  public getFrameUrl(index: number): string {
    const clamped = Math.max(1, Math.min(this.totalFrames, index));
    return portfolioConfig.sequence.framePathPattern(clamped);
  }

  /**
   * Retrieve frame drawable from cache, or return the nearest available loaded frame.
   * Also triggers loading of surrounding frames in the sliding window.
   */
  public getFrame(index: number): FrameDrawable | null {
    const clamped = Math.max(1, Math.min(this.totalFrames, Math.round(index)));
    
    // Check exact hit
    const exact = this.cache.get(clamped);
    if (exact) {
      exact.lastAccess = performance.now();
      this.ensureSlidingWindow(clamped);
      return exact.drawable;
    }

    // Trigger load for this frame if not already in flight
    this.loadFrame(clamped);
    this.ensureSlidingWindow(clamped);

    // Nearest-frame fallback: scan outwards (up to total frames)
    for (let distance = 1; distance <= this.totalFrames; distance++) {
      const prev = clamped - distance;
      if (prev >= 1) {
        const entry = this.cache.get(prev);
        if (entry) return entry.drawable;
      }
      const next = clamped + distance;
      if (next <= this.totalFrames) {
        const entry = this.cache.get(next);
        if (entry) return entry.drawable;
      }
    }

    return null;
  }

  /**
   * Start progressive preloading:
   * Phase 1: Rapid load of first ~40 frames to unlock the UI
   * Phase 2: Background idle-time loading of remaining frames
   */
  public startPreload(callbacks?: {
    onProgress?: (progress: number) => void;
    onInitialReady?: () => void;
  }) {
    this.onProgressCallback = callbacks?.onProgress;
    this.onInitialBatchReady = callbacks?.onInitialReady;
    this.isCancelled = false;

    // Load initial batch with controlled concurrency
    const initialIndices: number[] = [];
    for (let i = 1; i <= Math.min(this.totalFrames, this.initialBatchSize * this.frameStep); i += this.frameStep) {
      initialIndices.push(i);
    }

    let completedInitial = 0;
    const initialTarget = initialIndices.length;

    const pumpInitial = async () => {
      for (const idx of initialIndices) {
        if (this.isCancelled) return;
        await this.loadFrame(idx);
        completedInitial++;
        const prog = completedInitial / initialTarget;
        this.onProgressCallback?.(Math.min(1, prog));

        if (!this.hasReportedInitialReady && (completedInitial >= Math.min(15, initialTarget) || completedInitial === initialTarget)) {
          this.hasReportedInitialReady = true;
          this.onInitialBatchReady?.();
        }
      }

      // Phase 2: Schedule background queue
      this.scheduleBackgroundLoading();
    };

    pumpInitial();
  }

  /**
   * Schedule remaining frames to load in background during browser idle time
   */
  private scheduleBackgroundLoading() {
    if (this.isCancelled) return;

    const remainingIndices: number[] = [];
    for (let i = 1; i <= this.totalFrames; i += this.frameStep) {
      if (!this.cache.has(i) && !this.pendingLoads.has(i)) {
        remainingIndices.push(i);
      }
    }

    if (remainingIndices.length === 0) return;

    let cursor = 0;
    const batchSize = this.isLowEnd ? 3 : 6;

    const runIdlePump = (deadline?: IdleDeadline) => {
      if (this.isCancelled) return;

      while (cursor < remainingIndices.length && (!deadline || deadline.timeRemaining() > 3)) {
        const nextBatch = remainingIndices.slice(cursor, cursor + batchSize);
        cursor += batchSize;
        for (const idx of nextBatch) {
          this.loadFrame(idx);
        }
        if (!deadline) break;
      }

      if (cursor < remainingIndices.length) {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as Window).requestIdleCallback(runIdlePump, { timeout: 1500 });
        } else {
          setTimeout(runIdlePump, 120);
        }
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as Window).requestIdleCallback(runIdlePump, { timeout: 1500 });
    } else {
      setTimeout(runIdlePump, 120);
    }
  }

  /**
   * Decode frame off the main thread with createImageBitmap or fallback to Image.decode()
   */
  private async loadFrame(index: number): Promise<void> {
    if (this.cache.has(index) || this.pendingLoads.has(index)) return;
    this.pendingLoads.add(index);

    const url = this.getFrameUrl(index);

    try {
      if (typeof window !== "undefined" && "createImageBitmap" in window && typeof fetch === "function") {
        // Off-thread decode via ImageBitmap
        const response = await fetch(url, { cache: "force-cache" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (this.isCancelled) return;

        const bitmap = await createImageBitmap(blob);
        if (this.isCancelled) {
          bitmap.close();
          return;
        }

        this.storeInCache(index, bitmap);
      } else {
        // Fallback to HTMLImageElement.decode()
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          if (typeof img.decode === "function") {
            img.decode()
              .then(() => {
                if (!this.isCancelled) this.storeInCache(index, img);
                resolve();
              })
              .catch(() => {
                // If decode fails, fallback to onload
                img.onload = () => {
                  if (!this.isCancelled) this.storeInCache(index, img);
                  resolve();
                };
                img.onerror = () => resolve();
              });
          } else {
            img.onload = () => {
              if (!this.isCancelled) this.storeInCache(index, img);
              resolve();
            };
            img.onerror = () => resolve();
          }
        });
      }
    } catch {
      // Non-fatal: the nearest-frame algorithm will bridge missing frames
    } finally {
      this.pendingLoads.delete(index);
    }
  }

  /**
   * Add to cache and prune if over capacity
   */
  private storeInCache(index: number, drawable: FrameDrawable) {
    this.cache.set(index, {
      drawable,
      lastAccess: performance.now(),
    });
    this.pruneCache();
  }

  /**
   * Maintain sliding window around current frame
   */
  private ensureSlidingWindow(centerIndex: number) {
    const halfWindow = Math.floor(this.maxCacheSize / 2) * this.frameStep;
    const start = Math.max(1, centerIndex - halfWindow);
    const end = Math.min(this.totalFrames, centerIndex + halfWindow);

    for (let i = start; i <= end; i += this.frameStep) {
      if (!this.cache.has(i) && !this.pendingLoads.has(i)) {
        this.loadFrame(i);
      }
    }
  }

  /**
   * Prune out-of-range frames to keep memory within budget
   */
  private pruneCache() {
    if (this.cache.size <= this.maxCacheSize) return;

    // Sort by lastAccess ascending (LRU)
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess
    );

    const excess = this.cache.size - this.maxCacheSize;
    for (let i = 0; i < excess; i++) {
      const [key, entry] = entries[i];
      // If ImageBitmap, free GPU buffer immediately
      if ("close" in entry.drawable && typeof entry.drawable.close === "function") {
        try {
          entry.drawable.close();
        } catch {
          // ignore
        }
      }
      this.cache.delete(key);
    }
  }

  /**
   * Clean up all memory and pending workers
   */
  public destroy() {
    this.isCancelled = true;
    for (const entry of this.cache.values()) {
      if ("close" in entry.drawable && typeof entry.drawable.close === "function") {
        try {
          entry.drawable.close();
        } catch {
          // ignore
        }
      }
    }
    this.cache.clear();
    this.pendingLoads.clear();
  }
}
