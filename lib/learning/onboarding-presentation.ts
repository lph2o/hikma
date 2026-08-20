export const ONBOARDING_UX_STAGE_COUNT = 6;

/** Maps the technical onboarding screens to the six user-facing stages. */
export function getOnboardingUxStage(step: number) {
  if (step <= 0) return 0;
  if (step <= 2) return 1;
  if (step <= 4) return 2;
  if (step <= 6) return 3;
  if (step === 7) return 4;
  return 5;
}

export function getOnboardingSurahSummary({
  name,
  explicitlySelected,
  usedFallback,
}: {
  name: string;
  explicitlySelected: boolean;
  usedFallback: boolean;
}) {
  if (usedFallback) return `Nous avons choisi ${name} comme meilleur point de départ disponible.`;
  if (explicitlySelected) return `Tu as choisi de commencer par ${name}.`;
  return `Pour commencer, nous te proposons ${name}.`;
}

export function isOnboardingSessionError(message: string) {
  return message === "Connecte-toi pour continuer.";
}
