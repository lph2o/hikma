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
import { toVideoSceneData } from "./video/pipeline";
import { buildVideoContentForTemplate } from "./video/content-dispatch";
import type { ContentStudioItem } from "./types";
import {
  getEffectiveGraphics,
  getEffectiveSceneData,
  hashEffectiveGraphics,
  hashEffectiveScenes,
} from "./editor/state";
import { resolveContentStudioAudio, type ContentStudioAudio } from "./audio";
import { getContentStudioDbClient } from "./client";
import { hikmaWebpackOverride } from "../../remotion/bundler-config";

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
  graphics: ReturnType<typeof getEffectiveGraphics>;
  effectiveHash: string;
  hasEdits: boolean;
} {
  const content = buildVideoContentForTemplate(item.templateKey, item.payload, audio);
  const { scenes, hasEdits } = getEffectiveSceneData(content, item.editorState as never);
  const graphics = getEffectiveGraphics(item.editorState as never);
  // Hash combiné : les clips graphiques participent à l'invalidation du rendu.
  // Sans graphics, hash IDENTIQUE à l'historique (rétro-compatibilité totale).
  const effectiveHash =
    graphics.length > 0
      ? `${hashEffectiveScenes(scenes)}-${hashEffectiveGraphics(graphics)}`
      : hashEffectiveScenes(scenes);
  return { scenes, graphics, effectiveHash, hasEdits };
}

/** Durée (frames) et dimensions de référence (contrat 1080×1920 30fps). */
export function renderTargets(item: ContentStudioItem): {
  fps: number;
  width: number;
  height: number;
} {
  const content = buildVideoContentForTemplate(item.templateKey, item.payload);
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
    words?: { wordId: string }[];
  } | null;

  // Speed Vocab : audio résolu pour TOUS les mots (batch unique) — PREVIEW ==
  // RENDER exige que le rendu MP4 reçoive exactement les mêmes pistes que
  // l'éditeur (page admin passe les mêmes extraWordIds).
  const extraWordIds =
    item.templateKey === "VOCAB_SPEED_RUN_V1"
      ? (payloadAny?.words ?? [])
          .map((w) => w.wordId)
          .filter((id) => id && id !== item.wordId)
      : [];

  const audio = await resolveContentStudioAudio(client, {
    wordId: item.wordId,
    extraWordIds,
    ayahId: payloadAny?.sources?.ayahId,
    globalAyahNumber: payloadAny?.firstOccurrence?.globalAyahNumber,
    surahNumber: payloadAny?.firstOccurrence?.surahNumber,
    ayahNumber: payloadAny?.firstOccurrence?.ayahNumber,
  });

  const { scenes, graphics, effectiveHash } = effectiveScenesOf(item, audio);
  const { width, height } = renderTargets(item);
  const durationInFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);

  // turbopackIgnore : le bundle Remotion est un job serveur lourd — Next ne doit
  // pas tracer/inclure tout le projet dans cet App Route (Chrome/ffmpeg externes).
  const entryPoint = join(/* turbopackIgnore: true */ process.cwd(), "remotion", "index.ts");
  const serveUrl = await bundle({
    entryPoint,
    onProgress: () => {},
    webpackOverride: hikmaWebpackOverride,
  });

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: { scenes, graphics },
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
    inputProps: { scenes, graphics },
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