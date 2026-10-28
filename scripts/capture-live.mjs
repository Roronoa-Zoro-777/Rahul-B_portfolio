import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.join(root, "public/screenshots/baseline");

fs.mkdirSync(outputDir, { recursive: true });

async function capture(pagePath, width, height, filename) {
  const url = `http://localhost:3000${pagePath}`;
  const out = path.join(outputDir, filename);
  console.log(`Capturing ${filename} (${width}x${height}) from ${url}...`);
  try {
    await execFileAsync(chromePath, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      url,
    ]);
    console.log(`Saved: ${filename} (${fs.statSync(out).size} bytes)`);
  } catch (err) {
    console.error(`Failed to capture ${filename}:`, err.message);
  }
}

async function main() {
  const targets = [
    { path: "/", name: "home" },
    { path: "/certificates", name: "certificates" },
    { path: "/projects", name: "projects" },
  ];

  const viewports = [
    { w: 1440, h: 900, label: "desktop" },
    { w: 768, h: 1024, label: "tablet" },
    { w: 390, h: 844, label: "mobile" },
  ];

  for (const t of targets) {
    for (const v of viewports) {
      await capture(t.path, v.w, v.h, `${t.name}-${v.label}.png`);
    }
  }

  const files = fs.readdirSync(outputDir);
  console.log(`\nAll screenshots in ${outputDir}:`, files);
}

main().catch(console.error);
