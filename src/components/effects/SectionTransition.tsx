"use client";

import { useEffect, useState, useRef } from "react";
import { portfolioConfig } from "@/config/portfolio.config";

interface SectionTransitionProps {
  sectionId: string;
}

export function SectionTransition({ sectionId }: SectionTransitionProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!portfolioConfig.effects.sectionGlitch) return;

    const el = document.getElementById(sectionId);
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setIsGlitching(true);
            setTimeout(() => setIsGlitching(false), 300);
          } else if (!entry.isIntersecting) {
            hasTriggeredRef.current = false;
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [sectionId]);

  if (!portfolioConfig.effects.sectionGlitch || !isGlitching) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Tactical White/Gold Flash (80ms) */}
      <div className="absolute inset-0 bg-accent/10 mix-blend-screen transition-opacity duration-150 animate-pulse" />

      {/* 2. Fast Scan Horizontal Slice */}
      <div
        className="absolute inset-x-0 h-1 bg-accent/60 shadow-[0_0_15px_rgba(212,162,47,0.9)] animate-scanline"
        style={{ top: "35%" }}
      />
    </div>
  );
}
