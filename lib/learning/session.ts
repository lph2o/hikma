// Couche d'orchestration de session (Phase 5).
//
// Logique APPLICATIVE pure, indépendante de React et de Supabase :
// - statistiques d'une session (mots étudiés, précision) ;
// - rejeu des réponses d'un mot à travers le Learning Engine + Review Engine
//   (progression, mastery, planification SRS) ;
// - statut d'une leçon (LOCKED / AVAILABLE / IN_PROGRESS / COMPLETED) dérivé
//   de la progression réelle des mots, sans nouvelle table.
//
// La persistance est orchestrée par lib/learning/actions.ts (Server Actions).

import type { ReviewItemStatus, UserWordProgress } from "@/types/learning";
import { applyAnswer, type ProgressState } from "./progress";
import { ReviewEngine, type ReviewState } from "@/lib/review";
import type { Skill } from "./skills";

/** Réponses successives données sur un mot pendant une session. */
export type WordAttempts = {
  wordId: string;
  /** true = bonne réponse, false = mauvaise réponse (ordre chronologique). */
  attempts: boolean[];
};

/** Statistiques agrégées d'une session (leçon ou révision). */
export type SessionStats = {
  /** Nombre de mots réellement étudiés (au moins une réponse). */
  wordsStudied: number;
  total: number;
  correct: number;
  incorrect: number;
  /** Précision en pourcentage, arrondie à l'entier (0 si aucune réponse). */
  accuracy: number;
};

/** Calcule les statistiques d'une session à partir des réponses par mot. */
export function computeSessionStats(results: WordAttempts[]): SessionStats {
  const studied = results.filter((r) => r.attempts.length > 0);
  const total = studied.reduce((sum, r) => sum + r.attempts.length, 0);
  const correct = studied.reduce(
    (sum, r) => sum + r.attempts.filter(Boolean).length,
    0,
  );
  return {
    wordsStudied: studied.length,
    total,
    correct,
    incorrect: total - correct,
    accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}

/** Ajoute une réponse à la liste des tentatives d'un mot (sans doublon de mot). */
export function appendAttempt(
  results: WordAttempts[],
  wordId: string,
  correct: boolean,
): WordAttempts[] {
  const existing = results.find((r) => r.wordId === wordId);
  if (existing) {
    return results.map((r) =>
      r.wordId === wordId ? { ...r, attempts: [...r.attempts, correct] } : r,
    );
  }
  return [...results, { wordId, attempts: [correct] }];
}

/**
 * Mots encore à persister après une tentative partiellement réussie : on
 * écarte les mots déjà enregistrés (anti double avancement lors d'un
 * « Réessayer » après une erreur de persistance).
 */
export function pendingWordAttempts(
  results: WordAttempts[],
  savedWordIds: string[],
): WordAttempts[] {
  return results.filter(
    (r) => r.attempts.length > 0 && !savedWordIds.includes(r.wordId),
  );
}

/** Plafond de la mini-révision de fin de session (Phase 36C). */
export const MAX_MINI_REVIEW_WORDS = 4;

/**
 * Mots candidats à la mini-révision de fin de session (Phase 36C) : ceux ayant
 * reçu AU MOINS une réponse incorrecte pendant la session, dans l'ordre de
 * première rencontre, plafonnés à `max`. Fonction PURE et déterministe.
 *
 * La mini-révision étant une couche de renforcement (auto-évaluation non
 * notée), cette fonction ne produit AUCUN effet sur la progression, la
 * maîtrise ou le SRS : elle sélectionne uniquement des mots à re-présenter.
 */
export function selectMiniReviewWords(
  results: WordAttempts[],
  max: number = MAX_MINI_REVIEW_WORDS,
): string[] {
  const out: string[] = [];
  for (const r of results) {
    if (r.attempts.includes(false)) out.push(r.wordId);
    if (out.length >= max) break;
  }
  return out;
}

/** Compétence ciblée par le retry d'écriture arabe (Phase 36E). */
export const ARABIC_REWRITE_SKILL: Skill = "meaning_to_form";

/**
 * Mots candidats au RETRY D'ÉCRITURE ARABE (Phase 36E) : uniquement les mots
 * ratés sur la compétence `meaning_to_form` (production de la forme arabe),
 * dans l'ordre de première rencontre, dédupliqués, plafonnés à `max`. Pure et
 * déterministe. Aucun effet pédagogique : c'est une sélection de présentation,
 * jamais une nouvelle règle de grading.
 */
export function selectArabicRewriteRetryWords(
  attempts: readonly SkillAttempt[],
  max: number = MAX_MINI_REVIEW_WORDS,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const a of attempts) {
    if (a.skill !== ARABIC_REWRITE_SKILL) continue;
    if (a.correct) continue;
    if (seen.has(a.wordId)) continue;
    seen.add(a.wordId);
    out.push(a.wordId);
    if (out.length >= max) break;
  }
  return out;
}

