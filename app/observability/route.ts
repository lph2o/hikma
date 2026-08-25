/**
 * Hikma — Ingestion d'erreurs client (Phase 89I, R-008).
 *
 * Endpoint POST-only : reçoit un événement d'erreur navigateur minimal,
 * le ré-assainit côté serveur (liste blanche, redaction, troncature) et
 * le journalise en JSON structuré (même format que les erreurs serveur).
 *
 * Limites : taille de corps plafonnée, rate-limit mémoire par IP,
 * aucun stockage, aucune donnée personnelle conservée.
 */

import { NextResponse } from "next/server";
import {
  sanitizeClientPayload,
  serializeEvent,
  SlidingWindowRateLimiter,
} from "@/lib/observability/sanitize";

const MAX_BODY_BYTES = 16_000;

// 30 requêtes / minute / IP — largement au-dessus d'un usage légitime,
// suffisant pour freiner un abus trivial (aucun stockage, logs uniquement).
const limiter = new SlidingWindowRateLimiter(30, 60_000);

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!limiter.allow(ip)) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, reason: "too_large" }, { status: 413 });
    }
    body = JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const event = sanitizeClientPayload(body);
  if (!event) {
    return NextResponse.json({ ok: false, reason: "invalid_payload" }, { status: 400 });
  }

  // Journal serveur uniquement — jamais renvoyé au client.
  // eslint-disable-next-line no-console
  console.error(serializeEvent(event));
  return NextResponse.json({ ok: true });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: false, reason: "method_not_allowed" }, { status: 405 });
}
