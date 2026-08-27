// Hikma Content Studio API V1 — GET /quiz/:wordId
//
// QCM de sens via generateExercise("WORD_TO_TRANSLATION", …) — moteur EXISTANT
// non modifié ; confiance dérivée au-dessus du moteur ; UNKNOWN ⇒ REJECT P0.

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
  context: { params: Promise<{ wordId: string }> },
): Promise<Response> {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const { wordId } = await context.params;
    const service = new ContentStudioService(getContentStudioClient());
    const outcome = await service.buildQuiz(wordId);
    if (outcome.status === "REJECTED") {
      logEvent({ event: "rejected", code: outcome.code });
      return rejectedResponse(outcome.code, outcome.message);
    }
    logEvent({ event: "generated", template: "WORD_QUIZ_V1" });
    return jsonResponse(outcome.payload);
  } catch (error) {
    return errorResponse(error);
  }
}
