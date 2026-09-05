// Hikma — Tests des EFFETS VISUELS des Graphics (texte + formes) :
//   contour / ombre / halo / gradient / flou.
// La chaîne complète : MODEL (TextStyle + ShapeGraphicClip) → sanitization →
// évaluation PURE → Preview/Remotion. Vérifie la sanitization des entrées
// inconnues/persistées, le déterminisme et la NON-MUTATION (jamais NaN/Infinity).

import { describe, it, expect } from "vitest";
import {
  createTextGraphicClip,
  evaluateTextGraphic,
  sanitizeTextStyle,
} from "../lib/content-studio/graphics/text-graphic";
import { DEFAULT_TEXT_STYLE } from "../lib/content-studio/graphics/text-types";
import {
  createShapeGraphicClip,
  sanitizeShapeClip,
} from "../lib/content-studio/graphics/shape-graphic";
import { hashEffectiveGraphics } from "../lib/content-studio/editor/state";
import { hexToRgba } from "../lib/content-studio/graphics/graphic-clip";

describe("TextStyle — effets par défaut", () => {
  it("les défauts n'activent aucun effet Hikma (halo/gradient/flou)", () => {
    expect(DEFAULT_TEXT_STYLE.glowColor).toBeUndefined();
    expect(DEFAULT_TEXT_STYLE.glowRadius).toBeUndefined();
    expect(DEFAULT_TEXT_STYLE.gradient).toBeUndefined();
    expect(DEFAULT_TEXT_STYLE.blurRadius).toBeUndefined();
    // Contour + ombre : champs OpenReel existants, désactivés par défaut
    expect(DEFAULT_TEXT_STYLE.strokeWidth ?? 0).toBeGreaterThan(0); // design Hikma
  });
});

describe("sanitizeTextStyle — effets", () => {
  it("contour : hex validé + épaisseur bornée", () => {
    const s = sanitizeTextStyle({
      strokeColor: "javascript:alert(1)",
      strokeWidth: 9999,
    });
    expect(s.strokeWidth).toBe(60); // clamp
    const s2 = sanitizeTextStyle({ strokeColor: "#ffcc00", strokeWidth: 6 });
    expect(s2.strokeColor).toBe("#ffcc00");
    expect(s2.strokeWidth).toBe(6);
  });

  it("ombre : couleurs + offsets + blur bornés", () => {
    const s = sanitizeTextStyle({
      shadowColor: "#000000",
      shadowBlur: 500,
      shadowOffsetX: Number.NaN,
      shadowOffsetY: -999,
    });
    expect(s.shadowColor).toBe("#000000");
    expect(s.shadowBlur).toBe(120); // clamp
    expect(s.shadowOffsetX).toBe(0); // NaN → défaut 0
    expect(s.shadowOffsetY).toBe(-200); // clamp
  });

  it("halo : couleur validée, rayon/opacité bornés", () => {
    const s = sanitizeTextStyle({ glowColor: "#f5d47a", glowRadius: 500, glowOpacity: 9 });
    expect(s.glowColor).toBe("#f5d47a");
    expect(s.glowRadius).toBe(200);
    expect(s.glowOpacity).toBe(1);
    // couleur invalide → pas de halo
    const s2 = sanitizeTextStyle({ glowColor: "red", glowRadius: 20 });
    expect(s2.glowColor).toBeUndefined();
  });

  it("gradient : couleurs hex filtrées + angle borné ; < 2 couleurs → absent", () => {
    const s = sanitizeTextStyle({
      gradient: { colors: ["#ffffff", "evil", "#f5d47a"], angle: 540 },
    });
    expect(s.gradient).toBeDefined();
    expect(s.gradient!.colors).toEqual(["#ffffff", "#f5d47a"]);
    expect(s.gradient!.angle).toBe(360); // clamp 0..360
    const s2 = sanitizeTextStyle({ gradient: { colors: ["#ffffff"], angle: 90 } });
    expect(s2.gradient).toBeUndefined();
  });

  it("flou : rayon borné", () => {
    expect(sanitizeTextStyle({ blurRadius: 200 }).blurRadius).toBe(60);
    expect(sanitizeTextStyle({ blurRadius: 4 }).blurRadius).toBe(4);
  });
});

describe("createTextGraphicClip — effets préservés + jamais NaN/Infinity", () => {
  it("effets complets → roundtrip identique", () => {
    const clip = createTextGraphicClip({
      text: "HIKMA",
      style: {
        color: "#ffffff",
        strokeColor: "#111827",
        strokeWidth: 4,
        shadowColor: "#000000",
        shadowBlur: 12,
        shadowOffsetX: 4,
        shadowOffsetY: 6,
        glowColor: "#f5d47a",
        glowRadius: 24,
        glowOpacity: 0.8,
        gradient: { colors: ["#ffffff", "#f5d47a"], angle: 90 },
        blurRadius: 2,
      },
    });
    expect(clip.style.strokeWidth).toBe(4);
    expect(clip.style.glowRadius).toBe(24);
    expect(clip.style.gradient!.angle).toBe(90);
    expect(clip.style.blurRadius).toBe(2);
  });

  it("entrées corrompues → clampées, jamais NaN/Infinity", () => {
    const clip = createTextGraphicClip({
      text: "x",
      style: {
        glowRadius: Number.POSITIVE_INFINITY,
        glowOpacity: Number.NaN,
        shadowBlur: Number.NaN,
        strokeWidth: Number.NaN,
        gradient: { colors: ["bad", "worse"], angle: Number.NaN },
        blurRadius: Number.NaN,
      },
    });
    expect(Number.isFinite(clip.style.glowRadius ?? 0)).toBe(true);
    expect(Number.isFinite(clip.style.glowOpacity ?? 0)).toBe(true);
    expect(Number.isFinite(clip.style.shadowBlur ?? 0)).toBe(true);
    expect(Number.isFinite(clip.style.strokeWidth ?? 0)).toBe(true);
    expect(Number.isFinite(clip.style.blurRadius ?? 0)).toBe(true);
    expect(clip.style.gradient).toBeUndefined(); // aucune couleur valide
  });
});

