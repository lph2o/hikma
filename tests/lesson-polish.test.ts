import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonDiscovery } from "../components/learn/lesson-discovery";
import { PronunciationGuided } from "../components/learn/exercises/pronunciation-exercise";
import type { GeneratedExercise } from "../lib/exercises";

const guided: GeneratedExercise = {
  type: "PRONUNCIATION_GUIDED",
  prompt: "Écoute, observe puis répète.",
  difficulty: 1,
  options: [],
  metadata: {
    targetWordId: "word-1",
    arabic: "بِسْمِ",
    transliteration: "bis'mi",
    meaning: "Au nom de",
    audioUrl: "/audio/bismi.mp3",
    phoneticHints: ["Le soukoun coupe le son."],
    phoneticMarks: [],
  },
};

describe("lesson premium polish", () => {
  it("rend un état microphone neutre avant l'initialisation client", () => {
    const html = renderToStaticMarkup(
      React.createElement(PronunciationGuided, {
        arabic: "ٱلرَّحْمَـٰنِ",
        transliteration: "ar-Raḥmāni",
        meaning: "Le Tout Miséricordieux",
        audioUrl: null,
        hints: [],
        marks: [],
      }),
    );

    expect(html).toContain("Préparation du microphone…");
    expect(html).not.toContain("Répète à ton tour et enregistre");
  });

  it("compose le mot courant et la prononciation guidée sans doubler l’audio", () => {
    const html = renderToStaticMarkup(
      React.createElement(LessonDiscovery, {
        lessonTitle: "La Basmala",
        lessonObjective: "Reconnaître les mots de la leçon.",
        words: [{
          wordId: "word-1",
          arabic: "بِسْمِ",
          transliteration: "bis'mi",
          meaning: "Au nom de",
          audioUrl: "/audio/bismi.mp3",
        }],
        guidedPronunciation: guided,
        isAuthenticated: false,
        onQuit: () => {},
        onStart: () => {},
        ayahContext: [],
        meaningFallback: false,
        audioUnavailable: false,
      }),
    );

    expect(html).toContain('data-slot="lesson-word-hero"');
    expect(html).toContain('data-slot="guided-pronunciation-stage"');
    expect(html).toContain("بِسْمِ");
    expect(html).toContain("Prononciation guidée");
    expect((html.match(/Écouter le modèle/g) ?? []).length).toBe(1);
    expect(html).not.toContain("Écouter le mot");
  });

  it("sépare verset, traduction et référence sans altérer l’arabe", () => {
    const html = renderToStaticMarkup(
      React.createElement(LessonDiscovery, {
        lessonTitle: "La Basmala",
        words: [{ wordId: "word-1", arabic: "مَـٰلِكِ", transliteration: "māliki", meaning: "Roi" }],
        guidedPronunciation: null,
        isAuthenticated: false,
        onQuit: () => {},
        onStart: () => {},
        ayahContext: [{
          surahNumber: 1,
          surahName: "L’ouverture",
          ayahNumber: 4,
          arabic: "مَـٰلِكِ يَوْمِ الدِّينِ",
          french: "Maître du Jour de la rétribution.",
        }],
        meaningFallback: false,
        audioUnavailable: false,
      }),
    );

    expect(html).toContain("Verset étudié");
    expect(html).toContain("Traduction française");
    expect(html).toContain("L’ouverture · 1:4");
    expect(html).toContain("مَـٰلِكِ يَوْمِ الدِّينِ");
  });
});
