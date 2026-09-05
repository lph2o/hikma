// Hikma — PREUVE : rendu d'une frame PNG directe (renderStill) du clip étoile
// avec glow drop-shadow, pour isoler : pipeline Remotion vs encodage ffmpeg.
//
// Usage : npx tsx scripts/glow-still-proof.ts [out.png]

import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { COMPOSITION_ID } from "../remotion/Root";
import { hikmaWebpackOverride } from "../remotion/bundler-config";
import { createShapeGraphicClip } from "../lib/content-studio/graphics/shape-graphic";
import {
  buildTextAnimation,
  createTextGraphicClip,
} from "../lib/content-studio/graphics/text-graphic";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const outputArg = process.argv[2] ?? join(process.cwd(), "out", "glow-still.png");

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

  const graphics = [
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
    }),
  ];

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

  console.log("🖼️  Rendu still frame 40…");
  await renderStill({
    composition,
    serveUrl,
    output: outputArg,
    frame: 40,
    inputProps,
    onBrowserLog: (log) => {
      if (log.text && log.text.includes("[GLOW_PROBE]")) {
        console.log("BROWSER_LOG:", log.text);
      }
    },
  });

  console.log(`STILL_OK = ${outputArg}`);
}

main().catch((err) => {
  console.error("PROOF_ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
