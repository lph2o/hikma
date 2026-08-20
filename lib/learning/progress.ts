import type { WordStatus } from "@/types/learning";
import { defaultMasteryCalculator, type MasteryCalculator } from "./mastery";
import type { MasteryLevel } from "./types";

/** Seuils de progression (documentés, déterministes, testables). */
export const PROGRESS_RULES = {
  /** Corrects cumulés requis pour passer « learning » → « familiar ». */
  familiarMinCorrect: 3,
  /** Précision minimale (correct / total) pour passer « familiar ». */
  familiarMinAccuracy: 0.5,
  /** Corrects cumulés requis pour passer « familiar » → « mastered ». */
  masteredMinCorrect: 8,
  /** Précision minimale pour passer « mastered ». */
  masteredMinAccuracy: 0.8,
  /** Intervalle de révision minimal (jours) pour passer « mastered ». */
  masteredMinIntervalDays: 14,
} as const;

/** État agrégé de progression d'un mot (persisté dans user_word_progress). */
export type ProgressState = {
  status: WordStatus;
  correctCount: number;
  incorrectCount: number;
  mastery: MasteryLevel;
  intervalDays: number;
};

export type ApplyAnswerResult = ProgressState & {
  /** true si le statut a changé pendant cette réponse. */
  statusChanged: boolean;
};

/** Précision = corrects / total. Vaut 1 si aucun total (évite la division par 0). */
export function accuracy(correct: number, incorrect: number): number {
  const total = correct + incorrect;
  return total === 0 ? 1 : correct / total;
}

/**
 * Détermine le prochain statut après une réponse.
 *
 * Règles (voir PROGRESS_RULES) :
 * - premier contact → « learning » ;
 * - « learning » → « familiar » après assez de corrects et une précision minimale ;
 * - « familiar » → « mastered » après assez de corrects, une précision minimale
 *   ET un intervalle de révision suffisamment long (répétition espacée) ;
 * - une erreur au stade « mastered » rétrograde vers « familiar » (re-révision).
 */
export function nextStatus(
  current: WordStatus | null,
  correct: boolean,
  correctCount: number,
  incorrectCount: number,
  intervalDays: number,
): WordStatus {
  if (current == null || current === "new") return "learning";

  if (correct) {
    const acc = accuracy(correctCount, incorrectCount);
    if (current === "mastered") return "mastered";
    if (
      current === "familiar" &&
      correctCount >= PROGRESS_RULES.masteredMinCorrect &&
      acc >= PROGRESS_RULES.masteredMinAccuracy &&
      intervalDays >= PROGRESS_RULES.masteredMinIntervalDays
    ) {
      return "mastered";
    }
    if (
      current === "learning" &&
      correctCount >= PROGRESS_RULES.familiarMinCorrect &&
      acc >= PROGRESS_RULES.familiarMinAccuracy
    ) {
      return "familiar";
    }
    return current;
  }

  // Réponse incorrecte : une maîtrise acquise redescend en « familiar ».
  return current === "mastered" ? "familiar" : current;
}

/**
 * Applique une réponse à la progression d'un mot (pur, sans I/O).
 * `intervalDays` est fourni par le Review Engine (scheduler).
 */
export function applyAnswer(
  previous: ProgressState | null,
  correct: boolean,
  intervalDays: number,
  calculator: MasteryCalculator = defaultMasteryCalculator,
): ApplyAnswerResult {
  const correctCount = (previous?.correctCount ?? 0) + (correct ? 1 : 0);
  const incorrectCount = (previous?.incorrectCount ?? 0) + (correct ? 0 : 1);

  const status = nextStatus(
    previous?.status ?? null,
    correct,
    correctCount,
    incorrectCount,
    intervalDays,
  );

  const mastery = calculator.compute({
    status,
    correctCount,
    incorrectCount,
    intervalDays,
  });

  return {
    status,
    correctCount,
    incorrectCount,
    mastery,
    intervalDays,
    statusChanged: status !== (previous?.status ?? null),
  };
}
