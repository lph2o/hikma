import { describe, expect, it } from "vitest";
import {
  getOnboardingSurahSummary,
  getOnboardingUxStage,
  isOnboardingSessionError,
  ONBOARDING_UX_STAGE_COUNT,
} from "@/lib/learning/onboarding-presentation";
import { getAnticipationCopy, getSignatureCopy } from "@/lib/learning/lesson-copy";

describe("onboarding presentation stages", () => {
  it("keeps the eight technical screens grouped into six user-facing stages", () => {
    expect(ONBOARDING_UX_STAGE_COUNT).toBe(6);
    expect(Array.from({ length: 9 }, (_, step) => getOnboardingUxStage(step))).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4, 5,
    ]);
  });

  it("clamps unexpected earlier steps to the welcome stage", () => {
    expect(getOnboardingUxStage(-1)).toBe(0);
  });

  // Phase 71C — E-01 : fast-track stages skip through the flow consistently.
  it("fast-track step 0 remains stage 0 (welcome)", () => {
    expect(getOnboardingUxStage(0)).toBe(0);
  });

  it("selection screen (step 7) maps to stage 4 (goal)", () => {
    expect(getOnboardingUxStage(7)).toBe(4);
  });

  it("final screen (step 8) maps to stage 5 (recap)", () => {
    expect(getOnboardingUxStage(8)).toBe(5);
  });

  it("keeps the recap faithful to recommendation, explicit choice, or fallback", () => {
    expect(getOnboardingSurahSummary({ name: "Al-Fātiḥah", explicitlySelected: false, usedFallback: false })).toBe("Pour commencer, nous te proposons Al-Fātiḥah.");
    expect(getOnboardingSurahSummary({ name: "Al-'Aṣr", explicitlySelected: true, usedFallback: false })).toBe("Tu as choisi de commencer par Al-'Aṣr.");
    expect(getOnboardingSurahSummary({ name: "Al-Fātiḥah", explicitlySelected: true, usedFallback: true })).toBe("Nous avons choisi Al-Fātiḥah comme meilleur point de départ disponible.");
  });

  it("identifies only the known expired-session response", () => {
    expect(isOnboardingSessionError("Connecte-toi pour continuer.")).toBe(true);
    expect(isOnboardingSessionError("Impossible de terminer l'onboarding. Réessaie.")).toBe(false);
  });
});

// Phase 71C — E-01 : contrat du parcours onboarding → leçon.
describe("onboarding → first lesson contract", () => {
  it("le contrat de récit PreLesson est stable (pas de jargon dans les helpers)", () => {
    // Les helpers de copie pour PreLesson/LessonDiscovery ne doivent contenir
    // aucun terme technique (SRS, Leitner, lemma, MASAQ, algorithme).
    const forbidden = ["SRS", "Leitner", "lemma", "MASAQ", "algorithme"];
    const antic = getAnticipationCopy(3);
    const sig = getSignatureCopy("Al-Fātiḥah 1:1");
    for (const term of forbidden) {
      expect(antic).not.toContain(term);
      if (sig) expect(sig).not.toContain(term);
    }
  });

  it("getAnticipationCopy renvoie des infos qualitatives sans durée", () => {
    const copy = getAnticipationCopy(5);
    expect(copy).toContain("5");
    expect(copy).toContain("mots");
    // Pas de durée en minutes.
    expect(copy).not.toMatch(/\d+\s?min/);
  });

  it("getSignatureCopy retourne null sans ayahRef", () => {
    expect(getSignatureCopy(null)).toBeNull();
  });

  it("getSignatureCopy contient l'ayahRef réelle quand fournie", () => {
    expect(getSignatureCopy("Al-Fātiḥah 1:1")).toContain("Al-Fātiḥah 1:1");
  });
});
