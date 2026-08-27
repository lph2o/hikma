// Hikma Content Studio API V1 — GET /words/:id
//
// Construit le payload canonique WORD_REVEAL_V1 depuis les données réelles
// (resolver + queries.ts existants). Payload valide ⇒ GENERATED ; sinon
// REJECTED avec le code du contrat (REJECT OVER GUESS).

import { ContentStudioService } from "@/lib/content-api/service";
import { getContentStudioClient } from "@/lib/content-api/client";
import {
  errorResponse,
  guard,
  jsonResponse,
  logEvent,
  rejectedResponse,
} from "@/lib/content-api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const service = new ContentStudioService(getContentStudioClient());
    const outcome = await service.buildReveal(id);
    if (outcome.status === "REJECTED") {
      logEvent({ event: "rejected", code: outcome.code });
      return rejectedResponse(outcome.code, outcome.message);
    }
    logEvent({ event: "generated", template: "WORD_REVEAL_V1" });
    return jsonResponse(outcome.payload);
  } catch (error) {
    return errorResponse(error);
  }
}
