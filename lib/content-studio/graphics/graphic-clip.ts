// Hikma — Content Studio : MODÈLE GÉNÉRIQUE DE CLIP GRAPHIQUE.
//
// Code HIKMA (couche d'intégration, aucune copie OpenReel) : modèle unifié des
// éléments graphiques (texte, forme, SVG, sticker, background, 3D) superposés
// aux scènes vidéo existantes. Utilise les moteurs portés depuis OpenReel
// (easing.ts, keyframes.ts) sans en créer de nouveaux.
//
// - Collection SÉPARÉE de VideoScene[] (rétro-compatible : les anciens
//   editor_state sans `graphics` fonctionnent à l'identique) ;
// - transform NORMALISÉ 0..1 (convention OpenReel TextTransform) ;
// - sanitization stricte (clamps, finis, jamais NaN/Infinity) ;
// - évaluation PURE du frame → transform (PREVIEW == RENDER).
//
// NOTICE : les moteurs sous-jacents (easing/keyframes) sont portés d'OpenReel
// (MIT) — voir docs/openreel/NOTICE.md. Ce fichier lui-même est Hikma.

import {
  getKeyframeValueAtTime,
  type HikmaKeyframe,
} from "@/lib/content-studio/editor/keyframes";

/** Types d'éléments graphiques supportés par le Content Studio. */
export type GraphicClipKind =
  | "text"
  | "shape"
  | "svg"
  | "sticker"
  | "background"
  | "three";

export const GRAPHIC_CLIP_KINDS: readonly GraphicClipKind[] = [
  "text",
  "shape",
  "svg",
  "sticker",
  "background",
  "three",
];

/**
 * Transform d'un élément graphique — position NORMALISÉE (0..1 du canvas),
 * rotation en degrés, opacité 0..1. Mêmes conventions que le port OpenReel.
 */
export interface GraphicTransform {
  /** Position normalisée X (0 = gauche, 1 = droite). */
  readonly x: number;
  /** Position normalisée Y (0 = haut, 1 = bas). */
  readonly y: number;
  /** Scale horizontal (1 = 100 %). */
  readonly scaleX: number;
  /** Scale vertical (1 = 100 %). */
  readonly scaleY: number;
  /** Rotation en degrés. */
  readonly rotation: number;
  /** Opacité 0..1. */
  readonly opacity: number;
}

export const DEFAULT_GRAPHIC_TRANSFORM: GraphicTransform = {
  x: 0.5,
  y: 0.5,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1,
};

/** Base commune à tout clip graphique (frames). */
export interface GraphicClipBase {
  readonly id: string;
  readonly kind: GraphicClipKind;
  /** Frame de début (relatif à la composition). */
  readonly startFrame: number;
  readonly durationInFrames: number;
  /** Ordre de superposition (plus haut = au-dessus). */
  readonly zIndex: number;
  readonly transform: GraphicTransform;
  /**
   * Keyframes optionnels sur les propriétés : "opacity", "position.x",
   * "position.y", "scale.x", "scale.y", "rotation". S'ils sont absents, le
   * transform de base s'applique tel quel.
   */
  readonly keyframes?: readonly HikmaKeyframe[];
}

const clampFinite = (value: unknown, min: number, max: number, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
};

/**
 * Convertit une couleur hex (#rgb / #rgba / #rrggbb / #rrggbbaa) en chaîne
 * rgba() avec opacité forcée. Fonction PURE et déterministe (Preview == Render).
 * Retourne `rgba(0,0,0,opacity)` si la couleur est invalide.
 */
