"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  ArrowsOut,
  ArrowUpRight,
  DownloadSimple,
  X,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { certificatesList, Certificate } from "@/lib/certificates";
import { ScrollFrameSequence } from "@/components/effects/ScrollFrameSequence";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { soundController } from "@/components/effects/SoundController";

export interface ScrollCertificatesShowcaseProps {
  scrollDistanceVh?: number;
  totalFrames?: number;
}

export function ScrollCertificatesShowcase({
  scrollDistanceVh = 600,
  totalFrames = 300,
}: ScrollCertificatesShowcaseProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);
  const [modalCert, setModalCert] = useState<Certificate | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onMediaChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    media.addEventListener("change", onMediaChange);
    return () => media.removeEventListener("change", onMediaChange);
  }, []);

  /**
   * Scrubbed certificate animation: 0 React state updates on scroll!
   */
  const handleScrollProgress = useCallback((progress: number) => {
    const total = certificatesList.length; // 8
    const segDuration = 1 / total;
    const activeIndex = Math.min(total - 1, Math.max(0, Math.floor(progress * total)));

    // Update side progress indicator
    if (counterRef.current) {
      counterRef.current.textContent = `${activeIndex + 1} / ${total}`;
    }

    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleY(${progress})`;
    }

    // Update dots
    dotRefs.current.forEach((dot, idx) => {
      if (!dot) return;
      if (idx === activeIndex) {
        dot.style.backgroundColor = "var(--color-accent, #d4a22f)";
        dot.style.transform = "scale(1.4)";
        dot.style.boxShadow = "0 0 8px rgba(212,162,47,0.8)";
      } else {
        dot.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
        dot.style.transform = "scale(1)";
        dot.style.boxShadow = "none";
      }
    });

    // Animate each of the 8 certificates
    certificatesList.forEach((_, i) => {
      const el = cardRefs.current[i];
      if (!el) return;

      const segStart = i * segDuration;
      const segEnd = (i + 1) * segDuration;

      // Small 5% overlap allowance between exit and next enter
      const overlapMargin = segDuration * 0.05;
      const inRangeStart = Math.max(0, segStart - overlapMargin);
      const inRangeEnd = Math.min(1, segEnd + overlapMargin);

      if (progress < inRangeStart || progress > inRangeEnd) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.style.visibility = "hidden";
        return;
      }

      el.style.visibility = "visible";
      el.style.pointerEvents = "auto";

      const localProgress = Math.max(0, Math.min(1, (progress - segStart) / segDuration));

      let opacity = 1;
      let translateY = 0;
      let scale = 1;
      let rotX = 0;
      let rotY = 0;

      if (localProgress <= 0.2) {
        // 0-20%: animates IN (fade from 0, scale 0.85 -> 1, slide up 60px -> 0, slight 3D tilt settling to 0)
        const p = localProgress / 0.2;
        opacity = p;
        translateY = (1 - p) * 60;
        scale = 0.85 + p * 0.15;
        rotX = (1 - p) * 8;
        rotY = (1 - p) * -6;
      } else if (localProgress <= 0.75) {
        // 20-75%: holds, fully visible and centered, with subtle float/parallax
        const p = (localProgress - 0.2) / 0.55;
        opacity = 1;
        scale = 1.0;
        translateY = p * -12; // subtle float drift
        rotX = 0;
        rotY = 0;
      } else {
        // 75-100%: animates OUT (fade to 0, scale up to ~1.08, drift upward)
        const p = (localProgress - 0.75) / 0.25;
        opacity = 1 - p;
        translateY = -12 - p * 42;
        scale = 1.0 + p * 0.08;
        rotX = p * -6;
        rotY = p * 4;
      }

      el.style.opacity = String(opacity);
      el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
  }, []);

  // Set initial visibility on mount
  useEffect(() => {
    handleScrollProgress(0);
  }, [handleScrollProgress]);

  const handleOpenModal = (cert: Certificate) => {
    soundController.playShot();
    setModalCert(cert);
  };

  const handleCloseModal = useCallback(() => {
    soundController.playTick();
    setModalCert(null);
  }, []);

  const handlePrevCert = useCallback(() => {
    if (!modalCert) return;
    soundController.playTick();
    const idx = certificatesList.findIndex((c) => c.id === modalCert.id);
    const prev = (idx - 1 + certificatesList.length) % certificatesList.length;
    setModalCert(certificatesList[prev]);
  }, [modalCert]);

  const handleNextCert = useCallback(() => {
    if (!modalCert) return;
    soundController.playTick();
    const idx = certificatesList.findIndex((c) => c.id === modalCert.id);
    const next = (idx + 1) % certificatesList.length;
    setModalCert(certificatesList[next]);
  }, [modalCert]);

  useEffect(() => {
    if (!modalCert) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseModal();
      if (e.key === "ArrowLeft") handlePrevCert();
      if (e.key === "ArrowRight") handleNextCert();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalCert, handleCloseModal, handlePrevCert, handleNextCert]);

  // Reduced motion: standard stacked list fallback
  if (reducedMotion) {
    return (
      <section className="relative min-h-screen bg-background px-6 py-20 md:px-12">
        <div className="mx-auto flex max-w-4xl flex-col gap-12">
          <div>
            <EyebrowBadge>ARCHIVE // VERIFIED CREDENTIALS</EyebrowBadge>
            <h1 className="mt-3 font-sans text-3xl font-bold text-white md:text-5xl">
              Certified <span className="text-accent">Diplomas & Badges.</span>
            </h1>
            <p className="mt-2 font-sans text-sm text-zinc-400">
              8 authenticated credentials across Google Data Analytics, IBM Python Data Science, and corporate simulations.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {certificatesList.map((cert: Certificate) => (
              <article
                key={cert.id}
                className="liquid-glass flex flex-col gap-6 rounded-2xl border border-white/10 p-6 md:flex-row md:items-center"
              >
                <div className="relative aspect-[16/10] w-full max-w-xs shrink-0 overflow-hidden rounded-xl bg-black">
                  <Image
                    src={cert.image}
                    alt={cert.title}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase text-accent">
                    <span>{cert.issuer}</span>
                    <span>&middot;</span>
                    <span>{cert.year}</span>
                  </div>
                  <h2 className="font-sans text-xl font-bold text-white">{cert.title}</h2>
                  <p className="font-sans text-sm text-zinc-400">{cert.description}</p>
                  <div className="mt-3 flex items-center gap-3">
                    {cert.pdfUrl && (
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 font-mono text-xs font-bold text-black"
                      >
                        <DownloadSimple size={14} weight="bold" /> View PDF
                      </a>
                    )}
                    {cert.verificationUrl && (
                      <a
                        href={cert.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3.5 py-1.5 font-mono text-xs font-semibold text-white hover:text-accent"
                      >
                        Verify <ArrowUpRight size={14} weight="bold" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="certifications-sequence" className="relative w-full bg-black">
      <ScrollFrameSequence
        folder="/frames/cert"
        mobileFolder="/frames/cert/mobile"
        prefix="frame_"
        digits={4}
        extension=".webp"
        totalFrames={totalFrames}
        scrollDistanceVh={scrollDistanceVh}
        lerpSpeed={0.28}
        onScrollProgress={handleScrollProgress}
        overlayOpacity={0.3}
      >
        {/* Top Header Badge */}
        <div className="pointer-events-none absolute left-6 top-20 z-30 flex items-center gap-3 md:left-12 md:top-24">
          <EyebrowBadge>ARCHIVE // 8 AUTHENTICATED CREDENTIALS</EyebrowBadge>
        </div>

        {/* Side Scroll Indicator: "3 / 8" + Vertical Progress Rail */}
        <div className="pointer-events-none absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 md:right-8">
          <div className="rounded-full border border-white/15 bg-black/75 px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent backdrop-blur-md shadow-[0_0_16px_rgba(212,162,47,0.3)]">
            <span ref={counterRef}>1 / 8</span>
          </div>

          <div className="relative flex h-32 w-1 items-center justify-center rounded-full bg-white/10">
            <div
              ref={progressBarRef}
              className="absolute top-0 w-full origin-top rounded-full bg-accent shadow-[0_0_8px_rgba(212,162,47,0.8)]"
              style={{ height: "100%", transform: "scaleY(0)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            {certificatesList.map((c, idx) => (
              <span
                key={c.id}
                ref={(el) => {
                  dotRefs.current[idx] = el;
                }}
                className="h-1.5 w-1.5 rounded-full bg-white/25 transition-all duration-200"
              />
            ))}
          </div>
        </div>

        {/* Floating Liquid-Glass Certificate Name Badges (Positioned in Lower Area so Anime Frames Shine) */}
        <div className="relative flex h-full w-full items-end justify-center pb-20 md:pb-24">
          {certificatesList.map((cert: Certificate, index: number) => (
            <div
              key={cert.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="absolute z-20 flex w-full max-w-[min(90vw,640px)] flex-col items-center px-4 will-change-transform"
              style={{
                opacity: 0,
                transform: "translate3d(0, 60px, 0) scale(0.85)",
                pointerEvents: "none",
                visibility: "hidden",
              }}
            >
              {/* Sleek Liquid Glass Floating Pill */}
              <div
                onClick={() => handleOpenModal(cert)}
                className="liquid-glass group relative flex w-full items-center justify-between gap-4 rounded-2xl border border-white/20 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.7),0_0_24px_rgba(212,162,47,0.18)] backdrop-blur-2xl transition-all duration-300 hover:border-accent/60 hover:shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_32px_rgba(212,162,47,0.3)] md:px-6 md:py-4.5 cursor-pointer"
              >
                {/* Left: Index badge + Issuer/Year + Certificate Name */}
                <div className="flex flex-1 items-center gap-3.5 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/15 font-mono text-xs font-bold text-accent shadow-[0_0_12px_rgba(212,162,47,0.25)]">
                    0{index + 1}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/90">
                      {cert.issuer} &middot; {cert.year}
                    </span>
                    <h3 className="truncate font-sans text-sm font-bold text-white transition-colors group-hover:text-accent md:text-base">
                      {cert.title}
                    </h3>
                  </div>
                </div>

                {/* Right: Full View Symbol */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(cert);
                  }}
                  title="View Full Certificate"
                  aria-label={`View full certificate: ${cert.title}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/[0.08] text-white shadow-inner transition-all duration-200 hover:scale-110 hover:border-accent hover:bg-accent hover:text-black hover:shadow-[0_0_18px_rgba(212,162,47,0.6)] cursor-pointer"
                >
                  <ArrowsOut size={18} weight="bold" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollFrameSequence>

      {/* Fullscreen Tactical Liquid-Glass Modal */}
      {modalCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Certificate details: ${modalCert.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md md:p-8"
          onClick={handleCloseModal}
        >
          <div
            className="liquid-glass relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-accent/40 bg-zinc-950/95 shadow-[0_0_60px_rgba(212,162,47,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                  {modalCert.issuer} {"//"} {modalCert.year}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                  {certificatesList.findIndex((c) => c.id === modalCert.id) + 1} / {certificatesList.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevCert}
                  className="rounded-full border border-white/15 p-2 text-zinc-400 transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Previous certificate (ArrowLeft)"
                  title="Previous certificate (ArrowLeft)"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={handleNextCert}
                  className="rounded-full border border-white/15 p-2 text-zinc-400 transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Next certificate (ArrowRight)"
                  title="Next certificate (ArrowRight)"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full border border-white/15 p-2 text-zinc-400 transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Close certificate preview (Escape)"
                  title="Close preview (Escape)"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
                <Image
                  src={modalCert.image}
                  alt={modalCert.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <h2 className="font-sans text-xl font-bold text-white md:text-2xl">
                      {modalCert.title}
                    </h2>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-zinc-400">
                      {modalCert.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                    {modalCert.pdfUrl && (
                      <a
                        href={modalCert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-black transition-all hover:brightness-110 shadow-[0_0_12px_rgba(212,162,47,0.4)]"
                      >
                        <DownloadSimple size={15} weight="bold" />
                        Download PDF
                      </a>
                    )}
                    {modalCert.verificationUrl && (
                      <a
                        href={modalCert.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/[0.05] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition-all hover:border-accent hover:text-accent"
                      >
                        Verify <ArrowUpRight size={14} weight="bold" />
                      </a>
                    )}
                  </div>
                </div>

                {modalCert.verificationCode && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 font-mono text-xs">
                    <span className="text-zinc-500">CREDENTIAL ID: </span>
                    <span className="text-accent">{modalCert.verificationCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
