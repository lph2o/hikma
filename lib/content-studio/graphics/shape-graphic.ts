// Hikma — Content Studio : CLIP GRAPHIQUE FORME (ShapeGraphicClip).
//
// Modèle Hikma adapté des concepts OpenReel (MIT) :
//   - types de formes : `types/shape-tools.ts` (ShapeTool : rectangle,
//     ellipse, polygon, star, line ; configs pur — ce fichier est la source) ;
//   - style (fill/stroke) : `motion/motion-shape-style.ts` (concepts portés).
// La géométrie est ÉVALUÉE en fonctions pures (positions normalisées 0..1,
// frames Hikma) et rendue par Remotion en SVG — PAS par le renderer canvas
// OpenReel (classe D, couplé à son architecture).
//
// Règle arabe : les formes sont des éléments GRAPHIQUES génériques ; le texte
// coranique reste rendu par le renderer arabe Hikma.
//
// NOTICE : © OpenReel — Copyright (c) 2024-2026 Augustus Otu and Contributors
// (MIT License). https://github.com/Augani/openreel-video
// Ce fichier est un ADAPTATION Hikma (types réutilisés, logique Hikma).

import {
  DEFAULT_GRAPHIC_TRANSFORM,
  sanitizeGraphicClipBase,
  sanitizeGraphicTransform,
  type GraphicClipBase,
  type GraphicTransform,
} from "@/lib/content-studio/graphics/graphic-clip";

/** Types de formes disponibles (port du ShapeTool OpenReel, sans `pen`).
 * `circle` est parfaitement rond (width === height) ; `ellipse` est ovale. */
export type ShapeGraphicKind =
  | "rectangle"
  | "ellipse"
  | "circle"
  | "polygon"
  | "star"
  | "line"
  | "arrow";

export const SHAPE_GRAPHIC_KINDS: readonly ShapeGraphicKind[] = [
  "rectangle",
  "ellipse",
  "circle",
  "polygon",
  "star",
  "line",
  "arrow",
];

/** Ratio hauteur/largeur par défaut d'une forme (en px écran). */
export function defaultShapeAspect(shape: ShapeGraphicKind): number {
  switch (shape) {
    case "ellipse":
      return 0.62;
    case "line":
      return 0.1;
    case "arrow":
      return 0.35;
    default:
      // circle, rectangle, polygon, star → parfaitement équilatéral
      return 1;
  }
}

/** Style de remplissage — solid ou gradient linéaire (stops normalisés 0..1). */
export type ShapeFill =
  | { type: "solid"; color: string }
  | { type: "linear"; colors: readonly string[]; angle: number };

/** Contour de la forme (absents ⇒ pas de contour). */
export interface ShapeStroke {
  readonly color: string;
  readonly width: number;
}

/** Ombre directionnelle d'une forme (offset X/Y en px canvas, blur en px). */
export interface ShapeShadow {
  readonly color: string;
  readonly opacity: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
}

/** Halo / glow d'une forme (rayon en px, opacité 0..1). */
export interface ShapeGlow {
  readonly color: string;
  readonly opacity: number;
  readonly radius: number;
}

export interface ShapeGraphicClip extends GraphicClipBase {
  readonly kind: "shape";
  /** Forme géométrique (port ShapeTool). */
  readonly shape: ShapeGraphicKind;
  /** Remplissage (défaut : solid teal Hikma). */
  readonly fill: ShapeFill;
  /** Contour optionnel. */
  readonly stroke?: ShapeStroke;
  /** Arrondi des angles (rectangle) ou ratio rayon interne/externe (star). */
  readonly roundness?: number;
  /** Nombre de côtés/pointes (polygon/star). */
  readonly sides?: number;
  /** Épaisseur (proportion normalisée de la largeur du canvas). */
  readonly thickness?: number;
  /**
   * Ratio hauteur/largeur en px écran (défaut par forme). Pour `circle` le
   * ratio est VERROUILLÉ à 1 (cercle parfait, width === height) ; pour
   * `ellipse` il est libre (ovale).
   */
  readonly aspect?: number;
  /** Ombre directionnelle (optionnelle). */
  readonly shadow?: ShapeShadow;
  /** Halo / glow (optionnel). */
  readonly glow?: ShapeGlow;
  /** Flou gaussien en px (optionnel). */
  readonly blur?: number;
}

