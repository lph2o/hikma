// Hikma — Video Format System : TYPES ÉDITORIAUX (couche propre à Hikma).
//
// Ces formats NE VIENNENT PAS d'OpenReel. OpenReel fournit les capacités
// techniques (text editor, shapes, keyframes, timeline, audio) déjà intégrées
// dans le Content Studio ; cette couche construit une STRATÉGIE ÉDITORIALE
// Hikma par-dessus : des formats réutilisables qui génèrent des clips STANDARD
// (scenes + graphics), jamais un renderer parallèle.
//
// Un format génère UNIQUEMENT des objets du Content Studio :
//   - VideoScene[]  (via le pipeline existant → scènes Remotion)
//   - GraphicClipBase[]  (TextGraphicClip pré-promus + ShapeGraphicClip
//     décoratifs — entièrement éditables dans Canvas/Inspector/Timeline)
// Le résultat est modifiable comme n'importe quelle vidéo du Studio, puis
// rendu MP4 par le pipeline existant (PREVIEW == RENDER).

import type { ShapeGraphicClip } from "@/lib/content-studio/graphics/shape-graphic";
import type { TextGraphicClip } from "@/lib/content-studio/graphics/text-graphic";
import type { VideoScene } from "@/lib/content-studio/video/types";

/** Union discriminée des clips graphiques générés par un format. */
export type FormatGraphicClip = TextGraphicClip | ShapeGraphicClip;

/** Identifiants stables des 11 formats éditoriaux Hikma. */
export type VideoFormatId =
  | "WORD_REVEAL"
  | "WORD_QUIZ"
  | "FREQUENCY_FACT"
  | "ROOT_FAMILY"
  | "NUANCE_FALSE_FRIENDS"
  | "AYAH_IMMERSION"
  | "SURAH_KEYWORDS"
  | "LINGUISTIC_PEARL"
  | "DAILY_WORD_CHALLENGE"
  | "LISTEN_AND_FIND"
  | "SPEED_VOCAB";

/** Statut éditorial — honnête : READY = manipulable de bout en bout. */
export type FormatStatus = "READY" | "BETA" | "COMING_SOON";

export type FormatCategory = "APPRENDRE" | "COMPRENDRE" | "RÉSEAUX SOCIAUX";

/** Entrée d'un template (varie par format — payload Content API V1 réel). */
export type FormatTemplateInput = unknown;

/** Sortie d'un template : des clips STANDARD du Content Studio, planifiés. */
export interface FormatTemplateOutput {
  /** Id du format éditorial (WORD_REVEAL…). */
  readonly format: VideoFormatId;
  /** Clé du template studio existant ciblé (WORD_REVEAL_V1…). */
  readonly templateKey: string;
  readonly durationInFrames: number;
  readonly fps: number;
  readonly width: number;
  readonly height: number;
  /** Scènes vidéo (pipeline existant) — planifiées séquentiellement. */
  readonly scenes: VideoScene[];
  /** Clips graphiques éditables — jamais tous à frame 0, z-index composés. */
  readonly graphics: readonly FormatGraphicClip[];
  /** Métadonnées éditoriales (Content Studio, pas le renderer). */
  readonly metadata: FormatMetadata;
}

export interface FormatMetadata {
  readonly wordId?: string;
  readonly surah?: number;
  readonly ayah?: number;
  readonly language: "fr";
  readonly category: FormatCategory;
  readonly platform: string[];
  readonly templateVersion: string;
}

/**
 * Définition d'un format du registre (section 5 de la mission) :
 * `createTemplate(input)` produit le montage complet (scènes + clips).
 * Absent/null ⇒ format non prêt (COMING_SOON) — la génération est refusée.
 */
export interface VideoFormatDef {
  readonly id: VideoFormatId;
  /** Clé du template studio (WORD_REVEAL_V1…) si un pipeline existe. */
  readonly templateKey: string | null;
  readonly name: string;
  readonly subtitle: string;
  readonly category: FormatCategory;
  readonly description: string;
  readonly recommendedDuration: string;
  readonly platforms: string[];
  readonly status: FormatStatus;
  readonly badge?: string;
  readonly createTemplate: ((input: FormatTemplateInput) => FormatTemplateOutput) | null;
}
