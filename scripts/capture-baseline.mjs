import { spawn, execFile } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import { promisify } from "util";
import { fileURLToPath } from "url";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.join(root, "public/screenshots/baseline");

fs.mkdirSync(outputDir, { recursive: true });

function waitForServer(host = "127.0.0.1", port = 3020, timeout = 35000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get({ host, port, path: "/" }, () => {
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeout) {
          reject(new Error("Server startup timeout"));
        } else {
          setTimeout(check, 600);
        }
      });
    };
    check();
  });
}

async function capture(pagePath, width, height, filename) {
  const url = `http://127.0.0.1:3020${pagePath}`;
  const out = path.join(outputDir, filename);
  console.log(`Capturing ${filename} (${width}x${height})...`);
  await execFileAsync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    `--screenshot=${out}`,
    url,
  ]);
  console.log(`Saved: ${filename}`);
}

async function run() {
  console.log("Starting Next.js server on 127.0.0.1:3020...");
  const nextBin = path.join(root, "node_modules/next/dist/bin/next");
  const server = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", "3020"], {
    cwd: root,
    stdio: "pipe",
  });

  server.stdout.on("data", (d) => {
    const s = d.toString();
    if (s.includes("Ready in")) {
      console.log("Next server is ready!");
    }
  });

  try {
    await waitForServer("127.0.0.1", 3000);
    console.log("Connected to Next.js server! Capturing screenshots...");

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

    console.log("Baseline screenshots complete!");
  } finally {
    server.kill("SIGTERM");
  }
}

run().catch((e) => {
  console.error("Capture failed:", e);
  process.exit(1);
});
