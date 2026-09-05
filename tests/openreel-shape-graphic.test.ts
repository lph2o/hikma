// Hikma — Tests du modèle ShapeGraphicClip (formes graphiques) :
//   lib/content-studio/graphics/shape-graphic.ts
//   + intégration editor_state (sanitizeEditorGraphics / hashEffectiveGraphics)
// Géométrie PURE et déterministe (positions normalisées, frames Hikma).
// Concepts des types OpenReel shape-tools.ts / motion-shape-style.ts (MIT).

import { describe, it, expect } from "vitest";
import {
  SHAPE_GRAPHIC_KINDS,
  createShapeGraphicClip,
  defaultShapeGraphicClip,
  evaluateShapeGeometry,
  sanitizeShapeClip,
  shapeFillColors,
  shapeRadius,
  type ShapeGraphicClip,
} from "../lib/content-studio/graphics/shape-graphic";
import {
  getEffectiveGraphics,
  hashEffectiveGraphics,
  sanitizeEditorGraphics,
} from "../lib/content-studio/editor/state";

describe("shape-graphic — modèle & sanitization", () => {
  it("les 7 kinds de formes sont déclarés (cercle inclus)", () => {
    expect(SHAPE_GRAPHIC_KINDS).toEqual([
      "rectangle",
      "ellipse",
      "circle",
      "polygon",
      "star",
      "line",
      "arrow",
    ]);
  });

  it("createShapeGraphicClip : defaults + bornes sûres", () => {
    const clip = createShapeGraphicClip({ shape: "star" });
    expect(clip.kind).toBe("shape");
    expect(clip.shape).toBe("star");
    expect(clip.sides).toBe(5);
    expect(clip.fill).toEqual({ type: "solid", color: "#14b8a6" });
    expect(clip.stroke).toBeUndefined();
    expect(Number.isFinite(clip.thickness)).toBe(true);

    // kind inconnu → rectangle (défaut)
    expect(createShapeGraphicClip({ shape: "banane" as never }).shape).toBe("rectangle");
    // sides clampés
    expect(createShapeGraphicClip({ shape: "polygon", sides: 2 }).sides).toBe(3);
    expect(createShapeGraphicClip({ shape: "polygon", sides: 99 }).sides).toBe(32);
  });

  it("stroke sanitisé (couleur hex valide + largeur bornée)", () => {
    const clip = createShapeGraphicClip({
      shape: "rectangle",
      stroke: { color: "#ffcc00", width: 8 },
    });
    expect(clip.stroke).toEqual({ color: "#ffcc00", width: 8 });
    // width invalide → pas de contour
    expect(
      createShapeGraphicClip({ shape: "rectangle", stroke: { color: "#ffcc00", width: 0 } }).stroke,
    ).toBeUndefined();
    expect(
      createShapeGraphicClip({
        shape: "rectangle",
        stroke: { color: "not-a-color", width: 4 },
      }).stroke,
    ).toBeUndefined();
  });

  it("fill gradient : couleurs filtrées (hex uniquement) + angle borné", () => {
    const clip = createShapeGraphicClip({
      shape: "rectangle",
      fill: {
        type: "linear",
        colors: ["#14b8a6", "javascript:alert(1)", "#0f766e"],
        angle: 540,
      },
    });
    expect(clip.fill.type).toBe("linear");
    if (clip.fill.type === "linear") {
      expect(clip.fill.colors).toHaveLength(2);
      expect(clip.fill.angle).toBe(360); // clamp borné ±360 (pas de wrap)
    }
    // < 2 couleurs valides → fallback solid
    const fallback = createShapeGraphicClip({
      shape: "rectangle",
      fill: { type: "linear", colors: ["#14b8a6"], angle: 45 },
    });
    expect(fallback.fill).toEqual({ type: "solid", color: "#14b8a6" });
  });

  it("defaultShapeGraphicClip : point de départ sain et déterministe", () => {
    const d = defaultShapeGraphicClip();
    expect(d.kind).toBe("shape");
    expect(d.shape).toBe("rectangle");
    expect(d.zIndex).toBe(2);
    expect(d.id).toBe("shape-1");
    expect(JSON.stringify(defaultShapeGraphicClip())).toBe(JSON.stringify(d));
  });

  it("aspect : défauts par forme (cercle verrouillé à 1)", () => {
    // Cercle : ratio TOUJOURS 1 (cercle parfait) même si un aspect est fourni
    expect(createShapeGraphicClip({ shape: "circle", aspect: 2 }).aspect).toBe(1);
    expect(createShapeGraphicClip({ shape: "circle" }).aspect).toBe(1);
    // Ellipse : ovale par défaut, aspect libre borné
    expect(createShapeGraphicClip({ shape: "ellipse" }).aspect).toBeCloseTo(0.62, 9);
    expect(createShapeGraphicClip({ shape: "ellipse", aspect: 5 }).aspect).toBe(2); // clamp
    expect(createShapeGraphicClip({ shape: "ellipse", aspect: 0.01 }).aspect).toBe(0.05);
    // Formes équilatérales par défaut
    expect(createShapeGraphicClip({ shape: "star" }).aspect).toBe(1);
    expect(createShapeGraphicClip({ shape: "rectangle" }).aspect).toBe(1);
  });
});

