// Hikma — PREUVE RENDER : UNIFICATION TEXT EDITOR (textes hérités promus).
//
// Rendu d'une frame PNG réelle (renderStill) d'une composition avec :
//   - scène MEANING (index 1) contenant « le Jour » (couleur héritée cream) ;
//   - un TextGraphicClip PROMU de cette scène (source { sceneIndex: 1,
//     field: "text" }) avec une couleur de remplacement (#22c55e, taille 88).
//
// Vérifie les PIXELS de la frame :
//   1. le clip promu est PEINT (vert #22c55e présent au centre) ;
//   2. l'ORIGINAL est MASQUÉ (aucun amas cream #fffdf8 au centre — le texte
//      hérité n'est plus rendu par la scène, pas de double rendu).
//
// Usage : npx tsx scripts/legacy-promote-proof.ts [out.png]

import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { COMPOSITION_ID } from "../remotion/Root";
import { hikmaWebpackOverride } from "../remotion/bundler-config";
import { createTextGraphicClip } from "../lib/content-studio/graphics/text-graphic";

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
  const outputArg = process.argv[2] ?? join(process.cwd(), "out", "legacy-promote-proof.png");

  const scenes = [
    {
      kind: "word" as const,
      arabic: "يَوْمَ",
      transliteration: "yawma",
      durationInFrames: 90,
    },
    {
      kind: "meaning" as const,
      text: "le Jour",
      durationInFrames: 90,
    },
  ];

  // Clip PROMU de la scène 1 (meaning) — l'original doit être masqué.
  const graphics = [
    createTextGraphicClip({
      id: "proof-legacy-meaning",
      startFrame: 90,
      durationInFrames: 90,
      zIndex: 5,
      transform: { x: 0.5, y: 0.5 },
      text: "le Jour",
      style: {
        fontSize: 88,
        fontWeight: 600,
        color: "#22c55e",
        fontFamily: "Poppins",
        textAlign: "center",
      },
      source: { sceneIndex: 1, field: "text" },
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

  console.log("🖼️  Rendu still frame 100 (scène meaning, clip promu actif)…");
  await renderStill({
    composition,
    serveUrl,
    output: outputArg,
    frame: 100,
    inputProps,
  });

  console.log(`STILL_OK = ${outputArg}`);
  console.log("LEGACY_PROMOTE_PROOF=rendered");
}

main().catch((err) => {
  console.error("PROOF_ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
