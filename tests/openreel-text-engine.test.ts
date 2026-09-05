// Hikma — Tests du moteur TEXTE porté de OpenReel (MIT) :
//   lib/content-studio/graphics/text-types.ts
//   lib/content-studio/graphics/text-animation-presets.ts
//   lib/content-studio/graphics/text-animation.ts
//   lib/content-studio/graphics/animation-engine.ts
// Comportements purs et déterministes (frames), calqués sur les tests OpenReel
// (text-animation-presets.test.ts, title-engine.defaults.test.ts).

import { describe, it, expect } from "vitest";
import {
  DEFAULT_TEXT_STYLE,
  DEFAULT_TEXT_TRANSFORM,
  type TextAnimationParams,
  type TextClip,
  type TextTransform,
} from "../lib/content-studio/graphics/text-types";
import { TextAnimationEngine } from "../lib/content-studio/graphics/text-animation";
import { TEXT_ANIMATION_PRESETS } from "../lib/content-studio/graphics/text-animation-presets";

const engine = new TextAnimationEngine();

function clip(partial: Partial<TextClip> = {}): TextClip {
  return {
    id: "c1",
    trackId: "t1",
    startTime: 0,
    duration: 120, // frames
    text: "يَوْمَ",
    style: { ...DEFAULT_TEXT_STYLE },
    transform: { ...DEFAULT_TEXT_TRANSFORM, position: { x: 0.5, y: 0.5 } },
    keyframes: [],
    ...partial,
  };
}

describe("text engine (port OpenReel) — defaults & presets", () => {
  it("DEFAULT_TEXT_STYLE couvre la typographie OpenReel", () => {
    // Police réelle du Design System Hikma (next/font + Remotion) — jamais de
    // police non chargée par défaut (l'UI n'expose que Poppins/Amiri/Geist
    // Mono/system-ui).
    expect(DEFAULT_TEXT_STYLE.fontFamily).toBe("Poppins");
    expect(DEFAULT_TEXT_STYLE.fontSize).toBe(48);
    expect(DEFAULT_TEXT_STYLE.color).toBe("#ffffff");
    expect(DEFAULT_TEXT_STYLE.textAlign).toBe("center");
    expect(DEFAULT_TEXT_STYLE.lineHeight).toBe(1.2);
  });

  it("DEFAULT_TEXT_TRANSFORM : position normalisée 0..1", () => {
    expect(DEFAULT_TEXT_TRANSFORM.position).toEqual({ x: 0.5, y: 0.5 });
    expect(DEFAULT_TEXT_TRANSFORM.scale).toEqual({ x: 1, y: 1 });
    expect(DEFAULT_TEXT_TRANSFORM.opacity).toBe(1);
  });

  it("24 presets d'animation disponibles (typewriter, fade, slide, pop…) ", () => {
    const presets = engine.getAvailablePresets();
    for (const expected of [
      "none",
      "typewriter",
      "fade",
      "slide-left",
      "slide-right",
      "slide-up",
      "slide-down",
      "scale",
      "blur",
      "bounce",
      "rotate",
      "wave",
      "shake",
      "pop",
      "glitch",
      "split",
      "flip",
      "word-by-word",
      "rainbow",
      "rise",
      "drop",
      "elastic",
      "swing",
      "zoom-blur",
      "cascade",
    ]) {
      expect(presets, expected).toContain(expected);
    }
    expect(TEXT_ANIMATION_PRESETS.length).toBeGreaterThanOrEqual(24);
  });

  it("createAnimationPreset : defaults + params fusionnés", () => {
    const fade = engine.createAnimationPreset("fade", 30, 30);
    expect(fade.preset).toBe("fade");
    expect(fade.inDuration).toBe(30);
    expect(fade.outDuration).toBe(30);
    expect(fade.params.fadeOpacity).toEqual({ start: 0, end: 1 });

    const slide = engine.createAnimationPreset("slide-up", 30, 30, { slideDistance: 0.4 });
    expect(slide.params.slideDistance).toBe(0.4);
  });
});

