// Options et libellés partagés des préférences d'apprentissage.
// Source unique utilisée par /profile (rows + sous-pages) et l'ancien
// formulaire LearningPreferences. Les valeurs sont celles de user_settings.

import type {
  ArabicReadingLevel,
  DailyGoalType,
  LearningGoal,
  LearningPace,
  QuranFamiliarity,
} from "@/types/learning";

export const LEARNING_GOAL_OPTIONS: readonly (readonly [LearningGoal, string])[] = [
  ["understand_recitation", "Mieux comprendre ce que je récite"],
  ["memorize_vocabulary", "Mémoriser les mots du Coran"],
  ["understand_surahs", "Comprendre progressivement les sourates"],
  ["build_vocabulary", "Enrichir mon vocabulaire arabe coranique"],
  ["start_gently", "Je veux simplement commencer"],
] as const;

export const ARABIC_READING_LEVEL_OPTIONS: readonly (readonly [ArabicReadingLevel, string])[] = [
  ["beginner", "Je commence tout juste"],
  ["letters", "Je reconnais les lettres"],
  ["slow", "Je peux lire lentement"],
  ["correct", "Je lis correctement"],
  ["fluent", "Je lis couramment le Coran"],
] as const;

export const QURAN_FAMILIARITY_OPTIONS: readonly (readonly [QuranFamiliarity, string])[] = [
  ["beginner", "Je découvre encore le Coran"],
  ["some_surahs", "Je connais quelques sourates"],
  ["regular_recitation", "Je récite régulièrement"],
  ["many_surahs", "Je connais beaucoup de sourates"],
  ["complete_reading", "Je lis ou récite régulièrement l’ensemble du Coran"],
] as const;

export const LEARNING_PACE_OPTIONS: readonly (readonly [LearningPace, string])[] = [
  ["daily_short", "Un peu chaque jour"],
  ["some_days", "Quelques fois par semaine"],
  ["flexible", "Quand j’ai le temps"],
  ["unknown", "Je ne sais pas encore"],
] as const;

/** Durées (en minutes) affichées comme chaînes pour le sélecteur. */
export const DAILY_DURATION_OPTIONS: readonly (readonly [string, string])[] = [
  ["5", "5 min par jour"],
  ["10", "10 min par jour"],
  ["15", "15 min par jour"],
  ["20", "20 min par jour"],
  ["30", "Plus de 20 minutes"],
] as const;

export const DAILY_GOAL_TYPE_LABELS: Record<DailyGoalType, string> = {
  lessons: "Leçons par jour",
  words: "Mots par jour",
};

const DAILY_GOAL_UNIT: Record<DailyGoalType, string> = {
  lessons: "leçons",
  words: "mots",
};

function labelOf(options: readonly (readonly [string, string])[], value: string | null | undefined): string | null {
  if (value == null) return null;
  const found = options.find(([v]) => v === value);
  return found ? found[1] : null;
}

export const learningGoalLabel = (value: LearningGoal | null | undefined) => labelOf(LEARNING_GOAL_OPTIONS, value);
export const arabicReadingLevelLabel = (value: ArabicReadingLevel | null | undefined) => labelOf(ARABIC_READING_LEVEL_OPTIONS, value);
export const quranFamiliarityLabel = (value: QuranFamiliarity | null | undefined) => labelOf(QURAN_FAMILIARITY_OPTIONS, value);
export const learningPaceLabel = (value: LearningPace | null | undefined) => labelOf(LEARNING_PACE_OPTIONS, value);
export const dailyDurationLabel = (value: 5 | 10 | 15 | 20 | 30 | null | undefined) => labelOf(DAILY_DURATION_OPTIONS, value == null ? null : String(value));

/** Libellé de l'objectif quotidien : « 5 mots par jour » / « 3 leçons par jour ». */
export function dailyGoalLabel(type: DailyGoalType, value: number): string {
  return `${value} ${DAILY_GOAL_UNIT[type]} par jour`;
}
