import { describe, expect, it, vi } from "vitest";
import {
  ACOUSTIC_THRESHOLDS,
  analyzeSamples,
  classifyRecording,
  describeRecording,
  type PronunciationProductionVerdict,
} from "../lib/pronunciation/acoustics";

const SR = 44100;

function sine(len: number, amplitude = 0.5, freq = 440): Float32Array {
  const out = new Float32Array(len);
  for (let i = 0; i < len; i += 1) {
    out[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / SR);
  }
  return out;
}

function silence(len: number): Float32Array {
  return new Float32Array(len);
}

describe("analyse acoustique descriptive (24H-Q3-B)", () => {
  it("détecte le silence (RMS nul)", () => {
    const m = analyzeSamples(silence(SR), SR);
    expect(m.hasSignal).toBe(false);
    expect(m.isSilence).toBe(true);
    expect(m.rms).toBe(0);
  });

  it("détecte un signal valide", () => {
    const m = analyzeSamples(sine(SR), SR);
    expect(m.hasSignal).toBe(true);
    expect(m.isSilence).toBe(false);
    expect(m.rms).toBeGreaterThan(ACOUSTIC_THRESHOLDS.silenceRms);
  });

  it("gère un canal vide", () => {
    const m = analyzeSamples(new Float32Array(0), SR);
    expect(m.durationMs).toBe(0);
    expect(m.isSilence).toBe(true);
  });

  it("calcule la durée à partir de la fréquence d'échantillonnage", () => {
    const m = analyzeSamples(sine(SR / 2), SR); // 0.5 s
    expect(m.durationMs).toBeCloseTo(500, 0);
  });

  it("détecte la saturation évidente", () => {
    const m = analyzeSamples(sine(SR, 1.0), SR);
    expect(m.isClipping).toBe(true);
  });

  it("ne signale pas de saturation sur un signal modéré", () => {
    const m = analyzeSamples(sine(SR, 0.5), SR);
    expect(m.isClipping).toBe(false);
  });
});

describe("classification (jamais CORRECT/INCORRECT)", () => {
  it("silence → NO_SIGNAL", () => {
    expect(classifyRecording(analyzeSamples(silence(SR), SR))).toBe("NO_SIGNAL");
  });

  it("durée trop courte → NO_SIGNAL", () => {
    const short = sine(Math.floor(SR * 0.1)); // 100 ms
    const m = analyzeSamples(short, SR);
    expect(m.durationMs).toBeLessThan(ACOUSTIC_THRESHOLDS.minSignalDurationMs);
    expect(classifyRecording(m)).toBe("NO_SIGNAL");
  });

  it("signal suffisant → REVIEW_REQUIRED", () => {
    const m = analyzeSamples(sine(SR), SR); // 1 s
    expect(classifyRecording(m)).toBe("REVIEW_REQUIRED");
  });

  it("ne produit jamais CORRECT ni INCORRECT", () => {
    const cases = [
      analyzeSamples(silence(SR), SR),
      analyzeSamples(sine(SR), SR),
      analyzeSamples(sine(Math.floor(SR * 0.1)), SR),
    ];
    for (const m of cases) {
      const v: PronunciationProductionVerdict = classifyRecording(m);
      expect(["NO_SIGNAL", "REVIEW_REQUIRED"]).toContain(v);
      expect(v).not.toBe("CORRECT");
      expect(v).not.toBe("INCORRECT");
    }
  });
});

describe("messages descriptifs", () => {
  it("message silence", () => {
    expect(describeRecording(analyzeSamples(silence(SR), SR))).toContain(
      "Aucun son détecté",
    );
  });

  it("message trop court", () => {
    const m = analyzeSamples(sine(Math.floor(SR * 0.1)), SR);
    expect(describeRecording(m)).toContain("très court");
  });

  it("message saturation", () => {
    const m = analyzeSamples(sine(SR, 1.0), SR);
    expect(describeRecording(m)).toContain("saturé");
  });

  it("message signal suffisant", () => {
    const m = analyzeSamples(sine(SR, 0.5), SR);
    expect(describeRecording(m)).toContain("suffisant");
  });
});

describe("confidentialité (aucun réseau)", () => {
  it("l'analyse est pure et n'effectue aucun appel réseau", () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    try {
      const m = analyzeSamples(sine(SR), SR);
      classifyRecording(m);
      describeRecording(m);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
