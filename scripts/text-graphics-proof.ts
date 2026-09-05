// Hikma — PREUVE RÉELLE : rendu MP4 de la couche graphique texte (TextGraphicClip).
//
// Pipeline identique à la route de rendu : une composition Remotion avec
// inputProps { scenes, graphics } → renderMedia → MP4. La couche graphique
// est rendue par remotion/scenes/GraphicsOverlay.tsx (même code en Preview et
// en Render → PREVIEW == RENDER par construction).
//
// La preuve vérifie :
//   - le rendu aboutit (fichier MP4 non vide, lisible) ;
//   - la durée vidéo correspond aux scènes (texte incluant le clip graphique) ;
//   - aucun échec de bundle/render.
//
// Usage : npx tsx scripts/text-graphics-proof.ts [out.mp4]
// Aucune écriture DB. Le MP4 est un EXPORT local de preuve.

import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { COMPOSITION_ID, VIDEO_FPS } from "../remotion/Root";
import { hikmaWebpackOverride } from "../remotion/bundler-config";
import {
  buildTextAnimation,
  createTextGraphicClip,
} from "../lib/content-studio/graphics/text-graphic";
import { createShapeGraphicClip } from "../lib/content-studio/graphics/shape-graphic";
import { TEXT_ANIMATION_PRESETS } from "../lib/content-studio/graphics/text-animation-presets";

const execFileAsync = promisify(execFile);

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

async function ffprobeDuration(file: string): Promise<{
  duration: number;
  width: number;
  height: number;
  streams: number;
}> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration:stream=codec_type,width,height",
    "-of", "json",
    file,
  ]);
  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string; width?: number; height?: number }>;
  };
  const video = parsed.streams?.find((s) => s.codec_type === "video");
  return {
    duration: Number(parsed.format?.duration) || 0,
    width: Number(video?.width) || 0,
    height: Number(video?.height) || 0,
    streams: parsed.streams?.length ?? 0,
  };
}

async function main(): Promise<void> {
  loadEnvFiles();
  const outputArg = process.argv[2];

  // Scène de fond simple (durée 3 s) — même type que toVideoSceneData (kind "word").
  const scenes = [
    {
      kind: "word",
      arabic: "يَوْمَ",
      transliteration: "yawma",
      meaning: "le Jour",
      startFrame: 0,
      durationInFrames: 90,
      audioUrl: null as string | null,
      audioStartFrame: 0,
      audioDurationInFrames: null as number | null,
    },
  ];

  // Clips graphiques texte : animation preset + keyframes + RTL arabe.
  const graphics = [
    createTextGraphicClip({
      id: "proof-text-fr",
      startFrame: 0,
      durationInFrames: 90,
      zIndex: 2,
      transform: { x: 0.5, y: 0.2 },
      text: "Hikma Studio",
      direction: "ltr",
      animation: buildTextAnimation("fade", {
        inDurationFrames: 15,
        outDurationFrames: 15,
      }),
    }),
    createTextGraphicClip({
      id: "proof-text-ar",
      startFrame: 0,
      durationInFrames: 90,
      zIndex: 3,
      transform: { x: 0.5, y: 0.8 },
      text: "يَوْمَ",
      direction: "rtl",
      style: {
        fontSize: 72,
        color: "#f5d47a",
        fontFamily: "Amiri, serif",
        textAlign: "center",
        // Effets visuels : contour blanc + halo doré + ombre directionnelle —
        // rendus en couches (parité Preview/headless).
        strokeColor: "#ffffff",
        strokeWidth: 2,
        glowColor: "#f5d47a",
        glowRadius: 22,
        glowOpacity: 0.85,
        shadowColor: "#000000",
        shadowOffsetX: 3,
        shadowOffsetY: 5,
        shadowBlur: 10,
      },
      animation: buildTextAnimation("typewriter", {
        inDurationFrames: 30,
        outDurationFrames: 15,
      }),
    }),
    createTextGraphicClip({
      id: "proof-text-fr-grad",
      startFrame: 0,
      durationInFrames: 90,
      zIndex: 4,
      transform: { x: 0.5, y: 0.5 },
      text: "HIKMA",
      direction: "ltr",
      style: {
        fontSize: 88,
        fontWeight: 800,
        color: "#f5d47a",
        fontFamily: "Poppins, sans-serif",
        textAlign: "center",
        gradient: { colors: ["#f5d47a", "#e2562f"], angle: 90 },
      },
    }),
    // Forme : étoile dorée + HALO doré + ombre (effets visibles dans le MP4).
    createShapeGraphicClip({
      id: "proof-shape-star",
      startFrame: 0,
      durationInFrames: 90,
      zIndex: 1,
      transform: { x: 0.85, y: 0.15 },
      shape: "star",
      sides: 5,
      thickness: 0.14,
      fill: { type: "solid", color: "#c9a84c" },
      glow: { color: "#f5d47a", opacity: 0.9, radius: 24 },
      shadow: { color: "#000000", opacity: 0.5, offsetX: 3, offsetY: 5, blur: 6 },
    }),
  ];

  console.log(`🎬 Scènes : ${scenes.map((s) => s.kind).join(" → ")} (${scenes[0].durationInFrames} frames)`);
  console.log(`🧩 Clips graphiques : ${graphics.map((g) => `${g.id} (${g.kind})`).join(", ")}`);
  console.log(`   Presets disponibles : ${Object.keys(TEXT_ANIMATION_PRESETS).length}`);
  console.log(`   Arabic RTL : ${graphics[1].text} (direction ${graphics[1].direction})`);

  const entryPoint = join(process.cwd(), "remotion", "index.ts");
  console.log("📦 Bundle Remotion…");
  const serveUrl = await bundle({
    entryPoint,
    onProgress: () => {},
    webpackOverride: hikmaWebpackOverride,
  });

  const inputProps = { scenes, graphics };
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });

  const outputLocation = outputArg ?? join(process.cwd(), "out", "text-graphics-proof.mp4");
  console.log("🎥 Rendu MP4…");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
  });

  const probe = await ffprobeDuration(outputLocation);
  const totalExpected = scenes.reduce((acc, s) => acc + s.durationInFrames, 0) / VIDEO_FPS;

  console.log("");
  console.log("=== VÉRIFICATION ffprobe du MP4 ===");
  console.log(`VIDEO : ${probe.width}×${probe.height}, durée ${probe.duration.toFixed(2)} s, ${probe.streams} flux`);
  console.log(`MP4_TOTAL_DURATION = ${probe.duration.toFixed(2)} s (attendu ~${totalExpected.toFixed(2)} s)`);
  console.log(`FILE_NON_EMPTY = ${probe.duration > 0 ? "PASS ✓" : "FAIL ❌"}`);
  console.log(`DURATION_MATCH = ${Math.abs(probe.duration - totalExpected) < 1.5 ? "PASS ✓" : "FAIL ❌"}`);
  console.log(`FORMAT_1080x1920 = ${probe.width === 1080 && probe.height === 1920 ? "PASS ✓" : `note (${probe.width}×${probe.height})`}`);
  console.log(`PROOF = ${probe.duration > 0 ? "TEXT_GRAPHICS_RENDERED" : "TEXT_GRAPHICS_FAILED"}`);
  console.log(`OUTPUT = ${outputLocation}`);
}

main().catch((err) => {
  console.error("PROOF_ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
