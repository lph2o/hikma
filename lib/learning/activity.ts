// Activité quotidienne (Phase 6) — couche applicative.
//
// UNE SEULE définition du « jour » : getActivityDate(). Phase 6 = UTC
// (aucune infrastructure de fuseau dans l'architecture actuelle). Aucun autre
// endroit du code ne doit recalculer manuellement la date d'activité.
//
// Idempotence GARANTIE PAR LA BASE : toutes les écritures sont des
// INSERT … ON CONFLICT DO NOTHING sur des clés naturelles UNIQUE. Aucun
// compteur incrémental (+1) nulle part. La progression quotidienne est
// TOUJOURS DÉRIVÉE (COUNT) des journaux insert-only — jamais stockée.
//
// Définitions (validées pré-Phase 6) :
//   - words_studied  = mots DISTINCTS réellement étudiés le jour J (leçons
//     complétées + reviews répondus). Un mot × 6 exercices = 1. La dédup est
//     imposée par UNIQUE(user_id, activity_date, word_id).
//   - lessons_completed = lessons complétées le jour J. Une lesson abandonnée
//     n'est jamais enregistrée (l'activité n'est écrite qu'à la complétion).

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ArabicReadingLevel,
  DailyGoalType,
  LearningGoal,
  LearningPace,
  QuranFamiliarity,
  UserSettings,
} from "@/types/learning";

// ---------------------------------------------------------------------------
// Clés naturelles UNIQUE des journaux d'activité
// ---------------------------------------------------------------------------

/**
 * Colonnes de conflit des écritures d'activité. Elles DOIVENT correspondre
 * EXACTEMENT aux contraintes UNIQUE de la migration 0018 :
 *   - user_activity_lessons_user_date_lesson_key ;
 *   - user_activity_words_user_date_word_key.
 * Toute écriture utilise `.upsert(..., { onConflict, ignoreDuplicates: true })`
 * pour être idempotente (re-compléter une lesson / revoir un mot le même jour
 * = no-op). Ces contraintes ne doivent JAMAIS être supprimées.
 */
export const ACTIVITY_LESSON_CONFLICT = "user_id,activity_date,lesson_id";
export const ACTIVITY_WORD_CONFLICT = "user_id,activity_date,word_id";

// ---------------------------------------------------------------------------
// Définition du jour
// ---------------------------------------------------------------------------

/**
 * Date d'activité (YYYY-MM-DD) pour un instant donné.
 *
 * Phase 6 : UTC uniquement (jour déterministe, cohérent entre rendu serveur
 * et Server Actions). Le paramètre `timeZone` est prévu pour une évolution
 * future (jour local utilisateur) mais n'active AUCUN comportement différent
 * aujourd'hui : il doit rester `undefined` dans toute l'application.
 */
export function getActivityDate(date: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    // en-CA produit YYYY-MM-DD — forme stable, utilisée uniquement si une
    // timezone utilisateur est un jour introduite.
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  }
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// user_settings
// ---------------------------------------------------------------------------

/** Valeur par défaut de l'objectif (même convention que la migration 0018). */
export const DEFAULT_DAILY_GOAL_TYPE: DailyGoalType = "words";
export const DEFAULT_DAILY_GOAL_VALUE = 5;

/** Lit les réglages de l'utilisateur (null si aucune ligne → onboarding requis). */
export async function getUserSettings(
  client: SupabaseClient,
  userId: string,
): Promise<UserSettings | null> {
  const { data, error } = await client
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`user_settings : ${error.message}`);
  return (data ?? null) as UserSettings | null;
}

/** Insère les réglages (onboarding) — idempotent par PK user_id. */
export async function insertUserSettings(
  client: SupabaseClient,
  userId: string,
  settings: {
    dailyGoalType: DailyGoalType;
    dailyGoalValue: number;
    onboarded: boolean;
    onboardingVersion?: number;
    displayName?: string | null;
    learningGoal?: LearningGoal | null;
    arabicReadingLevel?: ArabicReadingLevel | null;
    quranFamiliarity?: QuranFamiliarity | null;
    dailyDuration?: 5 | 10 | 15 | 20 | 30 | null;
    learningPace?: LearningPace | null;
    preferredSurahNumber?: number | null;
  },
): Promise<void> {
  const { error } = await client.from("user_settings").insert({
    user_id: userId,
    daily_goal_type: settings.dailyGoalType,
    daily_goal_value: settings.dailyGoalValue,
    onboarded: settings.onboarded,
    onboarding_version: settings.onboardingVersion ?? 1,
    display_name: settings.displayName ?? null,
    learning_goal: settings.learningGoal ?? null,
    arabic_reading_level: settings.arabicReadingLevel ?? null,
    quran_familiarity: settings.quranFamiliarity ?? null,
    daily_duration: settings.dailyDuration ?? null,
    learning_pace: settings.learningPace ?? null,
    preferred_surah_number: settings.preferredSurahNumber ?? null,
  });
  if (error) throw new Error(`user_settings insert : ${error.message}`);
}

