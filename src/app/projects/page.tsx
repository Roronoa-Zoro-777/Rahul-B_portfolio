import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";

const ProjectsArchive = dynamic(
  () =>
    import("@/components/sections/ProjectsArchive").then(
      (mod) => mod.ProjectsArchive
    ),
  {
    loading: () => (
      <div className="relative min-h-[60vh] w-full flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Data Analytics Projects & Dossiers // Rahul B",
  description:
    "Production-grade case studies across business intelligence dashboards, predictive ML pipelines, and high-throughput SQL analytics engines.",
  openGraph: {
    title: "Data Analytics Projects & Dossiers // Rahul B",
    description:
      "Production-grade case studies across business intelligence dashboards, predictive ML pipelines, and high-throughput SQL analytics engines.",
    url: "https://rahulb.dev/projects",
  },
};

export default function ProjectsPage() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-background px-6 pb-24 pt-28 md:px-12 md:pb-32 md:pt-36">
        {/* Subtle Background Glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 15%, rgba(212,162,47,0.12), transparent 70%)",
          }}
          aria-hidden="true"
        />

        <ProjectsArchive />
      </main>

      <Footer />
    </>
  );
}
