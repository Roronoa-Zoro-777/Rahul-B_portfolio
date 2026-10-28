"use client";

import {
  ArrowUpRight,
  Envelope,
  GithubLogo,
  LinkedinLogo,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import { soundController } from "@/components/effects/SoundController";
import { TargetLockCard } from "@/components/effects/TargetLockCard";

export function Footer() {
  return (
    <footer
      id="contact"
      className="skills-section scroll-mt-16 border-t border-red-300/15 px-6 pb-14 pt-12 md:px-10 md:pb-16 md:pt-16"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col gap-3">
            <TargetLockCard>
              <div
                onMouseEnter={() => soundController.playTick()}
                className="contact-glass flex flex-col items-start gap-2 rounded-3xl p-5 transition-all duration-300 hover:bg-white/[0.12] hover:border-white/40"
              >
                <div className="flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(212,162,47,0.9)]"
                  />
                  <span className="text-white">Rahul B</span>
                </div>
                <p className="font-sans text-sm font-semibold leading-relaxed text-zinc-300">
                  Data Analyst &mdash; turning complex information into clear, actionable direction.
                </p>
              </div>
            </TargetLockCard>

            <TargetLockCard>
              <div
                onMouseEnter={() => soundController.playTick()}
                className="contact-glass group flex h-full min-h-[96px] flex-col items-start gap-1 rounded-3xl p-5 transition-all duration-300 hover:bg-white/[0.12] hover:border-white/40"
              >
                <span className="flex items-center gap-2 font-sans text-[13px] font-bold text-white">
                  <MapPin size={16} weight="duotone" className="text-[#EF4444]" />
                  Location
                </span>
                <span className="text-left font-mono text-xs font-bold uppercase tracking-[0.12em] text-zinc-300">
                  Bangalore | Karnataka | India
                </span>
              </div>
            </TargetLockCard>
          </div>

          <nav className="grid items-stretch gap-4 sm:grid-cols-2 md:grid-cols-2">
            <TargetLockCard>
              <a
                href="mailto:rahulbavigadda2004@gmail.com"
                onMouseEnter={() => soundController.playTick()}
                onClick={() => soundController.playShot()}
                className="contact-glass group flex h-full min-h-[112px] flex-col items-start gap-1 rounded-3xl p-5 transition-all duration-300 hover:bg-white/[0.12] hover:border-white/40"
              >
                <span className="flex items-center gap-2 font-sans text-[13px] font-bold text-white transition-colors group-hover:text-accent">
                  <Envelope size={16} weight="duotone" className="text-[#EA4335]" />
                  Email
                  <ArrowUpRight size={11} weight="bold" className="ml-1 inline-block align-baseline" />
                </span>
                <span className="break-all text-left font-mono text-xs font-bold tracking-[0.04em] text-zinc-300">
                  rahulbavigadda2004@gmail.com
                </span>
              </a>
            </TargetLockCard>

            <TargetLockCard>
              <a
                href="tel:+917975455934"
                onMouseEnter={() => soundController.playTick()}
                onClick={() => soundController.playShot()}
                className="contact-glass group flex h-full min-h-[112px] flex-col items-start gap-1 rounded-3xl p-5 transition-all duration-300 hover:bg-white/[0.12] hover:border-white/40"
              >
                <span className="flex items-center gap-2 font-sans text-[13px] font-bold text-white transition-colors group-hover:text-accent">
                  <Phone size={16} weight="duotone" className="text-[#22C55E]" />
                  Phone
                  <ArrowUpRight size={11} weight="bold" className="ml-1 inline-block align-baseline" />
                </span>
                <span className="text-left font-mono text-xs font-bold tracking-[0.08em] text-zinc-300">
                  +91 7975455934
                </span>
              </a>
            </TargetLockCard>

            <TargetLockCard>
              <a
                href="https://www.linkedin.com/in/rahul-b-5780ba354/"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => soundController.playTick()}
                onClick={() => soundController.playShot()}
                className="contact-glass group flex h-full min-h-[112px] flex-col items-start gap-1 rounded-3xl p-5 transition-all duration-300 hover:bg-white/[0.12] hover:border-white/40"
              >
                <span className="flex items-center gap-2 font-sans text-[13px] font-bold text-white transition-colors group-hover:text-accent">
                  <LinkedinLogo size={16} weight="duotone" className="text-[#0A66C2]" />
                  LinkedIn
                  <ArrowUpRight size={11} weight="bold" className="ml-1 inline-block align-baseline" />
                </span>
                <span className="break-all text-left font-mono text-xs font-bold tracking-[0.04em] text-zinc-300">
                  rahul-b-5780ba354
                </span>
              </a>
            </TargetLockCard>

            <TargetLockCard>
              <a
                href="https://github.com/Roronoa-Zoro-777"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => soundController.playTick()}
                onClick={() => soundController.playShot()}
                className="contact-glass group flex h-full min-h-[112px] flex-col items-start gap-1 rounded-3xl p-5 transition-all duration-300 hover:bg-white/[0.12] hover:border-white/40"
              >
                <span className="flex items-center gap-2 font-sans text-[13px] font-bold text-white transition-colors group-hover:text-accent">
                  <GithubLogo size={16} weight="duotone" className="text-[#F5F5F5]" />
                  GitHub
                  <ArrowUpRight size={11} weight="bold" className="ml-1 inline-block align-baseline" />
                </span>
                <span className="break-all text-left font-mono text-xs font-bold tracking-[0.04em] text-zinc-300">
                  Roronoa-Zoro-777
                </span>
              </a>
            </TargetLockCard>
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-red-300/15 pt-6 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400 md:flex-row md:items-center md:justify-between">
          <span>Rahul B &nbsp;&middot;&nbsp; Data Analytics Portfolio</span>
          <span>Tactical Online // Available for Opportunities</span>
        </div>
      </div>
    </footer>
  );
}
