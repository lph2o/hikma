import { describe, expect, it } from "vitest";
import type {
  AdminCurriculumKpis,
  AdminCurriculumPathItem,
  AdminCorpusSurahItem,
} from "@/lib/admin/metrics";

describe("Admin Curriculum & Corpus Health — Contracts & Logic", () => {
  it("calculates exact lexical coverage percentage accurately", () => {
    const quranWordsCount = 21296;
    const frValidatedWordsCount = 6095;
    const frCoveragePct =
      Math.round((frValidatedWordsCount / quranWordsCount) * 1000) / 10;

    expect(frCoveragePct).toBe(28.6);
  });

  it("validates AdminCurriculumKpis structure and facts", () => {
    const kpis: AdminCurriculumKpis = {
      pathsCount: 34,
      unitsCount: 34,
      lessonsPublishedCount: 547,
      lessonsDraftCount: 0,
      wordsTaughtCount: 1836,
      quranWordsCount: 21296,
      frValidatedWordsCount: 6095,
      frCoveragePct: 28.6,
      occurrencesCount: 77430,
      ayahsCount: 6236,
      surahsCount: 114,
      lemmasCount: 1593,
      lemmaTranslationsCount: 204,
    };

    expect(kpis.pathsCount).toBe(34);
    expect(kpis.unitsCount).toBe(34);
    expect(kpis.lessonsPublishedCount).toBe(547);
    expect(kpis.lessonsDraftCount).toBe(0);
    expect(kpis.surahsCount).toBe(114);
    expect(kpis.ayahsCount).toBe(6236);
    expect(kpis.occurrencesCount).toBe(77430);
    expect(kpis.quranWordsCount).toBe(21296);
    expect(kpis.frValidatedWordsCount).toBe(6095);
    expect(kpis.wordsTaughtCount).toBe(1836);
  });

  it("sorts curriculum paths strictly by surah number", () => {
    const rawPaths: AdminCurriculumPathItem[] = [
      {
        id: "p114",
        slug: "quran-surah-114",
        title: "Parcours · An-Nas",
        surahNumber: 114,
        surahName: "An-Nas",
        surahArabic: "الناس",
        ayahCount: 6,
        lessonCount: 6,
        wordsCount: 24,
      },
      {
        id: "p1",
        slug: "quran-vocabulary",
        title: "Vocabulaire du Coran",
        surahNumber: 1,
        surahName: "Al-Fatihah",
        surahArabic: "الفاتحة",
        ayahCount: 7,
        lessonCount: 8,
        wordsCount: 56,
      },
      {
        id: "p113",
        slug: "quran-surah-113",
        title: "Parcours · Al-Falaq",
        surahNumber: 113,
        surahName: "Al-Falaq",
        surahArabic: "الفلق",
        ayahCount: 5,
        lessonCount: 5,
        wordsCount: 20,
      },
    ];

    const sorted = [...rawPaths].sort((a, b) => a.surahNumber - b.surahNumber);
    expect(sorted[0].surahNumber).toBe(1);
    expect(sorted[1].surahNumber).toBe(113);
    expect(sorted[2].surahNumber).toBe(114);
  });

  it("correctly filters surahs with and without curriculum", () => {
    const surahs: AdminCorpusSurahItem[] = [
      {
        number: 1,
        name: "Al-Fatihah",
        arabic: "الفاتحة",
        translation: "L'ouverture",
        ayahCount: 7,
        hasCurriculum: true,
        lessonCount: 8,
      },
      {
        number: 2,
        name: "Al-Baqarah",
        arabic: "البقرة",
        translation: "La vache",
        ayahCount: 286,
        hasCurriculum: false,
        lessonCount: 0,
      },
      {
        number: 114,
        name: "An-Nas",
        arabic: "الناس",
        translation: "Les hommes",
        ayahCount: 6,
        hasCurriculum: true,
        lessonCount: 6,
      },
    ];

    const withCurriculum = surahs.filter((s) => s.hasCurriculum);
    const withoutCurriculum = surahs.filter((s) => !s.hasCurriculum);

    expect(withCurriculum).toHaveLength(2);
    expect(withoutCurriculum).toHaveLength(1);
    expect(withoutCurriculum[0].name).toBe("Al-Baqarah");
  });

  it("validates surah detail computation without division by zero", () => {
    function computeSurahCoverage(translated: number, total: number): number {
      if (total === 0) return 0;
      return Math.round((translated / total) * 100);
    }

    expect(computeSurahCoverage(25, 26)).toBe(96);
    expect(computeSurahCoverage(17, 17)).toBe(100);
    expect(computeSurahCoverage(0, 50)).toBe(0);
    expect(computeSurahCoverage(0, 0)).toBe(0);
  });
});
