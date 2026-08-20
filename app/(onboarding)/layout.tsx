import type { ReactNode } from "react";

/**
 * Groupe (onboarding) : route /onboarding sans la navigation applicative,
 * isolée du layout (app) pour éviter toute boucle de redirection.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
