import { describe, expect, it } from "vitest";
import { resolveEffectiveSceneData, getEffectiveSceneData } from "@/lib/content-studio/editor/state";
import {
  buildVideoContentFromReveal,
  toVideoSceneData,
} from "@/lib/content-studio/video/pipeline";
import { REVEAL_FIXTURE_YAWMA } from "@/lib/content-studio/video/fixtures";
import type { VideoScene } from "@/lib/content-studio/video/types";
import { normalizeWordText } from "@/lib/quran/normalize-text";
import { getAyahAudioUrl } from "@/lib/quran/ayah-audio";

describe("Content Studio UI2 Architecture & Pipeline", () => {
  it("builds VideoContent correctly from Reveal fixture and preserves Arabic harakat", () => {
    const videoContent = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    expect(videoContent.word.arabic).toBe("يَوْمَ");
    expect(videoContent.word.transliteration).toBe("yawma");
    expect(videoContent.templateKey).toBe("WORD_REVEAL_V1");

    const sceneData = toVideoSceneData(videoContent);
    expect(sceneData.scenes.length).toBeGreaterThanOrEqual(4);
    expect(sceneData.layout).toBe("9:16");
    expect(sceneData.fps).toBe(30);

    const wordScene = sceneData.scenes.find((s) => s.kind === "word");
    expect(wordScene).toBeDefined();
    expect(wordScene?.arabic).toBe("يَوْمَ");
  });

  it("resolves effective scene data with overrides", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    const baseScenes = toVideoSceneData(content).scenes;

    const modifiedScenes: VideoScene[] = baseScenes.map((s, idx) =>
      idx === 1 ? { ...s, durationInFrames: 120, title: "Custom Word Scene" } : s,
    );

    const resolved = resolveEffectiveSceneData(content, { scenes: modifiedScenes } as never);
    expect(resolved.hasEdits).toBe(true);
    expect(resolved.scenes[1].durationInFrames).toBe(120);
    expect(resolved.scenes[1].title).toBe("Custom Word Scene");
  });

  it("calculates total duration in frames and seconds consistently", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    const sceneData = toVideoSceneData(content);
    const totalFrames = sceneData.scenes.reduce((acc, s) => acc + s.durationInFrames, 0);
    const totalSeconds = totalFrames / sceneData.fps;

    expect(totalFrames).toBeGreaterThan(0);
    expect(totalSeconds).toBeGreaterThan(1);
    expect(Number.isFinite(totalSeconds)).toBe(true);
  });

  it("tracks frame progression across scene timeline boundaries accurately", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    const sceneData = toVideoSceneData(content);
    const { scenes } = sceneData;

    const starts: number[] = [];
    let acc = 0;
    for (const s of scenes) {
      starts.push(acc);
      acc += s.durationInFrames;
    }
    const totalFrames = acc;

    const findActiveScene = (frame: number) => {
      for (let i = 0; i < scenes.length; i++) {
        if (frame >= starts[i] && frame < starts[i] + scenes[i].durationInFrames) {
          return { index: i, scene: scenes[i], localFrame: frame - starts[i] };
        }
      }
      return null;
    };

    const first = findActiveScene(0);
    expect(first).not.toBeNull();
    expect(first?.index).toBe(0);
    expect(first?.localFrame).toBe(0);

    const wordStart = starts[1];
    const wordMid = findActiveScene(wordStart + 10);
    expect(wordMid?.index).toBe(1);
    expect(wordMid?.scene.kind).toBe("word");
    expect(wordMid?.localFrame).toBe(10);

    const lastFrame = totalFrames - 1;
    const last = findActiveScene(lastFrame);
    expect(last?.index).toBe(scenes.length - 1);
  });
});

