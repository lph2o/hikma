// Hikma — Content Studio : OPÉRATIONS TIMELINE (Module PURE, sans état).
//
// Toutes les fonctions sont PURES (entrée → sortie, aucun side-effect).
// Elles constituent le moteur logique de la Timeline Pro et sont 100%
// testables en Vitest sans aucun DOM / React.
//
// Principes :
//   - Frame-accurate : toutes les durées sont en frames entières (jamais en
//     secondes flottantes intermédiaires).
//   - Immuables : les fonctions retournent de NOUVEAUX tableaux/objets, jamais
//     de mutations sur les paramètres d'entrée.
//   - Contraintes : durationInFrames >= MIN_SCENE_DURATION à tout moment.
//   - Ripple-ready : les opérations qui changent la durée d'une scène peuvent
//     décaler toutes les scènes suivantes (mode ripple).

import type { VideoScene } from "@/lib/content-studio/video/types";

/** Durée minimale d'une scène (1 frame = sécurité absolue). */
export const MIN_SCENE_DURATION = 1;

/** Seuil de snap en frames (±6 frames = 200ms @30fps). */
export const SNAP_THRESHOLD = 6;

// ---------------------------------------------------------------------------
// UTILITAIRES PURS
// ---------------------------------------------------------------------------

/** Calcule les positions de début (en frames) de chaque scène. */
export function computeStarts(scenes: VideoScene[]): number[] {
  const starts: number[] = [];
  let acc = 0;
  for (const s of scenes) {
    starts.push(acc);
    acc += s.durationInFrames;
  }
  return starts;
}

/** Durée totale d'un montage. */
export function computeTotalDuration(scenes: VideoScene[]): number {
  return scenes.reduce((a, s) => a + s.durationInFrames, 0);
}

/**
 * Retourne les points de snap : débuts de scènes + fins de scènes + playhead.
 * Utilisé pour magnétiser le playhead et les handles de trim.
 */
export function computeSnapPoints(
  scenes: VideoScene[],
  starts: number[],
  playhead: number,
): number[] {
  const pts = new Set<number>();
  pts.add(0);
  for (let i = 0; i < scenes.length; i++) {
    pts.add(starts[i]);
    pts.add(starts[i] + scenes[i].durationInFrames);
  }
  pts.add(playhead);
  return Array.from(pts).sort((a, b) => a - b);
}

/**
 * Applique le magnétisme : si `frame` est à moins de `threshold` frames d'un
 * point de snap, retourne ce point. Sinon retourne `frame` inchangé.
 */
