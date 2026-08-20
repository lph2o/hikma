import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeedbackPanel } from "../components/learn/exercises/options-exercise";
import {
  isExplanationRelevant,
  pedagogicalExplanation,
  shortFeedbackCopy,
} from "../components/learn/exercises/pedagogical-feedback";
import type { GeneratedExercise } from "../lib/exercises";
import type { LinguisticEvidence } from "../lib/linguistic/explanation";

function evidence(): LinguisticEvidence {
  return {
    surah: 1,
    ayah: 1,
    position: 1,
    masaqWord: "بِسْمِ",
    stem: "اسم",
    glossEn: "in-(the)-name",
    pos: ["PREP", "NOUN_ABSTRACT"],
    caseMood: ["INVARIABLE", "GENITIVE"],
    syntax: ["PREP", "PREP_OBJ"],
    segments: [
      { segmentNo: 1, text: "ب", morphType: "Prefix", morphTag: "PREP", kind: "PARTICLE" },
      { segmentNo: 2, text: "اسم", morphType: "Stem", morphTag: "NOUN_ABSTRACT", kind: "STEM" },
    ],
    lemmaMappingStatus: "NORMALIZATION_DIFFERENCE",
  };
}

function exercise(overrides: Partial<GeneratedExercise> = {}): GeneratedExercise {
  return {
    type: "FORM_TO_MEANING",
    prompt: "Que signifie « بِسْمِ » ?",
    difficulty: 1,
    options: [],
    metadata: {
      targetWordId: "word-1",
      arabic: "بِسْمِ",
      transliteration: "bismi",
      meaning: "au nom (de)",
      meaningValidated: true,
      audioUrl: "https://audio.test/muallim.opus",
      context: { surahNumber: 1, ayahNumber: 1, arabic: "بِسْمِ ٱللَّهِ", french: "Au nom de Dieu" },
      linguisticEvidence: evidence(),
    },
    ...overrides,
  };
}

const correctResult = {
  correct: true,
  correctOption: { position: 1, content: "au nom (de)", isCorrect: true, wordId: "word-1" },
  explanation: null,
};

const incorrectResult = {
  correct: false,
  status: "INCORRECT" as const,
  correctOption: { position: 1, content: "au nom (de)", isCorrect: true, wordId: "word-1" },
  explanation: "La bonne réponse était « au nom (de) ».",
};

const ambiguousResult = {
  correct: false,
  status: "AMBIGUOUS" as const,
  correctOption: { position: 1, content: "بِسْمِ", isCorrect: true, wordId: "word-1" },
  explanation: "Ta réponse est proche, mais elle peut avoir plusieurs interprétations.",
};

describe("A — réponse CORRECTE", () => {
  it("affiche le statut, la bonne réponse, l'audio, le rappel et « Comprendre ce mot » (replié)", () => {
    const html = renderToStaticMarkup(
      React.createElement(FeedbackPanel, {
        result: correctResult,
        exercise: exercise(),
        correctContent: "au nom (de)",
      }),
    );
    expect(html).toContain("Bonne réponse");
    expect(html).toContain("au nom (de)");
    expect(html).toContain("Écouter le mot"); // audio réel
    expect(html).toContain("Bien vu"); // rappel court
    expect(html).toContain("Comprendre ce mot");
    expect(html).toContain('aria-expanded="false"'); // repliée par défaut
    expect(html).not.toContain("Ta réponse");
    expect(html).not.toContain("Réponse attendue");
  });
});

describe("B — réponse INCORRECTE", () => {
  it("affiche la réponse brute, la réponse attendue et ouvre « Comprendre ce mot »", () => {
    const html = renderToStaticMarkup(
      React.createElement(FeedbackPanel, {
        result: incorrectResult,
        exercise: exercise(),
        correctContent: "au nom (de)",
        userAnswer: "merci",
      }),
    );
    expect(html).toContain("Ta réponse");
    expect(html).toContain("merci");
    expect(html).toContain("Réponse attendue");
    expect(html).toContain("au nom (de)");
    expect(html).toContain("Comprendre ce mot");
    expect(html).toContain('aria-expanded="true"'); // ouverte automatiquement sur erreur
  });
});

