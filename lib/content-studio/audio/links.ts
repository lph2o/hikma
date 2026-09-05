// Hikma — Content Studio : LIENS AUDIO (mot / verset) et GARANTIE « une seule
// piste continue » pour la récitation.
//
// Adapté de OpenReel (MIT) — audio/clip-audio-resolution.ts (findClipTrack,
// getLinkedAudioClips) — simplifié pour le modèle Hikma où chaque scène porte
// au plus UNE piste audio (word → prononciation Muallim, quran → récitation
// Al-Afasy CDN).
//
// Garantie structurelle (bug « récitation répétée ») : la scène Coran doit
// exposer EXACTEMENT UNE source audio continue — jamais d'audio par mot.
//
// NOTICE : © OpenReel — Copyright (c) 2024-2026 Augustus Otu and Contributors
// (MIT License). https://github.com/Augani/openreel-video

import type { VideoScene } from "@/lib/content-studio/video/types";

export const LINK_TOLERANCE_FRAMES = 1;

/** Trouve la scène du kind donné qui porte une piste audio (comme findClipTrack). */
export function findSceneWithAudio(
  scenes: readonly VideoScene[],
  kind: VideoScene["kind"],
): { scene: VideoScene; index: number } | null {
  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    if (scene && scene.kind === kind && scene.audioUrl) {
      return { scene, index };
    }
  }
  return null;
}

export interface AudioLink {
  /** Scène vidéo qui porte la piste audio. */
  sceneIndex: number;
  kind: VideoScene["kind"];
  audioUrl: string;
  /** Durée réelle de la source audio (s) si connue. */
  audioDuration: number | null;
  startFrame: number;
  durationInFrames: number;
}

/**
 * Index des scènes audio liées (mot + verset) — équivalent de getLinkedAudioClips.
 * Une scène « liée » partage la même base de temps (même startFrame à tolerance
 * près) : le mot et son verset d'origine.
 */
export function getLinkedAudioLinks(
  scenes: readonly VideoScene[],
  starts: readonly number[],
): AudioLink[] {
  const links: AudioLink[] = [];
  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    if (!scene?.audioUrl) continue;
    links.push({
      sceneIndex: index,
      kind: scene.kind,
      audioUrl: scene.audioUrl,
      audioDuration: scene.audioDuration ?? null,
      startFrame: starts[index] ?? 0,
      durationInFrames: Math.max(scene.durationInFrames, 1),
    });
  }
  return links;
}

/**
 * GARANTIE RÉCITATION CONTINUE : renvoie la scène Coran et SA SEULE source
 * audio de verset. Retourne null si la scène Coran est absente ou ne porte
 * aucune piste. Si plusieurs scènes Coran portaient de l'audio, seule la
 * première est retenue (source unique) — jamais d'audio par mot.
 */
export function resolveContinuousVerseAudio(
  scenes: readonly VideoScene[],
  starts: readonly number[],
): AudioLink | null {
  const quran = findSceneWithAudio(scenes, "quran");
  if (!quran) return null;
  const { scene, index } = quran;
  return {
    sceneIndex: index,
    kind: "quran",
    audioUrl: scene.audioUrl!,
    audioDuration: scene.audioDuration ?? null,
    startFrame: starts[index] ?? 0,
    durationInFrames: Math.max(scene.durationInFrames, 1),
  };
}

/** Vrai si la scène Coran porte une source de verset (CDN, continue). */
export function isVerseRecitationSource(url: string): boolean {
  return url.includes("cdn.islamic.network") && !url.includes("word-audio");
}

/**
 * Vérifie qu'une scène Coran ne contient AUCUN champ de type « audio par mot » :
 * la seule source possible est verseConfig.audioUrl (piste continue).
 */
export function hasPerWordAudio(scene: VideoScene): boolean {
  const serialized = JSON.stringify(scene);
  return (
    serialized.includes('"audio":') ||
    (scene.verseConfig?.follower?.words?.some(
      (w) => (w as { audioUrl?: unknown }).audioUrl !== undefined,
    ) ??
      false)
  );
}
