// Hikma — MOTION HOOKS (Phase H1) : accès frame-local pour les scènes.
// Très fins : délèguent aux fonctions pures de ./engine (source unique).

import { useCurrentFrame } from "remotion";
import { getBreathingScale, getEntranceStyle, normalizeMotion, type NormalizedMotion, type MotionStyle } from "./engine";
import type { SceneMotion, VideoSceneKind } from "@/lib/content-studio/video/types";

/** Config normalisée + frame locale de la scène courante. */
export function useSceneMotion(
  motion: SceneMotion | null | undefined,
  kind: VideoSceneKind,
): { cfg: NormalizedMotion; frame: number } {
  const frame = useCurrentFrame();
  return { cfg: normalizeMotion(motion, kind), frame };
}

/** Style d'entrée (déterministe) pour la scène courante. */
export function useEntranceStyle(
  motion: SceneMotion | null | undefined,
  kind: VideoSceneKind,
): MotionStyle {
  const { cfg, frame } = useSceneMotion(motion, kind);
  return getEntranceStyle(cfg.enter, frame, {
    duration: cfg.enterDuration,
    delay: cfg.enterDelay,
    intensity: cfg.intensity,
  });
}

/** Échelle de respiration (breathing-scale) après la fin de l'entrée. */
export function useBreathingScale(
  motion: SceneMotion | null | undefined,
  kind: VideoSceneKind,
): number {
  const { cfg, frame } = useSceneMotion(motion, kind);
  return getBreathingScale(frame, {
    start: cfg.enterDelay + cfg.enterDuration + 6,
  });
}
