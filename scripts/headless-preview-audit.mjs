// Hikma — AUDIT HEADLESS du Player de Preview : détection de redémarrage audio
// pendant une lecture complète, avec le re-rendu par frame simulé (comme le
// VideoEditor réel). Utilise Chrome système + puppeteer-core (non enregistré).
// Usage : node scripts/headless-preview-audit.mjs <url>

import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://127.0.0.1:5199/index.html";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--autoplay-policy=no-user-gesture-required", "--no-sandbox", "--mute-audio=false"],
});
const page = await browser.newPage();

const consoleLines = [];
page.on("console", (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`));
const failedRequests = [];
page.on("requestfailed", (req) =>
  failedRequests.push(`${req.url().slice(0, 80)} → ${req.failure()?.errorText}`),
);

await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));

const initial = await page.evaluate(() => ({
  ready: !!document.getElementById("root")?.children.length,
  audios: document.querySelectorAll("audio").length,
  duration: window.__audit?.durationInFrames ?? null,
}));
console.log("INITIAL", JSON.stringify(initial));

// Clic réel (geste utilisateur) sur Play
await page.click("#btn-play");
console.log("PLAY_CLICKED");

// Échantillonnage pendant ~38 s (durée totale 33,9 s)
const timeline = [];
for (let i = 0; i < 19; i++) {
  await new Promise((r) => setTimeout(r, 2000));
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
    return { audios, restarts: window.__restarts ?? 0, renders: (window).__audit ? 0 : 0 };
  });
  timeline.push(s);
}
await page.click("#btn-pause");
await new Promise((r) => setTimeout(r, 500));

const dump = await page.evaluate(() => ({
  restarts: window.__restarts ?? 0,
  snapshots: window.__audit.audioSnapshots.length,
}));

console.log("TIMELINE_SAMPLES", timeline.length);
for (let i = 0; i < timeline.length; i++) {
  const a = timeline[i].audios.filter((x) => x.src !== "SILENT" && !x.paused);
  console.log(`  t+${(i + 1) * 2}s  actifs=${JSON.stringify(a)}  restarts=${timeline[i].restarts}`);
}
console.log("FINAL", JSON.stringify(dump));
console.log("FAILED_REQUESTS", JSON.stringify(failedRequests));
console.log("CONSOLE_AUDIO", JSON.stringify(consoleLines.filter((l) => l.includes("AUDIO_RESTART") || l.includes("pageerror"))));
console.log("CONSOLE_ERR", JSON.stringify(consoleLines.filter((l) => l.includes("[error]") || l.includes("ERR_") || l.includes("blocked"))));

await browser.close();
