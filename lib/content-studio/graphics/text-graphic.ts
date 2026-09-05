// Hikma — Content Studio : CLIP GRAPHIQUE TEXTE + ÉVALUATION PURE.
//
// Code HIKMA (couche d'intégration) : relie le modèle générique GraphicClip
// (graphic-clip.ts) au moteur texte porté depuis OpenReel (text-animation.ts,
// text-types.ts). Le moteur texte est la SOURCE DE VÉRITÉ de l'animation ;
// la couche graphique adapte transform/keyframes/animation → mêmes résultats
// en Preview (Player) et en Render (renderMedia).
//
// Conventions :
//  - temps LOCAL au clip (frames) : keyframes et in/outDuration sont relatifs
//    au début du clip graphique ;
//  - keyframes d'abord : s'ils existent, ils pilotent le transform (sémantique
//    OpenReel — le preset d'animation est ignoré dans ce cas) ;
//  - sinon le preset d'animation (24 presets) s'applique avec in/hold/out.
//
// NOTICE : moteur texte sous-jacent porté d'OpenReel (MIT) — voir
// docs/openreel/NOTICE.md. Ce fichier lui-même est Hikma.

import {
  DEFAULT_GRAPHIC_TRANSFORM,
  sanitizeGraphicClipBase,
  type EvaluatedGraphicTransform,
  type GraphicClipBase,
  type GraphicTransform,
} from "@/lib/content-studio/graphics/graphic-clip";
import { TextAnimationEngine } from "@/lib/content-studio/graphics/text-animation";
import {
  DEFAULT_TEXT_STYLE,
  type TextAnimation,
  type TextAnimationParams,
  type TextAnimationPreset,
  type TextStyle,
} from "@/lib/content-studio/graphics/text-types";

/**
 * Référence d'origine d'un clip texte PROMU depuis une scène (textes hérités
 * Hikma/Quran) : la scène indexée masque son champ tant que le clip existe.
 * La suppression du clip restaure l'original — aucune migration DB.
 */
export type TextGraphicSource = {
  readonly sceneIndex: number;
  readonly field: string;
};

/** Clip graphique texte (superposé aux scènes vidéo). */
export interface TextGraphicClip extends GraphicClipBase {
  readonly kind: "text";
  readonly text: string;
  readonly style: TextStyle;
  readonly animation?: TextAnimation;
  /** Direction du texte (RTL pour l'arabe, LTR par défaut). */
  readonly direction?: "ltr" | "rtl";
  /** Origine (scène héritée) si ce clip a été promu — masque l'original. */
  readonly source?: TextGraphicSource;
}

export interface TextGraphicInput {
  readonly id?: string;
  readonly startFrame?: number;
  readonly durationInFrames?: number;
  readonly zIndex?: number;
  readonly transform?: Partial<GraphicTransform>;
  readonly keyframes?: TextGraphicClip["keyframes"];
  readonly text: string;
  readonly style?: Partial<TextStyle>;
  readonly animation?: TextAnimation;
  readonly direction?: "ltr" | "rtl";
  readonly source?: TextGraphicSource;
}

/** Hex valide (3, 4, 6 ou 8 chiffres). */
const isHex = (c: unknown): c is string => typeof c === "string" && /^#[0-9a-fA-F]{3,8}$/.test(c);

const clampFinite = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;

/**
 * Sanitise un TextStyle PARTIEL (entrées inconnues / persistées) : hex validés,
 * nombres bornés, jamais NaN/Infinity. Les champs INCONNUS sont conservés
 * (rétro-compatibilité roundtrip) ; les champs d'effets Hikma (glow, gradient,
 * blur) sont clampés ; les champs absents conservent les défauts.
 */