export interface ShapeGraphicInput {
  readonly id?: string;
  readonly startFrame?: number;
  readonly durationInFrames?: number;
  readonly zIndex?: number;
  readonly transform?: Partial<GraphicTransform>;
  readonly keyframes?: GraphicClipBase["keyframes"];
  readonly shape?: ShapeGraphicKind;
  readonly fill?: Partial<ShapeFill> & { colors?: readonly string[] };
  readonly stroke?: ShapeStroke;
  readonly roundness?: number;
  readonly sides?: number;
  readonly thickness?: number;
  readonly aspect?: number;
  readonly shadow?: ShapeShadow;
  readonly glow?: ShapeGlow;
  readonly blur?: number;
}

const clampFinite = (v: unknown, min: number, max: number, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;

const isHex = (c: string): boolean => /^#[0-9a-fA-F]{3,8}$/.test(c);

function sanitizeShapeFill(raw: ShapeGraphicInput["fill"] | undefined): ShapeFill {
  if (!raw || typeof raw !== "object") {
    return { type: "solid", color: "#14b8a6" };
  }
  const r = raw as Record<string, unknown>;
  if (r.type === "linear") {
    const colors = Array.isArray(r.colors)
      ? r.colors.filter((c): c is string => typeof c === "string" && isHex(c))
      : [];
    if (colors.length >= 2) {
      return {
        type: "linear",
        colors: colors.slice(0, 8),
        angle: clampFinite(r.angle, -360, 360, 90),
      };
    }
    return { type: "solid", color: "#14b8a6" };
  }
  // solid (ou inconnu) → couleur sanitisée
  const color = typeof r.color === "string" && isHex(r.color) ? r.color : "#14b8a6";
  return { type: "solid", color };
}

/** Crée + sanitise un ShapeGraphicClip (jamais NaN/Infinity, bornes sûres). */
export function createShapeGraphicClip(input: ShapeGraphicInput): ShapeGraphicClip {
  const base = sanitizeGraphicClipBase({
    id: input.id,
    kind: "shape",
    startFrame: input.startFrame,
    durationInFrames: input.durationInFrames,
    zIndex: input.zIndex,
    transform: input.transform,
    keyframes: input.keyframes,
  });
  const shape = SHAPE_GRAPHIC_KINDS.includes(input.shape as ShapeGraphicKind)
    ? (input.shape as ShapeGraphicKind)
    : "rectangle";
  const stroke =
    input.stroke &&
    typeof input.stroke === "object" &&
    typeof input.stroke.width === "number" &&
    Number.isFinite(input.stroke.width) &&
    input.stroke.width > 0 &&
    isHex(input.stroke.color ?? "")
      ? { color: input.stroke.color, width: clampFinite(input.stroke.width, 0.5, 40, 2) }
      : undefined;
  return {
    ...base,
    kind: "shape",
    shape,
    fill: sanitizeShapeFill(input.fill),
    stroke,
    roundness: clampFinite(input.roundness, 0, 1, 0),
    sides:
      shape === "polygon" || shape === "star"
        ? Math.max(3, Math.floor(clampFinite(input.sides, 3, 32, shape === "star" ? 5 : 6)))
        : undefined,
    thickness: clampFinite(input.thickness, 0.01, 1, 0.4),
    // `circle` : ratio verrouillé à 1 (cercle parfait). Les autres formes
    // acceptent un aspect libre (borné 0.05..2, défaut par forme).
    aspect:
      shape === "circle"
        ? 1
        : clampFinite(input.aspect, 0.05, 2, defaultShapeAspect(shape)),
    shadow: sanitizeShapeShadow(input.shadow),
    glow: sanitizeShapeGlow(input.glow),
    blur: clampFinite(input.blur, 0, 60, 0),
  };
}

/** Sanitise une ombre de forme (hex valide, bornes sûres). */
function sanitizeShapeShadow(raw: ShapeShadow | undefined): ShapeShadow | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as unknown as Record<string, unknown>;
  if (typeof r.color !== "string" || !/^#[0-9a-fA-F]{3,8}$/.test(r.color)) return undefined;
  return {
    color: r.color,
    opacity: clampFinite(r.opacity, 0, 1, 0.5),
    offsetX: clampFinite(r.offsetX, -200, 200, 4),
    offsetY: clampFinite(r.offsetY, -200, 200, 6),
    blur: clampFinite(r.blur, 0, 120, 8),
  };
}

/** Sanitise un halo de forme (hex valide, bornes sûres). */
function sanitizeShapeGlow(raw: ShapeGlow | undefined): ShapeGlow | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as unknown as Record<string, unknown>;
  if (typeof r.color !== "string" || !/^#[0-9a-fA-F]{3,8}$/.test(r.color)) return undefined;
  return {
    color: r.color,
    opacity: clampFinite(r.opacity, 0, 1, 0.8),
    radius: clampFinite(r.radius, 0, 200, 16),
  };
}

/** Ratio hauteur/largeur EFFECTIF d'un clip (défaut par forme). */
export function shapeAspect(clip: Pick<ShapeGraphicClip, "shape" | "aspect">): number {
  if (clip.shape === "circle") return 1;
  if (typeof clip.aspect === "number" && Number.isFinite(clip.aspect)) {
    return Math.max(0.05, Math.min(2, clip.aspect));
  }
  return defaultShapeAspect(clip.shape);
}

/** Forme par défaut (point de départ de l'UI). */
export function defaultShapeGraphicClip(): ShapeGraphicClip {
  return createShapeGraphicClip({
    id: "shape-1",
    startFrame: 0,
    durationInFrames: 90,
    zIndex: 2,
    transform: { ...DEFAULT_GRAPHIC_TRANSFORM, y: 0.25 },
    shape: "rectangle",
    fill: { type: "solid", color: "#14b8a6" },
  });
}

// ---------------------------------------------------------------------------
// GÉOMÉTRIE PURE (frames → path SVG) — PREVIEW == RENDER.
// ---------------------------------------------------------------------------

export interface EvaluatedShapeGeometry {
  /**
   * Élément SVG à dessiner, centré sur l'origine, dans un viewBox "-1 -1 2 2"
   * (la forme occupe donc TOUTE la boîte : rayon externe 1 pour les formes
   * radiales, 2×2 pour le rectangle). Le container SVG est dimensionné à
   * `thickness` × largeur du canvas ⇒ la forme visible fait exactement
   * `thickness` de la largeur du canvas (PREVIEW == RENDER).
   */
  readonly element: "rect" | "ellipse" | "circle" | "polygon" | "line";
  readonly attrs: Record<string, string>;
}

const STAR_POINTS = (points: number, outer: number, inner: number, rot: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = rot + (i * Math.PI) / points - Math.PI / 2;
    pts.push(`${(Math.cos(angle) * radius).toFixed(4)},${(Math.sin(angle) * radius).toFixed(4)}`);
  }
  return pts.join(" ");
};

