// Hikma — MOTION ENGINE (Phase H1).
//
// Fonctions PURES et DÉTERMINISTES : mêmes entrées ⇒ mêmes styles, aucune I/O,
// aucun aléa. Consommées par la PREVIEW (Player) ET le RENDER (renderMedia) —
// source unique, aucune divergence possible.
//
// Direction artistique : mouvement CALME et premium. Les courbes d'easing sont
// adoucies (easeOutCubic/Quint — aucun rebond). Pas de spring ici : un spring
// mal réglé produit du bounce ; l'intensité par défaut est LOW et le mot arabe
// reçoit le mouvement le plus fort (word-focus), les éléments secondaires des
// entrées plus discrètes.

import type {
  MotionIntensity,
  MotionPreset,
  SceneMotion,
  VideoSceneKind,
  WordHeroSettings,
} from "@/lib/content-studio/video/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Style déterminé pour une frame donnée (appliqué tel quel par les scènes). */
export type MotionStyle = {
  opacity: number;
  transform?: string;
  filter?: string;
};

/** Configuration NORMALISÉE (défauts du kind comblés, bornes clampées). */
export type NormalizedMotion = {
  enter: MotionPreset;
  enterDuration: number;
  enterDelay: number;
  emphasis: MotionPreset | null;
  emphasisDelay: number;
  intensity: MotionIntensity;
};

export type SweepTiming = {
  /** Frame locale (dans la scène) du début du balayage. */
  start: number;
  /** Durée du balayage en frames. */
  duration: number;
};

// ---------------------------------------------------------------------------
// Défauts par kind — le mot est le héros, le reste reste discret.
// ---------------------------------------------------------------------------

const DEFAULT_ENTER: Record<VideoSceneKind, MotionPreset> = {
  intro: "fade-up",
  word: "word-focus",
  meaning: "fade-up",
  quran: "fade",
  explanation: "fade-up",
  cta: "scale",
};

const DEFAULT_ENTER_DURATION: Record<VideoSceneKind, number> = {
  intro: 20,
  word: 22,
  meaning: 20,
  quran: 26,
  explanation: 22,
  cta: 24,
};

/** Emphasis par défaut : seul le mot porte un effet de mise en valeur (sweep). */
const DEFAULT_EMPHASIS: Record<VideoSceneKind, MotionPreset | null> = {
  intro: null,
  word: "light-sweep",
  meaning: null,
  quran: null,
  explanation: null,
  cta: null,
};

const DEFAULT_EMPHASIS_DELAY: Record<VideoSceneKind, number> = {
  intro: 0,
  word: 26,
  meaning: 0,
  quran: 0,
  explanation: 0,
  cta: 0,
};

// ---------------------------------------------------------------------------
// Utilitaires (déterministes)
// ---------------------------------------------------------------------------

export function clampInt(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), min), max);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// WORD HERO (Phase H2) — matériau argenté + contrôles visuels du mot arabe.
// Défauts : tout ON, matériau silver, intensités raisonnables (premium, subtil).
// ---------------------------------------------------------------------------

export type NormalizedWordHero = {
  material: "silver";
  mirror: { enabled: boolean; opacity: number; blur: number };
  lightSweep: { enabled: boolean; intensity: number; duration: number };
  goldenGlint: { enabled: boolean; intensity: number };
  glow: { enabled: boolean; intensity: number };
  breathing: { enabled: boolean; intensity: number };
  depth: { enabled: boolean; intensity: number };
};

export const WORD_HERO_DEFAULTS: NormalizedWordHero = {
  material: "silver",
  mirror: { enabled: true, opacity: 0.5, blur: 0.8 },
  lightSweep: { enabled: true, intensity: 1, duration: 24 },
  goldenGlint: { enabled: true, intensity: 1 },
  glow: { enabled: true, intensity: 1 },
  breathing: { enabled: true, intensity: 1 },
  depth: { enabled: true, intensity: 1 },
};

/**
 * Configuration Word Hero NORMALISÉE d'une scène word : valeurs explicites OU
 * défauts (tout ON, silver). Bornes identiques au sanitizer serveur. Utilisée
 * par le rendu (et donc la preview) — une seule source.
 */
