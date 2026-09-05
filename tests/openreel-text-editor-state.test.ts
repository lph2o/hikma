// Hikma — Tests de l'intégration GRAPHICS dans l'editor_state (LOT 1) :
//   lib/content-studio/editor/state.ts (sanitizeEditorGraphics, getEffectiveGraphics,
//   hashEffectiveGraphics) + roundtrip save → reload.
// Les clips graphiques doivent survivre à la sérialisation sans perte, être
// sanitisés (jamais NaN/Infinity) et invalider le rendu quand ils changent.

import { describe, it, expect } from "vitest";
import {
  getEffectiveGraphics,
  hashEffectiveGraphics,
  sanitizeEditorGraphics,
} from "../lib/content-studio/editor/state";
import { createTextGraphicClip } from "../lib/content-studio/graphics/text-graphic";

const arabicClip = createTextGraphicClip({
  id: "t1",
  text: "يَوْمَ",
  direction: "rtl",
  startFrame: 10,
  durationInFrames: 90,
  zIndex: 2,
  transform: { x: 0.5, y: 0.35, opacity: 0.9 },
  keyframes: [
    { id: "a", time: 0, property: "opacity", value: 0, easing: "linear" },
    { id: "b", time: 60, property: "opacity", value: 1, easing: "linear" },
  ],
});

describe("sanitizeEditorGraphics (défense serveur)", () => {
  it("accepte une collection texte valide (perte nulle)", () => {
    const { graphics, reason } = sanitizeEditorGraphics([arabicClip]);
    expect(reason).toBeUndefined();
    expect(graphics).toHaveLength(1);
    expect(graphics![0]).toMatchObject({
      id: "t1",
      text: "يَوْمَ",
      direction: "rtl",
      startFrame: 10,
      durationInFrames: 90,
      zIndex: 2,
    });
    expect((graphics![0] as typeof arabicClip).style.fontSize).toBe(48);
    expect(graphics![0].keyframes).toHaveLength(2);
  });

  it("collection vide → [] (pas d'erreur)", () => {
    expect(sanitizeEditorGraphics([])).toEqual({ graphics: [] });
  });

  it("non-array → rejet", () => {
    expect(sanitizeEditorGraphics(null).reason).toBe("not_array");
    expect(sanitizeEditorGraphics({}).reason).toBe("not_array");
  });

  it("clips invalides → rejet global (un clip corrompu n'efface jamais la collection)", () => {
    expect(sanitizeEditorGraphics([{ kind: "banane" }]).reason).toMatch(/unknown_kind/);
    expect(sanitizeEditorGraphics([null]).reason).toBe("invalid_clip");
    expect(sanitizeEditorGraphics([{ kind: "text", text: "ok" }, { kind: "x" }]).reason).toMatch(/unknown_kind/);
    // kind connu mais valeurs de base invalides → clampées, pas rejetées
    const mixed = sanitizeEditorGraphics([
      { kind: "sticker", startFrame: -5, durationInFrames: 0 },
    ]);
    expect(mixed.graphics).toHaveLength(1);
    expect(mixed.graphics![0]).toMatchObject({ startFrame: 0, durationInFrames: 1 });
  });

  it("clamp les valeurs dangereuses (NaN/Infinity → défaut, hors bornes → borne)", () => {
    const { graphics } = sanitizeEditorGraphics([
      {
        kind: "text",
        text: "x",
        transform: { x: Number.NaN, opacity: 5, scaleX: Number.POSITIVE_INFINITY },
        durationInFrames: Number.POSITIVE_INFINITY,
      },
    ]);
    const t = graphics![0]!.transform;
    expect(Number.isFinite(t.x)).toBe(true);
    expect(t.opacity).toBe(1);
    expect(t.scaleX).toBe(1); // Infinity → défaut (jamais de borne infinie)
    expect(graphics![0]!.durationInFrames).toBe(60); // Infinity → défaut
    // valeur finie hors bornes → clampée à la borne
    const clamped = sanitizeEditorGraphics([
      { kind: "text", text: "x", transform: { scaleX: 100 } },
    ]);
    expect(clamped.graphics![0]!.transform.scaleX).toBe(10);
  });
});

describe("getEffectiveGraphics (lecture re-sanitisée)", () => {
  it("editor_state sans graphics → []", () => {
    expect(getEffectiveGraphics(null)).toEqual([]);
    expect(getEffectiveGraphics({ scenes: [] })).toEqual([]);
  });

  it("roundtrip save → reload : aucune perte", () => {
    const editorState = { scenes: [], graphics: [arabicClip] };
    const reloaded = getEffectiveGraphics(editorState);
    expect(reloaded).toEqual([arabicClip]);
    // re-sérialisation stable
    expect(JSON.parse(JSON.stringify(reloaded))).toEqual(JSON.parse(JSON.stringify([arabicClip])));
  });
});

describe("hashEffectiveGraphics (invalidation de rendu)", () => {
  it("stable pour une même collection (ordre + valeurs)", () => {
    expect(hashEffectiveGraphics([arabicClip])).toBe(hashEffectiveGraphics([arabicClip]));
    expect(hashEffectiveGraphics([])).toBe(hashEffectiveGraphics([]));
  });

  it("change si texte, style, transform, keyframes ou durée changent", () => {
    const base = hashEffectiveGraphics([arabicClip]);
    const withText: typeof arabicClip = { ...arabicClip, text: "اللَّه" };
    const withStyle: typeof arabicClip = { ...arabicClip, style: { ...arabicClip.style, fontSize: 64 } };
    const withTransform: typeof arabicClip = { ...arabicClip, transform: { ...arabicClip.transform, x: 0.7 } };
    const withKeyframes: typeof arabicClip = {
      ...arabicClip,
      keyframes: [{ id: "z", time: 0, property: "opacity", value: 1, easing: "linear" }],
    };
    const withDuration: typeof arabicClip = { ...arabicClip, durationInFrames: 120 };
    expect(hashEffectiveGraphics([withText])).not.toBe(base);
    expect(hashEffectiveGraphics([withStyle])).not.toBe(base);
    expect(hashEffectiveGraphics([withTransform])).not.toBe(base);
    expect(hashEffectiveGraphics([withKeyframes])).not.toBe(base);
    expect(hashEffectiveGraphics([withDuration])).not.toBe(base);
  });

  it("change si la direction RTL change", () => {
    const base = hashEffectiveGraphics([arabicClip]);
    const withDirection: typeof arabicClip = { ...arabicClip, direction: "ltr" };
    expect(hashEffectiveGraphics([withDirection])).not.toBe(base);
  });
});
