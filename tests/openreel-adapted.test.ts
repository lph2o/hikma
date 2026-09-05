// Hikma — Tests des modules adaptés de OpenReel (MIT) :
//   - timeline-multi (sélection multiple / marquee) ;
//   - audio/links (liens audio, garantie récitation continue) ;
//   - audio/fade-envelope (fades).
// Comportements purs et déterministes, calqués sur les tests OpenReel.

import { describe, it, expect } from "vitest";
import type { VideoScene } from "../lib/content-studio/video/types";
import {
  getSceneRanges,
  getAudioSceneRanges,
  audioTrackOfScene,
  getSplittableSceneIndexes,
  getTrackSceneSelection,
  getMarqueeSceneIndexes,
  scenesOverlap,
  getGapBetweenScenes,
  sceneEndFrame,
} from "../lib/content-studio/editor/timeline-multi";
import {
  findSceneWithAudio,
  getLinkedAudioLinks,
  resolveContinuousVerseAudio,
  isVerseRecitationSource,
  hasPerWordAudio,
} from "../lib/content-studio/audio/links";
import {
  fadeValueAtTime,
  getClipFadeEnvelopePoints,
} from "../lib/content-studio/audio/fade-envelope";

function scene(partial: Partial<VideoScene> & { kind: VideoScene["kind"] }): VideoScene {
  return { durationInFrames: 30, ...partial } as VideoScene;
}

