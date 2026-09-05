// Hikma — Content Studio : MOTEUR DE KEYFRAMES (évaluation déterministe).
//
// Adapté de OpenReel (MIT) :
//   - packages/core/src/video/keyframe-engine.ts (getValueAtTime, interpolateValue) ;
//   - packages/core/src/animation/evaluate-keyframes.ts (evaluateKeyframesAt) ;
//   - packages/core/src/types/timeline.ts (type Keyframe).
//
// Porté en fonctions PURES sur le modèle Hikma : le temps est en FRAMES
// (durationInFrames / starts[]), aucune dépendance, aucun état. La même
// évaluation est utilisable côté preview (Player) et côté rendu (Remotion),
// garantissant PREVIEW == RENDER.
//
// NOTICE : © OpenReel — Copyright (c) 2024-2026 Augustus Otu and Contributors
// (MIT License). https://github.com/Augani/openreel-video

import {
  cubicBezier,
  EASING_FUNCTIONS,
  type EasingName,
} from "@/lib/content-studio/editor/easing";

/** Easing d'un keyframe (EasingName inclut "bezier" pour les poignées). */
export type KeyframeEasing = EasingName;

/** Poignées de Bézier du keyframe (éditeur de courbes, segment sortant). */
export interface KeyframeBezierHandles {
  in: { x: number; y: number };
  out: { x: number; y: number };
}

/** Keyframe Hikma — temps en frames, valeur typée numéro/objet/autre. */
export interface HikmaKeyframe {
  readonly id: string;
  /** Frame local (relatif à la scène/clip). */
  readonly time: number;
  readonly property: string;
  readonly value: unknown;
  readonly easing: KeyframeEasing;
  readonly bezierHandles?: KeyframeBezierHandles;
}

export interface KeyframeEvaluation {
  /** Valeur interpolée (numéro, objet récursif, ou hold). */
  value: unknown;
  /** Progression linéaire entre les deux keyframes (0..1). */
  progress: number;
  /** Progression après application de l'easing (0..1). */
  easedProgress: number;
}

/** Tri par temps (copie — ne mute jamais l'entrée). */
export function sortKeyframes(keyframes: readonly HikmaKeyframe[]): HikmaKeyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time);
}

/** Ajoute un keyframe (déterministe, retourne un nouveau tableau trié). */
export function addKeyframe(
  keyframes: readonly HikmaKeyframe[],
  keyframe: HikmaKeyframe,
): HikmaKeyframe[] {
  return sortKeyframes([...keyframes, keyframe]);
}

/** Supprime un keyframe par id (pur). */
export function removeKeyframe(
  keyframes: readonly HikmaKeyframe[],
  keyframeId: string,
): HikmaKeyframe[] {
  return keyframes.filter((kf) => kf.id !== keyframeId);
}

/** Met à jour un keyframe par id (pur, re-trie si le temps change). */
export function updateKeyframe(
  keyframes: readonly HikmaKeyframe[],
  keyframeId: string,
  updates: Partial<Omit<HikmaKeyframe, "id">>,
): HikmaKeyframe[] {
  const result = keyframes.map((kf) =>
    kf.id === keyframeId ? { ...kf, ...updates } : kf,
  );
  if (updates.time !== undefined) {
    return sortKeyframes(result);
  }
  return result;
}

/**
 * Easing appliqué à la progression linéaire, fidèle au keyframe-engine
 * OpenReel (applyEasing) : poignées Bézier si `bezier`, sinon easing nommé.
 */
function applyKeyframeEasing(
  t: number,
  easing: KeyframeEasing,
  bezierHandles?: KeyframeBezierHandles,
): number {
  const clampedT = Math.max(0, Math.min(1, t));
  if (bezierHandles && easing === "bezier") {
    return cubicBezier(
      bezierHandles.in.x,
      bezierHandles.in.y,
      bezierHandles.out.x,
      bezierHandles.out.y,
    )(clampedT);
  }
  switch (easing) {
    case "linear":
      return clampedT;
    case "ease-in":
      return clampedT * clampedT;
    case "ease-out":
      return clampedT * (2 - clampedT);
    case "ease-in-out":
      return clampedT < 0.5 ? 2 * clampedT * clampedT : -1 + (4 - 2 * clampedT) * clampedT;
    case "bezier":
      // Bézier par défaut si aucune poignée
      return cubicBezier(0.25, 0.1, 0.25, 1)(clampedT);
    default: {
      const fn = EASING_FUNCTIONS[easing];
      return fn ? fn(clampedT) : clampedT;
    }
  }
}

