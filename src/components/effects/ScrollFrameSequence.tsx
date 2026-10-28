"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
  memo,
} from "react";
import { useLenis } from "@/components/providers/SmoothScrollProvider";

export interface ScrollFrameSequenceProps {
  id?: string;
  className?: string;
  /** Total frames in sequence (default 600) */
  totalFrames?: number;
  /** Scroll height in vh for pinning wrapper (default 500 = 500vh) */
  scrollDistanceVh?: number;
  /** Lerp smoothing factor (default 0.12) */
  lerpSpeed?: number;
  /** Number of initial frames required before unlocking page (default 30) */
  initialBatchSize?: number;
  /** Sliding window radius (+/- cacheWindowSize) of decoded frames in memory (default 40) */
  cacheWindowSize?: number;
  /** Dynamic path resolver */
  getFramePath?: (frameNumber: number, isMobile?: boolean) => string;
  /** Or folder/prefix/digits/extension configuration */
  folder?: string;
  prefix?: string;
  digits?: number;
  extension?: string;
  mobileFolder?: string;
  /** Preload first frame via head tag */
  preloadFirstFrame?: boolean;
  /** Dark overlay opacity (0 to 1, default 0.35) */
  overlayOpacity?: number;
  /** Children rendered in sticky container above the canvas */
  children?: ReactNode;
  /** Non-react callbacks to avoid triggering re-renders */
  onScrollProgress?: (progress: number) => void;
  onFrameChange?: (frameIndex: number, targetFrame: number) => void;
  /** Ref forwarding for the wrapper section (e.g. for external GSAP triggers) */
  sectionRefForward?: React.RefObject<HTMLElement | null>;
}

