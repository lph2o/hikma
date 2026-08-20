import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArabicText } from "../components/ui/arabic-text";
import { HikmaExplanation } from "../components/ui/hikma-explanation";
import { ContextRecognitionExercise } from "../components/learn/exercises";
import { ExerciseFeedback } from "../components/ui/exercise";
import { pedagogicalExplanation } from "../components/learn/exercises/pedagogical-feedback";
import { detectTranslationExposure } from "../lib/exercises/context-integrity";
import { contextRecognition } from "../lib/exercises/generators/context";
import { formToMeaning } from "../lib/exercises/generators/recall";
import { buildOptions } from "../lib/exercises/generators/shared";
import type { GeneratedExercise } from "../lib/exercises";
import type { WordBankEntry } from "../lib/learning";

const target: WordBankEntry = {
  wordId: "word-1",
  arabic: "نَعْبُدُ",
  transliteration: "naʿbudu",
  meaning: "nous adorons",
  meaningLanguage: "fr",
  isValidated: true,
  meaningFallback: false,
};

const context = {
  surahNumber: 1,
  ayahNumber: 5,
  arabic: "إِيَّاكَ نَعْبُدُ",
  french: "C’est Toi seul que nous adorons.",
};

function exerciseWithContext(exposure: "REVEAL_RISK" | "SAFE_CONTEXT"): GeneratedExercise {
  return {
    type: "CONTEXT_RECOGNITION",
    prompt: "Dans ce verset, que signifie « نَعْبُدُ » ?",
    difficulty: 1,
    options: [
      { position: 1, content: "nous adorons", isCorrect: true, wordId: "word-1" },
      { position: 2, content: "ils adorent", isCorrect: false, wordId: "word-2", confidence: "UNKNOWN" },
    ],
    metadata: {
      targetWordId: "word-1",
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      context,
      translationExposure: exposure,
    },
  };
}

describe("Phase 6G — integrity contextuelle", () => {
  it("détecte uniquement une réponse connue verbatim", () => {
    expect(detectTranslationExposure(context.french, [target.meaning!])).toBe("REVEAL_RISK");
    expect(detectTranslationExposure("Une traduction qui situe le verset.", [target.meaning!])).toBe("SAFE_CONTEXT");
    expect(detectTranslationExposure(context.french, [])).toBe("UNKNOWN");
  });

  it("porte l'état de divulgation dans l'exercice généré", () => {
    const generated = contextRecognition({ target, bank: [target], difficulty: 1, context });
    expect(generated?.metadata.translationExposure).toBe("REVEAL_RISK");
  });

  it("replie une traduction qui révèle la réponse et conserve l'arabe", () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextRecognitionExercise, {
        exercise: exerciseWithContext("REVEAL_RISK"),
        answer: null,
        result: null,
        onChoose: () => {},
      }),
    );
    expect(html).toContain("Afficher la traduction du verset");
    expect(html).not.toContain("C’est Toi seul que nous adorons.");
    expect(html).toContain("إِيَّاكَ نَعْبُدُ");
  });

  it("laisse visible une traduction dont le texte ne contient pas la réponse", () => {
    const html = renderToStaticMarkup(
      React.createElement(ContextRecognitionExercise, {
        exercise: exerciseWithContext("SAFE_CONTEXT"),
        answer: null,
        result: null,
        onChoose: () => {},
      }),
    );
    expect(html).toContain("C’est Toi seul que nous adorons.");
    expect(html).toContain("Contexte du verset");
  });
});

describe("Phase 6G — langue du rappel", () => {
  it("génère le rappel français uniquement pour un sens français validé", () => {
    expect(formToMeaning({ target, bank: [target], difficulty: 1 })?.metadata.answerLanguage).toBe("FR_VERIFIED");
  });

  it("ne génère pas un rappel français contradictoire pour un fallback anglais", () => {
    const english = { ...target, meaning: "we worship", meaningLanguage: "en", meaningFallback: true, isValidated: false };
    expect(formToMeaning({ target: english, bank: [english], difficulty: 1 })).toBeNull();
  });
});

