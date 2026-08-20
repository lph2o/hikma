import type { QuranWord } from "@/types/quran";
import type { LessonPlan, LessonWordWithWord, WordBankEntry } from "./types";
import {
  resolveWordMeanings,
  type FrenchLexicalMeaning,
} from "./language";

/**
 * Ordre pédagogique par défaut d'une leçon : reconnaissance → rappel actif →
 * audio → auto-évaluation. AUDIO_TO_WORD n'est généré que si une URL signée
 * est fournie (sinon le générateur renvoie null, jamais d'audio simulé).
 */
export const DEFAULT_LESSON_EXERCISE_TYPES = [
  "WORD_TO_TRANSLATION",
  "TRANSLATION_TO_WORD",
  "REVERSE_TRANSLATION",
  "MULTIPLE_CHOICE",
  "COMPLETE_WORD",
  "FORM_TO_MEANING",
  "MEANING_TO_FORM",
  "AUDIO_TO_WORD",
  "CONTEXT_RECOGNITION",
  "LEMMA_RELATION",
  "WORD_RECOGNITION",
] as const;

/**
 * Construit le word bank (entrées déterministes) à partir des mots d'une leçon.
 * Chaque entrée porte l'identifiant du mot coranique pour préserver la
 * provenance (jamais de données linguistiques inventées), et la langue réelle
 * du sens, résolue par la couche de langue pédagogique.
 *
 * Phase 7 : `frenchByWord` = traductions lexicales FR VALIDÉES (Hikma),
 * fournies par la couche applicative. Sans FR validé, le fallback EN existant
 * est conservé (isFallback=true). Le moteur reste ignorant de la provenance.
 */
export function buildWordBank(
  words: LessonWordWithWord[],
  frenchByWord: Map<string, FrenchLexicalMeaning> = new Map(),
  lemmaFrenchByWord: Map<string, FrenchLexicalMeaning> = new Map(),
): WordBankEntry[] {
  return words.map(({ word }) => {
    const meaning = resolveWordMeanings(
      word,
      frenchByWord.get(word.id),
      lemmaFrenchByWord.get(word.id),
    );
    return {
      wordId: word.id,
      arabic: word.arabic,
      transliteration: word.transliteration,
      meaning: meaning.text,
      meaningLanguage: meaning.language,
      meaningFallback: meaning.isFallback,
      translationSource: meaning.translationSource ?? undefined,
      isValidated: meaning.isValidated ?? false,
    };
  });
}

/**
 * Construit le plan d'une leçon : mots ordonnés + séquence d'exercices.
 * La séquence est dérivée des types réellement exploitables (pas d'audio).
 */
export function buildLessonPlan(
  lesson: LessonPlan["lesson"],
  words: LessonWordWithWord[],
  exerciseTypes: readonly string[] = DEFAULT_LESSON_EXERCISE_TYPES,
): LessonPlan {
  const ordered = [...words].sort((a, b) => a.position - b.position);
  return { lesson, words: ordered, exerciseTypes: [...exerciseTypes] };
}

/** Vrai si une leçon a au moins un mot (condition minimale pour générer des exercices). */
export function hasUsableWords(lesson: LessonPlan): boolean {
  return lesson.words.length > 0;
}

export type { QuranWord };
