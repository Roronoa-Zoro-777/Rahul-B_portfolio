import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";

export default function ProjectsPage() {
  return (
    <>
      <Navbar />
      <main
        className="relative min-h-screen overflow-hidden bg-black bg-cover bg-center"
        style={{ backgroundImage: "url('/gifs/toji.gif')" }}
      >
        <div className="absolute inset-0 bg-black/45" aria-hidden />
      </main>
      <Footer />
    </>
  );
}
