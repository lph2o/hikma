import { describe, expect, it } from "vitest";
import {
  gradeArabicInput,
  gradeFreeResponse,
  gradeFrenchInput,
  generateExercise,
  scoreAnswer,
  validateAnswer,
} from "../lib/exercises";
import type { WordBankEntry } from "../lib/learning";

/* ------------------------------------------------------------------ */
/* FRANÇAIS — ordre de synonymes, accents, ponctuation, phrases        */
/* ------------------------------------------------------------------ */

const SOVEREIGN_VARIANTS = ["souverain / maître", "souverain", "maître"] as const;

describe("grading français — synonymes ordonnables", () => {
  it("accepte l'ordre inversé des synonymes", () => {
    expect(gradeFrenchInput("maître / souverain", SOVEREIGN_VARIANTS)).toBe("CORRECT");
    expect(gradeFrenchInput("souverain / maître", SOVEREIGN_VARIANTS)).toBe("CORRECT");
  });

  it("accepte les accents optionnels (maître ↔ maitre)", () => {
    expect(gradeFrenchInput("maitre / souverain", SOVEREIGN_VARIANTS)).toBe("CORRECT");
  });

  it("accepte la casse, les espaces et la ponctuation non pertinente", () => {
    expect(gradeFrenchInput("  SOUVERAIN / MAÎTRE  ", SOVEREIGN_VARIANTS)).toBe("CORRECT");
    expect(gradeFrenchInput("souverain/maître", SOVEREIGN_VARIANTS)).toBe("CORRECT");
    expect(gradeFrenchInput("souverain, maître", SOVEREIGN_VARIANTS)).toBe("CORRECT");
    expect(gradeFrenchInput("maître, souverain", SOVEREIGN_VARIANTS)).toBe("CORRECT");
  });

  it("accepte « voie / chemin » et « chemin / voie »", () => {
    expect(gradeFrenchInput("voie / chemin", ["chemin / voie", "chemin", "voie"])).toBe("CORRECT");
    expect(gradeFrenchInput("chemin / voie", ["chemin / voie", "chemin", "voie"])).toBe("CORRECT");
  });

  it("un seul synonyme validé reste accepté (politique de réponses partielles)", () => {
    expect(gradeFrenchInput("souverain", SOVEREIGN_VARIANTS)).toBe("CORRECT");
    expect(gradeFrenchInput("maître", SOVEREIGN_VARIANTS)).toBe("CORRECT");
  });

  it("n'accepte jamais un synonyme non validé (roi, religion, serviteur)", () => {
    expect(gradeFrenchInput("roi", SOVEREIGN_VARIANTS)).toBe("INCORRECT");
    expect(gradeFrenchInput("religion", SOVEREIGN_VARIANTS)).toBe("INCORRECT");
    expect(gradeFrenchInput("serviteur", SOVEREIGN_VARIANTS)).toBe("INCORRECT");
    expect(gradeFrenchInput("roi / maître", SOVEREIGN_VARIANTS)).toBe("INCORRECT");
  });

  it("ne confond pas un mot proche typographiquement (souvenir ≠ souverain)", () => {
    expect(gradeFrenchInput("souvenir", ["souverain"])).toBe("INCORRECT");
  });

  it("préserve l'ordre interne d'une phrase", () => {
    expect(gradeFrenchInput("nous adorons", ["nous adorons"])).toBe("CORRECT");
    expect(gradeFrenchInput("adorons nous", ["nous adorons"])).toBe("INCORRECT");
  });

  it("traite une liste de phrases comme un ensemble de phrases ordonnées", () => {
    const variants = ["la louange / la gloire", "la louange", "la gloire"];
    expect(gradeFrenchInput("la gloire / la louange", variants)).toBe("CORRECT");
    // L'ordre INTERNE de chaque phrase compte : permutation des mots → INCORRECT.
    expect(gradeFrenchInput("gloire la / louange la", variants)).toBe("INCORRECT");
  });
});

/* ------------------------------------------------------------------ */
/* ARABE — variantes d'écriture + homographes                          */
/* ------------------------------------------------------------------ */

describe("grading arabe — variantes d'alef et homographes", () => {
  it("accepte la forme exacte", () => {
    expect(gradeArabicInput("مَـٰلِكِ", "مَـٰلِكِ")).toBe("CORRECT");
  });

  it("مَالِكِ est reconnu comme مَـٰلِكِ (dagger alef → alef)", () => {
    expect(gradeArabicInput("مَالِكِ", "مَـٰلِكِ")).toBe("CORRECT");
    expect(gradeArabicInput("مَـٰلِكِ", "مَالِكِ")).toBe("CORRECT");
  });

  it("la forme clavier sans diacritiques est acceptée", () => {
    expect(gradeArabicInput("مالك", "مَـٰلِكِ")).toBe("CORRECT");
  });

  it("māliki ≠ malik : l'alef est une lettre réelle (jamais fusionnée)", () => {
    expect(gradeArabicInput("مَلِكِ", "مَـٰلِكِ")).toBe("INCORRECT");
  });

  it("la wasla (U+0671) est reconnue comme l'alef", () => {
    expect(gradeArabicInput("الَّذِينَ", "ٱلَّذِينَ")).toBe("CORRECT");
    expect(gradeArabicInput("ٱلَّذِينَ", "الَّذِينَ")).toBe("CORRECT");
  });

  it("le madda (آ) reste une lettre distincte de l'alef simple", () => {
    expect(gradeArabicInput("آ", "آ")).toBe("CORRECT");
    expect(gradeArabicInput("ا", "آ")).toBe("INCORRECT");
  });

  it("protège les homographes : عَبَدَ ≠ عَبْد (AMBIGUOUS, jamais CORRECT)", () => {
    expect(gradeArabicInput("عَبْد", "عَبَدَ")).toBe("AMBIGUOUS");
    expect(gradeArabicInput("عَبَدَ", "عَبْد")).toBe("AMBIGUOUS");
  });

  it("protège دِين ≠ دَيْن (AMBIGUOUS)", () => {
    expect(gradeArabicInput("دَيْن", "دِين")).toBe("AMBIGUOUS");
    expect(gradeArabicInput("دِين", "دَيْن")).toBe("AMBIGUOUS");
  });

  it("ضَالّ ≠ ظِلّ (consonne différente → INCORRECT)", () => {
    expect(gradeArabicInput("ظِلّ", "ضَالّ")).toBe("INCORRECT");
  });
});

