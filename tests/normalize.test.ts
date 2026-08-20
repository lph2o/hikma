import { describe, expect, it } from "vitest";
import { normalizeQuranData } from "../lib/quran/normalize";
import { fatihaRaw } from "./fixtures";

describe("normalizeQuranData", () => {
  const data = normalizeQuranData(fatihaRaw);

  it("mappe la sourate (numéro, noms, révélation, nombre de versets)", () => {
    expect(data.surahs).toHaveLength(1);
    const surah = data.surahs[0];
    expect(surah.number).toBe(1);
    expect(surah.name_arabic).toBe("الفاتحة");
    expect(surah.name_transliteration).toBe("Al-Fatihah");
    expect(surah.name_translation).toBe("L'ouverture");
    expect(surah.revelation_place).toBe("makkah");
    expect(surah.ayah_count).toBe(7);
  });

  it("préserve exactement le texte uthmani et conserve l'imlaei", () => {
    expect(data.ayahs).toHaveLength(1);
    expect(data.ayahs[0].text_uthmani).toBe(
      "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    );
    expect(data.ayahs[0].text_simple).toBe(
      "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    );
    expect(data.ayahs[0].global_ayah_number).toBe(1);
  });

  it("extrait les mots distincts et ignore le jeton de fin de verset", () => {
    expect(data.words.map((w) => w.arabic)).toEqual([
      "بِسْمِ",
      "ٱللَّهِ",
      "ٱلرَّحْمَـٰنِ",
      "ٱلرَّحِيمِ",
    ]);
    const bismi = data.words.find((w) => w.arabic === "بِسْمِ");
    expect(bismi?.transliteration).toBe("bis'mi");
    expect(bismi?.meaning).toBe("In (the) name");
  });

  it("produit une occurrence par mot, positions 1..4", () => {
    expect(data.occurrences).toHaveLength(4);
    expect(data.occurrences.map((o) => o.position)).toEqual([1, 2, 3, 4]);
    for (const occ of data.occurrences) {
      expect(occ.text).toBe(occ.word_arabic);
    }
  });

  it("importe les trois traductions (fr, en, it)", () => {
    expect(data.translations).toHaveLength(3);
    expect(data.translations.map((t) => t.language).sort()).toEqual([
      "en",
      "fr",
      "it",
    ]);
    expect(
      data.translations.map((t) => t.resource_id).sort((a, b) => a - b),
    ).toEqual([20, 31, 153]);
  });

  it("importe les récitants", () => {
    expect(data.recitations).toHaveLength(1);
    expect(data.recitations[0].name).toBe("Yasser Ad Dussary");
    expect(data.recitations[0].qirat).toBe("Hafs");
  });

  it("est déterministe (re-normaliser donne le même résultat)", () => {
    expect(normalizeQuranData(fatihaRaw)).toEqual(data);
  });
});