describe("evaluateShapeGeometry — géométrie SVG pure", () => {
  it("rectangle : attributs centrés (viewBox -1..1) + arrondi borné", () => {
    const clip = createShapeGraphicClip({
      shape: "rectangle",
      thickness: 0.4,
      roundness: 0.5,
    });
    const g = evaluateShapeGeometry(clip);
    expect(g.element).toBe("rect");
    expect(Number(g.attrs.rx)).toBeGreaterThan(0);
    expect(Number(g.attrs.width)).toBeCloseTo(Number(g.attrs.height), 9);
    // La forme occupe TOUTE la boîte (2×2) — la taille est portée par le container
    expect(Number(g.attrs.width)).toBeCloseTo(2, 9);
    expect(Number(g.attrs.x)).toBe(-1);
  });

  it("circle : géométrie PARFAITEMENT ronde (r unique, rx === ry)", () => {
    const clip = createShapeGraphicClip({ shape: "circle", thickness: 0.3 });
    const g = evaluateShapeGeometry(clip);
    expect(g.element).toBe("circle");
    expect(g.attrs.r).toBe("1");
    // Même après resize (thickness change) : le ratio reste 1
    const resized = createShapeGraphicClip({ shape: "circle", thickness: 0.6 });
    expect(evaluateShapeGeometry(resized).attrs.r).toBe("1");
  });

  it("ellipse : ovale (ry = aspect), libre", () => {
    const clip = createShapeGraphicClip({ shape: "ellipse", thickness: 0.3, aspect: 0.8 });
    const g = evaluateShapeGeometry(clip);
    expect(g.element).toBe("ellipse");
    expect(Number(g.attrs.rx)).toBe(1);
    expect(Number(g.attrs.ry)).toBeCloseTo(0.8, 9);
  });

  it("star : points pairs (2×points) dans une chaîne valide", () => {
    const clip = createShapeGraphicClip({ shape: "star", sides: 5, thickness: 0.4 });
    const g = evaluateShapeGeometry(clip);
    expect(g.element).toBe("polygon");
    const pts = g.attrs.points.split(" ").filter(Boolean);
    expect(pts).toHaveLength(10);
    expect(g.attrs.points).toMatch(/^-?[\d.]+,-?[\d.]+/);
  });

  it("polygon : sides points", () => {
    const clip = createShapeGraphicClip({ shape: "polygon", sides: 6, thickness: 0.3 });
    const g = evaluateShapeGeometry(clip);
    expect(g.element).toBe("polygon");
    expect(g.attrs.points.split(" ").filter(Boolean)).toHaveLength(6);
  });

  it("line et arrow : éléments corrects", () => {
    expect(evaluateShapeGeometry(createShapeGraphicClip({ shape: "line" })).element).toBe("line");
    expect(evaluateShapeGeometry(createShapeGraphicClip({ shape: "arrow" })).element).toBe("polygon");
  });

  it("taille réelle = thickness × largeur du canvas (container SVG carré)", () => {
    // Le container fait thickness × canvasW en px sur les DEUX axes ⇒ une
    // forme d'aspect 1 (cercle/carré/étoile) est exactement thickness de la
    // largeur, sans distorsion — quelle que soit la hauteur du canvas.
    const clip = createShapeGraphicClip({ shape: "circle", thickness: 0.3 });
    const g = evaluateShapeGeometry(clip);
    // Rendu : svg 0.3 × 1080 = 324 px ; le cercle remplit le viewBox → 324 px.
    expect(g.attrs.r).toBe("1");
    expect(clip.thickness).toBe(0.3);
  });

  it("déterminisme : même clip → même géométrie", () => {
    const clip = createShapeGraphicClip({ shape: "star", sides: 8 });
    expect(evaluateShapeGeometry(clip)).toEqual(evaluateShapeGeometry(clip));
  });

  it("shapeRadius : borné entre 0.05 et 0.45", () => {
    expect(shapeRadius(0.01)).toBe(0.05);
    expect(shapeRadius(10)).toBe(0.45);
    expect(shapeRadius(0.4)).toBeCloseTo(0.2, 9);
  });

  it("shapeFillColors : solid vs gradient", () => {
    const solid = createShapeGraphicClip({ shape: "rectangle", fill: { type: "solid", color: "#123456" } });
    expect(shapeFillColors(solid)).toEqual({ from: "#123456", to: null, angle: null });
    const grad = createShapeGraphicClip({
      shape: "rectangle",
      fill: { type: "linear", colors: ["#111111", "#222222"], angle: 45 },
    });
    expect(shapeFillColors(grad).from).toBe("#111111");
    expect(shapeFillColors(grad).to).toBe("#222222");
  });
});

