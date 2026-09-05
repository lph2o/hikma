// Hikma — Content Studio : ADAPTER DES TEXTES HÉRITÉS (UNIFICATION TEXT EDITOR).
//
// Tous les textes visibles du Content Studio doivent être éditables avec le
// même système (TextStyle / transform / animation / effets / Timeline /
// Inspector). Les textes historiques vivent DANS les scènes VideoScene
// (champs `arabic`, `transliteration`, `text`, `subtext`) et sont rendus par
// des composants de scène spécialisés — ils ne passaient pas par la pipeline
// graphique. Cet adapter décrit chacun de ces textes comme un descripteur
// unifié : contenu + style par défaut (reproduisant le rendu scène actuel,
// parité visuelle à la promotion) + transform + direction + protection.
//
// STRATÉGIE — PROMOTION LAZY : l'utilisateur « promeut » un texte hérité en
// un VRAI TextGraphicClip (porté dans editor_state.graphics, rendu par
// GraphicsOverlay, éditable partout). L'original est alors masqué dans sa
// scène tant que le clip existe (la suppression du clip restaure l'original).
// Aucune migration DB : tout passe par l'infrastructure graphics existante.
//
// PROTECTION CORAN : le verset (`quran.arabic`) n'est JAMAIS promu — le
// renderer arabe + Golden Recitation Follower + la récitation continue sont
// sacrés (mission : ne jamais reshaper le texte Quran ni casser l'audio).
//
// Module PUR (aucun React) — testable, déterministe, partagé Preview/Render.

import type { VideoScene, VideoSceneKind } from "@/lib/content-studio/video/types";
import {
  DEFAULT_GRAPHIC_TRANSFORM,
  type GraphicClipBase,
  type GraphicTransform,
} from "@/lib/content-studio/graphics/graphic-clip";
import type { TextStyle } from "@/lib/content-studio/graphics/text-types";
import type { TextGraphicClip } from "@/lib/content-studio/graphics/text-graphic";

/** Champs texte d'une scène couverts par l'éditeur unifié. */
export type LegacyTextField = "arabic" | "transliteration" | "text" | "subtext";

export const LEGACY_FIELD_LABELS: Record<LegacyTextField, string> = {
  arabic: "Texte arabe",
  transliteration: "Translittération",
  text: "Texte principal",
  subtext: "Texte secondaire",
};

/** Référence d'origine d'un clip promu : scène + champ masqués. */
export type LegacyTextSource = {
  readonly sceneIndex: number;
  readonly field: LegacyTextField;
};

export interface LegacyTextDescriptor {
  /** Clé stable : `${sceneIndex}:${field}`. */
  readonly key: string;
  readonly sceneIndex: number;
  readonly field: LegacyTextField;
  /** Contenu RÉEL de la scène (jamais reshaper, jamais normaliser l'arabe). */
  readonly content: string;
  readonly direction: "ltr" | "rtl";
  /** Style par défaut reproduisant le rendu scène (parité visuelle). */
  readonly style: TextStyle;
  /** Transform par défaut (position normalisée 0..1, centre de l'élément). */
  readonly transform: GraphicTransform;
  readonly label: string;
  /** true = verset coranique — jamais promu (renderer arabe sacré). */
  readonly protected: boolean;
}

/** Polices RÉELLEMENT chargées (design system + Remotion) — jamais inventées. */
const FONT_LATIN = "Poppins";
const FONT_ARABIC = "Amiri";

interface FieldSpec {
  readonly field: LegacyTextField;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly fontWeight?: TextStyle["fontWeight"];
  readonly color: string;
  readonly fontFamily: string;
  readonly direction: "ltr" | "rtl";
  readonly letterSpacing?: number;
  /** Position verticale (lineHeight par défaut — arabe 1.5 : harakāt visibles). */
  readonly lineHeight?: number;
  /** Verset coranique : protégé (jamais promu). */
  readonly protected?: boolean;
}

/**
 * Table de référence : position + style par défaut de CHAQUE texte rendu par
 * les scènes (valeurs miroir des composants de scène — la promotion est
 * visuellement identique à l'original, puis l'utilisateur prend le contrôle).
 */
