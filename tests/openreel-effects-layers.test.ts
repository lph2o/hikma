// Hikma — Tests des COUCHES D'EFFETS (glow / shadow) en remplissages plats.
//
// Ces couches remplacent les CSS drop-shadow/text-shadow (atténués par le
// Chromium headless du rendu) par des copies géométriques pures — rendues
// bit-identiques par le navigateur (Preview) et le rendu Remotion (MP4).
//
// Couvert : déterminisme, bornes, non-mutation, cercle/forme.

import { describe, expect, it } from "vitest";
import {
  hexAlpha,
  shapeGlowLayers,
  shapeShadowLayers,
  textGlowLayers,
  textShadowLayers,
} from "../lib/content-studio/graphics/effects-layers";

describe("shapeGlowLayers", () => {
  it("produit des échelles croissantes de 1 à 1 + radius/(size/2)", () => {
    const layers = shapeGlowLayers({ radiusPx: 24, sizePx: 151, opacity: 0.9 });
    expect(layers.length).toBeGreaterThanOrEqual(4);
    expect(layers[0]!.scale).toBe(1);
    // 1 unité = 75.5 px → radius 24 = 0.318 unité
    expect(layers.at(-1)!.scale).toBeCloseTo(1 + 24 / 75.5, 2);
  });

  it("opacités décroissantes bornées 0..1, dernière couche fondue", () => {
    const layers = shapeGlowLayers({ radiusPx: 30, sizePx: 100, opacity: 0.8 });
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i]!.opacity).toBeLessThanOrEqual(layers[i - 1]!.opacity);
    }
    for (const l of layers) {
      expect(l.opacity).toBeGreaterThanOrEqual(0);
      expect(l.opacity).toBeLessThanOrEqual(1);
    }
    expect(layers.at(-1)!.opacity).toBe(0); // bord fondu
  });

  it("est déterministe et ne mute pas l'entrée", () => {
    const input = { radiusPx: 18, sizePx: 36, opacity: 0.9, layers: 8 };
    const a = shapeGlowLayers(input);
    const b = shapeGlowLayers(input);
    expect(a).toEqual(b);
    expect(input).toEqual({ radiusPx: 18, sizePx: 36, opacity: 0.9, layers: 8 });
  });

  it("radius nul → aucune extension (échelle 1 partout)", () => {
    const layers = shapeGlowLayers({ radiusPx: 0, sizePx: 151, opacity: 0.9 });
    expect(layers.every((l) => l.scale === 1)).toBe(true);
  });
});

describe("shapeShadowLayers", () => {
  it("décalages le long de la direction + opacité décroissante", () => {
    const layers = shapeShadowLayers({
      offsetX: 3,
      offsetY: 5,
      blurPx: 6,
      sizePx: 151,
      opacity: 0.5,
    });
    expect(layers.length).toBeGreaterThanOrEqual(2);
    // La direction est conservée : dx/dy de même signe que l'offset
    for (const l of layers) {
      expect(Math.sign(l.dx)).toBe(Math.sign(3));
      expect(Math.sign(l.dy)).toBe(Math.sign(5));
    }
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i]!.opacity).toBeLessThanOrEqual(layers[i - 1]!.opacity);
    }
  });

  it("opacités bornées 0..1 et déterminisme", () => {
    const input = { offsetX: -4, offsetY: 2, blurPx: 10, sizePx: 200, opacity: 0.9, layers: 5 };
    const a = shapeShadowLayers(input);
    const b = shapeShadowLayers(input);
    expect(a).toEqual(b);
    for (const l of a) {
      expect(l.opacity).toBeGreaterThanOrEqual(0);
      expect(l.opacity).toBeLessThanOrEqual(1);
    }
  });
});

describe("textGlowLayers", () => {
  it("largeurs de stroke croissantes, opacités décroissantes", () => {
    const layers = textGlowLayers({ radiusPx: 22, opacity: 0.85 });
    expect(layers.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i]!.strokeWidthPx).toBeGreaterThan(layers[i - 1]!.strokeWidthPx);
      expect(layers[i]!.opacity).toBeLessThanOrEqual(layers[i - 1]!.opacity);
    }
    for (const l of layers) {
      expect(l.strokeWidthPx).toBeGreaterThan(0);
      expect(l.opacity).toBeGreaterThanOrEqual(0);
      expect(l.opacity).toBeLessThanOrEqual(1);
    }
  });

  it("radius nul → stroke minimal, opacités bornées", () => {
    const layers = textGlowLayers({ radiusPx: 0, opacity: 0.9 });
    expect(layers[0]!.strokeWidthPx).toBe(0.5);
  });
});

describe("textShadowLayers", () => {
  it("décalages alignés sur l'offset, opacité décroissante", () => {
    const layers = textShadowLayers({ offsetX: 3, offsetY: 5, blurPx: 10, opacity: 1 });
    for (const l of layers) {
      expect(Math.sign(l.dx)).toBe(Math.sign(3));
      expect(Math.sign(l.dy)).toBe(Math.sign(5));
    }
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i]!.opacity).toBeLessThanOrEqual(layers[i - 1]!.opacity);
    }
  });

  it("offset nul → copies empilées (pas d'explosion du décalage)", () => {
    const layers = textShadowLayers({ offsetX: 0, offsetY: 0, blurPx: 20, opacity: 0.8 });
    expect(layers.every((l) => l.dx === 0 && l.dy === 0)).toBe(true);
    expect(layers.every((l) => l.opacity >= 0 && l.opacity <= 1)).toBe(true);
  });
});

describe("hexAlpha", () => {
  it("parse #RRGGBBAA, #RGBA et défaut 1", () => {
    expect(hexAlpha("#00000080")).toBeCloseTo(0x80 / 255, 3);
    expect(hexAlpha("#000000")).toBe(1);
    expect(hexAlpha("#0000")).toBe(0);
    expect(hexAlpha("garbage")).toBe(1);
  });
});
