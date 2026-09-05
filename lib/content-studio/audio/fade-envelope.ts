// Hikma — Content Studio : ENVELOPPE DE FADE AUDIO (pure).
//
// Adapté de OpenReel (MIT) — audio/clip-fade-envelope.ts (fadeValueAtTime,
// getClipFadeEnvelopePoints). Fonctions pures en SECONDES, déterministes —
// utilisables par l'Inspector audio et le rendu Remotion.
//
// NOTICE : © OpenReel — Copyright (c) 2024-2026 Augustus Otu and Contributors
// (MIT License). https://github.com/Augani/openreel-video

export interface ClipFadePoint {
  readonly time: number;
  readonly value: number;
}

/** Valeur du fade (0..1) à un instant donné de la piste. */
export function fadeValueAtTime(
  time: number,
  clipDuration: number,
  fadeIn: number,
  fadeOut: number,
): number {
  const inValue = fadeIn > 0 ? Math.min(1, Math.max(0, time / fadeIn)) : 1;
  const outValue =
    fadeOut > 0 ? Math.min(1, Math.max(0, (clipDuration - time) / fadeOut)) : 1;
  return Math.min(inValue, outValue);
}

export interface FadeEnvelopeOptions {
  clipOffset: number;
  rangeDuration: number;
  clipDuration: number;
  fadeIn?: number;
  fadeOut?: number;
}

/**
 * Points de contrôle de l'enveloppe sur une fenêtre de rendu (range) :
 * renvoie [] si aucune fenêtre ou aucun fade. Les points sont triés et
 * ramenés au temps local (time − clipOffset) comme dans OpenReel.
 */
export function getClipFadeEnvelopePoints({
  clipOffset,
  rangeDuration,
  clipDuration,
  fadeIn = 0,
  fadeOut = 0,
}: FadeEnvelopeOptions): ClipFadePoint[] {
  if (rangeDuration <= 0 || (fadeIn <= 0 && fadeOut <= 0)) return [];
  const rangeStart = Math.max(0, clipOffset);
  const rangeEnd = Math.min(clipDuration, rangeStart + rangeDuration);
  const boundaries = [rangeStart, rangeEnd];
  if (fadeIn > rangeStart && fadeIn < rangeEnd) boundaries.push(fadeIn);
  const fadeOutStart = clipDuration - fadeOut;
  if (fadeOutStart > rangeStart && fadeOutStart < rangeEnd) {
    boundaries.push(fadeOutStart);
  }
  return Array.from(new Set(boundaries))
    .sort((left, right) => left - right)
    .map((time) => ({
      time: time - rangeStart,
      value: fadeValueAtTime(time, clipDuration, fadeIn, fadeOut),
    }));
}
