"use server";

// Server Actions Phase 5/6 — persistance réelle.
//
// Orchestration de la chaîne Phase 3 :
//   validateAnswer / scoreAnswer (côté client, moteur pur)
//   → replayWordResults (Learning Engine + Review Engine)
//   → upsert user_word_progress / review_items (Supabase, RLS auth.uid()).
//
// Phase 6 — activité quotidienne :
//   - l'activité n'est JAMAIS enregistrée avant que la persistance
//     pédagogique correspondante ait réussi ;
//   - toutes les écritures d'activité sont des INSERT … ON CONFLICT DO NOTHING
//     sur clés naturelles UNIQUE (idempotence garantie par la base) ;
//   - les mots d'une lesson proviennent de lesson_words (côté serveur), jamais
//     du client ;
//   - une erreur d'ACTIVITÉ n'échoue jamais la persistance pédagogique
//     (sinon un retry rejouerait des mots déjà persistés → double avancement) :
//     l'action retourne `activityRecorded: false` et le client termine
//     l'enregistrement via les actions dédiées `recordLessonActivityOnly` /
//     `recordWordActivityOnly` (idempotentes, aucune régression pédagogique).
//
// Aucune donnée n'est attribuée à un utilisateur non authentifié.

import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  replayWordResults,
  type SkillAttempt,
  type WordAttempts,
} from "@/lib/learning/session";
import type { ProgressState } from "@/lib/learning/progress";
import { MAX_REVIEW_INTERVAL_DAYS, type ReviewState } from "@/lib/review";
import { applySkillAttempt, retentionLevel } from "@/lib/learning/skill-progress";
import type { SkillProgressState } from "@/lib/learning/skill-progress";
import type { Skill } from "@/lib/learning/skills";
import {
  getUserReviewItems,
  getUserWordProgress,
  progressStateFromRow,
} from "@/lib/learning/queries";
import {
  getActivityDate,
  insertUserSettings,
  updateUserSettings,
  getUserSettings,
  ACTIVITY_LESSON_CONFLICT,
  ACTIVITY_WORD_CONFLICT,
} from "@/lib/learning/activity";
import { runLessonSubmission, type LessonResultsResult } from "./lesson-submit";
import {
  getWordOccurrencesPage,
  type WordOccurrenceWithContext,
} from "@/lib/learning/queries";
import type {
  ArabicReadingLevel,
  DailyGoalType,
  LearningGoal,
  LearningPace,
  QuranFamiliarity,
  UserWordProgress,
} from "@/types/learning";
import { getSurahCatalog } from "@/lib/learning/queries";
import {
  isArabicReadingLevel,
  isDailyDuration,
  isLearningGoal,
  isLearningPace,
  isQuranFamiliarity,
  CURRENT_ONBOARDING_VERSION,
  isOnboardingComplete,
} from "@/lib/learning/onboarding";

export type ActionResult = {
  ok: boolean;
  error?: string;
};

/**
 * Valide une date de révision calculée AVANT envoi à Supabase (Phase 63A).
 *
 * - `NaN` / date non parseable → erreur explicite (le calcul est fautif) ;
 * - date au-delà de `now + MAX_REVIEW_INTERVAL_DAYS` → erreur explicite (un
 *   intervalle SRS non borné a produit une année aberrante, ex. 13 510).
 *
 * On LÈVE une erreur plutôt que de remplacer la date : le but est de détecter
 * le bug (le doublage sans borne du LeitnerScheduler), jamais de le masquer
 * avec une date arbitraire. La borne documentée vit dans
 * `lib/review/scheduler.ts` (`MAX_REVIEW_INTERVAL_DAYS`).
 */
function assertValidReviewDate(
  value: string | null | undefined,
  field: string,
  now: Date,
): void {
  if (value == null) return; // null est un état valide (jamais révisé).
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) {
    throw new Error(
      `${field} invalide : "${value}" (date non parseable). La progression n'a pas été enregistrée.`,
    );
  }
  const maxHorizon = now.getTime() + MAX_REVIEW_INTERVAL_DAYS * 86_400_000;
  if (ms > maxHorizon) {
    throw new Error(
      `${field} aberrante : "${value}" dépasse l'horizon SRS maximal de ${MAX_REVIEW_INTERVAL_DAYS} jours. La progression n'a pas été enregistrée.`,
    );
  }
}

