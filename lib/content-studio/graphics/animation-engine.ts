// Hikma — Content Studio : ADAPTER d'animation pour le moteur texte OpenReel.
//
// Remplace packages/core/src/video/animation-engine.ts (OpenReel, MIT) par un
// adaptateur PUR vers les moteurs Hikma portés depuis OpenReel :
//   - applyEasing     → EASING_FUNCTIONS (lib/content-studio/editor/easing.ts) ;
//   - getValueAtTime  → getKeyframeValueAtTime (lib/content-studio/editor/keyframes.ts).
//
// Même sémantique que l'original (clamp 0..1, ease-in/out/in-out nommés,
// fallback linear, évaluation par segment de keyframes) — déterministe.
//
// NOTICE : © OpenReel — Copyright (c) 2024-2026 Augustus Otu and Contributors
// (MIT License). https://github.com/Augani/openreel-video

import {
  EASING_FUNCTIONS,
  type EasingName,
} from "@/lib/content-studio/editor/easing";
import {
  getKeyframeValueAtTime,
  type HikmaKeyframe,
} from "@/lib/content-studio/editor/keyframes";

/** Applique un easing nommé (sémantique AnimationEngine.applyEasing). */
export function applyEasing(t: number, easing: EasingName): number {
  const clampedT = Math.max(0, Math.min(1, t));
  if (easing === "ease-in") return EASING_FUNCTIONS.easeInQuad(clampedT);
  if (easing === "ease-out") return EASING_FUNCTIONS.easeOutQuad(clampedT);
  if (easing === "ease-in-out") return EASING_FUNCTIONS.easeInOutQuad(clampedT);
  const fn = EASING_FUNCTIONS[easing];
  return fn ? fn(clampedT) : clampedT;
}

/** Évalue la valeur interpolée (sémantique AnimationEngine.getValueAtTime). */
export function getValueAtTime(
  keyframes: readonly HikmaKeyframe[],
  time: number,
): { value: unknown } {
  return getKeyframeValueAtTime(keyframes, time);
}
