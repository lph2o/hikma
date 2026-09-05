// Hikma — Content Studio : UNIFICATION TEXT EDITOR — adapter des textes hérités.
//
// Vérifie la couche d'adaptation qui rend chaque texte de scène (Hikma/Quran)
// éditable par la MÊME pipeline graphique (TextGraphicClip) :
//   - descripteurs par kind de scène (contenu, direction, style, transform) ;
//   - protection du verset coranique (quran.arabic) ;
//   - préservation de la `source` (création, sanitization, rebuild, hash) ;
//   - détection des textes déjà promus.
//
// Aucun rendu : tests PURE de l'architecture d'unification.

import { describe, expect, it } from "vitest";
import type { VideoScene } from "@/lib/content-studio/video/types";
import {
  isLegacyTextPromoted,
  legacyTextKey,
  listLegacyTexts,
  promotedLegacyKeys,
} from "@/lib/content-studio/graphics/legacy-text-adapter";
import {
  createTextGraphicClip,
  sanitizeTextSource,
  type TextGraphicClip,
} from "@/lib/content-studio/graphics/text-graphic";
import { sanitizeEditorGraphics } from "@/lib/content-studio/editor/state";

const scene = (kind: VideoScene["kind"], extra: Partial<VideoScene> = {}): VideoScene => ({
  kind,
  durationInFrames: 90,
  ...extra,
});

describe("legacy-text-adapter — descripteurs par scène", () => {
  it("décrit le mot arabe + la translittération (scène word)", () => {
    const descs = listLegacyTexts(
      scene("word", { arabic: "يَوْمَ", transliteration: "yawma" }),
      2,
    );
    expect(descs.map((d) => d.field)).toEqual(["arabic", "transliteration"]);
    const arabic = descs.find((d) => d.field === "arabic")!;
    expect(arabic.content).toBe("يَوْمَ");
    expect(arabic.direction).toBe("rtl");
    expect(arabic.style.fontFamily).toBe("Amiri");
    expect(arabic.style.fontSize).toBe(190);
    expect(arabic.style.lineHeight).toBe(1.5);
    expect(arabic.key).toBe("2:arabic");
    expect(arabic.transform.x).toBe(0.5);
  });

  it("décrit le texte principal des scènes intro/meaning/explanation/cta", () => {
    for (const kind of ["intro", "meaning", "explanation", "cta"] as const) {
      const descs = listLegacyTexts(scene(kind, { text: "Bonjour" }), 0);
      expect(descs).toHaveLength(1);
      expect(descs[0].field).toBe("text");
      expect(descs[0].direction).toBe("ltr");
      expect(descs[0].content).toBe("Bonjour");
      expect(descs[0].style.fontFamily).toBe("Poppins");
    }
  });

  it("ignore les champs vides (aucun descripteur)", () => {
    expect(listLegacyTexts(scene("word"), 0)).toHaveLength(0);
    expect(listLegacyTexts(scene("meaning", { text: "" }), 0)).toHaveLength(0);
  });

  it("marque le verset coranique comme PROTÉGÉ (jamais promu)", () => {
    const descs = listLegacyTexts(
      scene("quran", { arabic: "بِسْمِ اللَّهِ", subtext: "Coran 1:1" }),
      1,
    );
    expect(descs).toHaveLength(2);
    const verse = descs.find((d) => d.field === "arabic")!;
    expect(verse.protected).toBe(true);
    const ref = descs.find((d) => d.field === "subtext")!;
    expect(ref.protected).toBe(false);
    expect(ref.style.fontSize).toBe(34);
  });
});

describe("legacy-text-adapter — promotion & source", () => {
  const clip = (source?: TextGraphicClip["source"]): TextGraphicClip =>
    createTextGraphicClip({
      id: "t1",
      text: "Salam",
      source,
    });

  it("conserve la source à la création", () => {
    const c = clip({ sceneIndex: 3, field: "text" });
    expect(c.source).toEqual({ sceneIndex: 3, field: "text" });
  });

  it("sanitizeTextSource rejette les valeurs invalides", () => {
    expect(sanitizeTextSource(null)).toBeUndefined();
    expect(sanitizeTextSource({ sceneIndex: -1, field: "text" })).toBeUndefined();
    expect(sanitizeTextSource({ sceneIndex: 0, field: "" })).toBeUndefined();
    expect(sanitizeTextSource({ sceneIndex: 1.8, field: "text" })).toEqual({
      sceneIndex: 1,
      field: "text",
    });
  });

  it("sanitizeEditorGraphics (roundtrip serveur) préserve la source", () => {
    const { graphics } = sanitizeEditorGraphics([
      { ...clip({ sceneIndex: 2, field: "arabic" }), id: "x" },
    ]);
    expect(graphics).not.toBeNull();
    expect((graphics![0] as TextGraphicClip).source).toEqual({
      sceneIndex: 2,
      field: "arabic",
    });
  });

  it("reconstruit le clip après édition sans perdre la source", () => {
    // Même reconstruction que updateTextGraphic (VideoEditor).
    const rebuilt = createTextGraphicClip({
      id: "t1",
      startFrame: 0,
      durationInFrames: 90,
      zIndex: 1,
      transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      keyframes: undefined,
      text: "Modifié",
      style: undefined,
      animation: undefined,
      direction: "ltr",
      source: { sceneIndex: 1, field: "transliteration" },
    });
    expect(rebuilt.source).toEqual({ sceneIndex: 1, field: "transliteration" });
  });

  it("isLegacyTextPromoted détecte les textes déjà promus", () => {
    const graphics = [clip({ sceneIndex: 0, field: "text" })];
    expect(isLegacyTextPromoted(graphics, 0, "text")).toBe(true);
    expect(isLegacyTextPromoted(graphics, 0, "arabic")).toBe(false);
    expect(isLegacyTextPromoted(graphics, 1, "text")).toBe(false);
  });

  it("promotedLegacyKeys produit les clés stables", () => {
    const keys = promotedLegacyKeys([clip({ sceneIndex: 2, field: "subtext" })]);
    expect(keys.has("2:subtext")).toBe(true);
    expect(keys.has(legacyTextKey(2, "subtext"))).toBe(true);
    expect(keys.has("2:arabic")).toBe(false);
  });
});
