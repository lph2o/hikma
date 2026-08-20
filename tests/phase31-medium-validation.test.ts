import { describe, expect, it } from "vitest";
import { resolveWordMeanings, type FrenchLexicalMeaning } from "../lib/learning/language";
import { classifySurahReadiness } from "../lib/learning/queries";

/**
 * Phase 31 — validation éditoriale des gloses MEDIUM.
 *
 * Invariants testés :
 *  - une glose FR VALIDÉE (niveau forme) résout en français, jamais en fallback EN ;
 *  - une glose FR non validée (PROPOSED) est ignorée → fallback EN honnête ;
 *  - la readiness reste pilotée par la couverture lexicale française, JAMAIS MASAQ.
 */

const validatedFr = (text: string): FrenchLexicalMeaning => ({
  text,
  source: { name: "Hikma — lexique éditorial" },
  validated: true,
  validatedAt: "2026-08-18T00:00:00Z",
});

const proposedFr = (text: string): FrenchLexicalMeaning => ({
  text,
  source: { name: "Hikma — lexique éditorial" },
  validated: false,
  validatedAt: null,
});

describe("Phase 31 — résolution des gloses MEDIUM validées", () => {
  it("une glose FR validée résout en FR (aucun fallback EN)", () => {
    const r = resolveWordMeanings({ meaning: "believe[d]" }, validatedFr("ils ont cru"));
    expect(r.language).toBe("fr");
    expect(r.isFallback).toBe(false);
    expect(r.isValidated).toBe(true);
    expect(r.text).toBe("ils ont cru");
  });

  it("une glose REVISE utilise sa formulation finale corrigée", () => {
    const r = resolveWordMeanings({ meaning: "He is displeased" }, validatedFr("a détesté"));
    expect(r.text).toBe("a détesté");
    expect(r.language).toBe("fr");
  });

  it("une glose FR non validée (PROPOSED) est ignorée → fallback EN honnête", () => {
    const r = resolveWordMeanings({ meaning: "believe[d]" }, proposedFr("ils ont cru"));
    expect(r.language).toBe("en");
    expect(r.isFallback).toBe(true);
  });

  it("une glose NEEDS_REVIEW n'est jamais présentée comme FR validée", () => {
    const r = resolveWordMeanings({ meaning: "[the] small kindnesses" }, undefined, undefined);
    expect(r.language).toBe("en");
    expect(r.isFallback).toBe(true);
  });
});

describe("Phase 31 — readiness lexicale française, jamais MASAQ", () => {
  it("sourate sans MASAQ à 100 % FR effectif → READY", () => {
    expect(classifySurahReadiness(93, 100)).toBe("READY");
    expect(classifySurahReadiness(94, 100)).toBe("READY");
    expect(classifySurahReadiness(109, 100)).toBe("READY");
  });

  it("sourate sans MASAQ à couverture incomplète → IN_PREPARATION", () => {
    expect(classifySurahReadiness(107, 96)).toBe("IN_PREPARATION");
  });

  it("sourate avec MASAQ mais FR incomplet resterait IN_PREPARATION (MASAQ ne sauve pas)", () => {
    // Le critère est la glose FR ; une hypothétique donnée MASAQ n'influerait pas.
    expect(classifySurahReadiness(112, 90)).toBe("IN_PREPARATION");
  });

  it("Al-Fātiḥah reste REFERENCE (FATIHAH_REFERENCE_LOCKED)", () => {
    expect(classifySurahReadiness(1, 100)).toBe("REFERENCE");
    expect(classifySurahReadiness(1, 96)).toBe("REFERENCE");
  });
});
