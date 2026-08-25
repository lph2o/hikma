/**
 * Hikma — Observabilité client (Phase 89I, R-008).
 *
 * Reporter d'erreurs navigateur : envoie un événement minimal
 * (message + stack + pathname, sans cookies ni query string) à
 * l'endpoint serveur POST /observability, qui le journalise côté serveur.
 * En développement, journalise localement sans réseau.
 */

import { redactSensitive } from "./sanitize";

const ENDPOINT = "/observability";
const MAX_BODY = 8000;

export function reportClientError(
  error: unknown,
  source: string,
): void {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "Error";
    const stack = error instanceof Error ? error.stack : undefined;

    const payload = {
      name,
      message: redactSensitive(message),
      stack: stack ? redactSensitive(stack) : undefined,
      path: typeof window !== "undefined" ? window.location.pathname : "",
      source,
    };

    if (process.env.NODE_ENV === "development") {
      console.error("[hikma-observability] client error", payload);
      return;
    }

    // Production : ingestion serveur (même origine — CSP 'self' déjà autorisée).
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload).slice(0, MAX_BODY),
      keepalive: true,
    }).catch(() => {
      // L'observabilité ne doit jamais casser l'application.
    });
  } catch {
    // Silence total : jamais d'effet de bord sur l'application.
  }
}
