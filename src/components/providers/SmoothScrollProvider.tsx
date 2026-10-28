"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

type Props = { children: ReactNode };

export function SmoothScrollProvider({ children }: Props) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("lenis", "lenis-smooth");

    const instance = new Lenis({
      lerp: 0.12,
      duration: 0.8,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.0,
    });
    queueMicrotask(() => {
      setLenis(instance);
    });

    instance.on("scroll", ScrollTrigger.update);

    const updateTicker = (time: number) => {
      instance.raf(time * 1000);
    };

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      instance.destroy();
      root.classList.remove("lenis", "lenis-smooth");
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
