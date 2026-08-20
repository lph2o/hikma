import type { ReviewItemStatus } from "@/types/learning";

/**
 * État de planification d'un mot (persisté dans review_items).
 * Minimal : les champs réellement nécessaires au scheduler par défaut
 * (Leitner). SM-2/FSRS ajouteraient leurs propres colonnes par migration.
 */
export type ReviewState = {
  status: ReviewItemStatus;
  intervalDays: number;
  lastReviewAt: string | null;
  nextReviewAt: string | null;
};

/** Planification calculée après une réponse. */
export type ReviewSchedule = {
  status: ReviewItemStatus;
  intervalDays: number;
  nextReviewAt: string;
};

export type ReviewItemWithWord = {
  wordId: string;
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  /** Langue réelle du sens (ex. "en") — résolue par la couche applicative. */
  meaningLanguage?: string;
  /** true si le sens est un repli (langue pédagogique absente des données). */
  meaningFallback?: boolean;
  /** Provenance de la traduction retenue (ex. « Hikma — lexique éditorial »). */
  translationSource?: string;
  /** true si la traduction retenue est une traduction Hikma validée. */
  isValidated?: boolean;
  state: ReviewState | null;
};
