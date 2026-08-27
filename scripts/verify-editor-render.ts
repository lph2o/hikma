// Hikma — Content Studio (Phase G) : VALIDATION RÉELLE DU RENDU.
//
// Prouve le pipeline EXACT utilisé par la route app/api/admin/content-studio/
// render/route.ts, SANS écriture DB :
//
//   content (editor override)  →  renderEffectiveVideoToFile
//   →  MP4 réel (bundler + renderMedia / HikmaWordVideo)
//   →  uploadRenderedVideo → bucket privé hikma-video → signed URL
//
// Ce n'est PAS le script CLI générique : c'est la bibliothèque partagée
// (render.ts + storage.ts) que la route sert — les scènes EFFECTIVES avec un
// override du studio feedent Remotion, et le MP4 est DÉPOSÉ en Storage.
//
// Usage : npx tsx scripts/verify-editor-render.ts

import { stat, open } from "node:fs/promises";
import type { ContentStudioItem } from "../lib/content-studio/types";
import type { VideoScene } from "../lib/content-studio/video/types";
import { REVEAL_FIXTURE_YAWMA } from "../lib/content-studio/video/fixtures";
import { buildVideoContentFromReveal, toVideoSceneData } from "../lib/content-studio/video/pipeline";
import { hashEffectiveScenes } from "../lib/content-studio/editor/state";
import { renderEffectiveVideoToFile } from "../lib/content-studio/render";
import { uploadRenderedVideo, VIDEO_BUCKET } from "../lib/content-studio/storage";

function loadEnv(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      /* absent */
    }
  }
}

/** Construit un item Contenu avec un override d'édition du studio (montage). */
function editedItem(): ContentStudioItem {
  const content = buildVideoContentFromReveal(REVEAL_FIXTURE_YAWMA);
  const derived = toVideoSceneData(content);
  // Override du studio : modifie une scène réelle (intro) ET sa durée.
  const scenes: VideoScene[] = derived.scenes.map((s, i) =>
    i === 0 ? { ...s, text: "Hook MODIFIÉ par le studio — preuve G6", durationInFrames: 60 } : s,
  );
  return {
    id: "verify-only",
    contentKey: REVEAL_FIXTURE_YAWMA.contentKey,
    templateKey: "WORD_REVEAL_V1",
    templateVersion: "1",
    language: "fr",
    wordId: REVEAL_FIXTURE_YAWMA.word.id,
    hookVariantId: "HOOK_H1",
    ctaId: "CTA_LEARN_01",
    status: "DRAFT",
    version: 1,
    renderStatus: "NOT_RENDERED",
    renderedAt: null,
    renderError: null,
    renderPath: null,
    payload: REVEAL_FIXTURE_YAWMA as unknown as Record<string, unknown>,
    sources: REVEAL_FIXTURE_YAWMA.sources as unknown as Record<string, unknown>,
    licenses: REVEAL_FIXTURE_YAWMA.licenses as unknown as Record<string, unknown>,
    editorState: { scenes },
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
  };
}

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !srv) {
    console.log("MP4_SKIPPED no Supabase env (rendu local au moins)");
    return;
  }

  const item = editedItem();
  const scenes = (item.editorState as { scenes: VideoScene[] }).scenes;
  const effectiveHash = hashEffectiveScenes(scenes);
  console.log("EFFECTIVE_HASH=" + effectiveHash.slice(0, 12) + "…");
  console.log("EDITOR_OVERRIDE=PRÉSENT (intro.text + durée 60 frames)");

  const rendered = await renderEffectiveVideoToFile(item);
  if (rendered.status !== "RENDERED") {
    console.log("RENDER_EXECUTED=false reason=" + JSON.stringify(rendered));
    process.exit(1);
  }

  const { size } = await stat(rendered.outputLocation);
  console.log("RENDER_EXECUTED=true");
  console.log("MP4_PATH=" + rendered.outputLocation);
  console.log("MP4_EXISTS=" + (size > 0));
  console.log("MP4_SIZE_BYTES=" + size);
  console.log("MP4_DURATION_FRAMES=" + rendered.durationInFrames);
  console.log("MP4_DIMENSIONS=" + rendered.width + "x" + rendered.height);

  // MIME : le header d'un MP4 contient "ftyp" aux octets 4..8.
  const fh = await open(rendered.outputLocation, "r");
  const head = Buffer.alloc(12);
  await fh.read(head, 0, 12, 0);
  await fh.close();
  const mime = head.subarray(4, 8).toString("latin1") === "ftyp" ? "video/mp4" : "unknown";
  console.log("MP4_MIME=" + mime);

  // Upload Storage persistant + signed URL (bibliothèque exacte de la route).
  const stored = await uploadRenderedVideo(
    item.contentKey,
    item.version,
    effectiveHash,
    rendered.outputLocation,
  );
  console.log("STORAGE_BUCKET=" + VIDEO_BUCKET);
  console.log("STORAGE_UPLOAD=true path=" + stored.storagePath);
  console.log("SIGNED_URL=" + (stored.signedUrl ? "true" : "false"));

  console.log("\n=== RÉSUMÉ MANDATOIRE ===");
  console.log("RENDER_EXECUTED=true");
  console.log("MP4_EXISTS=" + (size > 0));
  console.log("MP4_SIZE=" + size);
  console.log("MIME=" + mime);
  console.log("STORAGE_UPLOAD=true");
  console.log("SIGNED_URL=" + (stored.signedUrl ? "true" : "false"));
  console.log("PLAYBACK_CHECK=VIA_SIGNED_URL");
}

main().catch((err) => {
  console.error("VERIFY_RENDER_ERROR " + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});