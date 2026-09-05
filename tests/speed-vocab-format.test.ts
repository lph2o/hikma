// Hikma — LOT 2 : SPEED VOCAB 60s (tests déterministes).
//
// Couvre :
//   - SpeedVocabPayloadV1 : validator strict (REJECT OVER GUESS) ;
//   - pipeline : buildVideoContentFromSpeedVocab + toVideoSceneData (3 et 5 mots) ;
//   - template : planification séquentielle, z-index composés, textes pré-promus,
//     bandeaux décoratifs, déterminisme, sérialisation ;
//   - registre unifié : cohérence catalogue ↔ registre pour SPEED_VOCAB.

import { describe, expect, it } from "vitest";
import { SPEED_VOCAB_FIXTURE } from "@/lib/content-studio/video/speed-vocab-fixtures";
import {
  SPEED_VOCAB_MAX_WORDS,
  SPEED_VOCAB_MIN_WORDS,
} from "@/lib/content-api/speed-vocab-types";
import { validateSpeedVocabPayloadV1 } from "@/lib/content-api/speed-vocab-validators";
import {
  buildVideoContentFromSpeedVocab,
  toVideoSceneData,
} from "@/lib/content-studio/video/pipeline";
import { computeStarts } from "@/lib/content-studio/editor/timeline-ops";
import { createSpeedVocabTemplate } from "@/lib/content-studio/formats/speed-vocab";
import {
  getVideoFormat,
  isFormatGenerable,
} from "@/lib/content-studio/formats/format-registry";
import { getFormatDefinition, isImplementedFormat } from "@/lib/content-studio/templates";

// ---------------------------------------------------------------------------
// Helpers de fabrication de payloads dérivés (purs, déterministes)
// ---------------------------------------------------------------------------

function payloadWithNWords(n: number) {
  const words = SPEED_VOCAB_FIXTURE.words.slice(0, n);
  return {
    ...SPEED_VOCAB_FIXTURE,
    words,
    sources: { ...SPEED_VOCAB_FIXTURE.sources, wordId: words[0]!.wordId },
  } as typeof SPEED_VOCAB_FIXTURE;
}

// ---------------------------------------------------------------------------
// Contrat + validator
// ---------------------------------------------------------------------------

