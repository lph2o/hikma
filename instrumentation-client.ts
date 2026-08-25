/**
 * Hikma — Instrumentation client (Phase 89I, R-008).
 *
 * S'exécute avant l'hydratation React. Attache les écouteurs d'erreurs
 * globaux du navigateur (uncaught / unhandledrejection) et les route
 * vers le reporter client minimal (POST /observability en production).
 *
 * Aucune donnée personnelle : message + stack + pathname uniquement.
 */

import { reportClientError } from "./lib/observability/client";

try {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      reportClientError(event.error ?? event.message, "window.onerror");
    });
    window.addEventListener("unhandledrejection", (event) => {
      reportClientError(event.reason, "unhandledrejection");
    });
  }
} catch {
  // L'observabilité ne doit jamais empêcher l'application de démarrer.
}
