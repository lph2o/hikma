import type { QuranWord } from "@/types/quran";
import type { Lesson, LessonWord } from "@/types/learning";

/**
 * Niveau de maîtrise discret, exprimé en pourcentage.
 * La maîtrise n'est PAS un simple ratio correct/total : elle intègre le statut
 * et l'espacement des révisions (voir `lib/learning/mastery.ts`).
 */
export type MasteryLevel = 0 | 25 | 50 | 75 | 100;

/** Entrée du « word bank » fournie au moteur d'exercices. */
export type WordBankEntry = {
  wordId: string;
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  /**
   * Langue réelle du sens fourni (ex. "en") — renseignée par la couche
   * applicative (lib/learning/language.ts). Le moteur et l'UI ne choisissent
   * pas la langue eux-mêmes.
   */
  meaningLanguage?: string;
  /** true si le sens est un repli (langue pédagogique absente des données). */
  meaningFallback?: boolean;
  /** Provenance de la traduction retenue (ex. « Hikma — lexique éditorial »). */
  translationSource?: string;
  /** true si la traduction retenue est une traduction Hikma validée. */
  isValidated?: boolean;
};

/** Mot d'une leçon, enrichi de ses données coraniques. */
export type LessonWordWithWord = LessonWord & {
  word: QuranWord;
};

/** Contexte coranique d'un mot (verset réel où la forme apparaît). */
export type WordContextData = {
  surahNumber: number;
  ayahNumber: number;
  /** Texte arabe du verset (text_uthmani, jamais modifié). */
  arabic: string;
  /** Traduction française réelle (Hamidullah) du VERSET — null si absente. */
  french: string | null;
};

/** Relation FORME → LEMME d'un mot, pour l'exercice de relation lexicale. */
export type WordLemmaData = {
  lemmaId: string;
  /** Autres formes coraniques partageant le même lemme (hors la cible). */
  siblings: Array<{ wordId: string; arabic: string }>;
};

/** Statut de complétion d'une leçon pour un utilisateur (usage UI ultérieur). */
export type LessonProgressStatus =
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "MASTERED";

/** Plan d'une leçon : la séquence ordonnée des types d'exercices. */
export type LessonPlan = {
  lesson: Lesson;
  /** Mots de la leçon, ordonnés par position. */
  words: LessonWordWithWord[];
  /** Séquence d'exercices proposée pour la leçon. */
  exerciseTypes: string[];
};
