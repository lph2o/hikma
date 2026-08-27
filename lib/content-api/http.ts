// Hikma Content Studio — garde HTTP commune aux routes /api/internal/content-studio/v1/*.
//
// Sécurité (B3/Phase A) :
// - Authentification Bearer server-only CONTENT_API_TOKEN ; comparaison
//   constant-time sur des empreintes SHA-256 (longueur constante, jamais de
//   fuite d'existence si le secret est absent) ;
// - Rate limiting mémoire REUTILISÉ depuis lib/observability/sanitize.ts ;
// - Logs strictement liste blanche : jamais le token, ni les headers
//   Authorization, ni les clés ; messages passés par redactSensitive().

import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  SlidingWindowRateLimiter,
  redactSensitive,
} from "@/lib/observability/sanitize";
import { ContentApiError, httpStatusForRejectCode } from "./errors";

const DUMMY_SECRET = "content-api-token-not-configured";

/** Le secret ne vit QUE côté serveur ; absent ⇒ tout accès refusé. */
function expectedTokenDigest(): Buffer {
  const token = process.env.CONTENT_API_TOKEN;
  const value =
    token === undefined || token === "" || token.trim() === ""
      ? DUMMY_SECRET // comparaison vouée à échouer, sans branchement temporel
      : token;
  return createHash("sha256").update(value, "utf8").digest();
}

export function isAuthorized(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const provided = createHash("sha256")
    .update(match[1], "utf8")
    .digest();
  try {
    return timingSafeEqual(provided, expectedTokenDigest());
  } catch {
    return false;
  }
}

/** Instance partageé par process — même pattern que POST /observability. */
export const contentStudioRateLimiter = new SlidingWindowRateLimiter(60, 60_000);

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Garde complète à exécuter AVANT tout traitement coûteux :
 * renvoie une Response de refus ou null si autorisé.
 */
export function guard(request: Request): Response | null {
  if (!isAuthorized(request)) {
    logEvent({ event: "auth_rejected" });
    return errorResponse(new ContentApiError("UNAUTHORIZED"));
  }
  const ip = getClientIp(request);
  if (!contentStudioRateLimiter.allow(`ip:${ip}`)) {
    logEvent({ event: "rate_limited" });
    return errorResponse(new ContentApiError("RATE_LIMITED"));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Réponses
// ---------------------------------------------------------------------------

export function jsonResponse(body: unknown, status = 200): Response {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function rejectedResponse(code: string, message: string): Response {
  return jsonResponse(
    { status: "REJECTED", error: { code, message } },
    httpStatusForRejectCode(code),
  );
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ContentApiError) {
    return jsonResponse({ error: { code: error.code } }, error.status);
  }
  // Message assaini (redaction) — jamais de headers/tokens/query strings.
  const message = error instanceof Error ? redactSensitive(error.message) : "internal_error";
  logEvent({ event: "internal_error", message });
  return jsonResponse({ error: { code: "INTERNAL_ERROR" } }, 500);
}

// ---------------------------------------------------------------------------
// Logging liste blanche (jamais : tokens, Authorization, secrets, IP, corps)
// ---------------------------------------------------------------------------

export function logEvent(fields: Record<string, string | number>): void {
  console.log(JSON.stringify({ scope: "content-api", ts: new Date().toISOString(), ...fields }));
}
