// Hikma — Content Studio (Phase G) : ROUTE DE RENDU VIDÉO (admin, Node).
//
//   POST /api/admin/content-studio/render  { contentKey }
//
// Pipeline réel (G6) :
//   content_items → effectiveScenes (dérivé + overrides editor_state)
//                 → Remotion bundle + renderMedia (1080×1920 @ 30fps)
//                 → upload bucket STORAGE persistant (hikma-video)
//                 → registre : render_status = RENDERED, render_path = path stocké
//
// États : NOT_RENDERED → RENDERING → RENDERED / FAILED.
// Garde : session Supabase + isAdminEmail (jamais le CONTENT_API_TOKEN).
// Runtime : nodejs (Chrome headless + ffmpeg ne tournent pas en Edge).
//
// Chaque modification du montage (editor_state) a invalidé le rendu précédent
// (updateEditorState → NOT_RENDERED) : la route re-rend donc toujours avec les
// scènes EFFECTIVES à jour — jamais un MP4 obsolète présenté comme courant.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/content-studio/admin";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { renderEffectiveVideoToFile, renderTargets } from "@/lib/content-studio/render";
import { uploadRenderedVideo } from "@/lib/content-studio/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // rendu longue durée (bundle + encode + upload)

async function requireAdminEmail(): Promise<boolean> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return Boolean(user && isAdminEmail(user.email));
}

export async function POST(request: Request): Promise<Response> {
  if (!(await requireAdminEmail())) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Accès refusé." } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { contentKey?: unknown } | null;
  const contentKey = typeof body?.contentKey === "string" ? body.contentKey.trim() : "";
  if (!contentKey) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "contentKey requis" } },
      { status: 400 },
    );
  }

  const registry = new ContentRegistryService(getContentStudioDbClient());
  let item;
  try {
    item = await registry.getByContentKey(contentKey);
  } catch (error) {
    return NextResponse.json(
      { error: { code: "REGISTRY_ERROR", message: error instanceof Error ? error.message : "Erreur registre" } },
      { status: 500 },
    );
  }
  if (!item || item.templateKey === "FREQUENCY_FACT_V1") {
    return NextResponse.json(
      { error: { code: "CONTENT_NOT_FOUND", message: "Contenu introuvable ou non vidéo-able" } },
      { status: 404 },
    );
  }

  try {
    await registry.setRenderStatus(item.contentKey, "RENDERING");
  } catch {
    // Non bloquant : on tente le rendu quand même.
  }

  let localRendered;
  try {
    localRendered = await renderEffectiveVideoToFile(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de rendu (encode/bundle)";
    await registry.setRenderStatus(item.contentKey, "FAILED", { renderError: message }).catch(() => {});
    return NextResponse.json({ error: { code: "RENDER_FAILED", message } }, { status: 500 });
  }

  if (localRendered.status === "REJECTED") {
    await registry
      .setRenderStatus(item.contentKey, "FAILED", { renderError: `${localRendered.code}: ${localRendered.message}` })
      .catch(() => {});
    return NextResponse.json({ error: { code: localRendered.code, message: localRendered.message } }, { status: 422 });
  }

  // Persiste le MP4 dans Supabase Storage (jamais le filesystem local).
  try {
    const { storagePath, signedUrl, sizeBytes } = await uploadRenderedVideo(
      item.contentKey,
      item.version,
      localRendered.effectiveHash,
      localRendered.outputLocation,
    );
    await registry.setRenderStatus(item.contentKey, "RENDERED", { renderPath: storagePath }).catch(() => {});

    return NextResponse.json({
      renderStatus: "RENDERED",
      storagePath,
      signedUrl,
      previewUrl: signedUrl,
      durationInFrames: localRendered.durationInFrames,
      width: localRendered.width,
      height: localRendered.height,
      fps: renderTargets(item).fps,
      effectiveHash: localRendered.effectiveHash,
      sizeBytes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur d'upload Storage";
    await registry.setRenderStatus(item.contentKey, "FAILED", { renderError: message }).catch(() => {});
    return NextResponse.json({ error: { code: "STORAGE_UPLOAD_FAILED", message } }, { status: 500 });
  }
}