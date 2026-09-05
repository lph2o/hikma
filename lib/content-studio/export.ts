// Hikma — Content Studio (B7) : EXPORT.
//
// Un export = bundle JSON déterministe (contenu + instantanés sources/licences
// + données de montage). EXPORTED est DISTINCT de PUBLISHED : un contenu
// exporté n'a jamais été publié tant qu'un adapter de publication n'a pas
// retourné un identifiant de publication (publishing.ts).

import { toVideoSceneData } from "./video/pipeline";
import { buildVideoContentForTemplate } from "./video/content-dispatch";
import type { VideoSceneData } from "./video/types";
import type { ContentStudioItem } from "./types";

export type ExportBundle = {
  contentType: "VIDEO";
  contentKey: string;
  version: number;
  templateKey: ContentStudioItem["templateKey"];
  language: "fr";
  exportedAt: string;
  status: "EXPORTED";
  published: false; // un export n'est JAMAIS présenté comme publié
  renderPath: string | null;
  renderStatus: ContentStudioItem["renderStatus"];
  sceneData: VideoSceneData | null;
  sourceSnapshot: {
    sources: Record<string, unknown>;
    licenses: Record<string, unknown>;
  };
};

/** Recalcule le montage vidéo depuis le payload (déterministe, dispatch unique). */
function sceneDataFromPayload(item: ContentStudioItem): VideoSceneData | null {
  // Le dispatch central couvre toutes les clés de StudioTemplateKey ; le
  // fallback null ne concerne qu'une future clé sans builder (jamais inventé).
  try {
    return toVideoSceneData(
      buildVideoContentForTemplate(item.templateKey, item.payload),
    );
  } catch {
    return null;
  }
}

export function buildExportBundle(item: ContentStudioItem): ExportBundle {
  return {
    contentType: "VIDEO",
    contentKey: item.contentKey,
    version: item.version,
    templateKey: item.templateKey,
    language: "fr",
    exportedAt: new Date().toISOString(),
    status: "EXPORTED",
    published: false,
    renderPath: item.renderPath,
    renderStatus: item.renderStatus,
    sceneData: sceneDataFromPayload(item),
    sourceSnapshot: {
      sources: item.sources,
      licenses: item.licenses,
    },
  };
}
