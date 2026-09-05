// Hikma — Tests du modèle GRAPHIC CLIP (couche d'intégration Hikma) :
//   lib/content-studio/graphics/graphic-clip.ts
//   lib/content-studio/graphics/text-graphic.ts
// Fonctions pures et déterministes (frames) ; les moteurs sous-jacents sont les
// ports OpenReel (easing/keyframes/texte).

import { describe, it, expect } from "vitest";
import {
  DEFAULT_GRAPHIC_TRANSFORM,
  GRAPHIC_CLIP_KINDS,
  evaluateGraphicTransform,
  graphicClipEndFrame,
  graphicClipOverlaps,
  sanitizeGraphicClipBase,
  sanitizeGraphicTransform,
  type GraphicClipBase,
} from "../lib/content-studio/graphics/graphic-clip";
import {
  buildTextAnimation,
  createTextGraphicClip,
  defaultTextGraphicClip,
  evaluateTextGraphic,
} from "../lib/content-studio/graphics/text-graphic";
import { TextAnimationEngine } from "../lib/content-studio/graphics/text-animation";

const engine = new TextAnimationEngine();

describe("graphic-clip — modèle & sanitization (Hikma)", () => {
  it("les 6 kinds graphiques sont déclarés", () => {
    expect(GRAPHIC_CLIP_KINDS).toEqual([
      "text",
      "shape",
      "svg",
      "sticker",
      "background",
      "three",
    ]);
  });

  it("sanitizeGraphicTransform : clamps, defaults, jamais NaN/Infinity", () => {
    expect(sanitizeGraphicTransform(undefined)).toEqual(DEFAULT_GRAPHIC_TRANSFORM);
    expect(sanitizeGraphicTransform({ opacity: 5 })).toMatchObject({ opacity: 1 });
    expect(sanitizeGraphicTransform({ opacity: -1 })).toMatchObject({ opacity: 0 });
    expect(sanitizeGraphicTransform({ scaleX: 100 })).toMatchObject({ scaleX: 10 });
    expect(sanitizeGraphicTransform({ x: Number.NaN })).toMatchObject({ x: 0.5 });
    expect(sanitizeGraphicTransform({ y: Number.POSITIVE_INFINITY })).toMatchObject({ y: 0.5 });
    // valeurs légitimes conservées
    expect(sanitizeGraphicTransform({ x: 0.2, y: 0.8, rotation: 45 })).toMatchObject({
      x: 0.2,
      y: 0.8,
      rotation: 45,
    });
  });

  it("sanitizeGraphicClipBase : bornes sûres + id par défaut", () => {
    const base = sanitizeGraphicClipBase({ kind: "text" });
    expect(base.id).toMatch(/^graphic-text/);
    expect(base.startFrame).toBe(0);
    expect(base.durationInFrames).toBe(60);
    expect(base.zIndex).toBe(0);
    // bornes
    expect(sanitizeGraphicClipBase({ kind: "text", startFrame: -5, durationInFrames: 0 }).startFrame).toBe(0);
    expect(sanitizeGraphicClipBase({ kind: "text", startFrame: -5, durationInFrames: 0 }).durationInFrames).toBe(1);
    expect(
      sanitizeGraphicClipBase({ kind: "text", startFrame: 10, durationInFrames: 30, zIndex: 2.9, transform: { opacity: NaN } }),
    ).toMatchObject({ startFrame: 10, durationInFrames: 30, zIndex: 2, transform: { opacity: 1 } });
  });

  it("graphicClipEndFrame / graphicClipOverlaps (frames)", () => {
    const clip: GraphicClipBase = {
      id: "g1",
      kind: "shape",
      startFrame: 10,
      durationInFrames: 30,
      zIndex: 0,
      transform: { ...DEFAULT_GRAPHIC_TRANSFORM },
    };
    expect(graphicClipEndFrame(clip)).toBe(40);
    expect(graphicClipOverlaps(clip, 0, 10)).toBe(false); // touche au bord
    expect(graphicClipOverlaps(clip, 5, 15)).toBe(true);
    expect(graphicClipOverlaps(clip, 40, 50)).toBe(false);
  });
});

describe("evaluateGraphicTransform — keyframes → transform (pur)", () => {
  const clip: GraphicClipBase = {
    id: "g1",
    kind: "text",
    startFrame: 0,
    durationInFrames: 60,
    zIndex: 0,
    transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    keyframes: [
      { id: "k1", time: 0, property: "opacity", value: 0, easing: "linear" },
      { id: "k2", time: 60, property: "opacity", value: 1, easing: "linear" },
      { id: "k3", time: 0, property: "position.x", value: 0, easing: "linear" },
      { id: "k4", time: 60, property: "position.x", value: 1, easing: "linear" },
    ],
  };

  it("sans keyframes → transform de base", () => {
    const t = evaluateGraphicTransform({ ...clip, keyframes: undefined }, 30);
    expect(t).toEqual({ x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 });
  });

  it("keyframes : interpolation frame-exacte + clamp", () => {
    const mid = evaluateGraphicTransform(clip, 30);
    expect(mid.opacity).toBeCloseTo(0.5, 9);
    expect(mid.x).toBeCloseTo(0.5, 9);
    expect(evaluateGraphicTransform(clip, 0).opacity).toBeCloseTo(0, 9);
    expect(evaluateGraphicTransform(clip, 120).opacity).toBeCloseTo(1, 9);
    // propriétés non keyframées → base
    expect(evaluateGraphicTransform(clip, 30).rotation).toBe(0);
    expect(evaluateGraphicTransform(clip, 30).scaleY).toBe(1);
  });

  it("déterminisme : même frame → même transform", () => {
    expect(evaluateGraphicTransform(clip, 42)).toEqual(evaluateGraphicTransform(clip, 42));
  });
});