/** Applique les réponses d'un mot à la base (progression + SRS), atomiquement. */
async function persistWordAttempts(
  client: SupabaseClient,
  userId: string,
  wordId: string,
  attempts: boolean[],
  now = new Date(),
): Promise<void> {
  const [progressRows, reviewRows] = await Promise.all([
    getUserWordProgress(client, userId, [wordId]),
    getUserReviewItems(client, userId, [wordId]),
  ]);

  const progressRow = progressRows.get(wordId) ?? null;
  const reviewRow = reviewRows.get(wordId) ?? null;
  const intervalDays = reviewRow?.interval_days ?? 0;

  const previous: ProgressState | null = progressStateFromRow(
    progressRow as UserWordProgress | null,
    intervalDays,
  );
  const review: ReviewState | null = reviewRow
    ? {
        status: reviewRow.status as ReviewState["status"],
        intervalDays: reviewRow.interval_days,
        lastReviewAt: reviewRow.last_review_at,
        nextReviewAt: reviewRow.next_review_at,
      }
    : null;

  const { progress, review: nextReview } = replayWordResults(
    previous,
    review,
    attempts,
    now,
  );

  const nowIso = now.toISOString();

  // Validation de la date calculée AVANT écriture (Phase 63A).
  // Détecte une date invalide ou aberrante plutôt que de l'envoyer : jamais de
  // remplacement silencieux, jamais de masquage d'une erreur de calcul. La
  // borne reprend la constante SRS documentée (MAX_REVIEW_INTERVAL_DAYS).
  assertValidReviewDate(nextReview.nextReviewAt, "next_review_at", now);

  const { error: progressError } = await client
    .from("user_word_progress")
    .upsert(
      {
        user_id: userId,
        word_id: wordId,
        status: progress.status,
        mastery: progress.mastery,
        correct_count: progress.correctCount,
        incorrect_count: progress.incorrectCount,
        last_seen_at: nowIso,
        next_review_at: nextReview.nextReviewAt,
        updated_at: nowIso,
      },
      { onConflict: "user_id,word_id" },
    );
  if (progressError) throw new Error(`user_word_progress : ${progressError.message}`);

  const { error: reviewError } = await client
    .from("review_items")
    .upsert(
      {
        user_id: userId,
        word_id: wordId,
        status: nextReview.status,
        interval_days: nextReview.intervalDays,
        last_review_at: nowIso,
        next_review_at: nextReview.nextReviewAt,
        updated_at: nowIso,
      },
      { onConflict: "user_id,word_id" },
    );
  if (reviewError) throw new Error(`review_items : ${reviewError.message}`);
}

// ---------------------------------------------------------------------------
// Activité quotidienne (Phase 6) — insert-only, idempotent par la base.
// ---------------------------------------------------------------------------

/**
 * Enregistre une lesson complétée dans les journaux d'activité.
 * Les mots viennent de lesson_words (côté serveur — source de vérité, jamais
 * du client). Toutes les écritures sont des INSERT … ON CONFLICT DO NOTHING :
 * re-compléter la même lesson / revoir le même mot le même jour est un no-op.
 */
async function recordLessonActivity(
  client: SupabaseClient,
  userId: string,
  lessonId: string,
  date: string,
): Promise<void> {
  const { data: lwRows, error: lwError } = await client
    .from("lesson_words")
    .select("word_id")
    .eq("lesson_id", lessonId);
  if (lwError) throw new Error(`lesson_words : ${lwError.message}`);

  const wordIds = [
    ...new Set((lwRows ?? []).map((r) => (r as { word_id: string }).word_id)),
  ];

  const { error: lessonError } = await client
    .from("user_activity_lessons")
    .upsert(
      { user_id: userId, activity_date: date, lesson_id: lessonId },
      { onConflict: ACTIVITY_LESSON_CONFLICT, ignoreDuplicates: true },
    );
  if (lessonError) throw new Error(`user_activity_lessons : ${lessonError.message}`);

  if (wordIds.length > 0) {
    const { error: wordsError } = await client.from("user_activity_words").upsert(
      wordIds.map((wordId) => ({
        user_id: userId,
        activity_date: date,
        word_id: wordId,
      })),
      { onConflict: ACTIVITY_WORD_CONFLICT, ignoreDuplicates: true },
    );
    if (wordsError) throw new Error(`user_activity_words : ${wordsError.message}`);
  }
}