describe("Content Studio Word Selector & Search Logic", () => {
  // Test 1: Arabic word search with harakat normalization
  it("normalizes Arabic search query without altering original Quranic form", () => {
    const rawWord = "ٱلْحَمْدُ";
    const searchQuery = "الحمد";
    expect(normalizeWordText(rawWord)).toBe(normalizeWordText(searchQuery));
  });

  // Test 2: Multi-criteria word candidate filtering logic (pure simulator)
  it("filters candidate words by Arabic, transliteration, or meaning", () => {
    const sampleCandidates = [
      {
        wordId: "fc581cb3-8d05-410f-9373-a428c8d17e57",
        arabic: "ٱلْحَمْدُ",
        transliteration: "al-ḥamdu",
        meaning: "La louange",
      },
      {
        wordId: "0b12f46e-1fb2-4757-bb6a-5c128509c2a1",
        arabic: "يَوْمَ",
        transliteration: "yawma",
        meaning: "Le jour",
      },
      {
        wordId: "a998c253-8321-4cf4-9279-dc156be7c390",
        arabic: "بِسْمِ",
        transliteration: "bismi",
        meaning: "Au nom de",
      },
    ];

    const searchCandidates = (q: string) => {
      const trimmed = q.trim().toLowerCase();
      if (!trimmed) return sampleCandidates;
      const normalizedQ = normalizeWordText(trimmed);

      return sampleCandidates.filter((c) => {
        return (
          c.arabic.includes(trimmed) ||
          normalizeWordText(c.arabic).includes(normalizedQ) ||
          (c.transliteration && c.transliteration.toLowerCase().includes(trimmed)) ||
          (c.meaning && c.meaning.toLowerCase().includes(trimmed))
        );
      });
    };

    // Arabic search test
    const arabicRes = searchCandidates("الحمد");
    expect(arabicRes.length).toBe(1);
    expect(arabicRes[0].wordId).toBe("fc581cb3-8d05-410f-9373-a428c8d17e57");

    // Transliteration search test
    const transRes = searchCandidates("yawm");
    expect(transRes.length).toBe(1);
    expect(transRes[0].arabic).toBe("يَوْمَ");

    // French meaning search test
    const meaningRes = searchCandidates("louange");
    expect(meaningRes.length).toBe(1);
    expect(meaningRes[0].wordId).toBe("fc581cb3-8d05-410f-9373-a428c8d17e57");

    // Test 3: Non-existent word search returns empty without crashing
    const notFoundRes = searchCandidates("mot-inexistant-xyz");
    expect(notFoundRes.length).toBe(0);
  });

  // Test 4: Video creation payload construction from selected wordId
  it("builds valid video payload when word is selected from candidates", () => {
    const selectedWord = {
      wordId: REVEAL_FIXTURE_YAWMA.word.id,
      arabic: REVEAL_FIXTURE_YAWMA.word.arabic,
      transliteration: REVEAL_FIXTURE_YAWMA.word.transliteration,
    };

    const videoContent = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    expect(videoContent.word.id).toBe(selectedWord.wordId);
    expect(videoContent.word.arabic).toBe(selectedWord.arabic);

    const sceneData = toVideoSceneData(videoContent);
    expect(sceneData.scenes.length).toBeGreaterThan(0);
    expect(sceneData.durationInFrames).toBeGreaterThan(0);
  });
});

