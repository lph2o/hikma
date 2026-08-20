import { describe, expect, it } from "vitest";
import { classifySurahReadiness } from "../lib/learning/queries";

/**
 * Phase 30 — catalogue des sourates.
 *
 * Invariant produit : la readiness d'une sourate est pilotée par la QUALITÉ
 * LEXICALE FRANÇAISE (couverture effective en gloses FR validées), JAMAIS par
 * la présence de MASAQ. MASAQ est un enrichissement linguistique optionnel.
 */
describe("classifySurahReadiness — la readiness est lexicale française, jamais MASAQ", () => {
  it("Al-Fātiḥah (1) reste REFERENCE quelle que soit la couverture", () => {
    expect(classifySurahReadiness(1, 100)).toBe("REFERENCE");
    expect(classifySurahReadiness(1, 0)).toBe("REFERENCE");
    expect(classifySurahReadiness(1, 57)).toBe("REFERENCE");
  });

  it("une sourate non-1 à 100 % de FR effectif est READY", () => {
    expect(classifySurahReadiness(108, 100)).toBe("READY");
    expect(classifySurahReadiness(112, 100)).toBe("READY");
    expect(classifySurahReadiness(114, 100)).toBe("READY");
  });

  it("une couverture FR incomplète reste IN_PREPARATION (jamais bloquée par MASAQ)", () => {
    expect(classifySurahReadiness(93, 44)).toBe("IN_PREPARATION");
    expect(classifySurahReadiness(109, 79)).toBe("IN_PREPARATION");
    expect(classifySurahReadiness(102, 0)).toBe("IN_PREPARATION");
  });

  it("la classification n'accepte AUCUN paramètre MASAQ (structure)", () => {
    // La signature ne comporte que (surahNumber, effectiveFrPct) : il est
    // structurellement impossible qu'une donnée MASAQ conditionne la readiness.
    expect(classifySurahReadiness.length).toBe(2);
  });
});