/** Enregistre un mot révisé dans le journal d'activité (insert-only). */
async function recordWordActivity(
  client: SupabaseClient,
  userId: string,
  wordId: string,
  date: string,
): Promise<void> {
  const { error } = await client
    .from("user_activity_words")
    .upsert(
      { user_id: userId, activity_date: date, word_id: wordId },
      { onConflict: ACTIVITY_WORD_CONFLICT, ignoreDuplicates: true },
    );
  if (error) throw new Error(`user_activity_words : ${error.message}`);
}

// ---------------------------------------------------------------------------
// submitLessonResults / recordReviewAnswer
// ---------------------------------------------------------------------------

export type { LessonResultsResult } from "./lesson-submit";

/**
 * Enregistre les résultats d'une leçon terminée pour un utilisateur connecté.
 *
 * Ordre : persistance pédagogique (mots) → activité quotidienne (non bloquante).
 * Contrat : success (tout persisté) / partial (une partie persistée, retry des
 * mots restants) / failed (aucun mot persisté). Une erreur d'activité ne fait
 * JAMAIS échouer la progression : `status: "success"` + `activitySaved: false`.
 */
export async function submitLessonResults(
  lessonId: string,
  results: WordAttempts[],
): Promise<LessonResultsResult> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return {
      ok: false,
      status: "failed",
      savedWordIds: [],
      pendingWordIds: results.map((r) => r.wordId),
      activitySaved: false,
      errorCode: "AUTH",
      retryable: false,
      error: "Connecte-toi pour enregistrer ta progression.",
    };
  }

  const now = new Date();
  return runLessonSubmission(
    results,
    (wordId, attempts) => persistWordAttempts(client, user.id, wordId, attempts, now),
    () => recordLessonActivity(client, user.id, lessonId, getActivityDate(now)),
  );
}

/**
 * Enregistre la réponse d'un mot en session de révision.
 * Une erreur d'activité n'échoue pas la persistance pédagogique.
 */
export async function recordReviewAnswer(
  wordId: string,
  correct: boolean,
): Promise<ActionResult & { activityRecorded?: boolean }> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return { ok: false, error: "Connecte-toi pour sauvegarder ta révision." };
  }

  const now = new Date();
  try {
    await persistWordAttempts(client, user.id, wordId, [correct]);
  } catch (err) {
    console.error("recordReviewAnswer failed:", err);
    return {
      ok: false,
      error: "Impossible d'enregistrer la révision. Réessaie.",
      activityRecorded: false,
    };
  }

  try {
    await recordWordActivity(client, user.id, wordId, getActivityDate(now));
    return { ok: true, activityRecorded: true };
  } catch (err) {
    console.error("recordWordActivity failed:", err);
    return { ok: true, activityRecorded: false };
  }
}

// ---------------------------------------------------------------------------
// Maîtrise par compétence (Phase 23F) — couche additive de user_word_progress.
// ---------------------------------------------------------------------------

export type SkillAttemptInput = SkillAttempt;

/**
 * Persiste UNE réponse de compétence (lecture-modification-écriture au niveau
 * du client). La maîtrise est recalculée par `applySkillAttempt` (précision +
 * récence : les erreurs diminuent le niveau, une erreur récente plafonne d'un
 * cran). Pour une compétence de RAPPEL, la rétention dérivée est recalculée.
 */
