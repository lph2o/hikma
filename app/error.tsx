"use client";

// Page d'erreur Hikma (résout U4). Aucune trace technique n'est exposée à
// l'utilisateur : message humain + action de récupération.

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { reportClientError } from "@/lib/observability/client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Observabilité : journal serveur (via ingestion) — jamais affiché.
    reportClientError(error, "error-boundary");
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-6 py-16">
      <ErrorState onRetry={reset} backHref="/dashboard" backLabel="Retour à l'accueil" />
    </main>
  );
}