const POLYGON_POINTS = (sides: number, radius: number, rot: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = rot + (i * 2 * Math.PI) / sides - Math.PI / 2;
    pts.push(`${(Math.cos(angle) * radius).toFixed(4)},${(Math.sin(angle) * radius).toFixed(4)}`);
  }
  return pts.join(" ");
};

/** Rayon normalisé de la forme (proportion de la largeur du canvas). */
export function shapeRadius(thickness: number): number {
  return Math.max(0.05, Math.min(0.45, thickness / 2));
}

/**
 * Géométrie SVG d'une forme (attributs centrés sur l'origine, viewBox
 * "-1 -1 2 2" : rayon externe 1, rectangle 2×2). Fonction PURE — mêmes
 * valeurs en Preview et en Render. La taille visible est pilotée par le
 * container SVG (`thickness` × largeur du canvas), pas par la géométrie.
 */
export function evaluateShapeGeometry(
  clip: ShapeGraphicClip,
): EvaluatedShapeGeometry {
  const rot = 0; // rotation portée par le transform du clip (déterministe)
  const aspect = shapeAspect(clip);
  switch (clip.shape) {
    case "rectangle": {
      const round = Math.max(0, Math.min(1, clip.roundness ?? 0));
      return {
        element: "rect",
        attrs: {
          x: "-1",
          y: "-1",
          width: "2",
          height: "2",
          rx: round.toFixed(4),
          ry: round.toFixed(4),
        },
      };
    }
    case "ellipse":
      return {
        element: "ellipse",
        attrs: { cx: "0", cy: "0", rx: "1", ry: aspect.toFixed(4) },
      };
    case "circle":
      return {
        element: "circle",
        attrs: { cx: "0", cy: "0", r: "1" },
      };
    case "line":
      return {
        element: "line",
        attrs: { x1: "-1", y1: "0", x2: "1", y2: "0" },
      };
    case "arrow": {
      const shaft = 1;
      const head = 0.4;
      return {
        element: "polygon",
        attrs: {
          points: [
            `${(-shaft).toFixed(4)},${(-head * 0.3).toFixed(4)}`,
            `${(-shaft).toFixed(4)},${(head * 0.3).toFixed(4)}`,
            `${(head * 0.6).toFixed(4)},${(head * 0.3).toFixed(4)}`,
            `${(head * 0.6).toFixed(4)},${head.toFixed(4)}`,
            `${(shaft * 0.7).toFixed(4)},0`,
            `${(head * 0.6).toFixed(4)},${(-head).toFixed(4)}`,
            `${(head * 0.6).toFixed(4)},${(-head * 0.3).toFixed(4)}`,
          ].join(" "),
        },
      };
    }
    case "star": {
      const points = Math.max(3, clip.sides ?? 5);
      const inner = 0.45 + 0.1 * (clip.roundness ?? 0.5);
      return {
        element: "polygon",
        attrs: { points: STAR_POINTS(points, 1, inner, rot) },
      };
    }
    case "polygon": {
      const sides = Math.max(3, clip.sides ?? 6);
      return {
        element: "polygon",
        attrs: { points: POLYGON_POINTS(sides, 1, rot) },
      };
    }
    default:
      return { element: "rect", attrs: { x: "-1", y: "-1", width: "2", height: "2" } };
  }
}