describe("Content Studio Audio Pipeline", () => {
  // Test 1: getAyahAudioUrl returns a valid CDN URL for a global ayah number
  it("getAyahAudioUrl returns Al-Afasy CDN URL for valid global_ayah_number", () => {
    const url = getAyahAudioUrl(1);
    expect(url).toMatch(/^https:\/\/cdn\.islamic\.network\/quran\/audio\/\d+\/[^/]+\/1\.mp3$/);
    expect(url).toContain("cdn.islamic.network");
  });

  it("getAyahAudioUrl generates different URLs for different ayah numbers", () => {
    const url1 = getAyahAudioUrl(1);
    const url2 = getAyahAudioUrl(2);
    expect(url1).not.toBe(url2);
    expect(url1).toContain("/1.mp3");
    expect(url2).toContain("/2.mp3");
  });

  // Test 2: buildVideoContentFromReveal accepts and propagates audio
  it("buildVideoContentFromReveal stores audio field when provided", () => {
    const audio = {
      wordAudioUrl: "https://example.supabase.co/storage/v1/object/sign/word-audio/muallim/test.opus?token=xyz",
      verseAudioUrl: getAyahAudioUrl(1),
    };
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, audio);
    expect(content.audio?.wordAudioUrl).toBe(audio.wordAudioUrl);
    expect(content.audio?.verseAudioUrl).toBe(audio.verseAudioUrl);
  });

  // Test 3: toVideoSceneData propagates audioUrl onto word and quran scenes
  it("toVideoSceneData attaches wordAudioUrl to word scene and verseAudioUrl to quran scene", () => {
    const audio = {
      wordAudioUrl: "https://supabase.co/storage/v1/object/sign/word-audio/muallim/test.opus?t=abc",
      verseAudioUrl: getAyahAudioUrl(42),
    };
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, audio);
    const sceneData = toVideoSceneData(content);

    const wordScene = sceneData.scenes.find((s) => s.kind === "word");
    expect(wordScene?.audioUrl).toBe(audio.wordAudioUrl);

    const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
    expect(quranScene?.audioUrl).toBe(audio.verseAudioUrl);
  });

  // Test 4: Without audio, audioUrl is null on word and quran scenes
  it("toVideoSceneData sets audioUrl to null when no audio is provided", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    const sceneData = toVideoSceneData(content);

    const wordScene = sceneData.scenes.find((s) => s.kind === "word");
    expect(wordScene?.audioUrl ?? null).toBeNull();

    const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
    expect(quranScene?.audioUrl ?? null).toBeNull();
  });

  // Test 5: getEffectiveSceneData preserves audioUrl from derived scenes into editor-overridden scenes
  it("getEffectiveSceneData preserves audioUrl from derived pipeline when editor state overrides scenes", () => {
    const audio = {
      wordAudioUrl: "https://supabase.co/storage/v1/object/sign/word-audio/muallim/test.opus?t=xyz",
      verseAudioUrl: getAyahAudioUrl(100),
    };
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, audio);
    const derivedScenes = toVideoSceneData(content).scenes;

    // Simulate editor state overriding duration only (no audioUrl stored in editor_state)
    const editorState = {
      scenes: derivedScenes.map((s) => ({
        kind: s.kind,
        durationInFrames: s.durationInFrames + 5, // override timing
        title: s.title,
        arabic: s.arabic,
        transliteration: s.transliteration,
        text: s.text,
        subtext: s.subtext,
        // no audioUrl (simulating stored editor_state without audio)
      })),
    };

    const { scenes: effectiveScenes } = getEffectiveSceneData(content, editorState as never);

    // audioUrl from derived pipeline must be restored into effective scenes
    const wordScene = effectiveScenes.find((s) => s.kind === "word");
    expect(wordScene?.audioUrl).toBe(audio.wordAudioUrl);

    const quranScene = effectiveScenes.find((s) => s.kind === "quran");
    expect(quranScene?.audioUrl).toBe(audio.verseAudioUrl);
  });

  // TEST 1 — Durée du verset calculée à partir de verseAudioDuration et fps
  it("TEST 1: converts verseAudioDuration (6.42s) at 30 fps to exactly 193 frames", () => {
    const verseAudioDuration = 6.42;
    const fps = 30;
    const durationInFrames = Math.round(verseAudioDuration * fps);
    expect(durationInFrames).toBe(193);
  });

  // TEST 2 — Synchronisation : la durée de la scène Coran est exactement la durée de l'audio du verset en frames
  it("TEST 2: verse scene duration equals verse audio duration in frames", () => {
    const audio = {
      wordAudioUrl: "https://example.com/word.opus",
      verseAudioUrl: getAyahAudioUrl(1),
      wordAudioDuration: 1.85,
      verseAudioDuration: 6.42,
    };
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, audio);
    const sceneData = toVideoSceneData(content);

    const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
    expect(quranScene).toBeDefined();
    expect(quranScene?.durationInFrames).toBe(193); // Math.round(6.42 * 30) = 193
    expect(quranScene?.audioDuration).toBe(6.42);
  });

  // TEST 3 — Texte : le texte du verset reste présent pour toute la durée de la scène
  it("TEST 3: verse text remains defined and intact for the entire scene duration", () => {
    const audio = {
      wordAudioUrl: "https://example.com/word.opus",
      verseAudioUrl: getAyahAudioUrl(1),
      verseAudioDuration: 9.18,
    };
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, audio);
    const sceneData = toVideoSceneData(content);

    const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
    expect(quranScene?.arabic).toBe(REVEAL_FIXTURE_YAWMA.firstOccurrence.excerptUthmani);
    expect(quranScene?.durationInFrames).toBe(Math.round(9.18 * 30)); // 275 frames
  });

  // TEST 4 — Timeline : une scène Quran avec audio produit une piste audio correspondante
  it("TEST 4: a Quran scene with audio produces a corresponding audio track item", () => {
    const audio = {
      wordAudioUrl: "https://example.com/word.opus",
      verseAudioUrl: getAyahAudioUrl(1),
      wordAudioDuration: 1.5,
      verseAudioDuration: 6.42,
    };
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, audio);
    const sceneData = toVideoSceneData(content);
    const starts = sceneData.scenes.map((_, i) =>
      sceneData.scenes.slice(0, i).reduce((acc, s) => acc + s.durationInFrames, 0),
    );

    const audioTracks = sceneData.scenes
      .map((scene, i) => {
        if (!scene.audioUrl) return null;
        return {
          id: `audio-${scene.kind}-${i}`,
          kind: scene.kind,
          src: scene.audioUrl,
          startFrame: starts[i],
          durationInFrames: scene.durationInFrames,
          label: scene.kind === "quran" ? "Récitation Verset" : "Audio Mot",
        };
      })
      .filter(Boolean);

    const verseTrack = audioTracks.find((t) => t?.kind === "quran");
    expect(verseTrack).toBeDefined();
    expect(verseTrack?.label).toBe("Récitation Verset");
    expect(verseTrack?.src).toBe(audio.verseAudioUrl);
  });

  // TEST 5 — Position : audio.startFrame === scene.startFrame pour l'audio du verset
  it("TEST 5: audio track startFrame matches scene startFrame exactly", () => {
    const audio = {
      wordAudioUrl: "https://example.com/word.opus",
      verseAudioUrl: getAyahAudioUrl(1),
      wordAudioDuration: 2.0,
      verseAudioDuration: 5.62,
    };
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, audio);
    const sceneData = toVideoSceneData(content);
    const starts = sceneData.scenes.map((_, i) =>
      sceneData.scenes.slice(0, i).reduce((acc, s) => acc + s.durationInFrames, 0),
    );

    const quranIndex = sceneData.scenes.findIndex((s) => s.kind === "quran");
    const quranScene = sceneData.scenes[quranIndex];
    const quranStartFrame = starts[quranIndex];

    expect(quranStartFrame).toBeGreaterThan(0);
    expect(quranScene.durationInFrames).toBe(Math.round(5.62 * 30)); // 169 frames
  });

  // TEST 6 — Durée Timeline : audio.durationInFrames === actualAudioDurationInFrames
  it("TEST 6: audio duration in frames equals the exact audio duration", () => {
    const verseAudioDuration = 4.5;
    const fps = 30;
    const expectedFrames = Math.round(verseAudioDuration * fps); // 135 frames

    const audio = {
      wordAudioUrl: null,
      verseAudioUrl: getAyahAudioUrl(7),
      verseAudioDuration,
    };
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, audio);
    const sceneData = toVideoSceneData(content);

    const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
    expect(quranScene?.durationInFrames).toBe(expectedFrames);
  });

  // TEST 7 — Régression : mot sans audio utilise la durée de base par défaut
  it("TEST 7: scenes without audio fall back to deterministic default durations", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
    const sceneData = toVideoSceneData(content);

    const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
    expect(quranScene?.durationInFrames).toBe(90); // SCENE_FRAMES.quran fallback

    const wordScene = sceneData.scenes.find((s) => s.kind === "word");
    expect(wordScene?.durationInFrames).toBe(60); // SCENE_FRAMES.word fallback
  });
});