async function persistSkillAttempt(
  client: SupabaseClient,
  userId: string,
  wordId: string,
  skill: Skill,
  correct: boolean,
): Promise<void> {
  const { data, error: readError } = await client
    .from("user_word_skill_progress")
    .select(
      "correct_count, incorrect_count, current_streak, last_correct_at, last_incorrect_at",
    )
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .eq("skill", skill)
    .maybeSingle();
  if (readError) throw new Error(`user_word_skill_progress : ${readError.message}`);

  const row = data as {
    correct_count: number;
    incorrect_count: number;
    current_streak: number;
    last_correct_at: string | null;
    last_incorrect_at: string | null;
  } | null;

  const previous: SkillProgressState | null = row
    ? {
        skill,
        correctCount: row.correct_count,
        incorrectCount: row.incorrect_count,
        currentStreak: row.current_streak,
        lastCorrectAt: row.last_correct_at,
        lastIncorrectAt: row.last_incorrect_at,
        mastery: 0,
        lastAttemptAt: null,
      }
    : null;

  const next = applySkillAttempt(previous, correct);

  const { error } = await client
    .from("user_word_skill_progress")
    .upsert(
      {
        user_id: userId,
        word_id: wordId,
        skill,
        correct_count: next.correctCount,
        incorrect_count: next.incorrectCount,
        current_streak: next.currentStreak,
        last_correct_at: next.lastCorrectAt,
        last_incorrect_at: next.lastIncorrectAt,
        mastery: next.mastery,
        last_attempt_at: next.lastAttemptAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,word_id,skill" },
    );
  if (error) throw new Error(`user_word_skill_progress : ${error.message}`);

  // La rétention se nourrit du rappel : après un essai de rappel, recalcule et
  // persiste la rétention dérivée (agrégat des deux compétences de rappel + délai).
  if (skill === "form_to_meaning" || skill === "meaning_to_form") {
    await persistRetention(client, userId, wordId);
  }
}

/** Horodatage le plus récent d'une liste (null si aucune valeur). */
function maxTimestamp(values: Array<string | null>): string | null {
  const present = values.filter((v): v is string => v != null);
  if (present.length === 0) return null;
  return present.reduce((a, b) => (a > b ? a : b));
}

/**
 * Recalcule et persiste la RÉTENTION d'un mot : dérivée du délai écoulé depuis
 * le dernier rappel réussi (sans échec intercurrent), agrégée sur les deux
 * compétences de rappel (form_to_meaning + meaning_to_form). Ce n'est pas un
 * compteur de réussites — c'est la preuve que la connaissance a survécu un délai.
 */
async function persistRetention(
  client: SupabaseClient,
  userId: string,
  wordId: string,
): Promise<void> {
  const { data, error: readError } = await client
    .from("user_word_skill_progress")
    .select("skill, correct_count, incorrect_count, last_correct_at, last_incorrect_at")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .in("skill", ["form_to_meaning", "meaning_to_form"]);
  if (readError) throw new Error(`user_word_skill_progress : ${readError.message}`);

  const rows = (data ?? []) as Array<{
    skill: string;
    correct_count: number;
    incorrect_count: number;
    last_correct_at: string | null;
    last_incorrect_at: string | null;
  }>;

  const totalCorrect = rows.reduce((s, r) => s + r.correct_count, 0);
  const totalIncorrect = rows.reduce((s, r) => s + r.incorrect_count, 0);
  const lastCorrectAt = maxTimestamp(rows.map((r) => r.last_correct_at));
  const lastIncorrectAt = maxTimestamp(rows.map((r) => r.last_incorrect_at));
  const now = new Date();
  const level = retentionLevel(
    { correctCount: totalCorrect, incorrectCount: totalIncorrect, lastCorrectAt, lastIncorrectAt },
    now,
  );
  const nowIso = now.toISOString();

  const { error } = await client
    .from("user_word_skill_progress")
    .upsert(
      {
        user_id: userId,
        word_id: wordId,
        skill: "retention",
        correct_count: totalCorrect,
        incorrect_count: totalIncorrect,
        current_streak: 0,
        last_correct_at: lastCorrectAt,
        last_incorrect_at: lastIncorrectAt,
        mastery: level,
        last_attempt_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "user_id,word_id,skill" },
    );
  if (error) throw new Error(`user_word_skill_progress : ${error.message}`);
}

/**
 * Enregistre des réponses de compétence (multi-dimensionnel). Appelée APRÈS la
 * persistance pédagogique agrégée (user_word_progress/review_items) ; une erreur
 * ici n'échoue pas la session de leçon (couche additive, best-effort).
 */
export async function submitSkillAttempts(
  attempts: SkillAttemptInput[],
): Promise<ActionResult> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Connecte-toi pour enregistrer ta progression." };

  try {
    for (const attempt of attempts) {
      await persistSkillAttempt(client, user.id, attempt.wordId, attempt.skill, attempt.correct);
    }
    return { ok: true };
  } catch (err) {
    console.error("submitSkillAttempts failed:", err);
    return { ok: false, error: "Impossible d'enregistrer la maîtrise. Réessaie." };
  }
}

