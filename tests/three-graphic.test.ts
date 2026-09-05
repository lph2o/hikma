// Hikma — Content Studio : TESTS 3D (ThreeGraphicClip).
//
// Couvre : sanitization stricte (NaN/Infinity/bornes), évaluation pure du
// frame (position/rotation/scale/opacity + keyframes), déterminisme strict,
// non-mutation, sérialisation JSON, roundtrip editor_state.

import { describe, expect, it } from "vitest";
import {
  createThreeGraphicClip,
  evaluateThreeGraphic,
  sanitizeThreeCamera,
  sanitizeThreeGeometry,
  sanitizeThreeLighting,
  sanitizeThreeMaterial,
  sanitizeThreeTransform,
} from "@/lib/content-studio/graphics/three-graphic";
import { sanitizeEditorGraphics } from "@/lib/content-studio/editor/state";

describe("sanitizeThreeGraphicClip — bornes et valeurs invalides", () => {
  it("sanitise geometry : NaN/Infinity → défauts, bornes sûres", () => {
    expect(sanitizeThreeGeometry({ kind: "box", size: NaN, sizeY: Infinity, segments: -5 })).toEqual({
      kind: "box",
      size: 0.5,
      sizeY: 0.5,
      segments: 3, // clamp min (jamais < 3)
    });
    expect(sanitizeThreeGeometry({ kind: "torus", size: 99, sizeY: 0.001, segments: 4 })).toEqual({
      kind: "torus",
      size: 3, // clamp max
      sizeY: 0.02, // clamp min
      segments: 4, // floor, min 3
    });
    // kind inconnu → box
    expect(sanitizeThreeGeometry({ kind: "nope" as never }).kind).toBe("box");
  });

  it("sanitise material : couleur invalide → fallback, opacité clampée", () => {
    const m = sanitizeThreeMaterial({
      color: "red-not-hex",
      opacity: 42,
      metalness: -1,
      roughness: Infinity,
      emissive: "#00ff00",
      emissiveIntensity: 999,
    });
    expect(m.color).toBe("#f5d47a");
    expect(m.opacity).toBe(1);
    expect(m.metalness).toBe(0);
    expect(m.roughness).toBe(0.45); // Infinity → défaut
    expect(m.emissive).toBe("#00ff00");
    expect(m.emissiveIntensity).toBe(5);
  });

  it("sanitise lighting/camera : bornes sûres", () => {
    const l = sanitizeThreeLighting({ ambientIntensity: -5, directionalIntensity: 99, directionalX: NaN });
    expect(l.ambientIntensity).toBe(0);
    expect(l.directionalIntensity).toBe(3);
    expect(l.directionalX).toBe(0.5); // NaN → défaut
    const c = sanitizeThreeCamera({ fov: 0, z: -3, x: 99 });
    expect(c.fov).toBe(10);
    expect(c.z).toBe(0.5);
    expect(c.x).toBe(10);
  });

  it("sanitise transform 3D : axes séparés clampés", () => {
    const t = sanitizeThreeTransform({ x: NaN, z: 99, rotationX: -99999, scaleZ: -2 });
    expect(t.x).toBe(0.5);
    expect(t.z).toBe(3);
    expect(t.rotationX).toBe(-3600);
    expect(t.scaleZ).toBe(0);
  });

  it("createThreeGraphicClip : id par défaut, frames bornées", () => {
    const clip = createThreeGraphicClip({ startFrame: -5, durationInFrames: Infinity });
    expect(clip.id).toBe("graphic-three"); // base sanitize (id dérivé du kind)
    expect(clip.kind).toBe("three");
    expect(clip.startFrame).toBe(0);
    expect(clip.durationInFrames).toBe(60); // Infinity → défaut (60)
  });
});