export const ScrollFrameSequence = memo(function ScrollFrameSequence({
  id,
  className = "",
  totalFrames = 600,
  scrollDistanceVh = 500,
  lerpSpeed = 0.12,
  initialBatchSize = 30,
  cacheWindowSize = 40,
  getFramePath,
  folder = "/frames/home",
  prefix = "frame_",
  digits = 4,
  extension = ".webp",
  mobileFolder,
  preloadFirstFrame = true,
  overlayOpacity = 0.35,
  children,
  onScrollProgress,
  onFrameChange,
  sectionRefForward,
}: ScrollFrameSequenceProps) {
  const internalSectionRef = useRef<HTMLElement | null>(null);
  const sectionRef = sectionRefForward || internalSectionRef;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Animation & Frame tracking refs (No React state on scroll!)
  const targetFrameRef = useRef(1);
  const currentFrameRef = useRef(1);
  const lastRenderedFrameRef = useRef(-1);
  const rafIdRef = useRef<number | null>(null);

  // Status flags
  const isSectionInViewRef = useRef(true);
  const isDocumentVisibleRef = useRef(true);
  const prefersReducedMotionRef = useRef(false);
  const isMobileRef = useRef(false);

  // Cached layout measurements (updated only on mount/resize, NEVER on scroll!)
  const layoutCacheRef = useRef({
    sectionTop: 0,
    sectionHeight: 0,
    windowHeight: 0,
    scrollable: 0,
  });

  // Callbacks refs to stay fresh without effect restarts
  const onScrollProgressRef = useRef(onScrollProgress);
  onScrollProgressRef.current = onScrollProgress;
  const onFrameChangeRef = useRef(onFrameChange);
  onFrameChangeRef.current = onFrameChange;

  // Frame Cache & Memory Management
  const imageCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadedFramesRef = useRef<Set<number>>(new Set());
  const pendingLoadsRef = useRef<Set<number>>(new Set());

  // UI state only for initial load readiness and progress
  const [initialReady, setInitialReady] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);

  const lenis = useLenis();

  /**
   * Helper: Resolve URL for a specific frame number
   */
  const resolveFrameUrl = useCallback(
    (frameNum: number): string => {
      const clamped = Math.max(1, Math.min(totalFrames, frameNum));
      if (getFramePath) {
        return getFramePath(clamped, isMobileRef.current);
      }
      const numStr = digits > 0 ? String(clamped).padStart(digits, "0") : String(clamped);
      const activeFolder = isMobileRef.current && mobileFolder ? mobileFolder : folder;
      return `${activeFolder}/${prefix}${numStr}${extension}`;
    },
    [totalFrames, getFramePath, digits, mobileFolder, folder, prefix, extension]
  );

  /**
   * Cover-fit draw single frame onto canvas
   */
  const renderDrawable = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";
      ctxRef.current = ctx;
    }

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    if (!iw || !ih) return;

    // Cover-fit logic: Fill canvas while preserving aspect ratio, zero stretching
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) * 0.5;
    const dy = (ch - dh) * 0.5;

    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  /**
   * Nearest loaded frame retrieval to prevent blank/flickering frames
   */
  const getNearestLoadedFrame = useCallback(
    (target: number): HTMLImageElement | null => {
      const loaded = loadedFramesRef.current;
      const cache = imageCacheRef.current;

      if (loaded.has(target)) {
        return cache.get(target) || null;
      }

      // Search outwards: target - 1, target + 1, target - 2, ...
      for (let dist = 1; dist < totalFrames; dist++) {
        const lower = target - dist;
        if (lower >= 1 && loaded.has(lower)) {
          return cache.get(lower) || null;
        }
        const upper = target + dist;
        if (upper <= totalFrames && loaded.has(upper)) {
          return cache.get(upper) || null;
        }
      }

      return null;
    },
    [totalFrames]
  );

  /**
   * Load and decode a specific frame
   */
  const loadSingleFrame = useCallback(
    (frameNum: number): Promise<HTMLImageElement | null> => {
      const clamped = Math.max(1, Math.min(totalFrames, frameNum));
      const cache = imageCacheRef.current;
      const loaded = loadedFramesRef.current;
      const pending = pendingLoadsRef.current;

      if (loaded.has(clamped) && cache.has(clamped)) {
        return Promise.resolve(cache.get(clamped)!);
      }
      if (pending.has(clamped)) {
        return Promise.resolve(null);
      }

      pending.add(clamped);

      return new Promise((resolve) => {
        const img = new Image();
        img.src = resolveFrameUrl(clamped);

        const onDone = async () => {
          pending.delete(clamped);
          try {
            if ("decode" in img) {
              await img.decode();
            }
          } catch {
            // Ignore decode failures on unsupported formats or unmount
          }
          loaded.add(clamped);
          cache.set(clamped, img);
          resolve(img);
        };

        const onError = () => {
          pending.delete(clamped);
          resolve(null);
        };

        if (img.complete) {
          onDone();
        } else {
          img.onload = onDone;
          img.onerror = onError;
        }
      });
    },
    [totalFrames, resolveFrameUrl]
  );

  /**
   * Evict distant frames outside sliding window to prevent memory bloat
   */
  const manageMemoryWindow = useCallback(
    (activeFrame: number) => {
      const cache = imageCacheRef.current;
      const loaded = loadedFramesRef.current;
      const maxDistance = cacheWindowSize * 2;

      // Only evict if cache exceeds threshold
      if (cache.size > cacheWindowSize * 3) {
        for (const [frameNum, img] of cache.entries()) {
          // Never evict frame 1 (fallback anchor)
          if (frameNum === 1) continue;

          if (Math.abs(frameNum - activeFrame) > maxDistance) {
            img.src = ""; // Release underlying image bitmap memory
            cache.delete(frameNum);
            loaded.delete(frameNum);
          }
        }
      }
    },
    [cacheWindowSize]
  );

  /**
   * Prioritized loading: Window around current frame first, then outward
   */
  const requestSurroundingFrames = useCallback(
    (centerFrame: number) => {
      const windowRadius = cacheWindowSize;
      const minFrame = Math.max(1, centerFrame - windowRadius);
      const maxFrame = Math.min(totalFrames, centerFrame + windowRadius);

      // Load forward first (user scrolling down is most common)
      for (let f = centerFrame; f <= maxFrame; f++) {
        if (!loadedFramesRef.current.has(f) && !pendingLoadsRef.current.has(f)) {
          loadSingleFrame(f);
        }
      }
      // Load backward
      for (let f = centerFrame - 1; f >= minFrame; f--) {
        if (!loadedFramesRef.current.has(f) && !pendingLoadsRef.current.has(f)) {
          loadSingleFrame(f);
        }
      }

      manageMemoryWindow(centerFrame);
    },
    [cacheWindowSize, totalFrames, loadSingleFrame, manageMemoryWindow]
  );

  /**
   * Resize Canvas Backing Store (Capped at 1.5 dpr for peak GPU performance)
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect mobile
    isMobileRef.current = window.innerWidth < 768;

    // Cap devicePixelRatio at 1.5 as requested
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Update layout cache
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const sectionTop = rect.top + scrollTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrollable = sectionHeight - height;
      layoutCacheRef.current = { sectionTop, sectionHeight, windowHeight: height, scrollable };
    }

    // Redraw immediately
    const img = getNearestLoadedFrame(Math.round(currentFrameRef.current));
    if (img) {
      renderDrawable(img);
    }
  }, [sectionRef, getNearestLoadedFrame, renderDrawable]);

  /**
   * Passive Scroll Listener: Zero getBoundingClientRect layout reads!
   */
  const handleScroll = useCallback(() => {
    const { sectionTop, scrollable } = layoutCacheRef.current;
    if (scrollable <= 0) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const rawProgress = (scrollY - sectionTop) / scrollable;
    const progress = Math.max(0, Math.min(1, rawProgress));

    targetFrameRef.current = 1 + progress * (totalFrames - 1);

    if (onScrollProgressRef.current) {
      onScrollProgressRef.current(progress);
    }
  }, [totalFrames]);

  /**
   * Initial Setup: Preload batch & Frame 1 immediate rendering
   */
  useEffect(() => {
    prefersReducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    handleResize();

    let isCancelled = false;
    let loadedCount = 0;

    // 1. Load Frame 1 immediately
    loadSingleFrame(1).then((firstImg) => {
      if (isCancelled || !firstImg) return;
      renderDrawable(firstImg);
      lastRenderedFrameRef.current = 1;
    });

    // 2. Progressive Initial Batch (~30 frames)
    const initialBatch = Math.min(totalFrames, initialBatchSize);
    for (let f = 1; f <= initialBatch; f++) {
      loadSingleFrame(f).then(() => {
        if (isCancelled) return;
        loadedCount++;
        setLoadPercent(Math.round((loadedCount / initialBatch) * 100));

        if (loadedCount >= Math.min(12, initialBatch)) {
          setInitialReady(true);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [totalFrames, initialBatchSize, handleResize, loadSingleFrame, renderDrawable]);

  /**
   * Window Resize & Orientation Change Listeners
   */
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", debouncedResize, { passive: true });
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", debouncedResize);
    };
  }, [handleResize]);

  /**
   * Scroll Listeners (Passive Window Scroll + Lenis Integration)
   */
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    if (lenis) {
      lenis.on("scroll", handleScroll);
    }

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (lenis) {
        lenis.off("scroll", handleScroll);
      }
    };
  }, [handleScroll, lenis]);

  /**
   * Animation rAF Loop with Lerp Smoothing
   */
  useEffect(() => {
    let lastFrameRequested = 1;

    const loop = () => {
      if (prefersReducedMotionRef.current) {
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }

      if (isSectionInViewRef.current && isDocumentVisibleRef.current) {
        // Smooth lerp easing
        const diff = targetFrameRef.current - currentFrameRef.current;
        if (Math.abs(diff) > 0.001) {
          currentFrameRef.current += diff * lerpSpeed;
        } else {
          currentFrameRef.current = targetFrameRef.current;
        }

        const nextRenderFrame = Math.max(
          1,
          Math.min(totalFrames, Math.round(currentFrameRef.current))
        );

        // Only redraw when the frame index actually changes!
        if (nextRenderFrame !== lastRenderedFrameRef.current) {
          const img = getNearestLoadedFrame(nextRenderFrame);
          if (img) {
            renderDrawable(img);
            lastRenderedFrameRef.current = nextRenderFrame;

            if (onFrameChangeRef.current) {
              onFrameChangeRef.current(nextRenderFrame, targetFrameRef.current);
            }
          }
        }

        // Trigger progressive loading outward if user has moved
        if (Math.abs(nextRenderFrame - lastFrameRequested) >= 3) {
          lastFrameRequested = nextRenderFrame;
          requestSurroundingFrames(nextRenderFrame);
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [lerpSpeed, totalFrames, getNearestLoadedFrame, renderDrawable, requestSurroundingFrames]);

  /**
   * IntersectionObserver & Visibility Pausing (Saves GPU/CPU when offscreen)
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isSectionInViewRef.current = entry.isIntersecting;
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(section);

    const onVisibilityChange = () => {
      isDocumentVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [sectionRef]);

  // First frame URL for preload link
  const firstFrameHref = resolveFrameUrl(1);

  return (
    <>
      {preloadFirstFrame && (
        <link rel="preload" as="image" href={firstFrameHref} />
      )}

      <div
        id={id}
        ref={sectionRef as React.RefObject<HTMLDivElement>}
        className={`relative w-full ${className}`}
        style={{ height: `${scrollDistanceVh}vh` }}
      >
        {/* Sticky 100vh Canvas Viewport */}
        <div
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={{ willChange: "transform", transform: "translateZ(0)" }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full pointer-events-none"
            style={{ willChange: "contents", transform: "translateZ(0)" }}
          />

          {/* Cinematic Dark Overlay */}
          {overlayOpacity > 0 && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
              aria-hidden="true"
            />
          )}

          {/* Foreground Children (HUD, Storytelling, Certifications) */}
          <div className="relative z-10 h-full w-full">{children}</div>

          {/* Lightweight Initial Batch Progress Indicator */}
          {!initialReady && (
            <div className="pointer-events-none absolute bottom-12 right-6 z-30 flex flex-col items-end gap-2 px-6 text-right md:bottom-16 md:right-10">
              <div className="h-0.5 w-48 bg-white/10 md:w-64">
                <div
                  className="h-full bg-accent transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(212,162,47,0.8)]"
                  style={{ width: `${loadPercent}%` }}
                />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-400">
                Initializing Sequence &middot; {loadPercent}%
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

