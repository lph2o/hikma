import { describe, expect, it } from "vitest";
import {
  selectActiveLearningPath,
  summarizeSurahProgress,
  type ActivePathCatalogItem,
} from "@/lib/learning/active-path";
import type { SurahProgress } from "@/lib/learning/surah-progress";

function catalogItem(
  over: Partial<ActivePathCatalogItem> & Pick<ActivePathCatalogItem, "surahNumber">,
): ActivePathCatalogItem {
  return {
    nameArabic: `س${over.surahNumber}`,
    nameTransliteration: `Sourate ${over.surahNumber}`,
    lessonCount: 8,
    state: "READY",
    firstLessonSlug: `surah-${over.surahNumber}-lesson-1`,
    ...over,
  };
}

function fatihah(over: Partial<ActivePathCatalogItem> = {}): ActivePathCatalogItem {
  return catalogItem({
    surahNumber: 1,
    nameTransliteration: "Al-Fātiḥah",
    state: "REFERENCE",
    ...over,
  });
}

function asr(over: Partial<ActivePathCatalogItem> = {}): ActivePathCatalogItem {
  return catalogItem({
    surahNumber: 103,
    nameTransliteration: "Al-ʿAṣr",
    lessonCount: 3,
    ...over,
  });
}

function progress(
  surahNumber: number,
  status: SurahProgress["status"],
  completedLessons: number,
  totalLessons: number,
  nextLessonSlug: string | null,
  activeLessonSlug: string | null = null,
): SurahProgress {
  return {
    surahNumber,
    status,
    completedLessons,
    totalLessons,
    nextLessonSlug,
    activeLessonSlug,
  };
}