// ---------------------------------------------------------------------------
// Activité « seulement » (retry sans rejouer la progression pédagogique)
// ---------------------------------------------------------------------------

/**
 * Termine l'enregistrement d'activité d'une lesson déjà persistée.
 * Idempotent (INSERT … ON CONFLICT DO NOTHING) : re-appeler est sans effet.
 * Aucune modification de user_word_progress / review_items.
 */
export async function recordLessonActivityOnly(
  lessonId: string,
): Promise<ActionResult & { activityRecorded?: boolean }> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Connecte-toi." };

  try {
    await recordLessonActivity(client, user.id, lessonId, getActivityDate(new Date()));
    return { ok: true, activityRecorded: true };
  } catch (err) {
    console.error("recordLessonActivityOnly failed:", err);
    return { ok: false, error: "Impossible d'enregistrer l'activité. Réessaie." };
  }
}

/**
 * Termine l'enregistrement d'activité d'un mot déjà persisté.
 * Idempotent. Aucune modification de user_word_progress / review_items.
 */
export async function recordWordActivityOnly(
  wordId: string,
): Promise<ActionResult & { activityRecorded?: boolean }> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Connecte-toi." };

  try {
    await recordWordActivity(client, user.id, wordId, getActivityDate(new Date()));
    return { ok: true, activityRecorded: true };
  } catch (err) {
    console.error("recordWordActivityOnly failed:", err);
    return { ok: false, error: "Impossible d'enregistrer l'activité. Réessaie." };
  }
}

// ---------------------------------------------------------------------------
// F1 — Fiche mot : page d'occurrences suivante (« Afficher plus »)
// ---------------------------------------------------------------------------

/** Retourne la page suivante d'occurrences d'un mot (données réelles). */
export async function getWordOccurrencesPageAction(
  wordId: string,
  offset: number,
  limit = 8,
): Promise<{ ok: boolean; occurrences?: WordOccurrenceWithContext[]; error?: string }> {
  const client = await createClient();
  try {
    const occurrences = await getWordOccurrencesPage(client, wordId, offset, limit);
    return { ok: true, occurrences };
  } catch (err) {
    console.error("getWordOccurrencesPageAction failed:", err);
    return { ok: false, error: "Impossible de charger la suite des occurrences." };
  }
}

// ---------------------------------------------------------------------------
// Session persistante (Phase 24E) — état minimal d'une leçon en cours
// ---------------------------------------------------------------------------

export type LessonSessionSnapshot = {
  lessonId: string;
  currentExerciseIndex: number;
  results: WordAttempts[];
  skillAttempts: SkillAttempt[];
};

/**
 * Sauvegarde l'état minimal de session (position + réponses en attente).
 * La séquence d'exercices est déterministe et reconstruite au chargement : on
 * ne persiste PAS les questions. Idempotent (upsert sur user_id + lesson_id).
 */
