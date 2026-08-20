import { describe, expect, it } from "vitest";
import { normalizeWordText } from "../lib/quran/normalize-text";

// ---------------------------------------------------------------------------
// Phase 10 (Voie B) — normalized_text : normalisation technique, pure et
// idempotente. Les tests couvrent chaque classe de caractères et des exemples
// réels du corpus (Fātiḥa / Basmala + variantes morphologiques).
// ---------------------------------------------------------------------------

describe("normalizeWordText — Unicode", () => {
  it("normalise en NFC (forme composée stable)", () => {
    // Saisie NFD → même résultat que NFC (déterminisme canonique).
    const nfd = "بِسْمِ".normalize("NFD");
    expect(normalizeWordText(nfd)).toBe("بسم");
    expect(normalizeWordText("بِسْمِ")).toBe("بسم");
  });

  it("est neutre sur les chaînes sans arabe", () => {
    expect(normalizeWordText("abc")).toBe("abc");
    expect(normalizeWordText("")).toBe("");
  });
});

describe("normalizeWordText — tashkīl (diacritiques phonétiques)", () => {
  it("retire fatha, damma, kasra", () => {
    expect(normalizeWordText("كَتَبَ")).toBe("كتب");
    expect(normalizeWordText("كُتُبٌ")).toBe("كتب");
  });

  it("retire tanwīn", () => {
    expect(normalizeWordText("رَسُولٌ")).toBe("رسول");
    expect(normalizeWordText("كِتَابًا")).toBe("كتابا");
  });

  it("retire shadda (gémination) et sukūn", () => {
    expect(normalizeWordText("رَبُّ")).toBe("رب");
    expect(normalizeWordText("ٱلرَّحِيمِ")).toBe("الرحيم");
  });

  it("retire le tatweel (kashida)", () => {
    expect(normalizeWordText("رَحْمَـٰنِ")).toBe("رحمان");
  });
});

describe("normalizeWordText — annotations coraniques", () => {
  it("retire les marques de pause (avec espace résiduel)", () => {
    expect(normalizeWordText("رَبَّهُۥ ۖ")).toBe("ربه");
    expect(normalizeWordText("رَبَّهُۥ ۗ")).toBe("ربه");
  });

  it("retire les lettres suscrites (petit wāw / yā / mīm)", () => {
    expect(normalizeWordText("رَبَّهُۥ")).toBe("ربه");
    expect(normalizeWordText("رَبِّهِۦ")).toBe("ربه");
    expect(normalizeWordText("رَّبٍّۢ")).toBe("رب");
  });

  it("replie les runs d'espaces résiduels (double espace avant pause)", () => {
    expect(normalizeWordText("أَنفُسِهِمْ  ۖ")).toBe("أنفسهم");
  });
});

describe("normalizeWordText — alef : wâsla et alif suscrit", () => {
  it("wâsla (ٱ) → alef canonique", () => {
    expect(normalizeWordText("ٱللَّهِ")).toBe("الله");
    expect(normalizeWordText("ٱلْحَمْدُ")).toBe("الحمد");
  });

  it("alif suscrit (ٰ) → alef (regroupe avec l'alef plein)", () => {
    expect(normalizeWordText("ٱلرَّحْمَـٰنِ")).toBe("الرحمان");
  });

  it("l'alif suscrit est MAPPÉ (pas supprimé) : préserve la distinction ā", () => {
    // خَلَـٰق (ā) ≠ خَلَق (pas de ā) — une suppression créerait une fausse collision.
    expect(normalizeWordText("خَلَـٰقَ")).toBe("خلاق");
    expect(normalizeWordText("خَلَقَ")).toBe("خلق");
    expect(normalizeWordText("خَلَـٰقَ")).not.toBe(normalizeWordText("خَلَقَ"));
  });
});

describe("normalizeWordText — hamza conservée (non unifiée)", () => {
  it("أ إ آ ء ؤ ئ restent distinctes", () => {
    expect(normalizeWordText("أَنفُسِهِمْ")).toBe("أنفسهم");
    expect(normalizeWordText("إِنَّ")).toBe("إن");
    expect(normalizeWordText("ءَايَةً")).toBe("ءاية");
    expect(normalizeWordText("ٱللَّهِ")).toBe("الله");
    // wâsla fusionne avec l'alef, mais la hamza porteuse reste distincte.
    expect(normalizeWordText("أَنفُسِهِمْ")).not.toBe(normalizeWordText("ٱلنَّفْسِ"));
  });
});

describe("normalizeWordText — espaces", () => {
  it("préserve un espace légitime entre deux mots", () => {
    expect(normalizeWordText("بِسْمِ ٱللَّهِ")).toBe("بسم الله");
  });

  it("trim les espaces de bordure", () => {
    expect(normalizeWordText("  رَبِّ  ")).toBe("رب");
  });
});

describe("normalizeWordText — exemples réels du corpus", () => {
  const cases: Array<[string, string]> = [
    ["بِسْمِ", "بسم"],
    ["ٱللَّهِ", "الله"],
    ["ٱلرَّحْمَـٰنِ", "الرحمان"],
    ["ٱلرَّحِيمِ", "الرحيم"],
    ["ٱلْحَمْدُ", "الحمد"],
    ["لِلَّهِ", "لله"],
    ["رَبِّ", "رب"],
    ["رَبُّ", "رب"],
    ["رَبَّ", "رب"],
    ["رَبِّي", "ربي"],
    ["رَبَّنَا", "ربنا"],
    ["ٱلْعَـٰلَمِينَ", "العالمين"],
    ["وَرَسُولُهُ", "ورسوله"],
    ["فَإِنَّ", "فإن"],
    ["بِرَبِّ", "برب"],
    ["لِرَبِّ", "لرب"],
  ];

  it.each(cases)("%s → %s", (input, expected) => {
    expect(normalizeWordText(input)).toBe(expected);
  });

  it("forme coranique, variantes de cas → même forme normalisée (regroupement, pas lemme)", () => {
    const forms = normalizeWordText("رَبِّ");
    expect(normalizeWordText("رَبُّ")).toBe(forms);
    expect(normalizeWordText("رَبَّ")).toBe(forms);
  });

  it("documente la collision shadda (عَلِمَ vs عَلَّمَ) — attendue, pas un bug", () => {
    // Retirer la shadda regroupe des mots distincts : c'est le contrat d'une
    // clé de recherche technique, jamais une identité lexicale.
    expect(normalizeWordText("عَلِمَ")).toBe("علم");
    expect(normalizeWordText("عَلَّمَ")).toBe("علم");
  });
});

describe("normalizeWordText — idempotence", () => {
  const samples = [
    "بِسْمِ",
    "ٱللَّهِ",
    "ٱلرَّحْمَـٰنِ",
    "رَبِّ",
    "رَبُّ",
    "رَبَّ",
    "رَبِّي",
    "رَبَّنَا",
    "رَبَّهُۥ ۖ",
    "أَنفُسِهِمْ  ۖ",
    "بِسْمِ ٱللَّهِ",
    "ءَايَةً",
    "خَلَـٰقَ",
    "بِسْمِ".normalize("NFD"),
    "رَسُولٌۭ",
  ];

  it("normalize(normalize(x)) === normalize(x)", () => {
    for (const s of samples) {
      const once = normalizeWordText(s);
      expect(normalizeWordText(once)).toBe(once);
    }
  });
});
