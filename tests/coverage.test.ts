import { describe, expect, it } from "vitest";
import {
  COMPREHENDED_STATUSES,
  computeCoveragePercent,
  computeCoverageBySurah,
  computeAyahCoverages,
  isComprehendedStatus,
  sumComprehendedOccurrences,
} from "@/lib/learning/coverage";

describe("isComprehendedStatus", () => {
  it("compte familiar et mastered comme compris", () => {
    expect(isComprehendedStatus("familiar")).toBe(true);
    expect(isComprehendedStatus("mastered")).toBe(true);
  });

  it("ne compte pas new / learning (vu ≠ compris)", () => {
    expect(isComprehendedStatus("new")).toBe(false);
    expect(isComprehendedStatus("learning")).toBe(false);
  });

  it("rejette les statuts inconnus", () => {
    expect(isComprehendedStatus("bogus")).toBe(false);
    expect(isComprehendedStatus("")).toBe(false);
  });

  it("expose exactement les deux statuts validés", () => {
    expect(COMPREHENDED_STATUSES).toEqual(["familiar", "mastered"]);
  });
});

describe("sumComprehendedOccurrences", () => {
  it("aucun mot compris → 0", () => {
    expect(
      sumComprehendedOccurrences(
        new Map([["a", "learning"], ["b", "new"]]),
        new Map([["a", 100], ["b", 50]]),
      ),
    ).toBe(0);
  });

  it("une seule forme comprise → sa fréquence exacte", () => {
    expect(
      sumComprehendedOccurrences(
        new Map([["a", "familiar"]]),
        new Map([["a", 963]]),
      ),
    ).toBe(963);
  });

  it("familiar compte", () => {
    expect(
      sumComprehendedOccurrences(new Map([["a", "familiar"]]), new Map([["a", 7]])),
    ).toBe(7);
  });

  it("mastered compte", () => {
    expect(
      sumComprehendedOccurrences(new Map([["a", "mastered"]]), new Map([["a", 7]])),
    ).toBe(7);
  });

  it("une forme simplement vue (learning) ne compte pas", () => {
    expect(
      sumComprehendedOccurrences(new Map([["a", "learning"]]), new Map([["a", 999]])),
    ).toBe(0);
  });

  it("plusieurs formes comprises → somme des fréquences", () => {
    expect(
      sumComprehendedOccurrences(
        new Map([["a", "familiar"], ["b", "mastered"]]),
        new Map([["a", 100], ["b", 20]]),
      ),
    ).toBe(120);
  });

  it("forme très fréquente pèse plus qu'une forme rare", () => {
    const sum = sumComprehendedOccurrences(
      new Map([["freq", "mastered"], ["rare", "mastered"]]),
      new Map([["freq", 1000], ["rare", 10]]),
    );
    expect(sum).toBe(1010);
    // la forme fréquente contribue 1000, la rare 10.
    expect(
      sumComprehendedOccurrences(new Map([["freq", "mastered"]]), new Map([["freq", 1000], ["rare", 10]])),
    ).toBe(1000);
  });

  it("الله et لِلَّه restent distinctes (aucune fusion)", () => {
    const frequency = new Map([
      ["allah", 963],
      ["lillah", 128],
    ]);
    // Seul الله est compris : لِلَّه ne doit PAS être compté.
    expect(
      sumComprehendedOccurrences(new Map([["allah", "mastered"]]), frequency),
    ).toBe(963);
    // Les deux compris : somme exacte des deux formes.
    expect(
      sumComprehendedOccurrences(
        new Map([["allah", "mastered"], ["lillah", "familiar"]]),
        frequency,
      ),
    ).toBe(1091);
  });

  it("forme comprise sans fréquence connue → contribution 0 (défensif)", () => {
    expect(
      sumComprehendedOccurrences(new Map([["a", "mastered"]]), new Map()),
    ).toBe(0);
  });

  it("isole les données par construction (deux maps indépendants)", () => {
    const userA = sumComprehendedOccurrences(new Map([["a", "mastered"]]), new Map([["a", 500]]));
    const userB = sumComprehendedOccurrences(new Map([["b", "familiar"]]), new Map([["b", 3]]));
    expect(userA).toBe(500);
    expect(userB).toBe(3);
  });
});

