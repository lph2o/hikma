import { describe, expect, it } from "vitest";
import type { VideoScene } from "@/lib/content-studio/video/types";
import {
  computeStarts,
  computeSnapPoints,
  computeTotalDuration,
  snapToPoints,
  trimSceneStart,
  trimSceneEnd,
  moveScene,
  splitScene,
  nudgeSceneDuration,
  setSceneAudioVolume,
  setSceneAudioMuted,
  setSceneAudioFadeIn,
  setSceneAudioFadeOut,
  MIN_SCENE_DURATION,
} from "@/lib/content-studio/editor/timeline-ops";

const FIXTURE_SCENES: VideoScene[] = [
  { kind: "intro", durationInFrames: 45, text: "Intro" },
  { kind: "word", durationInFrames: 60, arabic: "يَوْمَ", audioUrl: "https://example.com/word.opus", audioDuration: 2 },
  { kind: "meaning", durationInFrames: 75, text: "Sens" },
  { kind: "quran", durationInFrames: 90, arabic: "يَوْمَ يَقُومُ...", audioUrl: "https://example.com/verse.mp3", audioDuration: 3 },
  { kind: "cta", durationInFrames: 45, text: "CTA" },
];

describe("Timeline Operations — Pure Logic (timeline-ops.ts)", () => {
  // 1. Starts & Duration
  it("computeStarts and computeTotalDuration calculate correct frame offsets", () => {
    const starts = computeStarts(FIXTURE_SCENES);
    expect(starts).toEqual([0, 45, 105, 180, 270]);
    expect(computeTotalDuration(FIXTURE_SCENES)).toBe(315);
  });

  // 2. Snap Points
  it("computeSnapPoints returns all boundary frames + playhead", () => {
    const starts = computeStarts(FIXTURE_SCENES);
    const snapPts = computeSnapPoints(FIXTURE_SCENES, starts, 120);
    expect(snapPts).toContain(0);
    expect(snapPts).toContain(45);
    expect(snapPts).toContain(105);
    expect(snapPts).toContain(180);
    expect(snapPts).toContain(270);
    expect(snapPts).toContain(315);
    expect(snapPts).toContain(120);
  });

  it("snapToPoints snaps to closest point within threshold", () => {
    const snapPts = [0, 45, 105, 180, 270, 315];
    expect(snapToPoints(43, snapPts, 6)).toBe(45); // Snaps to 45 (dist 2 <= 6)
    expect(snapToPoints(48, snapPts, 6)).toBe(45); // Snaps to 45 (dist 3 <= 6)
    expect(snapToPoints(55, snapPts, 6)).toBe(55); // No snap (dist 10 > 6)
  });

  // 3. Trim In (Start)
  it("trimSceneStart modifies scene duration and clamps to MIN_SCENE_DURATION", () => {
    // Normal trim start
    const trimmed = trimSceneStart(FIXTURE_SCENES, 1, 15); // Shorten by 15f
    expect(trimmed[1].durationInFrames).toBe(45);

    // Over-trim clamp
    const overTrimmed = trimSceneStart(FIXTURE_SCENES, 1, 200);
    expect(overTrimmed[1].durationInFrames).toBe(MIN_SCENE_DURATION);
  });

  // 4. Trim Out (End)
  it("trimSceneEnd lengthens and shortens scene duration frame-accurately", () => {
    // Lengthen by 30 frames
    const longer = trimSceneEnd(FIXTURE_SCENES, 2, 30);
    expect(longer[2].durationInFrames).toBe(105);

    // Shorten by 20 frames
    const shorter = trimSceneEnd(FIXTURE_SCENES, 2, -20);
    expect(shorter[2].durationInFrames).toBe(55);

    // Clamp to min
    const clamped = trimSceneEnd(FIXTURE_SCENES, 2, -500);
    expect(clamped[2].durationInFrames).toBe(MIN_SCENE_DURATION);
  });

  // 5. Move / Reorder
  it("moveScene reorders scenes without modifying individual durations", () => {
    const moved = moveScene(FIXTURE_SCENES, 0, 2);
    expect(moved[0].kind).toBe("word");
    expect(moved[1].kind).toBe("meaning");
    expect(moved[2].kind).toBe("intro");
    expect(computeTotalDuration(moved)).toBe(computeTotalDuration(FIXTURE_SCENES));
  });

  // 6. Split
  it("splitScene cuts a scene into two valid parts at playhead frame", () => {
    const starts = computeStarts(FIXTURE_SCENES); // word is [45..105]
    const splitFrame = 70; // 25 frames into scene 1
    const next = splitScene(FIXTURE_SCENES, 1, splitFrame, starts);

    expect(next.length).toBe(FIXTURE_SCENES.length + 1);
    expect(next[1].kind).toBe("word");
    expect(next[1].durationInFrames).toBe(25);
    expect(next[2].kind).toBe("word");
    expect(next[2].durationInFrames).toBe(35);
    expect(next[2].audioStartFrom).toBe(25);
    expect(computeTotalDuration(next)).toBe(computeTotalDuration(FIXTURE_SCENES));
  });

  it("splitScene ignores invalid split frames outside scene boundaries", () => {
    const starts = computeStarts(FIXTURE_SCENES);
    const unch = splitScene(FIXTURE_SCENES, 1, 20, starts); // 20 is before scene 1 starts (45)
    expect(unch).toBe(FIXTURE_SCENES);
  });

  // 7. Nudge
  it("nudgeSceneDuration increments and decrements by exact delta", () => {
    const nudged = nudgeSceneDuration(FIXTURE_SCENES, 0, 1);
    expect(nudged[0].durationInFrames).toBe(46);

    const nudged5 = nudgeSceneDuration(FIXTURE_SCENES, 0, -5);
    expect(nudged5[0].durationInFrames).toBe(40);
  });

  // 8. Audio Controls
  it("setSceneAudioVolume clamps volume to [0..1]", () => {
    const vol = setSceneAudioVolume(FIXTURE_SCENES, 1, 0.75);
    expect(vol[1].audioVolume).toBe(0.75);

    const overVol = setSceneAudioVolume(FIXTURE_SCENES, 1, 2.5);
    expect(overVol[1].audioVolume).toBe(1);

    const negVol = setSceneAudioVolume(FIXTURE_SCENES, 1, -0.5);
    expect(negVol[1].audioVolume).toBe(0);
  });

  it("setSceneAudioMuted sets audioMuted boolean", () => {
    const muted = setSceneAudioMuted(FIXTURE_SCENES, 1, true);
    expect(muted[1].audioMuted).toBe(true);

    const unmuted = setSceneAudioMuted(muted, 1, false);
    expect(unmuted[1].audioMuted).toBe(false);
  });

  it("setSceneAudioFadeIn and FadeOut set frame-accurate fades", () => {
    const fIn = setSceneAudioFadeIn(FIXTURE_SCENES, 3, 15);
    expect(fIn[3].audioFadeIn).toBe(15);

    const fOut = setSceneAudioFadeOut(fIn, 3, 20);
    expect(fOut[3].audioFadeOut).toBe(20);
  });
});
