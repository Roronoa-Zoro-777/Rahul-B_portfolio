"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, List, X } from "@phosphor-icons/react";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { soundController } from "@/components/effects/SoundController";
import { useLenis } from "@/components/providers/SmoothScrollProvider";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [batteryVisible, setBatteryVisible] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const lenis = useLenis();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let heroTop = 0;
    let heroScrollable = 0;

    const measureHero = () => {
      const hero = document.getElementById("hero");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        heroTop = rect.top + window.scrollY;
        heroScrollable = hero.offsetHeight - window.innerHeight;
      }
    };

    measureHero();
    window.addEventListener("resize", measureHero, { passive: true });

    const updateBattery = () => {
      if (heroScrollable <= 0) return;
      const progress = Math.min(1, Math.max(0, (window.scrollY - heroTop) / heroScrollable));
      const battery = Math.max(0, Math.round((1 - progress) * 100));
      setBatteryLevel((prev) => (Math.abs(prev - battery) >= 2 ? battery : prev));
      setBatteryVisible(progress < 0.99);
    };

    updateBattery();
    window.addEventListener("scroll", updateBattery, { passive: true });
    return () => {
      window.removeEventListener("resize", measureHero);
      window.removeEventListener("scroll", updateBattery);
    };
  }, []);

  const handleScrollTo = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    soundController.playShot();
    setMenuOpen(false);

    if (pathname === "/") {
      const el = document.getElementById(targetId);
      if (el) {
        if (lenis) {
          lenis.scrollTo(el, { offset: -70, duration: 1.2 });
        } else {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      router.push(`/#${targetId}`);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollTarget = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && (hash === "contact" || hash === "systems")) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            if (lenis) {
              lenis.scrollTo(el, { offset: -70, duration: 1.2 });
            } else {
              el.scrollIntoView({ behavior: "smooth" });
            }
          }
        }, 400);
      }
    };

    scrollTarget();
    window.addEventListener("hashchange", scrollTarget);
    return () => window.removeEventListener("hashchange", scrollTarget);
  }, [lenis, pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-[border-color,background-color] duration-300 ${scrolled
          ? "border-white/10 bg-background/60 backdrop-blur-md"
          : "border-transparent bg-transparent"
        }`}
    >
      <div className="relative mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-8 md:py-5">
        <MagneticButton strength={0.2}>
          <Link
            href="/"
            onMouseEnter={() => soundController.playTick()}
            onClick={() => soundController.playShot()}
            className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full px-2 py-1"
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(212,162,47,0.9)]"
            />
            RAHUL B / PORTFOLIO
          </Link>
        </MagneticButton>

        <nav className="hidden items-center gap-3 md:flex" aria-label="Main Navigation">
          <MagneticButton strength={0.25}>
            <a
              href="/#systems"
              onMouseEnter={() => soundController.playTick()}
              onClick={(e) => handleScrollTo(e, "systems")}
              className="nav-glass relative inline-flex items-center rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-white/90 transition-all duration-300 hover:scale-105 hover:bg-white/[0.1] hover:text-accent hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Skills
            </a>
          </MagneticButton>

          <MagneticButton strength={0.25}>
            <Link
              href="/projects"
              onMouseEnter={() => soundController.playTick()}
              onClick={() => soundController.playShot()}
              className={`nav-glass relative inline-flex items-center rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] transition-all duration-300 hover:scale-105 hover:bg-white/[0.1] hover:text-accent hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${pathname === "/projects"
                  ? "border-accent/60 bg-accent/15 text-accent shadow-[0_0_16px_rgba(212,162,47,0.25)]"
                  : "text-white/90"
                }`}
            >
              Projects
            </Link>
          </MagneticButton>

          <MagneticButton strength={0.25}>
            <Link
              href="/certificates"
              onMouseEnter={() => soundController.playTick()}
              onClick={() => soundController.playShot()}
              className={`nav-glass relative inline-flex items-center rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.24em] transition-all duration-300 hover:scale-105 hover:bg-white/[0.1] hover:text-accent hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${pathname === "/certificates"
                  ? "border-accent/60 bg-accent/15 text-accent shadow-[0_0_16px_rgba(212,162,47,0.25)]"
                  : "text-white/90"
                }`}
            >
              Certificates
            </Link>
          </MagneticButton>

          <MagneticButton strength={0.25}>
            <a
              href="/#contact"
              onMouseEnter={() => soundController.playTick()}
              onClick={(e) => handleScrollTo(e, "contact")}
              className="nav-glass group relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground transition-all duration-300 hover:scale-105 hover:bg-white/[0.1] hover:text-accent hover:shadow-[0_8px_24px_rgba(255,255,255,0.08)] active:translate-y-[1px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Contact
              <ArrowUpRight
                size={14}
                weight="bold"
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </MagneticButton>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => {
              soundController.playShot();
              setMenuOpen((open) => !open);
            }}
            className={`nav-glass inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-all duration-300 hover:scale-105 hover:bg-white/[0.1] hover:text-accent ${menuOpen ? "rotate-90 scale-110" : "rotate-0"
              }`}
          >
            {menuOpen ? (
              <X size={20} weight="bold" className="transition-transform duration-300" />
            ) : (
              <List size={20} weight="bold" className="transition-transform duration-300" />
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="nav-glass absolute inset-x-6 top-full mt-3 flex flex-col gap-2 rounded-3xl p-3 md:hidden" aria-label="Mobile Navigation">
            <a
              href="/#systems"
              onClick={(e) => handleScrollTo(e, "systems")}
              className="rounded-2xl px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-white/90 transition-colors hover:bg-white/[0.1] hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Skills
            </a>
            <Link
              href="/projects"
              onClick={() => {
                soundController.playShot();
                setMenuOpen(false);
              }}
              className={`rounded-2xl px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] transition-colors hover:bg-white/[0.1] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${pathname === "/projects" ? "bg-accent/15 text-accent" : "text-white/90"
                }`}
            >
              Projects
            </Link>
            <Link
              href="/certificates"
              onClick={() => {
                soundController.playShot();
                setMenuOpen(false);
              }}
              className={`rounded-2xl px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.24em] transition-colors hover:bg-white/[0.1] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${pathname === "/certificates" ? "bg-accent/15 text-accent" : "text-white/90"
                }`}
            >
              Certificates
            </Link>
            <a
              href="/#contact"
              onClick={(e) => handleScrollTo(e, "contact")}
              className="flex items-center justify-between rounded-2xl px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-white/[0.1] hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Contact
              <ArrowUpRight size={14} weight="bold" />
            </a>
          </nav>
        )}

        <div className={`nav-battery nav-glass absolute right-6 top-full mt-2 flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent transition-all duration-300 md:right-8 ${batteryVisible ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}>
          <span>Battery</span>
          <span className="battery-shell" aria-hidden>
            <span className="battery-fill" style={{ width: `${batteryLevel}%` }} />
          </span>
          <span>{batteryLevel}%</span>
        </div>
      </div>
    </header>
  );
}
