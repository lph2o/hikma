import type { ISODateString, UUID } from "@/types";

// Types de domaine pédagogique — reflètent exactement le schéma PostgreSQL
// (supabase/migrations/0010..0017.sql). Colonnes en snake_case.

/** Statut de publication d'une leçon. */
export type LessonStatus = "draft" | "published" | "archived";

/** Statut d'apprentissage d'un mot pour un utilisateur. */
export type WordStatus = "new" | "learning" | "familiar" | "mastered";

/** Statut de planification de la répétition espacée. */
export type ReviewItemStatus = "learning" | "review" | "relearning";

/** Parcours d'apprentissage (table `learning_paths`). */
export type LearningPath = {
  id: UUID;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  /** Sourate de référence ; nullable pour les parcours historiques. */
  surah_id: UUID | null;
  created_at: ISODateString;
};

/** Unité d'un parcours (table `units`). */
export type Unit = {
  id: UUID;
  path_id: UUID;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: ISODateString;
};

/** Leçon d'une unité (table `lessons`). */
export type Lesson = {
  id: UUID;
  unit_id: UUID;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  difficulty: number;
  objective: string | null;
  status: LessonStatus;
  created_at: ISODateString;
  updated_at: ISODateString;
};

/** Sélection d'un mot coranique dans une leçon (table `lesson_words`). */
export type LessonWord = {
  id: UUID;
  lesson_id: UUID;
  word_id: UUID;
  position: number;
  is_new: boolean;
  importance: number;
  created_at: ISODateString;
};

/** Exercice d'une leçon (table `exercises`). */
export type Exercise = {
  id: UUID;
  lesson_id: UUID;
  type: string;
  position: number;
  difficulty: number;
  prompt: string;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
};

/** Option de réponse d'un exercice (table `exercise_options`). */
export type ExerciseOption = {
  id: UUID;
  exercise_id: UUID;
  position: number;
  content: string;
  is_correct: boolean;
  word_id: UUID | null;
  created_at: ISODateString;
};

/** Progression d'un utilisateur sur un mot (table `user_word_progress`). */
export type UserWordProgress = {
  id: UUID;
  user_id: UUID;
  word_id: UUID;
  status: WordStatus;
  mastery: number;
  correct_count: number;
  incorrect_count: number;
  last_seen_at: ISODateString | null;
  next_review_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
};

/** Compétence de maîtrise (table `user_word_skill_progress`). */
export type WordSkill =
  | "form_recognition"
  | "meaning_recognition"
  | "form_to_meaning"
  | "meaning_to_form"
  | "audio_recognition"
  | "context_recognition"
  | "lemma_relation"
  | "retention";

/** Progression d'un utilisateur sur une compétence d'un mot (table `user_word_skill_progress`). */
export type UserWordSkillProgress = {
  id: UUID;
  user_id: UUID;
  word_id: UUID;
  skill: WordSkill;
  correct_count: number;
  incorrect_count: number;
  mastery: number;
  last_attempt_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
};

/** État de planification SRS (table `review_items`). */
export type ReviewItem = {
  id: UUID;
  user_id: UUID;
  word_id: UUID;
  status: ReviewItemStatus;
  interval_days: number;
  last_review_at: ISODateString | null;
  next_review_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
};

/** Type d'objectif quotidien (table `user_settings`). */
export type DailyGoalType = "lessons" | "words";

export type LearningGoal =
  | "understand_recitation"
  | "memorize_vocabulary"
  | "understand_surahs"
  | "build_vocabulary"
  | "start_gently";
export type ArabicReadingLevel = "beginner" | "letters" | "slow" | "correct" | "fluent";
export type QuranFamiliarity =
  | "beginner"
  | "some_surahs"
  | "regular_recitation"
  | "many_surahs"
  | "complete_reading";
export type LearningPace = "daily_short" | "some_days" | "flexible" | "unknown";

/** Réglages utilisateur (table `user_settings`). */
export type UserSettings = {
  user_id: UUID;
  daily_goal_type: DailyGoalType;
  daily_goal_value: number;
  onboarded: boolean;
  onboarding_version: number;
  display_name: string | null;
  learning_goal: LearningGoal | null;
  arabic_reading_level: ArabicReadingLevel | null;
  quran_familiarity: QuranFamiliarity | null;
  daily_duration: 5 | 10 | 15 | 20 | 30 | null;
  learning_pace: LearningPace | null;
  preferred_surah_number: number | null;
  /** IANA timezone (ex. Europe/Paris). Null = UTC (fallback). */
  timezone: string | null;
  /** Rappel quotidien activé. Défaut false (opt-in). */
  reminder_enabled: boolean;
  /** Heure locale du rappel (HH:MM, 24h). Défaut "19:00". */
  reminder_time: string;
  created_at: ISODateString;
  updated_at: ISODateString;
};

/** Journal d'activité : une lesson complétée un jour (table `user_activity_lessons`). */
export type UserActivityLesson = {
  id: UUID;
  user_id: UUID;
  activity_date: string;
  lesson_id: UUID;
  created_at: ISODateString;
};

/** Journal d'activité : un mot distinct étudié un jour (table `user_activity_words`). */
export type UserActivityWord = {
  id: UUID;
  user_id: UUID;
  activity_date: string;
  word_id: UUID;
  created_at: ISODateString;
};