export function snapToPoints(
  frame: number,
  snapPoints: number[],
  threshold: number = SNAP_THRESHOLD,
): number {
  let best = frame;
  let bestDist = threshold + 1;
  for (const p of snapPoints) {
    const d = Math.abs(frame - p);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// TRIM IN (bord gauche d'un clip)
// ---------------------------------------------------------------------------

/**
 * Trim du début d'une scène (Trim In) : réduit/augmente depuis le bord gauche.
 * `deltaFrames` négatif = raccourcit, positif = rallonge.
 *
 * En mode Ripple, toutes les scènes PRÉCÉDENTES sont compensées (décalage
 * inverse) pour que la fin de la timeline reste stable.
 * Sans ripple, seule la durée de la scène ciblée change.
 */
export function trimSceneStart(
  scenes: VideoScene[],
  index: number,
  deltaFrames: number,
  ripple = false,
): VideoScene[] {
  if (index < 0 || index >= scenes.length) return scenes;
  const scene = scenes[index];
  const newDuration = Math.max(MIN_SCENE_DURATION, scene.durationInFrames - deltaFrames);
  const actualDelta = scene.durationInFrames - newDuration;

  const next = scenes.map((s, i) => {
    if (i !== index) return s;
    return { ...s, durationInFrames: newDuration };
  });

  if (ripple && actualDelta !== 0) {
    return next.map((s, i) => {
      if (i >= index) return s;
      const d = Math.max(MIN_SCENE_DURATION, s.durationInFrames + actualDelta);
      return { ...s, durationInFrames: d };
    });
  }
  return next;
}

// ---------------------------------------------------------------------------
// TRIM OUT (bord droit d'un clip)
// ---------------------------------------------------------------------------

/**
 * Trim de la fin d'une scène (Trim Out) : réduit/augmente depuis le bord droit.
 * `deltaFrames` positif = rallonge, négatif = raccourcit.
 *
 * En mode Ripple, toutes les scènes SUIVANTES sont décalées pour que le total
 * reste cohérent (comportement Ripple standard des NLE).
 */
export function trimSceneEnd(
  scenes: VideoScene[],
  index: number,
  deltaFrames: number,
  ripple = false,
): VideoScene[] {
  if (index < 0 || index >= scenes.length) return scenes;
  const scene = scenes[index];
  const newDuration = Math.max(MIN_SCENE_DURATION, scene.durationInFrames + deltaFrames);

  const next = scenes.map((s, i) => {
    if (i !== index) return s;
    return { ...s, durationInFrames: newDuration };
  });

  if (ripple && deltaFrames !== 0) {
    // En ripple : les scènes suivantes se décalent temporellement dans la timeline
    // (leurs offsets starts[] sont automatiquement recalculés depuis la nouvelle durée).
    return next;
  }
  return next;
}

// ---------------------------------------------------------------------------
// MOVE : déplacement d'une scène (réordonnancement)
// ---------------------------------------------------------------------------

/**
 * Déplace la scène `from` à la position `to` dans la liste.
 * Ne change aucune durée.
 */
export function moveScene(
  scenes: VideoScene[],
  from: number,
  to: number,
): VideoScene[] {
  if (from === to) return scenes;
  if (from < 0 || from >= scenes.length) return scenes;
  if (to < 0 || to >= scenes.length) return scenes;
  const next = [...scenes];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// ---------------------------------------------------------------------------
// SPLIT : coupe une scène en deux au frame courant
// ---------------------------------------------------------------------------

/**
 * Coupe la scène `index` au `splitFrame` (frame ABSOLU dans la timeline).
 * Produit deux scènes qui conservent ensemble la durée originale.
 * Retourne `scenes` inchangé si `splitFrame` est hors des bornes de la scène.
 */
export function splitScene(
  scenes: VideoScene[],
  index: number,
  splitFrame: number,
  starts: number[],
): VideoScene[] {
  if (index < 0 || index >= scenes.length) return scenes;
  const scene = scenes[index];
  const sceneStart = starts[index];
  const localFrame = splitFrame - sceneStart;

  // Le point de coupe doit être à l'intérieur de la scène avec au moins 1 frame de chaque côté
  if (localFrame <= 0 || localFrame >= scene.durationInFrames) return scenes;
  if (localFrame < MIN_SCENE_DURATION) return scenes;
  if (scene.durationInFrames - localFrame < MIN_SCENE_DURATION) return scenes;

  const partA: VideoScene = { ...scene, durationInFrames: localFrame };
  const partB: VideoScene = {
    ...scene,
    durationInFrames: scene.durationInFrames - localFrame,
    // La partie B commence après le split : l'audio offset s'ajuste si startFrom est utilisé
    audioStartFrom: (scene.audioStartFrom ?? 0) + localFrame,
  };

  const next = [...scenes];
  next.splice(index, 1, partA, partB);
  return next;
}

// ---------------------------------------------------------------------------
// NUDGE : déplacement fin (±1f ou ±Nf) via clavier
// ---------------------------------------------------------------------------

/**
 * Déplace la durée d'une scène de `delta` frames.
 * Positif = allonge, négatif = raccourcit.
 * Respecte MIN_SCENE_DURATION.
 */
export function nudgeSceneDuration(
  scenes: VideoScene[],
  index: number,
  delta: number,
): VideoScene[] {
  return trimSceneEnd(scenes, index, delta);
}

// ---------------------------------------------------------------------------
// RIPPLE SHIFT : décale toutes les scènes après `fromIndex` de `deltaFrames`
// ---------------------------------------------------------------------------

/**
 * Décale la durée de TOUTES les scènes à partir de `fromIndex` (inclus).
 * Utilisé pour propager un changement de durée vers l'aval de la timeline.
 * Interne à certaines opérations ripple (peut être utilisé directement).
 */
export function rippleShift(
  scenes: VideoScene[],
  fromIndex: number,
  deltaFrames: number,
): VideoScene[] {
  if (deltaFrames === 0) return scenes;
  return scenes.map((s, i) => {
    if (i < fromIndex) return s;
    const newDuration = Math.max(MIN_SCENE_DURATION, s.durationInFrames + deltaFrames);
    return { ...s, durationInFrames: newDuration };
  });
}

// ---------------------------------------------------------------------------
// AUDIO CONTROLS : modifient les propriétés audio d'une scène
// ---------------------------------------------------------------------------

/** Modifie le volume d'une scène (clamp 0..1). */
export function setSceneAudioVolume(
  scenes: VideoScene[],
  index: number,
  volume: number,
): VideoScene[] {
  if (index < 0 || index >= scenes.length) return scenes;
  return scenes.map((s, i) =>
    i !== index ? s : { ...s, audioVolume: Math.max(0, Math.min(1, volume)) },
  );
}

/** Active/désactive le mute d'une scène. */
export function setSceneAudioMuted(
  scenes: VideoScene[],
  index: number,
  muted: boolean,
): VideoScene[] {
  if (index < 0 || index >= scenes.length) return scenes;
  return scenes.map((s, i) => (i !== index ? s : { ...s, audioMuted: muted }));
}

/** Modifie le fondu entrant d'une scène (frames, >= 0). */
export function setSceneAudioFadeIn(
  scenes: VideoScene[],
  index: number,
  frames: number,
): VideoScene[] {
  if (index < 0 || index >= scenes.length) return scenes;
  return scenes.map((s, i) =>
    i !== index ? s : { ...s, audioFadeIn: Math.max(0, Math.round(frames)) },
  );
}

/** Modifie le fondu sortant d'une scène (frames, >= 0). */
export function setSceneAudioFadeOut(
  scenes: VideoScene[],
  index: number,
  frames: number,
): VideoScene[] {
  if (index < 0 || index >= scenes.length) return scenes;
  return scenes.map((s, i) =>
    i !== index ? s : { ...s, audioFadeOut: Math.max(0, Math.round(frames)) },
  );
}
