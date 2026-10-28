import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { CustomCrosshair } from "@/components/effects/CustomCrosshair";
import { CinematicOverlay } from "@/components/effects/CinematicOverlay";
import { GlassShatterEffect } from "@/components/effects/GlassShatterEffect";
import { QuickNavHud } from "@/components/ui/QuickNavHud";
import { JsonLd } from "@/components/seo/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["monospace", "Courier New"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Rahul B — Data Analytics Portfolio",
    template: "%s | Rahul B",
  },
  description:
    "Data Analyst portfolio of Rahul B: turning complex data into actionable direction with SQL, Python, Power BI, and predictive modeling.",
  keywords: [
    "Rahul B",
    "Data Analyst",
    "Data Scientist",
    "Business Intelligence",
    "Power BI",
    "SQL",
    "Python",
    "Machine Learning",
    "Tableau",
    "Portfolio",
  ],
  authors: [{ name: "Rahul B" }],
  creator: "Rahul B",
  metadataBase: new URL("https://rahulb.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://rahulb.dev",
    siteName: "Rahul B Portfolio",
    title: "Rahul B — Data Analytics Portfolio",
    description:
      "Turning complex data into actionable direction with SQL, Python, Power BI dashboards, and predictive modeling.",
    images: [
      {
        url: "/certificates/cert-1.jpg",
        width: 1200,
        height: 630,
        alt: "Rahul B Portfolio Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rahul B — Data Analytics Portfolio",
    description:
      "Turning complex data into actionable direction with SQL, Python, Power BI dashboards, and predictive modeling.",
    images: ["/certificates/cert-1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <JsonLd />
        <SmoothScrollProvider>
          {/* Global Polished Effects */}
          <CinematicOverlay />
          <CustomCrosshair />
          <GlassShatterEffect />
          {children}
          <QuickNavHud />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
