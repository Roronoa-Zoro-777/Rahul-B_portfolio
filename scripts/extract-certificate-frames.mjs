import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "ffmpeg-static";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const videoPath = path.join(root, "public/gifs/spidervid.mp4");
const outputDir = path.join(root, "public/certificates/frames");
const frameCount = 300;
const videoDurationSec = 30.95;

if (!fs.existsSync(videoPath)) {
  console.error(`Video not found: ${videoPath}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const fps = frameCount / videoDurationSec;

console.log(`Extracting ${frameCount} frames at ${fps.toFixed(2)} fps...`);

execFileSync(
  ffmpeg,
  [
    "-y",
    "-i",
    videoPath,
    "-an",
    "-vf",
    `fps=${fps},scale=1280:-2`,
    "-q:v",
    "3",
    path.join(outputDir, "frame-%03d.jpg"),
  ],
  { stdio: "inherit" },
);

const extracted = fs
  .readdirSync(outputDir)
  .filter((name) => name.endsWith(".jpg")).length;

console.log(`Done. ${extracted} frames written to ${outputDir}`);