describe("evaluateTextGraphic — déterminisme + non-mutation avec effets", () => {
  const clip = createTextGraphicClip({
    text: "يَوْمَ",
    direction: "rtl",
    startFrame: 0,
    durationInFrames: 60,
    style: {
      glowColor: "#f5d47a",
      glowRadius: 18,
      strokeColor: "#ffffff",
      strokeWidth: 3,
      shadowColor: "#000000",
      shadowBlur: 8,
      shadowOffsetX: 2,
      shadowOffsetY: 4,
      gradient: { colors: ["#ffffff", "#f5d47a"], angle: 45 },
    },
  });

  it("déterminisme : même clip + même frame → même résultat", () => {
    const a = evaluateTextGraphic(clip, 30);
    const b = evaluateTextGraphic(clip, 30);
    expect(a).toEqual(b);
    // Les effets restent présents dans le style évalué
    expect(a.style.glowColor).toBe("#f5d47a");
    expect(a.style.gradient).toBeDefined();
    expect(a.style.strokeWidth).toBe(3);
  });

  it("non-mutation : le clip d'entrée n'est jamais modifié", () => {
    const before = JSON.stringify(clip);
    evaluateTextGraphic(clip, 10);
    evaluateTextGraphic(clip, 45);
    expect(JSON.stringify(clip)).toBe(before);
  });
});

describe("ShapeGraphicClip — effets (shadow / glow / blur)", () => {
  it("création : ombre + halo + flou sanitizés", () => {
    const clip = createShapeGraphicClip({
      shape: "circle",
      thickness: 0.3,
      shadow: { color: "#000000", opacity: 0.5, offsetX: 4, offsetY: 6, blur: 8 },
      glow: { color: "#f5d47a", opacity: 0.8, radius: 20 },
      blur: 3,
    });
    expect(clip.shadow).toEqual({ color: "#000000", opacity: 0.5, offsetX: 4, offsetY: 6, blur: 8 });
    expect(clip.glow!.radius).toBe(20);
    expect(clip.blur).toBe(3);
  });

  it("sanitization : hex invalide → effet absent ; bornes clampées", () => {
    const clip = createShapeGraphicClip({
      shape: "star",
      shadow: { color: "nope", opacity: 9, offsetX: 999, offsetY: -999, blur: -5 },
      glow: { color: "javascript:x", opacity: 5, radius: 9999 },
      blur: Number.NaN,
    });
    expect(clip.shadow).toBeUndefined();
    expect(clip.glow).toBeUndefined();
    expect(clip.blur).toBe(0);
  });

  it("roundtrip sanitizeShapeClip : perte nulle avec effets", () => {
    const clip = createShapeGraphicClip({
      shape: "rectangle",
      shadow: { color: "#000000", opacity: 0.4, offsetX: 3, offsetY: 5, blur: 6 },
      glow: { color: "#14b8a6", opacity: 0.7, radius: 12 },
      blur: 2,
    });
    const sanitized = sanitizeShapeClip(clip as unknown as Record<string, unknown>);
    expect(sanitized.shadow).toEqual(clip.shadow);
    expect(sanitized.glow).toEqual(clip.glow);
    expect(sanitized.blur).toBe(2);
  });

  it("hash : un changement d'effet invalide le rendu (MP4 obsolète)", () => {
    const base = createShapeGraphicClip({ shape: "circle", thickness: 0.3 });
    const withGlow = createShapeGraphicClip({
      shape: "circle",
      thickness: 0.3,
      glow: { color: "#f5d47a", opacity: 0.8, radius: 16 },
    });
    const withShadow = createShapeGraphicClip({
      shape: "circle",
      thickness: 0.3,
      shadow: { color: "#000000", opacity: 0.5, offsetX: 4, offsetY: 6, blur: 8 },
    });
    expect(hashEffectiveGraphics([base])).not.toBe(hashEffectiveGraphics([withGlow]));
    expect(hashEffectiveGraphics([base])).not.toBe(hashEffectiveGraphics([withShadow]));
    expect(hashEffectiveGraphics([base])).not.toBe(
      hashEffectiveGraphics([{ ...base, blur: 4 } as typeof base]),
    );
  });
});

describe("hexToRgba — conversion déterministe", () => {
  it("hex 6 chiffres + opacité", () => {
    expect(hexToRgba("#f5d47a", 0.8)).toBe("rgba(245, 212, 122, 0.8)");
  });
  it("hex 3 chiffres développé", () => {
    expect(hexToRgba("#fff", 1)).toBe("rgba(255, 255, 255, 1)");
  });
  it("opacité bornée + hex invalide → noir", () => {
    expect(hexToRgba("#ffffff", 5)).toBe("rgba(255, 255, 255, 1)");
    expect(hexToRgba("red", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });
});