describe("text engine — animation déterministe (frames)", () => {
  it("aucune animation → état identité (visibleText complet)", () => {
    const c = clip();
    const state = engine.getAnimatedState(c, 60);
    expect(state.visibleText).toBe("يَوْمَ");
    expect(state.opacity).toBe(1);
    expect(state.transform.position).toEqual({ x: 0.5, y: 0.5 });
  });

  it("fade : 0 → 1 (ease-out) puis sortie", () => {
    const c = clip({
      duration: 120,
      animation: engine.createAnimationPreset("fade", 30, 30),
    });
    expect(engine.getAnimatedState(c, 0).opacity).toBeCloseTo(0, 9);
    const mid = engine.getAnimatedState(c, 15).opacity as number;
    // ease-out : accélération au début → > 0.5 à mi-course
    expect(mid).toBeGreaterThan(0.5);
    expect(mid).toBeLessThan(1);
    expect(engine.getAnimatedState(c, 30).opacity).toBeCloseTo(1, 9);
    // sortie : après holdEnd (90), l'opacité diminue
    expect(engine.getAnimatedState(c, 105).opacity).toBeLessThan(1);
    expect(engine.getAnimatedState(c, 120).opacity).toBeCloseTo(0, 9);
  });

  it("typewriter : texte révélé progressivement, complet à la fin", () => {
    const text = "يَوْمَ";
    const c = clip({
      duration: 120,
      text,
      animation: engine.createAnimationPreset("typewriter", 60, 0),
    });
    expect(engine.getAnimatedState(c, 0).visibleText).toBe("");
    const half = engine.getAnimatedState(c, 30).visibleText as string;
    expect(half.length).toBe(Math.floor(0.5 * text.length));
    expect(engine.getAnimatedState(c, 60).visibleText).toBe(text);
  });

  it("slide-up : offset normalisé puis retour à la position", () => {
    const c = clip({
      duration: 120,
      animation: engine.createAnimationPreset("slide-up", 30, 0),
    });
    const start = engine.getAnimatedState(c, 0).transform as TextTransform;
    expect(start.position.y).toBeLessThan(0.5); // décalé vers le haut (normalisé)
    const end = engine.getAnimatedState(c, 30).transform as TextTransform;
    expect(end.position.y).toBeCloseTo(0.5, 9);
  });

  it("scale : scaleFrom 0 → scaleTo 1", () => {
    const c = clip({
      duration: 120,
      animation: engine.createAnimationPreset("scale", 30, 0),
    });
    expect((engine.getAnimatedState(c, 0).transform as TextTransform).scale.x).toBeCloseTo(0, 9);
    expect((engine.getAnimatedState(c, 30).transform as TextTransform).scale.x).toBeCloseTo(1, 9);
  });

  it("keyframes : contrôlent opacity/position/scale/rotation (clamp + interpolation)", () => {
    const c = clip({
      duration: 120,
      keyframes: [
        { id: "k1", time: 0, property: "opacity", value: 0, easing: "linear" },
        { id: "k2", time: 60, property: "opacity", value: 1, easing: "linear" },
        { id: "k3", time: 0, property: "position.x", value: 0, easing: "linear" },
        { id: "k4", time: 60, property: "position.x", value: 1, easing: "linear" },
        { id: "k5", time: 0, property: "scale.x", value: 0.5, easing: "linear" },
        { id: "k6", time: 60, property: "scale.x", value: 2, easing: "linear" },
        { id: "k7", time: 0, property: "rotation", value: 0, easing: "linear" },
        { id: "k8", time: 60, property: "rotation", value: 180, easing: "linear" },
      ],
    });
    const mid = engine.getAnimatedState(c, 30);
    const t = mid.transform as TextTransform;
    expect(mid.opacity).toBeCloseTo(0.5, 9);
    expect(t.position.x).toBeCloseTo(0.5, 9);
    expect(t.scale.x).toBeCloseTo(1.25, 9);
    expect(t.rotation).toBeCloseTo(90, 9);
    // clamp avant/après
    expect(engine.getAnimatedState(c, 0).opacity).toBeCloseTo(0, 9);
    expect(engine.getAnimatedState(c, 120).opacity).toBeCloseTo(1, 9);
    expect(engine.getAnimatedState(c, 120).transform.position.x).toBeCloseTo(1, 9);
  });

  it("keyframes avec easing ease-in-out : milieu ≠ linéaire", () => {
    const c = clip({
      duration: 120,
      keyframes: [
        { id: "k1", time: 0, property: "opacity", value: 0, easing: "ease-in-out" },
        { id: "k2", time: 60, property: "opacity", value: 1, easing: "ease-in-out" },
      ],
    });
    // ease-in-out : lent au début → valeur < 0.5 à mi-course
    expect(engine.getAnimatedState(c, 15).opacity as number).toBeLessThan(0.25);
  });

  it("déterminisme : même entrée → état identique (deep equal)", () => {
    const c = clip({
      duration: 120,
      animation: engine.createAnimationPreset("bounce", 30, 30),
    });
    const a = engine.getAnimatedState(c, 57);
    const b = engine.getAnimatedState(c, 57);
    expect(a).toEqual(b);
  });

  it("aucune mutation du clip (entrée read-only)", () => {
    const c = clip({
      duration: 120,
      animation: engine.createAnimationPreset("fade", 30, 30),
    });
    const snapshot = JSON.stringify(c);
    engine.getAnimatedState(c, 0);
    engine.getAnimatedState(c, 60);
    engine.getAnimatedState(c, 120);
    expect(JSON.stringify(c)).toBe(snapshot);
  });

  it("arabe/RTL : le moteur traite le texte arabe sans l'altérer", () => {
    const arabic = "يُخَادِعُونَ اللَّهَ";
    const c = clip({
      duration: 120,
      text: arabic,
      animation: engine.createAnimationPreset("typewriter", 60, 0),
    });
    // révélation caractère par caractère sans casser les ligatures/espaces
    expect(engine.getAnimatedState(c, 0).visibleText).toBe("");
    const half = engine.getAnimatedState(c, 30).visibleText as string;
    expect(arabic.startsWith(half)).toBe(true);
    expect(engine.getAnimatedState(c, 60).visibleText).toBe(arabic);
    // aucun remplacement/transformation du texte source
    const fade = clip({
      duration: 120,
      text: arabic,
      animation: engine.createAnimationPreset("fade", 30, 30),
    });
    expect(engine.getAnimatedState(fade, 30).visibleText).toBe(arabic);
    // le style par défaut reste neutre (pas de direction imposée)
    expect(c.style.textAlign).toBe("center");
  });

  it("params personnalisés respectés (fadeOpacity, slideDistance)", () => {
    const fade = clip({
      duration: 120,
      animation: engine.createAnimationPreset("fade", 30, 0, {
        fadeOpacity: { start: 0.2, end: 0.8 },
      }),
    });
    const params = fade.animation?.params as TextAnimationParams;
    expect(params.fadeOpacity).toEqual({ start: 0.2, end: 0.8 });
    expect(engine.getAnimatedState(fade, 0).opacity).toBeCloseTo(0.2, 9);
    expect(engine.getAnimatedState(fade, 30).opacity).toBeCloseTo(0.8, 9);

    const slide = clip({
      duration: 120,
      animation: engine.createAnimationPreset("slide-left", 30, 0, { slideDistance: 0.5 }),
    });
    const t0 = engine.getAnimatedState(slide, 0).transform as TextTransform;
    expect(t0.position.x).toBeCloseTo(0, 9); // 0.5 - 0.5
  });
});
