// Hikma — Video Format System : TEMPLATE SPEED VOCAB 60s (VOCAB_SPEED_RUN_V1).
//
// LOT 2 — série rapide de 3–5 mots coraniques RÉELS (30–60 s). Réutilise le
// moteur EXISTANT (aucun renderer parallèle) :
//
//   SpeedVocabPayloadV1 (données RÉELLES gelées, validator REJECT OVER GUESS)
//     → buildVideoContentFromSpeedVocab + toVideoSceneData (pipeline existant)
//     → VideoScene[] (intro → [mot → sens] × N → CTA)
//     → TextGraphicClip[] pré-promus (source {sceneIndex, field}) via le
//       helper PARTAGÉ promoteSceneTexts — éditables dans le Text Editor
//       commun (Canvas/Inspector/Timeline), aucune différence UX avec un
//       texte ajouté manuellement.
//     → ShapeGraphicClip décoratifs : bandeau d'occurrences par mot (z=1).
//
// PLANIFICATION : chaque clip démarre au début de SA scène (starts accumulés,
// jamais tout à frame 0) ; les mots sont SÉQUENTIELS dans la Timeline.
// DÉTERMINISME : mêmes entrées ⇒ même sortie (aucun UUID/aléa/Date.now).

import type { SpeedVocabPayloadV1 } from "@/lib/content-api/speed-vocab-types";
import type { ContentStudioAudio } from "@/lib/content-studio/audio";
import {
  buildVideoContentFromSpeedVocab,
  toVideoSceneData,
  VIDEO_FPS,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
} from "@/lib/content-studio/video/pipeline";
import { computeStarts } from "@/lib/content-studio/editor/timeline-ops";
import { createShapeGraphicClip } from "@/lib/content-studio/graphics/shape-graphic";
import { ROLE_Z_INDEX, promoteSceneTexts } from "@/lib/content-studio/formats/template-shared";
import type {
  FormatGraphicClip,
  FormatMetadata,
  FormatTemplateOutput,
} from "@/lib/content-studio/formats/format-types";

/**
 * Génère le montage Speed Vocab complet : scènes + clips graphiques éditables.
 * PURE et DÉTERMINISTE (mêmes entrées ⇒ même sortie à l'identique).
 */
export function createSpeedVocabTemplate(input: {
  payload: SpeedVocabPayloadV1;
  audio?: ContentStudioAudio;
}): FormatTemplateOutput {
  const content = buildVideoContentFromSpeedVocab(input.payload, input.audio);
  const data = toVideoSceneData(content, input.audio);
  const scenes = data.scenes;
  const starts = computeStarts(scenes);

  // --- Textes pré-promus (hook, mots arabes, translittérations, sens, CTA) —
  //     le helper partagé gère planification + z-index + animations par rôle.
  const graphics: FormatGraphicClip[] = [
    ...promoteSceneTexts({ scenes, idPrefix: "speed-vocab" }),
  ];

  // --- Bandeaux d'occurrences : un rectangle décoratif par scène "meaning"
  //     (derrière le texte, z=1) — ancre visuelle « X occurrences ».
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]!;
    if (scene.kind !== "meaning") continue;
    graphics.push(
      createShapeGraphicClip({
        id: `fmt-speed-vocab-decor-occ-${i}`,
        shape: "rectangle",
        startFrame: starts[i]!,
        durationInFrames: scene.durationInFrames,
        zIndex: ROLE_Z_INDEX.decor,
        thickness: 0.5,
        fill: { type: "solid", color: "#0b1210" },
        stroke: { color: "#f5d47a", width: 2 },
        glow: { color: "#f5d47a", opacity: 0.22, radius: 18 },
        transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0, opacity: 0.85 },
      }),
    );
  }

  const durationInFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);

  const metadata: FormatMetadata = {
    wordId: input.payload.sources.wordId,
    language: "fr",
    category: "RÉSEAUX SOCIAUX",
    platform: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    templateVersion: input.payload.templateVersion,
  };

  return {
    format: "SPEED_VOCAB" as const,
    templateKey: "VOCAB_SPEED_RUN_V1",
    durationInFrames,
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    scenes,
    graphics,
    metadata,
  };
}
