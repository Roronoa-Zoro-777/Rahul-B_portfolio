"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, GithubLogo } from "@phosphor-icons/react";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { TargetLockCard } from "@/components/effects/TargetLockCard";
import { soundController } from "@/components/effects/SoundController";
import { projectsList } from "@/lib/projects";

export function FeaturedProjects() {
  const featured = projectsList.filter((p) => p.featured).slice(0, 2);

  return (
    <section
      id="featured-projects"
      className="relative border-t border-red-300/15 bg-background px-6 py-16 md:px-10 md:py-24"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-3">
            <EyebrowBadge>FEATURED DOSSIERS // PORTFOLIO</EyebrowBadge>
            <h2 className="font-sans text-3xl font-bold tracking-tight text-white md:text-5xl">
              Featured <span className="text-accent">Data Engines.</span>
            </h2>
            <p className="max-w-2xl font-sans text-sm text-zinc-300 md:text-base">
              End-to-end data analytics deployments delivering measurable revenue optimization and predictive classification.
            </p>
          </div>

          <Link
            href="/projects/"
            onMouseEnter={() => soundController.playTick()}
            onClick={() => soundController.playShot()}
            className="group inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/[0.05] px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:self-auto"
          >
            <span>View All Projects</span>
            <ArrowRight
              size={14}
              weight="bold"
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {featured.map((project, idx) => (
            <TargetLockCard key={project.id} className="h-full">
              <article
                onMouseEnter={() => soundController.playTick()}
                className="liquid-glass group relative flex h-full flex-col justify-between rounded-2xl border border-white/10 p-6 md:p-8 transition-all duration-300 hover:border-accent/40"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                    <span className="text-accent font-bold">{project.category}</span>
                    <span>DOSSIER 0{idx + 1}</span>
                  </div>

                  <div>
                    <h3 className="font-sans text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-accent">
                      {project.title}
                    </h3>
                    <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-zinc-400">
                      {project.subtitle}
                    </p>
                  </div>

                  <p className="font-sans text-sm leading-relaxed text-zinc-300">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
                    {project.impactMetrics.map((m) => (
                      <div key={m.label} className="flex flex-col items-center text-center">
                        <span className="font-sans text-base font-bold text-accent md:text-lg">
                          {m.value}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] uppercase text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 p-2 text-zinc-300 hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        aria-label="GitHub Repository"
                      >
                        <GithubLogo size={16} weight="bold" />
                      </a>
                    )}
                    <Link
                      href="/projects/"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 font-mono text-xs font-bold uppercase text-black hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Dossier <ArrowUpRight size={13} weight="bold" />
                    </Link>
                  </div>
                </div>
              </article>
            </TargetLockCard>
          ))}
        </div>
      </div>
    </section>
  );
}
