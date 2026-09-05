// Hikma — TEST ISOLÉ : CSS filter: drop-shadow vs SVG <filter> glow,
// rendu headless Remotion (renderStill), pour choisir la technique de glow
// qui fonctionne à la fois en Preview navigateur ET en rendu MP4.
//
// Usage : npx tsx scripts/filter-parity-test.ts

import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { hikmaWebpackOverride } from "../remotion/bundler-config";

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
  const entryPoint = join(process.cwd(), "scripts", "filter-parity-entry.tsx");

  const serveUrl = await bundle({
    entryPoint,
    onProgress: () => {},
    webpackOverride: hikmaWebpackOverride,
  });

  const composition = await selectComposition({ serveUrl, id: "GlowTest" });
  const output = join(process.cwd(), "out", "filter-parity.png");
  await renderStill({ composition, serveUrl, output, frame: 10 });
  console.log(`STILL_OK = ${output}`);
}

main().catch((err) => {
  console.error("PROOF_ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
