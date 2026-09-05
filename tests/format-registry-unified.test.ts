// Hikma — LOT 1 : registre unifié + template AYAH_IMMERSION.
//
// Couvre :
//   - cohérence registre ↔ catalogue dérivé (UNE SEULE source de vérité) ;
//   - createAyahImmersionTemplate : scènes du pipeline réel, verset PROTÉGÉ
//     (jamais promu), planification temporelle, z-index, déterminisme,
//     sérialisation, métadonnées COMPRENDRE.

import { describe, expect, it } from "vitest";
import { REVEAL_FIXTURE_YAWMA } from "@/lib/content-studio/video/fixtures";
import { VIDEO_FORMATS, isFormatGenerable } from "@/lib/content-studio/formats/format-registry";
import {
  VIDEO_FORMATS_CATALOG,
  isImplementedFormat,
  getFormatDefinition,
  IMPLEMENTED_FORMAT_KEYS,
} from "@/lib/content-studio/templates";
import { generateFormatTemplate } from "@/lib/content-studio/formats/format-template-engine";
import { computeStarts } from "@/lib/content-studio/editor/timeline-ops";

describe("registre unifié — cohérence templates.ts ↔ format-registry", () => {
  it("le catalogue dérivé a UNE entrée par format du registre (11 = 11)", () => {
    expect(VIDEO_FORMATS_CATALOG).toHaveLength(VIDEO_FORMATS.length);
    const catalogKeys = new Set(VIDEO_FORMATS_CATALOG.map((f) => f.key));
    expect(catalogKeys.size).toBe(VIDEO_FORMATS.length); // aucune collision de clés *_V1
  });

  it("chaque format du registre expose une clé catalogue unique et connue", () => {
    for (const f of VIDEO_FORMATS) {
      const def = getFormatDefinition(
        {
          WORD_REVEAL: "WORD_REVEAL_V1",
          WORD_QUIZ: "WORD_QUIZ_V1",
          FREQUENCY_FACT: "FREQUENCY_FACT_V1",
          ROOT_FAMILY: "ROOT_FAMILY_V1",
          NUANCE_FALSE_FRIENDS: "WORD_DUEL_V1",
          AYAH_IMMERSION: "VERSE_DEEP_DIVE_V1",
          SURAH_KEYWORDS: "SURAH_HIGHLIGHT_V1",
          LINGUISTIC_PEARL: "LINGUISTIC_GEM_V1",
          DAILY_WORD_CHALLENGE: "STREAK_CHALLENGE_V1",
          LISTEN_AND_FIND: "AUDIO_RECITE_CHALLENGE_V1",
          SPEED_VOCAB: "VOCAB_SPEED_RUN_V1",
        }[f.id] ?? "",
      );
      expect(def).toBeDefined();
      expect(def!.name).toBe(f.name);
      expect(def!.category).toBe(f.category);
    }
  });

  it("les statuts sont DÉRIVÉS : READY/BETA ⇒ IMPLEMENTED, sinon COMING_SOON", () => {
    expect(isImplementedFormat("WORD_REVEAL_V1")).toBe(true);
    expect(isImplementedFormat("VERSE_DEEP_DIVE_V1")).toBe(true); // AYAH_IMMERSION READY
    expect(isImplementedFormat("SURAH_HIGHLIGHT_V1")).toBe(true); // SURAH_KEYWORDS BETA
    expect(isImplementedFormat("ROOT_FAMILY_V1")).toBe(false); // registre COMING_SOON
    expect(isImplementedFormat("VOCAB_SPEED_RUN_V1")).toBe(true); // LOT 2 Speed Vocab READY
    expect(isImplementedFormat("WORD_DUEL_V1")).toBe(false);
    expect(IMPLEMENTED_FORMAT_KEYS.length).toBe(6);
  });

  it("toutes les clés de IMPLEMENTED_FORMAT_KEYS existent dans le catalogue dérivé", () => {
    for (const key of IMPLEMENTED_FORMAT_KEYS) {
      expect(getFormatDefinition(key)).toBeDefined();
    }
  });

  it("WORD_REVEAL, AYAH_IMMERSION et SPEED_VOCAB sont les formats générables", () => {
    expect(isFormatGenerable("WORD_REVEAL")).toBe(true);
    expect(isFormatGenerable("AYAH_IMMERSION")).toBe(true);
    expect(isFormatGenerable("SPEED_VOCAB")).toBe(true); // LOT 2
    expect(isFormatGenerable("LINGUISTIC_PEARL")).toBe(false);
  });

  it("le registre est l'unique source : le catalogue expose les mêmes plateformes", () => {
    for (const f of VIDEO_FORMATS) {
      const key =
        f.id === "AYAH_IMMERSION"
          ? "VERSE_DEEP_DIVE_V1"
          : f.id === "SURAH_KEYWORDS"
            ? "SURAH_HIGHLIGHT_V1"
            : `${f.id}_V1`;
      const def = getFormatDefinition(key === "NUANCE_FALSE_FRIENDS_V1" ? "WORD_DUEL_V1" : key);
      if (!def) continue; // mappé ci-dessus pour les cas spéciaux
      expect(def.platforms).toEqual(f.platforms);
      expect(def.estimatedDuration).toBe(f.recommendedDuration);
    }
  });
});

