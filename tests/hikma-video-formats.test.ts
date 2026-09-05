// Hikma — Video Format System : tests déterministes.
//
// Couvre : registre (11 formats, statuts), moteur (validation, rejets),
// template Word Reveal (durées, planification temporelle, z-index composés,
// données réelles, déterminisme, sérialisation, sanitization).

import { describe, expect, it } from "vitest";
import { REVEAL_FIXTURE_YAWMA } from "@/lib/content-studio/video/fixtures";
import {
  VIDEO_FORMATS,
  getVideoFormat,
  isFormatGenerable,
  selectableFormats,
} from "@/lib/content-studio/formats/format-registry";
import {
  FormatTemplateError,
  generateFormatTemplate,
} from "@/lib/content-studio/formats/format-template-engine";
import { createWordRevealTemplate } from "@/lib/content-studio/formats/word-reveal";
import { computeStarts } from "@/lib/content-studio/editor/timeline-ops";

describe("format-registry — registre central", () => {
  it("expose les 11 formats éditoriaux Hikma", () => {
    expect(VIDEO_FORMATS).toHaveLength(11);
    const ids = VIDEO_FORMATS.map((f) => f.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "WORD_REVEAL",
        "WORD_QUIZ",
        "FREQUENCY_FACT",
        "ROOT_FAMILY",
        "NUANCE_FALSE_FRIENDS",
        "AYAH_IMMERSION",
        "SURAH_KEYWORDS",
        "LINGUISTIC_PEARL",
        "DAILY_WORD_CHALLENGE",
        "LISTEN_AND_FIND",
        "SPEED_VOCAB",
      ]),
    );
  });

  it("statuts : READY = Reveal, Immersion & Speed Vocab ; BETA = Quiz/Frequency/Surah ; COMING_SOON = reste", () => {
    const status = (id: string) => getVideoFormat(id)!.status;
    expect(status("WORD_REVEAL")).toBe("READY");
    expect(status("AYAH_IMMERSION")).toBe("READY");
    expect(status("SPEED_VOCAB")).toBe("READY"); // LOT 2
    expect(status("WORD_QUIZ")).toBe("BETA");
    expect(status("FREQUENCY_FACT")).toBe("BETA");
    expect(status("SURAH_KEYWORDS")).toBe("BETA");
    for (const id of [
      "ROOT_FAMILY",
      "NUANCE_FALSE_FRIENDS",
      "LINGUISTIC_PEARL",
      "DAILY_WORD_CHALLENGE",
      "LISTEN_AND_FIND",
    ]) {
      expect(status(id)).toBe("COMING_SOON");
    }
  });

  it("générables = READY + createTemplate (Reveal + Immersion + Speed Vocab)", () => {
    expect(isFormatGenerable("WORD_REVEAL")).toBe(true);
    expect(isFormatGenerable("AYAH_IMMERSION")).toBe(true);
    expect(isFormatGenerable("SPEED_VOCAB")).toBe(true); // LOT 2
    expect(isFormatGenerable("WORD_QUIZ")).toBe(false);
    expect(isFormatGenerable("INCONNU")).toBe(false);
  });

  it("chaque format déclare nom/catégorie/durée/plateformes", () => {
    for (const f of VIDEO_FORMATS) {
      expect(f.name.length).toBeGreaterThan(0);
      expect(["APPRENDRE", "COMPRENDRE", "RÉSEAUX SOCIAUX"]).toContain(f.category);
      expect(f.recommendedDuration.length).toBeGreaterThan(0);
      expect(f.platforms.length).toBeGreaterThan(0);
    }
  });
});

describe("format-template-engine — validation", () => {
  it("rejette un format inconnu et un format non générable", () => {
    expect(() =>
      generateFormatTemplate("INCONNU_XYZ" as never, {}),
    ).toThrowError(FormatTemplateError);
    try {
      generateFormatTemplate("WORD_QUIZ", {});
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(FormatTemplateError);
      expect((e as FormatTemplateError).code).toBe("FORMAT_NOT_READY");
    }
  });
});