describe("evaluateThreeGraphic — fonction PURE du frame", () => {
  it("sans keyframes → transform de base", () => {
    const clip = createThreeGraphicClip({
      id: "t1",
      startFrame: 0,
      durationInFrames: 120,
      transform: { x: 0.25, y: 0.75, z: 0.5, rotationX: 45, scaleZ: 2 },
    });
    const ev = evaluateThreeGraphic(clip, 60);
    expect(ev.x).toBe(0.25);
    expect(ev.y).toBe(0.75);
    expect(ev.z).toBe(0.5);
    expect(ev.rotationX).toBe(45);
    expect(ev.scaleZ).toBe(2);
    expect(ev.opacity).toBe(1);
    // Même frame → même résultat (déterminisme)
    expect(evaluateThreeGraphic(clip, 60)).toEqual(ev);
  });

  it("keyframes : interpolation position.z + rotation.y + opacity", () => {
    const clip = createThreeGraphicClip({
      id: "t2",
      startFrame: 0,
      durationInFrames: 120,
      transform: { x: 0.5, y: 0.5, z: 0, rotationY: 0, opacity: 1 },
      keyframes: [
        { id: "k1", time: 0, property: "position.z", value: 0, easing: "linear" },
        { id: "k2", time: 120, property: "position.z", value: 1, easing: "linear" },
        { id: "k3", time: 0, property: "rotation.y", value: 0, easing: "linear" },
        { id: "k4", time: 120, property: "rotation.y", value: 90, easing: "linear" },
      ],
    });
    const at0 = evaluateThreeGraphic(clip, 0);
    expect(at0.z).toBeCloseTo(0, 6);
    expect(at0.rotationY).toBeCloseTo(0, 6);
    const at60 = evaluateThreeGraphic(clip, 60);
    expect(at60.z).toBeCloseTo(0.5, 6);
    expect(at60.rotationY).toBeCloseTo(45, 6);
    const at120 = evaluateThreeGraphic(clip, 120);
    expect(at120.z).toBeCloseTo(1, 6);
    expect(at120.rotationY).toBeCloseTo(90, 6);
    // Déterminisme strict
    expect(evaluateThreeGraphic(clip, 37)).toEqual(evaluateThreeGraphic(clip, 37));
  });

  it("keyframes : clamp avant premier / après dernier (hold des bords)", () => {
    const clip = createThreeGraphicClip({
      id: "t3",
      startFrame: 10,
      durationInFrames: 100,
      transform: { scaleX: 1, scaleY: 1, scaleZ: 1, opacity: 1 },
      keyframes: [
        { id: "a", time: 20, property: "opacity", value: 0.5, easing: "linear" },
      ],
    });
    // frame 0 < 20 → valeur du keyframe (clamp gauche)
    expect(evaluateThreeGraphic(clip, 0).opacity).toBeCloseTo(0.5, 6);
    // frame 200 > 20 → valeur du keyframe (clamp droit)
    expect(evaluateThreeGraphic(clip, 200).opacity).toBeCloseTo(0.5, 6);
  });

  it("non-mutation : evaluate ne modifie jamais le clip", () => {
    const clip = createThreeGraphicClip({ id: "t4", durationInFrames: 60, keyframes: [] });
    const frozen = JSON.parse(JSON.stringify(clip));
    evaluateThreeGraphic(clip, 30);
    expect(clip).toEqual(frozen);
  });
});

describe("sérialisation JSON + roundtrip editor_state", () => {
  it("JSON.stringify → parse → sanitizeEditorGraphics : propriétés conservées", () => {
    const clip = createThreeGraphicClip({
      id: "three-abc",
      startFrame: 30,
      durationInFrames: 120,
      zIndex: 7,
      geometry: { kind: "torus", size: 0.4, sizeY: 0.15, segments: 32 },
      material: { color: "#ffcc66", opacity: 0.8, metalness: 0.9, roughness: 0.1 },
      lighting: { ambientIntensity: 0.5, directionalIntensity: 1.2, pointIntensity: 0.4 },
      camera: { fov: 45, z: 4 },
      keyframes: [
        { id: "kf1", time: 0, property: "position.x", value: 0.2, easing: "linear" },
      ],
    });
    const json = JSON.stringify(clip);
    expect(json).not.toContain("NaN");
    expect(json).not.toContain("Infinity");
    expect(json).not.toContain("null,");

    const restored = sanitizeEditorGraphics([JSON.parse(json)]);
    expect(restored.graphics).toHaveLength(1);
    const r = restored.graphics![0] as typeof clip;
    expect(r.kind).toBe("three");
    expect(r.id).toBe("three-abc");
    expect(r.startFrame).toBe(30);
    expect(r.durationInFrames).toBe(120);
    expect(r.zIndex).toBe(7);
    expect(r.geometry.kind).toBe("torus");
    expect(r.geometry.size).toBeCloseTo(0.4, 6);
    expect(r.material.metalness).toBeCloseTo(0.9, 6);
    expect(r.camera.fov).toBe(45);
    expect(r.keyframes).toHaveLength(1);
    expect(r.keyframes![0]!.property).toBe("position.x");
    expect(r.keyframes![0]!.value).toBe(0.2);
  });

  it("roundtrip strict : clip → JSON → sanitize → évaluation identique", () => {
    const clip = createThreeGraphicClip({
      id: "three-roundtrip",
      startFrame: 0,
      durationInFrames: 90,
      transform: { x: 0.3, y: 0.6, z: 0.25, rotationX: 10, rotationY: 20, rotationZ: 30, scaleZ: 1.5 },
      geometry: { kind: "icosahedron", size: 0.35, sizeY: 0.35, segments: 12 },
      material: { color: "#f5d47a", opacity: 1, metalness: 0.2, roughness: 0.5 },
    });
    const restored = sanitizeEditorGraphics([JSON.parse(JSON.stringify(clip))]);
    const r = restored.graphics![0] as typeof clip;
    for (const f of [0, 30, 60, 89]) {
      expect(evaluateThreeGraphic(r, f)).toEqual(evaluateThreeGraphic(clip, f));
    }
  });

  it("sanitizeEditorGraphics : kind inconnu → rejet global (jamais de perte silencieuse)", () => {
    const res = sanitizeEditorGraphics([{ kind: "banana", id: "x" }]);
    expect(res.graphics).toBeNull();
    expect(res.reason).toContain("unknown_kind");
  });
});
