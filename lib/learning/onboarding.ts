import type {
  ArabicReadingLevel,
  LearningGoal,
  LearningPace,
  QuranFamiliarity,
} from "@/types/learning";

export type OnboardingProfile = {
  displayName: string | null;
  learningGoal: LearningGoal | null;
  arabicReadingLevel: ArabicReadingLevel | null;
  quranFamiliarity: QuranFamiliarity | null;
  dailyDuration: 5 | 10 | 15 | 20 | 30 | null;
  learningPace: LearningPace | null;
  preferredSurahNumber: number | null;
};

export const CURRENT_ONBOARDING_VERSION = 2;

export type OnboardingSettingsState = {
  onboarded: boolean;
  onboarding_version: number;
};

export function isOnboardingComplete(settings: OnboardingSettingsState | null | undefined): boolean {
  return Boolean(settings?.onboarded && settings.onboarding_version >= CURRENT_ONBOARDING_VERSION);
}

export type RecommendationCatalogItem = {
  surahNumber: number;
  nameArabic: string;
  nameTransliteration: string;
  lessonCount: number;
  formCount: number;
  state: "REFERENCE" | "READY" | "IN_PREPARATION";
  firstLessonSlug: string | null;
};

export const DAILY_DURATIONS = [5, 10, 15, 20, 30] as const;

export function isLearningGoal(value: unknown): value is LearningGoal {
  return ["understand_recitation", "memorize_vocabulary", "understand_surahs", "build_vocabulary", "start_gently"].includes(value as LearningGoal);
}

export function isArabicReadingLevel(value: unknown): value is ArabicReadingLevel {
  return ["beginner", "letters", "slow", "correct", "fluent"].includes(value as ArabicReadingLevel);
}

export function isQuranFamiliarity(value: unknown): value is QuranFamiliarity {
  return ["beginner", "some_surahs", "regular_recitation", "many_surahs", "complete_reading"].includes(value as QuranFamiliarity);
}

export function isLearningPace(value: unknown): value is LearningPace {
  return ["daily_short", "some_days", "flexible", "unknown"].includes(value as LearningPace);
}

export function isDailyDuration(value: unknown): value is (typeof DAILY_DURATIONS)[number] {
  return DAILY_DURATIONS.includes(value as (typeof DAILY_DURATIONS)[number]);
}

export function isStartableSurah(item: RecommendationCatalogItem): boolean {
  return item.state === "REFERENCE" || item.state === "READY";
}

/** Recommandation volontairement simple : préférences, puis parcours court, puis Al-Fātiḥah. */
export function recommendStartingSurah<T extends RecommendationCatalogItem>(
  profile: Pick<OnboardingProfile, "dailyDuration" | "arabicReadingLevel" | "preferredSurahNumber">,
  catalog: T[],
): T | null {
  const startable = catalog.filter(isStartableSurah);
  const explicit = profile.preferredSurahNumber == null
    ? null
    : startable.find((item) => item.surahNumber === profile.preferredSurahNumber) ?? null;
  if (explicit) return explicit;

  const shortPreference = profile.dailyDuration === 5 || profile.dailyDuration === 10
    || profile.arabicReadingLevel === "beginner";
  if (shortPreference) {
    const shortest = [...startable].sort(
      (a, b) => a.lessonCount - b.lessonCount || a.surahNumber - b.surahNumber,
    )[0];
    if (shortest) return shortest;
  }

  return startable.find((item) => item.surahNumber === 1)
    ?? [...startable].sort((a, b) => a.lessonCount - b.lessonCount || a.surahNumber - b.surahNumber)[0]
    ?? null;
}

export function profileFromSettings(settings: {
  display_name: string | null;
  learning_goal: LearningGoal | null;
  arabic_reading_level: ArabicReadingLevel | null;
  quran_familiarity: QuranFamiliarity | null;
  daily_duration: 5 | 10 | 15 | 20 | 30 | null;
  learning_pace: LearningPace | null;
  preferred_surah_number: number | null;
}): OnboardingProfile {
  return {
    displayName: settings.display_name,
    learningGoal: settings.learning_goal,
    arabicReadingLevel: settings.arabic_reading_level,
    quranFamiliarity: settings.quran_familiarity,
    dailyDuration: settings.daily_duration,
    learningPace: settings.learning_pace,
    preferredSurahNumber: settings.preferred_surah_number,
  };
}
