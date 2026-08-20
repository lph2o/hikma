import { describe, expect, it } from "vitest";
import { occurrenceKey, parseWbwFilename } from "../lib/quran/wbw-filename";

describe("parseWbwFilename — mapping exact SURAH_AYAH_WORD (aucun fuzzy)", () => {
  it("parse un nom conforme muallim", () => {
    expect(parseWbwFilename("muallim/001/001_001_001.opus")).toEqual({
      style: "muallim",
      surah: 1,
      ayah: 1,
      word: 1,
    });
  });

  it("parse un nom conforme mujawwad", () => {
    expect(parseWbwFilename("mujawwad/002/002_255_010.opus")).toEqual({
      style: "mujawwad",
      surah: 2,
      ayah: 255,
      word: 10,
    });
  });

  it("position de mot correcte (2 chiffres → nombre)", () => {
    const parsed = parseWbwFilename("muallim/001/001_007_009.opus");
    expect(parsed?.word).toBe(9);
    expect(parsed?.ayah).toBe(7);
  });

  it("rejette un nommage invalide (format non conforme)", () => {
    expect(parseWbwFilename("muallim/001/1_1_1.opus")).toBeNull();
    expect(parseWbwFilename("muallim/001/001_001_001.mp3")).toBeNull();
    expect(parseWbwFilename("muallim/001/001_001.opus")).toBeNull();
    expect(parseWbwFilename("001_001_001_001.opus")).toBeNull(); // style absent
  });

  it("rejette les plages hors limites", () => {
    expect(parseWbwFilename("muallim/000/001_001_001.opus")).toBeNull();
    expect(parseWbwFilename("muallim/115/001_001_001.opus")).toBeNull();
    expect(parseWbwFilename("muallim/001/000_001_001.opus")).toBeNull();
  });

  it("rejette un style non reconnu", () => {
    expect(parseWbwFilename("unknown/001/001_001_001.opus")).toBeNull();
  });
});

describe("occurrenceKey — clé canonique déterministe", () => {
  it("produit 3+3+3 chiffres", () => {
    expect(occurrenceKey(1, 1, 1)).toBe("001_001_001");
    expect(occurrenceKey(2, 255, 10)).toBe("002_255_010");
    expect(occurrenceKey(114, 6, 3)).toBe("114_006_003");
  });

  it("round-trip avec parseWbwFilename", () => {
    const p = parseWbwFilename("mujawwad/114/114_006_003.opus")!;
    expect(occurrenceKey(p.surah, p.ayah, p.word)).toBe("114_006_003");
  });

  it("est stable et sans séparateur ambigu", () => {
    expect(occurrenceKey(1, 2, 3)).toBe("001_002_003");
  });
});
