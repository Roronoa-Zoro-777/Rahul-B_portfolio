"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  GithubLogo,
  TerminalWindow,
  ChartBar,
  Brain,
  Database,
  TrendUp,
} from "@phosphor-icons/react";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { TargetLockCard } from "@/components/effects/TargetLockCard";
import { soundController } from "@/components/effects/SoundController";
import { projectsList, Project } from "@/lib/projects";

type CategoryFilter = "All" | "Business Intelligence" | "Machine Learning" | "SQL & Engineering" | "Analytics";

export function ProjectsArchive() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const categories: CategoryFilter[] = [
    "All",
    "Business Intelligence",
    "Machine Learning",
    "SQL & Engineering",
    "Analytics",
  ];

  const filteredProjects =
    activeCategory === "All"
      ? projectsList
      : projectsList.filter((p) => p.category === activeCategory);

  const getCategoryIcon = (category: Project["category"]) => {
    switch (category) {
      case "Business Intelligence":
        return <ChartBar size={16} weight="duotone" className="text-accent" />;
      case "Machine Learning":
        return <Brain size={16} weight="duotone" className="text-accent" />;
      case "SQL & Engineering":
        return <Database size={16} weight="duotone" className="text-accent" />;
      case "Analytics":
        return <TrendUp size={16} weight="duotone" className="text-accent" />;
      default:
        return <TerminalWindow size={16} weight="duotone" className="text-accent" />;
    }
  };

  return (
    <div className="relative mx-auto flex max-w-[1400px] flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <EyebrowBadge>MISSION ARCHIVES // PROJECT DOSSIERS</EyebrowBadge>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-sans text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Data Engines & <span className="text-accent">Analytical Systems.</span>
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-zinc-300 md:text-base">
              Production-grade case studies across business intelligence dashboards, predictive ML pipelines, and high-throughput SQL analytics engines.
            </p>
          </div>

          {/* Status readout */}
          <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-accent backdrop-blur-md md:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{projectsList.length} ACTIVE DEPLOYMENTS</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2" role="tablist" aria-label="Project category filters">
          {categories.map((cat) => {
            const count =
              cat === "All"
                ? projectsList.length
                : projectsList.filter((p) => p.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  soundController.playTick();
                  setActiveCategory(cat);
                }}
                className={`rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer ${
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

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredProjects.map((project, idx) => (
          <TargetLockCard key={project.id} className="h-full">
            <article
              onMouseEnter={() => soundController.playTick()}
              className="liquid-glass group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-6 md:p-8 transition-all duration-300 hover:border-accent/40 hover:shadow-[0_16px_40px_rgba(212,162,47,0.12)]"
            >
              <div className="flex flex-col gap-4">
                {/* Top Row: Category + Index */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                    {getCategoryIcon(project.category)}
                    <span>{project.category}</span>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">
                    DOSSIER 0{idx + 1} // {project.year}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h2 className="font-sans text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-accent">
                    {project.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-zinc-400">
                    {project.subtitle}
                  </p>
                </div>

                <p className="font-sans text-sm leading-relaxed text-zinc-300">
                  {project.description}
                </p>

                {/* Impact KPI Grid */}
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
                  {project.impactMetrics.map((m) => (
                    <div key={m.label} className="flex flex-col items-center text-center">
                      <span className="font-sans text-base font-bold text-accent md:text-lg">
                        {m.value}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-400">
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  STATUS: ONLINE
                </span>

                <div className="flex items-center gap-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300 transition-all hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <GithubLogo size={15} weight="bold" />
                      Code
                    </a>
                  )}
                  {project.liveDemoUrl && (
                    <a
                      href={project.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-black transition-all hover:brightness-110 shadow-[0_0_12px_rgba(212,162,47,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Case Study
                      <ArrowUpRight size={14} weight="bold" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          </TargetLockCard>
        ))}
      </div>
    </div>
  );
}
