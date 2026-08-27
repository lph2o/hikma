import { describe, expect, it } from "vitest";
import { REVEAL_FIXTURE_YAWMA, FIXTURE_CONTENT_KEY, FIXTURE_ARABIC } from "../lib/content-studio/video/fixtures";
import {
  buildVideoContentFromQuiz,
  buildVideoContentFromReveal,
  toVideoSceneData,
  SCENE_FRAMES,
  VIDEO_FPS,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
} from "../lib/content-studio/video/pipeline";
import type { QuizPayloadV1, RevealPayloadV1 } from "../lib/content-api/types";
import type { VideoSceneKind } from "../lib/content-studio/video/types";

describe("buildVideoContentFromReveal — données éditoriales (aucune invention)", () => {
  it("projette le payload WORD_REVEAL_V1 sans invention", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    expect(content.contentKey).toBe(FIXTURE_CONTENT_KEY);
    expect(content.word.arabic).toBe(FIXTURE_ARABIC); // texte DB exact, jamais normalisé
    expect(content.meaning).toBe("jour");
    expect(content.meaningConfidence).toBe("VERIFIED"); // FORME → VERIFIED
    expect(content.occurrenceCount).toBe(131);
    expect(content.firstOccurrence).toEqual({
      surahNumber: 2,
      surahName: "Al-Baqarah",
      ayahNumber: 113,
      excerptUthmani: "ٱلْقِيَـٰمَةِ يَوْمَ",
    });
    expect(content.explanation).toBeNull(); // absent du payload → null, pas de placeholder
    expect(content.cta).toBe("Apprends un mot coranique à la fois.");
  });

  it("rend le hook depuis la banque HOOKS_V1 (id stable, texte dérivé du count réel)", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    expect(content.hook).toBe("Ce mot apparaît 131 fois dans le Coran.");
  });

  it("FORME → VERIFIED / LEMME → PARTIAL (politique Content API conservée)", () => {
    const lemme = buildVideoContentFromReveal({
      ...REVEAL_FIXTURE_YAWMA,
      meaning: { ...REVEAL_FIXTURE_YAWMA.meaning, sourceType: "LEMME" },
      sources: { ...REVEAL_FIXTURE_YAWMA.sources, meaningSourceTable: "lemma_translations" },
    });
    expect(lemme.meaningConfidence).toBe("PARTIAL");
    expect(buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA).meaningConfidence).toBe("VERIFIED");
  });

  it("traçabilité source + instantané licence préservés", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    expect(content.metadata.meaningSourceId).toBe("wt-row-2");
    expect(content.metadata.meaningSourceTable).toBe("word_translations");
    expect(content.metadata.ayahId).toBe("a-2113");
    expect(content.metadata.licenseSnapshot.audio).toBe("DISABLED");
    expect(content.metadata.licenseSnapshot.verseTranslation).toBe("REVIEW_REQUIRED");
  });
});

describe("buildVideoContentFromQuiz — variante quiz", () => {
  const quizPayload: QuizPayloadV1 = {
    contentKey: "a".repeat(64),
    templateKey: "WORD_QUIZ_V1",
    templateVersion: "1",
    language: "fr",
    status: "GENERATED",
    word: { id: "w-1", arabic: "يَوْمَ", transliteration: "yawma" },
    quiz: {
      question: "Que signifie ce mot ?",
      options: [
        { content: "nuit", isCorrect: false, confidence: "VERIFIED" },
        { content: "jour", isCorrect: true, confidence: "VERIFIED" },
        { content: "ciel", isCorrect: false, confidence: "VERIFIED" },
        { content: "mer", isCorrect: false, confidence: "VERIFIED" },
      ],
    },
    hookVariant: { id: "HOOK_H2", version: 1 },
    cta: null,
    caption: { text: "hook", language: "fr", hashtags: [] },
    licenses: REVEAL_FIXTURE_YAWMA.licenses,
    sources: {
      wordId: "w-1",
      meaningSourceId: "wt-2",
      meaningSourceTable: "word_translations",
      lemmaSourceId: null,
      explanationSourceId: null,
      ayahId: null,
    },
    render: REVEAL_FIXTURE_YAWMA.render,
  };

  it("glose = option correcte ; champs absents → null (jamais inventés)", () => {
    const content = buildVideoContentFromQuiz(quizPayload);
    expect(content.meaning).toBe("jour");
    expect(content.occurrenceCount).toBeNull(); // absent du payload quiz
    expect(content.firstOccurrence).toBeNull();
    expect(content.explanation).toBeNull();
    expect(content.cta).toBeNull();
  });
});

describe("toVideoSceneData — montage 9:16 déterministe", () => {
  it("scènes attendues (ordre éditorial), durées > 0, format 1080×1920 @30fps", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    const data = toVideoSceneData(content);

    expect(data.width).toBe(VIDEO_WIDTH);
    expect(data.height).toBe(VIDEO_HEIGHT);
    expect(data.fps).toBe(VIDEO_FPS);
    expect(data.layout).toBe("9:16");
    expect(data.theme).toBe("HIKMA");

    const kinds = data.scenes.map((s) => s.kind);
    // Fixture : pas d'explication → intro, word, meaning, quran, cta.
    expect(kinds).toEqual(["intro", "word", "meaning", "quran", "cta"]);
    for (const scene of data.scenes) {
      expect(scene.durationInFrames).toBeGreaterThan(0);
    }
    expect(data.durationInFrames).toBe(
      SCENE_FRAMES.intro + SCENE_FRAMES.word + SCENE_FRAMES.meaning + SCENE_FRAMES.quran + SCENE_FRAMES.cta,
    );
  });

  it("explication présente → scène explanation incluse (et durées ajustées)", () => {
    const withExplanation: RevealPayloadV1 = {
      ...REVEAL_FIXTURE_YAWMA,
      explanation: {
        text: "Le jour, période lumineuse.",
        sourceId: "we-3",
        validated: true,
        validatedAt: "2026-06-01T00:00:00Z",
      },
    };
    const data = toVideoSceneData(buildVideoContentFromReveal(withExplanation));
    expect(data.scenes.map((s) => s.kind)).toEqual([
      "intro", "word", "meaning", "quran", "explanation", "cta",
    ]);
  });

  it("préserve l'arabe Uthmani exact (RTL, diacritiques intactes)", () => {
    const data = toVideoSceneData(buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA));
    const wordScene = data.scenes.find((s) => s.kind === "word");
    expect(wordScene?.arabic).toBe(FIXTURE_ARABIC);
    const quranScene = data.scenes.find((s) => s.kind === "quran");
    expect(quranScene?.arabic).toBe("ٱلْقِيَـٰمَةِ يَوْمَ"); // text_uthmani inaltéré
    expect(quranScene?.subtext).toBe("Sourate Al-Baqarah · verset 113");
  });

  it("déterministe : mêmes données ⇒ même montage (deep equal)", () => {
    const a = toVideoSceneData(buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA));
    const b = toVideoSceneData(buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA));
    expect(a).toEqual(b);
  });

  it("tous les kinds sont dans l'enum contractuel (aucun kind inventé)", () => {
    const data = toVideoSceneData(buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA));
    const allowed = new Set<VideoSceneKind>(["intro", "word", "meaning", "quran", "explanation", "cta"]);
    for (const scene of data.scenes) {
      expect(allowed.has(scene.kind)).toBe(true);
    }
  });
});