describe("word-reveal — template (données réelles يَوْمَ)", () => {
  const out = createWordRevealTemplate({ payload: REVEAL_FIXTURE_YAWMA });

  it("génère des scènes standards du pipeline (6 : intro, mot, sens, coran, cta)", () => {
    expect(out.templateKey).toBe("WORD_REVEAL_V1");
    expect(out.format).toBe("WORD_REVEAL");
    expect(out.fps).toBe(30);
    expect(out.width).toBe(1080);
    expect(out.height).toBe(1920);
    const kinds = out.scenes.map((s) => s.kind);
    expect(kinds).toContain("intro");
    expect(kinds).toContain("word");
    expect(kinds).toContain("meaning");
    expect(kinds).toContain("quran");
    expect(kinds).toContain("cta");
    // Données réelles jamais inventées
    const word = out.scenes.find((s) => s.kind === "word")!;
    expect(word.arabic).toBe("يَوْمَ");
    expect(word.transliteration).toBe("yawma");
    const meaning = out.scenes.find((s) => s.kind === "meaning")!;
    expect(meaning.text).toBe("jour");
    const quran = out.scenes.find((s) => s.kind === "quran")!;
    expect(quran.arabic).toContain("يَوْمَ");
  });

  it("durée totale = somme des scènes (cohérence starts)", () => {
    const starts = computeStarts(out.scenes);
    expect(starts[0]).toBe(0);
    for (let i = 0; i < out.scenes.length; i++) {
      expect(starts[i]).toBe(
        out.scenes.slice(0, i).reduce((acc, s) => acc + s.durationInFrames, 0),
      );
    }
    expect(out.durationInFrames).toBe(
      out.scenes.reduce((acc, s) => acc + s.durationInFrames, 0),
    );
    expect(out.durationInFrames).toBeGreaterThan(0);
  });

  it("planification : AUCUN clip à frame 0 sauf le hook de l'intro", () => {
    const starts = computeStarts(out.scenes);
    const zeroStart = out.graphics.filter((c) => c.startFrame === 0);
    // seul le texte de l'intro (scène 0) démarre à 0
    expect(zeroStart.length).toBe(1);
    expect(zeroStart[0]!.id).toBe("fmt-word-reveal-0-text");
    // le mot arabe démarre à la scène "word" (après l'intro)
    const wordSceneIndex = out.scenes.findIndex((s) => s.kind === "word");
    const arabic = out.graphics.find((c) => c.id === "fmt-word-reveal-1-arabic");
    expect(arabic!.startFrame).toBe(starts[wordSceneIndex]);
    expect(arabic!.startFrame).toBeGreaterThan(0);
  });

  it("z-index composés (jamais max+1 aveugle) et ordre de superposition", () => {
    const byId = new Map(out.graphics.map((c) => [c.id, c]));
    const decor = byId.get("fmt-word-reveal-decor-medallion")!;
    const arabic = byId.get("fmt-word-reveal-1-arabic")!;
    const translit = byId.get("fmt-word-reveal-1-transliteration")!;
    const cta = byId.get("fmt-word-reveal-4-text")!;
    expect(decor.zIndex).toBe(1); // décor derrière tout
    expect(arabic.zIndex).toBe(10); // mot au premier plan de la scène
    expect(translit.zIndex).toBe(11);
    expect(cta.zIndex).toBe(12); // CTA tout devant
    expect(arabic.zIndex).toBeGreaterThan(decor.zIndex);
    expect(cta.zIndex).toBeGreaterThan(arabic.zIndex);
  });

  it("textes pré-promus : source {sceneIndex, field} + styles réels", () => {
    const arabic = out.graphics.find((c) => c.id === "fmt-word-reveal-1-arabic")!;
    expect(arabic.kind).toBe("text");
    if (arabic.kind === "text") {
      expect(arabic.source).toEqual({ sceneIndex: 1, field: "arabic" });
      expect(arabic.text).toBe("يَوْمَ");
      expect(arabic.direction).toBe("rtl");
      expect(arabic.style.fontFamily).toBe("Amiri");
      expect(arabic.animation?.preset).toBe("typewriter");
    }
    // Le verset coranique (quran.arabic) est PROTÉGÉ : jamais pré-promu
    expect(out.graphics.some((c) => c.id === "fmt-word-reveal-3-arabic")).toBe(false);
  });

  it("déterminisme strict : mêmes entrées ⇒ sortie identique à l'identique", () => {
    const again = createWordRevealTemplate({ payload: REVEAL_FIXTURE_YAWMA });
    expect(JSON.stringify(again)).toBe(JSON.stringify(out));
    // ids déterministes (aucun UUID)
    for (const c of out.graphics) {
      expect(c.id).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
    }
  });

  it("sérialisation JSON + sanitization : jamais NaN/Infinity, champs stables", () => {
    const json = JSON.stringify(out);
    expect(json).not.toContain("NaN");
    expect(json).not.toContain("Infinity");
    const roundtrip = JSON.parse(json) as typeof out;
    expect(roundtrip.scenes.length).toBe(out.scenes.length);
    expect(roundtrip.graphics.length).toBe(out.graphics.length);
    expect(roundtrip.durationInFrames).toBe(out.durationInFrames);
  });

  it("métadonnées éditoriales réelles (wordId, sourate, verset, plateformes)", () => {
    expect(out.metadata.wordId).toBe(REVEAL_FIXTURE_YAWMA.word.id);
    expect(out.metadata.surah).toBe(REVEAL_FIXTURE_YAWMA.firstOccurrence.surahNumber);
    expect(out.metadata.ayah).toBe(REVEAL_FIXTURE_YAWMA.firstOccurrence.ayahNumber);
    expect(out.metadata.language).toBe("fr");
    expect(out.metadata.category).toBe("APPRENDRE");
    expect(out.metadata.platform).toEqual(["TikTok", "Instagram Reels", "YouTube Shorts"]);
    expect(out.metadata.templateVersion).toBe("1");
  });
});

describe("selectableFormats", () => {
  it("n'expose que READY + BETA (jamais COMING_SOON)", () => {
    const selectable = selectableFormats();
    expect(selectable.length).toBe(6); // Reveal, Quiz, Frequency, Immersion, Surah, Speed Vocab
    for (const f of selectable) {
      expect(f.status).not.toBe("COMING_SOON");
    }
  });
});