export function normalizeWordHero(
  hero: WordHeroSettings | null | undefined,
): NormalizedWordHero {
  const h = hero ?? {};
  const d = WORD_HERO_DEFAULTS;
  const m = h.mirror ?? {};
  const ls = h.lightSweep ?? {};
  const gg = h.goldenGlint ?? {};
  const gl = h.glow ?? {};
  const br = h.breathing ?? {};
  const de = h.depth ?? {};
  return {
    material: h.material === "silver" ? "silver" : d.material,
    mirror: {
      enabled: typeof m.enabled === "boolean" ? m.enabled : d.mirror.enabled,
      opacity: clamp(typeof m.opacity === "number" ? m.opacity : d.mirror.opacity, 0, 1),
      blur: clamp(typeof m.blur === "number" ? m.blur : d.mirror.blur, 0, 6),
    },
    lightSweep: {
      enabled: typeof ls.enabled === "boolean" ? ls.enabled : d.lightSweep.enabled,
      intensity: clamp(typeof ls.intensity === "number" ? ls.intensity : d.lightSweep.intensity, 0, 1),
      duration: clampInt(typeof ls.duration === "number" ? ls.duration : d.lightSweep.duration, 10, 60),
    },
    goldenGlint: {
      enabled: typeof gg.enabled === "boolean" ? gg.enabled : d.goldenGlint.enabled,
      intensity: clamp(typeof gg.intensity === "number" ? gg.intensity : d.goldenGlint.intensity, 0, 1),
    },
    glow: {
      enabled: typeof gl.enabled === "boolean" ? gl.enabled : d.glow.enabled,
      intensity: clamp(typeof gl.intensity === "number" ? gl.intensity : d.glow.intensity, 0, 1),
    },
    breathing: {
      enabled: typeof br.enabled === "boolean" ? br.enabled : d.breathing.enabled,
      intensity: clamp(typeof br.intensity === "number" ? br.intensity : d.breathing.intensity, 0, 1),
    },
    depth: {
      enabled: typeof de.enabled === "boolean" ? de.enabled : d.depth.enabled,
      intensity: clamp(typeof de.intensity === "number" ? de.intensity : d.depth.intensity, 0, 1),
    },
  };
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export function clamp01(t: number): number {
  return Math.min(Math.max(t, 0), 1);
}

/** Config normalisée d'une scène : motion explicite OU défauts du kind. */
export function normalizeMotion(
  motion: SceneMotion | null | undefined,
  kind: VideoSceneKind,
): NormalizedMotion {
  const m = motion ?? {};
  const emphasis =
    typeof m.emphasis === "string" && isKnownPreset(m.emphasis)
      ? m.emphasis
      : DEFAULT_EMPHASIS[kind];
  return {
    enter:
      typeof m.enter === "string" && isKnownPreset(m.enter)
        ? m.enter
        : DEFAULT_ENTER[kind],
    enterDuration: clampInt(m.enterDuration ?? DEFAULT_ENTER_DURATION[kind], 5, 120),
    enterDelay: clampInt(m.enterDelay ?? 0, 0, 300),
    emphasis,
    emphasisDelay: clampInt(
      m.emphasisDelay ?? (emphasis ? DEFAULT_EMPHASIS_DELAY[kind] : 0),
      0,
      600,
    ),
    intensity: m.intensity === "medium" ? "medium" : "low",
  };
}

function isKnownPreset(value: string): boolean {
  return (
    value === "fade" ||
    value === "fade-up" ||
    value === "fade-down" ||
    value === "scale" ||
    value === "blur-in" ||
    value === "soft-float" ||
    value === "word-focus" ||
    value === "light-sweep" ||
    value === "golden-glint" ||
    value === "soft-glow" ||
    value === "breathing-scale"
  );
}

// ---------------------------------------------------------------------------
// Entrée (entrance) — style pour une frame donnée.
// ---------------------------------------------------------------------------

/**
 * Style d'entrée du preset à la frame donnée. `opacity` est linéaire (calme) ;
 * les transformations sont adoucies (easeOutQuint). Tous les presets se
 * terminent sur l'état neutre (opacity 1, identité) — jamais d'animation
 * permanente à l'entrée.
 */
export function getEntranceStyle(
  preset: MotionPreset,
  frame: number,
  opts: { duration?: number; delay?: number; intensity?: MotionIntensity } = {},
): MotionStyle {
  const duration = clampInt(opts.duration ?? 20, 1, 120);
  const delay = Math.max(opts.delay ?? 0, 0);
  const t = clamp01((frame - delay) / duration);
  const e = easeOutQuint(t);

  switch (preset) {
    case "fade":
      return { opacity: t };
    case "fade-up":
      return { opacity: t, transform: `translateY(${((1 - e) * 24).toFixed(2)}px)` };
    case "fade-down":
      return { opacity: t, transform: `translateY(${(-(1 - e) * 24).toFixed(2)}px)` };
    case "scale":
      return {
        opacity: t,
        transform: `scale(${(0.94 + 0.06 * e).toFixed(4)})`,
      };
    case "blur-in":
      return {
        opacity: t,
        filter: `blur(${((1 - e) * 8).toFixed(2)}px)`,
      };
    case "soft-float":
      return {
        opacity: t,
        transform: `translateY(${((1 - e) * 14 + Math.sin(frame * 0.05) * 3).toFixed(2)}px)`,
      };
    case "word-focus": {
      const scale = 0.9 + 0.1 * e;
      const y = (1 - e) * 18;
      return {
        opacity: t,
        transform: `translateY(${y.toFixed(2)}px) scale(${scale.toFixed(4)})`,
        filter: `brightness(${(1 + 0.14 * e).toFixed(4)})`,
      };
    }
    default:
      return { opacity: t };
  }
}

// ---------------------------------------------------------------------------
// Respiration (breathing-scale) — lente et à peine perceptible.
// ---------------------------------------------------------------------------

export type BreathingOpts = {
  start?: number;
  amplitude?: number;
  period?: number;
};

export function getBreathingScale(
  frame: number,
  opts: BreathingOpts = {},
): number {
  const start = opts.start ?? 0;
  const amplitude = opts.amplitude ?? 0.008;
  const period = Math.max(opts.period ?? 100, 30);
  if (frame < start) return 1;
  const phase = ((frame - start) % period) / period;
  return 1 + amplitude * Math.sin(2 * Math.PI * phase);
}

// ---------------------------------------------------------------------------
// Light sweep — bande de lumière traversant les glyphes (déterministe).
// ---------------------------------------------------------------------------

/** Progression 0..1 du balayage (bornee ; 0 avant, 1 après). */
export function lightSweepPosition(frame: number, timing: SweepTiming): number {
  const { start, duration } = timing;
  return clamp01((frame - start) / Math.max(duration, 1));
}

/** Enveloppe d'opacité : 0 hors fenêtre, fondu d'entrée/sortie doux. */
export function sweepEnvelope(frame: number, timing: SweepTiming): number {
  const { start, duration } = timing;
  if (frame < start || frame > start + duration) return 0;
  const local = frame - start;
  const fadeIn = Math.min(5, duration * 0.22);
  const fadeOut = Math.min(7, duration * 0.32);
  const inEnv = local < fadeIn ? local / fadeIn : 1;
  const outEnv = local > duration - fadeOut ? (duration - local) / fadeOut : 1;
  return clamp01(Math.min(inEnv, outEnv));
}

/**
 * Position X du masque/bande du light sweep. Avec maskSize 200 %, la bande
 * (opaque à 50 % du dégradé) se trouve à `100 − P` % de la largeur du mot : P
 * va de 110 % (p=0, bande entrante à gauche) à −10 % (p=1, sortie à droite)
 * ⇒ la bande traverse les glyphes pendant toute l'animation, bord à bord.
 *
 * (Technique historique H1, conservée pour compatibilité ; H2 privilégie
 * l'architecture multi-couches `lightSweepBandLeft` — copie highlight + masque
 * statique + bande mobile — qui ne dépend pas uniquement de background-clip.)
 */
export function lightSweepBackgroundPosition(
  frame: number,
  timing: SweepTiming,
): string {
  const p = lightSweepPosition(frame, timing);
  return `${((1.1 - 1.2 * p) * 100).toFixed(2)}% 0%`;
}

/** Position X (en % du bloc) du glint doré pendant le balayage. */
export function glintPosition(frame: number, timing: SweepTiming): number {
  const p = lightSweepPosition(frame, timing);
  return -20 + 120 * p;
}

/** Enveloppe courte du glint (plus brève que le sweep). */
export function glintEnvelope(frame: number, timing: SweepTiming): number {
  const { start, duration } = timing;
  if (frame < start || frame > start + duration) return 0;
  const local = frame - start;
  const fadeIn = Math.min(3, duration * 0.18);
  const fadeOut = Math.min(5, duration * 0.28);
  const inEnv = local < fadeIn ? local / fadeIn : 1;
  const outEnv = local > duration - fadeOut ? (duration - local) / fadeOut : 1;
  return clamp01(Math.min(inEnv, outEnv));
}

// ---------------------------------------------------------------------------
// Miroir / reflet — alignement vertical déterministe.
// ---------------------------------------------------------------------------

/**
 * Fraction de lineHeight où se trouve la baseline de la police arabe (Amiri).
 * Utilisée pour calculer l'axe de miroir du reflet (transformOrigin + offset).
 */
export const ARABIC_BASELINE_FRACTION = 0.82;

/**
 * Hauteur (px) du reflet visible sous le mot, en multiple de la hauteur de la
 * boîte du mot (lineHeight × fontSize). Le reflet est flouté et masqué : la
 * partie visible s'arrête bien avant le texte suivant.
 */
export const MIRROR_VISIBLE_MULTIPLIER = 0.9;

/**
 * Offset vertical (px) à appliquer au reflet après le scaleY(-1) pour le placer
 * sous la boîte du mot, aligné sur la baseline estimée. Formule :
 * translateY = 2 × (1 - baselineFrac) × boxHeight.
 */
export function mirrorTranslateY(boxHeight: number): number {
  return 2 * (1 - ARABIC_BASELINE_FRACTION) * boxHeight;
}

/** Masque de fondu vertical du reflet (s'efface avec la distance). */
export function mirrorMaskGradient(): string {
  return "linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.3) 44%, transparent 80%)";
}