describe("selectActiveLearningPath — hiérarchie parcours actif", () => {
  it("A. aucune progression → recommandation Al-Fātiḥah", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [],
      activeSession: null,
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.kind).toBe("recommendation");
    expect(selection.surahNumber).toBe(1);
    expect(selection.lessonSlug).toBe("surah-1-lesson-1");
  });

  it("B. progression Al-ʿAṣr → parcours actif Al-ʿAṣr", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [progress(103, "in_progress", 1, 3, "surah-103-lesson-2")],
      activeSession: null,
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.kind).toBe("in_progress");
    expect(selection.surahNumber).toBe(103);
    expect(selection.lessonSlug).toBe("surah-103-lesson-2");
  });

  it("C. session active Al-ʿAṣr → Reprendre Al-ʿAṣr (priorité absolue)", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [progress(103, "in_progress", 0, 3, "surah-103-lesson-1", "surah-103-lesson-1")],
      activeSession: { surahNumber: 103, lessonSlug: "surah-103-lesson-1" },
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.kind).toBe("active_session");
    expect(selection.surahNumber).toBe(103);
    expect(selection.lessonSlug).toBe("surah-103-lesson-1");
  });

  it("D. préférence Al-Fātiḥah + progression Al-ʿAṣr → progression gagne", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [progress(103, "in_progress", 2, 3, "surah-103-lesson-3")],
      activeSession: null,
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.surahNumber).toBe(103);
    expect(selection.kind).toBe("in_progress");
  });

  it("F. Al-Fātiḥah terminée + Al-ʿAṣr en cours → Al-ʿAṣr", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [
        progress(1, "completed", 8, 8, null),
        progress(103, "in_progress", 1, 3, "surah-103-lesson-2"),
      ],
      activeSession: null,
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.surahNumber).toBe(103);
    expect(selection.kind).toBe("in_progress");
  });

  it("H. aucune progression + préférence Al-ʿAṣr → Pour toi Al-ʿAṣr", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [],
      activeSession: null,
      recommendation: { surahNumber: 103, firstLessonSlug: "surah-103-lesson-1" },
      catalog,
    });
    expect(selection.kind).toBe("recommendation");
    expect(selection.surahNumber).toBe(103);
  });

  it("I. préférence Al-ʿAṣr sans progression → jamais in_progress (pas de Continuer)", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [],
      activeSession: null,
      recommendation: { surahNumber: 103, firstLessonSlug: "surah-103-lesson-1" },
      catalog,
    });
    expect(selection.kind).not.toBe("in_progress");
    expect(selection.kind).not.toBe("active_session");
  });

  it("session active sur sourate IN_PREPARATION → ignorée (jamais sélectionnée)", () => {
    const catalog = [
      fatihah(),
      catalogItem({ surahNumber: 107, nameTransliteration: "Al-Māʿūn", state: "IN_PREPARATION", firstLessonSlug: null }),
    ];
    const selection = selectActiveLearningPath({
      progress: [progress(107, "in_progress", 0, 4, "surah-107-lesson-1", "surah-107-lesson-1")],
      activeSession: { surahNumber: 107, lessonSlug: "surah-107-lesson-1" },
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.surahNumber).toBe(1);
    expect(selection.kind).toBe("recommendation");
  });

  it("IN_PREPARATION jamais dans in_progress même avec données de progression", () => {
    const catalog = [
      fatihah(),
      catalogItem({ surahNumber: 107, nameTransliteration: "Al-Māʿūn", state: "IN_PREPARATION", firstLessonSlug: null }),
    ];
    const selection = selectActiveLearningPath({
      progress: [progress(107, "in_progress", 2, 4, "surah-107-lesson-3")],
      activeSession: null,
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.surahNumber).toBe(1);
  });

  it("plusieurs in_progress → la plus avancée (déterministe)", () => {
    const catalog = [fatihah(), asr(), catalogItem({ surahNumber: 108, nameTransliteration: "Al-Kawthar", lessonCount: 2 })];
    const selection = selectActiveLearningPath({
      progress: [
        progress(103, "in_progress", 2, 3, "surah-103-lesson-3"),
        progress(108, "in_progress", 1, 2, "surah-108-lesson-2"),
      ],
      activeSession: null,
      recommendation: null,
      catalog,
    });
    expect(selection.surahNumber).toBe(103);
  });

  it("catalogue vide → none", () => {
    const selection = selectActiveLearningPath({
      progress: [],
      activeSession: null,
      recommendation: null,
      catalog: [],
    });
    expect(selection.kind).toBe("none");
    expect(selection.surahNumber).toBeNull();
  });

  it("fallback Al-Fātiḥah quand aucune recommandation", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [],
      activeSession: null,
      recommendation: null,
      catalog,
    });
    expect(selection.kind).toBe("fallback");
    expect(selection.surahNumber).toBe(1);
  });

  it("recommandation vers sourate déjà terminée → pas de Découvrir (fallback vers non commencée)", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [progress(1, "completed", 8, 8, null)],
      activeSession: null,
      // Recommandation brute pointe vers Al-Fātiḥah… déjà terminée.
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.kind).toBe("fallback");
    expect(selection.surahNumber).toBe(103);
  });

  it("toutes les sourates terminées → all_done (jamais Découvrir une sourate terminée)", () => {
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [
        progress(1, "completed", 8, 8, null),
        progress(103, "completed", 3, 3, null),
      ],
      activeSession: null,
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.kind).toBe("all_done");
    expect(selection.lessonSlug).toBeNull();
  });

  it("ne prend aucune préférence déclarative en entrée (activité réelle uniquement)", () => {
    // La fonction est dépourvue de paramètre « préférences » : seul le triptyque
    // (progression, session active, recommandation) compte. Ici, avec une
    // progression réelle sur 103, toute hypothétique préférence vers 1 est ignorée.
    const catalog = [fatihah(), asr()];
    const selection = selectActiveLearningPath({
      progress: [progress(103, "in_progress", 1, 3, "surah-103-lesson-2")],
      activeSession: null,
      recommendation: { surahNumber: 1, firstLessonSlug: "surah-1-lesson-1" },
      catalog,
    });
    expect(selection.surahNumber).toBe(103);
  });
});

describe("summarizeSurahProgress — résumé global", () => {
  it("compte les sourates démarrables uniquement (IN_PREPARATION exclue)", () => {
    const catalog = [
      fatihah(),
      asr(),
      catalogItem({ surahNumber: 107, nameTransliteration: "Al-Māʿūn", state: "IN_PREPARATION", firstLessonSlug: null }),
    ];
    const summary = summarizeSurahProgress(
      [
        progress(1, "completed", 8, 8, null),
        progress(103, "in_progress", 1, 3, "surah-103-lesson-2"),
        progress(107, "in_progress", 2, 4, "surah-107-lesson-3"),
      ],
      catalog,
    );
    expect(summary.availableSurahs).toBe(2);
    expect(summary.startedSurahs).toBe(1);
    expect(summary.completedSurahs).toBe(1);
    expect(summary.completedLessons).toBe(9);
    expect(summary.totalLessons).toBe(11);
  });

  it("catalogue vide → zéros contrôlés", () => {
    const summary = summarizeSurahProgress([], []);
    expect(summary).toEqual({
      startedSurahs: 0,
      completedSurahs: 0,
      availableSurahs: 0,
      completedLessons: 0,
      totalLessons: 0,
    });
  });
});