/** Sélection combinée du renforcement de fin (Phases 36C + 36E). */
export type ReinforcementSelection = {
  /** Mots ratés sur `meaning_to_form` → retry d'écriture arabe. */
  arabicRetryWordIds: string[];
  /** Autres mots incorrects → auto-évaluation (jamais en double avec le retry). */
  selfReviewWordIds: string[];
};

/**
 * Sélection combinée et SANS CHEVAUCHEMENT du renforcement de fin de session :
 * les mots ratés sur `meaning_to_form` vont au retry arabe (plafonné), les
 * AUTRES mots incorrects vont à l'auto-évaluation (plafonnée indépendamment).
 * Tout mot raté sur `meaning_to_form` — même au-delà du plafond — est EXCLU de
 * l'auto-évaluation (il ne doit jamais fuiter dans la mauvaise liste). Pure,
 * déterministe, sans I/O, sans effet pédagogique.
 */
export function selectReinforcementWords(
  results: WordAttempts[],
  skillAttempts: readonly SkillAttempt[],
  maxArabic: number = MAX_MINI_REVIEW_WORDS,
  maxSelf: number = MAX_MINI_REVIEW_WORDS,
): ReinforcementSelection {
  const failedArabicIds: string[] = [];
  const failedArabicSeen = new Set<string>();
  for (const a of skillAttempts) {
    if (a.skill !== ARABIC_REWRITE_SKILL) continue;
    if (a.correct) continue;
    if (failedArabicSeen.has(a.wordId)) continue;
    failedArabicSeen.add(a.wordId);
    failedArabicIds.push(a.wordId);
  }

  const arabicRetryWordIds = failedArabicIds.slice(0, maxArabic);
  const failedArabicSet = new Set(failedArabicIds);

  const selfReviewWordIds: string[] = [];
  for (const r of results) {
    if (!r.attempts.includes(false)) continue;
    if (failedArabicSet.has(r.wordId)) continue;
    selfReviewWordIds.push(r.wordId);
    if (selfReviewWordIds.length >= maxSelf) break;
  }

  return { arabicRetryWordIds, selfReviewWordIds };
}

/** État final d'un mot après rejeu : progression + planification SRS. */
export type ReplayedWord = {
  progress: ProgressState;
  review: ReviewState;
};

/**
 * Rejoue les réponses d'un mot à travers les deux moteurs existants :
 * Review Engine (LeitnerScheduler) puis Learning Engine (applyAnswer).
 * Les états initiaux proviennent de la base (lignes existantes) : chaque
 * réponse est appliquée séquentiellement, de manière déterministe.
 *
 * Ne crée AUCUN second système de progression : c'est la même chaîne
 * validate → score → progress → mastery → review que les moteurs Phase 3.
 */