/** Met à jour l'objectif / onboarding — vérifie les valeurs côté serveur. */
export async function updateUserSettings(
  client: SupabaseClient,
  userId: string,
  patch: {
    dailyGoalType?: DailyGoalType;
    dailyGoalValue?: number;
    onboarded?: boolean;
    onboardingVersion?: number;
    displayName?: string | null;
    learningGoal?: LearningGoal | null;
    arabicReadingLevel?: ArabicReadingLevel | null;
    quranFamiliarity?: QuranFamiliarity | null;
    dailyDuration?: 5 | 10 | 15 | 20 | 30 | null;
    learningPace?: LearningPace | null;
    preferredSurahNumber?: number | null;
  },
): Promise<void> {
  const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.dailyGoalType != null) data.daily_goal_type = patch.dailyGoalType;
  if (patch.dailyGoalValue != null) {
    if (!Number.isInteger(patch.dailyGoalValue) || patch.dailyGoalValue <= 0) {
      throw new Error("daily_goal_value doit être un entier positif.");
    }
    data.daily_goal_value = patch.dailyGoalValue;
  }
  if (patch.onboarded != null) data.onboarded = patch.onboarded;
  if (patch.onboardingVersion != null) data.onboarding_version = patch.onboardingVersion;
  if (patch.displayName !== undefined) data.display_name = patch.displayName;
  if (patch.learningGoal !== undefined) data.learning_goal = patch.learningGoal;
  if (patch.arabicReadingLevel !== undefined) data.arabic_reading_level = patch.arabicReadingLevel;
  if (patch.quranFamiliarity !== undefined) data.quran_familiarity = patch.quranFamiliarity;
  if (patch.dailyDuration !== undefined) data.daily_duration = patch.dailyDuration;
  if (patch.learningPace !== undefined) data.learning_pace = patch.learningPace;
  if (patch.preferredSurahNumber !== undefined) data.preferred_surah_number = patch.preferredSurahNumber;

  const { error } = await client
    .from("user_settings")
    .update(data)
    .eq("user_id", userId);
  if (error) throw new Error(`user_settings update : ${error.message}`);
}

// ---------------------------------------------------------------------------
// Activité quotidienne (dérivée des journaux)
// ---------------------------------------------------------------------------

/** Progression quotidienne dérivée des journaux (jamais stockée). */
export type DailyActivity = {
  /** Nombre de lessons complétées ce jour (distinct par (jour, lesson)). */
  lessonsCompleted: number;
  /** Nombre de mots DISTINCTS étudiés ce jour (leçons + reviews). */
  wordsStudied: number;
};

/** Progression réelle d'un jour (COUNT des journaux insert-only). */
export async function getDailyActivity(
  client: SupabaseClient,
  userId: string,
  date: string,
): Promise<DailyActivity> {
  const [lessons, words] = await Promise.all([
    client
      .from("user_activity_lessons")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("activity_date", date),
    client
      .from("user_activity_words")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("activity_date", date),
  ]);
  if (lessons.error) throw new Error(`user_activity_lessons : ${lessons.error.message}`);
  if (words.error) throw new Error(`user_activity_words : ${words.error.message}`);
  return {
    lessonsCompleted: lessons.count ?? 0,
    wordsStudied: words.count ?? 0,
  };
}

/** État de l'objectif quotidien d'un utilisateur pour un jour. */
export type DailyGoalProgress = {
  type: DailyGoalType;
  goalValue: number;
  /** Progression réelle du jour (dérivée). */
  current: number;
  /** true si current >= goalValue. Un dépassement est autorisé. */
  reached: boolean;
  /** 0–100 (borné à 100), arrondi. */
  percent: number;
};

