import { describe, expect, it } from "vitest";
import {
  buildLessonPlan,
  buildWordBank,
  hasUsableWords,
  orderCurriculum,
  validateCurriculum,
} from "../lib/learning";
import type { Lesson, LearningPath, Unit } from "../types/learning";
import type { QuranWord } from "../types/quran";
import type { LessonWordWithWord } from "../lib/learning";

// Fixtures STRUCTURELLES (ids et titres de test — pas de données coraniques).
const PATH: LearningPath = {
  id: "path-1",
  slug: "test",
  title: "Test",
  description: null,
  sort_order: 1,
  surah_id: null,
  created_at: "2026-01-01T00:00:00Z",
};

function unit(id: string, pathId: string, order: number): Unit {
  return {
    id,
    path_id: pathId,
    slug: `unit-${id}`,
    title: `Unité ${id}`,
    description: null,
    sort_order: order,
    created_at: "2026-01-01T00:00:00Z",
  };
}

function lesson(id: string, unitId: string, order: number, status: Lesson["status"] = "published"): Lesson {
  return {
    id,
    unit_id: unitId,
    slug: `lesson-${id}`,
    title: `Leçon ${id}`,
    description: null,
    sort_order: order,
    difficulty: 1,
    objective: null,
    status,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

const WORD: QuranWord = {
  id: "word-1",
  arabic: "بِسْمِ",
  transliteration: "bis'mi",
  meaning: "In (the) name",
  root: null,
  lemma_id: null,
  source_id: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("buildWordBank", () => {
  const lw: LessonWordWithWord = {
    id: "lw-1",
    lesson_id: "lesson-1",
    word_id: WORD.id,
    position: 1,
    is_new: true,
    importance: 1,
    created_at: "2026-01-01T00:00:00Z",
    word: WORD,
  };

  it("mappe les mots vers les entrées du bank", () => {
    const bank = buildWordBank([lw]);
    expect(bank).toHaveLength(1);
    expect(bank[0].wordId).toBe(WORD.id);
    expect(bank[0].arabic).toBe("بِسْمِ");
    expect(bank[0].meaning).toBe("In (the) name");
  });
});

describe("buildLessonPlan", () => {
  it("ordonne les mots par position", () => {
    const base = {
      id: "lw",
      lesson_id: "lesson-1",
      is_new: true,
      importance: 1,
      created_at: "2026-01-01T00:00:00Z",
    };
    const lw2: LessonWordWithWord = {
      ...base,
      id: "lw-2",
      position: 2,
      word_id: "w2",
      word: { ...WORD, id: "w2", arabic: "ٱللَّهِ" },
    };
    const lw1: LessonWordWithWord = {
      ...base,
      id: "lw-1",
      position: 1,
      word_id: "w1",
      word: WORD,
    };
    const plan = buildLessonPlan(lesson("l", "u", 1), [lw2, lw1]);
    expect(plan.words.map((w) => w.position)).toEqual([1, 2]);
    expect(plan.exerciseTypes.length).toBeGreaterThan(0);
    expect(hasUsableWords(plan)).toBe(true);
  });
});

describe("validateCurriculum", () => {
  const mk = (overrides?: {
    unitOrders?: number[];
    lessonOrders?: number[];
    lessonStatus?: Lesson["status"];
    orphanUnit?: boolean;
    orphanLesson?: boolean;
  }) => {
    const u1 = unit("u1", PATH.id, overrides?.unitOrders?.[0] ?? 1);
    const u2 = unit("u2", overrides?.orphanUnit ? "other-path" : PATH.id, overrides?.unitOrders?.[1] ?? 2);
    const l1 = lesson(
      "l1",
      u1.id,
      overrides?.lessonOrders?.[0] ?? 1,
      overrides?.lessonStatus ?? "published",
    );
    const l2 = lesson(
      "l2",
      overrides?.orphanLesson ? "other-unit" : u1.id,
      overrides?.lessonOrders?.[1] ?? 2,
    );
    return {
      path: PATH,
      units: [
        { ...u1, lessons: [l1, l2] },
        { ...u2, lessons: [] },
      ],
    };
  };

  it("valide un arbre cohérent", () => {
    expect(validateCurriculum(mk()).valid).toBe(true);
  });

  it("détecte un ordre d'unités dupliqué", () => {
    const r = validateCurriculum(mk({ unitOrders: [1, 1] }));
    expect(r.issues.some((i) => i.code === "UNIT_ORDER_DUPLICATE")).toBe(true);
    expect(r.valid).toBe(false);
  });

  it("détecte un ordre de leçons dupliqué", () => {
    const r = validateCurriculum(mk({ lessonOrders: [1, 1] }));
    expect(r.issues.some((i) => i.code === "LESSON_ORDER_DUPLICATE")).toBe(true);
  });

  it("détecte une unité orpheline", () => {
    const r = validateCurriculum(mk({ orphanUnit: true }));
    expect(r.issues.some((i) => i.code === "UNIT_ORPHAN")).toBe(true);
  });

  it("détecte une leçon orpheline", () => {
    const r = validateCurriculum(mk({ orphanLesson: true }));
    expect(r.issues.some((i) => i.code === "LESSON_ORPHAN")).toBe(true);
  });

  it("détecte une leçon non publiée", () => {
    const r = validateCurriculum(mk({ lessonStatus: "draft" }));
    expect(r.issues.some((i) => i.code === "LESSON_NOT_PUBLISHED")).toBe(true);
  });
});

describe("orderCurriculum", () => {
  it("trie unités et leçons par sort_order", () => {
    const c = orderCurriculum(
      mkOrderFixture(),
    );
    expect(c.units.map((u) => u.sort_order)).toEqual([1, 2]);
    expect(c.units[0].lessons.map((l) => l.sort_order)).toEqual([1, 2]);
  });

  function mkOrderFixture() {
    const u2 = unit("u2", PATH.id, 2);
    const u1 = unit("u1", PATH.id, 1);
    return {
      path: PATH,
      units: [
        { ...u2, lessons: [] },
        { ...u1, lessons: [lesson("l2", "u1", 2), lesson("l1", "u1", 1)] },
      ],
    };
  }
});
