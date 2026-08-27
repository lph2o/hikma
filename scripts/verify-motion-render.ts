// Hikma — Content Studio (Phase H1/H2) : PREUVE VISUELLE RÉELLE DU MOTION ENGINE.
//
// Rendu RÉEL via @remotion/bundler + @remotion/renderer sur un vrai mot
// (يَوْمَ — fixture B3-FINAL), SANS écriture DB :
//
//   REVEAL_FIXTURE_YAWMA → effectiveScenesOf (source unique Preview=Render)
//   → bundle (remotion/index.ts) → renderStill aux frames clés (entrée mot,
//     miroir, light sweep, état posé) → renderMedia → MP4 réel
//   → galerie HTML (out/motion-proof/index.html) pour inspection visuelle.
//
// Usage : npx tsx scripts/verify-motion-render.ts

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import type { ContentStudioItem } from "../lib/content-studio/types";
import type { VideoScene } from "../lib/content-studio/video/types";
import { REVEAL_FIXTURE_YAWMA } from "../lib/content-studio/video/fixtures";
import { effectiveScenesOf } from "../lib/content-studio/render";

const COMPOSITION_ID = "HikmaWordVideo";
const OUT_DIR = "out/motion-proof";

function loadEnv(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      /* absent */
    }
  }
}

/** Item SANS editor_state : montage déterministe ⇒ Word Hero par défaut (H1). */
function baseItem(): ContentStudioItem {
  return {
    id: "verify-motion-h1",
    contentKey: REVEAL_FIXTURE_YAWMA.contentKey,
    templateKey: "WORD_REVEAL_V1",
    templateVersion: "1",
    language: "fr",
    wordId: REVEAL_FIXTURE_YAWMA.word.id,
    hookVariantId: "HOOK_H1",
    ctaId: "CTA_LEARN_01",
    status: "DRAFT",
    version: 1,
    renderStatus: "NOT_RENDERED",
    renderedAt: null,
    renderError: null,
    renderPath: null,
    payload: REVEAL_FIXTURE_YAWMA as unknown as Record<string, unknown>,
    sources: REVEAL_FIXTURE_YAWMA.sources as unknown as Record<string, unknown>,
    licenses: REVEAL_FIXTURE_YAWMA.licenses as unknown as Record<string, unknown>,
    editorState: null,
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
  };
}

