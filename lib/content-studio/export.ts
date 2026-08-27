// Hikma — Content Studio (B7) : EXPORT.
//
// Un export = bundle JSON déterministe (contenu + instantanés sources/licences
// + données de montage). EXPORTED est DISTINCT de PUBLISHED : un contenu
// exporté n'a jamais été publié tant qu'un adapter de publication n'a pas
// retourné un identifiant de publication (publishing.ts).

import {
  buildVideoContentFromQuiz,
  buildVideoContentFromReveal,
  toVideoSceneData,
} from "./video/pipeline";
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

/** Recalcule le montage vidéo depuis le payload (déterministe). */
function sceneDataFromPayload(item: ContentStudioItem): VideoSceneData | null {
  if (item.templateKey === "WORD_REVEAL_V1") {
    return toVideoSceneData(
      buildVideoContentFromReveal(item.payload as Parameters<typeof buildVideoContentFromReveal>[0]),
    );
  }
  if (item.templateKey === "WORD_QUIZ_V1") {
    return toVideoSceneData(
      buildVideoContentFromQuiz(item.payload as Parameters<typeof buildVideoContentFromQuiz>[0]),
    );
  }
  // FREQUENCY_FACT_V1 : pas de builder en V1 → pas de montage (jamais inventé).
  return null;
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