const SCENES: VideoScene[] = [
  scene({ kind: "intro", durationInFrames: 45, text: "Intro" }),
  scene({ kind: "word", durationInFrames: 60, arabic: "يَوْمَ", audioUrl: "https://supabase.example/storage/word.opus", audioDuration: 1.8 }),
  scene({ kind: "meaning", durationInFrames: 75, text: "jour" }),
  scene({ kind: "quran", durationInFrames: 379, arabic: "…", audioUrl: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/120.mp3", audioDuration: 12.62 }),
  scene({ kind: "cta", durationInFrames: 45, text: "CTA" }),
];

const STARTS = [0, 45, 105, 180, 559];

describe("timeline-multi — rangs et pistes (adapté OpenReel getTimelineItemRanges)", () => {
  it("calcule startFrame/durée : toutes les scènes sur la piste vidéo, lanes audio séparées", () => {
    const ranges = getSceneRanges(SCENES, STARTS);
    expect(ranges).toHaveLength(5);
    expect(ranges[1]).toMatchObject({ index: 1, kind: "word", startFrame: 45, durationInFrames: 60, track: "video" });
    expect(ranges[3]).toMatchObject({ index: 3, kind: "quran", startFrame: 180, track: "video" });
    // lanes audio : word → audio-word, quran → audio-verse
    const audio = getAudioSceneRanges(SCENES, STARTS);
    expect(audio.map((r) => r.track)).toEqual(["audio-word", "audio-verse"]);
    expect(audioTrackOfScene(SCENES[0]!)).toBeNull();
    expect(audioTrackOfScene(SCENES[1]!)).toBe("audio-word");
    expect(audioTrackOfScene(SCENES[3]!)).toBe("audio-verse");
  });

  it("sceneEndFrame = start + durée", () => {
    expect(sceneEndFrame(SCENES[3]!, 180)).toBe(559);
  });

  it("scenesOverlap / getGapBetweenScenes (adapté clipsOverlap/getGapBetweenClips)", () => {
    // piste vidéo : word (45-105) et meaning (105-180) se touchent (gap 0)
    expect(scenesOverlap(SCENES[1]!, SCENES[2]!, 45, 105)).toBe(false);
    expect(getGapBetweenScenes(SCENES[1]!, SCENES[2]!, 45, 105)).toBe(0);
    expect(scenesOverlap(SCENES[2]!, SCENES[3]!, 105, 180)).toBe(false);
    // chevauchement artificiel (piste vidéo) : word (45-105) et meaning (104-179) se chevauchent sur 1 frame
    expect(scenesOverlap(SCENES[1]!, SCENES[3]!, 45, 180)).toBe(false);
    expect(scenesOverlap(SCENES[1]!, SCENES[2]!, 45, 104)).toBe(true);
  });

  it("getSplittableSceneIndexes ne coupe que les scènes sélectionnées contenant le frame", () => {
    // quran = 180..559 ; frame 300 coupe la scène 3 (sélectionnée) seulement
    expect(getSplittableSceneIndexes(SCENES, STARTS, 300, [3])).toEqual([3]);
    // frame 300 ne coupe pas word (45-105) ni meaning (105-180)
    expect(getSplittableSceneIndexes(SCENES, STARTS, 300, [1, 2, 3])).toEqual([3]);
    // frame 80 coupe word si sélectionné
    expect(getSplittableSceneIndexes(SCENES, STARTS, 80, [1])).toEqual([1]);
    // frame 0 (borne) ne coupe rien
    expect(getSplittableSceneIndexes(SCENES, STARTS, 0, [0])).toEqual([]);
  });

  it("getTrackSceneSelection renvoie les scènes d'une piste logique", () => {
    expect(getTrackSceneSelection(SCENES, STARTS, "audio-verse")).toEqual([3]);
    expect(getTrackSceneSelection(SCENES, STARTS, "audio-word")).toEqual([1]);
    // la piste vidéo contient TOUTES les scènes (test 1 : word/quran y sont aussi)
    expect(getTrackSceneSelection(SCENES, STARTS, "video")).toEqual([0, 1, 2, 3, 4]);
  });

  it("getMarqueeSceneIndexes sélectionne par rectangle temps × hauteur de piste", () => {
    const heights: Record<string, number> = { video: 40, "audio-word": 30, "audio-verse": 30 };
    const h = (t: string) => heights[t] ?? 30;
    // Rectangle couvrant tout (vidéo 0-40px, audio 40-70, 70-100)
    expect(
      getMarqueeSceneIndexes(SCENES, STARTS, { minFrame: 0, maxFrame: 600, minY: 0, maxY: 100 }, h),
    ).toEqual([0, 1, 2, 3, 4]);
    // Rectangle temps 180-559 sur la piste vidéo uniquement → scène 3 (quran)
    expect(
      getMarqueeSceneIndexes(SCENES, STARTS, { minFrame: 181, maxFrame: 400, minY: 0, maxY: 40 }, h),
    ).toEqual([3]);
    // Hauteurs : video 0-40px, audio-word 40-70px, audio-verse 70-100px
    // Rectangle sur la piste audio-verse (70-100px) → scène 3 (quran)
    expect(
      getMarqueeSceneIndexes(SCENES, STARTS, { minFrame: 200, maxFrame: 500, minY: 70, maxY: 100 }, h),
    ).toEqual([3]);
    // Rectangle sur audio-word (40-70px) → scène 1 (word)
    expect(
      getMarqueeSceneIndexes(SCENES, STARTS, { minFrame: 50, maxFrame: 100, minY: 40, maxY: 70 }, h),
    ).toEqual([1]);
    // Aucun chevauchement (au-delà de la fin 604) → []
    expect(
      getMarqueeSceneIndexes(SCENES, STARTS, { minFrame: 700, maxFrame: 800, minY: 0, maxY: 40 }, h),
    ).toEqual([]);
  });
});

describe("audio/links — garantie récitation continue (adapté clip-audio-resolution)", () => {
  it("findSceneWithAudio trouve le mot et le verset", () => {
    expect(findSceneWithAudio(SCENES, "quran")?.index).toBe(3);
    expect(findSceneWithAudio(SCENES, "word")?.index).toBe(1);
    expect(findSceneWithAudio(SCENES, "meaning")).toBeNull();
  });

  it("getLinkedAudioLinks liste mot + verset (une piste chacun)", () => {
    const links = getLinkedAudioLinks(SCENES, STARTS);
    expect(links.map((l) => l.kind)).toEqual(["word", "quran"]);
    expect(links[1]!.audioUrl).toContain("cdn.islamic.network");
    expect(links[1]!.audioDuration).toBe(12.62);
  });

  it("resolveContinuousVerseAudio : UNE seule source de verset (jamais par mot)", () => {
    const verse = resolveContinuousVerseAudio(SCENES, STARTS);
    expect(verse?.kind).toBe("quran");
    expect(verse?.audioUrl).toContain("cdn.islamic.network");
    expect(isVerseRecitationSource(verse!.audioUrl)).toBe(true);
    // La source de VERSET n'est jamais la prononciation du MOT
    expect(isVerseRecitationSource(SCENES[1]!.audioUrl!)).toBe(false);
  });

  it("resolveContinuousVerseAudio → null si la scène Coran n'a pas d'audio", () => {
    const noVerse = SCENES.map((s) => (s.kind === "quran" ? { ...s, audioUrl: undefined } : s));
    expect(resolveContinuousVerseAudio(noVerse, STARTS)).toBeNull();
  });

  it("hasPerWordAudio : aucun champ audio par mot dans la scène Coran", () => {
    expect(hasPerWordAudio(SCENES[3]!)).toBe(false);
    // Scène corrompue avec un champ audio par mot → détecté
    const corrupted = {
      ...SCENES[3]!,
      verseConfig: {
        follower: { words: [{ arabic: "x", startFrame: 0, endFrame: 10, audioUrl: "http://x" }] },
      },
    };
    expect(hasPerWordAudio(corrupted)).toBe(true);
  });
});

describe("audio/fade-envelope (adapté clip-fade-envelope)", () => {
  it("fadeValueAtTime : rampe linéaire in / out", () => {
    expect(fadeValueAtTime(0, 10, 2, 2)).toBe(0);
    expect(fadeValueAtTime(1, 10, 2, 2)).toBe(0.5);
    expect(fadeValueAtTime(2, 10, 2, 2)).toBe(1);
    expect(fadeValueAtTime(5, 10, 2, 2)).toBe(1);
    expect(fadeValueAtTime(9, 10, 2, 2)).toBe(0.5);
    expect(fadeValueAtTime(10, 10, 2, 2)).toBe(0);
    // Pas de fade → 1 partout
    expect(fadeValueAtTime(0, 10, 0, 0)).toBe(1);
    expect(fadeValueAtTime(10, 10, 0, 0)).toBe(1);
  });

  it("getClipFadeEnvelopePoints : [] sans fade ou fenêtre vide", () => {
    expect(getClipFadeEnvelopePoints({ clipOffset: 0, rangeDuration: 5, clipDuration: 10 })).toEqual([]);
    expect(getClipFadeEnvelopePoints({ clipOffset: 0, rangeDuration: 0, clipDuration: 10, fadeIn: 1 })).toEqual([]);
  });

  it("getClipFadeEnvelopePoints : points aux bornes + seuils de fade", () => {
    const points = getClipFadeEnvelopePoints({ clipOffset: 0, rangeDuration: 10, clipDuration: 10, fadeIn: 2, fadeOut: 2 });
    const times = points.map((p) => p.time);
    const values = points.map((p) => p.value);
    expect(times).toEqual([0, 2, 8, 10]);
    expect(values).toEqual([0, 1, 1, 0]);
    // Déterministe
    expect(getClipFadeEnvelopePoints({ clipOffset: 0, rangeDuration: 10, clipDuration: 10, fadeIn: 2, fadeOut: 2 })).toEqual(points);
  });

  it("getClipFadeEnvelopePoints : fenêtre décalée (clipOffset)", () => {
    const points = getClipFadeEnvelopePoints({ clipOffset: 1, rangeDuration: 4, clipDuration: 10, fadeIn: 2, fadeOut: 2 });
    // temps locaux ramenés à la fenêtre : 1→0, 2→1, fin 5→4
    expect(points[0]).toEqual({ time: 0, value: 0.5 });
    expect(points[1]).toEqual({ time: 1, value: 1 });
    expect(points[2]!.time).toBe(4);
  });
});
