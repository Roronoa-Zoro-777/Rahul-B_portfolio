"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { soundController } from "@/components/effects/SoundController";

export function QuickNavHud() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const lenis = useLenis();

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          if (scrollable > 0) {
            const current = Math.min(1, Math.max(0, window.scrollY / scrollable));
            setProgress(Math.round(current * 100));
            setVisible(window.scrollY > 300);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    soundController.playShot();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lenis]);

  return (
    <aside
      aria-label="Quick Navigation Controls"
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 transition-all duration-300 md:bottom-8 md:right-8 ${
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="liquid-glass flex items-center gap-2 rounded-full border border-white/20 bg-black/80 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_16px_rgba(212,162,47,0.2)] backdrop-blur-xl">
        {/* Progress readout pill */}
        <div className="flex items-center gap-1.5 px-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(212,162,47,0.8)] animate-pulse" />
          <span>{progress}%</span>
        </div>

        {/* Scroll to Top button */}
        <button
          type="button"
          onClick={scrollToTop}
          onMouseEnter={() => soundController.playTick()}
          aria-label="Scroll back to top"
          title="Scroll back to top"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white transition-all duration-200 hover:scale-110 hover:border-accent hover:bg-accent hover:text-black hover:shadow-[0_0_12px_rgba(212,162,47,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
        >
          <ArrowUp size={14} weight="bold" />
        </button>
      </div>
    </aside>
  );
}
