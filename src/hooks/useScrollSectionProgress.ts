"use client";

import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { useEffect, type RefObject } from "react";

export function getSectionScrollProgress(section: HTMLElement | null): number {
  if (!section) return 0;
  const scrollable = section.offsetHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return Math.min(
    1,
    Math.max(0, -section.getBoundingClientRect().top / scrollable),
  );
}

export function useScrollSectionProgress(
  sectionRef: RefObject<HTMLElement | null>,
  onScroll: (progress: number) => void,
  enabled = true,
) {
  const lenis = useLenis();

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;
    const update = () => {
      onScroll(getSectionScrollProgress(sectionRef.current));
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    };

    if (lenis) lenis.on("scroll", handleScroll);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      lenis?.off("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lenis, enabled, onScroll, sectionRef]);
}