/* ------------------------------------------------------------------ */
/* gradeFreeResponse — source unique de vérité                         */
/* ------------------------------------------------------------------ */

describe("gradeFreeResponse — source unique de vérité", () => {
  it("retourne le verdict + les formes normalisées + la variante retenue (FR)", () => {
    const res = gradeFreeResponse({
      language: "fr",
      userInput: "maitre / souverain",
      expectedAnswer: "souverain / maître",
      variants: SOVEREIGN_VARIANTS,
    });
    expect(res.verdict).toBe("CORRECT");
    expect(res.normalizedInput).toBe("maitre/souverain");
    expect(res.normalizedExpected).toBe("souverain/maitre");
    expect(res.matchedVariant).toBe("souverain / maître");
  });

  it("retourne INCORRECT pour un sens réellement différent (FR)", () => {
    const res = gradeFreeResponse({
      language: "fr",
      userInput: "roi",
      expectedAnswer: "souverain / maître",
      variants: SOVEREIGN_VARIANTS,
    });
    expect(res.verdict).toBe("INCORRECT");
  });

  it("retourne AMBIGUOUS pour une vocalisation différente (AR)", () => {
    const res = gradeFreeResponse({
      language: "ar",
      userInput: "عَبْد",
      expectedAnswer: "عَبَدَ",
    });
    expect(res.verdict).toBe("AMBIGUOUS");
  });
});

/* ------------------------------------------------------------------ */
/* INTÉGRATION — validateAnswer / scoreAnswer / maîtrise               */
/* ------------------------------------------------------------------ */

describe("intégration validateAnswer — le verdict alimente maîtrise et score", () => {
  const target: WordBankEntry = {
    wordId: "w-maliki",
    arabic: "مَـٰلِكِ",
    transliteration: "māliki",
    meaning: "souverain / maître",
  };
  const bank: WordBankEntry[] = [target];

  it("FORM_TO_MEANING : « maitre / souverain » est CORRECT (et scoré 1)", () => {
    const ex = generateExercise("FORM_TO_MEANING", { target, bank, difficulty: 1 })!;
    const r = validateAnswer(ex, { content: "maitre / souverain" });
    expect(r.correct).toBe(true);
    expect(r.status).toBe("CORRECT");
    expect(scoreAnswer(ex, { content: "maitre / souverain" })).toBe(1);
  });

  it("FORM_TO_MEANING : « roi » reste INCORRECT (et scoré 0)", () => {
    const ex = generateExercise("FORM_TO_MEANING", { target, bank, difficulty: 1 })!;
    const r = validateAnswer(ex, { content: "roi" });
    expect(r.correct).toBe(false);
    expect(r.status).toBe("INCORRECT");
    expect(scoreAnswer(ex, { content: "roi" })).toBe(0);
  });

  it("FORM_TO_MEANING : un correct par variante porte une note douce, jamais une erreur", () => {
    const ex = generateExercise("FORM_TO_MEANING", { target, bank, difficulty: 1 })!;
    const r = validateAnswer(ex, { content: "maître / souverain" });
    expect(r.correct).toBe(true);
    expect(r.explanation).toBe("Ta réponse exprime le même sens.");
  });

  it("MEANING_TO_FORM : مَالِكِ est CORRECT pour مَـٰلِكِ (et scoré 1)", () => {
    const ex = generateExercise("MEANING_TO_FORM", { target, bank, difficulty: 1 })!;
    const r = validateAnswer(ex, { content: "مَالِكِ" });
    expect(r.correct).toBe(true);
    expect(r.status).toBe("CORRECT");
    expect(scoreAnswer(ex, { content: "مَالِكِ" })).toBe(1);
  });

  it("MEANING_TO_FORM : un mot réellement différent reste INCORRECT", () => {
    const ex = generateExercise("MEANING_TO_FORM", { target, bank, difficulty: 1 })!;
    const r = validateAnswer(ex, { content: "مَلِكِ" });
    expect(r.correct).toBe(false);
    expect(r.status).toBe("INCORRECT");
    expect(scoreAnswer(ex, { content: "مَلِكِ" })).toBe(0);
  });
});
