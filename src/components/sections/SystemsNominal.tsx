"use client";

import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { TargetLockCard } from "@/components/effects/TargetLockCard";
import { soundController } from "@/components/effects/SoundController";
import { SectionTransition } from "@/components/effects/SectionTransition";

const roles = [
  {
    title: "Data Analyst",
    description:
      "Transforming raw data into decision-ready insights through advanced querying, custom dashboards, and comprehensive performance metrics.",
    skills: ["SQL", "Power BI", "Tableau", "Excel", "Pandas"],
    proficiency: 90,
  },
  {
    title: "Data Scientist",
    description:
      "Building intelligent systems using predictive modeling, deep learning, and statistical analysis to solve complex problems and extract actionable insights.",
    skills: ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "SQL"],
    proficiency: 85,
  },
  {
    title: "Data Engineer",
    description:
      "Architecting scalable data pipelines, optimizing databases, and ensuring reliable data infrastructure for robust analytics workflows.",
    skills: ["Python", "SQL", "PostgreSQL", "AWS", "Spark", "Airflow"],
    proficiency: 80,
  },
];

const techStack = [
  "Python",
  "SQL",
  "PostgreSQL",
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "Pandas",
  "NumPy",
  "Power BI",
  "Tableau",
  "Excel",
  "AWS",
  "Spark",
  "Airflow",
  "Git",
  "Docker",
  "Linux",
  "Jupyter",
];

const glassCardClass = "liquid-glass h-full rounded-2xl p-6 md:p-7";

export function SystemsNominal() {
  return (
    <section
      id="systems"
      className="skills-section relative border-t border-red-300/15 bg-background px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-20"
    >
      {/* Tactical Glitch / Scan Transition Trigger (Modular Effect 9) */}
      <SectionTransition sectionId="systems" />

      <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
        <AnimatedSection className="flex max-w-2xl flex-col gap-6">
          <AnimatedItem>
            <EyebrowBadge>SKILLS // PROFILE NOMINAL</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="font-sans text-4xl font-bold leading-[0.98] tracking-tighter text-foreground md:text-6xl">
              Skills that turn data into <span className="text-accent">direction.</span>
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
              A practical toolkit for uncovering patterns, building reliable systems,
              and making complex information easier to act on.
            </p>
          </AnimatedItem>
        </AnimatedSection>

        {/* 3D Tilt & Target Lock Cards (Modular Effect 8) */}
        <AnimatedSection className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {roles.map((role, idx) => (
            <AnimatedItem key={role.title}>
              <TargetLockCard className="h-full">
                <article
                  onMouseEnter={() => soundController.playTick()}
                  className="liquid-glass flex h-full flex-col gap-6 rounded-2xl p-5 md:p-6 lg:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-sans text-2xl font-bold tracking-tight text-white">
                      {role.title}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                      0{idx + 1}
                    </span>
                  </div>
                  <p className="font-sans text-sm leading-relaxed text-white/70">
                    {role.description}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {role.skills.map((skill) => (
                      <span
                        key={skill}
                        onMouseEnter={() => soundController.playTick()}
                        className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/75 transition-colors duration-150 hover:border-accent/40 hover:text-accent"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                      <span>Proficiency</span>
                      <span className="text-accent">{role.proficiency}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-accent transition-[width] duration-500 ease-out"
                        style={{ width: `${role.proficiency}%` }}
                      />
                    </div>
                  </div>
                </article>
              </TargetLockCard>
            </AnimatedItem>
          ))}
        </AnimatedSection>

        <AnimatedSection>
          <AnimatedItem>
            <article className={glassCardClass}>
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <h3 className="font-sans text-2xl font-bold tracking-tight text-white md:text-3xl">
                    Skills &amp; Tools
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
                    18 tools // tactical ready
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {techStack.map((skill) => (
                    <span
                      key={skill}
                      onMouseEnter={() => soundController.playTick()}
                      className="rounded-full border border-white/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/75 transition-all duration-200 hover:scale-105 hover:border-accent hover:text-accent"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </section>
  );
}
