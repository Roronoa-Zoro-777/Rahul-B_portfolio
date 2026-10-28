"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { portfolioConfig } from "@/config/portfolio.config";

export function useScrollVelocityEffects() {
  const lenis = useLenis();
  const [velocityState, setVelocityState] = useState({
    skewDeg: 0,
    rgbSplitPx: 0,
    isHighVelocity: false,
  });

  const currentVelocity = useRef(0);
  const targetVelocity = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!portfolioConfig.effects.velocityAberration) return;

    const onScroll = (e: { velocity: number }) => {
      targetVelocity.current = e.velocity || 0;
    };

    if (lenis) {
      lenis.on("scroll", onScroll);
    }

    const loop = () => {
      // Smoothly lerp towards target, then decay target towards 0
      currentVelocity.current += (targetVelocity.current - currentVelocity.current) * 0.12;
      targetVelocity.current *= 0.88;

      const v = currentVelocity.current;
      const clampedV = Math.max(-25, Math.min(25, v));
      
      // Calculate skew degrees (capped at 1.2 degrees)
      const skewDeg = (clampedV / 25) * 1.2;
      // Calculate RGB split offset in pixels (0 to 3.5px)
      const rgbSplitPx = Math.min(3.5, Math.abs(clampedV) * 0.14);

      setVelocityState({
        skewDeg: Math.round(skewDeg * 100) / 100,
        rgbSplitPx: Math.round(rgbSplitPx * 100) / 100,
        isHighVelocity: Math.abs(clampedV) > 3,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (lenis) lenis.off("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [lenis]);

  return velocityState;
}