async function main(): Promise<void> {
  loadEnv();
  await mkdir(join(process.cwd(), OUT_DIR), { recursive: true });

  const item = baseItem();
  const { scenes, effectiveHash } = effectiveScenesOf(item);
  const durations = scenes.map((s) => s.durationInFrames);
  const wordStart = durations.slice(0, 1).reduce((a, b) => a + b, 0);
  console.log(`EFFECTIVE_HASH=${effectiveHash.slice(0, 12)}…`);
  console.log(`SCENES=${scenes.map((s) => `${s.kind}:${s.durationInFrames}f`).join(" ")}`);
  console.log(`WORD_START=${wordStart}`);

  // Frames clés (globales) — entrée du mot, miroir, sweep, état posé, autres scènes.
  const frames = [0, wordStart, wordStart + 10, wordStart + 17, wordStart + 30, wordStart + 40, wordStart + 47, wordStart + 55, 130, 220];
  const labels: Record<number, string> = {
    0: "Intro (début)",
    [wordStart]: "WORD — frame 0 (entrée)",
    [wordStart + 10]: "WORD — entrée (miroir apparaît)",
    [wordStart + 17]: "WORD — entrée finale",
    [wordStart + 30]: "WORD — light sweep (début de traversée)",
    [wordStart + 40]: "WORD — light sweep (traversée)",
    [wordStart + 47]: "WORD — sweep sortie / glint",
    [wordStart + 55]: "WORD — état posé (respiration, sans sweep)",
    130: "MEANING — sens",
    220: "QURAN — verset",
  };

  const entryPoint = join(process.cwd(), "remotion", "index.ts");
  const serveUrl = await bundle({ entryPoint, onProgress: () => {} });

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: { scenes },
  });
  console.log(`COMPOSITION=${composition.width}x${composition.height} ${composition.durationInFrames}f`);

  const stillPaths: string[] = [];
  for (const frame of frames) {
    const output = join(process.cwd(), OUT_DIR, `frame-${String(frame).padStart(4, "0")}.png`);
    await renderStill({
      composition,
      serveUrl,
      output,
      frame,
      inputProps: { scenes },
    });
    stillPaths.push(output);
    console.log(`STILL frame=${frame} (${labels[frame] ?? ""}) → ${output.replace(process.cwd() + "/", "")}`);
  }

  const mp4 = join(process.cwd(), OUT_DIR, "hikma-motion-h1.mp4");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: mp4,
    inputProps: { scenes },
  });
  console.log(`MP4=${mp4.replace(process.cwd() + "/", "")}`);

  // ------------------------------------------------------------------
  // H2 — test multi-longueurs : mots RÉELS du corpus (court, diacritiques
  // hautes empilées, tanwīn, moyen, long). Chaque mot est rendu avec la zone
  // typographique sûre — les harakat NE doivent JAMAIS être coupés.
  // ------------------------------------------------------------------
  const wordTests = [
    { arabic: "يَوْمَ", transliteration: "yawma", label: "Court — يَوْمَ (2:113)" },
    { arabic: "إِنَّ", transliteration: "inna", label: "Diacr. hautes — إِنَّ (2:6)" },
    { arabic: "شَيْءٍ", transliteration: "shayʾin", label: "Tanwīn — شَيْءٍ (2:20)" },
    { arabic: "الْحَمْدُ", transliteration: "al-ḥamdu", label: "Moyen — الْحَمْدُ (1:2)" },
    { arabic: "ٱلْمُتَّقِينَ", transliteration: "al-muttaqīn", label: "Long — ٱلْمُتَّقِينَ (2:2)" },
  ];
  const multiScenes: VideoScene[] = wordTests.map((w) => ({
    kind: "word",
    durationInFrames: 60,
    arabic: w.arabic,
    transliteration: w.transliteration,
    title: w.label,
  }));
  const multiFrames: Array<{ f: number; label: string }> = [];
  wordTests.forEach((w, i) => {
    const start = i * 60;
    multiFrames.push({ f: start + 38, label: `${w.label} — light sweep` });
    multiFrames.push({ f: start + 55, label: `${w.label} — état posé (silver + reflet)` });
  });
  const multiComposition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: { scenes: multiScenes },
  });
  for (const { f, label } of multiFrames) {
    const output = join(process.cwd(), OUT_DIR, `word-${String(f).padStart(4, "0")}.png`);
    await renderStill({
      composition: multiComposition,
      serveUrl,
      output,
      frame: f,
      inputProps: { scenes: multiScenes },
    });
    console.log(`STILL frame=${f} (${label}) → ${output.replace(process.cwd() + "/", "")}`);
  }
  const multiMp4 = join(process.cwd(), OUT_DIR, "hikma-motion-h2-words.mp4");
  await renderMedia({
    composition: multiComposition,
    serveUrl,
    codec: "h264",
    outputLocation: multiMp4,
    inputProps: { scenes: multiScenes },
  });
  console.log(`MP4_WORDS=${multiMp4.replace(process.cwd() + "/", "")}`);

  // Galerie HTML pour inspection visuelle (PNG embarqués en base64 — la galerie
  // est autonome et inspectable sans serveur de fichiers).
  const cards: string[] = [];
  for (const f of frames) {
    const png = `frame-${String(f).padStart(4, "0")}.png`;
    const b64 = (await readFile(join(process.cwd(), OUT_DIR, png))).toString("base64");
    cards.push(`<figure style="margin:0 0 28px;text-align:center">
        <img src="data:image/png;base64,${b64}" alt="${labels[f]}" style="width:270px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.5)" />
        <figcaption style="margin-top:8px;font:500 13px/1.4 system-ui,sans-serif;color:#e8e4d8">f${f} — ${labels[f]}</figcaption>
      </figure>`);
  }
  for (const { f, label } of multiFrames) {
    const png = `word-${String(f).padStart(4, "0")}.png`;
    const b64 = (await readFile(join(process.cwd(), OUT_DIR, png))).toString("base64");
    cards.push(`<figure style="margin:0 0 28px;text-align:center">
        <img src="data:image/png;base64,${b64}" alt="${label}" style="width:270px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.5)" />
        <figcaption style="margin-top:8px;font:500 13px/1.4 system-ui,sans-serif;color:#e8e4d8">${label}</figcaption>
      </figure>`);
  }
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8" />
<title>H1 — Motion Proof (يَوْمَ)</title>
<style>body{margin:0;background:#0d1717;color:#f8f8f0;font:14px/1.5 system-ui,sans-serif}main{max-width:640px;margin:0 auto;padding:32px 20px}h1{font-size:20px;color:#f0d090}p{color:#9fb3ad}</style>
</head><body><main>
<h1>H1 — Word Hero · Motion Proof</h1>
<p>Mot réel : يَوْمَ (Al-Baqarah · 2:113) · 1080×1920 @30fps · scènes effectives (aucun override) · MP4&nbsp;: <code>hikma-motion-h1.mp4</code></p>
${cards}
</main></body></html>`;
  await writeFile(join(process.cwd(), OUT_DIR, "index.html"), html, "utf8");
  console.log("GALLERY=out/motion-proof/index.html");

  console.log("\n=== RÉSUMÉ MANDATOIRE H1/H2 ===");
  console.log("RENDER_EXECUTED=true");
  console.log("STILLS=" + stillPaths.length);
  console.log("MOTION_PRESETS=word-focus, mirror-reflection, light-sweep, golden-glint, soft-glow, breathing-scale");
}

main().catch((err) => {
  console.error("MOTION_RENDER_ERROR " + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