describe("sanitizeShapeClip + intégration editor_state", () => {
  const clip: ShapeGraphicClip = createShapeGraphicClip({
    id: "s1",
    shape: "star",
    sides: 7,
    thickness: 0.3,
    fill: { type: "solid", color: "#c9a84c" },
    stroke: { color: "#ffffff", width: 3 },
    transform: { x: 0.3, y: 0.7 },
  });

  it("sanitizeShapeClip : perte nulle (roundtrip)", () => {
    const sanitized = sanitizeShapeClip(clip as unknown as Record<string, unknown>);
    expect(sanitized).toEqual(clip);
    // aspect inclus dans le roundtrip
    const withAspect = createShapeGraphicClip({ shape: "ellipse", aspect: 0.75 });
    expect(sanitizeShapeClip(withAspect as unknown as Record<string, unknown>)).toEqual(
      withAspect,
    );
  });

  it("sanitizeEditorGraphics préserve les formes (payload détaillé)", () => {
    const { graphics, reason } = sanitizeEditorGraphics([clip]);
    expect(reason).toBeUndefined();
    expect(graphics).toHaveLength(1);
    const out = graphics![0] as ShapeGraphicClip;
    expect(out.shape).toBe("star");
    expect(out.sides).toBe(7);
    expect(out.fill).toEqual({ type: "solid", color: "#c9a84c" });
    expect(out.stroke).toEqual({ color: "#ffffff", width: 3 });
    expect(out.thickness).toBeCloseTo(0.3, 9);
  });

  it("clips corrompus → clamps sûrs, jamais NaN/Infinity", () => {
    const { graphics } = sanitizeEditorGraphics([
      {
        kind: "shape",
        shape: "rectangle",
        thickness: Number.NaN,
        fill: { type: "solid", color: "evil" },
        stroke: { color: "x", width: Infinity },
        transform: { opacity: 9 },
      },
    ]);
    const out = graphics![0] as ShapeGraphicClip;
    expect(Number.isFinite(out.thickness)).toBe(true);
    expect(out.fill).toEqual({ type: "solid", color: "#14b8a6" });
    expect(out.stroke).toBeUndefined();
    expect(out.transform.opacity).toBe(1);
  });

  it("getEffectiveGraphics roundtrip save → reload : aucune perte", () => {
    const editorState = { scenes: [], graphics: [clip] };
    const reloaded = getEffectiveGraphics(editorState);
    expect(reloaded).toEqual([clip]);
    expect(JSON.parse(JSON.stringify(reloaded))).toEqual(JSON.parse(JSON.stringify([clip])));
  });

  it("hash : change si forme, fill, stroke, sides ou épaisseur changent", () => {
    const base = hashEffectiveGraphics([clip]);
    const withShape: typeof clip = { ...clip, shape: "rectangle" };
    const withFill: typeof clip = { ...clip, fill: { type: "solid", color: "#000000" } };
    const withStroke: typeof clip = { ...clip, stroke: { color: "#000000", width: 5 } };
    const withSides: typeof clip = { ...clip, sides: 9 };
    const withThickness: typeof clip = { ...clip, thickness: 0.5 };
    const withAspect: typeof clip = { ...clip, aspect: 0.8 };
    expect(hashEffectiveGraphics([withShape])).not.toBe(base);
    expect(hashEffectiveGraphics([withFill])).not.toBe(base);
    expect(hashEffectiveGraphics([withStroke])).not.toBe(base);
    expect(hashEffectiveGraphics([withSides])).not.toBe(base);
    expect(hashEffectiveGraphics([withThickness])).not.toBe(base);
    expect(hashEffectiveGraphics([withAspect])).not.toBe(base);
  });
});
