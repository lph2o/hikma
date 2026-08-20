import { describe, expect, it } from "vitest";
import {
  detectMarks,
  detectDifficultLetters,
  phoneticHints,
} from "../lib/learning/phonetics";

describe("phonétique minimale (24H-Q1)", () => {
  it("détecte le petit alif (dagger alef) de مَـٰلِكِ", () => {
    expect(detectMarks("مَـٰلِكِ").map((m) => m.key)).toContain("dagger_alef");
  });

  it("détecte la wasla et le soukoun de ٱلْحَمْدُ", () => {
    const keys = detectMarks("ٱلْحَمْدُ").map((m) => m.key);
    expect(keys).toContain("wasla");
    expect(keys).toContain("sukun");
  });

  it("détecte la madda de ٱلضَّآلِّينَ (alef + maddah au-dessus)", () => {
    expect(detectMarks("ٱلضَّآلِّينَ").map((m) => m.key)).toContain("madda");
  });

  it("détecte la hamza de إِيَّاكَ", () => {
    expect(detectMarks("إِيَّاكَ").map((m) => m.key)).toContain("hamza");
  });

  it("détecte les sons difficiles ع et ح", () => {
    const letters = detectDifficultLetters("ٱلْحَمْدُ").map((l) => l.letter);
    expect(letters).toContain("ح");
    const ayn = detectDifficultLetters("عَلَيْهِمْ").map((l) => l.letter);
    expect(ayn).toContain("ع");
  });

  it("produit des conseils simples (au plus 4)", () => {
    const hints = phoneticHints("ٱلرَّحْمَـٰنِ");
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.length).toBeLessThanOrEqual(4);
  });

  it("la détection est purement formelle et ne confond pas عَبَدَ / عَبْد", () => {
    // عَبَدَ (pas de soukoun) vs عَبْد (soukoun) : distinction conservée —
    // elle n'appartient pas à la phonétique mais au grading (non modifié).
    expect(detectMarks("عَبَدَ").map((m) => m.key)).not.toContain("sukun");
    expect(detectMarks("عَبْد").map((m) => m.key)).toContain("sukun");
  });
});
