// Hikma — Content Studio (Phase G) : RENDU VIDÉO SERVEUR (bibliothèque partagée).
//
// Factorisation du pipeline `scripts/render-content-video.ts` en une fonction
// RÉUTILISABLE par :
//   - la CLI (scripts/render-content-video.ts) ;
//   - la route serveur protégée (app/api/admin/content-studio/render/route.ts).
//
// Source de vérité commune :
//   content_items.payload  →  VideoSceneData dérivé (déterministe)
//   editor_state.scenes    →  overrides du studio (S'ILS existent)
//   scenes EFFECTIVES      →  la composition Remotion (HikmaWordVideo)
//
// Le rendu n'ignore JAMAIS les modifications du studio : si editor_state est
// présent, ce sont ses scènes qui sont rendues.
//
// Ce module importe @remotion/renderer (Chrome headless + ffmpeg) : il ne doit
// JAMAIS être importé côté client. Next.js le déclare dans serverExternalPackages.

import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import {
  buildVideoContentFromQuiz,
  buildVideoContentFromReveal,
  buildVideoContentFromDeepDive,
  buildVideoContentFromFrequencyFact,
  buildVideoContentFromSurahHighlight,
  toVideoSceneData,
} from "./video/pipeline";
import type { ContentStudioItem } from "./types";
import { getEffectiveSceneData, hashEffectiveScenes } from "./editor/state";
import { resolveContentStudioAudio, type ContentStudioAudio } from "./audio";
import { getContentStudioDbClient } from "./client";

// Contrats constants du rendu (gélés Phase A/B) — définis ICI pour éviter
// d'importer remotion/Root (qui charge le runtime React de Remotion et rend la
// collecte de la route serveur impossible). Ces valeurs MIRRORENT remotion/Root.tsx.
const COMPOSITION_ID = "HikmaWordVideo";
const VIDEO_FPS = 30;

export const RENDER_OUT_DIR = "out";

/**
 * Scènes EFFECTIVES d'un contenu — SOURCE DE VÉRITÉ UNIQUE (cf. G2).
 * Dérivées du payload + overrides editor_state + audio résolu ; mêmes scènes que Preview/Timeline.
 */
export function effectiveScenesOf(
  item: ContentStudioItem,
  audio?: ContentStudioAudio,
): {
  scenes: ReturnType<typeof toVideoSceneData>["scenes"];
  effectiveHash: string;
  hasEdits: boolean;
} {
  const content =
    item.templateKey === "WORD_QUIZ_V1"
      ? buildVideoContentFromQuiz(item.payload as never, audio)
      : item.templateKey === "VERSE_DEEP_DIVE_V1"
        ? buildVideoContentFromDeepDive(item.payload as never, audio)
        : item.templateKey === "FREQUENCY_FACT_V1"
          ? buildVideoContentFromFrequencyFact(item.payload as never, audio)
          : item.templateKey === "SURAH_HIGHLIGHT_V1"
            ? buildVideoContentFromSurahHighlight(item.payload as never, audio)
            : buildVideoContentFromReveal(item.payload as never, audio);
  const { scenes, hasEdits } = getEffectiveSceneData(content, item.editorState as never);
  return { scenes, effectiveHash: hashEffectiveScenes(scenes), hasEdits };
}

/** Durée (frames) et dimensions de référence (contrat 1080×1920 30fps). */
export function renderTargets(item: ContentStudioItem): {
  fps: number;
  width: number;
  height: number;
} {
  const content =
    item.templateKey === "WORD_QUIZ_V1"
      ? buildVideoContentFromQuiz(item.payload as never)
      : item.templateKey === "VERSE_DEEP_DIVE_V1"
        ? buildVideoContentFromDeepDive(item.payload as never)
        : item.templateKey === "FREQUENCY_FACT_V1"
          ? buildVideoContentFromFrequencyFact(item.payload as never)
          : item.templateKey === "SURAH_HIGHLIGHT_V1"
            ? buildVideoContentFromSurahHighlight(item.payload as never)
            : buildVideoContentFromReveal(item.payload as never);
  const derived = toVideoSceneData(content);
  return { fps: derived.fps, width: derived.width, height: derived.height };
}

/**
 * Exécute le rendu MP4 RÉEL d'un contenu avec ses scènes EFFECTIVES et pistes audio.
 * Renvoie le chemin local temporaire + hash effectif ; ne touche PAS au registre
 * (c'est la route qui gère le statut et l'upload vers le stockage persistant).
 */
export async function renderEffectiveVideoToFile(
  item: ContentStudioItem,
  outputDir = RENDER_OUT_DIR,
): Promise<
  | {
      status: "RENDERED";
      outputLocation: string;
      durationInFrames: number;
      width: number;
      height: number;
      effectiveHash: string;
    }
  | { status: "REJECTED"; code: string; message: string }
> {

  // Résolution dynamique des pistes audio réelles (word audio Storage + verse audio CDN)
  const client = getContentStudioDbClient();
  const payloadAny = item.payload as {
    sources?: { ayahId?: string | null };
    firstOccurrence?: {
      surahNumber?: number;
      ayahNumber?: number;
      globalAyahNumber?: number | null;
    };
  } | null;

  const audio = await resolveContentStudioAudio(client, {
    wordId: item.wordId,
    ayahId: payloadAny?.sources?.ayahId,
    globalAyahNumber: payloadAny?.firstOccurrence?.globalAyahNumber,
    surahNumber: payloadAny?.firstOccurrence?.surahNumber,
    ayahNumber: payloadAny?.firstOccurrence?.ayahNumber,
  });

  const { scenes, effectiveHash } = effectiveScenesOf(item, audio);
  const { width, height } = renderTargets(item);
  const durationInFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);

  // turbopackIgnore : le bundle Remotion est un job serveur lourd — Next ne doit
  // pas tracer/inclure tout le projet dans cet App Route (Chrome/ffmpeg externes).
  const entryPoint = join(/* turbopackIgnore: true */ process.cwd(), "remotion", "index.ts");
  const serveUrl = await bundle({ entryPoint, onProgress: () => {} });

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: { scenes },
  });

  if (composition.width !== width || composition.height !== height) {
    return {
      status: "REJECTED",
      code: "FORMAT_MISMATCH",
      message: `Format composition (${composition.width}×${composition.height}) ≠ contrat (${width}×${height}).`,
    };
  }

  await mkdir(join(/* turbopackIgnore: true */ process.cwd(), outputDir), { recursive: true });
  const outputLocation = join(/* turbopackIgnore: true */ process.cwd(), outputDir, `${item.contentKey}.mp4`);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps: { scenes },
  });

  return {
    status: "RENDERED",
    outputLocation,
    durationInFrames: durationInFrames || composition.durationInFrames,
    width: composition.width,
    height: composition.height,
    effectiveHash,
  };
}

export { VIDEO_FPS, COMPOSITION_ID, hashEffectiveScenes };