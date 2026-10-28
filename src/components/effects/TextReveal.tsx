"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { portfolioConfig } from "@/config/portfolio.config";

interface TextRevealProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delayMs?: number;
  trigger?: boolean;
}

export function TextReveal({
  children,
  className = "",
  as: Component = "h2",
  delayMs = 0,
  trigger = true,
}: TextRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!trigger) return;

    if (!portfolioConfig.effects.textReveal) {
      setIsVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [trigger, delayMs]);

  const words = children.split(" ");

  if (!portfolioConfig.effects.textReveal) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      ref={containerRef as any}
      className={`${className} inline-flex flex-wrap gap-x-[0.28em]`}
    >
      {words.map((word, wordIndex) => (
        <span
          key={wordIndex}
          className="inline-block overflow-hidden align-top leading-[1.1]"
        >
          <span
            className="inline-block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
            style={{
              transform: isVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 110%, 0)",
              transitionDelay: `${wordIndex * 45}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </Component>
  );
}
