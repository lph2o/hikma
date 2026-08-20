import { describe, expect, it } from "vitest";
import {
  COMPREHENDED_STATUSES,
  computeCoveragePercent,
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
