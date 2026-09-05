import { describe, expect, it } from "vitest";
import {
  buildVideoContentFromReveal,
  buildVideoContentFromQuiz,
  buildVideoContentFromDeepDive,
  buildVideoContentFromFrequencyFact,
  buildVideoContentFromSurahHighlight,
  toVideoSceneData,
  VIDEO_FPS,
} from "@/lib/content-studio/video/pipeline";
import { getEffectiveSceneData } from "@/lib/content-studio/editor/state";
import { computeDefaultWordTimings } from "@/remotion/scenes/GoldenRecitationFollower";
import { REVEAL_FIXTURE_YAWMA } from "@/lib/content-studio/video/fixtures";
import { getAyahAudioUrl } from "@/lib/quran/ayah-audio";
import type { ContentStudioAudio } from "@/lib/content-studio/audio";

describe("PHASE 12 — Content Studio Audio & Render Validation", () => {
  const mockAudio: ContentStudioAudio = {
    wordAudioUrl: "https://test.supabase.co/storage/v1/object/sign/word-audio/yawma.opus?token=xyz",
    verseAudioUrl: getAyahAudioUrl(2113),
    wordAudioDuration: 1.8,
    verseAudioDuration: 8.42,
  };

  // ---------------------------------------------------------------------------
  // AUDIO TESTS
  // ---------------------------------------------------------------------------
  describe("Audio recitation pipeline", () => {
    it("QuranScene contains exactly one verse Audio source and no audio-per-word concatenation", () => {
      const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, mockAudio);
      const sceneData = toVideoSceneData(content);

      const quranScenes = sceneData.scenes.filter((s) => s.kind === "quran");
      expect(quranScenes.length).toBe(1);

      const quranScene = quranScenes[0];
      expect(quranScene.audioUrl).toBe(mockAudio.verseAudioUrl);
      expect(quranScene.audioDuration).toBe(8.42);

      // Le verset utilise un fichier audio complet du verset (Al-Afasy CDN), jamais word_audio
      expect(quranScene.audioUrl).toContain("cdn.islamic.network");
      expect(quranScene.audioUrl).not.toContain("word-audio");
    });

    it("verseAudioUrl !== wordAudioUrl (sources distinctes et isolées)", () => {
      const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, mockAudio);
      const sceneData = toVideoSceneData(content);

      const wordScene = sceneData.scenes.find((s) => s.kind === "word");
      const quranScene = sceneData.scenes.find((s) => s.kind === "quran");

      expect(wordScene?.audioUrl).toBe(mockAudio.wordAudioUrl);
      expect(quranScene?.audioUrl).toBe(mockAudio.verseAudioUrl);
      expect(wordScene?.audioUrl).not.toEqual(quranScene?.audioUrl);
    });

    it("verse scene duration === verse audio duration in frames (@30fps)", () => {
      const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, mockAudio);
      const sceneData = toVideoSceneData(content);

      const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
      const expectedFrames = Math.round(8.42 * VIDEO_FPS); // 253 frames
      expect(quranScene?.durationInFrames).toBe(expectedFrames);
    });

    it("getEffectiveSceneData aligns quran scene duration with real audio duration and refreshes URLs", () => {
      const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, mockAudio);
      const staleEditorState = {
        scenes: [
          { kind: "intro" as const, durationInFrames: 45 },
          { kind: "word" as const, durationInFrames: 60, audioUrl: "old-expired-url" },
          { kind: "meaning" as const, durationInFrames: 75 },
          { kind: "quran" as const, durationInFrames: 90, audioUrl: null, audioDuration: null }, // Fallback 90
          { kind: "cta" as const, durationInFrames: 45 },
        ],
      };

      const { scenes } = getEffectiveSceneData(content, staleEditorState);
      const quran = scenes.find((s) => s.kind === "quran");
      const word = scenes.find((s) => s.kind === "word");

      expect(quran?.audioUrl).toBe(mockAudio.verseAudioUrl);
      expect(quran?.audioDuration).toBe(8.42);
      expect(quran?.durationInFrames).toBe(Math.round(8.42 * VIDEO_FPS)); // Aligné sur l'audio réel

      expect(word?.audioUrl).toBe(mockAudio.wordAudioUrl);
    });

    it("golden follower ends exactly at verse audio end (sum(wordTimings) === totalFrames)", () => {
      const words = ["ٱلْقِيَـٰمَةِ", "يَوْمَ", "ٱللَّهُ", "يَحْكُمُ"];
      const totalFrames = Math.round(8.42 * VIDEO_FPS);

      const timings = computeDefaultWordTimings(words, totalFrames);

      expect(timings.length).toBe(words.length);
      expect(timings[0].startFrame).toBe(0);
      expect(timings[timings.length - 1].endFrame).toBe(totalFrames);

      // Vérifier la contiguïté exacte sans trou ni répétition
      let running = 0;
      for (const t of timings) {
        expect(t.startFrame).toBe(running);
        expect(t.endFrame).toBeGreaterThan(t.startFrame);
        running = t.endFrame;
      }
      expect(running).toBe(totalFrames);
    });
  });

  // ---------------------------------------------------------------------------
  // TEMPLATES & RENDER PIPELINE TESTS
  // ---------------------------------------------------------------------------
  describe("All 5 implemented templates produce valid scene pipeline", () => {
    it("1. WORD_REVEAL_V1 produces valid scenes with audio", () => {
      const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, mockAudio);
      const data = toVideoSceneData(content);
      expect(data.scenes.length).toBeGreaterThanOrEqual(4);
      expect(data.durationInFrames).toBeGreaterThan(150);
      expect(data.layout).toBe("9:16");
    });

    it("2. WORD_QUIZ_V1 produces valid scenes without quran scene", () => {
      const quizPayload = {
        ...REVEAL_FIXTURE_YAWMA,
        templateKey: "WORD_QUIZ_V1" as const,
        cta: null,
        sources: {
          wordId: REVEAL_FIXTURE_YAWMA.sources.wordId,
          meaningSourceId: REVEAL_FIXTURE_YAWMA.sources.meaningSourceId,
          meaningSourceTable: REVEAL_FIXTURE_YAWMA.sources.meaningSourceTable,
          lemmaSourceId: null,
          explanationSourceId: null,
          ayahId: null,
        },
        quiz: {
          question: "Sens ?",
          options: [{ content: "jour", isCorrect: true, confidence: "VERIFIED" as const }],
        },
      };
      const content = buildVideoContentFromQuiz(quizPayload, mockAudio);
      const data = toVideoSceneData(content);
      expect(data.scenes.some((s) => s.kind === "word")).toBe(true);
      expect(data.scenes.some((s) => s.kind === "quran")).toBe(false);
    });

    it("3. VERSE_DEEP_DIVE_V1 produces large quran scene with audio alignment", () => {
      const content = buildVideoContentFromDeepDive(REVEAL_FIXTURE_YAWMA, mockAudio);
      const data = toVideoSceneData(content);
      const quran = data.scenes.find((s) => s.kind === "quran");
      expect(quran).toBeDefined();
      expect(quran?.verseConfig?.mode).toBe("large");
      expect(quran?.durationInFrames).toBe(Math.round(8.42 * VIDEO_FPS));
    });

    it("4. FREQUENCY_FACT_V1 produces frequency intro + quran scene", () => {
      const content = buildVideoContentFromFrequencyFact(REVEAL_FIXTURE_YAWMA, mockAudio);
      const data = toVideoSceneData(content);
      const intro = data.scenes.find((s) => s.kind === "intro");
      expect(intro?.text).toContain("131 fois");
      expect(data.scenes.some((s) => s.kind === "quran")).toBe(true);
    });

    it("5. SURAH_HIGHLIGHT_V1 produces surah highlight intro + scenes", () => {
      const content = buildVideoContentFromSurahHighlight(REVEAL_FIXTURE_YAWMA, mockAudio);
      const data = toVideoSceneData(content);
      const intro = data.scenes.find((s) => s.kind === "intro");
      expect(intro?.text).toContain("Al-Baqarah");
      expect(data.scenes.some((s) => s.kind === "quran")).toBe(true);
    });
  });
});