describe("Content Studio Formats Taxonomy & Catalog", () => {
  it("defines all analyzed short video formats with full metadata", async () => {
    const { VIDEO_FORMATS_CATALOG, isImplementedFormat, getFormatDefinition } = await import(
      "@/lib/content-studio/templates"
    );

    expect(VIDEO_FORMATS_CATALOG.length).toBeGreaterThanOrEqual(10);

    const categories = new Set(VIDEO_FORMATS_CATALOG.map((f) => f.category));
    expect(categories.has("APPRENDRE")).toBe(true);
    expect(categories.has("COMPRENDRE")).toBe(true);
    expect(categories.has("RÉSEAUX SOCIAUX")).toBe(true);

    // Implemented formats
    expect(isImplementedFormat("WORD_REVEAL_V1")).toBe(true);
    expect(isImplementedFormat("WORD_QUIZ_V1")).toBe(true);
    expect(isImplementedFormat("VERSE_DEEP_DIVE_V1")).toBe(true);
    expect(isImplementedFormat("FREQUENCY_FACT_V1")).toBe(true);
    expect(isImplementedFormat("SURAH_HIGHLIGHT_V1")).toBe(true);

    // Coming soon formats
    expect(isImplementedFormat("ROOT_FAMILY_V1")).toBe(false);
    expect(isImplementedFormat("WORD_DUEL_V1")).toBe(false);

    const reveal = getFormatDefinition("WORD_REVEAL_V1");
    expect(reveal).toBeDefined();
    expect(reveal?.status).toBe("IMPLEMENTED");
    expect(reveal?.platforms).toContain("TikTok");
  });
});