/**
 * Interpolation de valeur (port d'interpolateValue) :
 *  - nombres → interpolation linéaire ;
 *  - objets → interpolation récursive par clé ;
 *  - autre (string, boolean…) → hold (A si progress < 0.5, sinon B).
 */
export function interpolateKeyframeValue(
  valueA: unknown,
  valueB: unknown,
  progress: number,
): unknown {
  if (typeof valueA === "number" && typeof valueB === "number") {
    return valueA + (valueB - valueA) * progress;
  }
  if (
    typeof valueA === "object" &&
    typeof valueB === "object" &&
    valueA !== null &&
    valueB !== null
  ) {
    const result: Record<string, unknown> = {};
    const objA = valueA as Record<string, unknown>;
    const objB = valueB as Record<string, unknown>;
    for (const key of Object.keys(objA)) {
      result[key] =
        key in objB
          ? interpolateKeyframeValue(objA[key], objB[key], progress)
          : objA[key];
    }
    return result;
  }
  return progress < 0.5 ? valueA : valueB;
}

/**
 * Évalue la valeur interpolée à un instant donné (frames) pour une liste de
 * keyframes d'UNE propriété. Clamp avant le premier / après le dernier.
 * Port pur de KeyframeEngine.getValueAtTime.
 */
export function getKeyframeValueAtTime(
  keyframes: readonly HikmaKeyframe[],
  time: number,
): KeyframeEvaluation {
  if (keyframes.length === 0) {
    return { value: undefined, progress: 0, easedProgress: 0 };
  }
  const sorted = sortKeyframes(keyframes);
  if (time <= sorted[0]!.time) {
    return { value: sorted[0]!.value, progress: 0, easedProgress: 0 };
  }
  const last = sorted[sorted.length - 1]!;
  if (time >= last.time) {
    return { value: last.value, progress: 1, easedProgress: 1 };
  }

  let keyframeA: HikmaKeyframe | null = null;
  let keyframeB: HikmaKeyframe | null = null;
  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i]!;
    const right = sorted[i + 1]!;
    if (time >= left.time && time <= right.time) {
      keyframeA = left;
      keyframeB = right;
      break;
    }
  }
  if (!keyframeA || !keyframeB) {
    return { value: last.value, progress: 1, easedProgress: 1 };
  }

  const duration = keyframeB.time - keyframeA.time;
  const elapsed = time - keyframeA.time;
  const linearProgress = duration > 0 ? elapsed / duration : 0;
  const easedProgress = applyKeyframeEasing(
    linearProgress,
    keyframeA.easing,
    keyframeA.bezierHandles,
  );
  const value = interpolateKeyframeValue(
    keyframeA.value,
    keyframeB.value,
    easedProgress,
  );
  return { value, progress: linearProgress, easedProgress };
}

/**
 * Évalue TOUTES les propriétés à un instant donné (frames).
 * Retourne une Map propriété → valeur (port de evaluateKeyframesAt).
 */
export function evaluateKeyframesAt(
  keyframes: readonly HikmaKeyframe[] | undefined,
  time: number,
): Map<string, unknown> {
  const values = new Map<string, unknown>();
  if (!keyframes || keyframes.length === 0) {
    return values;
  }
  const byProperty = new Map<string, HikmaKeyframe[]>();
  for (const keyframe of keyframes) {
    const group = byProperty.get(keyframe.property);
    if (group) {
      group.push(keyframe);
    } else {
      byProperty.set(keyframe.property, [keyframe]);
    }
  }
  for (const [property, propertyKeyframes] of byProperty) {
    const { value } = getKeyframeValueAtTime(propertyKeyframes, time);
    if (typeof value === "number" && Number.isFinite(value)) {
      values.set(property, value);
    } else if (value !== undefined) {
      values.set(property, value);
    }
  }
  return values;
}
