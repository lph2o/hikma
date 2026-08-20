import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExerciseFeedback } from "../components/ui/exercise";
import { FeedbackPanel } from "../components/learn/exercises/options-exercise";
import { HikmaExplanation } from "../components/ui/hikma-explanation";
import { feedbackMoment, islamicFeedbackCopy, pedagogicalExplanation } from "../components/learn/exercises/pedagogical-feedback";
import { attachExerciseIdentities, exerciseIdentity } from "../components/learn/exercises/exercise-identity";
import type { GeneratedExercise } from "../lib/exercises";

function exercise(type: GeneratedExercise["type"], prompt: string): GeneratedExercise {
  return {
    type,
    prompt,
    difficulty: 1,
    options: [],
    metadata: {
      targetWordId: "word-1",
      arabic: "نَعْبُدُ",
      transliteration: "naʿbudu",
      meaning: "nous adorons",
    },
  };
}

describe("exercise state identity", () => {
  it("attache une identité stable et distingue A → B → A", () => {
    const source = [
      exercise("FORM_TO_MEANING", "A"),
      exercise("MEANING_TO_FORM", "B"),
      exercise("FORM_TO_MEANING", "A"),
    ];
    const [a, b, aAgain] = attachExerciseIdentities("lesson-1", source);
    expect(a?.id).not.toBe(b?.id);
    expect(a?.id).not.toBe(aAgain?.id);
    expect(exerciseIdentity(a!)).toBe(a?.id);
  });
});

describe("feedback answer contract", () => {
  it("ne répète pas la réponse attendue dans une explication générée", () => {
    const html = renderToStaticMarkup(
      React.createElement(FeedbackPanel, {
        result: {
          correct: false,
          status: "INCORRECT",
          correctOption: null,
          explanation: "La bonne réponse était « au nom de ».",
        },
        userAnswer: "Allah",
        correctContent: "au nom de",
      }),
    );
    expect(html).toContain("Ta réponse");
    expect(html).toContain("Réponse attendue");
    expect(html).not.toContain("La bonne réponse était");
    expect((html.match(/au nom de/g) ?? []).length).toBe(1);
  });

  it("sépare la réponse brute de la réponse attendue", () => {
    const html = renderToStaticMarkup(
      React.createElement(ExerciseFeedback, {
        status: "incorrect",
        userAnswer: "toi",
        correctContent: "et Toi seul / et c'est Toi que",
        explanation: "Vérifie le sens complet.",
      }),
    );
    expect(html).toContain("toi");
    const expected = "et Toi seul / et c&#x27;est Toi que";
    expect(html).toContain(expected);
    expect(html.indexOf("toi")).not.toBe(html.indexOf(expected));
  });

  it("affiche la bonne réponse (une seule fois) après une réponse correcte", () => {
    const html = renderToStaticMarkup(
      React.createElement(ExerciseFeedback, {
        status: "correct",
        userAnswer: "nous adorons",
        correctContent: "nous adorons",
      }),
    );
    expect(html).not.toContain("Réponse attendue");
    expect(html).toContain("Bonne réponse");
    expect((html.match(/nous adorons/g) ?? []).length).toBe(1);
  });

  it("rend une réponse vide compréhensible", () => {
    const html = renderToStaticMarkup(
      React.createElement(ExerciseFeedback, {
        status: "incorrect",
        userAnswer: null,
        correctContent: "nous adorons",
      }),
    );
    expect(html).toContain("Aucune réponse");
    expect(html).toContain("nous adorons");
  });

  it("ouvre une explication avec une disclosure accessible", () => {
    const html = renderToStaticMarkup(
      React.createElement(HikmaExplanation, {
        defaultOpen: true,
        data: {
          availability: "verified",
          kind: "phonetic",
          shortText: "La shadda double la consonne.",
          arabic: "إِيَّاكَ",
          transliteration: "iyyāka",
        },
      }),
    );
    expect(html).toContain("aria-expanded=\"true\"");
    expect(html).toContain("aria-controls=");
    expect(html).toContain("La shadda double la consonne.");
    expect(html).toContain("إِيَّاكَ");
  });

  it("reste honnête quand une explication fiable est indisponible", () => {
    const html = renderToStaticMarkup(
      React.createElement(HikmaExplanation, {
        defaultOpen: true,
        data: { availability: "unavailable", kind: "meaning" },
      }),
    );
    expect(html).toContain("Cette explication détaillée n’est pas encore disponible pour ce mot.");
    expect(html).not.toContain("racine");
    expect(html).not.toContain("préfixe");
  });

  it("réserve les expressions islamiques aux moments significatifs", () => {
    const ordinary = islamicFeedbackCopy("ordinary");
    const difficult = islamicFeedbackCopy("difficult_success");
    expect(ordinary.title).toBe("Très bien");
    expect(ordinary.title).not.toContain("Mā shā’ Allāh");
    expect(difficult.title).toBe("Mā shā’ Allāh");
  });

  it("dérive uniquement une explication phonétique des données présentes", () => {
    const target = exercise("PHONETIC_DISCRIMINATION", "Écoute puis identifie le trait.");
    target.metadata.phoneticTrait = { explanation: "La shadda double la consonne." };
    target.metadata.phoneticHints = ["La vocalisation reste visible."];
    const explanation = pedagogicalExplanation(target);
    expect(explanation?.availability).toBe("verified");
    expect(explanation?.shortText).toContain("shadda");
  });

  it("classe une réussite difficile sans modifier le résultat métier", () => {
    const target = exercise("FORM_TO_MEANING", "Que signifie ce mot ?");
    target.difficulty = 3;
    expect(feedbackMoment(target)).toBe("difficult_success");
    expect(feedbackMoment(target, { isMilestone: true })).toBe("milestone");
  });
});
