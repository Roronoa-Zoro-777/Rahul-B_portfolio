import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ScrollCertificatesShowcase } from "@/components/sections/ScrollCertificatesShowcase";
import { CertificatesSection } from "@/components/sections/CertificatesSection";

export const metadata = {
  title: "Certifications & Credentials // Rahul B",
  description: "8 authenticated diplomas and credentials across Google Data Analytics, IBM Python Data Science, and corporate job simulations.",
};

export default function CertificatesPage() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen bg-black">
        {/* TASK 2: 8 Certificates Scrubbed Sequence with Full-Screen Sticky Frame Background */}
        <ScrollCertificatesShowcase scrollDistanceVh={600} totalFrames={300} />

        {/* Quick Filter Archive & PDF Inspector Grid */}
        <CertificatesSection />
      </main>

      <Footer />
    </>
  );
}
