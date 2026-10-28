"use client";

import { useImperativeHandle, useRef, forwardRef, useCallback } from "react";
import { portfolioConfig, StoryBeat } from "@/config/portfolio.config";

export interface ScrollStorytellingHandle {
  setFrame: (frame: number) => void;
}

interface ScrollStorytellingProps {
  currentFrame?: number;
}

export const ScrollStorytelling = forwardRef<
  ScrollStorytellingHandle,
  ScrollStorytellingProps
>(function ScrollStorytelling(_props, ref) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const beats = portfolioConfig.storyBeats;

  const updateBeatDOM = useCallback(
    (frame: number) => {
      const fadeInMargin = 15;
      const fadeOutMargin = 15;

      beats.forEach((beat: StoryBeat, index: number) => {
        const el = cardRefs.current[index];
        if (!el) return;

        const isVisible =
          frame >= beat.startFrame - fadeInMargin &&
          frame <= beat.endFrame + fadeOutMargin;

        let opacity = 0;
        let translateY = 18;

        if (isVisible) {
          if (frame < beat.startFrame) {
            const progress = (frame - (beat.startFrame - fadeInMargin)) / fadeInMargin;
            opacity = Math.max(0, Math.min(1, progress));
            translateY = (1 - opacity) * 16;
          } else if (frame > beat.endFrame) {
            const progress = (beat.endFrame + fadeOutMargin - frame) / fadeOutMargin;
            opacity = Math.max(0, Math.min(1, progress));
            translateY = (1 - opacity) * -16;
          } else {
            opacity = 1;
            translateY = 0;
          }
        }

        el.style.opacity = String(opacity);
        el.style.transform = `translate3d(0, ${translateY}px, 0)`;
        el.style.visibility = opacity > 0.01 ? "visible" : "hidden";
        el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      });
    },
    [beats]
  );

  useImperativeHandle(
    ref,
    () => ({
      setFrame: (frame: number) => {
        updateBeatDOM(frame);
      },
    }),
    [updateBeatDOM]
  );

  if (!portfolioConfig.effects.scrollStorytelling) return null;

  return (
    <>
      {beats.map((beat: StoryBeat, index: number) => {
        const positionClasses =
          index === 0
            ? "top-[22%] right-6 md:right-14"
            : index === 1
            ? "top-1/2 -translate-y-1/2 right-6 md:right-14"
            : "bottom-24 right-6 md:bottom-28 md:right-14";

        return (
          <div
            key={beat.id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className={`pointer-events-none absolute ${positionClasses} z-20 w-[min(420px,86vw)] will-change-transform`}
            style={{
              opacity: 0,
              transform: "translate3d(0, 18px, 0)",
              visibility: "hidden",
            }}
          >
            <figure className="card-surface frame-quote pointer-events-auto relative overflow-hidden rounded-2xl border border-white/15 bg-black/75 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.85)] backdrop-blur-md md:p-6">
              {/* Tactical Corner Bracket */}
              <div className="absolute right-3 top-3 h-2 w-2 border-r border-t border-accent" />
              <div className="absolute bottom-3 left-3 h-2 w-2 border-b border-l border-accent" />

              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
                {beat.label}
              </span>

              <blockquote className="mt-3 font-sans text-lg font-medium leading-snug tracking-tight text-white md:text-xl">
                &ldquo;{beat.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="font-sans text-xs font-semibold text-zinc-300">
                  {beat.speaker}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent/80">
                  {beat.subtext}
                </span>
              </figcaption>
            </figure>
          </div>
        );
      })}
    </>
  );
});
