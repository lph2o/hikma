// Hikma — Tests du moteur sous-titres/karaoké porté de OpenReel (MIT) :
//   lib/content-studio/graphics/subtitle-engine.ts
// Miroir des tests amont OpenReel (subtitle-engine.test.ts) + adaptations Hikma
// (déterminisme des ids, conversion secondes → frames, bornage durée réelle).

import { describe, it, expect } from "vitest";
import {
  DEFAULT_SUBTITLE_STYLE,
  formatSRTTimestamp,
  normalizeSRT,
  parseSRT,
  parseSRTTimestamp,
  reflowCaptionText,
  splitCaptionIntoSingleLineCues,
  subtitleMarkupToText,
  subtitleWordsToFrames,
  type SubtitleWord,
} from "../lib/content-studio/graphics/subtitle-engine";

const SRT_FIXTURE = `1
00:00:01,000 --> 00:00:03,000
بِسْمِ اللَّهِ

2
00:00:03,200 --> 00:00:05,500
الرَّحْمَٰنِ الرَّحِيمِ
`;

describe("subtitle parsing (miroir tests OpenReel)", () => {
  it("parse SRT indexé", () => {
    const result = parseSRT(SRT_FIXTURE);
    expect(result.success).toBe(true);
    expect(result.subtitles).toHaveLength(2);
    expect(result.subtitles[0]).toMatchObject({
      text: "بِسْمِ اللَّهِ",
      startTime: 1,
      endTime: 3,
    });
    expect(result.subtitles[1]!.startTime).toBeCloseTo(3.2, 9);
    expect(result.errors).toEqual([]);
  });

  it("parse WEBVTT (cue ids, settings, markup)", () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:02.000 align:start position:0%
<v Speaker>Première ligne</v>

cue-2
00:00:02.500 --> 00:00:03.000
Deuxième ligne
`;
    const result = parseSRT(vtt);
    expect(result.success).toBe(true);
    expect(result.subtitles.map((s) => s.text)).toEqual([
      "Première ligne",
      "Deuxième ligne",
    ]);
  });

  it("rejette les plages invalides mais garde les cues valides", () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
Valid

2
00:00:05,000 --> 00:00:04,000
End avant start
`;
    const result = parseSRT(srt);
    expect(result.subtitles).toHaveLength(1);
    expect(result.subtitles[0]!.text).toBe("Valid");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.success).toBe(false);
  });

  it("supporte les timestamps VTT sans heures (MM:SS.mmm)", () => {
    expect(parseSRTTimestamp("01:02.500")).toBeCloseTo(62.5, 9);
    expect(parseSRTTimestamp("01:02,5")).toBeCloseTo(62.5, 9);
  });

  it("parseSRTTimestamp : invalide → null", () => {
    expect(parseSRTTimestamp("abc")).toBeNull();
    expect(parseSRTTimestamp("00:60:00,000")).toBeNull(); // minutes ≥ 60
    expect(parseSRTTimestamp("00:00:60,000")).toBeNull(); // secondes ≥ 60
    // les heures ne sont pas bornées (port OpenReel) — 99h est valide
    expect(parseSRTTimestamp("99:00:00,000")).toBe(356400);
  });
});

