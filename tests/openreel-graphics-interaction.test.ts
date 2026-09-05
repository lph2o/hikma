// Hikma — Tests des helpers purs d'interaction graphique :
//   lib/content-studio/graphics/interaction.ts
// Le drag canvas (delta pixels → coordonnées normalisées), les clamps
// taille-aware et le resize sont PURE et déterministes (PREVIEW == RENDER :
// l'éditeur ne persiste que des valeurs normalisées, jamais de pixels).

import { describe, it, expect } from "vitest";
import {
  applyDragDelta,
  applyResizeThickness,
  clampPosition,
  pxDeltaToNormalized,
  resizeThicknessFactor,
  sizeFromWidthHeight,
} from "../lib/content-studio/graphics/interaction";

describe("pxDeltaToNormalized — conversion pixels → normalisé (responsive)", () => {
  it("delta proportionnel à la taille réelle du conteneur", () => {
    // Canvas 1080×1920 affiché dans un conteneur 270×480 (9:16) :
    // 27 px de drag horizontal = 108 px canvas = 0.1 normalisé.
    const { dx, dy } = pxDeltaToNormalized(27, 48, 1080, 1920, 270, 480);
    expect(dx).toBeCloseTo(108, 9);
    expect(dy).toBeCloseTo(192, 9);
  });

  it("le même delta px donne le même résultat à toute taille d'écran", () => {
    // Conteneurs de tailles différentes mais ratios identiques : un delta de
    // 5 % de la largeur doit produire le même delta normalisé.
    const small = pxDeltaToNormalized(10, 20, 1080, 1920, 200, 400); // 5 % × 5 %
    const big = pxDeltaToNormalized(50, 100, 1080, 1920, 1000, 2000); // 5 % × 5 %
    expect(small.dx).toBeCloseTo(big.dx, 9);
    expect(small.dy).toBeCloseTo(big.dy, 9);
    expect(small.dx).toBeCloseTo(54, 9); // 10/200 × 1080
    expect(small.dy).toBeCloseTo(96, 9); // 20/400 × 1920
  });

  it("conteneur de taille 0 → fallback canvas (jamais NaN)", () => {
    const r = pxDeltaToNormalized(10, 10, 1080, 1920, 0, 0);
    expect(Number.isFinite(r.dx)).toBe(true);
    expect(Number.isFinite(r.dy)).toBe(true);
  });
});

describe("clampPosition — clamp taille-aware", () => {
  it("élément de 20 % : le centre peut atteindre les bords (x ∈ [-0.1, 1.1])", () => {
    expect(clampPosition(1.1, 0.2)).toBe(1.1);
    expect(clampPosition(-0.1, 0.2)).toBe(-0.1);
    expect(clampPosition(2, 0.2)).toBe(1.1);
    expect(clampPosition(-2, 0.2)).toBe(-0.1);
  });

  it("élément ≥ 100 % : verrouillé dans [0, 1]", () => {
    expect(clampPosition(1.5, 1.2)).toBe(1);
    expect(clampPosition(-0.5, 1)).toBe(0);
  });

  it("NaN/Infinity → position par défaut (jamais de position invalide)", () => {
    expect(clampPosition(Number.NaN, 0.2)).toBe(0.5);
    expect(clampPosition(Number.POSITIVE_INFINITY, 0.2)).toBe(0.5);
    expect(clampPosition(Number.NEGATIVE_INFINITY, 0.2)).toBe(0.5);
  });
});

describe("applyDragDelta — start + delta = position attendue", () => {
  const OPTS = {
    canvasW: 1080,
    canvasH: 1920,
    containerW: 270,
    containerH: 480,
    clipW: 0.2,
    clipH: 0.2,
  };

  it("delta horizontal pur : x bouge, y inchangé", () => {
    // 27 px écran → +0.1 normalisé
    const r = applyDragDelta({ x: 0.5, y: 0.5 }, 27, 0, OPTS);
    expect(r.x).toBeCloseTo(0.6, 9);
    expect(r.y).toBeCloseTo(0.5, 9);
  });

  it("delta vertical pur : y bouge, x inchangé", () => {
    const r = applyDragDelta({ x: 0.5, y: 0.5 }, 0, 48, OPTS);
    expect(r.x).toBeCloseTo(0.5, 9);
    expect(r.y).toBeCloseTo(0.6, 9);
  });

  it("le delta est calculé depuis la position de DÉPART (jamais l'état courant)", () => {
    // Deux appels successifs avec le même start → mêmes résultats cumulés
    const step1 = applyDragDelta({ x: 0.5, y: 0.5 }, 27, 0, OPTS);
    const step2 = applyDragDelta({ x: 0.5, y: 0.5 }, 54, 0, OPTS);
    expect(step1.x).toBeCloseTo(0.6, 9);
    expect(step2.x).toBeCloseTo(0.7, 9); // 2× le delta
  });

  it("clamp taille-aware : le bord de l'élément ne sort jamais du canvas", () => {
    // Largeur 20 % → centre max 1.1 ; un très grand delta est borné
    const r = applyDragDelta({ x: 0.5, y: 0.5 }, 10000, 0, OPTS);
    expect(r.x).toBeCloseTo(1.1, 9);
    expect(r.y).toBeCloseTo(0.5, 9);
  });

  it("non-mutation : l'entrée n'est jamais modifiée", () => {
    const base = { x: 0.4, y: 0.6 };
    const before = JSON.stringify(base);
    applyDragDelta(base, 27, 48, OPTS);
    expect(JSON.stringify(base)).toBe(before);
  });

  it("déterminisme : même entrée → même résultat", () => {
    const a = applyDragDelta({ x: 0.3, y: 0.7 }, 13.5, -24, OPTS);
    const b = applyDragDelta({ x: 0.3, y: 0.7 }, 13.5, -24, OPTS);
    expect(a).toEqual(b);
  });
});

describe("resize — épaisseur des formes", () => {
  it("resizeThicknessFactor : delta positif → agrandit, négatif → réduit", () => {
    expect(resizeThicknessFactor(0.4, 27, 270)).toBeGreaterThan(1);
    expect(resizeThicknessFactor(0.4, -27, 270)).toBeLessThan(1);
    expect(resizeThicknessFactor(0.4, 0, 270)).toBe(1);
  });

  it("applyResizeThickness : bornes du modèle respectées (0.05..0.9)", () => {
    expect(applyResizeThickness(0.4, 3)).toBe(0.9);
    expect(applyResizeThickness(0.05, 0.3)).toBe(0.05);
    expect(applyResizeThickness(0.4, 1)).toBeCloseTo(0.4, 9);
  });

  it("resize d'un cercle → largeur === hauteur (aspect verrouillé)", () => {
    const before = sizeFromWidthHeight("circle", 0.2, 0.9); // hauteur ignorée
    const after = sizeFromWidthHeight("circle", 0.5, 0.9); // resize
    expect(before).toEqual({ thickness: 0.2, aspect: 1 });
    expect(after).toEqual({ thickness: 0.5, aspect: 1 });
  });

  it("ellipse : hauteur libre → aspect = h/w", () => {
    expect(sizeFromWidthHeight("ellipse", 0.2, 0.4)).toEqual({ thickness: 0.2, aspect: 2 });
    expect(sizeFromWidthHeight("ellipse", 0.4, 0.2)).toEqual({ thickness: 0.4, aspect: 0.5 });
  });

  it("largeur invalide → null (pas de taille corrompue)", () => {
    expect(sizeFromWidthHeight("circle", 0, 0.5)).toBeNull();
    expect(sizeFromWidthHeight("circle", Number.NaN, 0.5)).toBeNull();
  });
});
