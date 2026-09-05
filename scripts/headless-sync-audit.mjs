// Hikma — AUDIT SYNCHRO headless : offset audio vs frame de composition pendant
// une lecture complète du Player de Preview (scènes réelles, re-rendu par frame).
// Usage : node scripts/headless-sync-audit.mjs <url>

import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://127.0.0.1:5199/index.html";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--autoplay-policy=no-user-gesture-required", "--no-sandbox"],
});
const page = await browser.newPage();

const consoleLines = [];
page.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`));

await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3500));

await page.click("#btn-play");
console.log("PLAY_CLICKED");
await new Promise((r) => setTimeout(r, 9000)); // intro + mot + sens (6 s) + marge

// Échantillonnage pendant 28 s (scène Coran 26,4 s)
const samples = [];
for (let i = 0; i < 14; i++) {
  const s = await page.evaluate(() => {
    const audios = Array.from(document.querySelectorAll("audio")).map((a) => ({
      src: a.src.includes("cdn")
        ? "CDN"
        : a.src.includes("storage")
          ? "STORE"
          : "SILENT",
      t: +a.currentTime.toFixed(2),
      paused: a.paused,
    }));
    return {
      frame: window.__audit?.currentFrame ?? -1,
      audios,
      restarts: window.__restarts ?? 0,
    };
  });
  samples.push(s);
  await new Promise((r) => setTimeout(r, 2000));
}
await page.click("#btn-pause");

const final = await page.evaluate(() => ({
  restarts: window.__restarts ?? 0,
  sync: window.__audit.syncSamples.slice(-10),
  snapshots: window.__audit.audioSnapshots.length,
}));

console.log("SYNC_OFFSET_SAMPLES (audioTime − (frame−180)/30) :");
for (const s of final.sync) {
  console.log(`  frame=${s.frame} expected=${s.expected}s actual=${s.actual}s offset=${s.offset}s`);
}
console.log("RESTARTS", final.restarts);
console.log("AUDIO_RESTART_LOG", JSON.stringify(consoleLines.filter((l) => l.includes("AUDIO_RESTART"))));
console.log("PAGEERRORS", JSON.stringify(consoleLines.filter((l) => l.includes("pageerror"))));
await browser.close();
