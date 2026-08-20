import { describe, expect, it } from "vitest";
import {
  generateExercise,
  generatePhoneticDiscriminationSet,
  scoreAnswer,
  validateAnswer,
  validateGeneratedExercise,
  GENERATORS,
  PHONETIC_DISCRIMINATION_MAX_PER_LESSON,
  PHONETIC_DISCRIMINATION_TRAIT_ORDER,
} from "../lib/exercises";
import { SKILLS, skillForExerciseType } from "../lib/learning";
import { detectMarks } from "../lib/learning/phonetics";
import type { WordBankEntry } from "../lib/learning";

// Formes RÉELLES d'Al-Fatiha (aucune inventée) pour les tests de trait.
const AUDIO = "https://example.test/muallim/00000000-0000-0000-0000-000000000000.opus";

function entry(wordId: string, arabic: string): WordBankEntry {
  return { wordId, arabic, transliteration: null, meaning: null };
}

function gen(arabic: string, audio: string | null = AUDIO) {
  return generateExercise("PHONETIC_DISCRIMINATION", {
    target: entry("w", arabic),
    bank: [entry("w", arabic)],
    difficulty: 1,
    audioUrl: audio,
  });
}

describe("PHONETIC_DISCRIMINATION — génération (24H-Q2-B)", () => {
  it("génère un exercice valide pour une forme avec shadda", () => {
    const ex = gen("ٱللَّهِ");
    expect(ex).not.toBeNull();
    expect(validateGeneratedExercise(ex!).valid).toBe(true);
    expect(ex!.options).toHaveLength(4);
    expect(ex!.options.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(ex!.options.find((o) => o.isCorrect)!.content).toBe("shadda");
  });

  it("retourne null sans audio (jamais d'audio simulé)", () => {
    expect(gen("ٱللَّهِ", null)).toBeNull();
    expect(gen("ٱللَّهِ", "")).toBeNull();
  });

  it("retourne null quand aucune caractéristique retenue n'est présente", () => {
    // وَلَا : aucune shadda/sukun/madda/hamza/tanwin.
    expect(detectMarks("وَلَا").map((m) => m.key)).toEqual([]);
    expect(gen("وَلَا")).toBeNull();
  });

  it("est déterministe (aucun aléa)", () => {
    const a = gen("ٱللَّهِ");
    const b = gen("ٱللَّهِ");
    expect(a).toEqual(b);
  });

  it("cible madda quand présente (ٱلضَّآلِّينَ) et exclut shadda des distracteurs", () => {
    const ex = gen("ٱلضَّآلِّينَ")!;
    const correct = ex.options.find((o) => o.isCorrect)!;
    expect(correct.content).toBe("madda");
    const distractorLabels = ex.options.filter((o) => !o.isCorrect).map((o) => o.content);
    // shadda est réellement présente : elle ne doit JAMAIS être un distracteur.
    expect(distractorLabels).not.toContain("shadda");
  });

  it("cible hamza en priorité (إِيَّاكَ : hamza + shadda présents)", () => {
    const ex = gen("إِيَّاكَ")!;
    expect(ex.options.find((o) => o.isCorrect)!.content).toBe("hamza");
    const distractorLabels = ex.options.filter((o) => !o.isCorrect).map((o) => o.content);
    expect(distractorLabels).not.toContain("shadda"); // présent → exclu
  });

  it("cible soukoun (ٱلْحَمْدُ) et les distracteurs sont des traits absents", () => {
    const ex = gen("ٱلْحَمْدُ")!;
    const correct = ex.options.find((o) => o.isCorrect)!;
    expect(correct.content).toBe("soukoun");
    const present = new Set<string>(detectMarks("ٱلْحَمْدُ").map((m) => m.key));
    for (const d of ex.options.filter((o) => !o.isCorrect)) {
      const key = PHONETIC_DISCRIMINATION_TRAIT_ORDER.find((k) => k === d.content);
      expect(key).toBeDefined();
      expect(present.has(d.content)).toBe(false);
    }
  });

  it("ne propose jamais deux bonnes réponses et aucun doublon", () => {
    for (const arabic of ["ٱللَّهِ", "ٱلْحَمْدُ", "إِيَّاكَ", "ٱلضَّآلِّينَ", "بِسْمِ"]) {
      const ex = gen(arabic)!;
      const report = validateGeneratedExercise(ex);
      expect(report.valid).toBe(true);
      expect(ex.options.filter((o) => o.isCorrect)).toHaveLength(1);
    }
  });

  it("ne fusionne pas les homographes (عَبْد porte un soukoun, عَبَدَ n'a aucun trait)", () => {
    // Protection régression : عَبَدَ (pas de soukoun) vs عَبْد (soukoun).
    const abd = gen("عَبْد")!;
    expect(abd.options.find((o) => o.isCorrect)!.content).toBe("soukoun");
    expect(gen("عَبَدَ")).toBeNull();
  });

  it("est enregistré dans le registre des générateurs", () => {
    expect(GENERATORS.PHONETIC_DISCRIMINATION).toBeTypeOf("function");
  });
});

describe("PHONETIC_DISCRIMINATION — grading et score", () => {
  it("valide une bonne réponse et explique la caractéristique", () => {
    const ex = gen("إِيَّاكَ")!; // cible hamza
    const correctIndex = ex.options.findIndex((o) => o.isCorrect);
    const r = validateAnswer(ex, { optionIndex: correctIndex });
    expect(r.correct).toBe(true);
    expect(r.explanation).toContain("coup de glotte");
    expect(scoreAnswer(ex, { optionIndex: correctIndex })).toBe(1);
  });

  it("détecte une mauvaise réponse, sans faux positif", () => {
    const ex = gen("إِيَّاكَ")!;
    const wrongIndex = ex.options.findIndex((o) => !o.isCorrect);
    const r = validateAnswer(ex, { optionIndex: wrongIndex });
    expect(r.correct).toBe(false);
    expect(r.explanation).toContain("hamza");
    expect(r.explanation).toContain("coup de glotte");
    expect(scoreAnswer(ex, { optionIndex: wrongIndex })).toBe(0);
  });
});

describe("PHONETIC_DISCRIMINATION — skill mapping (aucune nouvelle compétence)", () => {
  it("est rattaché à audio_recognition", () => {
    expect(skillForExerciseType("PHONETIC_DISCRIMINATION")).toBe("audio_recognition");
  });

  it("n'introduit aucune nouvelle compétence", () => {
    expect(SKILLS).toHaveLength(8);
    expect((SKILLS as readonly string[])).toContain("audio_recognition");
    expect((SKILLS as readonly string[])).not.toContain("pronunciation_recognition");
  });
});

describe("PHONETIC_DISCRIMINATION — exposition limitée", () => {
  it("borne le nombre d'exercices par leçon (max respecté)", () => {
    const words = [
      entry("w1", "ٱللَّهِ"),
      entry("w2", "ٱلْحَمْدُ"),
      entry("w3", "إِيَّاكَ"),
      entry("w4", "بِسْمِ"),
      entry("w5", "ٱلرَّحْمَـٰنِ"),
    ];
    const audio = new Map(words.map((w) => [w.wordId, AUDIO]));
    const set = generatePhoneticDiscriminationSet(
      words,
      audio,
      1,
      PHONETIC_DISCRIMINATION_MAX_PER_LESSON,
    );
    expect(set.length).toBe(PHONETIC_DISCRIMINATION_MAX_PER_LESSON);
    for (const ex of set) {
      expect(validateGeneratedExercise(ex).valid).toBe(true);
    }
  });

  it("ignore les mots sans trait exploitable et sans audio", () => {
    const words = [
      entry("w1", "وَلَا"), // aucun trait
      entry("w2", "ٱللَّهِ"), // shadda
      entry("w3", "بِسْمِ"), // sukun (audio absent)
    ];
    const audio = new Map([["w2", AUDIO]]); // seul w2 a un audio
    const set = generatePhoneticDiscriminationSet(words, audio, 1, 10);
    expect(set).toHaveLength(1);
    expect(set[0].metadata.targetWordId).toBe("w2");
  });
});
