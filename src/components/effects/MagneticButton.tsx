"use client";

import { useRef, ReactNode, MouseEvent } from "react";
import { portfolioConfig } from "@/config/portfolio.config";

interface MagneticProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.32,
}: MagneticProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!portfolioConfig.effects.magneticElements) return;
    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
  };

  const handleMouseLeave = () => {
    if (!portfolioConfig.effects.magneticElements) return;
    const element = elementRef.current;
    if (!element) return;

    element.style.transform = "translate3d(0, 0, 0)";
    element.style.transition = "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";
  };

  const handleMouseEnter = () => {
    if (!portfolioConfig.effects.magneticElements) return;
    const element = elementRef.current;
    if (!element) return;
    element.style.transition = "transform 100ms ease-out";
  };

  return (
    <div
      ref={elementRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block will-change-transform interactive-lock ${className}`}
    >
      {children}
    </div>
  );
}