describe("computeCoveragePercent", () => {
  it("aucun mot compris → 0", () => {
    expect(computeCoveragePercent(0, 77430)).toBe(0);
  });

  it("calcul exact sur une forme", () => {
    // 963 / 77430 = 1.243…% → 1.
    expect(computeCoveragePercent(963, 77430)).toBe(1);
  });

  it("plafond curriculum actuel ≈ 19 % (14 522 / 77 430)", () => {
    expect(computeCoveragePercent(14522, 77430)).toBe(19);
  });

  it("arrondi à l'entier", () => {
    expect(computeCoveragePercent(1, 3)).toBe(33); // 33.33 → 33
    expect(computeCoveragePercent(2, 3)).toBe(67); // 66.67 → 67
  });

  it("corpus vide → 0, aucune division par zéro / NaN", () => {
    expect(computeCoveragePercent(0, 0)).toBe(0);
    expect(computeCoveragePercent(5, 0)).toBe(0);
    expect(Number.isNaN(computeCoveragePercent(5, 0))).toBe(false);
  });

  it("valeur maximale : toutes les formes couvertes → 100", () => {
    expect(computeCoveragePercent(77430, 77430)).toBe(100);
  });

  it("borné à 100 (jamais au-delà)", () => {
    expect(computeCoveragePercent(999999, 77430)).toBe(100);
  });

  it("covered négatif défensif → 0 (jamais négatif)", () => {
    expect(computeCoveragePercent(-1, 77430)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeCoverageBySurah (Phase 83B)
// ---------------------------------------------------------------------------

describe("computeCoverageBySurah", () => {
  it("sourate avec mots compris", () => {
    const result = computeCoverageBySurah([
      { surah_number: 1, name_translation: "L'ouverture", ayah_count: 7, covered_ayahs: 5 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].surahNumber).toBe(1);
    expect(result[0].surahName).toBe("L'ouverture");
    expect(result[0].totalAyahs).toBe(7);
    expect(result[0].coveredAyahs).toBe(5);
    expect(result[0].coveragePercent).toBe(71); // 5/7 = 71%
  });

  it("sourate sans mot compris est filtrée", () => {
    const result = computeCoverageBySurah([
      { surah_number: 1, name_translation: "L'ouverture", ayah_count: 7, covered_ayahs: 0 },
    ]);
    expect(result).toHaveLength(0);
  });

  it("sourate entièrement couverte → 100%", () => {
    const result = computeCoverageBySurah([
      { surah_number: 112, name_translation: "Le monothéisme pur", ayah_count: 4, covered_ayahs: 4 },
    ]);
    expect(result[0].coveragePercent).toBe(100);
  });

  it("plusieurs sourates triées par numéro", () => {
    const result = computeCoverageBySurah([
      { surah_number: 114, name_translation: "Les hommes", ayah_count: 6, covered_ayahs: 2 },
      { surah_number: 1, name_translation: "L'ouverture", ayah_count: 7, covered_ayahs: 3 },
      { surah_number: 112, name_translation: "Le monothéisme pur", ayah_count: 4, covered_ayahs: 1 },
    ]);
    expect(result.map((s) => s.surahNumber)).toEqual([1, 112, 114]);
  });

  it("entrée vide → tableau vide", () => {
    const result = computeCoverageBySurah([]);
    expect(result).toEqual([]);
  });

  it("nom de sourate null → fallback 'Sourate N'", () => {
    const result = computeCoverageBySurah([
      { surah_number: 99, name_translation: null, ayah_count: 8, covered_ayahs: 1 },
    ]);
    expect(result[0].surahName).toBe("Sourate 99");
  });

  it("coveragePercent borné 0..100", () => {
    // Plus de couverts que de total (ne devrait pas arriver mais défensif)
    const result = computeCoverageBySurah([
      { surah_number: 1, name_translation: "Test", ayah_count: 7, covered_ayahs: 99 },
    ]);
    expect(result[0].coveragePercent).toBeLessThanOrEqual(100);
    expect(result[0].coveragePercent).toBeGreaterThanOrEqual(0);
  });

  it("données massives : 114 sourates", () => {
    const rows = [];
    for (let i = 1; i <= 114; i++) {
      rows.push({
        surah_number: i,
        name_translation: `S${i}`,
        ayah_count: i < 10 ? 7 : 20,
        covered_ayahs: i < 5 ? 3 : 0,
      });
    }
    // 4 sourates avec couverture > 0
    const result = computeCoverageBySurah(rows);
    expect(result).toHaveLength(4);
  });
});

describe("computeAyahCoverages", () => {
  const row = (
    occurrenceId: string,
    ayahId: string,
    wordId: string,
    position: number,
    ayahNumber: number,
    status: string | null,
  ) => ({
    occurrenceId,
    ayahId,
    wordId,
    position,
    text: `w${position}`,
    ayahNumber,
    globalAyahNumber: ayahNumber,
    textUthmani: `ayah${ayahNumber}`,
    status,
    mastery: status === "mastered" ? 1 : null,
    translationFr: `fr${ayahNumber}`,
  });

  it("ayah sans mot connu → 0 %", () => {
    const result = computeAyahCoverages([
      row("o1", "a1", "w1", 1, 1, "new"),
      row("o2", "a1", "w2", 2, 1, "learning"),
    ]);
    expect(result[0].coveragePercent).toBe(0);
    expect(result[0].coveredOccurrences).toBe(0);
    expect(result[0].totalOccurrences).toBe(2);
  });

  it("1 occurrence connue sur 5 → 20 %", () => {
    const result = computeAyahCoverages([
      row("o1", "a1", "w1", 1, 1, "mastered"),
      row("o2", "a1", "w2", 2, 1, null),
      row("o3", "a1", "w3", 3, 1, null),
      row("o4", "a1", "w4", 4, 1, null),
      row("o5", "a1", "w5", 5, 1, null),
    ]);
    expect(result[0].coveragePercent).toBe(20);
    expect(result[0].coveredOccurrences).toBe(1);
    expect(result[0].totalOccurrences).toBe(5);
  });

  it("toutes les occurrences connues → 100 %", () => {
    const result = computeAyahCoverages([
      row("o1", "a1", "w1", 1, 1, "familiar"),
      row("o2", "a1", "w2", 2, 1, "mastered"),
    ]);
    expect(result[0].coveragePercent).toBe(100);
  });

  it("mot répété : chaque occurrence compte", () => {
    const result = computeAyahCoverages([
      row("o1", "a1", "w1", 1, 1, "mastered"),
      row("o2", "a1", "w1", 2, 1, "mastered"),
      row("o3", "a1", "w2", 3, 1, "mastered"),
      row("o4", "a1", "w3", 4, 1, null),
      row("o5", "a1", "w3", 5, 1, null),
    ]);
    expect(result[0].totalOccurrences).toBe(5);
    expect(result[0].coveredOccurrences).toBe(3);
    expect(result[0].coveragePercent).toBe(60);
  });

  it("même word_id dans plusieurs ayahs → comptage indépendant", () => {
    const result = computeAyahCoverages([
      row("o1", "a1", "w1", 1, 1, "mastered"),
      row("o2", "a2", "w1", 1, 2, "mastered"),
      row("o3", "a2", "w2", 2, 2, null),
    ]);
    expect(result).toHaveLength(2);
    const ayah1 = result.find((a) => a.ayahNumber === 1)!;
    const ayah2 = result.find((a) => a.ayahNumber === 2)!;
    expect(ayah1.coveragePercent).toBe(100);
    expect(ayah2.coveragePercent).toBe(50);
  });

  it("aucun user_word_progress → tous statuts null → 0 %", () => {
    const result = computeAyahCoverages([
      row("o1", "a1", "w1", 1, 1, null),
      row("o2", "a1", "w2", 2, 1, null),
    ]);
    expect(result[0].occurrences.every((o) => o.status === null)).toBe(true);
    expect(result[0].coveragePercent).toBe(0);
  });

  it("new et learning → non compris ; familiar et mastered → compris", () => {
    const result = computeAyahCoverages([
      row("o1", "a1", "w1", 1, 1, "new"),
      row("o2", "a1", "w2", 2, 1, "learning"),
      row("o3", "a1", "w3", 3, 1, "familiar"),
      row("o4", "a1", "w4", 4, 1, "mastered"),
    ]);
    expect(result[0].occurrences.map((o) => o.isComprehended)).toEqual([
      false,
      false,
      true,
      true,
    ]);
  });

  it("occurrences triées par position", () => {
    const result = computeAyahCoverages([
      row("o3", "a1", "w3", 3, 1, null),
      row("o1", "a1", "w1", 1, 1, null),
      row("o2", "a1", "w2", 2, 1, null),
    ]);
    expect(result[0].occurrences.map((o) => o.position)).toEqual([1, 2, 3]);
  });

  it("ayahs triés par numéro de verset", () => {
    const result = computeAyahCoverages([
      row("o1", "a2", "w1", 1, 2, null),
      row("o2", "a1", "w2", 1, 1, null),
    ]);
    expect(result.map((a) => a.ayahNumber)).toEqual([1, 2]);
  });

  it("coveragePercent borné 0..100", () => {
    const result = computeAyahCoverages([
      row("o1", "a1", "w1", 1, 1, "mastered"),
    ]);
    expect(result[0].coveragePercent).toBeGreaterThanOrEqual(0);
    expect(result[0].coveragePercent).toBeLessThanOrEqual(100);
  });

  it("traduction absente → translationFr null", () => {
    const input = row("o1", "a1", "w1", 1, 1, "mastered");
    const result = computeAyahCoverages([
      { ...input, translationFr: null },
    ]);
    expect(result[0].translationFr).toBeNull();
  });

  it("sourate sans occurrence → []", () => {
    expect(computeAyahCoverages([])).toEqual([]);
  });
});