export async function saveLessonSession(
  snapshot: LessonSessionSnapshot,
): Promise<ActionResult> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: true }; // anonyme : rien à sauvegarder (no-op).

  try {
    const { error } = await client.from("lesson_sessions").upsert(
      {
        user_id: user.id,
        lesson_id: snapshot.lessonId,
        status: "in_progress",
        current_exercise_index: snapshot.currentExerciseIndex,
        results: snapshot.results,
        skill_attempts: snapshot.skillAttempts,
        last_activity_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (err) {
    console.error("saveLessonSession failed:", err);
    return { ok: false, error: "Impossible de sauvegarder la session." };
  }
}

/** Supprime la session d'une leçon (terminée — leçon complétée proprement). */
export async function clearLessonSession(
  lessonId: string,
): Promise<ActionResult> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: true };

  try {
    const { error } = await client
      .from("lesson_sessions")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (err) {
    console.error("clearLessonSession failed:", err);
    return { ok: false, error: "Impossible de nettoyer la session." };
  }
}

// ---------------------------------------------------------------------------
// Objectif quotidien (F3) + Onboarding (F6)
// ---------------------------------------------------------------------------
/** Met à jour l'objectif quotidien (profil) — valeurs validées côté serveur. */
export async function updateDailyGoal(
  goalType: DailyGoalType,
  goalValue: number,
): Promise<ActionResult> {
  if (goalType !== "lessons" && goalType !== "words") {
    return { ok: false, error: "Type d'objectif invalide." };
  }
  if (!Number.isInteger(goalValue) || goalValue <= 0) {
    return { ok: false, error: "La valeur de l'objectif doit être un entier positif." };
  }

  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Connecte-toi pour modifier ton objectif." };

  try {
    await updateUserSettings(client, user.id, {
      dailyGoalType: goalType,
      dailyGoalValue: goalValue,
    });
    return { ok: true };
  } catch (err) {
    console.error("updateDailyGoal failed:", err);
    return { ok: false, error: "Impossible de modifier l'objectif. Réessaie." };
  }
}

/** Termine l'onboarding (préférences + objectif quotidien par défaut words/5). */
export async function completeOnboarding(
  profile: {
    displayName?: string | null;
    learningGoal?: LearningGoal | null;
    arabicReadingLevel?: ArabicReadingLevel | null;
    quranFamiliarity?: QuranFamiliarity | null;
    dailyDuration?: 5 | 10 | 15 | 20 | 30 | null;
    learningPace?: LearningPace | null;
    preferredSurahNumber?: number | null;
  },
): Promise<ActionResult> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Connecte-toi pour continuer." };

  if (profile.learningGoal != null && !isLearningGoal(profile.learningGoal)) return { ok: false, error: "Objectif d’apprentissage invalide." };
  if (profile.arabicReadingLevel != null && !isArabicReadingLevel(profile.arabicReadingLevel)) return { ok: false, error: "Niveau de lecture invalide." };
  if (profile.quranFamiliarity != null && !isQuranFamiliarity(profile.quranFamiliarity)) return { ok: false, error: "Familiarité avec le Coran invalide." };
  if (profile.dailyDuration != null && !isDailyDuration(profile.dailyDuration)) return { ok: false, error: "Durée quotidienne invalide." };
  if (profile.learningPace != null && !isLearningPace(profile.learningPace)) return { ok: false, error: "Rythme d’apprentissage invalide." };

  const type: DailyGoalType = "words";
  const value = 5;

  const displayName = profile.displayName?.trim() || null;
  if (displayName && displayName.length > 60) return { ok: false, error: "Le nom doit rester court (60 caractères maximum)." };
  const catalog = await getSurahCatalog(client);
  const selectedSurah = profile.preferredSurahNumber == null
    ? null
    : catalog.find((item) => item.surahNumber === profile.preferredSurahNumber);
  if (profile.preferredSurahNumber != null && (!selectedSurah || selectedSurah.state === "IN_PREPARATION")) {
    return { ok: false, error: "Cette sourate n’est pas encore disponible pour commencer." };
  }

  try {
    const settings = await client
      .from("user_settings")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (settings.error) throw new Error(`user_settings : ${settings.error.message}`);

    if (settings.data) {
      await updateUserSettings(client, user.id, {
        dailyGoalType: type,
        dailyGoalValue: value,
        onboarded: true,
        onboardingVersion: CURRENT_ONBOARDING_VERSION,
        displayName,
        learningGoal: profile.learningGoal ?? null,
        arabicReadingLevel: profile.arabicReadingLevel ?? null,
        quranFamiliarity: profile.quranFamiliarity ?? null,
        dailyDuration: profile.dailyDuration ?? null,
        learningPace: profile.learningPace ?? null,
        preferredSurahNumber: selectedSurah?.surahNumber ?? null,
      });
    } else {
      await insertUserSettings(client, user.id, {
        dailyGoalType: type,
        dailyGoalValue: value,
        onboarded: true,
        onboardingVersion: CURRENT_ONBOARDING_VERSION,
        displayName,
        learningGoal: profile.learningGoal ?? null,
        arabicReadingLevel: profile.arabicReadingLevel ?? null,
        quranFamiliarity: profile.quranFamiliarity ?? null,
        dailyDuration: profile.dailyDuration ?? null,
        learningPace: profile.learningPace ?? null,
        preferredSurahNumber: selectedSurah?.surahNumber ?? null,
      });
    }
    return { ok: true };
  } catch (err) {
    console.error("completeOnboarding failed:", err);
    return { ok: false, error: "Impossible de terminer l'onboarding. Réessaie." };
  }
}

