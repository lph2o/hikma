// Hikma Content Studio — CONTRAT V1 (freeze B3-FINAL).
//
// Ces types reproduisent EXACTEMENT le contrat figé : aucun champ libre,
// aucune donnée inventée autorisée. Toute extension passe d'abord par le
// freeze contractuel (B4+), jamais par ce fichier seul.

/** Version de template — littéral unique en V1. */
export const TEMPLATE_VERSION = "1" as const;

/** Templates P0 uniquement (B2/B3). Pas de 4ᵉ template sans décision explicite. */
export type TemplateKey = "WORD_QUIZ_V1" | "WORD_REVEAL_V1" | "FREQUENCY_FACT_V1";

export type ContentLanguage = "fr";

export type LicenseStatus =
  | "SAFE"
  | "REVIEW_REQUIRED"
  | "NOT_VERIFIED"
  | "DISABLED";

export type FunnelStage =
  | "DISCOVERY"
  | "ENGAGEMENT"
  | "LEARNING"
  | "CURIOSITY"
  | "HIKMA";

export type OptionConfidence = "VERIFIED" | "PARTIAL" | "UNKNOWN";

export type SeriesKey = "S1_FREQUENCY" | "S2_SURAH" | "S3_QUIZ";

/**
 * Statuts du workflow B3 §22. Phase A ne produit QUE `GENERATED` ou rejette ;
 * les transitions ultérieures n'exigent pas de persistence en Phase A.
 */
export type ContentStatus =
  | "GENERATED"
  | "REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "EXPORTED"
  | "PUBLISHED"
  | "ARCHIVED";

/** Codes de rejet figés B3 (§25) — REJECT OVER GUESS. */
export type RejectCode =
  | "NO_VALIDATED_MEANING"
  | "FALLBACK_EN"
  | "UNKNOWN_DISTRACTOR"
  | "QUIZ_SHAPE"
  | "MISSING_ARABIC"
  | "ARABIC_ALTERED"
  | "INVENTED_METADATA"
  | "LICENSE_BLOCKED"
  | "DUPLICATE_KEY"
  | "UNKNOWN_TEMPLATE"
  | "CTA_INVALID";

/** Canal réellement gagnant du resolver (B3-FINAL R2). */
export type MeaningSourceType = "FORME" | "LEMME";

export type MeaningSourceTable = "word_translations" | "lemma_translations";

// ---------------------------------------------------------------------------
// Blocs du payload
// ---------------------------------------------------------------------------

export type WordIdentityBlock = {
  id: string;
  arabic: string;
  transliteration: string | null;
  lemmaId: string | null;
};

export type MeaningBlock = {
  /** Texte validé transmis À L'IDENTIQUE (aucune transformation). */
  text: string;
  sourceType: MeaningSourceType;
  /** id réel de la ligne gagnante via TASK A1 (jamais reconstruit). */
  sourceId: string;
  validated: true;
  validatedAt: string | null;
};

export type ExplanationBlock = {
  text: string;
  sourceId: string;
  validated: true;
  validatedAt: string | null;
};

export type FirstOccurrenceBlock = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  excerptUthmani: string;
  /** null tant que Hamidullah est REVIEW_REQUIRED (B3-FINAL R? §10/17). */
  verseTranslationFr: { text: string; translator: string } | null;
};

export type QuizOptionBlock = {
  content: string;
  isCorrect: boolean;
  confidence: OptionConfidence;
};

export type QuizBlock = {
  question: string;
  options: QuizOptionBlock[];
};

export type SeriesBlock = {
  seriesKey: SeriesKey;
  episodeNumber: number;
  title: string;
};

export type HookVariantRef = { id: string; version: number };

export type CtaRef = {
  id: string;
  version: number;
  funnelStage: FunnelStage;
  text: string;
};

export type CaptionBlock = {
  text: string;
  language: ContentLanguage;
  hashtags: string[];
};

export type LicensesBlock = {
  verseTranslation: LicenseStatus;
  audio: LicenseStatus;
  dataset: LicenseStatus;
  assets: LicenseStatus;
};

export type SourcesBlock = {
  wordId: string;
  meaningSourceId: string;
  meaningSourceTable: MeaningSourceTable;
  lemmaSourceId: string | null;
  explanationSourceId: string | null;
  /** id `ayahs` RÉEL utilisé pour firstOccurrence (null si aucun verset rendu). */
  ayahId: string | null;
};

export type RenderBlock = {
  width: 1080;
  height: 1920;
  fps: 30;
  aspectRatio: "9:16";
  safeZones: { topPx: 160; bottomPx: 220; rightRailPx: 140 };
  audioDisabled: true;
};

// ---------------------------------------------------------------------------
// Payloads V1
// ---------------------------------------------------------------------------

/** Payload WORD_REVEAL_V1 (endpoint /words/:id). */
export type RevealPayloadV1 = {
  contentKey: string;
  templateKey: "WORD_REVEAL_V1";
  templateVersion: typeof TEMPLATE_VERSION;
  language: ContentLanguage;
  status: Extract<ContentStatus, "GENERATED">;
  word: WordIdentityBlock;
  meaning: MeaningBlock;
  explanation: ExplanationBlock | null;
  occurrenceCount: number;
  firstOccurrence: FirstOccurrenceBlock;
  quiz: null;
  series: SeriesBlock | null;
  hookVariant: HookVariantRef;
  cta: CtaRef | null;
  caption: CaptionBlock;
  licenses: LicensesBlock;
  sources: SourcesBlock;
  render: RenderBlock;
};

/** Payload WORD_QUIZ_V1 (endpoint /quiz/:wordId) — sous-ensemble dédié quiz. */
export type QuizPayloadV1 = {
  contentKey: string;
  templateKey: "WORD_QUIZ_V1";
  templateVersion: typeof TEMPLATE_VERSION;
  language: ContentLanguage;
  status: Extract<ContentStatus, "GENERATED">;
  word: Pick<WordIdentityBlock, "id" | "arabic" | "transliteration">;
  quiz: QuizBlock;
  hookVariant: HookVariantRef;
  cta: null;
  caption: CaptionBlock;
  licenses: LicensesBlock;
  sources: Pick<SourcesBlock, "wordId" | "meaningSourceId" | "meaningSourceTable"> & {
    lemmaSourceId: string | null;
    explanationSourceId: null;
    ayahId: null;
  };
  render: RenderBlock;
};

export type WordCandidateItem = {
  wordId: string;
  arabic: string;
  transliteration: string | null;
  meaning?: string | null;
  hasValidatedFrMeaning: true;
};

export type WordCandidatesResult = {
  items: WordCandidateItem[];
  total: number;
  limit: number;
  offset: number;
};
