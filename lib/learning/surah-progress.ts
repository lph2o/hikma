import { computeLessonStatuses } from "./session";
import type { UserWordProgress } from "@/types/learning";

/**
 * Progression RÉELLE d'un utilisateur par sourate (Phase 34B).
 *
 * Couche de LECTURE / PRÉSENTATION uniquement : elle agrège les états déjà
 * persistés (user_word_progress + lesson_sessions) à travers la fonction pure
 * existante `computeLessonStatuses`. Elle ne crée aucun état pédagogique
 * nouveau, ne modifie aucun moteur et n'est jamais persistée.
 *
 * Les préférences déclaratives (preferred_surah_number, learning_goal, …) ne
 * sont JAMAIS utilisées ici : seule l'activité réelle compte.
 */

export type SurahProgressStatus = "not_started" | "in_progress" | "completed";

/** Leçon vue sous l'angle du calcul de progression d'une sourate. */
export type SurahProgressLesson = {
  lessonId: string;
  slug: string;
  /** Mots `is_new = true` de la leçon — seul critère de complétion. */
  wordIds: string[];
};

/** Entrée pure : une sourate et ses leçons publiées, déjà ordonnées. */
export type SurahProgressInput = {
  surahNumber: number;
  lessons: SurahProgressLesson[];
};

export type SurahProgress = {
  surahNumber: number;
  status: SurahProgressStatus;
  completedLessons: number;
  totalLessons: number;
  /**
   * Leçon de reprise : session active → leçon IN_PROGRESS → première leçon
   * non terminée. `null` si tout est terminé ou s'il n'y a aucune leçon.
   */
  nextLessonSlug: string | null;
  /** Leçon avec une session active (`lesson_sessions.status = 'in_progress'`). */
  activeLessonSlug: string | null;
};

/**
 * Calcule la progression d'une sourate à partir de données déjà chargées.
 *
 * - `progressByWord` : Map(word_id → user_word_progress) (batch).
 * - `activeSessionLessonIds` : leçons avec session active (batch).
 *
 * `completed` signifie « parcours de découverte de la sourate terminé »
 * (toutes les leçons publiées sont COMPLETED), PAS « maîtrise complète » et
 * PAS « aucune révision SRS due » — mêmes semantics que le dashboard.
 */
export function computeSurahProgress(
  surah: SurahProgressInput,
  progressByWord: Map<string, UserWordProgress>,
  activeSessionLessonIds: ReadonlySet<string>,
): SurahProgress {
  const totalLessons = surah.lessons.length;

  if (totalLessons === 0) {
    return {
      surahNumber: surah.surahNumber,
      status: "not_started",
      completedLessons: 0,
      totalLessons: 0,
      nextLessonSlug: null,
      activeLessonSlug: null,
    };
  }

  const statuses = computeLessonStatuses(
    surah.lessons.map((lesson) => ({
      id: lesson.lessonId,
      wordIds: lesson.wordIds,
    })),
    progressByWord,
  );

  let completedLessons = 0;
  let firstInProgress: SurahProgressLesson | null = null;
  let firstAvailable: SurahProgressLesson | null = null;
  for (const lesson of surah.lessons) {
    const status = statuses.get(lesson.lessonId);
    if (status === "COMPLETED") completedLessons += 1;
    else if (status === "IN_PROGRESS" && firstInProgress == null) {
      firstInProgress = lesson;
    } else if (status === "AVAILABLE" && firstAvailable == null) {
      firstAvailable = lesson;
    }
  }

  // Session active : priorité de reprise n°1, même avant toute écriture de mots.
  const activeLesson =
    surah.lessons.find((lesson) => activeSessionLessonIds.has(lesson.lessonId)) ??
    null;

  const nextLesson = activeLesson ?? firstInProgress ?? firstAvailable ?? null;

  const anyStarted =
    completedLessons > 0 || firstInProgress != null || activeLesson != null;

  const status: SurahProgressStatus =
    completedLessons === totalLessons
      ? "completed"
      : anyStarted
        ? "in_progress"
        : "not_started";

  return {
    surahNumber: surah.surahNumber,
    status,
    completedLessons,
    totalLessons,
    nextLessonSlug: nextLesson?.slug ?? null,
    activeLessonSlug: activeLesson?.slug ?? null,
  };
}