describe("text-graphic — TextGraphicClip + évaluation (PREVIEW == RENDER)", () => {
  it("createTextGraphicClip : defaults + sanitization", () => {
    const clip = createTextGraphicClip({ text: "يَوْمَ", direction: "rtl" });
    expect(clip.kind).toBe("text");
    expect(clip.text).toBe("يَوْمَ");
    expect(clip.direction).toBe("rtl");
    expect(clip.transform).toEqual(DEFAULT_GRAPHIC_TRANSFORM);
    expect(clip.durationInFrames).toBe(60);
    // direction non rtl → ltr
    expect(createTextGraphicClip({ text: "x", direction: "ltr" }).direction).toBe("ltr");
    expect(createTextGraphicClip({ text: "x" }).direction).toBe("ltr");
  });

  it("buildTextAnimation : params toujours définis (exigence du moteur)", () => {
    const anim = buildTextAnimation("fade", {
      inDurationFrames: 15,
      outDurationFrames: 15,
    });
    expect(anim.preset).toBe("fade");
    expect(anim.params).toBeDefined();
    expect(anim.params.easing).toBe("ease-out");
    expect(anim.inDuration).toBe(15);
    expect(anim.outDuration).toBe(15);
    // params par défaut fusionnés avec les overrides
    const typed = buildTextAnimation("typewriter", {
      params: { easing: "linear" },
    });
    expect(typed.params.easing).toBe("linear");
    // un clip créé avec buildTextAnimation s'évalue sans erreur
    const clip = createTextGraphicClip({
      text: "Salam",
      animation: buildTextAnimation("fade", { inDurationFrames: 10 }),
    });
    expect(evaluateTextGraphic(clip, 0).transform.opacity).toBeCloseTo(0, 9);
    expect(evaluateTextGraphic(clip, 10).transform.opacity).toBeCloseTo(1, 9);
  });

  it("sans animation ni keyframes : texte visible, transform de base", () => {
    const clip = createTextGraphicClip({ text: "Salam", transform: { x: 0.25 } });
    const state = evaluateTextGraphic(clip, 30);
    expect(state.visibleText).toBe("Salam");
    expect(state.transform.x).toBeCloseTo(0.25, 9);
    expect(state.transform.opacity).toBe(1);
    expect(state.style.fontFamily).toBe("Poppins");
  });

  it("animation fade : opacité 0 → 1 (temps local au clip)", () => {
    const clip = createTextGraphicClip({
      text: "Fade",
      startFrame: 20,
      durationInFrames: 90,
      animation: engine.createAnimationPreset("fade", 30, 0),
    });
    // frame absolu 20 = local 0 → opacité 0 ; frame 50 = local 30 → 1
    expect(evaluateTextGraphic(clip, 20).transform.opacity).toBeCloseTo(0, 9);
    expect(evaluateTextGraphic(clip, 50).transform.opacity).toBeCloseTo(1, 9);
    // hors clip (avant) → local clampé à 0 → encore 0
    expect(evaluateTextGraphic(clip, 0).transform.opacity).toBeCloseTo(0, 9);
  });

  it("animation typewriter : révélation progressive en local", () => {
    const clip = createTextGraphicClip({
      text: "abcdef",
      startFrame: 10,
      durationInFrames: 120,
      animation: engine.createAnimationPreset("typewriter", 60, 0),
    });
    expect(evaluateTextGraphic(clip, 10).visibleText).toBe("");
    const mid = evaluateTextGraphic(clip, 40).visibleText as string; // local 30
    expect(mid.length).toBe(3);
    expect(evaluateTextGraphic(clip, 70).visibleText).toBe("abcdef"); // local 60
  });

  it("keyframes contrôlent le transform (sémantique keyframes-first)", () => {
    const clip = createTextGraphicClip({
      text: "K",
      startFrame: 0,
      durationInFrames: 60,
      animation: engine.createAnimationPreset("fade", 30, 0), // ignoré si keyframes
      keyframes: [
        { id: "a", time: 0, property: "opacity", value: 0, easing: "linear" },
        { id: "b", time: 60, property: "opacity", value: 1, easing: "linear" },
      ],
    });
    expect(evaluateTextGraphic(clip, 0).transform.opacity).toBeCloseTo(0, 9);
    expect(evaluateTextGraphic(clip, 30).transform.opacity).toBeCloseTo(0.5, 9);
    expect(evaluateTextGraphic(clip, 60).transform.opacity).toBeCloseTo(1, 9);
  });

  it("déterminisme + non-mutation", () => {
    const clip = createTextGraphicClip({
      text: "يَوْمَ",
      animation: engine.createAnimationPreset("bounce", 30, 30),
      keyframes: [
        { id: "a", time: 0, property: "scale.x", value: 0.8, easing: "easeOutCubic" },
        { id: "b", time: 60, property: "scale.x", value: 1.2, easing: "easeOutCubic" },
      ],
    });
    const snapshot = JSON.stringify(clip);
    const a = evaluateTextGraphic(clip, 47);
    const b = evaluateTextGraphic(clip, 47);
    expect(a).toEqual(b);
    expect(JSON.stringify(clip)).toBe(snapshot);
  });

  it("defaultTextGraphicClip : point de départ sain", () => {
    const d = defaultTextGraphicClip();
    expect(d.kind).toBe("text");
    expect(d.zIndex).toBe(1);
    expect(d.durationInFrames).toBe(90);
    expect(evaluateTextGraphic(d, 45).visibleText).toBe("Texte");
  });
});