export function replayWordResults(
  progress: ProgressState | null,
  review: ReviewState | null,
  attempts: boolean[],
  now: Date,
): ReplayedWord {
  const engine = new ReviewEngine();
  const nowIso = now.toISOString();

  let p: ProgressState | null = progress;
  let r: ReviewState | null = review;

  for (const correct of attempts) {
    const schedule = engine.recordAnswer(r, correct, now);
    r = {
      status: schedule.status as ReviewItemStatus,
      intervalDays: schedule.intervalDays,
      lastReviewAt: nowIso,
      nextReviewAt: schedule.nextReviewAt,
    };
    // L'intervalle fourni à applyAnswer est celui issu de la réponse courante
    // (même convention que tests/learning.test.ts).
    p = applyAnswer(p, correct, schedule.intervalDays);
  }

  return {
    progress: (p ?? {
      status: "new",
      correctCount: 0,
      incorrectCount: 0,
      mastery: 0,
      intervalDays: 0,
    }) as ProgressState,
    review: (r ?? {
      status: "learning" as ReviewItemStatus,
      intervalDays: 0,
      lastReviewAt: null,
      nextReviewAt: null,
    }) as ReviewState,
  };
}

/** Une leçon vue sous l'angle du calcul de statut (ses mots). */
export type LessonForStatus = {
  id: string;
  wordIds: string[];
};

/** Statuts qui marquent un mot comme « acquis » (leçon complétée). */
const ACQUIRED = new Set(["familiar", "mastered"]);

/**
 * Statut de chaque leçon, dérivé UNIQUEMENT de la progression réelle des mots
 * (user_word_progress) — aucune donnée inventée, aucune table supplémentaire.
 *
 * Règles déterministes (ordre du curriculum, leçons publiées triées) :
 * - COMPLETED : tous les mots de la leçon ont un statut familiar/mastered ;
 * - LOCKED    : la leçon précédente n'est pas terminée (hors première) ;
 * - IN_PROGRESS : au moins un mot a été rencontré, sans être complète ;
 * - AVAILABLE : déverrouillée et prête à commencer.
 */
export function computeLessonStatuses(
  orderedLessons: LessonForStatus[],
  progressByWord: Map<string, UserWordProgress>,
): Map<string, "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED"> {
  const statuses = new Map<
    string,
    "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED"
  >();

  let previousCompleted = true; // la première leçon du parcours est ouverte.
  for (const lesson of orderedLessons) {
    const rows = lesson.wordIds
      .map((id) => progressByWord.get(id))
      .filter((row): row is UserWordProgress => row != null);

    const hasAllWords = lesson.wordIds.length > 0 && rows.length === lesson.wordIds.length;
    const completed =
      hasAllWords && rows.every((row) => ACQUIRED.has(row.status as string));
    const inProgress =
      !completed && rows.some((row) => row.status !== "new");

    let status: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
    if (completed) status = "COMPLETED";
    else if (!previousCompleted) status = "LOCKED";
    else if (inProgress) status = "IN_PROGRESS";
    else status = "AVAILABLE";

    statuses.set(lesson.id, status);
    previousCompleted = completed;
  }

  return statuses;
}

// ---------------------------------------------------------------------------
// Session persistante (Phase 24E) — état minimal à reprendre
// ---------------------------------------------------------------------------

/** Réponse de compétence collectée pendant une session (avant persistance). */
export type SkillAttempt = { wordId: string; skill: Skill; correct: boolean };

/**
 * État minimal d'une session de leçon à reprendre. La séquence d'exercices est
 * DÉTERMINISTE (lesson + maîtrise + données) : on ne persiste pas les questions,
 * seulement la position et les réponses en attente de rejeu.
 */
export type LessonSessionState = {
  currentExerciseIndex: number;
  results: WordAttempts[];
  skillAttempts: SkillAttempt[];
};

/** Borne l'index de reprise dans la séquence régénérée (jamais hors limites). */
export function clampSessionIndex(
  savedIndex: number,
  exercisesCount: number,
): number {
  if (exercisesCount <= 0) return 0;
  return Math.max(0, Math.min(savedIndex, exercisesCount - 1));
}

/** true si la session contient une progression réelle à reprendre (hors découverte). */
export function hasSessionProgress(state: LessonSessionState): boolean {
  return (
    state.currentExerciseIndex > 0 ||
    state.results.length > 0 ||
    state.skillAttempts.length > 0
  );
}