const KIND_SPECS: Record<VideoSceneKind, readonly FieldSpec[]> = {
  intro: [
    { field: "text", x: 0.5, y: 0.5, fontSize: 64, color: "#f8f8f0", fontFamily: FONT_LATIN, direction: "ltr", lineHeight: 1.45 },
  ],
  word: [
    // Mot arabe — matériau silver approximé (silver clair + ombre de contact).
    { field: "arabic", x: 0.5, y: 0.42, fontSize: 190, color: "#e9edf2", fontFamily: FONT_ARABIC, direction: "rtl", lineHeight: 1.5 },
    { field: "transliteration", x: 0.5, y: 0.62, fontSize: 48, fontWeight: 500, color: "#f0d090", fontFamily: FONT_LATIN, direction: "ltr", letterSpacing: 2, lineHeight: 1.3 },
  ],
  meaning: [
    { field: "text", x: 0.5, y: 0.5, fontSize: 88, fontWeight: 600, color: "#fffdf8", fontFamily: FONT_LATIN, direction: "ltr", lineHeight: 1.35 },
  ],
  quran: [
    // VERSET : protégé — le renderer arabe + Golden Follower + audio restent
    // intacts. Le descripteur existe (transparence) mais n'est jamais promu.
    { field: "arabic", x: 0.5, y: 0.45, fontSize: 68, color: "#fffdf8", fontFamily: FONT_ARABIC, direction: "rtl", lineHeight: 1.6, protected: true },
    { field: "subtext", x: 0.5, y: 0.78, fontSize: 34, fontWeight: 500, color: "#f0d090", fontFamily: FONT_LATIN, direction: "ltr", lineHeight: 1.3 },
  ],
  explanation: [
    { field: "text", x: 0.5, y: 0.5, fontSize: 52, color: "#f8f8f0", fontFamily: FONT_LATIN, direction: "ltr", lineHeight: 1.55 },
  ],
  cta: [
    { field: "text", x: 0.5, y: 0.5, fontSize: 68, fontWeight: 600, color: "#f0d090", fontFamily: FONT_LATIN, direction: "ltr", lineHeight: 1.45 },
  ],
};

/** Clé stable d'un texte hérité (source d'un clip promu). */
export function legacyTextKey(sceneIndex: number, field: string): string {
  return `${sceneIndex}:${field}`;
}

/**
 * Liste les textes hérités RENDUS d'une scène (contenu non vide uniquement).
 * Fonction PURE — même résultat en Preview, Timeline, Inspector et Render.
 */
export function listLegacyTexts(
  scene: VideoScene,
  sceneIndex: number,
): LegacyTextDescriptor[] {
  const specs = KIND_SPECS[scene.kind] ?? [];
  const out: LegacyTextDescriptor[] = [];
  for (const spec of specs) {
    const content = scene[spec.field];
    if (typeof content !== "string" || content.length === 0) continue;
    out.push({
      key: legacyTextKey(sceneIndex, spec.field),
      sceneIndex,
      field: spec.field,
      content,
      direction: spec.direction,
      style: {
        fontFamily: spec.fontFamily,
        fontSize: spec.fontSize,
        fontWeight: spec.fontWeight ?? 400,
        fontStyle: "normal",
        color: spec.color,
        textAlign: "center",
        verticalAlign: "middle",
        lineHeight: spec.lineHeight ?? 1.3,
        letterSpacing: spec.letterSpacing ?? 0,
      },
      transform: {
        x: spec.x,
        y: spec.y,
        scaleX: DEFAULT_GRAPHIC_TRANSFORM.scaleX,
        scaleY: DEFAULT_GRAPHIC_TRANSFORM.scaleY,
        rotation: DEFAULT_GRAPHIC_TRANSFORM.rotation,
        opacity: DEFAULT_GRAPHIC_TRANSFORM.opacity,
      },
      label: LEGACY_FIELD_LABELS[spec.field],
      protected: spec.protected === true,
    });
  }
  return out;
}

/**
 * Vrai si le texte d'une scène est DÉJÀ promu (un clip graphique avec la même
 * source existe) — l'original doit alors être masqué dans sa scène.
 */
export function isLegacyTextPromoted(
  graphics: readonly GraphicClipBase[],
  sceneIndex: number,
  field: string,
): boolean {
  return graphics.some(
    (g) =>
      g.kind === "text" &&
      (g as TextGraphicClip).source !== undefined &&
      (g as TextGraphicClip).source!.sceneIndex === sceneIndex &&
      (g as TextGraphicClip).source!.field === field,
  );
}

/** Tous les champs hérités actuellement promus (clés `${sceneIndex}:${field}`). */
export function promotedLegacyKeys(
  graphics: readonly GraphicClipBase[],
): Set<string> {
  const keys = new Set<string>();
  for (const g of graphics) {
    if (g.kind !== "text") continue;
    const src = (g as TextGraphicClip).source;
    if (src) keys.add(legacyTextKey(src.sceneIndex, src.field));
  }
  return keys;
}
