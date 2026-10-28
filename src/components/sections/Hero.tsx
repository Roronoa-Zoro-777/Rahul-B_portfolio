"use client";

import { useCallback, useRef } from "react";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { HudFrame } from "@/components/ui/HudFrame";
import { portfolioConfig } from "@/config/portfolio.config";
import { ScrollFrameSequence } from "@/components/effects/ScrollFrameSequence";
import { FpsHudOverlay, FpsHudOverlayHandle } from "@/components/effects/FpsHudOverlay";
import { ScrollStorytelling, ScrollStorytellingHandle } from "@/components/effects/ScrollStorytelling";
import { useScrollVelocityEffects } from "@/components/effects/useScrollVelocityEffects";
import { TextReveal } from "@/components/effects/TextReveal";

export function Hero() {
  const heroTextRef = useRef<HTMLDivElement | null>(null);
  const bigLeftTextRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const frameReadoutRef = useRef<HTMLSpanElement | null>(null);

  const fpsHudRef = useRef<FpsHudOverlayHandle | null>(null);
  const storytellingRef = useRef<ScrollStorytellingHandle | null>(null);

  const activeProgressRef = useRef(0);
  const activeFrameRef = useRef(1);

  // Velocity effect hook (chromatic aberration & subtle skew)
  const velocityEffects = useScrollVelocityEffects();

  const handleScrollProgress = useCallback((progress: number) => {
    activeProgressRef.current = progress;

    // Bottom progress bar (Zero React re-render)
    if (progressFillRef.current) {
      progressFillRef.current.style.transform = `scaleX(${progress})`;
    }

    // Hero title fade out in first 8%
    if (heroTextRef.current) {
      const fadeOutEnd = 0.08;
      const opacity = Math.max(0, 1 - progress / fadeOutEnd);
      heroTextRef.current.style.opacity = String(opacity);
      heroTextRef.current.style.transform = `translate3d(0, ${(1 - opacity) * 14}px, 0)`;
    }

    // Left intro text reveal between 10% and 34%
    if (bigLeftTextRef.current) {
      const op =
        progress < 0.1
          ? 0
          : progress < 0.18
          ? (progress - 0.1) / 0.08
          : Math.max(0, 1 - (progress - 0.34) / 0.1);
      bigLeftTextRef.current.style.opacity = String(op);
      bigLeftTextRef.current.style.transform = `translate3d(0, ${(1 - op) * 16}px, 0)`;
    }

    fpsHudRef.current?.updateHud(progress, activeFrameRef.current);
  }, []);

  const handleFrameChange = useCallback((frameIndex: number) => {
    activeFrameRef.current = frameIndex;

    // Bottom frame readout (Direct DOM update)
    if (frameReadoutRef.current) {
      const frameNum = String(frameIndex).padStart(3, "0");
      frameReadoutRef.current.textContent = `FRAME ${frameNum} / ${portfolioConfig.sequence.totalFrames}`;
    }

    storytellingRef.current?.setFrame(frameIndex);
    fpsHudRef.current?.updateHud(activeProgressRef.current, frameIndex);
  }, []);

  return (
    <section id="hero" className="relative w-full bg-background">
      <ScrollFrameSequence
        folder="/frames/home"
        mobileFolder="/frames/home/mobile"
        prefix="frame_"
        digits={4}
        extension=".webp"
        totalFrames={600}
        scrollDistanceVh={portfolioConfig.sequence.scrollDistanceVh}
        lerpSpeed={portfolioConfig.sequence.lerpSpeed}
        onScrollProgress={handleScrollProgress}
        onFrameChange={handleFrameChange}
        overlayOpacity={0}
      >
        {/* Cinematic Backdrop Radial Gradients */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,11,0.92) 0%, rgba(10,10,11,0.52) 28%, transparent 62%), radial-gradient(120% 80% at 50% 10%, transparent 30%, rgba(10,10,11,0.35) 70%, rgba(10,10,11,0.78) 100%)",
          }}
        />

        {/* Tactical HUD Corner Frames */}
        <div className="pointer-events-none absolute left-6 top-24 text-accent md:left-10 md:top-28">
          <HudFrame corner="tl" size={26} />
        </div>
        <div className="pointer-events-none absolute right-6 top-24 text-accent md:right-10 md:top-28">
          <HudFrame corner="tr" size={26} />
        </div>
        <div className="pointer-events-none absolute bottom-14 left-6 text-accent md:bottom-16 md:left-10">
          <HudFrame corner="bl" size={26} />
        </div>
        <div className="pointer-events-none absolute bottom-14 right-6 text-accent md:bottom-16 md:right-10">
          <HudFrame corner="br" size={26} />
        </div>

        {/* Live FPS & HUD Energy Layer (Imperative DOM updates, 0 React re-renders) */}
        <FpsHudOverlay
          ref={fpsHudRef}
          totalFrames={portfolioConfig.sequence.totalFrames}
          activeSector="SECTOR 01 // ORBITAL DEPLOY"
        />

        {/* Hero Title Reveal */}
        <div
          ref={heroTextRef}
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start gap-4 px-6 pb-24 will-change-transform md:px-12 md:pb-28"
          style={{
            transform: `translate3d(0, 0, 0) skewY(${velocityEffects.skewDeg * 0.5}deg)`,
          }}
        >
          <EyebrowBadge>DATA ANALYTICS // PROFILE // ONLINE</EyebrowBadge>
          <h1 className="max-w-[14ch] font-sans text-5xl font-bold leading-[0.95] tracking-tighter text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.85)] md:text-7xl lg:text-8xl">
            <span className="block text-zinc-300">I am</span>
            <TextReveal as="span" className="text-[#f4bd45]" delayMs={150}>
              Rahul B
            </TextReveal>
          </h1>
        </div>

        {/* Left Interactive Narrative Block */}
        <div
          ref={bigLeftTextRef}
          className="pointer-events-none absolute bottom-16 left-6 z-10 flex max-w-[88%] flex-col gap-4 will-change-transform md:bottom-20 md:left-12 md:max-w-[42%]"
          style={{ opacity: 0 }}
        >
          <span className="relative -top-2 inline-flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(212,162,47,0.85)]"
            />
            Profile &mdash; Data Analytics
          </span>
          <h2 className="font-sans text-[clamp(2.8rem,6.5vw,5.8rem)] font-bold leading-[0.88] tracking-tighter text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.85)]">
            Data
            <br />
            <span className="text-[#f4bd45]">Analyst.</span>
          </h2>
          <div className="card-surface frame-quote pointer-events-auto rounded-xl p-4 md:p-5">
            <p className="font-sans text-sm font-normal leading-relaxed text-zinc-300 [text-shadow:0_2px_10px_rgba(0,0,0,0.9)] md:text-base">
              I transform raw, unstructured data into clean visual reports and actionable insights.
              Experienced in data modeling, exploratory analysis, and performance tracking.
            </p>
          </div>
        </div>

        {/* Scroll-Synced Storytelling (Imperative DOM updates, 0 React re-renders) */}
        <ScrollStorytelling ref={storytellingRef} />

        {/* Bottom Progress Bar & Readouts */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
          <div className="mx-6 mb-3 h-[2px] bg-white/10 md:mx-10">
            <div
              ref={progressFillRef}
              className="h-full origin-left bg-accent shadow-[0_0_8px_rgba(212,162,47,0.7)]"
              style={{ transform: "scaleX(0)", willChange: "transform" }}
            />
          </div>
          <div className="mx-6 flex items-center justify-between pb-4 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400 md:mx-10">
            <span ref={frameReadoutRef}>
              FRAME 001 / {portfolioConfig.sequence.totalFrames}
            </span>
            <span className="text-accent">RAHUL // DATA ANALYST</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              Scroll <span aria-hidden>&darr;</span>
            </span>
          </div>
        </div>
      </ScrollFrameSequence>
    </section>
  );
}
