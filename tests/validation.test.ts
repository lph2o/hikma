import { describe, expect, it } from "vitest";
import type { NormalizedQuranData } from "../lib/quran/types";
import { validateQuranData } from "../lib/quran/validation/validator";

// Fixtures STRUCTURELLES — pas du texte coranique. Elles servent uniquement à
// exercer la logique de validation (unicité, positions, relations, doublons).
function makeValid(): NormalizedQuranData {
  const surahs = Array.from({ length: 114 }, (_, i) => ({
    number: i + 1,
    name_arabic: `S${i + 1}`,
    name_transliteration: null,
    name_translation: null,
    revelation_place: "makkah" as const,
    ayah_count: 1,
  }));
  const ayahs = surahs.map((s) => ({
    surah_number: s.number,
    ayah_number: 1,
    global_ayah_number: s.number,
    text_uthmani: "TEXTE",
    text_simple: null,
  }));
  return {
    surahs,
    ayahs,
    words: [{ arabic: "MOT", transliteration: null, meaning: null, root: null }],
    occurrences: surahs.map((s) => ({
      surah_number: s.number,
      ayah_number: 1,
      position: 1,
      word_arabic: "MOT",
      text: "MOT",
      normalized_text: null,
    })),
    translations: surahs.map((s) => ({
      surah_number: s.number,
      ayah_number: 1,
      language: "fr",
      translator: "t",
      resource_id: 31,
      text: "TRADUCTION",
    })),
    recitations: [],
  };
}

function hasError(code: string, data: NormalizedQuranData): boolean {
  return validateQuranData(data).issues.some(
    (i) => i.severity === "error" && i.code === code,
  );
}

describe("validateQuranData", () => {
  it("valide un jeu complet et cohérent", () => {
    const report = validateQuranData(makeValid());
    expect(report.valid).toBe(true);
  });

  it("rejette un nombre de sourates incorrect", () => {
    const data = makeValid();
    data.surahs.pop();
    expect(hasError("SURAH_COUNT", data)).toBe(true);
  });

  it("rejette un numéro de sourate dupliqué", () => {
    const data = makeValid();
    data.surahs[10].number = data.surahs[9].number;
    expect(hasError("SURAH_DUPLICATE", data)).toBe(true);
  });

  it("rejette une incohérence du nombre de versets", () => {
    const data = makeValid();
    data.surahs[0].ayah_count = 5;
    expect(hasError("SURAH_AYAH_MISMATCH", data)).toBe(true);
  });

  it("rejette un verset dupliqué", () => {
    const data = makeValid();
    data.ayahs.push({ ...data.ayahs[0] });
    expect(hasError("AYAH_DUPLICATE", data)).toBe(true);
  });

  it("rejette un verset sans texte", () => {
    const data = makeValid();
    data.ayahs[0].text_uthmani = "";
    expect(hasError("AYAH_NO_TEXT", data)).toBe(true);
  });

  it("rejette une position de mot invalide", () => {
    const data = makeValid();
    data.occurrences[0].position = 0;
    expect(hasError("OCC_POSITION", data)).toBe(true);
  });

  it("rejette une position de mot dupliquée", () => {
    const data = makeValid();
    data.occurrences.push({ ...data.occurrences[0] });
    expect(hasError("OCC_DUPLICATE", data)).toBe(true);
  });

  it("rejette une occurrence référençant un mot inconnu", () => {
    const data = makeValid();
    data.occurrences[0].word_arabic = "INCONNU";
    expect(hasError("OCC_UNKNOWN_WORD", data)).toBe(true);
  });

  it("rejette des formes de mots dupliquées", () => {
    const data = makeValid();
    data.words.push({ ...data.words[0] });
    expect(hasError("WORD_DUPLICATE", data)).toBe(true);
  });
});
