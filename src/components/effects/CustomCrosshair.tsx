"use client";

import { useEffect, useRef, useState } from "react";
import { portfolioConfig } from "@/config/portfolio.config";

export function CustomCrosshair() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  
  const mousePos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isRecoil, setIsRecoil] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!portfolioConfig.effects.customCrosshair) return;

    // Check if device is mobile or touch
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        window.matchMedia("(max-width: 768px)").matches ||
        window.matchMedia("(hover: none) and (pointer: coarse)").matches);
    if (isMobile) return;

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      if (!isVisible) setIsVisible(true);
    };

    const onMouseDown = () => setIsRecoil(true);
    const onMouseUp = () => setIsRecoil(false);
    const onMouseLeave = () => setIsVisible(false);

    // Track hovered interactive elements
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest("a, button, [role='button'], input, textarea, select, .interactive-lock");
      setIsHovered(Boolean(interactive));
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    // Smooth rAF cursor loop (lerp)
    const render = () => {
      const dx = mousePos.current.x - currentPos.current.x;
      const dy = mousePos.current.y - currentPos.current.y;

      currentPos.current.x += dx * 0.22;
      currentPos.current.y += dy * 0.22;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible]);

  if (!portfolioConfig.effects.customCrosshair) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {/* Outer Eased Crosshair Ring */}
      <div
        ref={cursorRef}
        className="pointer-events-none absolute -left-4 -top-4 will-change-transform"
      >
        <div
          className={`relative flex items-center justify-center transition-all duration-200 ease-out ${
            isHovered ? "h-11 w-11 -translate-x-1.5 -translate-y-1.5" : "h-8 w-8"
          } ${isRecoil ? "scale-75" : "scale-100"}`}
        >
          {/* Target Brackets */}
          <div
            className={`absolute inset-0 rounded-full border transition-all duration-200 ${
              isHovered
                ? "border-accent/80 shadow-[0_0_12px_rgba(212,162,47,0.6)]"
                : "border-white/30"
            }`}
          />
          {/* Top Ticks */}
          <div className="absolute top-0 h-1.5 w-[1px] bg-accent" />
          <div className="absolute bottom-0 h-1.5 w-[1px] bg-accent" />
          <div className="absolute left-0 h-[1px] w-1.5 bg-accent" />
          <div className="absolute right-0 h-[1px] w-1.5 bg-accent" />
        </div>
      </div>

      {/* Center Precise Dot (Immediate Mouse Follow) */}
      <div
        ref={dotRef}
        className="pointer-events-none absolute -left-[2px] -top-[2px] will-change-transform"
      >
        <div
          className={`h-1.5 w-1.5 rounded-full transition-transform duration-100 ${
            isHovered ? "bg-accent scale-150" : "bg-white/80 scale-100"
          } ${isRecoil ? "scale-50" : ""}`}
        />
      </div>
    </div>
  );
}
