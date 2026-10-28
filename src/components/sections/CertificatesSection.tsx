"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Certificate,
  DownloadSimple,
  Eye,
  X,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { TargetLockCard } from "@/components/effects/TargetLockCard";
import { soundController } from "@/components/effects/SoundController";
import { CertificateItem, certificatesList } from "@/lib/certificates";

type FilterCategory = "All" | "Google" | "IBM" | "Industry Simulation" | "Full Stack";

export function CertificatesSection() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("All");
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);

  const categories: FilterCategory[] = [
    "All",
    "Google",
    "IBM",
    "Industry Simulation",
    "Full Stack",
  ];

  const filteredCerts =
    activeCategory === "All"
      ? certificatesList
      : certificatesList.filter((c) => c.category === activeCategory);

  const handleSelectCert = (cert: CertificateItem) => {
    soundController.playShot();
    setSelectedCert(cert);
  };

  const handleCloseModal = () => {
    soundController.playTick();
    setSelectedCert(null);
  };

  const handlePrevCert = () => {
    if (!selectedCert) return;
    soundController.playTick();
    const currentIndex = certificatesList.findIndex((c) => c.id === selectedCert.id);
    const prevIndex = (currentIndex - 1 + certificatesList.length) % certificatesList.length;
    setSelectedCert(certificatesList[prevIndex]);
  };

  const handleNextCert = () => {
    if (!selectedCert) return;
    soundController.playTick();
    const currentIndex = certificatesList.findIndex((c) => c.id === selectedCert.id);
    const nextIndex = (currentIndex + 1) % certificatesList.length;
    setSelectedCert(certificatesList[nextIndex]);
  };

  return (
    <section
      id="certificates-grid"
      className="relative z-20 min-h-screen border-t border-red-300/15 bg-background px-6 py-16 md:px-10 md:py-24"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <EyebrowBadge>ARCHIVE // VERIFIED CREDENTIALS</EyebrowBadge>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
                Certified <span className="text-accent">Diplomas & Credentials.</span>
              </h1>
              <p className="mt-2 max-w-2xl font-sans text-sm text-zinc-400 md:text-base">
                8 authenticated industry certifications across Google Data Analytics, IBM Python Data Science, and corporate job simulations.
              </p>
            </div>

            {/* Total counter badge */}
            <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-accent backdrop-blur-md md:self-auto">
              <Certificate size={16} weight="duotone" className="text-accent" />
              <span>{certificatesList.length} CERTIFICATES LOGGED</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? certificatesList.length
                  : certificatesList.filter((c) => c.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundController.playTick();
                    setActiveCategory(cat);
                  }}
                  className={`rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
                    isActive
                      ? "bg-accent text-black shadow-[0_0_16px_rgba(212,162,47,0.4)]"
                      : "border border-white/15 bg-white/[0.04] text-white/70 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Certificate Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCerts.map((cert, index) => (
            <TargetLockCard key={cert.id} className="h-full">
              <article
                className="group liquid-glass relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 hover:border-accent/40 hover:shadow-[0_12px_32px_rgba(212,162,47,0.12)]"
                onMouseEnter={() => soundController.playTick()}
              >
                {/* Thumbnail Preview Banner */}
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden bg-black/60 cursor-pointer"
                  onClick={() => handleSelectCert(cert)}
                >
                  <Image
                    src={cert.image || cert.thumbnailUrl || "/certificates/cert-1.jpg"}
                    alt={cert.title}
                    fill
                    className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Issuer Tag Badge */}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    {cert.issuer}
                  </div>

                  {/* ID Tag */}
                  <div className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                    #{String(index + 1).padStart(2, "0")}
                  </div>

                  {/* Hover Inspect Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/40">
                    <span className="flex items-center gap-2 rounded-full border border-accent/40 bg-black/80 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent backdrop-blur-md shadow-[0_0_20px_rgba(212,162,47,0.3)]">
                      <Eye size={16} weight="bold" /> Inspect Certificate
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span>{cert.platform}</span>
                    <span className="text-zinc-500">{cert.issueDate}</span>
                  </div>

                  <h2
                    onClick={() => handleSelectCert(cert)}
                    className="mt-2.5 font-sans text-lg font-bold leading-snug text-white transition-colors group-hover:text-accent cursor-pointer"
                  >
                    {cert.title}
                  </h2>

                  <p className="mt-2 line-clamp-3 font-sans text-xs leading-relaxed text-zinc-400">
                    {cert.description}
                  </p>

                  {/* Skills Chips */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cert.skills?.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex items-center gap-2 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleSelectCert(cert)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.08] px-3.5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-accent hover:text-black"
                    >
                      <Eye size={15} weight="bold" />
                      View
                    </button>

                    <a
                      href={cert.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3.5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300 transition-all hover:border-accent/40 hover:text-accent"
                    >
                      <DownloadSimple size={15} weight="bold" />
                      PDF
                    </a>

                    {cert.verificationUrl && (
                      <a
                        href={cert.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Verify Credential"
                        className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] p-2.5 text-zinc-300 transition-all hover:border-accent/40 hover:text-accent"
                      >
                        <ArrowUpRight size={15} weight="bold" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </TargetLockCard>
          ))}
        </div>
      </div>

      {/* Fullscreen Tactical HUD Modal */}
      {selectedCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md md:p-8"
          onClick={handleCloseModal}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-accent/40 bg-zinc-950 shadow-[0_0_50px_rgba(212,162,47,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                  STARK ARCHIVE // {selectedCert.issuer}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous certificate"
                  onClick={handlePrevCert}
                  className="rounded-full border border-white/10 p-2 text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label="Next certificate"
                  onClick={handleNextCert}
                  className="rounded-full border border-white/10 p-2 text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={handleCloseModal}
                  className="ml-2 rounded-full border border-white/10 p-2 text-zinc-400 transition-colors hover:border-accent hover:text-accent"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
                <Image
                  src={selectedCert.image || selectedCert.thumbnailUrl || "/certificates/cert-1.jpg"}
                  alt={selectedCert.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
                      {selectedCert.platform} &middot; {selectedCert.issueDate}
                    </span>
                    <h2 className="mt-1 font-sans text-2xl font-bold text-white md:text-3xl">
                      {selectedCert.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto">
                    <a
                      href={selectedCert.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-black transition-all hover:brightness-110"
                    >
                      <DownloadSimple size={16} weight="bold" />
                      Download PDF
                    </a>
                    {selectedCert.verificationUrl && (
                      <a
                        href={selectedCert.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.05] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:border-accent hover:text-accent"
                      >
                        Verify <ArrowUpRight size={16} weight="bold" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="font-sans text-sm leading-relaxed text-zinc-300">
                  {selectedCert.description}
                </p>

                {selectedCert.verificationCode && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 font-mono text-xs">
                    <span className="text-zinc-500">CREDENTIAL ID: </span>
                    <span className="text-accent">{selectedCert.verificationCode}</span>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                    Validated Competencies:
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCert.skills?.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-xs text-zinc-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