describe("C — réponse AMBIGUË", () => {
  it("distingue l'ambiguïté (ni erreur) et propose la nuance + l'approfondissement", () => {
    const html = renderToStaticMarkup(
      React.createElement(FeedbackPanel, {
        result: ambiguousResult,
        exercise: exercise(),
        correctContent: "بِسْمِ",
        userAnswer: "بسم",
      }),
    );
    expect(html).toContain("À vérifier"); // statut ambigu
    expect(html).toContain("Ta réponse est proche"); // nuance conservée
    expect(html).toContain("Comprendre ce mot");
  });
});

describe("D — MASAQ dans l'approfondissement (2 blocs max, jamais de racine)", () => {
  it("produit décomposition + identité, sans racine ni tag brut", () => {
    const data = pedagogicalExplanation(exercise());
    const blocks = data?.linguistic?.blocks ?? [];
    expect(blocks.length).toBeLessThanOrEqual(2);
    expect(blocks.map((b) => b.type)).toContain("decomposition");
    const html = renderToStaticMarkup(
      React.createElement(FeedbackPanel, { result: incorrectResult, exercise: exercise(), correctContent: "au nom (de)", userAnswer: "x" }),
    );
    expect(html).toContain("Décomposition");
    expect(html).not.toContain("Racine");
    expect(html).not.toContain("NOUN_ABSTRACT");
    expect(html).not.toContain("GENITIVE");
  });
});

describe("anti-répétition — shortFeedbackCopy", () => {
  it("varie selon l'issue", () => {
    const correct = shortFeedbackCopy(exercise(), "correct");
    const incorrect = shortFeedbackCopy(exercise(), "incorrect");
    const ambiguous = shortFeedbackCopy(exercise(), "ambiguous");
    expect(correct).not.toBe(incorrect);
    expect(correct).not.toBe(ambiguous);
    expect(ambiguous).toContain("formulations");
  });

  it("varie selon les données disponibles (décomposition vs contexte vs simple)", () => {
    const withDecomposition = shortFeedbackCopy(exercise(), "correct");
    const plain = shortFeedbackCopy(
      exercise({ metadata: { targetWordId: "w", arabic: "رَبِّ", transliteration: "rabbi", meaning: "Seigneur" } }),
      "correct",
    );
    const withContext = shortFeedbackCopy(
      exercise({
        metadata: {
          targetWordId: "w",
          arabic: "يَوْمِ",
          transliteration: "yawmi",
          meaning: "jour",
          context: { surahNumber: 1, ayahNumber: 4, arabic: "مَالِكِ يَوْمِ ٱلدِّينِ", french: "Maître du Jour de la rétribution" },
        },
      }),
      "correct",
    );
    expect(withDecomposition).toContain("construit");
    expect(plain).toContain("Bien vu :");
    expect(withContext).toContain("contexte");
    // les trois sont distincts : pas de rappel générique systématique
    expect(new Set([withDecomposition, plain, withContext]).size).toBe(3);
  });

  it("ne répète pas le sens pour une erreur (la « Réponse attendue » l'affiche déjà)", () => {
    const incorrect = shortFeedbackCopy(exercise(), "incorrect");
    expect(incorrect).toContain("construction"); // pointe la décomposition, pas le sens
  });
});

describe("isExplanationRelevant — indépendant du résultat", () => {
  it("est vrai dès qu'une donnée d'explication existe, quel que soit le résultat", () => {
    const data = pedagogicalExplanation(exercise());
    expect(isExplanationRelevant(data, "FORM_TO_MEANING")).toBe(true);
    expect(isExplanationRelevant(data, "LEMMA_RELATION")).toBe(true);
  });

  it("exclut les types d'auto-évaluation et les données absentes", () => {
    const data = pedagogicalExplanation(exercise());
    expect(isExplanationRelevant(null, "FORM_TO_MEANING")).toBe(false);
    expect(isExplanationRelevant(data, "WORD_RECOGNITION")).toBe(false);
    expect(isExplanationRelevant(data, "PRONUNCIATION_GUIDED")).toBe(false);
  });
});

