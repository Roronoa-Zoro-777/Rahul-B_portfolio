import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/sections/Hero";
import { SystemsNominal } from "@/components/sections/SystemsNominal";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SystemsNominal />
        <FeaturedProjects />
      </main>
      <Footer />
    </>
  );
}