/** Couleur de remplissage effective (gradient résolu en deux couleurs). */
export function shapeFillColors(clip: ShapeGraphicClip): {
  from: string;
  to: string | null;
  angle: number | null;
} {
  if (clip.fill.type === "linear") {
    const c = clip.fill.colors;
    return { from: c[0] ?? "#14b8a6", to: c.length > 1 ? c[1]! : null, angle: clip.fill.angle ?? 90 };
  }
  return { from: clip.fill.color, to: null, angle: null };
}

/** Sanitize une collection de formes (réutilisé par state.ts). */
export function sanitizeShapeClip(raw: Record<string, unknown>): ShapeGraphicClip {
  return createShapeGraphicClip({
    id: typeof raw.id === "string" ? raw.id : undefined,
    startFrame: typeof raw.startFrame === "number" ? raw.startFrame : undefined,
    durationInFrames:
      typeof raw.durationInFrames === "number" ? raw.durationInFrames : undefined,
    zIndex: typeof raw.zIndex === "number" ? raw.zIndex : undefined,
    transform:
      typeof raw.transform === "object" && raw.transform !== null
        ? sanitizeGraphicTransform(raw.transform as Partial<GraphicTransform>)
        : undefined,
    keyframes: Array.isArray(raw.keyframes) ? (raw.keyframes as never) : undefined,
    shape: typeof raw.shape === "string" ? (raw.shape as ShapeGraphicKind) : undefined,
    fill:
      typeof raw.fill === "object" && raw.fill !== null
        ? (raw.fill as ShapeGraphicInput["fill"])
        : undefined,
    stroke:
      typeof raw.stroke === "object" && raw.stroke !== null
        ? (raw.stroke as ShapeStroke)
        : undefined,
    roundness: typeof raw.roundness === "number" ? raw.roundness : undefined,
    sides: typeof raw.sides === "number" ? raw.sides : undefined,
    thickness: typeof raw.thickness === "number" ? raw.thickness : undefined,
    aspect: typeof raw.aspect === "number" ? raw.aspect : undefined,
    shadow:
      typeof raw.shadow === "object" && raw.shadow !== null
        ? (raw.shadow as ShapeShadow)
        : undefined,
    glow:
      typeof raw.glow === "object" && raw.glow !== null
        ? (raw.glow as ShapeGlow)
        : undefined,
    blur: typeof raw.blur === "number" ? raw.blur : undefined,
  });
}