/** Progression d'objectif dérivée des journaux (aucune valeur mutable stockée). */
export async function getDailyGoalProgress(
  client: SupabaseClient,
  userId: string,
  settings: UserSettings | null,
  date: string,
): Promise<DailyGoalProgress> {
  const daily = await getDailyActivity(client, userId, date);
  const type: DailyGoalType = settings?.daily_goal_type ?? DEFAULT_DAILY_GOAL_TYPE;
  const goalValue = settings?.daily_goal_value ?? DEFAULT_DAILY_GOAL_VALUE;
  const current = type === "lessons" ? daily.lessonsCompleted : daily.wordsStudied;
  const percent = goalValue > 0 ? Math.min(100, Math.round((current / goalValue) * 100)) : 0;
  return { type, goalValue, current, reached: current >= goalValue, percent };
}

// ---------------------------------------------------------------------------
// Révisions à venir (F5) — lecture seule de review_items.next_review_at
// ---------------------------------------------------------------------------

/**
 * Nombre de mots dus par jour pour les `days` prochains jours (aujourd'hui
 * inclus). Les jours sans révision apparaissent à 0. Aucune écriture.
 */
export async function getUpcomingReviewCounts(
  client: SupabaseClient,
  userId: string,
  days: number,
  now: Date = new Date(),
): Promise<{ date: string; dueCount: number }[]> {
  const rows = await getUpcomingReviewRows(client, userId, days, now);

  // Remplit TOUS les jours (0 par défaut) puis place les décomptes réels.
  const out: { date: string; dueCount: number }[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + i);
    out.push({ date: getActivityDate(d), dueCount: 0 });
  }
  const byDate = new Map(out.map((r) => [r.date, r]));
  for (const row of rows) {
    const date = getActivityDate(new Date(row.next_review_at));
    const entry = byDate.get(date);
    if (entry) entry.dueCount += 1;
  }
  return out;
}

/** Lignes review_items échues dans les `days` prochains jours (lecture seule). */
async function getUpcomingReviewRows(
  client: SupabaseClient,
  userId: string,
  days: number,
  now: Date,
): Promise<Array<{ next_review_at: string }>> {
  const start = getActivityDate(now);
  const endDate = new Date(now);
  endDate.setUTCDate(endDate.getUTCDate() + (days - 1));
  endDate.setUTCHours(23, 59, 59, 999);
  const end = endDate.toISOString();

  const { data, error } = await client
    .from("review_items")
    .select("next_review_at")
    .eq("user_id", userId)
    .gte("next_review_at", `${start}T00:00:00.000Z`)
    .lte("next_review_at", end);
  if (error) throw new Error(`review_items : ${error.message}`);
  return (data ?? []) as Array<{ next_review_at: string }>;
}

// ---------------------------------------------------------------------------
// Historique (F4) — 30 derniers jours, jours vides à 0
// ---------------------------------------------------------------------------

/** Activité des `days` derniers jours (les jours sans activité valent 0). */
export async function getActivityHistory(
  client: SupabaseClient,
  userId: string,
  days: number,
  now: Date = new Date(),
): Promise<DailyActivity & { days: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }> }> {
  const startDate = new Date(now);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  const start = getActivityDate(startDate);

  const [lessonRows, wordRows] = await Promise.all([
    client
      .from("user_activity_lessons")
      .select("activity_date")
      .eq("user_id", userId)
      .gte("activity_date", start),
    client
      .from("user_activity_words")
      .select("activity_date")
      .eq("user_id", userId)
      .gte("activity_date", start),
  ]);
  if (lessonRows.error) throw new Error(`user_activity_lessons : ${lessonRows.error.message}`);
  if (wordRows.error) throw new Error(`user_activity_words : ${wordRows.error.message}`);

  const lessonCount = new Map<string, number>();
  const wordCount = new Map<string, number>();
  for (const r of (lessonRows.data ?? []) as Array<{ activity_date: string }>) {
    lessonCount.set(r.activity_date, (lessonCount.get(r.activity_date) ?? 0) + 1);
  }
  for (const r of (wordRows.data ?? []) as Array<{ activity_date: string }>) {
    wordCount.set(r.activity_date, (wordCount.get(r.activity_date) ?? 0) + 1);
  }

  const daysOut: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }> = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    const date = getActivityDate(d);
    daysOut.push({
      date,
      lessonsCompleted: lessonCount.get(date) ?? 0,
      wordsStudied: wordCount.get(date) ?? 0,
    });
  }

  return {
    lessonsCompleted: [...lessonCount.values()].reduce((a, b) => a + b, 0),
    wordsStudied: [...wordCount.values()].reduce((a, b) => a + b, 0),
    days: daysOut,
  };
}