describe("Phase 6G — distracteurs et arabe", () => {
  it("marque honnêtement les distracteurs sans relation vérifiée", () => {
    const distractor = { ...target, wordId: "word-2", meaning: "ils adorent" };
    const options = buildOptions(target, [distractor], "meaning");
    expect(options.find((option) => !option.isCorrect)?.confidence).toBe("UNKNOWN");
  });

  it("ne remplace pas les caractères Quranic Arabic dans le rendu", () => {
    const html = renderToStaticMarkup(
      React.createElement(ArabicText, { scale: "word" }, "ٱلرَّحْمَـٰنِ"),
    );
    expect(html).toContain("ٱلرَّحْمَـٰنِ");
  });

  it("expose uniquement les repères lexicaux et contextuels réellement disponibles", () => {
    const exercise: GeneratedExercise = {
      type: "FORM_TO_MEANING",
      prompt: "Que signifie ce mot ?",
      difficulty: 1,
      options: [],
      metadata: { targetWordId: "word-1", arabic: target.arabic, transliteration: target.transliteration, meaning: target.meaning },
    };
    expect(pedagogicalExplanation(exercise)?.availability).toBe("partial");
    expect(pedagogicalExplanation(exercise)?.meaning).toBe(target.meaning);

    const html = renderToStaticMarkup(
      React.createElement(HikmaExplanation, {
        data: pedagogicalExplanation({
            ...exercise,
            metadata: {
              ...exercise.metadata,
              meaningValidated: true,
              lemmaMeaning: "adorer",
              audioUrl: "https://example.test/muallim.opus",
              context,
            },
          })!,
        defaultOpen: true,
      }),
    );
    expect(html).toContain("Sens");
    expect(html).toContain("Repère de la même famille");
    expect(html).toContain("Contexte · sourate 1, verset 5");
    expect(html).toContain("Écouter le mot");
    expect(html).not.toContain("Racine");
    expect(html).not.toContain("Morphologie");
  });

  it("reste honnête quand le lemme, le contexte, l'audio et les données avancées manquent", () => {
    const exercise: GeneratedExercise = {
      type: "MEANING_TO_FORM",
      prompt: "Quel est le mot arabe ?",
      difficulty: 1,
      options: [],
      metadata: {
        targetWordId: "word-2",
        arabic: "إِيَّاكَ",
        transliteration: "iyyāka",
        meaning: "Toi seul",
        expectedArabic: "إِيَّاكَ",
      },
    };
    const explanation = pedagogicalExplanation(exercise);
    expect(explanation?.availability).toBe("partial");
    expect(explanation?.lemmaMeaning).toBeNull();
    expect(explanation?.context).toBeNull();
    expect(explanation?.audioUrl).toBeNull();
  });

  it("conserve glose, lemme, contexte et audio dans une explication LEMMA_RELATION", () => {
    const exercise: GeneratedExercise = {
      type: "LEMMA_RELATION",
      prompt: "Quel mot appartient au même lemme ?",
      difficulty: 2,
      options: [
        { position: 1, content: "لِلَّهِ ۖ", isCorrect: true, wordId: "word-2" },
        { position: 2, content: "رَبِّ", isCorrect: false, wordId: "word-3" },
      ],
      metadata: {
        targetWordId: "word-2",
        arabic: "لِلَّهِ",
        transliteration: "lillāhi",
        meaning: "à / pour Allah",
        meaningValidated: true,
        lemmaMeaning: "Allah",
        lemma: { lemmaId: "lemma-1", siblings: [{ wordId: "word-4", arabic: "ٱللَّهِ" }] },
        context,
        audioUrl: "https://example.test/lillahi.opus",
      },
    };
    const data = pedagogicalExplanation(exercise);
    expect(data?.meaning).toBe("à / pour Allah");
    expect(data?.lemmaMeaning).toBe("Allah");
    expect(data?.context?.arabic).toBe(context.arabic);
    expect(data?.audioUrl).toBe("https://example.test/lillahi.opus");

    const html = renderToStaticMarkup(
      React.createElement(HikmaExplanation, { data: data!, defaultOpen: true }),
    );
    expect(html).toContain("Sens");
    expect(html).toContain("à / pour Allah");
    expect(html).toContain("Repère de la même famille");
    expect(html).toContain("Contexte · sourate 1, verset 5");
    expect(html).toContain("Écouter le mot");
  });

  it("rend l'approfondissement disponible (replié) après une réussite LEMMA_RELATION", () => {
    const html = renderToStaticMarkup(
      React.createElement(ExerciseFeedback, {
        status: "correct",
        correctContent: null,
        explanationData: pedagogicalExplanation({
          type: "LEMMA_RELATION",
          prompt: "Quel mot appartient au même lemme ?",
          difficulty: 2,
          options: [],
          metadata: {
            targetWordId: "word-2",
            arabic: "لِلَّهِ",
            transliteration: "lillāhi",
            meaning: "à / pour Allah",
            lemma: { lemmaId: "lemma-1", siblings: [{ wordId: "word-4", arabic: "ٱللَّهِ" }] },
          },
        })!,
      }),
    );
    expect(html).toContain("Comprendre ce mot");
    expect(html).not.toContain("Ta réponse");
    expect(html).not.toContain("Réponse attendue");
  });
});