describe("speed-vocab — contrat & validator (REJECT OVER GUESS)", () => {
  it("le fixture gelé (5 mots réels) passe la validation", () => {
    expect(SPEED_VOCAB_FIXTURE.words.length).toBe(5);
    expect(validateSpeedVocabPayloadV1(SPEED_VOCAB_FIXTURE)).toEqual({ ok: true });
  });

  it("rejette < 3 mots et > 5 mots", () => {
    expect(validateSpeedVocabPayloadV1(payloadWithNWords(2)).ok).toBe(false);
    const six = {
      ...SPEED_VOCAB_FIXTURE,
      words: [...SPEED_VOCAB_FIXTURE.words, SPEED_VOCAB_FIXTURE.words[0]],
    };
    expect(validateSpeedVocabPayloadV1(six as never).ok).toBe(false);
    expect(SPEED_VOCAB_MIN_WORDS).toBe(3);
    expect(SPEED_VOCAB_MAX_WORDS).toBe(5);
  });

  it("rejette un mot dupliqué et une glose dupliquée", () => {
    const dupWord = {
      ...SPEED_VOCAB_FIXTURE,
      words: [SPEED_VOCAB_FIXTURE.words[0], SPEED_VOCAB_FIXTURE.words[0], SPEED_VOCAB_FIXTURE.words[1]],
    };
    expect(validateSpeedVocabPayloadV1(dupWord as never).ok).toBe(false);

    const dupMeaning = {
      ...SPEED_VOCAB_FIXTURE,
      words: [
        SPEED_VOCAB_FIXTURE.words[0],
        { ...SPEED_VOCAB_FIXTURE.words[1], meaning: SPEED_VOCAB_FIXTURE.words[0].meaning },
        SPEED_VOCAB_FIXTURE.words[2],
      ],
    };
    expect(validateSpeedVocabPayloadV1(dupMeaning as never).ok).toBe(false);
  });

  it("rejette arabic vide / occurrenceCount <= 0 / meaningSource hors contrat", () => {
    const badArabic = {
      ...SPEED_VOCAB_FIXTURE,
      words: SPEED_VOCAB_FIXTURE.words.map((w, i) =>
        i === 0 ? { ...w, arabic: "" } : w,
      ),
    };
    expect(validateSpeedVocabPayloadV1(badArabic as never).ok).toBe(false);

    const badOcc = {
      ...SPEED_VOCAB_FIXTURE,
      words: SPEED_VOCAB_FIXTURE.words.map((w, i) =>
        i === 0 ? { ...w, occurrenceCount: 0 } : w,
      ),
    };
    expect(validateSpeedVocabPayloadV1(badOcc as never).ok).toBe(false);

    const badChannel = {
      ...SPEED_VOCAB_FIXTURE,
      words: SPEED_VOCAB_FIXTURE.words.map((w, i) =>
        i === 0 ? { ...w, meaningSource: "FALLBACK" } : w,
      ),
    };
    expect(validateSpeedVocabPayloadV1(badChannel as never).ok).toBe(false);
  });

  it("rejette contentKey non sha256 et sources désalignées", () => {
    const badKey = { ...SPEED_VOCAB_FIXTURE, contentKey: "pas-un-sha256" };
    expect(validateSpeedVocabPayloadV1(badKey).ok).toBe(false);

    const badSources = {
      ...SPEED_VOCAB_FIXTURE,
      sources: { ...SPEED_VOCAB_FIXTURE.sources, wordId: "00000000-0000-0000-0000-000000000000" },
    };
    expect(validateSpeedVocabPayloadV1(badSources).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Pipeline (3 mots et 5 mots)
// ---------------------------------------------------------------------------

describe("speed-vocab — pipeline (scènes déterministes)", () => {
  it.each([3, 5])("%i mots → intro + (mot+sens)×N + CTA, ordre séquentiel", (n) => {
    const payload = payloadWithNWords(n);
    const content = buildVideoContentFromSpeedVocab(payload);
    expect(content.templateKey).toBe("VOCAB_SPEED_RUN_V1");
    expect(content.speedVocabWords).toHaveLength(n);

    const data = toVideoSceneData(content);
    const kinds = data.scenes.map((s) => s.kind);
    expect(kinds[0]).toBe("intro");
    expect(kinds[kinds.length - 1]).toBe("cta");
    const wordCount = kinds.filter((k) => k === "word").length;
    const meaningCount = kinds.filter((k) => k === "meaning").length;
    expect(wordCount).toBe(n);
    expect(meaningCount).toBe(n);

    // Données réelles dans l'ordre du payload (occurrences DESC).
    const arabicWords = data.scenes.filter((s) => s.kind === "word").map((s) => s.arabic);
    expect(arabicWords[0]).toBe("ٱللَّهَ");
    if (n >= 3) expect(arabicWords[2]).toBe("عِندَ");

    // wordId propagé dans le VideoContent (nécessaire à la résolution audio
    // par mot — chaque scène « Mot N/5 » doit retrouver SA prononciation).
    expect(content.speedVocabWords?.every((w) => typeof w.wordId === "string" && w.wordId.length > 0)).toBe(true);
  });

  it("audio MULTI-MOTS : chaque scène mot reçoit SON URL et SA durée (jamais coupé)", () => {
    const words = SPEED_VOCAB_FIXTURE.words;
    const urls: Record<string, string> = {};
    const durations: Record<string, number> = {};
    for (const w of words) {
      urls[w.wordId] = `https://example.com/audio/${w.wordId}.mp3`;
      durations[w.wordId] = 1.8;
    }
    const content = buildVideoContentFromSpeedVocab(SPEED_VOCAB_FIXTURE, {
      wordAudioUrl: urls[words[0]!.wordId] ?? null,
      verseAudioUrl: null,
      wordAudioDuration: durations[words[0]!.wordId] ?? null,
      wordAudioUrls: urls,
      wordAudioDurations: durations,
    });
    const data = toVideoSceneData(content);
    const wordScenes = data.scenes.filter((s) => s.kind === "word");
    expect(wordScenes).toHaveLength(words.length);
    for (let i = 0; i < wordScenes.length; i++) {
      const s = wordScenes[i]!;
      const w = words[i]!;
      expect(s.audioUrl).toBe(urls[w.wordId]);
      expect(s.audioDuration).toBe(1.8);
      // Durée = max(rythme éditorial, durée audio réelle) — l'audio n'est
      // JAMAIS tronqué (même contrat que la scène mot 1).
      expect(s.durationInFrames).toBeGreaterThanOrEqual(Math.round(1.8 * 30));
    }
  });

  it("sans audio multi-mots, les scènes mots restent au rythme éditorial (audioUrl null)", () => {
    const content = buildVideoContentFromSpeedVocab(SPEED_VOCAB_FIXTURE);
    const data = toVideoSceneData(content);
    for (const s of data.scenes.filter((x) => x.kind === "word")) {
      expect(s.audioUrl ?? null).toBeNull();
      expect(s.durationInFrames).toBe(105); // SPEED_VOCAB_FRAMES.word
    }
  });

  it("durée totale déterministe = somme des scènes (5 mots ≈ 30 s)", () => {
    const content = buildVideoContentFromSpeedVocab(SPEED_VOCAB_FIXTURE);
    const data = toVideoSceneData(content);
    expect(data.durationInFrames).toBe(
      data.scenes.reduce((a, s) => a + s.durationInFrames, 0),
    );
    expect(data.durationInFrames).toBeGreaterThanOrEqual(30 * 30); // ≥ 30 s
    expect(data.durationInFrames).toBeLessThanOrEqual(60 * 30); // ≤ 60 s
  });

  it("aucune scène quran (ce format ne rend pas de verset)", () => {
    const content = buildVideoContentFromSpeedVocab(SPEED_VOCAB_FIXTURE);
    const data = toVideoSceneData(content);
    expect(data.scenes.some((s) => s.kind === "quran")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Template Video Factory
// ---------------------------------------------------------------------------

describe("speed-vocab — template (planning, z-index, déterminisme)", () => {
  const out = createSpeedVocabTemplate({ payload: SPEED_VOCAB_FIXTURE });

  it("cible VOCAB_SPEED_RUN_V1 avec les constantes du moteur", () => {
    expect(out.format).toBe("SPEED_VOCAB");
    expect(out.templateKey).toBe("VOCAB_SPEED_RUN_V1");
    expect(out.fps).toBe(30);
    expect(out.width).toBe(1080);
    expect(out.height).toBe(1920);
  });

  it("TOUS les textes sont des TextGraphicClip pré-promus (source scène+champ)", () => {
    const textClips = out.graphics.filter((g) => g.kind === "text");
    expect(textClips.length).toBeGreaterThan(0);
    for (const g of textClips) {
      if (g.kind === "text") {
        expect(g.source).toBeDefined();
        expect(g.source!.sceneIndex).toBeGreaterThanOrEqual(0);
        expect(g.source!.field.length).toBeGreaterThan(0);
      }
    }
    // Les 5 mots arabes sont promus (aucun texte legacy non éditable).
    const arabicClips = textClips.filter(
      (g) => g.kind === "text" && g.direction === "rtl",
    );
    expect(arabicClips.length).toBe(5);
  });

  it("planification séquentielle : chaque clip démarre au début de SA scène", () => {
    const starts = computeStarts(out.scenes);
    for (const g of out.graphics) {
      if (g.kind !== "text") continue;
      const src = (g as unknown as { source: { sceneIndex: number } }).source;
      expect(g.startFrame).toBe(starts[src.sceneIndex]);
      // durées alignées sur la scène hôte
      expect(g.durationInFrames).toBe(out.scenes[src.sceneIndex].durationInFrames);
    }
    // Les mots ne sont PAS empilés : au moins 3 startFrame distincts.
    const distinctStarts = new Set(out.graphics.map((g) => g.startFrame));
    expect(distinctStarts.size).toBeGreaterThanOrEqual(3);
  });

  it("z-index composés : décor 1 < intro 9 < arabe 10 < secondaire 11 < CTA 12", () => {
    const byId = new Map(out.graphics.map((c) => [c.id, c]));
    const decor = [...byId.values()].find((c) => c.id.includes("decor-occ"));
    const arabic = byId.get("fmt-speed-vocab-1-arabic");
    const translit = byId.get("fmt-speed-vocab-1-transliteration");
    expect(decor!.zIndex).toBe(1);
    expect(arabic!.zIndex).toBe(10);
    expect(translit!.zIndex).toBe(11);
    // Le décor est toujours DERRIÈRE les textes de sa scène.
    for (const g of out.graphics) {
      if (!g.id.includes("decor-occ-")) continue;
      const sceneIdx = Number(g.id.split("decor-occ-")[1]);
      const textSameScene = out.graphics.filter(
        (t) =>
          t.kind === "text" &&
          (t as unknown as { source?: { sceneIndex: number } }).source?.sceneIndex ===
            sceneIdx &&
          t.zIndex > g.zIndex,
      );
      expect(textSameScene.length).toBeGreaterThan(0);
    }
  });

  it("déterminisme strict + sérialisation JSON propre", () => {
    const again = createSpeedVocabTemplate({ payload: SPEED_VOCAB_FIXTURE });
    expect(JSON.stringify(again)).toBe(JSON.stringify(out));
    const json = JSON.stringify(out);
    expect(json).not.toContain("NaN");
    expect(json).not.toContain("Infinity");
    for (const c of out.graphics) {
      expect(c.id).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
    }
  });

  it("métadonnées RÉSEAUX SOCIAUX + wordId du 1er mot", () => {
    expect(out.metadata.category).toBe("RÉSEAUX SOCIAUX");
    expect(out.metadata.wordId).toBe(SPEED_VOCAB_FIXTURE.words[0].wordId);
    expect(out.metadata.platform).toContain("TikTok");
  });
});

// ---------------------------------------------------------------------------
// Registre unifié
// ---------------------------------------------------------------------------

describe("speed-vocab — registre unifié", () => {
  it("SPEED_VOCAB est READY + générable, exposé IMPLEMENTED côté catalogue", () => {
    expect(getVideoFormat("SPEED_VOCAB")!.status).toBe("READY");
    expect(isFormatGenerable("SPEED_VOCAB")).toBe(true);
    expect(isImplementedFormat("VOCAB_SPEED_RUN_V1")).toBe(true);
    expect(getFormatDefinition("VOCAB_SPEED_RUN_V1")).toBeDefined();
  });
});
