import { describe, expect, it } from "vitest";
import { sanitizeEditorScenes, hashEffectiveScenes } from "@/lib/content-studio/editor/state";
import type { VideoScene } from "@/lib/content-studio/video/types";

describe("Verse Display Config — Multi-Style & Sanitization", () => {
  it("sanitizes verseConfig with valid modes, translation, highlight and follower", () => {
    const rawScenes = [
      {
        kind: "quran",
        durationInFrames: 90,
        arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        subtext: "Sourate Al-Fatiha · verset 2",
        verseConfig: {
          mode: "highlight-word",
          showTranslation: true,
          translation: {
            text: "Louange à Allah, Seigneur des mondes.",
            language: "fr",
            sourceName: "Hamidullah",
            position: "card",
            fontSize: 32,
            opacity: 0.9,
          },
          typography: {
            fontSize: 74,
            lineHeight: 1.8,
            alignment: "center",
          },
          highlight: {
            wordArabic: "الْحَمْدُ",
            style: "glow",
          },
          follower: {
            enabled: true,
            style: "gold-highlight",
            intensity: 0.95,
            glow: 0.8,
            transition: 5,
          },
        },
      },
    ];

    const { scenes, reason } = sanitizeEditorScenes(rawScenes);
    expect(reason).toBeUndefined();
    expect(scenes).not.toBeNull();
    expect(scenes?.length).toBe(1);

    const qScene = scenes![0];
    expect(qScene.verseConfig?.mode).toBe("highlight-word");
    expect(qScene.verseConfig?.showTranslation).toBe(true);
    expect(qScene.verseConfig?.translation?.text).toBe("Louange à Allah, Seigneur des mondes.");
    expect(qScene.verseConfig?.translation?.position).toBe("card");
    expect(qScene.verseConfig?.highlight?.wordArabic).toBe("الْحَمْدُ");
    expect(qScene.verseConfig?.follower?.style).toBe("gold-highlight");
  });

  it("drops invalid modes and clamps out-of-bound translation values", () => {
    const rawScenes = [
      {
        kind: "quran",
        durationInFrames: 90,
        arabic: "نص",
        verseConfig: {
          mode: "invalid_mode_xyz",
          showTranslation: true,
          translation: {
            text: "Translation",
            language: "fr",
            fontSize: 500, // Should be clamped to 60
            opacity: 2.5, // Should be clamped to 1
          },
        },
      },
    ];

    const { scenes } = sanitizeEditorScenes(rawScenes);
    const cfg = scenes![0].verseConfig;
    expect(cfg?.mode).toBeUndefined(); // Dropped
    expect(cfg?.translation?.fontSize).toBe(60); // Clamped
    expect(cfg?.translation?.opacity).toBe(1); // Clamped
  });

  it("hashEffectiveScenes produces deterministic hash sensitive to verseConfig changes", () => {
    const baseScene: VideoScene = {
      kind: "quran",
      durationInFrames: 90,
      arabic: "الْحَمْدُ لِلَّهِ",
      verseConfig: { mode: "standard" },
    };

    const hash1 = hashEffectiveScenes([baseScene]);
    const hash2 = hashEffectiveScenes([baseScene]);
    expect(hash1).toBe(hash2);

    const modifiedScene: VideoScene = {
      ...baseScene,
      verseConfig: { mode: "large" },
    };
    const hash3 = hashEffectiveScenes([modifiedScene]);
    expect(hash3).not.toBe(hash1);
  });
});
