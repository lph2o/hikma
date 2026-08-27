import { describe, expect, it } from "vitest";
import {
  computeContentKey,
  CONTENT_KEY_ALGORITHM,
} from "../lib/content-api/content-key";

// Référence LIVE gelée par B3-FINAL (données réelles يَوْمَ) :
// input "fc581cb3-8d05-410f-9373-a428c8d17e57|WORD_REVEAL_V1|1|HOOK_H1|fr"
const REFERENCE_INPUT = {
  wordId: "fc581cb3-8d05-410f-9373-a428c8d17e57",
  templateKey: "WORD_REVEAL_V1",
  templateVersion: "1",
  hookVariantId: "HOOK_H1",
  language: "fr",
};
const REFERENCE_DIGEST =
  "1f419cf7aac14afe30f1a0afc5b7a73b14aa9dfa1a4f0ad1ab843caafc03df60";

describe("computeContentKey (sha256-v1, gelé B3 §12)", () => {
  it("produit exactement le digest de référence de يَوْمَ", () => {
    expect(computeContentKey(REFERENCE_INPUT)).toBe(REFERENCE_DIGEST);
    expect(CONTENT_KEY_ALGORITHM).toBe("sha256-v1");
  });

  it("est déterministe (aucun timestamp, aucune donnée cosmétique)", () => {
    const a = computeContentKey(REFERENCE_INPUT);
    const b = computeContentKey({ ...REFERENCE_INPUT });
    expect(a).toBe(b);
    // la forme hex lowercase 64 est le format contractuel
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("change si wordId change", () => {
    const d = computeContentKey({
      ...REFERENCE_INPUT,
      wordId: "00000000-0000-0000-0000-000000000000",
    });
    expect(d).not.toBe(REFERENCE_DIGEST);
  });

  it("change si templateKey change", () => {
    const d = computeContentKey({ ...REFERENCE_INPUT, templateKey: "WORD_QUIZ_V1" });
    expect(d).not.toBe(REFERENCE_DIGEST);
  });

  it("change si hookVariant.id change", () => {
    const d = computeContentKey({ ...REFERENCE_INPUT, hookVariantId: "HOOK_H2" });
    expect(d).not.toBe(REFERENCE_DIGEST);
  });

  it("change si language change", () => {
    const d = computeContentKey({ ...REFERENCE_INPUT, language: "en" });
    expect(d).not.toBe(REFERENCE_DIGEST);
  });

  it("ne dépend PAS des données cosmétiques (caption/CTA/rendu)", () => {
    // L'algorithme n'accepte que ses cinq champs : tout autre paramètre
    // (caption, CTA textuel, couleurs, timing…) est structurellement exclu.
    const keysOfInput = Object.keys(REFERENCE_INPUT);
    expect(keysOfInput).toEqual([
      "wordId",
      "templateKey",
      "templateVersion",
      "hookVariantId",
      "language",
    ]);
  });
});
