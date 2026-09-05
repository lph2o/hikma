// Hikma — Video Format System : TEMPLATE WORD REVEAL (découverte & sens).
//
// Génère UNIQUEMENT des objets standards du Content Studio — aucun renderer
// parallèle, aucun setTimeout/Date.now/random :
//
//   RevealPayloadV1 (données RÉELLES gelées)
//     → buildVideoContentFromReveal + toVideoSceneData   (pipeline existant)
//     → VideoScene[]  (intro → mot → sens → coran → explication → CTA)
//     → TextGraphicClip[]  pré-promus (source {sceneIndex, field}) : les
//       textes clés sont éditables dès la génération (Inspector/Timeline/
//       Canvas) — l'original de scène est masqué par le mécanisme `source`.
//     → ShapeGraphicClip décoratif (médaillon or derrière le mot).
//
// PLANIFICATION (jamais tout à frame 0) : chaque clip démarre au début de sa
// scène (starts accumulés). Z-INDEX composés (jamais max+1 aveugle) :
//   décor 1 · intro 9 · mot arabe 10 · translittération/sens/ref 11 · CTA 12.
//
// DÉTERMINISME : mêmes entrées ⇒ mêmes ids/scènes/clips (aucun UUID).

import type { RevealPayloadV1 } from "@/lib/content-api/types";
import type { ContentStudioAudio } from "@/lib/content-studio/audio";
import {
  buildVideoContentFromReveal,
  toVideoSceneData,
  VIDEO_FPS,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
} from "@/lib/content-studio/video/pipeline";
import { createShapeGraphicClip } from "@/lib/content-studio/graphics/shape-graphic";
import { ROLE_Z_INDEX, promoteSceneTexts } from "@/lib/content-studio/formats/template-shared";
import type {
  FormatGraphicClip,
  FormatMetadata,
  FormatTemplateOutput,
} from "@/lib/content-studio/formats/format-types";

/**
 * Génère le montage Word Reveal complet : scènes + clips graphiques éditables.
 * PURE et DÉTERMINISTE (mêmes entrées ⇒ même sortie à l'identique).
 */
export function createWordRevealTemplate(input: {
  payload: RevealPayloadV1;
  audio?: ContentStudioAudio;
}): FormatTemplateOutput {
  const content = buildVideoContentFromReveal(input.payload, input.audio);
  const data = toVideoSceneData(content, input.audio);
  const scenes = data.scenes;

  // --- Textes pré-promus : chaque champ énoncé par la scène devient un
  //     TextGraphicClip éditable (même style/position que l'original, qui est
  //     alors masqué par le mécanisme `source`). Le verset (quran.arabic) est
  //     PROTÉGÉ : renderer arabe + Golden Follower + audio intacts.
  const graphics: FormatGraphicClip[] = [
    ...promoteSceneTexts({ scenes, idPrefix: "word-reveal" }),
  ];

  // --- Médaillon or décoratif derrière le mot arabe (scène "word").
  const wordIndex = scenes.findIndex((s) => s.kind === "word");
  if (wordIndex >= 0) {
    const wordScene = scenes[wordIndex]!;
    graphics.push(
      createShapeGraphicClip({
        id: "fmt-word-reveal-decor-medallion",
        shape: "circle",
        startFrame: scenes.slice(0, wordIndex).reduce((a, s) => a + s.durationInFrames, 0),
        durationInFrames: wordScene.durationInFrames,
        zIndex: ROLE_Z_INDEX.decor,
        thickness: 0.62,
        fill: { type: "solid", color: "#0b1210" },
        stroke: { color: "#f5d47a", width: 2 },
        glow: { color: "#f5d47a", opacity: 0.35, radius: 24 },
        transform: { x: 0.5, y: 0.42, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      }),
    );
  }

  const durationInFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);

  const metadata: FormatMetadata = {
    wordId: input.payload.word.id,
    surah: input.payload.firstOccurrence.surahNumber,
    ayah: input.payload.firstOccurrence.ayahNumber,
    language: "fr",
    category: "APPRENDRE",
    platform: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    templateVersion: input.payload.templateVersion,
  };

  return {
    format: "WORD_REVEAL" as const,
    templateKey: "WORD_REVEAL_V1",
    durationInFrames,
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    scenes,
    graphics,
    metadata,
  };
}
