// Hikma Content Studio API V1 — GET /word-candidates
//
// Auth : Bearer CONTENT_API_TOKEN (server-only, timing-safe).
// Rate limit : SlidingWindowRateLimiter réutilisé (60 req/min/IP), avant traitement.
// Lecture seule : aucun INSERT/UPDATE/DELETE, client Supabase ANON.

import { ContentStudioService } from "@/lib/content-api/service";
import { getContentStudioClient } from "@/lib/content-api/client";
import {
  errorResponse,
  guard,
  jsonResponse,
  logEvent,
} from "@/lib/content-api/http";

// Bornes HTTP de la pagination (documentées Phase A) : le service re-clamp.
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const rawLimit = url.searchParams.get("limit");
    const rawOffset = url.searchParams.get("offset");

    let limit = Number.parseInt(rawLimit ?? "", 10);
    if (!Number.isInteger(limit)) limit = DEFAULT_LIMIT;
    limit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    let offset = Number.parseInt(rawOffset ?? "", 10);
    if (!Number.isInteger(offset) || offset < 0) offset = 0;

    const service = new ContentStudioService(getContentStudioClient());
    const result = await service.listWordCandidates({ limit, offset });
    logEvent({ event: "candidates", count: result.items.length });
    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
