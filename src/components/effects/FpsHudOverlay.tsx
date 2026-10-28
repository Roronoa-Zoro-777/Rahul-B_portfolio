"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { portfolioConfig } from "@/config/portfolio.config";

export interface FpsHudOverlayHandle {
  updateHud: (progress: number, currentFrame: number) => void;
}

interface FpsHudOverlayProps {
  progress?: number;
  currentFrame?: number;
  totalFrames?: number;
  activeSector?: string;
}

export const FpsHudOverlay = forwardRef<FpsHudOverlayHandle, FpsHudOverlayProps>(
  function FpsHudOverlay(
    {
      progress = 0,
      currentFrame = 1,
      totalFrames = portfolioConfig.sequence.totalFrames,
      activeSector = "LEVEL 01 // SECTOR ALPHA",
    },
    ref
  ) {
    const [fps, setFps] = useState(60);
    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(performance.now());
    const rafRef = useRef<number | null>(null);

    const frameTextRef = useRef<HTMLSpanElement | null>(null);
    const ammoPercentRef = useRef<HTMLSpanElement | null>(null);
    const barSegmentRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
      if (!portfolioConfig.effects.fpsHud) return;

      const measureFps = (now: number) => {
        frameCountRef.current++;
        const elapsed = now - lastTimeRef.current;

        if (elapsed >= 500) {
          const calculatedFps = Math.round((frameCountRef.current * 1000) / elapsed);
          setFps(Math.min(120, Math.max(15, calculatedFps)));
          frameCountRef.current = 0;
          lastTimeRef.current = now;
        }

        rafRef.current = requestAnimationFrame(measureFps);
      };

      rafRef.current = requestAnimationFrame(measureFps);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        updateHud: (prog: number, frame: number) => {
          const ammo = Math.round((1 - prog) * 100);
          const fStr = String(Math.max(1, Math.round(frame))).padStart(3, "0");

          if (frameTextRef.current) {
            frameTextRef.current.textContent = `FRAME ${fStr}/${totalFrames}`;
          }
          if (ammoPercentRef.current) {
            ammoPercentRef.current.textContent = `${ammo}%`;
          }

          barSegmentRefs.current.forEach((segment, i) => {
            if (!segment) return;
            const threshold = (i + 1) * (100 / 12);
            const active = ammo >= threshold - 4;
            segment.style.backgroundColor = active
              ? ammo > 25
                ? portfolioConfig.theme.accent
                : "#ef4444"
              : "rgba(255,255,255,0.06)";
            segment.style.boxShadow = active
              ? ammo > 25
                ? `0 0 6px ${portfolioConfig.theme.accent}66`
                : "0 0 6px rgba(239,68,68,0.7)"
              : "none";
          });
        },
      }),
      [totalFrames]
    );

    if (!portfolioConfig.effects.fpsHud) return null;

    const initialAmmo = Math.round((1 - progress) * 100);
    const initialFrame = String(Math.max(1, Math.round(currentFrame))).padStart(3, "0");

    return (
      <div
        className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden font-mono text-[10px] tracking-[0.2em] text-zinc-400"
        aria-hidden="true"
      >
        {/* Top Left: Live FPS & Hardware Status */}
        <div className="absolute left-6 top-6 flex items-center gap-3 rounded border border-white/5 bg-black/40 px-3 py-1.5 backdrop-blur-sm md:left-8 md:top-8">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-zinc-200">{fps}</span>
            <span className="text-zinc-500">FPS</span>
          </span>
          <span className="text-white/10">|</span>
          <span className="text-zinc-400">SYNC 60Hz</span>
        </div>

        {/* Top Right: Sector / Level Counter */}
        <div className="absolute right-6 top-6 flex items-center gap-2 rounded border border-white/5 bg-black/40 px-3 py-1.5 backdrop-blur-sm md:right-8 md:top-8">
          <span className="text-accent">{activeSector}</span>
          <span className="text-white/15">/</span>
          <span ref={frameTextRef} className="text-zinc-400">
            FRAME {initialFrame}/{totalFrames}
          </span>
        </div>

        {/* Bottom Right: Tactical Ammo / Core Integrity Gauge */}
        <div className="absolute bottom-16 right-6 flex flex-col items-end gap-1.5 md:bottom-20 md:right-10">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-zinc-400">
            <span>PLASMA COUPLING</span>
            <span ref={ammoPercentRef} className="text-accent font-semibold">
              {initialAmmo}%
            </span>
          </div>
          <div className="flex h-2.5 w-36 gap-[3px] rounded border border-white/15 bg-black/50 p-[2px] md:w-44">
            {Array.from({ length: 12 }).map((_, i) => {
              const threshold = (i + 1) * (100 / 12);
              const active = initialAmmo >= threshold - 4;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    barSegmentRefs.current[i] = el;
                  }}
                  className="h-full flex-1 rounded-[1px] transition-colors duration-150"
                  style={{
                    backgroundColor: active
                      ? initialAmmo > 25
                        ? portfolioConfig.theme.accent
                        : "#ef4444"
                      : "rgba(255,255,255,0.06)",
                    boxShadow: active
                      ? initialAmmo > 25
                        ? `0 0 6px ${portfolioConfig.theme.accent}66`
                        : "0 0 6px rgba(239,68,68,0.7)"
                      : "none",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Corner Tactical Ticks */}
        <div className="absolute left-6 top-24 h-4 w-4 border-l border-t border-accent/40 md:left-8 md:top-28" />
        <div className="absolute right-6 top-24 h-4 w-4 border-r border-t border-accent/40 md:right-8 md:top-28" />
        <div className="absolute bottom-20 left-6 h-4 w-4 border-b border-l border-accent/40 md:bottom-24 md:left-8" />
        <div className="absolute bottom-20 right-6 h-4 w-4 border-b border-r border-accent/40 md:bottom-24 md:right-8" />
      </div>
    );
  }
);
