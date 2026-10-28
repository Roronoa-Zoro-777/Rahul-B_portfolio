import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { CustomCrosshair } from "@/components/effects/CustomCrosshair";
import { CinematicOverlay } from "@/components/effects/CinematicOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rahul B — Data Analytics Portfolio",
  description:
    "Rahul B's data analytics portfolio: tactical image sequences, skills, tools, projects, and contact details.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full bg-background text-foreground grain">
        <SmoothScrollProvider>
          {/* Global Polished Effects */}
          <CinematicOverlay />
          <CustomCrosshair />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
