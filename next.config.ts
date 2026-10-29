import type { NextConfig } from "next";

const isWindows = process.platform === "win32";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // On Windows, limit prerender workers to 1 to prevent NTFS mkdir race collisions.
  // On Netlify (Linux CI/CD), allow full multi-core parallel builds.
  experimental: isWindows
    ? {
        cpus: 1,
      }
    : undefined,
};

export default nextConfig;
