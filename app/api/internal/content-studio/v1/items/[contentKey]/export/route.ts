// Hikma — Content Studio API V1 — /items/:contentKey/export
//
//   POST → construit le bundle d'export (contenu + montage + instantanés) et
//          marque le contenu EXPORTED. EXPORTED ≠ PUBLISHED : aucun adapter de
//          publication n'est invoqué ici (publishing.ts reste vide en V1).

import {
  guard,
  jsonResponse,
  logEvent,
} from "@/lib/content-api/http";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { buildExportBundle } from "@/lib/content-studio/export";
import { registryErrorResponse } from "@/lib/content-studio/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
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
    if (!registry.isExportAllowed(item)) {
      return jsonResponse(
        { error: { code: "INVALID_TRANSITION", message: `EXPORT interdit depuis ${item.status}` } },
        409,
      );
    }

    const bundle = buildExportBundle(item);
    const exported = await registry.setStatus(contentKey, "EXPORTED");
    logEvent({ event: "studio_exported", contentKey, version: exported.version });
    return jsonResponse({ bundle, item: exported });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INVALID_TRANSITION")) {
      return jsonResponse(
        { error: { code: "INVALID_TRANSITION", message: error.message } },
        409,
      );
    }
    return registryErrorResponse(error);
  }
}
