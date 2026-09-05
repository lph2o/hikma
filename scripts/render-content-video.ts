// Hikma — Content Studio : RENDU VIDÉO (pipeline DB → Content API →
// VideoSceneData → Remotion → MP4).
//
// Usage :
//   npx tsx scripts/render-content-video.ts                     → fixture B3 (يَوْمَ)
//   npx tsx scripts/render-content-video.ts <wordId>            → mot réel (si DB jointe)
//   npx tsx scripts/render-content-video.ts <wordId> <out.mp4>  → sortie personnalisée
//
// Déterministe : même contenu + même version ⇒ même vidéo (à paramètres de
// rendu identiques). Aucune publication : le MP4 est un EXPORT local.

import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { hikmaWebpackOverride } from "../remotion/bundler-config";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { ContentStudioService } from "../lib/content-api/service";
import { getContentStudioClient } from "../lib/content-api/client";
import { REVEAL_FIXTURE_YAWMA } from "../lib/content-studio/video/fixtures";
import {
  buildVideoContentFromReveal,
  toVideoSceneData,
} from "../lib/content-studio/video/pipeline";
import type { VideoContent } from "../lib/content-studio/video/types";
import { COMPOSITION_ID, VIDEO_FPS } from "../remotion/Root";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

async function resolveVideoContent(wordId: string | undefined): Promise<VideoContent> {
  if (wordId) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      console.warn("⚠️  DB non configurée (NEXT_PUBLIC_SUPABASE_* absents) — fallback fixture B3.");
      return buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    }
    const service = new ContentStudioService(getContentStudioClient());
    const outcome = await service.buildReveal(wordId);
    if (outcome.status === "REJECTED") {
      throw new Error(`REJECTED ${outcome.code}: ${outcome.message}`);
    }
    return buildVideoContentFromReveal(outcome.payload);
  }
  return buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
}

async function main(): Promise<void> {
  loadEnvFiles();
  const wordId = process.argv[2];
  const outputArg = process.argv[3];

  const content = await resolveVideoContent(wordId);
  const sceneData = toVideoSceneData(content);
  const durationSeconds = sceneData.durationInFrames / VIDEO_FPS;

  console.log(`🎬 Composition : ${COMPOSITION_ID} (contentKey ${content.contentKey.slice(0, 12)}…)`);
  console.log(`   Scènes : ${sceneData.scenes.map((s) => s.kind).join(" → ")}`);
  console.log(`   Durée : ${sceneData.durationInFrames} frames @ ${VIDEO_FPS} fps (${durationSeconds.toFixed(1)} s)`);
  console.log(`   Format : ${sceneData.width}×${sceneData.height} (${sceneData.layout})`);

  const entryPoint = join(process.cwd(), "remotion", "index.ts");
  console.log("📦 Bundle Remotion…");
  const serveUrl = await bundle({
    entryPoint,
    onProgress: (p) => process.stdout.write(`   bundle ${Math.min(Math.round(p * 100), 100)}%\r`),
    webpackOverride: hikmaWebpackOverride,
  });
  process.stdout.write("\n");

  // selectComposition évalue calculateMetadata AVEC les inputProps réelles :
  // la durée du rendu est exactement celle des scènes (jamais la durée max par
  // défaut). Idem pour les dimensions/format.
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: { scenes: sceneData.scenes },
  });
  if (composition.width !== sceneData.width || composition.height !== sceneData.height) {
    throw new Error(
      `Format composition (${composition.width}×${composition.height}) ≠ contrat (${sceneData.width}×${sceneData.height})`,
    );
  }

  const outputLocation = outputArg ?? join(process.cwd(), "out", "hikma-word-video.mp4");

  console.log("🎥 Rendu MP4 (h264, 1080×1920)…");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps: { scenes: sceneData.scenes },
  });

  console.log(`✅ Vidéo exportée : ${outputLocation}`);
  console.log(`   Durée : ${composition.durationInFrames} frames (${(composition.durationInFrames / VIDEO_FPS).toFixed(1)} s)`);
  console.log(`   (EXPORTÉ ≠ PUBLIÉ — aucune publication effectuée.)`);
}

main().catch((err) => {
  console.error("Erreur :", err instanceof Error ? err.message : err);
  process.exit(1);
});
