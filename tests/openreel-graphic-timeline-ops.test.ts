// Hikma — Tests des opérations TIMELINE des clips graphiques (LOT 3) :
//   lib/content-studio/editor/timeline-ops.ts
//   (moveGraphicClip, trimGraphicClipEnd, trimGraphicClipStart,
//    duplicateGraphicClip, removeGraphicClip)
// Fonctions PURES, frames, bornes sûres — mêmes contraintes que les scènes.

import { describe, it, expect } from "vitest";
import {
  moveGraphicClip,
  trimGraphicClipEnd,
  trimGraphicClipStart,
  duplicateGraphicClip,
  removeGraphicClip,
} from "../lib/content-studio/editor/timeline-ops";
import { createTextGraphicClip } from "../lib/content-studio/graphics/text-graphic";
import { createShapeGraphicClip } from "../lib/content-studio/graphics/shape-graphic";

const textClip = createTextGraphicClip({
  id: "t1",
  text: "Hikma",
  startFrame: 30,
  durationInFrames: 60,
});
const shapeClip = createShapeGraphicClip({
  id: "s1",
  shape: "star",
  startFrame: 90,
  durationInFrames: 45,
});
const clips = [textClip, shapeClip];

describe("moveGraphicClip", () => {
  it("décale startFrame sans mutation ni dépassement négatif", () => {
    const moved = moveGraphicClip(clips, "t1", 12);
    expect(moved[0]!.startFrame).toBe(42);
    expect(clips[0]!.startFrame).toBe(30); // non-mutation
    expect(moved[1]!.id).toBe("s1"); // les autres inchangés
    expect(moveGraphicClip(clips, "t1", -1000)[0]!.startFrame).toBe(0);
  });

  it("delta 0 → identique ; id inconnu → inchangé", () => {
    expect(moveGraphicClip(clips, "t1", 0)).toEqual(clips);
    expect(moveGraphicClip(clips, "zzz", 5)).toEqual(clips);
  });

  it("déterminisme : même entrée → même sortie", () => {
    expect(moveGraphicClip(clips, "s1", 7)).toEqual(moveGraphicClip(clips, "s1", 7));
  });
});

describe("trimGraphicClipEnd", () => {
  it("rallonge/raccourcit la durée (jamais < 1)", () => {
    const longer = trimGraphicClipEnd(clips, "t1", 20);
    expect(longer[0]!.durationInFrames).toBe(80);
    const shorter = trimGraphicClipEnd(clips, "t1", -50);
    expect(shorter[0]!.durationInFrames).toBe(10);
    const min = trimGraphicClipEnd(clips, "t1", -999);
    expect(min[0]!.durationInFrames).toBe(1);
    expect(clips[0]!.durationInFrames).toBe(60); // non-mutation
  });
});

describe("trimGraphicClipStart", () => {
  it("tirer le bord gauche change startFrame + durée", () => {
    // delta +10 : le clip démarre 10f plus tard, durée -10
    const trimmed = trimGraphicClipStart(clips, "t1", 10);
    expect(trimmed[0]!.startFrame).toBe(40);
    expect(trimmed[0]!.durationInFrames).toBe(50);
    // delta -10 : le clip démarre 10f plus tôt, durée +10
    const extended = trimGraphicClipStart(clips, "t1", -10);
    expect(extended[0]!.startFrame).toBe(20);
    expect(extended[0]!.durationInFrames).toBe(70);
    // durée jamais < 1 ; startFrame jamais < 0
    const min = trimGraphicClipStart(clips, "t1", 1000);
    expect(min[0]!.durationInFrames).toBe(1);
    expect(min[0]!.startFrame).toBe(89); // 30 + (60-1)
    const neg = trimGraphicClipStart(clips, "t1", -1000);
    expect(neg[0]!.startFrame).toBe(0);
  });
});

describe("duplicateGraphicClip", () => {
  it("crée un NOUVEL id, jamais deux ids identiques", () => {
    const dup = duplicateGraphicClip(clips, "t1");
    expect(dup).toHaveLength(3);
    const ids = dup.map((c) => c.id);
    expect(new Set(ids).size).toBe(3);
    const copy = dup.find((c) => c.id !== "t1" && c.id !== "s1");
    expect(copy).toBeDefined();
    expect(copy!.startFrame).toBe(40); // original + 10
    expect(copy!.durationInFrames).toBe(60);
    expect((copy as typeof textClip).text).toBe("Hikma");
  });

  it("id inconnu → inchangé", () => {
    expect(duplicateGraphicClip(clips, "zzz")).toEqual(clips);
  });
});

describe("removeGraphicClip", () => {
  it("supprime par id sans toucher au reste", () => {
    const removed = removeGraphicClip(clips, "s1");
    expect(removed).toHaveLength(1);
    expect(removed[0]!.id).toBe("t1");
  });
});

describe("workflow Timeline complet (move → trim → duplicate → remove)", () => {
  it("enchaîne les opérations sans jamais produire de frames invalides", () => {
    let current = clips;
    current = moveGraphicClip(current, "t1", 5);
    current = trimGraphicClipStart(current, "t1", 8);
    current = trimGraphicClipEnd(current, "t1", -12);
    current = duplicateGraphicClip(current, "t1");
    current = removeGraphicClip(current, "s1");
    for (const clip of current) {
      expect(Number.isInteger(clip.startFrame)).toBe(true);
      expect(Number.isInteger(clip.durationInFrames)).toBe(true);
      expect(clip.startFrame).toBeGreaterThanOrEqual(0);
      expect(clip.durationInFrames).toBeGreaterThanOrEqual(1);
    }
    const ids = current.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
