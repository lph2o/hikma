// Hikma — Video Format System : TEMPLATE IMMERSION VERSET (AYAH_IMMERSION).
//
// Version 15–25 s axée immersion : le verset complet occupe le cœur du
// montage. Réutilise le moteur EXISTANT (aucun renderer parallèle) :
//
//   RevealPayloadV1 (données RÉELLES gelées)
//     → buildVideoContentFromDeepDive + toVideoSceneData  (pipeline existant)
//     → VideoScene[] (intro → mot → sens → CORAN (mode large + Golden Follower
//       + durée réelle de l'audio) → explication si présente → CTA)
//     → TextGraphicClip[] pré-promus (source {sceneIndex, field}) — le verset
//       coranique (quran.arabic) reste PROTÉGÉ : jamais promu, renderer arabe
//       + Golden Follower intacts.
//
// DÉTERMINISME : mêmes entrées ⇒ mêmes scènes/clips (aucun UUID/aléa).

import type { RevealPayloadV1 } from "@/lib/content-api/types";
import type { ContentStudioAudio } from "@/lib/content-studio/audio";
import {
  buildVideoContentFromDeepDive,
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
 * Génère le montage Immersion Verset complet : scènes + clips graphiques.
 * PURE et DÉTERMINISTE (mêmes entrées ⇒ même sortie à l'identique).
 */
export function createAyahImmersionTemplate(input: {
  payload: RevealPayloadV1;
  audio?: ContentStudioAudio;
}): FormatTemplateOutput {
  const content = buildVideoContentFromDeepDive(input.payload, input.audio);
  const data = toVideoSceneData(content, input.audio);
  const scenes = data.scenes;

  const graphics: FormatGraphicClip[] = [
    ...promoteSceneTexts({ scenes, idPrefix: "ayah-immersion" }),
  ];

  // --- Bandeau de recitation derrière le verset (scène "quran"), derrière le
  //     texte protégé (z=1 < 10) — jamais par-dessus le renderer coranique.
  const quranIndex = scenes.findIndex((s) => s.kind === "quran");
  if (quranIndex >= 0) {
    const quranScene = scenes[quranIndex]!;
    graphics.push(
      createShapeGraphicClip({
        id: "fmt-ayah-immersion-decor-verse-band",
        shape: "rectangle",
        startFrame: scenes.slice(0, quranIndex).reduce((a, s) => a + s.durationInFrames, 0),
        durationInFrames: quranScene.durationInFrames,
        zIndex: ROLE_Z_INDEX.decor,
        thickness: 0.5,
        fill: { type: "solid", color: "#0b1210" },
        stroke: { color: "#f5d47a", width: 2 },
        glow: { color: "#f5d47a", opacity: 0.25, radius: 20 },
        transform: { x: 0.5, y: 0.45, scaleX: 1, scaleY: 1, rotation: 0, opacity: 0.9 },
      }),
    );
  }

  const durationInFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);

  const firstOccurrence = content.firstOccurrence;
  const metadata: FormatMetadata = {
    wordId: input.payload.word.id,
    surah: firstOccurrence?.surahNumber,
    ayah: firstOccurrence?.ayahNumber,
    language: "fr",
    category: "COMPRENDRE",
    platform: ["Instagram Reels", "YouTube Shorts"],
    templateVersion: input.payload.templateVersion,
  };

  return {
    format: "AYAH_IMMERSION" as const,
    templateKey: "VERSE_DEEP_DIVE_V1",
    durationInFrames,
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    scenes,
    graphics,
    metadata,
  };
}
