import { describe, expect, it } from "vitest";
import {
  computeSurahProgress,
  type SurahProgressLesson,
} from "@/lib/learning/surah-progress";
import type { UserWordProgress } from "@/types/learning";

function lesson(lessonId: string, slug: string, wordIds: string[]): SurahProgressLesson {
  return { lessonId, slug, wordIds };
}

function progressRow(wordId: string, status: UserWordProgress["status"]): UserWordProgress {
  return {
    id: `${wordId}-row`,
    user_id: "user-1",
    word_id: wordId,
    status,
    mastery: status === "mastered" ? 100 : 0,
    correct_count: 0,
    incorrect_count: 0,
    last_seen_at: null,
    next_review_at: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };
}

/** Sourate de `count` leçons, chaque leçon ayant 2 mots `is_new`. */
function buildSurah(count = 8) {
  return {
    surahNumber: 103,
    lessons: Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return lesson(`lesson-${n}`, `slug-${n}`, [`w${n}-1`, `w${n}-2`]);
    }),
  };
}

/** Marque les `upTo` premières leçons comme terminées (mots `mastered`). */
function completedMap(lessons: SurahProgressLesson[], upTo: number): Map<string, UserWordProgress> {
  const map = new Map<string, UserWordProgress>();
  for (const l of lessons.slice(0, upTo)) {
    for (const w of l.wordIds) map.set(w, progressRow(w, "mastered"));
  }
  return map;
}

describe("computeSurahProgress", () => {
  it("not_started : aucune activité", () => {
    const surah = buildSurah();
    const result = computeSurahProgress(surah, new Map(), new Set());
    expect(result.status).toBe("not_started");
    expect(result.completedLessons).toBe(0);
    expect(result.totalLessons).toBe(8);
    expect(result.nextLessonSlug).toBe("slug-1");
    expect(result.activeLessonSlug).toBeNull();
  });

  it("in_progress : 1 / 8 leçons terminées", () => {
    const surah = buildSurah();
    const result = computeSurahProgress(surah, completedMap(surah.lessons, 1), new Set());
    expect(result.status).toBe("in_progress");
    expect(result.completedLessons).toBe(1);
    expect(result.totalLessons).toBe(8);
    expect(result.nextLessonSlug).toBe("slug-2");
  });

  it("completed : 8 / 8 leçons terminées", () => {
    const surah = buildSurah();
    const result = computeSurahProgress(surah, completedMap(surah.lessons, 8), new Set());
    expect(result.status).toBe("completed");
    expect(result.completedLessons).toBe(8);
    expect(result.totalLessons).toBe(8);
    expect(result.nextLessonSlug).toBeNull();
  });

  it("active session → in_progress, même sans mots persistés", () => {
    const surah = buildSurah();
    const result = computeSurahProgress(surah, new Map(), new Set(["lesson-1"]));
    expect(result.status).toBe("in_progress");
    expect(result.activeLessonSlug).toBe("slug-1");
    expect(result.nextLessonSlug).toBe("slug-1");
  });

  it("active session prioritaire sur la leçon disponible", () => {
    const surah = buildSurah();
    const result = computeSurahProgress(surah, completedMap(surah.lessons, 2), new Set(["lesson-3"]));
    expect(result.status).toBe("in_progress");
    expect(result.activeLessonSlug).toBe("slug-3");
    expect(result.nextLessonSlug).toBe("slug-3");
    expect(result.completedLessons).toBe(2);
  });

  it("mixed : 3 terminées + session active + reste non commencé → in_progress", () => {
    const surah = buildSurah();
    const result = computeSurahProgress(surah, completedMap(surah.lessons, 3), new Set(["lesson-4"]));
    expect(result.status).toBe("in_progress");
    expect(result.completedLessons).toBe(3);
    expect(result.nextLessonSlug).toBe("slug-4");
  });

  it("une leçon en cours (mots partiels) → in_progress sans leçon terminée", () => {
    const surah = buildSurah(1);
    const map = new Map<string, UserWordProgress>([
      ["w1-1", progressRow("w1-1", "mastered")],
      ["w1-2", progressRow("w1-2", "learning")],
    ]);
    const result = computeSurahProgress(surah, map, new Set());
    expect(result.status).toBe("in_progress");
    expect(result.completedLessons).toBe(0);
    expect(result.nextLessonSlug).toBe("slug-1");
  });

  it("sourate sans leçon → état contrôlé, aucun CTA", () => {
    const result = computeSurahProgress({ surahNumber: 1, lessons: [] }, new Map(), new Set());
    expect(result.status).toBe("not_started");
    expect(result.totalLessons).toBe(0);
    expect(result.completedLessons).toBe(0);
    expect(result.nextLessonSlug).toBeNull();
    expect(result.activeLessonSlug).toBeNull();
  });

  it("déterministe et sans mutation (deux utilisateurs à activité identique → même statut)", () => {
    const surah = buildSurah();
    const map = completedMap(surah.lessons, 3);
    const sessions = new Set(["lesson-4"]);
    const lessonsSnapshot = JSON.stringify(surah.lessons);
    const mapSnapshot = JSON.stringify([...map.entries()]);

    const first = computeSurahProgress(surah, map, sessions);
    const second = computeSurahProgress(surah, map, sessions);

    expect(first).toEqual(second);
    expect(first.status).toBe("in_progress");
    expect(JSON.stringify(surah.lessons)).toBe(lessonsSnapshot);
    expect(JSON.stringify([...map.entries()])).toBe(mapSnapshot);
  });

  it("ne prend aucune préférence déclarative en entrée (activité réelle uniquement)", () => {
    // La fonction est volontairement dépourvue de paramètre « préférences » :
    // seul le triptyque (leçons, progression des mots, sessions actives) compte.
    const surah = buildSurah();
    const noActivity = computeSurahProgress(surah, new Map(), new Set());
    // Même avec une hypothétique préférence, l'état reste not_started tant que
    // l'activité réelle est vide (ici représenté par l'absence de toute donnée).
    expect(noActivity.status).toBe("not_started");
  });
});
