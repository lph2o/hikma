import { describe, expect, it } from "vitest";
import { normalizeQuranData } from "../lib/quran/normalize";
import { fatihaRaw } from "./fixtures";
import { DEFAULT_LESSON_EXERCISE_TYPES } from "../lib/learning";
import type { WordBankEntry } from "../lib/learning";
import {
  generateExercise,
  generateLessonExercises,
  scoreAnswer,
  validateAnswer,
  validateGeneratedExercise,
  GENERATORS,
  gradeArabicInput,
  gradeFrenchInput,
} from "../lib/exercises";
import type { ExerciseType } from "../lib/exercises";

// Bank dérivée des données RÉELLES d'Al-Fatiha (fixture Phase 2) — aucun mot
// inventé. Les ids sont des identifiants techniques, pas des données coraniques.
const words = normalizeQuranData(fatihaRaw).words;
const bank: WordBankEntry[] = words.map((w, i) => ({
  wordId: `w${i + 1}`,
  arabic: w.arabic,
  transliteration: w.transliteration,
  meaning: w.meaning,
}));

const TARGET = bank[0]; // بِسْمِ → "In (the) name"
const DEFAULT_TYPES: ExerciseType[] = [
  ...DEFAULT_LESSON_EXERCISE_TYPES,
];

describe("génération d'exercices", () => {
  const scorableTypes: ExerciseType[] = [
    "WORD_TO_TRANSLATION",
    "TRANSLATION_TO_WORD",
    "REVERSE_TRANSLATION",
    "MULTIPLE_CHOICE",
    "COMPLETE_WORD",
  ];

  it.each(scorableTypes)("%s génère un exercice valide", (type) => {
    const ex = generateExercise(type, { target: TARGET, bank, difficulty: 1 });
    expect(ex).not.toBeNull();
    const report = validateGeneratedExercise(ex!);
    expect(report.issues).toEqual([]);
    expect(report.valid).toBe(true);
  });

  it("WORD_RECOGNITION génère un exercice d'auto-évaluation (sans bonne réponse)", () => {
    const ex = generateExercise("WORD_RECOGNITION", {
      target: TARGET,
      bank,
      difficulty: 1,
    });
    expect(ex).not.toBeNull();
    expect(ex!.options.filter((o) => o.isCorrect)).toHaveLength(0);
    expect(validateGeneratedExercise(ex!).valid).toBe(true);
  });

  it("PRONUNCIATION_GUIDED exige l'audio et reste auto-évalué (non noté)", () => {
    expect(
      generateExercise("PRONUNCIATION_GUIDED", { target: TARGET, bank, difficulty: 1 }),
    ).toBeNull();

    const ex = generateExercise("PRONUNCIATION_GUIDED", {
      target: TARGET,
      bank,
      difficulty: 1,
      audioUrl: "https://example.test/audio.opus",
    })!;
    expect(ex).not.toBeNull();
    expect(ex.options).toEqual([]);
    expect(ex.metadata.selfAssessed).toBe(true);
    expect(validateGeneratedExercise(ex).valid).toBe(true);

    // Auto-évalué : jamais de verdict, jamais de score.
    expect(validateAnswer(ex, { optionIndex: 0 }).correct).toBe(true);
    expect(scoreAnswer(ex, { optionIndex: 0 })).toBe(0);
  });

  it("les types audio renvoient null (audio non disponible)", () => {
    expect(
      generateExercise("AUDIO_TO_WORD", { target: TARGET, bank, difficulty: 1 }),
    ).toBeNull();
    expect(
      generateExercise("WORD_TO_AUDIO", { target: TARGET, bank, difficulty: 1 }),
    ).toBeNull();
  });

  it("les types audio génèrent un exercice quand une URL signée est fournie", () => {
    const audio = generateExercise("AUDIO_TO_WORD", {
      target: TARGET,
      bank,
      difficulty: 1,
      audioUrl: "https://example.test/audio.opus",
    });
    expect(audio).not.toBeNull();
    expect(audio!.metadata.audioUrl).toBe("https://example.test/audio.opus");
    expect(validateGeneratedExercise(audio!).valid).toBe(true);
  });

  it.each(["FORM_TO_MEANING", "MEANING_TO_FORM"] as const)(
    "%s génère un exercice de rappel LIBRE machine-noté (sans options)",
    (type) => {
      const ex = generateExercise(type, { target: TARGET, bank, difficulty: 1 });
      expect(ex).not.toBeNull();
      expect(ex!.options).toEqual([]);
      expect(ex!.metadata.freeText).toBe(true);
      expect(ex!.metadata.revealContent).toBeDefined();
      expect(validateGeneratedExercise(ex!).valid).toBe(true);
    },
  );

  it("CONTEXT_RECOGNITION exige un contexte de verset réel", () => {
    expect(
      generateExercise("CONTEXT_RECOGNITION", { target: TARGET, bank, difficulty: 1 }),
    ).toBeNull();
    const ex = generateExercise("CONTEXT_RECOGNITION", {
      target: TARGET,
      bank,
      difficulty: 1,
      context: { surahNumber: 1, ayahNumber: 1, arabic: "بِسْمِ ٱللَّهِ", french: "Au nom d'Allah" },
    });
    expect(ex).not.toBeNull();
    expect(ex!.metadata.context).toBeDefined();
    expect(ex!.options.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(validateGeneratedExercise(ex!).valid).toBe(true);
  });

  it("LEMMA_RELATION n'invente jamais de relation (DATA_UNAVAILABLE → null)", () => {
    expect(
      generateExercise("LEMMA_RELATION", { target: TARGET, bank, difficulty: 1 }),
    ).toBeNull();
    const ex = generateExercise("LEMMA_RELATION", {
      target: TARGET,
      bank,
      difficulty: 1,
      lemma: { lemmaId: "L1", siblings: [{ wordId: "w2", arabic: "ٱلصِّرَٰطَ" }] },
    });
    expect(ex).not.toBeNull();
    expect(ex!.options.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(ex!.options.find((o) => o.isCorrect)!.content).toBe("ٱلصِّرَٰطَ");
    expect(validateGeneratedExercise(ex!).valid).toBe(true);
  });

  it("chaque type du registre possède un générateur", () => {
    const types = Object.keys(GENERATORS) as ExerciseType[];
    expect(types).toHaveLength(14);
    for (const type of types) expect(GENERATORS[type]).toBeTypeOf("function");
  });

  it("une leçon sans mots exploitables génère zéro exercice (empty state)", () => {
    expect(
      generateLessonExercises([], DEFAULT_TYPES, 1),
    ).toEqual([]);
  });

  it("une leçon ne produit jamais plus d'exercices que mots × types", () => {
    const exs = generateLessonExercises(bank.slice(0, 3), DEFAULT_TYPES, 1);
    expect(exs.length).toBeGreaterThan(0);
    expect(exs.length).toBeLessThanOrEqual(3 * DEFAULT_TYPES.length);
  });

  it("ne produit aucune donnée linguistique fictive (contenus issus du bank)", () => {
    const meanings = new Set(bank.map((b) => b.meaning));
    const translits = new Set(bank.map((b) => b.transliteration));
    const arabs = new Set(bank.map((b) => b.arabic));

    for (const type of scorableTypes) {
      const ex = generateExercise(type, { target: TARGET, bank, difficulty: 1 })!;
      for (const opt of ex.options) {
        const inBank =
          meanings.has(opt.content) ||
          translits.has(opt.content) ||
          arabs.has(opt.content);
        // COMPLETE_WORD découpe le sens (dernier token) — toujours issu du sens.
        if (!inBank) {
          const isCompletion = bank.some((b) => (b.meaning ?? "").includes(opt.content));
          expect(isCompletion).toBe(true);
        }
      }
    }
  });
});

describe("réponses et score", () => {
  it("valide une bonne réponse (par index)", () => {
    const ex = generateExercise("WORD_TO_TRANSLATION", {
      target: TARGET,
      bank,
      difficulty: 1,
    })!;
    const correctIndex = ex.options.findIndex((o) => o.isCorrect);
    const r = validateAnswer(ex, { optionIndex: correctIndex });
    expect(r.correct).toBe(true);
    expect(r.explanation).toBeNull();
  });

  it("détecte une mauvaise réponse et explique la bonne réponse", () => {
    const ex = generateExercise("WORD_TO_TRANSLATION", {
      target: TARGET,
      bank,
      difficulty: 1,
    })!;
    const wrongIndex = ex.options.findIndex((o) => !o.isCorrect);
    const r = validateAnswer(ex, { optionIndex: wrongIndex });
    expect(r.correct).toBe(false);
    expect(r.explanation).toContain("In (the) name");
  });

  it("valide une bonne réponse (par contenu)", () => {
    const ex = generateExercise("WORD_TO_TRANSLATION", {
      target: TARGET,
      bank,
      difficulty: 1,
    })!;
    const correct = ex.options.find((o) => o.isCorrect)!;
    expect(validateAnswer(ex, { content: correct.content }).correct).toBe(true);
  });

  it("score 1 pour une bonne réponse, 0 sinon", () => {
    const ex = generateExercise("WORD_TO_TRANSLATION", {
      target: TARGET,
      bank,
      difficulty: 1,
    })!;
    const correctIndex = ex.options.findIndex((o) => o.isCorrect);
    const wrongIndex = ex.options.findIndex((o) => !o.isCorrect);
    expect(scoreAnswer(ex, { optionIndex: correctIndex })).toBe(1);
    expect(scoreAnswer(ex, { optionIndex: wrongIndex })).toBe(0);
  });

  it("l'auto-évaluation est acceptée et non notée", () => {
    const ex = generateExercise("WORD_RECOGNITION", {
      target: TARGET,
      bank,
      difficulty: 1,
    })!;
    expect(validateAnswer(ex, { optionIndex: 0 }).correct).toBe(true);
    expect(scoreAnswer(ex, { optionIndex: 0 })).toBe(0);
  });

  it("les distracteurs ne reprennent jamais la bonne réponse", () => {
    for (const type of ["WORD_TO_TRANSLATION", "TRANSLATION_TO_WORD", "MULTIPLE_CHOICE"] as const) {
      const ex = generateExercise(type, { target: TARGET, bank, difficulty: 1 })!;
      const correct = ex.options.find((o) => o.isCorrect)!;
      const distractors = ex.options.filter((o) => !o.isCorrect);
      for (const d of distractors) expect(d.content).not.toBe(correct.content);
    }
  });

  it("valide une réponse de rappel libre (machine, tri-state)", () => {
    const ex = generateExercise("MEANING_TO_FORM", { target: TARGET, bank, difficulty: 1 })!;
    expect(ex.metadata.freeText).toBe(true);

    const correct = validateAnswer(ex, { content: "بِسْمِ" });
    expect(correct.correct).toBe(true);
    expect(correct.status).toBe("CORRECT");

    const wrong = validateAnswer(ex, { content: "ٱللَّهِ" });
    expect(wrong.correct).toBe(false);
    expect(wrong.status).toBe("INCORRECT");

    // scoreAnswer : CORRECT → 1, sinon 0 (AMBIGUOUS inclus).
    expect(scoreAnswer(ex, { content: "بِسْمِ" })).toBe(1);
    expect(scoreAnswer(ex, { content: "ٱللَّهِ" })).toBe(0);
  });
});

describe("notation du rappel libre (non-contamination lexicale)", () => {
  it("accepte la forme exacte et la forme clavier sans diacritiques", () => {
    expect(gradeArabicInput("عَبَدَ", "عَبَدَ")).toBe("CORRECT");
    expect(gradeArabicInput("عبد", "عَبَدَ")).toBe("CORRECT"); // clavier
  });

  it("ne confond pas عَبَدَ et عَبْد (vocalisation différente → AMBIGUOUS)", () => {
    expect(gradeArabicInput("عَبْد", "عَبَدَ")).toBe("AMBIGUOUS");
  });

  it("ne confond pas دِين et دَيْن", () => {
    expect(gradeArabicInput("دَيْن", "دِين")).toBe("AMBIGUOUS");
  });

  it("ضَالّ ≠ ظِلّ (consonne différente → INCORRECT)", () => {
    expect(gradeArabicInput("ظِلّ", "ضَالّ")).toBe("INCORRECT");
  });

  it("note le français normalisé (casse, accents, ponctuation) sans accepter un autre sens", () => {
    expect(
      gradeFrenchInput("Souverain", ["souverain / maître", "souverain", "maître"]),
    ).toBe("CORRECT");
    expect(gradeFrenchInput("Souverain !", ["souverain"])).toBe("CORRECT");
    expect(gradeFrenchInput("livre", ["souverain", "maître"])).toBe("INCORRECT");
    expect(gradeFrenchInput("", ["souverain"])).toBe("INCORRECT");
  });
});
