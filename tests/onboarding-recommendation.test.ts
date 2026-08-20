import { describe, expect, it } from "vitest";
import { isOnboardingComplete, recommendStartingSurah } from "../lib/learning/onboarding";

const catalog = [
  { surahNumber: 1, nameArabic: "الفاتحة", nameTransliteration: "Al-Fatihah", lessonCount: 8, formCount: 26, state: "REFERENCE" as const, firstLessonSlug: "basmala" },
  { surahNumber: 108, nameArabic: "الكوثر", nameTransliteration: "Al-Kawthar", lessonCount: 3, formCount: 10, state: "READY" as const, firstLessonSlug: "surah-108-ayah-1" },
  { surahNumber: 112, nameArabic: "الإخلاص", nameTransliteration: "Al-Ikhlas", lessonCount: 4, formCount: 13, state: "READY" as const, firstLessonSlug: "surah-112-ayah-1" },
  { surahNumber: 107, nameArabic: "الماعون", nameTransliteration: "Al-Ma'un", lessonCount: 7, formCount: 23, state: "IN_PREPARATION" as const, firstLessonSlug: "surah-107-ayah-1" },
];

const emptyProfile = { dailyDuration: null, arabicReadingLevel: null, preferredSurahNumber: null };

describe("recommendStartingSurah", () => {
  it("choisit Al-Fatihah par défaut", () => {
    expect(recommendStartingSurah(emptyProfile, catalog)?.surahNumber).toBe(1);
  });

  it("respecte un choix explicite READY", () => {
    expect(recommendStartingSurah({ ...emptyProfile, preferredSurahNumber: 112 }, catalog)?.surahNumber).toBe(112);
  });

  it("refuse un choix IN_PREPARATION et retombe sur Al-Fatihah", () => {
    expect(recommendStartingSurah({ ...emptyProfile, preferredSurahNumber: 107 }, catalog)?.surahNumber).toBe(1);
  });

  it("privilégie une sourate courte seulement sans choix explicite", () => {
    expect(recommendStartingSurah({ ...emptyProfile, dailyDuration: 5 }, catalog)?.surahNumber).toBe(108);
  });

  it("ne laisse pas la durée courte écraser un choix explicite", () => {
    expect(recommendStartingSurah({ ...emptyProfile, dailyDuration: 5, preferredSurahNumber: 112 }, catalog)?.surahNumber).toBe(112);
  });

  it("n'utilise pas MASAQ ou des données pédagogiques absentes du catalogue", () => {
    const withoutPreparation = catalog.filter((item) => item.surahNumber !== 107);
    expect(recommendStartingSurah(emptyProfile, withoutPreparation)?.surahNumber).toBe(1);
  });

  it("retourne null si aucune sourate n'est démarrable", () => {
    expect(recommendStartingSurah(emptyProfile, [catalog[3]])).toBeNull();
  });
});

describe("onboarding version gate", () => {
  it("requires the new version even when the legacy flag is true", () => {
    expect(isOnboardingComplete({ onboarded: true, onboarding_version: 1 })).toBe(false);
  });

  it("accepts only a completed current version", () => {
    expect(isOnboardingComplete({ onboarded: false, onboarding_version: 2 })).toBe(false);
    expect(isOnboardingComplete({ onboarded: true, onboarding_version: 2 })).toBe(true);
  });
});
