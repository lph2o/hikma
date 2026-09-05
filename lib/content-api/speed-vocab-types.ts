// Hikma Content Studio — CONTRAT SPEED VOCAB (VOCAB_SPEED_RUN_V1).
//
// Lot 2 — Video Factory : contrat DÉDIÉ, hors du freeze B3 (types.ts reste
// intact). Mêmes principes que la Content API V1 :
//   - REJECT OVER GUESS : aucune glose non validée, aucune donnée inventée ;
//   - sources traçables (id de ligne réel word_translations|lemma_translations) ;
//   - contentKey idempotent sha256 (content-key.ts) ;
//   - déterminisme total (mêmes entrées ⇒ même payload).
//
// Un payload Speed Vocab représente 3 à 5 mots coraniques réels, chacun avec
// son identité arabe EXACTE (jamais normalisée), sa glose FR validée et son
// nombre d'occurrences EXACT (COUNT PostgREST).

import type { HookVariantRef, LicensesBlock, RenderBlock } from "./types";

/** Nombre de mots du format — 3 à 5 (mission LOT 2). */
export const SPEED_VOCAB_MIN_WORDS = 3 as const;
export const SPEED_VOCAB_MAX_WORDS = 5 as const;

/** Canal de résolution de la glose — même sémantique que la Content API V1. */
export type SpeedVocabMeaningSource = "FORME" | "LEMME";

/** Un mot du Speed Vocab — projections RÉELLES des tables Hikma. */
export interface SpeedVocabWordEntry {
  /** id `quran_words` réel (uuid). */
  readonly wordId: string;
  /** Valeur DB EXACTE de `quran_words.arabic` (jamais normalisée). */
  readonly arabic: string;
  /** `quran_words.transliteration` réel (peut être null). */
  readonly transliteration: string | null;
  /** Glose FR validée À L'IDENTIQUE (word_translations | lemma_translations). */
  readonly meaning: string;
  /** Canal gagnant de la glose (FORME prioritaire, sinon LEMME). */
  readonly meaningSource: SpeedVocabMeaningSource;
  /** Id de ligne RÉEL de la table source (traçabilité TASK A1). */
  readonly meaningSourceId: string;
  /** COUNT exact PostgREST sur `word_occurrences` (> 0). */
  readonly occurrenceCount: number;
}

/** Payload complet VOCAB_SPEED_RUN_V1. */
export interface SpeedVocabPayloadV1 {
  /** sha256-v1 idempotent (content-key.ts) sur la liste triée des wordIds. */
  readonly contentKey: string;
  readonly templateKey: "VOCAB_SPEED_RUN_V1";
  readonly templateVersion: "1";
  readonly language: "fr";
  readonly status: "GENERATED";
  /** 3 à 5 mots, ordre de diffusion déterministe (occurrences DESC, id ASC). */
  readonly words: readonly SpeedVocabWordEntry[];
  readonly hookVariant: HookVariantRef;
  readonly cta: {
    readonly id: string;
    readonly version: number;
    readonly funnelStage: string;
    readonly text: string;
  } | null;
  readonly caption: {
    readonly text: string;
    readonly language: "fr";
    readonly hashtags: readonly string[];
  };
  readonly licenses: LicensesBlock;
  readonly sources: {
    /** wordId du premier mot (colonne NOT NULL content_items.word_id). */
    readonly wordId: string;
    /** Ids de lignes réels, même ordre que words (traçabilité). */
    readonly meaningSourceIds: readonly string[];
    readonly meaningSourceTable: "word_translations" | "lemma_translations" | "mixed";
    readonly ayahId: null;
  };
  readonly render: RenderBlock;
}
