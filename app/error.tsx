"use client";

// Page d'erreur Hikma (résout U4). Aucune trace technique n'est exposée à
// l'utilisateur : message humain + action de récupération.

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journal serveur uniquement — jamais affiché à l'utilisateur.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 py-16">
      <ErrorState onRetry={reset} backHref="/dashboard" backLabel="Retour à l'accueil" />
    </main>
  );
}