export function hexToRgba(hex: string, opacity: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
  if (h.length < 6) return `rgba(0, 0, 0, ${opacity})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(0, 0, 0, ${opacity})`;
  const a = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Valeur de transform sanitisée à partir d'une entrée partielle inconnue. */
export function sanitizeGraphicTransform(
  raw: Partial<GraphicTransform> | undefined,
): GraphicTransform {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_GRAPHIC_TRANSFORM };
  return {
    x: clampFinite(raw.x, -5, 6, DEFAULT_GRAPHIC_TRANSFORM.x),
    y: clampFinite(raw.y, -5, 6, DEFAULT_GRAPHIC_TRANSFORM.y),
    scaleX: clampFinite(raw.scaleX, 0, 10, DEFAULT_GRAPHIC_TRANSFORM.scaleX),
    scaleY: clampFinite(raw.scaleY, 0, 10, DEFAULT_GRAPHIC_TRANSFORM.scaleY),
    rotation: clampFinite(raw.rotation, -3600, 3600, DEFAULT_GRAPHIC_TRANSFORM.rotation),
    opacity: clampFinite(raw.opacity, 0, 1, DEFAULT_GRAPHIC_TRANSFORM.opacity),
  };
}

export type GraphicClipBaseInput = Partial<Omit<GraphicClipBase, "transform">> & {
  kind: GraphicClipKind;
  transform?: Partial<GraphicTransform>;
};

/** Base sanitisée d'un clip graphique (jamais NaN/Infinity, bornes sûres). */
export function sanitizeGraphicClipBase(raw: GraphicClipBaseInput): GraphicClipBase {
  return {
    id: typeof raw.id === "string" && raw.id.length > 0 ? raw.id : `graphic-${raw.kind}`,
    kind: raw.kind,
    startFrame: Math.max(0, Math.floor(clampFinite(raw.startFrame, 0, 1_000_000, 0))),
    durationInFrames: Math.max(
      1,
      Math.floor(clampFinite(raw.durationInFrames, 1, 1_000_000, 60)),
    ),
    zIndex: Math.floor(clampFinite(raw.zIndex, -10_000, 10_000, 0)),
    transform: sanitizeGraphicTransform(raw.transform),
    keyframes: Array.isArray(raw.keyframes) ? [...raw.keyframes] : undefined,
  };
}

/** Frame de fin (exclusive) d'un clip graphique. */
export function graphicClipEndFrame(clip: GraphicClipBase): number {
  return clip.startFrame + Math.max(clip.durationInFrames, 1);
}

/** Le clip chevauche-t-il l'intervalle [startFrame, endFrame) ? */
export function graphicClipOverlaps(
  clip: GraphicClipBase,
  startFrame: number,
  endFrame: number,
): boolean {
  const clipEnd = graphicClipEndFrame(clip);
  return startFrame < clipEnd && endFrame > clip.startFrame;
}

export interface EvaluatedGraphicTransform {
  readonly x: number;
  readonly y: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotation: number;
  readonly opacity: number;
}

/**
 * Évalue le transform d'un clip graphique à un frame donné : les keyframes
 * (s'ils existent) pilotent chaque propriété, sinon le transform de base
 * s'applique. Fonction PURE du frame → même résultat en Preview et en Render.
 */
export function evaluateGraphicTransform(
  clip: GraphicClipBase,
  frame: number,
): EvaluatedGraphicTransform {
  const base = clip.transform;
  const kfs = clip.keyframes;
  if (!kfs || kfs.length === 0) {
    return {
      x: base.x,
      y: base.y,
      scaleX: base.scaleX,
      scaleY: base.scaleY,
      rotation: base.rotation,
      opacity: base.opacity,
    };
  }
  const byProperty = new Map<string, HikmaKeyframe[]>();
  for (const kf of kfs) {
    const group = byProperty.get(kf.property);
    if (group) group.push(kf);
    else byProperty.set(kf.property, [kf]);
  }
  const valueFor = (property: string, fallback: number): number => {
    const propertyKfs = byProperty.get(property);
    if (!propertyKfs) return fallback;
    const { value } = getKeyframeValueAtTime(propertyKfs, frame);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return fallback;
  };

  return {
    x: valueFor("position.x", base.x),
    y: valueFor("position.y", base.y),
    scaleX: valueFor("scale.x", base.scaleX),
    scaleY: valueFor("scale.y", base.scaleY),
    rotation: valueFor("rotation", base.rotation),
    opacity: clampFinite(valueFor("opacity", base.opacity), 0, 1, base.opacity),
  };
}
