// Hikma — Content Studio : SÉLECTION MULTIPLE & MARQUEE (timeline).
//
// Adapté de OpenReel (MIT) — utils/timeline-item-actions.ts (getTimelineItemRanges,
// getSplittableTimelineItemIds, getTimelineTrackSelection, getTimelineMarqueeSelection)
// et timeline/clip-manager.ts (clipsOverlap, getGapBetweenClips).
//
// Porté sur le modèle Hikma : scènes en FRAMES (durationInFrames, starts[]).
// Chaque scène vit sur la PISTE VIDÉO ; une scène avec audioUrl expose en plus
// une PISTE AUDIO logique (word → « audio-word », quran → « audio-verse ») —
// comme un clip média OpenReel avec sa piste audio liée. La sélection marquee
// déduplique par index (une scène peut être trouvée par sa piste vidéo OU son
// lane audio).
//
// Fonctions PURES et déterministes : aucun I/O, testable unitairement.
//
// NOTICE : © OpenReel — Copyright (c) 2024-2026 Augustus Otu and Contributors
// (MIT License). https://github.com/Augani/openreel-video

import type { VideoScene } from "@/lib/content-studio/video/types";

/** Pistes logiques Hikma : vidéo (toutes les scènes) + audio mot / audio verset. */
export type SceneTrackKind = "video" | "audio-word" | "audio-verse";

/** Ordre d'affichage des pistes dans la timeline (haut → bas). */
export const TRACK_ORDER: SceneTrackKind[] = ["video", "audio-word", "audio-verse"];

export interface SceneRange {
  index: number;
  kind: VideoScene["kind"];
  startFrame: number;
  durationInFrames: number;
  track: SceneTrackKind;
}

/** Piste audio logique d'une scène (null si la scène ne porte pas d'audio). */
export function audioTrackOfScene(scene: VideoScene): Exclude<SceneTrackKind, "video"> | null {
  if (!scene.audioUrl) return null;
  if (scene.kind === "quran") return "audio-verse";
  if (scene.kind === "word") return "audio-word";
  return null;
}

/** Plages de la PISTE VIDÉO : une entrée par scène. */
export function getSceneRanges(
  scenes: readonly VideoScene[],
  starts: readonly number[],
): SceneRange[] {
  return scenes.map((scene, index) => ({
    index,
    kind: scene.kind,
    startFrame: starts[index] ?? 0,
    durationInFrames: Math.max(scene.durationInFrames, 1),
    track: "video" as const,
  }));
}

/** Plages des PISTES AUDIO : une entrée par scène portant de l'audio. */
export function getAudioSceneRanges(
  scenes: readonly VideoScene[],
  starts: readonly number[],
): SceneRange[] {
  const ranges: SceneRange[] = [];
  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    if (!scene) continue;
    const track = audioTrackOfScene(scene);
    if (!track) continue;
    ranges.push({
      index,
      kind: scene.kind,
      startFrame: starts[index] ?? 0,
      durationInFrames: Math.max(scene.durationInFrames, 1),
      track,
    });
  }
  return ranges;
}

/** Frame de fin (exclusive) d'une scène. */
export function sceneEndFrame(scene: VideoScene, startFrame: number): number {
  return startFrame + Math.max(scene.durationInFrames, 1);
}

/** Deux scènes (piste vidéo) se chevauchent-elles ? */
export function scenesOverlap(
  a: VideoScene,
  b: VideoScene,
  aStart: number,
  bStart: number,
): boolean {
  const aEnd = sceneEndFrame(a, aStart);
  const bEnd = sceneEndFrame(b, bStart);
  return aStart < bEnd && aEnd > bStart;
}

/** Écart (en frames) entre deux scènes de la piste vidéo (négatif si chevauchement). */
export function getGapBetweenScenes(
  a: VideoScene,
  b: VideoScene,
  aStart: number,
  bStart: number,
): number {
  const aEnd = sceneEndFrame(a, aStart);
  const bEnd = sceneEndFrame(b, bStart);
  return aStart < bStart ? bStart - aEnd : aStart - bEnd;
}

/**
 * Index des scènes sélectionnées que le frame courant peut couper
 * (start < frame < end) — équivalent de getSplittableTimelineItemIds.
 */
export function getSplittableSceneIndexes(
  scenes: readonly VideoScene[],
  starts: readonly number[],
  frame: number,
  selectedIndexes: readonly number[],
): number[] {
  const selected = new Set(selectedIndexes);
  return getSceneRanges(scenes, starts)
    .filter(
      (item) =>
        selected.has(item.index) &&
        frame > item.startFrame &&
        frame < sceneEndFrame(scenes[item.index]!, item.startFrame),
    )
    .map((item) => item.index);
}

/** Index de toutes les scènes d'une piste logique donnée. */
export function getTrackSceneSelection(
  scenes: readonly VideoScene[],
  starts: readonly number[],
  track: SceneTrackKind,
): number[] {
  const ranges = track === "video" ? getSceneRanges(scenes, starts) : getAudioSceneRanges(scenes, starts);
  return ranges
    .filter((item) => item.track === track)
    .sort((left, right) =>
      left.startFrame === right.startFrame
        ? left.index - right.index
        : left.startFrame - right.startFrame,
    )
    .map((item) => item.index);
}

export interface MarqueeBounds {
  minFrame: number;
  maxFrame: number;
  minY: number;
  maxY: number;
}

/**
 * Sélection marquee : index des scènes dont la piste (vidéo OU lane audio)
 * chevauche le rectangle (temps × hauteurs). Dédupliqué par index.
 */
export function getMarqueeSceneIndexes(
  scenes: readonly VideoScene[],
  starts: readonly number[],
  bounds: MarqueeBounds,
  getTrackHeight: (track: SceneTrackKind) => number,
): number[] {
  const byTrack = new Map<SceneTrackKind, SceneRange[]>();
  for (const item of [...getSceneRanges(scenes, starts), ...getAudioSceneRanges(scenes, starts)]) {
    const items = byTrack.get(item.track) ?? [];
    items.push(item);
    byTrack.set(item.track, items);
  }

  const selected = new Set<number>();
  let currentY = 0;
  for (const track of TRACK_ORDER) {
    const height = Math.max(getTrackHeight(track), 0);
    const trackOverlaps = bounds.minY < currentY + height && bounds.maxY > currentY;
    if (trackOverlaps) {
      for (const item of byTrack.get(track) ?? []) {
        const itemEnd = item.startFrame + item.durationInFrames;
        if (bounds.minFrame < itemEnd && bounds.maxFrame > item.startFrame) {
          selected.add(item.index);
        }
      }
    }
    currentY += height;
  }
  // Tri par ordre d'apparition dans le montage (index croissant)
  return Array.from(selected).sort((a, b) => a - b);
}
