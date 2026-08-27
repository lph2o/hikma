// Hikma — Content Studio API V1 — /items
//
//   GET  /items?status=&limit=&offset=  → liste du registre (filtre statut)
//   POST /items { wordId, templateKey } → génération Content API + upsert
//                                         idempotent (DRAFT)
//
// Auth : Bearer CONTENT_API_TOKEN (même garde que la Content API), rate limit
// partagé, server-side uniquement. Aucun secret exposé.

import { ContentStudioService } from "@/lib/content-api/service";
import { getContentStudioClient } from "@/lib/content-api/client";
import {
  errorResponse,
  guard,
  jsonResponse,
  logEvent,
  rejectedResponse,
} from "@/lib/content-api/http";
import { ContentGenerationService } from "@/lib/content-studio/generate";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { registryErrorResponse } from "@/lib/content-studio/api-errors";
import { isGeneratableTemplate, type ContentItemStatus } from "@/lib/content-studio/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const KNOWN_STATUSES = new Set([
  "DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED", "EXPORTED",
]);

export async function GET(request: Request): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    const rawLimit = url.searchParams.get("limit");
    const rawOffset = url.searchParams.get("offset");

    const status = rawStatus && KNOWN_STATUSES.has(rawStatus)
      ? (rawStatus as ContentItemStatus)
      : undefined;

    let limit = Number.parseInt(rawLimit ?? "", 10);
    if (!Number.isInteger(limit)) limit = DEFAULT_LIMIT;
    limit = Math.min(Math.max(limit, 1), MAX_LIMIT);

    let offset = Number.parseInt(rawOffset ?? "", 10);
    if (!Number.isInteger(offset) || offset < 0) offset = 0;

    const registry = new ContentRegistryService(getContentStudioDbClient());
    const page = await registry.list({ status, limit, offset });
    logEvent({ event: "studio_list", count: page.items.length });
    return jsonResponse(page);
  } catch (error) {
    return registryErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => null)) as
      | { wordId?: unknown; templateKey?: unknown }
      | null;
    const wordId = typeof body?.wordId === "string" ? body.wordId : "";
    const templateKey = typeof body?.templateKey === "string" ? body.templateKey : "";

    if (wordId.length === 0 || !isGeneratableTemplate(templateKey)) {
      return jsonResponse(
        { error: { code: "INVALID_REQUEST", message: "wordId et templateKey (WORD_QUIZ_V1|WORD_REVEAL_V1) requis" } },
        400,
      );
    }

    const generator = new ContentGenerationService(
      new ContentStudioService(getContentStudioClient()),
      new ContentRegistryService(getContentStudioDbClient()),
    );
    const outcome = await generator.generate({ wordId, templateKey });
    if (outcome.status === "REJECTED") {
      logEvent({ event: "studio_generate_rejected", code: outcome.code });
      return rejectedResponse(outcome.code, outcome.message);
    }
    logEvent({ event: "studio_generated", created: outcome.created ? 1 : 0 });
    return jsonResponse({ item: outcome.item, created: outcome.created }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
