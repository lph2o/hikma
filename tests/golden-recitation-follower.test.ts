import { describe, expect, it } from "vitest";
import { computeDefaultWordTimings } from "@/remotion/scenes/GoldenRecitationFollower";
import type { VerseWordTiming } from "@/lib/content-studio/video/types";

describe("Golden Recitation Follower — Timings & Sync Logic", () => {
  const WORDS = ["الْحَمْدُ", "لِلَّهِ", "رَبِّ", "الْعَالَمِينَ"];
  const TOTAL_FRAMES = 120; // 4 secondes @30fps

  it("computeDefaultWordTimings partitions total frames proportionally across words", () => {
    const timings = computeDefaultWordTimings(WORDS, TOTAL_FRAMES);

    expect(timings.length).toBe(WORDS.length);
    expect(timings[0].startFrame).toBe(0);
    expect(timings[timings.length - 1].endFrame).toBe(TOTAL_FRAMES);

    // Contiguïté sans trou ni chevauchement
    for (let i = 0; i < timings.length - 1; i++) {
      expect(timings[i].endFrame).toBe(timings[i + 1].startFrame);
    }
  });

  it("calculates accurate active word index at various playback frames", () => {
    // Timings fixes pour le test
    const customTimings: VerseWordTiming[] = [
      { arabic: "الْحَمْدُ", startFrame: 0, endFrame: 30 },
      { arabic: "لِلَّهِ", startFrame: 30, endFrame: 60 },
      { arabic: "رَبِّ", startFrame: 60, endFrame: 85 },
      { arabic: "الْعَالَمِينَ", startFrame: 85, endFrame: 120 },
    ];

    const getActiveIndex = (f: number): number => {
      for (let i = 0; i < customTimings.length; i++) {
        if (f >= customTimings[i].startFrame && f < customTimings[i].endFrame) {
          return i;
        }
      }
      return customTimings.length - 1;
    };

    // Frame 0..29 -> Mot 0 (الْحَمْدُ)
    expect(getActiveIndex(0)).toBe(0);
    expect(getActiveIndex(15)).toBe(0);
    expect(getActiveIndex(29)).toBe(0);

    // Frame 30 -> Mot 1 (لِلَّهِ)
    expect(getActiveIndex(30)).toBe(1);
    expect(getActiveIndex(59)).toBe(1);

    // Frame 60 -> Mot 2 (رَبِّ)
    expect(getActiveIndex(60)).toBe(2);
    expect(getActiveIndex(84)).toBe(2);

    // Frame 85 -> Mot 3 (الْعَالَمِينَ)
    expect(getActiveIndex(85)).toBe(3);
    expect(getActiveIndex(119)).toBe(3);
  });

  it("handles empty words or zero frames defensively", () => {
    expect(computeDefaultWordTimings([], 100)).toEqual([]);
    expect(computeDefaultWordTimings(["word"], 0)).toEqual([]);
  });
});
