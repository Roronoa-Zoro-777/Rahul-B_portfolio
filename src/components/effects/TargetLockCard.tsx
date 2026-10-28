"use client";

import { useRef, useState, ReactNode, MouseEvent } from "react";
import { portfolioConfig } from "@/config/portfolio.config";

interface TargetLockCardProps {
  children: ReactNode;
  className?: string;
}

export function TargetLockCard({ children, className = "" }: TargetLockCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg)");
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });
  const [isLocked, setIsLocked] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!portfolioConfig.effects.cardTilt) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (-8deg to +8deg)
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18,
    });
  };

  const handleMouseEnter = () => {
    setIsLocked(true);
  };

  const handleMouseLeave = () => {
    setIsLocked(false);
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`interactive-lock relative transition-transform duration-300 ease-out will-change-transform ${className}`}
      style={{ transform, transformStyle: "preserve-3d" }}
    >
      {/* 3D Target Lock Brackets on Hover */}
      <div
        className={`pointer-events-none absolute -inset-1.5 transition-all duration-300 ${
          isLocked ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        aria-hidden="true"
      >
        <div className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-accent" />
        <div className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-accent" />
        <div className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-accent" />
        <div className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-accent" />
      </div>

      {/* Dynamic Cursor Glare */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 260px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,${glarePosition.opacity}), transparent 80%)`,
        }}
        aria-hidden="true"
      />

      {children}
    </div>
  );
}
