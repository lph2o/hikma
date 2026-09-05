import { describe, expect, it } from "vitest";
import {
  buildVideoContentFromDeepDive,
  buildVideoContentFromFrequencyFact,
  buildVideoContentFromSurahHighlight,
  toVideoSceneData,
} from "@/lib/content-studio/video/pipeline";
import { isImplementedFormat, IMPLEMENTED_FORMAT_KEYS } from "@/lib/content-studio/templates";
import type { RevealPayloadV1 } from "@/lib/content-api/types";

const MOCK_PAYLOAD: RevealPayloadV1 = {
  contentKey: "abc123sha",
  templateKey: "WORD_REVEAL_V1",
  templateVersion: "1",
  language: "fr",
  status: "GENERATED",
  word: {
    id: "11111111-1111-1111-1111-111111111111",
    arabic: "يَوْمَ",
    transliteration: "yawma",
    lemmaId: "lemma-1",
  },
  meaning: {
    text: "le jour où",
    sourceType: "FORME",
    sourceId: "src-1",
    validated: true,
    validatedAt: "2026-08-28T00:00:00Z",
  },
  explanation: {
    text: "Ce mot désigne un moment précis.",
    sourceId: "exp-1",
    validated: true,
    validatedAt: "2026-08-28T00:00:00Z",
  },
  occurrenceCount: 27,
  firstOccurrence: {
    surahNumber: 1,
    surahName: "Al-Fatiha",
    ayahNumber: 4,
    excerptUthmani: "مَٰلِكِ يَوْمِ ٱلدِّينِ",
    verseTranslationFr: {
      text: "Maître du Jour de la rétribution.",
      translator: "Muhammad Hamidullah",
    },
  },
  quiz: null,
  series: null,
  hookVariant: {
    id: "HOOK_H1",
    version: 1,
  },
  cta: {
    id: "CTA_APP_STORE",
    version: 1,
    funnelStage: "LEARNING",
    text: "Apprends 100 mots du Coran sur Hikma",
  },
  caption: {
    text: "Le mot du jour",
    language: "fr",
    hashtags: ["#coran", "#arabe"],
  },
  licenses: {
    dataset: "SAFE",
    verseTranslation: "SAFE",
    audio: "REVIEW_REQUIRED",
    assets: "SAFE",
  },
  sources: {
    wordId: "11111111-1111-1111-1111-111111111111",
    meaningSourceId: "src-1",
    meaningSourceTable: "word_translations",
    lemmaSourceId: null,
    explanationSourceId: "exp-1",
    ayahId: "ayah-1",
  },
  render: {
    width: 1080,
    height: 1920,
    fps: 30,
    aspectRatio: "9:16",
    safeZones: { topPx: 160, bottomPx: 220, rightRailPx: 140 },
    audioDisabled: true,
  },
};

describe("Content Studio Templates & Pipelines", () => {
  it("recognizes all implemented format keys", () => {
    expect(isImplementedFormat("WORD_REVEAL_V1")).toBe(true);
    expect(isImplementedFormat("WORD_QUIZ_V1")).toBe(true);
    expect(isImplementedFormat("VERSE_DEEP_DIVE_V1")).toBe(true);
    expect(isImplementedFormat("FREQUENCY_FACT_V1")).toBe(true);
    expect(isImplementedFormat("SURAH_HIGHLIGHT_V1")).toBe(true);
    expect(isImplementedFormat("VOCAB_SPEED_RUN_V1")).toBe(true); // LOT 2 Speed Vocab

    expect(isImplementedFormat("ROOT_FAMILY_V1")).toBe(false);
    expect(IMPLEMENTED_FORMAT_KEYS.length).toBe(6);
  });

  it("buildVideoContentFromDeepDive builds proper immersion content and scenes", () => {
    const content = buildVideoContentFromDeepDive(MOCK_PAYLOAD);
    expect(content.templateKey).toBe("VERSE_DEEP_DIVE_V1");
    expect(content.firstOccurrence).not.toBeNull();

    const sceneData = toVideoSceneData(content);
    expect(sceneData.scenes.length).toBeGreaterThanOrEqual(4);

    const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
    expect(quranScene).toBeDefined();
    expect(quranScene?.verseConfig?.mode).toBe("large");
    expect(quranScene?.verseConfig?.follower?.enabled).toBe(true);
  });

  it("buildVideoContentFromFrequencyFact builds frequency focused scenes", () => {
    const content = buildVideoContentFromFrequencyFact(MOCK_PAYLOAD);
    expect(content.templateKey).toBe("FREQUENCY_FACT_V1");
    expect(content.hook).toContain("27 fois");

    const sceneData = toVideoSceneData(content);
    const meaningScene = sceneData.scenes.find((s) => s.kind === "meaning");
    expect(meaningScene?.title).toContain("27");
  });

  it("buildVideoContentFromSurahHighlight builds surah thematic scenes", () => {
    const content = buildVideoContentFromSurahHighlight(MOCK_PAYLOAD);
    expect(content.templateKey).toBe("SURAH_HIGHLIGHT_V1");
    expect(content.hook).toContain("Sourate Al-Fatiha");
  });
});
