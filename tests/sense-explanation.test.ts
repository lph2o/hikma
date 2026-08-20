import { describe, expect, it } from "vitest";
import { resolveSenseExplanation } from "../lib/learning/sense-explanation";

const generic = {
  text: "Le décret, le destin : dans « la nuit du Qadr ».",
  source: "Hikma — lexique éditorial",
  validatedAt: "2026-08-19T00:00:00Z",
};

const contexts = new Map([
  ["101:9", "Dans ce verset, « sa mère » = sa demeure."],
]);

describe("resolveSenseExplanation (Phase 44B)", () => {
  it("retourne la glose générique quand aucun contexte n'est couvert", () => {
    expect(resolveSenseExplanation(generic, contexts, null)).toBe(generic.text);
    expect(resolveSenseExplanation(generic, contexts, { surahNumber: 97, ayahNumber: 1 })).toBe(generic.text);
  });

  it("retourne l'override contextuel quand le verset est couvert", () => {
    expect(resolveSenseExplanation(generic, contexts, { surahNumber: 101, ayahNumber: 9 })).toBe(
      "Dans ce verset, « sa mère » = sa demeure.",
    );
  });

  it("retourne null sans explication générique (absence légitime, jamais fabriquée)", () => {
    expect(resolveSenseExplanation(null, contexts, { surahNumber: 101, ayahNumber: 9 })).toBeNull();
    expect(resolveSenseExplanation(undefined, undefined, null)).toBeNull();
  });

  it("ignore un contexte hors map même si la map existe", () => {
    expect(resolveSenseExplanation(generic, new Map(), { surahNumber: 101, ayahNumber: 9 })).toBe(generic.text);
  });
});
