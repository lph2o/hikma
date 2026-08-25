/**
 * Hikma — Instrumentation serveur (Phase 89I, R-008).
 *
 * Capture les erreurs serveur (Server Components, Server Actions, route
 * handlers, rendering) via l'API officielle Next.js 16 `onRequestError`,
 * et les journalise en JSON structuré sur stdout (logs plateforme).
 *
 * Aucune donnée sensible : jamais de headers, cookies, query string,
 * tokens ou corps de requête (voir lib/observability/sanitize.ts).
 */

import {
  buildBootEvent,
  buildServerErrorEvent,
  serializeEvent,
  type ObservabilityEvent,
} from "./lib/observability/sanitize";

export function register(): void {
  // Journal serveur unique au démarrage — visible dans les logs plateforme.
  // eslint-disable-next-line no-console
  console.log(serializeEvent(buildBootEvent({ node: process.version })));
}

export function onRequestError(
  error: unknown,
  errorRequest: Readonly<{ path: string; method: string }>,
  errorContext: Readonly<{
    routerKind?: string;
    routeType?: "render" | "route" | "action" | "proxy";
    renderSource?: string;
    revalidateReason?: "on-demand" | "stale";
  }>,
): void {
  const event: ObservabilityEvent = buildServerErrorEvent(error, errorRequest, errorContext);
  // Journal serveur uniquement — l'utilisateur ne voit jamais cette ligne.
  // eslint-disable-next-line no-console
  console.error(serializeEvent(event));
}
