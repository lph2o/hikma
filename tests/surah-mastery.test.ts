import { describe, expect, it } from "vitest";
import { aggregateSurahMastery } from "../lib/learning/surah-mastery";

describe("aggregateSurahMastery", () => {
  it("isole les états par sourate et distingue les états dérivés", () => {
    const progress = new Map([
      ["f1", { wordId: "f1", status: "mastered" as const, mastery: 100 }],
      ["i1", { wordId: "i1", status: "learning" as const, mastery: 25, nextReviewAt: "2026-01-01T00:00:00Z" }],
    ]);
    expect(aggregateSurahMastery(1, ["f1"], progress).status).toBe("MASTERED");
    expect(
      aggregateSurahMastery(112, ["i1"], progress, new Map(), new Date("2026-01-02T00:00:00Z")).status,
    ).toBe("DUE");
    expect(aggregateSurahMastery(113, ["n1"], progress).status).toBe("NON_EVALUATED");
  });

  it("agrège uniquement les huit compétences existantes", () => {
    const skills = new Map([
      ["f1", new Map([["form_to_meaning" as const, 75 as const]])],
    ]);
    const result = aggregateSurahMastery(1, ["f1"], new Map([
      ["f1", { wordId: "f1", status: "learning" as const, mastery: 50 }],
    ]), skills);
    expect(result.skills.form_to_meaning).toBe(75);
    expect(result.skills.meaning_to_form).toBeNull();
    expect(result.overall).toBe(75);
  });
});