describe("caption reflow (miroir tests OpenReel)", () => {
  it("enveloppe une légende à maxWordsPerLine mots", () => {
    expect(reflowCaptionText("a b c d e f", 2)).toBe("a b\nc d\ne f");
    expect(reflowCaptionText("un deux trois", 2)).toBe("un deux\ntrois");
  });

  it("normalise les retours à la ligne existants", () => {
    expect(reflowCaptionText("  a  b\n\nc  ", 2)).toBe("a b\nc");
  });

  it("découpe une légende longue en cues mono-ligne séquentielles", () => {
    // signature : (value, startTime, endTime, maxWordsPerCue)
    const cues = splitCaptionIntoSingleLineCues("a b c d", 10, 14, 2);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ text: "a b", startTime: 10, endTime: 12 });
    expect(cues[1]).toEqual({ text: "c d", startTime: 12, endTime: 14 });
  });

  it("supprime le markup d'une légende", () => {
    expect(subtitleMarkupToText("<b>Gras</b> et <i>italique</i>")).toBe("Gras et italique");
    expect(subtitleMarkupToText("أ ب <v>ج</v>")).toBe("أ ب ج");
  });

  it("formatSRTTimestamp : format canonique SRT", () => {
    expect(formatSRTTimestamp(62.5)).toBe("00:01:02,500");
    expect(formatSRTTimestamp(0)).toBe("00:00:00,000");
  });

  it("exportSRT + normalizeSRT : roundtrip", () => {
    const normalized = normalizeSRT(SRT_FIXTURE);
    const reparsed = parseSRT(normalized);
    expect(reparsed.success).toBe(true);
    expect(reparsed.subtitles.map((s) => s.text)).toEqual([
      "بِسْمِ اللَّهِ",
      "الرَّحْمَٰنِ الرَّحِيمِ",
    ]);
  });
});

describe("adaptations Hikma — déterminisme & frames", () => {
  it("parseSRT est déterministe (ids stables, pas de Date.now/Math.random)", () => {
    const a = parseSRT(SRT_FIXTURE);
    const b = parseSRT(SRT_FIXTURE);
    expect(a).toEqual(b);
    expect(a.subtitles[0]!.id).toBe(b.subtitles[0]!.id);
    expect(a.subtitles[0]!.id).toMatch(/^subtitle-/);
    expect(a.subtitles[0]!.id).not.toContain("NaN");
  });

  it("subtitleWordsToFrames : secondes → frames (30 fps)", () => {
    const words: SubtitleWord[] = [
      { word: "بِسْمِ", startTime: 1.0, endTime: 1.6 },
      { word: "اللَّهِ", startTime: 1.6, endTime: 2.4 },
    ];
    const frames = subtitleWordsToFrames(words, 30);
    expect(frames).toEqual([
      { word: "بِسْمِ", startFrame: 30, endFrame: 48 },
      { word: "اللَّهِ", startFrame: 48, endFrame: 72 },
    ]);
  });

  it("subtitleWordsToFrames : bornage à la durée réelle (pas de dépassement)", () => {
    const words: SubtitleWord[] = [
      { word: "a", startTime: 0.1, endTime: 1.0 },
      { word: "b", startTime: 1.6, endTime: 3.0 }, // commence APRÈS maxEndFrame → exclu
    ];
    const frames = subtitleWordsToFrames(words, 30, 45); // 1.5s max
    expect(frames).toHaveLength(1);
    expect(frames[0]).toEqual({ word: "a", startFrame: 3, endFrame: 30 });
    // bornage : un mot qui déborde est clampé à maxEndFrame, jamais au-delà
    const clamped = subtitleWordsToFrames(
      [{ word: "c", startTime: 1.0, endTime: 3.0 }],
      30,
      45,
    );
    expect(clamped[0]!.endFrame).toBe(45);
  });

  it("subtitleWordsToFrames : clamp des starts négatifs", () => {
    const frames = subtitleWordsToFrames([{ word: "x", startTime: -0.5, endTime: 0.5 }], 30);
    expect(frames[0]!.startFrame).toBe(0);
    expect(frames[0]!.endFrame).toBeGreaterThan(0);
  });

  it("DEFAULT_SUBTITLE_STYLE : style par défaut du karaoké", () => {
    expect(DEFAULT_SUBTITLE_STYLE.position).toBe("bottom");
    expect(DEFAULT_SUBTITLE_STYLE.fontSize).toBeGreaterThan(0);
    expect(DEFAULT_SUBTITLE_STYLE.backgroundColor).toContain("rgba");
  });
});
