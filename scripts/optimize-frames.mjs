/**
 * OPTIMIZE FRAMES SCRIPT
 * 
 * Converts heavy frame sequences (PNG/JPG) to:
 * - Desktop WebP (max width 1600px, quality 75) -> ~40-100KB/frame
 * - Mobile WebP (max width 960px, quality 70)  -> ~20-50KB/frame
 * 
 * Usage:
 *   node scripts/optimize-frames.mjs --target=all
 *   node scripts/optimize-frames.mjs --target=home
 *   node scripts/optimize-frames.mjs --target=cert
 *   node scripts/optimize-frames.mjs --input=path/to/raw --output=public/frames/custom
 */

import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";
import ffmpeg from "ffmpeg-static";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Parse CLI arguments
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.replace(/^--/, "").split("=");
  acc[k] = v || true;
  return acc;
}, {});

const target = args.target || "all";
const maxConcurrency = Math.max(2, Math.min(8, (navigator?.hardwareConcurrency || 4)));

async function optimizeDirectory({ inputDir, outputDesktopDir, outputMobileDir, prefix = "frame_" }) {
  if (!fs.existsSync(inputDir)) {
    console.warn(`[WARN] Input directory not found: ${inputDir}. Skipping.`);
    return;
  }

  fs.mkdirSync(outputDesktopDir, { recursive: true });
  if (outputMobileDir) fs.mkdirSync(outputMobileDir, { recursive: true });

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

  if (files.length === 0) {
    console.warn(`[WARN] No image files found in ${inputDir}`);
    return;
  }

  console.log(`\n======================================================`);
  console.log(`Processing: ${files.length} frames from ${path.relative(root, inputDir)}`);
  console.log(`Desktop output -> ${path.relative(root, outputDesktopDir)} (1600px WebP, Q75)`);
  if (outputMobileDir) {
    console.log(`Mobile output  -> ${path.relative(root, outputMobileDir)} (960px WebP, Q70)`);
  }
  console.log(`Concurrency: ${maxConcurrency} workers`);
  console.log(`======================================================\n`);

  let completed = 0;
  let totalSavedBytes = 0;
  const startTime = Date.now();

  // Task queue with concurrency pool
  let fileIndex = 0;
  async function worker() {
    while (fileIndex < files.length) {
      const currentIndex = fileIndex++;
      const file = files[currentIndex];
      const frameNum = currentIndex + 1;
      const paddedNum = String(frameNum).padStart(4, "0");
      const inPath = path.join(inputDir, file);
      const outDesktop = path.join(outputDesktopDir, `${prefix}${paddedNum}.webp`);
      const outMobile = outputMobileDir ? path.join(outputMobileDir, `${prefix}${paddedNum}.webp`) : null;

      try {
        const originalSize = fs.statSync(inPath).size;

        // Desktop conversion: scale='min(1600,iw)':-2, quality 75
        await execFileAsync(ffmpeg, [
          "-y",
          "-i", inPath,
          "-vf", "scale=min(1600\\,iw):-2",
          "-c:v", "libwebp",
          "-quality", "75",
          "-compression_level", "4",
          outDesktop,
        ]);

        let desktopSize = fs.statSync(outDesktop).size;
        totalSavedBytes += Math.max(0, originalSize - desktopSize);

        // Mobile conversion: scale='min(960,iw)':-2, quality 70
        if (outMobile) {
          await execFileAsync(ffmpeg, [
            "-y",
            "-i", inPath,
            "-vf", "scale=min(960\\,iw):-2",
            "-c:v", "libwebp",
            "-quality", "70",
            "-compression_level", "4",
            outMobile,
          ]);
        }

        completed++;
        if (completed % 20 === 0 || completed === files.length) {
          const pct = Math.round((completed / files.length) * 100);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          process.stdout.write(`\r[${pct}%] Processed ${completed}/${files.length} frames (${elapsed}s)...`);
        }
      } catch (err) {
        console.error(`\n[ERROR] Frame ${file}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: maxConcurrency }, () => worker());
  await Promise.all(workers);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const savedMB = (totalSavedBytes / (1024 * 1024)).toFixed(1);
  console.log(`\n\n[SUCCESS] Completed in ${durationSec}s! Saved approx ${savedMB} MB of asset weight.\n`);
}

async function main() {
  console.log("=== Iron Man Portfolio // Frame Optimizer Engine ===");

  if (args.input && args.output) {
    const inputDir = path.resolve(root, args.input);
    const outputDesktopDir = path.resolve(root, args.output, "desktop");
    const outputMobileDir = path.resolve(root, args.output, "mobile");
    await optimizeDirectory({ inputDir, outputDesktopDir, outputMobileDir });
    return;
  }

  if (target === "home" || target === "all") {
    // Process Home sequence
    const homeInput = path.join(root, "public/amazing_spiderman");
    const homeDesktop = path.join(root, "public/frames/home");
    const homeMobile = path.join(root, "public/frames/home/mobile");
    await optimizeDirectory({
      inputDir: homeInput,
      outputDesktopDir: homeDesktop,
      outputMobileDir: homeMobile,
      prefix: "frame_",
    });
  }

  if (target === "cert" || target === "all") {
    // Process Certifications sequence
    const certInput = path.join(root, "public/certificates/frames");
    const certDesktop = path.join(root, "public/frames/cert");
    const certMobile = path.join(root, "public/frames/cert/mobile");
    await optimizeDirectory({
      inputDir: certInput,
      outputDesktopDir: certDesktop,
      outputMobileDir: certMobile,
      prefix: "frame_",
    });
  }
}

main().catch(console.error);