export function sanitizeTextStyle(
  raw: Partial<TextStyle> | Record<string, unknown> | undefined,
): TextStyle {
  const r = (raw ?? {}) as Record<string, unknown>;
  const style: Record<string, unknown> = {
    ...DEFAULT_TEXT_STYLE,
    ...(raw ?? {}),
  };
  // Champs typographiques bornés (jamais NaN/Infinity)
  style.fontFamily =
    typeof r.fontFamily === "string" && r.fontFamily.length > 0 ? r.fontFamily : DEFAULT_TEXT_STYLE.fontFamily;
  style.fontSize = clampFinite(r.fontSize, 6, 600, DEFAULT_TEXT_STYLE.fontSize);
  style.fontStyle = r.fontStyle === "italic" ? "italic" : "normal";
  style.color = isHex(r.color) ? r.color : DEFAULT_TEXT_STYLE.color;
  style.textAlign = (["left", "center", "right", "justify"] as const).includes(r.textAlign as never)
    ? (r.textAlign as TextStyle["textAlign"])
    : DEFAULT_TEXT_STYLE.textAlign;
  style.verticalAlign = (["top", "middle", "bottom"] as const).includes(r.verticalAlign as never)
    ? (r.verticalAlign as TextStyle["verticalAlign"])
    : DEFAULT_TEXT_STYLE.verticalAlign;
  style.lineHeight = clampFinite(r.lineHeight, 0.5, 4, DEFAULT_TEXT_STYLE.lineHeight);
  style.letterSpacing = clampFinite(r.letterSpacing, -50, 200, DEFAULT_TEXT_STYLE.letterSpacing);
  // Contour (stroke) — présent mais invalide ⇒ défaut / absent
  if (r.strokeColor !== undefined) style.strokeColor = isHex(r.strokeColor) ? r.strokeColor : undefined;
  if (typeof r.strokeWidth === "number") style.strokeWidth = clampFinite(r.strokeWidth, 0, 60, 0);
  // Ombre directionnelle
  if (r.shadowColor !== undefined) style.shadowColor = isHex(r.shadowColor) ? r.shadowColor : undefined;
  if (typeof r.shadowBlur === "number") style.shadowBlur = clampFinite(r.shadowBlur, 0, 120, 0);
  if (typeof r.shadowOffsetX === "number") style.shadowOffsetX = clampFinite(r.shadowOffsetX, -200, 200, 0);
  if (typeof r.shadowOffsetY === "number") style.shadowOffsetY = clampFinite(r.shadowOffsetY, -200, 200, 0);
  // Effets Hikma : halo / gradient / flou
  if (r.glowColor !== undefined) style.glowColor = isHex(r.glowColor) ? r.glowColor : undefined;
  if (typeof r.glowRadius === "number") style.glowRadius = clampFinite(r.glowRadius, 0, 200, 0);
  if (typeof r.glowOpacity === "number") style.glowOpacity = clampFinite(r.glowOpacity, 0, 1, 1);
  if (typeof r.blurRadius === "number") style.blurRadius = clampFinite(r.blurRadius, 0, 60, 0);
  if (r.gradient !== undefined) {
    const g = r.gradient as Record<string, unknown>;
    const colors = Array.isArray(g.colors) ? g.colors.filter(isHex) : [];
    if (colors.length >= 2) {
      style.gradient = {
        colors: colors.slice(0, 4),
        angle: clampFinite(g.angle, 0, 360, 90),
      };
    } else {
      style.gradient = undefined;
    }
  }
  return style as unknown as TextStyle;
}

/** Crée + sanitise un TextGraphicClip (jamais NaN/Infinity, bornes sûres). */
export function createTextGraphicClip(input: TextGraphicInput): TextGraphicClip {
  const base = sanitizeGraphicClipBase({
    id: input.id,
    kind: "text",
    startFrame: input.startFrame,
    durationInFrames: input.durationInFrames,
    zIndex: input.zIndex,
    transform: input.transform,
    keyframes: input.keyframes,
  });
  const style: TextStyle = sanitizeTextStyle(input.style);
  return {
    ...base,
    kind: "text",
    text: typeof input.text === "string" ? input.text : "",
    style,
    animation: input.animation,
    direction: input.direction === "rtl" ? "rtl" : "ltr",
    source: input.source,
  };
}

/**
 * Sanitise une référence source (promotion) persistée : index ≥ 0 et champ
 * non vide ; toute valeur invalide est DROPPÉE (le clip reste un texte libre).
 */
export function sanitizeTextSource(raw: unknown): TextGraphicSource | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const index = Math.trunc(Number(r.sceneIndex));
  if (!Number.isFinite(index) || index < 0) return undefined;
  const field = typeof r.field === "string" ? r.field.trim() : "";
  if (field.length === 0) return undefined;
  return { sceneIndex: index, field };
}

export interface EvaluatedTextGraphic {
  readonly transform: EvaluatedGraphicTransform;
  readonly style: TextStyle;
  /** Texte visible (typewriter/reveal) — vide tant que non révélé. */
  readonly visibleText: string;
}

const engine = new TextAnimationEngine();

/**
 * Construit une TextAnimation COMPLÈTE (params remplis avec les défauts du
 * moteur OpenReel) à partir d'une configuration partielle. `params` est requis
 * par le moteur (`getAnimatedState` lit `animation.params.easing`) — ce
 * builder garantit qu'il est toujours défini.
 */
