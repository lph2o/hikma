import { describe, expect, it } from "vitest";
import {
  getOnboardingSurahSummary,
  getOnboardingUxStage,
  isOnboardingSessionError,
  ONBOARDING_UX_STAGE_COUNT,
} from "@/lib/learning/onboarding-presentation";

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
