"use client";

import { portfolioConfig } from "@/config/portfolio.config";

export function CinematicOverlay() {
  if (!portfolioConfig.effects.cinematicOverlay) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 select-none overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Subtle Scanlines (GPU accelerated repeating gradient, 4% opacity) */}
      <div
        className="absolute inset-0 opacity-[0.04] will-change-transform"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* 2. Cinematic Vignette (radial dark edges) */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at center, transparent 45%, rgba(10, 10, 11, 0.45) 80%, rgba(10, 10, 11, 0.85) 100%)",
        }}
      />

      {/* 3. Pure SVG Micro Grain (5% opacity, mix-blend-mode overlay) */}
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
