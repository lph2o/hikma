// Hikma — Content Studio API V1 — /items/:contentKey
//
//   GET   → lecture d'un contenu du registre
//   PATCH { status } → transition éditoriale validée (workflow.ts) ;
//                      PUBLISHED exige render_status = RENDERED.
//
// Auth : Bearer CONTENT_API_TOKEN, rate limit partagé, server-side.

import {
  guard,
  jsonResponse,
  logEvent,
} from "@/lib/content-api/http";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { registryErrorResponse } from "@/lib/content-studio/api-errors";
import type { ContentItemStatus } from "@/lib/content-studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KNOWN_STATUSES = new Set<ContentItemStatus>([
  "DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED", "EXPORTED",
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ contentKey: string }> },
): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const { contentKey } = await context.params;
    const registry = new ContentRegistryService(getContentStudioDbClient());
    const item = await registry.getByContentKey(contentKey);
    if (!item) return jsonResponse({ error: { code: "CONTENT_NOT_FOUND" } }, 404);
    return jsonResponse({ item });
  } catch (error) {
    return registryErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ contentKey: string }> },
): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const { contentKey } = await context.params;
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
    const next = body?.status;
    if (typeof next !== "string" || !KNOWN_STATUSES.has(next as ContentItemStatus)) {
      return jsonResponse(
        { error: { code: "INVALID_REQUEST", message: "status invalide" } },
        400,
      );
    }
    const registry = new ContentRegistryService(getContentStudioDbClient());
    const item = await registry.setStatus(contentKey, next as ContentItemStatus);
    logEvent({ event: "studio_status", status: item.status });
    return jsonResponse({ item });
  } catch (error) {
    return registryErrorResponse(error);
  }
}
