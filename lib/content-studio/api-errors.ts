// Hikma — Content Studio : mapping erreurs registre → réponses HTTP
// déterministes (jamais de message interne brut ni de stack trace).

import { errorResponse, jsonResponse } from "@/lib/content-api/http";

export function registryErrorResponse(error: unknown): Response {
  if (error instanceof Error) {
    if (error.message.startsWith("INVALID_TRANSITION")) {
      return jsonResponse(
        { error: { code: "INVALID_TRANSITION", message: error.message } },
        409,
      );
    }
    if (error.message.startsWith("RENDER_REQUIRED")) {
      return jsonResponse(
        { error: { code: "RENDER_REQUIRED", message: error.message } },
        422,
      );
    }
    if (error.message === "CONTENT_NOT_FOUND") {
      return jsonResponse({ error: { code: "CONTENT_NOT_FOUND" } }, 404);
    }
  }
  return errorResponse(error);
}