/** Met à jour les préférences sans toucher à la progression pédagogique. */
export async function updateLearningPreferences(
  profile: {
    displayName?: string | null;
    learningGoal?: LearningGoal | null;
    arabicReadingLevel?: ArabicReadingLevel | null;
    quranFamiliarity?: QuranFamiliarity | null;
    dailyDuration?: 5 | 10 | 15 | 20 | 30 | null;
    learningPace?: LearningPace | null;
    preferredSurahNumber?: number | null;
  },
): Promise<ActionResult> {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false, error: "Connecte-toi pour modifier tes préférences." };
  if (profile.learningGoal != null && !isLearningGoal(profile.learningGoal)) return { ok: false, error: "Objectif d’apprentissage invalide." };
  if (profile.arabicReadingLevel != null && !isArabicReadingLevel(profile.arabicReadingLevel)) return { ok: false, error: "Niveau de lecture invalide." };
  if (profile.quranFamiliarity != null && !isQuranFamiliarity(profile.quranFamiliarity)) return { ok: false, error: "Familiarité avec le Coran invalide." };
  if (profile.dailyDuration != null && !isDailyDuration(profile.dailyDuration)) return { ok: false, error: "Durée quotidienne invalide." };
  if (profile.learningPace != null && !isLearningPace(profile.learningPace)) return { ok: false, error: "Rythme d’apprentissage invalide." };
  const displayName = profile.displayName?.trim() || null;
  if (displayName && displayName.length > 60) return { ok: false, error: "Le nom doit rester court (60 caractères maximum)." };
  const catalog = await getSurahCatalog(client);
  const selectedSurah = profile.preferredSurahNumber == null
    ? null
    : catalog.find((item) => item.surahNumber === profile.preferredSurahNumber);
  if (profile.preferredSurahNumber != null && (!selectedSurah || selectedSurah.state === "IN_PREPARATION")) {
    return { ok: false, error: "Cette sourate n’est pas encore disponible pour commencer." };
  }
  try {
    await updateUserSettings(client, user.id, {
      displayName,
      learningGoal: profile.learningGoal ?? null,
      arabicReadingLevel: profile.arabicReadingLevel ?? null,
      quranFamiliarity: profile.quranFamiliarity ?? null,
      dailyDuration: profile.dailyDuration ?? null,
      learningPace: profile.learningPace ?? null,
      preferredSurahNumber: selectedSurah?.surahNumber ?? null,
    });
    return { ok: true };
  } catch (err) {
    console.error("updateLearningPreferences failed:", err);
    return { ok: false, error: "Impossible d’enregistrer tes préférences." };
  }
}

async function redirectAfterAuthentication(
  client: SupabaseClient,
  userId: string,
): Promise<never> {
  const settings = await getUserSettings(client, userId);
  redirect(isOnboardingComplete(settings) ? "/dashboard" : "/onboarding");
}

// ---------------------------------------------------------------------------
// Authentification (Supabase Auth) — Session Cookies gérés par @supabase/ssr.
// ---------------------------------------------------------------------------

export type AuthState = {
  error: string | null;
  /** Message informatif (ex. confirmation d'e-mail requise). */
  info: string | null;
};

function authErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Un compte existe déjà avec cette adresse e-mail.";
  }
  if (lower.includes("password should be at least")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  return message;
}

/** Connexion ou création de compte (email + mot de passe). */
export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = String(formData.get("mode") ?? "sign-in");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Renseigne ton e-mail et ton mot de passe.", info: null };
  }

  const client = await createClient();

  if (mode === "sign-up") {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) {
      return { error: authErrorMessage(error.message), info: null };
    }
    // Confirmation d'e-mail requise → l'utilisateur n'est pas encore connecté.
    if (data.user && !data.session) {
      return {
        error: null,
        info: "Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.",
      };
    }
    if (data.user && data.session) await redirectAfterAuthentication(client, data.user.id);
  }

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: authErrorMessage(error.message), info: null };
  }
  const { data: { user } } = await client.auth.getUser();
  if (user) await redirectAfterAuthentication(client, user.id);
  redirect("/login");
}

/** Déconnexion. */
export async function signOut(): Promise<void> {
  const client = await createClient();
  await client.auth.signOut();
  redirect("/");
}
