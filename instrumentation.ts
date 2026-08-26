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
  // process.version n'existe pas dans l'Edge Runtime (instrumentation.ts y est
  // aussi bundlé) : accès indexé + garde de runtime pour éviter l'avertissement
  // statique Turbopack « A Node.js API is used … not supported in the Edge
  // Runtime » sans perdre l'info de version côté Node.
  const isNodeRuntime = process.env.NEXT_RUNTIME !== "edge";
  const nodeVersion = isNodeRuntime
    ? (process as unknown as Record<string, unknown>)["version"]
    : undefined;
  // eslint-disable-next-line no-console
  console.log(
    serializeEvent(
      buildBootEvent({ node: typeof nodeVersion === "string" ? nodeVersion : "" }),
    ),
  );
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
