// Hikma — Probe récitation des versets : durée RÉELLE (ffprobe) vs estimation
// CBR Content-Length utilisée par getRemoteAudioDurationInSeconds.
//
// Usage : npx tsx scripts/probe-verse-recitation.ts
// Aucune écriture DB, aucun téléchargement persistant (fichiers temporaires /tmp).

import { execFile } from "node:child_process";
import { createWriteStream, unlinkSync } from "node:fs";
import { promisify } from "node:util";
import https from "node:https";
import { getAyahAudioUrl } from "../lib/quran/ayah-audio";
import { getRemoteAudioDurationInSeconds } from "../lib/content-studio/audio";

const execFileAsync = promisify(execFile);

const FPS = 30;

// Vrais versets : Al-Fatiha 1..7, Al-Baqarah 1..2, Al-Ikhlas 1..4, An-Nas 1..6
const VERSES = [
  { surah: 1, ayah: 1 },
  { surah: 1, ayah: 2 },
  { surah: 1, ayah: 3 },
  { surah: 1, ayah: 4 },
  { surah: 1, ayah: 5 },
  { surah: 1, ayah: 6 },
  { surah: 1, ayah: 7 },
  { surah: 2, ayah: 1 },
  { surah: 2, ayah: 2 },
  { surah: 112, ayah: 1 },
  { surah: 112, ayah: 2 },
  { surah: 112, ayah: 3 },
  { surah: 112, ayah: 4 },
  { surah: 114, ayah: 1 },
  { surah: 114, ayah: 2 },
  { surah: 114, ayah: 3 },
  { surah: 114, ayah: 4 },
  { surah: 114, ayah: 5 },
  { surah: 114, ayah: 6 },
];

// global ayah number pour ces versets
const GLOBAL: Record<string, number> = {
  "1:1": 1, "1:2": 2, "1:3": 3, "1:4": 4, "1:5": 5, "1:6": 6, "1:7": 7,
  "2:1": 8, "2:2": 9,
  "112:1": 6222, "112:2": 6223, "112:3": 6224, "112:4": 6225,
  "114:1": 6231, "114:2": 6232, "114:3": 6233, "114:4": 6234, "114:5": 6235, "114:6": 6236,
};

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const ws = createWriteStream(dest);
      res.pipe(ws);
      ws.on("finish", () => ws.close(() => resolve()));
      ws.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
  });
}

async function ffprobeDuration(file: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "json",
    file,
  ]);
  const parsed = JSON.parse(stdout) as { format?: { duration?: string } };
  return parsed.format?.duration ? Number(parsed.format.duration) : NaN;
}

async function main(): Promise<void> {
  const tmpBase = `/tmp/hikma-verse-probe-${process.pid}`;
  let mismatchCount = 0;
  let cbrNull = 0;
  const rows: string[] = [];

  for (const v of VERSES) {
    const key = `${v.surah}:${v.ayah}`;
    const globalNum = GLOBAL[key];
    const url = getAyahAudioUrl(globalNum);
    const tmpFile = `${tmpBase}-${globalNum}.mp3`;

    let realSec = NaN;
    let cbrSec: number | null = null;
    try {
      await download(url, tmpFile);
      realSec = await ffprobeDuration(tmpFile);
      cbrSec = await getRemoteAudioDurationInSeconds(url); // nouvelle mesure exacte (scan frames)
    } catch (err) {
      rows.push(`  ${key.padEnd(6)} global=${String(globalNum).padStart(4)}  ERREUR: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    } finally {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
    }

    const realFrames = Math.round(realSec * FPS);
    const cbrFrames = cbrSec ? Math.round(cbrSec * FPS) : null;
    // DANGER = mesure < réel : la scène serait trop courte ⇒ coupure de la récitation.
    // Mesure ≥ réel (délai d'encodeur LAME inclus) = marge de sécurité, jamais de coupure.
    const deltaPct = cbrSec ? ((cbrSec - realSec) / realSec) * 100 : null;
    const wouldCut = cbrSec === null || deltaPct! < -2;

    if (wouldCut) {
      mismatchCount++;
      if (cbrSec === null) cbrNull++;
    }

    rows.push(
      `  ${key.padEnd(6)} global=${String(globalNum).padStart(4)}  réel=${realSec.toFixed(2)}s (${String(realFrames).padStart(4)}fr)  mesure=${(cbrSec ?? NaN).toFixed(2)}s (${String(cbrFrames ?? NaN).padStart(4)}fr)  delta=${(deltaPct ?? NaN).toFixed(1)}%${wouldCut ? "  ⚠️ CUT RISK" : "  ✓ safe"}`,
    );
  }

  console.log("=== PROBE RÉCITATION VERSETS — durée réelle (ffprobe) vs mesure pipeline (scan MPEG) ===");
  console.log(rows.join("\n"));
  console.log("");
  console.log(`VERSES_TESTED = ${VERSES.length}`);
  console.log(`UNKNOWN_DURATION = ${cbrNull} (durée non mesurée → fallback 3s)`);
  console.log(`CUT_RISK_COUNT = ${mismatchCount} (mesure < réel −2% ou durée inconnue ⇒ récitation coupée)`);
  console.log(`VERDICT = ${mismatchCount === 0 ? "NO_CUT_GUARANTEED" : "CUT_RISK_DETECTED"}`);
}

main().catch((err) => {
  console.error("PROBE_ERROR:", err);
  process.exit(1);
});
