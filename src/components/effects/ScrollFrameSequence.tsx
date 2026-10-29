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
  /** Scroll height in vh for pinning wrapper (default 450 = 450vh) */
  scrollDistanceVh?: number;
  /** Lerp smoothing factor (default 0.28 for instant, responsive tracking) */
  lerpSpeed?: number;
  /** Number of initial frames required before unlocking page (default 40) */
  initialBatchSize?: number;
  /** Dynamic path resolver */
  getFramePath?: (frameNumber: number, isMobile?: boolean) => string;
  /** Folder/prefix/digits/extension configuration */
  folder?: string;
  prefix?: string;
  digits?: number;
  extension?: string;
  mobileFolder?: string;
  /** Optional: preloadFirstFrame (deprecated) */
  preloadFirstFrame?: boolean;
  /** Dark overlay opacity (0 to 1, default 0.35) */
  overlayOpacity?: number;
  /** Children rendered in sticky container above the canvas */
  children?: ReactNode;
  /** Non-react callbacks to avoid triggering re-renders */
  onScrollProgress?: (progress: number) => void;
  onFrameChange?: (frameIndex: number, targetFrame: number) => void;
  /** Ref forwarding for the wrapper section */
  sectionRefForward?: React.RefObject<HTMLElement | null>;
}