describe("ayah-immersion — template (données réelles يَوْمَ)", () => {
  const out = generateFormatTemplate("AYAH_IMMERSION", { payload: REVEAL_FIXTURE_YAWMA });

  it("passe par le moteur officiel et cible VERSE_DEEP_DIVE_V1", () => {
    expect(out.format).toBe("AYAH_IMMERSION");
    expect(out.templateKey).toBe("VERSE_DEEP_DIVE_V1");
    expect(out.fps).toBe(30);
    expect(out.width).toBe(1080);
    expect(out.height).toBe(1920);
  });

  it("contient une scène coran en mode IMMERSION (large + Golden Follower)", () => {
    const quran = out.scenes.find((s) => s.kind === "quran");
    expect(quran).toBeDefined();
    expect(quran!.verseConfig?.mode).toBe("large");
    expect(quran!.verseConfig?.follower?.enabled).toBe(true);
    expect(quran!.verseConfig?.follower?.style).toBe("gold-highlight");
    // Donnée réelle : le verset contient le mot (excerpt inaltéré)
    expect(quran!.arabic).toContain("يَوْمَ");
  });

  it("le VERSET coranique n'est JAMAIS promu en clip éditable (protégé)", () => {
    const quranIndex = out.scenes.findIndex((s) => s.kind === "quran");
    const promotedVerse = out.graphics.some(
      (g) =>
        g.kind === "text" &&
        (g as { source?: { sceneIndex: number; field: string } }).source?.sceneIndex === quranIndex &&
        (g as { source?: { sceneIndex: number; field: string } }).source?.field === "arabic",
    );
    expect(promotedVerse).toBe(false);
  });

  it("les textes non protégés SONT pré-promus (hook, mot, sens, CTA)", () => {
    const ids = out.graphics.map((g) => g.id);
    expect(ids).toContain("fmt-ayah-immersion-0-text"); // hook de l'intro
    expect(ids).toContain("fmt-ayah-immersion-1-arabic"); // mot arabe
    expect(ids).toContain("fmt-ayah-immersion-2-text"); // sens
    for (const g of out.graphics) {
      if (g.kind === "text") {
        expect((g as { source?: unknown }).source).toBeDefined();
      }
    }
  });

  it("planification : chaque clip démarre au début de SA scène (jamais tout à 0)", () => {
    const starts = computeStarts(out.scenes);
    const zeroStart = out.graphics.filter((c) => c.startFrame === 0);
    expect(zeroStart.length).toBe(1); // seul le hook de l'intro
    expect(zeroStart[0]!.id).toBe("fmt-ayah-immersion-0-text");
    for (const g of out.graphics) {
      const sceneIdx =
        g.kind === "text" ? (g as unknown as { source: { sceneIndex: number } }).source.sceneIndex : -1;
      if (sceneIdx >= 0) {
        expect(g.startFrame).toBe(starts[sceneIdx]);
      }
    }
  });

  it("le bandeau décoratif du verset reste DERRIÈRE le renderer coranique (z=1)", () => {
    const decor = out.graphics.find((g) => g.id === "fmt-ayah-immersion-decor-verse-band");
    expect(decor).toBeDefined();
    expect(decor!.zIndex).toBe(1);
    expect(decor!.startFrame).toBeGreaterThan(0); // commence avec la scène quran
  });

  it("déterminisme strict : mêmes entrées ⇒ sortie identique à l'identique", () => {
    const again = generateFormatTemplate("AYAH_IMMERSION", { payload: REVEAL_FIXTURE_YAWMA });
    expect(JSON.stringify(again)).toBe(JSON.stringify(out));
  });

  it("sérialisation JSON propre (jamais NaN/Infinity) + métadonnées COMPRENDRE", () => {
    const json = JSON.stringify(out);
    expect(json).not.toContain("NaN");
    expect(json).not.toContain("Infinity");
    expect(out.metadata.category).toBe("COMPRENDRE");
    expect(out.metadata.wordId).toBe(REVEAL_FIXTURE_YAWMA.word.id);
    expect(out.metadata.surah).toBe(REVEAL_FIXTURE_YAWMA.firstOccurrence.surahNumber);
    expect(out.metadata.platform).toEqual(["Instagram Reels", "YouTube Shorts"]);
  });
});