export function buildTextAnimation(
  preset: TextAnimationPreset,
  config: {
    inDurationFrames?: number;
    outDurationFrames?: number;
    params?: Partial<TextAnimationParams>;
  } = {},
): TextAnimation {
  const defaults = DEFAULT_ANIMATION_PARAMS[preset] ?? { easing: "ease-out" };
  return {
    preset,
    params: { ...defaults, ...(config.params ?? {}) },
    inDuration: config.inDurationFrames ?? 15,
    outDuration: config.outDurationFrames ?? 0,
  };
}

/** Défauts de params par preset (miroir de `getDefaultParams` du moteur). */
const DEFAULT_ANIMATION_PARAMS: Record<
  string,
  Partial<TextAnimationParams>
> = {
  fade: { fadeOpacity: { start: 0, end: 1 }, easing: "ease-out" },
  "slide-left": { slideDistance: 0.2, easing: "ease-out" },
  "slide-right": { slideDistance: 0.2, easing: "ease-out" },
  "slide-up": { slideDistance: 0.2, easing: "ease-out" },
  "slide-down": { slideDistance: 0.2, easing: "ease-out" },
  scale: { scaleFrom: 0, scaleTo: 1, easing: "ease-out" },
  blur: { blurAmount: 10, easing: "ease-out" },
  bounce: { bounceHeight: 0.1, bounceCount: 3, easing: "ease-out" },
  rotate: { rotateAngle: 360, easing: "ease-out" },
  wave: { waveAmplitude: 0.02, waveFrequency: 2, easing: "linear" },
  typewriter: { easing: "linear" },
  shake: { shakeIntensity: 0.01, shakeSpeed: 20, easing: "linear" },
  pop: { popOvershoot: 1.2, easing: "ease-out" },
  glitch: { glitchIntensity: 0.02, glitchSpeed: 10, easing: "linear" },
  split: { splitDirection: "horizontal", easing: "ease-out" },
  flip: { flipAxis: "y", easing: "ease-out" },
  "word-by-word": { wordDelay: 0.2, easing: "linear" },
  rainbow: { rainbowSpeed: 1, easing: "linear" },
  rise: { slideDistance: 36, blurAmount: 8, easing: "ease-out" },
  drop: { slideDistance: 60, rotateAngle: 10, easing: "ease-out" },
  elastic: { scaleFrom: 0.15, popOvershoot: 1.25, easing: "ease-out" },
  swing: { rotateAngle: 28, slideDistance: 20, easing: "ease-out" },
  "zoom-blur": { scaleFrom: 1.65, blurAmount: 14, easing: "ease-out" },
  cascade: { slideDistance: 48, rotateAngle: 8, easing: "ease-out" },
};

/**
 * Évalue l'état visuel d'un TextGraphicClip à un frame ABSOLU de la composition.
 * Le temps local = frame - startFrame. Fonction PURE du frame →
 * PREVIEW == RENDER. Ne mute jamais le clip.
 */
export function evaluateTextGraphic(
  clip: TextGraphicClip,
  frame: number,
): EvaluatedTextGraphic {
  const localFrame = Math.max(0, frame - clip.startFrame);
  const base = clip.transform;
  const state = engine.getAnimatedState(
    {
      id: clip.id,
      trackId: "graphics",
      startTime: clip.startFrame,
      duration: Math.max(clip.durationInFrames, 1),
      text: clip.text,
      style: clip.style,
      transform: {
        position: { x: base.x, y: base.y },
        scale: { x: base.scaleX, y: base.scaleY },
        rotation: base.rotation,
        anchor: { x: 0.5, y: 0.5 },
        opacity: 1,
      },
      animation: clip.animation,
      keyframes: [...(clip.keyframes ?? [])],
    },
    localFrame,
  );

  const t = state.transform;
  return {
    transform: {
      x: t.position.x,
      y: t.position.y,
      scaleX: t.scale.x,
      scaleY: t.scale.y,
      rotation: t.rotation,
      opacity: Math.max(0, Math.min(1, state.opacity)),
    },
    style: state.style,
    visibleText: state.visibleText,
  };
}

/** Clip graphique par défaut (point de départ de l'Inspector). */
export function defaultTextGraphicClip(): TextGraphicClip {
  return createTextGraphicClip({
    id: "text-1",
    startFrame: 0,
    durationInFrames: 90,
    zIndex: 1,
    transform: { ...DEFAULT_GRAPHIC_TRANSFORM },
    text: "Texte",
    direction: "ltr",
  });
}
