// Hikma — RÉGRESSION PREVIEW RÉCITATION (Phase 14).
//
// Garantit que le Preview et le rendu MP4 partagent EXACTEMENT la même
// construction audio/scènes, que la récitation est une piste continue UNIQUE
// (jamais d'audio par mot), et que le Golden Follower est purement visuel.
//
// Ces tests sont STRUCTURELS (pure logique) — la validation navigateur réelle
// (0 redémarrage, synchro ±0,5 s) est faite par scripts/headless-sync-audit.mjs.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { REVEAL_FIXTURE_YAWMA } from "../lib/content-studio/video/fixtures";
import {
  buildVideoContentFromReveal,
  toVideoSceneData,
} from "../lib/content-studio/video/pipeline";
import { getEffectiveSceneData } from "../lib/content-studio/editor/state";
import { getAyahAudioUrl } from "../lib/quran/ayah-audio";
import type { ContentStudioAudio } from "../lib/content-studio/audio";

/** Audio résolu comme le ferait render.ts / page.tsx (durées EXACTES simulées). */
const MOCK_AUDIO: ContentStudioAudio = {
  wordAudioUrl: "https://supabase.example/storage/v1/object/sign/word-audio/muallim/x.opus",
  verseAudioUrl: getAyahAudioUrl(120), // Al-Baqarah 2:113
  wordAudioDuration: 1.18,
  verseAudioDuration: 32.57,
};

function previewScenes() {
  const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, MOCK_AUDIO);
  return getEffectiveSceneData(content, null).scenes;
}

describe("preview-recitation — piste audio continue unique", () => {
  it("1. le montage Preview ne contient qu'UNE source audio par scène audio", () => {
    const scenes = previewScenes();
    const audioScenes = scenes.filter((s) => s.audioUrl);
    // word + quran : 2 scènes audio, chacune avec UNE url unique
    expect(audioScenes.length).toBe(2);
    for (const s of audioScenes) {
      expect(typeof s.audioUrl).toBe("string");
    }
  });

  it("2. AUCUNE source audio par mot : la scène Coran a l'URL du VERSET, pas des mots", () => {
    const scenes = previewScenes();
    const quran = scenes.find((s) => s.kind === "quran");
    expect(quran?.audioUrl).toContain("cdn.islamic.network");
    expect(quran?.audioUrl).not.toContain("word-audio");
    // verseConfig ne contient AUCUN champ audio par mot
    expect(quran?.verseConfig?.follower?.words ?? null).toBeNull();
    // Aucune structure words→audio dans la scène
    const serialized = JSON.stringify(quran);
    expect(serialized).not.toContain('"audio":');
  });

  it("3. verseAudioUrl identique Preview / Render (même construction)", () => {
    // Le rendu MP4 passe par toVideoSceneData + getEffectiveSceneData avec le MÊME audio
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, MOCK_AUDIO);
    const derived = toVideoSceneData(content).scenes;
    const effective = getEffectiveSceneData(content, null).scenes;
    const dQuran = derived.find((s) => s.kind === "quran");
    const eQuran = effective.find((s) => s.kind === "quran");
    expect(eQuran?.audioUrl).toBe(dQuran?.audioUrl);
    expect(eQuran?.audioUrl).toBe(MOCK_AUDIO.verseAudioUrl);
  });

  it("4. durée Preview = durée Render (mêmes scènes, mêmes frames)", () => {
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, MOCK_AUDIO);
    const derived = toVideoSceneData(content).scenes;
    const effective = getEffectiveSceneData(content, null).scenes;
    expect(effective).toEqual(derived);
    const sum = (arr: { durationInFrames: number }[]) =>
      arr.reduce((a, s) => a + s.durationInFrames, 0);
    expect(sum(effective)).toBe(sum(derived));
  });

  it("5. la scène Coran couvre la durée audio réelle du verset (aucune coupure)", () => {
    const scenes = previewScenes();
    const quran = scenes.find((s) => s.kind === "quran");
    const audioFrames = Math.round((MOCK_AUDIO.verseAudioDuration ?? 0) * 30);
    expect(quran?.durationInFrames).toBeGreaterThanOrEqual(audioFrames);
    expect(quran?.audioDuration).toBe(MOCK_AUDIO.verseAudioDuration);
  });

  it("6. Golden Follower INDÉPENDANT de l'audio (vérification structurelle du source)", () => {
    const followerSource = readFileSync(
      "remotion/scenes/GoldenRecitationFollower.tsx",
      "utf8",
    );
    // Aucun <Audio> ni import audio dans le follower : il est purement visuel
    expect(followerSource).not.toMatch(/<Audio\b/);
    expect(followerSource).not.toMatch(/from "remotion"/);
    // Il n'accepte que frame + durée + texte
    expect(followerSource).toContain("currentFrame");
    expect(followerSource).toContain("durationInFrames");
  });

  it("6b. QuranScene contient EXACTEMENT UN <Audio> (piste continue unique)", () => {
    const quranSource = readFileSync("remotion/scenes/QuranScene.tsx", "utf8");
    const audioTags = quranSource.match(/<Audio\b/g) ?? [];
    expect(audioTags.length).toBe(1);
    // L'unique source est la piste du VERSET (src={audioUrl} de la scène), jamais par mot
    expect(quranSource).toContain("<Audio");
    expect(quranSource).not.toContain("words.map");
  });

  it("7. pas de remontage lié à currentFrame : les scènes sont construites UNE fois, l'URL audio provient de la source dérivée", () => {
    // getEffectiveSceneData est PUR et déterministe : mêmes entrées ⇒ mêmes sorties,
    // aucune dépendance à un frame quelconque.
    const a = JSON.stringify(previewScenes());
    const b = JSON.stringify(previewScenes());
    expect(a).toBe(b);
    // L'URL audio de la scène Coran vient de la source dérivée officielle
    const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA, MOCK_AUDIO);
    const derived = toVideoSceneData(content).scenes;
    const effective = getEffectiveSceneData(content, {
      scenes: [{ kind: "quran", durationInFrames: 90 }],
    }).scenes;
    const quran = effective.find((s) => s.kind === "quran");
    expect(quran?.audioUrl).toBe(derived.find((s) => s.kind === "quran")?.audioUrl);
    // Et la durée a été réalignée sur l'audio (jamais 90 frames avec un verset de 32 s)
    expect(quran?.durationInFrames).toBeGreaterThan(90);
  });
});