export const ScrollFrameSequence = memo(function ScrollFrameSequence({
  id,
  className = "",
  totalFrames = 600,
  scrollDistanceVh = 450,
  lerpSpeed = 0.28,
  initialBatchSize = 40,
  getFramePath,
  folder = "/frames/home",
  prefix = "frame_",
  digits = 4,
  extension = ".webp",
  mobileFolder,
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

  // Animation & Frame tracking refs (No React state on scroll for 120 FPS performance)
  const targetFrameRef = useRef(1);
  const currentFrameRef = useRef(1);
  const lastRenderedFrameRef = useRef(-1);
  const lastScrollDirectionRef = useRef<"down" | "up">("down");
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Status flags
  const isSectionInViewRef = useRef(true);
  const isDocumentVisibleRef = useRef(true);
  const prefersReducedMotionRef = useRef(false);
  const isMobileRef = useRef(false);

  // Cached layout measurements
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

  // Complete In-Memory Frame Cache (Zero Eviction: WebP frames are ~2.7KB each, total ~1.8MB)
  const imageCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const loadedFramesRef = useRef<Set<number>>(new Set());
  const pendingLoadsRef = useRef<Set<number>>(new Set());

  // UI state for initial load readiness and progress
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
      ctx.imageSmoothingQuality = "high";
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

      // Search outward from target in both directions
      for (let dist = 1; dist < totalFrames; dist++) {
        // Check in opposite direction of current scroll first
        const isUp = lastScrollDirectionRef.current === "up";
        const first = isUp ? target + dist : target - dist;
        const second = isUp ? target - dist : target + dist;

        if (first >= 1 && first <= totalFrames && loaded.has(first)) {
          return cache.get(first) || null;
        }
        if (second >= 1 && second <= totalFrames && loaded.has(second)) {
          return cache.get(second) || null;
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

        const onDone = () => {
          pending.delete(clamped);
          if ("decode" in img) {
            img.decode().catch(() => {});
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
   * Prioritized Dual-Direction Loading (Preloads forward AND reverse)
   */
  const requestSurroundingFrames = useCallback(
    (centerFrame: number) => {
      const isMobile = isMobileRef.current || (typeof window !== "undefined" && window.innerWidth < 768);
      const isUp = lastScrollDirectionRef.current === "up";
      // On mobile devices, keep prefetch window tight (3 forward, 1 reverse) to prevent network queuing and scroll stutter
      const forwardRadius = isMobile ? 3 : 20;
      const reverseRadius = isMobile ? 1 : 8;

      // Primary direction
      const primaryStart = centerFrame;
      const primaryEnd = isUp
        ? Math.max(1, centerFrame - forwardRadius)
        : Math.min(totalFrames, centerFrame + forwardRadius);
      const step = isUp ? -1 : 1;

      for (let f = primaryStart; isUp ? f >= primaryEnd : f <= primaryEnd; f += step) {
        if (!loadedFramesRef.current.has(f) && !pendingLoadsRef.current.has(f)) {
          loadSingleFrame(f);
        }
      }

      // Secondary opposite direction
      const secondaryEnd = isUp
        ? Math.min(totalFrames, centerFrame + reverseRadius)
        : Math.max(1, centerFrame - reverseRadius);
      const secondaryStep = isUp ? 1 : -1;

      for (let f = centerFrame; isUp ? f <= secondaryEnd : f >= secondaryEnd; f += secondaryStep) {
        if (!loadedFramesRef.current.has(f) && !pendingLoadsRef.current.has(f)) {
          loadSingleFrame(f);
        }
      }
    },
    [totalFrames, loadSingleFrame]
  );

  /**
   * Gentle background idle loader (runs only during idle to avoid saturating network for page navigation)
   */
  useEffect(() => {
    let isCancelled = false;
    // On mobile devices, rely purely on predictive scroll loading (requestSurroundingFrames)
    // to save battery and keep the network connection clear for instantaneous page navigation
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return;
    }

    let nextToLoad = 18;

    const loadNextChunk = () => {
      if (isCancelled || nextToLoad > totalFrames) return;

      const chunkLimit = Math.min(totalFrames, nextToLoad + 4);
      for (let f = nextToLoad; f <= chunkLimit; f++) {
        if (!loadedFramesRef.current.has(f) && !pendingLoadsRef.current.has(f)) {
          loadSingleFrame(f);
        }
      }
      nextToLoad = chunkLimit + 1;

      if (nextToLoad <= totalFrames) {
        if ("requestIdleCallback" in window) {
          (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(loadNextChunk);
        } else {
          setTimeout(loadNextChunk, 200);
        }
      }
    };

    // Begin gentle background idle preloading 2.5s after mount
    const timer = setTimeout(loadNextChunk, 2500);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [totalFrames, loadSingleFrame]);

  /**
   * Resize Canvas Backing Store (Optimized for High-DPI & Mobile)
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect mobile device
    const isMobile = window.innerWidth < 768;
    isMobileRef.current = isMobile;

    // Device Pixel Ratio capped at 1.0 on mobile for 120 FPS throughput, 1.5 on desktop
    const dpr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Recalculate layout cache
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const sectionTop = rect.top + scrollTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const scrollable = sectionHeight - height;
      layoutCacheRef.current = { sectionTop, sectionHeight, windowHeight: height, scrollable };
    }

    // Redraw current frame
    const img = getNearestLoadedFrame(Math.round(currentFrameRef.current));
    if (img) {
      renderDrawable(img);
    }
  }, [sectionRef, getNearestLoadedFrame, renderDrawable]);

  /**
   * High-Precision Scroll Handler: Zero Latency, Tracks Scroll 1:1
   */
  const handleScroll = useCallback(() => {
    let { sectionTop, scrollable } = layoutCacheRef.current;

    // Auto-repair layout cache if measurements are not yet ready
    if (scrollable <= 0 && sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      const curScroll = window.scrollY || window.pageYOffset || 0;
      sectionTop = rect.top + curScroll;
      const sectionHeight = sectionRef.current.offsetHeight;
      scrollable = sectionHeight - window.innerHeight;
      layoutCacheRef.current = {
        sectionTop,
        sectionHeight,
        windowHeight: window.innerHeight,
        scrollable,
      };
    }

    if (scrollable <= 0) return;

    // Current scroll position from window
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    // Track scroll direction for reverse scroll optimization
    if (scrollY > lastScrollYRef.current) {
      lastScrollDirectionRef.current = "down";
    } else if (scrollY < lastScrollYRef.current) {
      lastScrollDirectionRef.current = "up";
    }
    lastScrollYRef.current = scrollY;

    // Raw progress calculation (0.0 to 1.0)
    const rawProgress = (scrollY - sectionTop) / scrollable;
    const progress = Math.max(0, Math.min(1, rawProgress));

    // Target frame calculation (1 to totalFrames)
    targetFrameRef.current = 1 + progress * (totalFrames - 1);

    if (onScrollProgressRef.current) {
      onScrollProgressRef.current(progress);
    }
  }, [totalFrames, sectionRef]);

  /**
   * Initial Setup: Preload First Frame & Initial Batch (~40 frames)
   */
  useEffect(() => {
    prefersReducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    handleResize();

    let isCancelled = false;
    let loadedCount = 0;

    // 1. Immediate Frame 1 loading - unlock canvas display instantaneously
    loadSingleFrame(1).then((firstImg) => {
      if (isCancelled || !firstImg) return;
      renderDrawable(firstImg);
      lastRenderedFrameRef.current = 1;
      setInitialReady(true);
    });

    // 2. Fast initial batch: 6 frames on mobile, 14 on desktop to keep network bandwidth clear
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const initialBatch = Math.min(totalFrames, isMobile ? 6 : Math.min(14, initialBatchSize));
    for (let f = 1; f <= initialBatch; f++) {
      loadSingleFrame(f).then(() => {
        if (isCancelled) return;
        loadedCount++;
        setLoadPercent(Math.round((loadedCount / initialBatch) * 100));
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
   * Unified Scroll Listeners (Window + Lenis)
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
   * Ultra-Smooth Animation Loop with Adaptive Responsive Interpolation
   */
  useEffect(() => {
    let lastFrameRequested = 1;

    const loop = () => {
      if (prefersReducedMotionRef.current) {
        rafIdRef.current = requestAnimationFrame(loop);
        return;
      }

      if (isSectionInViewRef.current && isDocumentVisibleRef.current) {
        const diff = targetFrameRef.current - currentFrameRef.current;
        const absDiff = Math.abs(diff);
        const isMobile = isMobileRef.current;

        // Adaptive lerp: on mobile, track target frame 1:1 to eliminate lag behind native swipe momentum
        if (absDiff < 0.04 || isMobile) {
          currentFrameRef.current = targetFrameRef.current;
        } else {
          // Dynamic factor: when distance is large, catch up faster (prevents rubber-banding)
          const adaptiveFactor = Math.min(0.55, Math.max(lerpSpeed, absDiff * 0.025));
          currentFrameRef.current += diff * adaptiveFactor;
        }

        const nextRenderFrame = Math.max(
          1,
          Math.min(totalFrames, Math.round(currentFrameRef.current))
        );

        // Only redraw when the target integer frame changes
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

        // Trigger predictive preloading (throttled on mobile to protect network bandwidth)
        const frameThreshold = isMobile ? 4 : 2;
        if (Math.abs(nextRenderFrame - lastFrameRequested) >= frameThreshold) {
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
   * IntersectionObserver & Visibility Pausing (Saves GPU when offscreen)
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isSectionInViewRef.current = entry.isIntersecting;
      },
      { rootMargin: "300px 0px" }
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

  return (
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
    );
  }
);
