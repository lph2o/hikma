// Hikma — Probe audio du mot (Muallim, bucket privé) : durée réelle (ffprobe)
// vs estimation HEAD Opus 48kbps utilisée par le pipeline.
// Usage : npx tsx scripts/probe-word-audio.ts <wordId> [wordId...]
// Aucune écriture DB, fichiers temporaires /tmp supprimés.

import { execFile } from "node:child_process";
import { unlinkSync, createWriteStream } from "node:fs";
import { promisify } from "node:util";
import https from "node:https";
import { getContentStudioClient } from "../lib/content-api/client";
import { getWordAudioState } from "../lib/learning/queries";
import { getRemoteAudioDurationInSeconds } from "../lib/content-studio/audio";

const execFileAsync = promisify(execFile);

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
  (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(".env.local");
  (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(".env");
  const wordIds = process.argv.slice(2);
  if (wordIds.length === 0) {
    console.error("Usage : npx tsx scripts/probe-word-audio.ts <wordId> [wordId...]");
    process.exit(1);
  }

  const client = getContentStudioClient();
  const state = await getWordAudioState(client, wordIds);
  const rows: string[] = [];
  let cutRisk = 0;

  for (const wid of wordIds) {
    const url = state.urls.get(wid);
    if (!url) {
      rows.push(`  ${wid}  AUCUN AUDIO (word_audio absent)`);
      continue;
    }
    const tmpFile = `/tmp/hikma-word-${wid}.audio`;
    let realSec = NaN;
    let estSec: number | null = null;
    try {
      await download(url, tmpFile);
      realSec = await ffprobeDuration(tmpFile);
      estSec = await getRemoteAudioDurationInSeconds(url);
    } catch (err) {
      rows.push(`  ${wid}  ERREUR: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    } finally {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
    }
    const deltaPct = estSec ? ((estSec - realSec) / realSec) * 100 : null;
    const wouldCut = estSec === null || deltaPct! < -2;
    if (wouldCut) cutRisk++;
    rows.push(
      `  ${wid}  réel=${realSec.toFixed(2)}s  est=${(estSec ?? NaN).toFixed(2)}s  delta=${(deltaPct ?? NaN).toFixed(1)}%${wouldCut ? "  ⚠️ CUT RISK" : "  ✓ safe"}  ${url.includes(".opus") ? "opus" : url.split(".").pop()}`,
    );
  }

  console.log("=== PROBE AUDIO DU MOT — durée réelle (ffprobe) vs estimation pipeline ===");
  console.log(rows.join("\n"));
  console.log("");
  console.log(`WORDS_TESTED = ${wordIds.length}`);
  console.log(`CUT_RISK_COUNT = ${cutRisk}`);
  console.log(`VERDICT = ${cutRisk === 0 ? "NO_CUT_GUARANTEED" : "CUT_RISK_DETECTED"}`);
}

main().catch((err) => {
  console.error("PROBE_ERROR:", err);
  process.exit(1);
});