describe("E-bis — EXPLICATION DE SENS (Phase 44B)", () => {
  it("transmet senseExplanation validée dans le bloc « Pourquoi ce sens ? »", () => {
    const data = pedagogicalExplanation(
      exercise({
        metadata: {
          targetWordId: "word-1",
          arabic: "هَاوِيَةٌۭ",
          transliteration: "hāwiya",
          meaning: "l'abîme / le gouffre",
          meaningValidated: true,
          senseExplanation: "Al-Hāwiya, « l'abîme » : l'un des noms de l'Enfer, la fosse où tombe celui dont les œuvres sont légères.",
        },
      }),
    );
    expect(data?.senseExplanation).toContain("Al-Hāwiya");
    const html = renderToStaticMarkup(
      React.createElement(FeedbackPanel, { result: incorrectResult, exercise: exercise({
        metadata: {
          targetWordId: "word-1",
          arabic: "هَاوِيَةٌۭ",
          transliteration: "hāwiya",
          meaning: "l'abîme / le gouffre",
          senseExplanation: "Al-Hāwiya : l'un des noms de l'Enfer.",
        },
      }), correctContent: "l'abîme / le gouffre", userAnswer: "x" }),
    );
    expect(html).toContain("Pourquoi ce sens");
    expect(html).toContain("Al-Hāwiya");
  });

  it("n'affiche AUCUN bloc quand l'explication est absente (jamais de bloc vide)", () => {
    const data = pedagogicalExplanation(exercise({ metadata: { targetWordId: "w", arabic: "رَبِّ", transliteration: "rabbi", meaning: "Seigneur" } }));
    // Absence = null (jamais fabriqué), donc aucun bloc rendu.
    expect(data?.senseExplanation ?? null).toBeNull();
    const html = renderToStaticMarkup(
      React.createElement(FeedbackPanel, { result: incorrectResult, exercise: exercise({ metadata: { targetWordId: "w", arabic: "رَبِّ", transliteration: "rabbi", meaning: "Seigneur" } }), correctContent: "Seigneur", userAnswer: "x" }),
    );
    expect(html).not.toContain("Pourquoi ce sens");
  });

  it("conserve la glose, le contexte, l'audio et MASAQ intacts quand une explication existe", () => {
    const data = pedagogicalExplanation(
      exercise({
        metadata: {
          targetWordId: "word-1",
          arabic: "ٱلْقَدْرِ",
          transliteration: "al-qadr",
          meaning: "le destin / la destinée",
          meaningValidated: true,
          senseExplanation: "Le décret, le destin : dans « la nuit du Qadr ».",
          context: { surahNumber: 97, ayahNumber: 1, arabic: "إِنَّآ أَنزَلْنَـٰهُ فِى لَيْلَةِ ٱلْقَدْرِ", french: "Nous l'avons fait descendre pendant la nuit du Destin." },
          audioUrl: "https://audio.test/qadr.opus",
          linguisticEvidence: evidence(),
        },
      }),
    );
    expect(data?.meaning).toBe("le destin / la destinée");
    expect(data?.senseExplanation).toContain("nuit du Qadr");
    expect(data?.context?.surahNumber).toBe(97);
    expect(data?.audioUrl).toBe("https://audio.test/qadr.opus");
    expect(data?.linguistic?.blocks.length).toBeGreaterThan(0);
  });
});

describe("E — non-régression (grading / données inchangés)", () => {
  it("laisse les données lexicales, le contexte et l'audio intacts", () => {
    const data = pedagogicalExplanation(exercise());
    expect(data?.meaning).toBe("au nom (de)");
    expect(data?.context?.french).toBe("Au nom de Dieu");
    expect(data?.audioUrl).toBe("https://audio.test/muallim.opus");
  });

  it("ne modifie jamais le résultat de grading passé en entrée", () => {
    const result = { ...incorrectResult };
    renderToStaticMarkup(
      React.createElement(FeedbackPanel, { result, exercise: exercise(), correctContent: "au nom (de)", userAnswer: "x" }),
    );
    expect(result.correct).toBe(false);
    expect(result.status).toBe("INCORRECT");
  });
});
