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
 * Sans timeZone : UTC (comportement historique, déterministe).
 * Avec timeZone : jour local utilisateur (Phase 77).
 */
export function getActivityDate(date: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    // en-CA produit YYYY-MM-DD — forme stable, indépendante du fuseau système.
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Convertit un timestamp (ISO 8601 ou Date) en date locale YYYY-MM-DD
 * selon le timezone IANA de l'utilisateur. Sans timezone → UTC.
 *
 * Phase 77 — fondation heure locale.
 * Pure, sans I/O, testable isolément.
 */
export function getLocalDateKey(
  timestamp: string | Date,
  timezone?: string | null,
): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  if (!timezone) return getActivityDate(date);
  return getActivityDate(date, timezone);
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
    timezone?: string | null;
    reminderEnabled?: boolean;
    reminderTime?: string;
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
    timezone: settings.timezone ?? null,
    reminder_enabled: settings.reminderEnabled ?? false,
    reminder_time: settings.reminderTime ?? "19:00",
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
    timezone?: string | null;
    reminderEnabled?: boolean;
    reminderTime?: string;
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
  if (patch.timezone !== undefined) data.timezone = patch.timezone;
  if (patch.reminderEnabled !== undefined) data.reminder_enabled = patch.reminderEnabled;
  if (patch.reminderTime !== undefined) data.reminder_time = patch.reminderTime;

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
 * Phase 77 : utilise le jour local si `timezone` est fourni.
 */
export async function getUpcomingReviewCounts(
  client: SupabaseClient,
  userId: string,
  days: number,
  now: Date = new Date(),
  timezone?: string | null,
): Promise<{ date: string; dueCount: number }[]> {
  const rows = await getUpcomingReviewRows(client, userId, days, now);

  // Remplit TOUS les jours (0 par défaut) puis place les décomptes réels.
  const out: { date: string; dueCount: number }[] = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + i);
    out.push({ date: getLocalDateKey(d, timezone), dueCount: 0 });
  }
  const byDate = new Map(out.map((r) => [r.date, r]));
  for (const row of rows) {
    const date = getLocalDateKey(new Date(row.next_review_at), timezone);
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

/** Activité des `days` derniers jours (les jours sans activité valent 0).
 * Phase 77 : si `timezone` fourni, les dates sont dérivées des timestamps
 * `created_at` convertis en jour local. Sans timezone, comportement UTC
 * historique via `activity_date`. */
export async function getActivityHistory(
  client: SupabaseClient,
  userId: string,
  days: number,
  now: Date = new Date(),
  timezone?: string | null,
): Promise<DailyActivity & { days: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }> }> {
  const startDate = new Date(now);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  const start = getLocalDateKey(startDate, timezone);

  const [lessonRows, wordRows] = await Promise.all([
    client
      .from("user_activity_lessons")
      .select(timezone ? "created_at" : "activity_date")
      .eq("user_id", userId)
      .gte(timezone ? "created_at" : "activity_date", timezone ? startDate.toISOString() : start),
    client
      .from("user_activity_words")
      .select(timezone ? "created_at" : "activity_date")
      .eq("user_id", userId)
      .gte(timezone ? "created_at" : "activity_date", timezone ? startDate.toISOString() : start),
  ]);
  if (lessonRows.error) throw new Error(`user_activity_lessons : ${lessonRows.error.message}`);
  if (wordRows.error) throw new Error(`user_activity_words : ${wordRows.error.message}`);

  const lessonCount = new Map<string, number>();
  const wordCount = new Map<string, number>();

  if (timezone) {
    for (const r of (lessonRows.data ?? []) as Array<{ created_at: string }>) {
      const date = getLocalDateKey(r.created_at, timezone);
      lessonCount.set(date, (lessonCount.get(date) ?? 0) + 1);
    }
    for (const r of (wordRows.data ?? []) as Array<{ created_at: string }>) {
      const date = getLocalDateKey(r.created_at, timezone);
      wordCount.set(date, (wordCount.get(date) ?? 0) + 1);
    }
  } else {
    for (const r of (lessonRows.data ?? []) as Array<{ activity_date: string }>) {
      lessonCount.set(r.activity_date, (lessonCount.get(r.activity_date) ?? 0) + 1);
    }
    for (const r of (wordRows.data ?? []) as Array<{ activity_date: string }>) {
      wordCount.set(r.activity_date, (wordCount.get(r.activity_date) ?? 0) + 1);
    }
  }

  const daysOut: Array<{ date: string; lessonsCompleted: number; wordsStudied: number }> = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    const date = getLocalDateKey(d, timezone);
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

// ---------------------------------------------------------------------------
// Régularité (Phase 73) — jours d'apprentissage distincts
// ---------------------------------------------------------------------------

/**
 * Récupère TOUS les jours distincts avec activité pédagogique pour un
 * utilisateur. Combine les dates des deux journaux (user_activity_lessons +
 * user_activity_words), déduplique et trie (ordre chronologique).
 *
 * Phase 77 : si `timezone` est fourni, dérive les dates locales à partir des
 * timestamps `created_at` (UTC → local via IANA). Sans timezone, utilise les
 * dates `activity_date` stockées (comportement UTC historique).
 *
 * Aucune nouvelle table : les journaux existants sont la source de vérité.
 * Utilisé par le module pur `lib/learning/regularity.ts` pour calculer
 * le streak, le record et la régularité hebdomadaire.
 */
export async function getDistinctLearningDays(
  client: SupabaseClient,
  userId: string,
  timezone?: string | null,
): Promise<string[]> {
  const [lessonRows, wordRows] = await Promise.all([
    client
      .from("user_activity_lessons")
      .select(timezone ? "created_at" : "activity_date")
      .eq("user_id", userId),
    client
      .from("user_activity_words")
      .select(timezone ? "created_at" : "activity_date")
      .eq("user_id", userId),
  ]);
  if (lessonRows.error)
    throw new Error(`user_activity_lessons : ${lessonRows.error.message}`);
  if (wordRows.error)
    throw new Error(`user_activity_words : ${wordRows.error.message}`);

  const dates = new Set<string>();
  if (timezone) {
    for (const row of (lessonRows.data ?? []) as Array<{ created_at: string }>) {
      dates.add(getLocalDateKey(row.created_at, timezone));
    }
    for (const row of (wordRows.data ?? []) as Array<{ created_at: string }>) {
      dates.add(getLocalDateKey(row.created_at, timezone));
    }
  } else {
    for (const row of (lessonRows.data ?? []) as Array<{ activity_date: string }>) {
      dates.add(row.activity_date);
    }
    for (const row of (wordRows.data ?? []) as Array<{ activity_date: string }>) {
      dates.add(row.activity_date);
    }
  }

  return [...dates].sort();
}