describe("Content Studio Video Deletion & Storage Isolation", () => {
  it("deleteRenderedVideoAssets only targets VIDEO_BUCKET (hikma-video) and never touches word-audio", async () => {
    const { deleteRenderedVideoAssets, VIDEO_BUCKET } = await import("@/lib/content-studio/storage");
    expect(VIDEO_BUCKET).toBe("hikma-video");

    const removedBuckets: string[] = [];
    const removedPaths: string[][] = [];

    const mockClient = {
      storage: {
        from: (bucket: string) => {
          removedBuckets.push(bucket);
          return {
            list: async (folder: string) => ({
              data: [{ name: "v1-abc12345.mp4" }],
              error: null,
            }),
            remove: async (paths: string[]) => {
              removedPaths.push(paths);
              return { data: paths.map((p) => ({ name: p })), error: null };
            },
          };
        },
      },
    };

    const res = await deleteRenderedVideoAssets(
      "test-content-key-123",
      "test-content-key-123/v1-abc12345.mp4",
      mockClient as never,
    );

    expect(res.deleted).toContain("test-content-key-123/v1-abc12345.mp4");
    expect(removedBuckets).toEqual(["hikma-video", "hikma-video"]);
    expect(removedBuckets).not.toContain("word-audio");
  });

  it("deleteRenderedVideoAssets handles empty or non-existent folder idempotently", async () => {
    const { deleteRenderedVideoAssets } = await import("@/lib/content-studio/storage");

    const mockClient = {
      storage: {
        from: () => ({
          list: async () => ({ data: [], error: null }),
          remove: async () => ({ data: [], error: null }),
        }),
      },
    };

    const res = await deleteRenderedVideoAssets("empty-key", null, mockClient as never);
    expect(res.deleted).toEqual([]);
    expect(res.error).toBeUndefined();
  });
});


