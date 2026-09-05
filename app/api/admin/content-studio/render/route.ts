// Hikma — Content Studio (Phase G) : ROUTE DE RENDU VIDÉO (admin, Node).
//
// GET  /api/admin/content-studio/render?contentKey=...
//      → Polling de statut de rendu (NOT_RENDERED, RENDERING, RENDERED, FAILED)
//      → Si RENDERED : renvoie l'URL signée fraîche du MP4 persistant.
//
// POST /api/admin/content-studio/render  { contentKey }
//      → Lance le rendu de la vidéo.
//      → Sur Vercel (production Cloud) : délègue de manière asynchrone au worker Cloud
//        (GitHub Actions dispatch) pour éviter les crashs/timeouts serverless sans Chrome,
//        et renvoie immédiatement { renderStatus: "RENDERING", async: true }.
//      → En local : exécute le rendu synchrone Remotion (ou asynchrone si demandé).
//
// Garde : session Supabase + isAdminEmail.
// Runtime : nodejs.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/content-studio/admin";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { signedUrlForVideo } from "@/lib/content-studio/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdminEmail(): Promise<boolean> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return Boolean(user && isAdminEmail(user.email));
}

async function triggerGitHubRenderAction(contentKey: string): Promise<{ triggered: boolean; error?: string }> {
  const token = process.env.GITHUB_RENDER_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    return { triggered: false, error: "GITHUB_RENDER_TOKEN_MISSING" };
  }
  try {
    const res = await fetch("https://api.github.com/repos/lph2o/hikma/dispatches", {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Hikma-Content-Studio",
      },
      body: JSON.stringify({
        event_type: "render-video",
        client_payload: { contentKey },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { triggered: false, error: `GitHub dispatch failed (${res.status}): ${errText}` };
    }
    return { triggered: true };
  } catch (err) {
    return { triggered: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!(await requireAdminEmail())) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Accès refusé." } }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const contentKey = searchParams.get("contentKey")?.trim();
  if (!contentKey) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "contentKey requis" } },
      { status: 400 },
    );
  }

  const registry = new ContentRegistryService(getContentStudioDbClient());
  const item = await registry.getByContentKey(contentKey).catch(() => null);
  if (!item) {
    return NextResponse.json(
      { error: { code: "CONTENT_NOT_FOUND", message: "Contenu introuvable" } },
      { status: 404 },
    );
  }

  let signedUrl: string | null = null;
  if (item.renderStatus === "RENDERED" && item.renderPath) {
    signedUrl = await signedUrlForVideo(item.renderPath).catch(() => null);
  }

  return NextResponse.json({
    contentKey: item.contentKey,
    version: item.version,
    renderStatus: item.renderStatus,
    renderPath: item.renderPath,
    renderError: item.renderError,
    renderedAt: item.renderedAt,
    signedUrl: signedUrl ?? undefined,
    previewUrl: signedUrl ?? undefined,
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!(await requireAdminEmail())) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Accès refusé." } }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { contentKey?: unknown; async?: boolean } | null;
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
  if (!item) {
    return NextResponse.json(
      { error: { code: "CONTENT_NOT_FOUND", message: "Contenu introuvable" } },
      { status: 404 },
    );
  }

  try {
    await registry.setRenderStatus(item.contentKey, "RENDERING");
  } catch {
    // Non bloquant
  }

  const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  const preferAsync = isVercel || body?.async === true || process.env.ASYNC_RENDER === "1";

  if (preferAsync) {
    // En production Vercel : délégation asynchrone au worker Cloud
    const dispatch = await triggerGitHubRenderAction(item.contentKey);

    return NextResponse.json({
      ok: true,
      renderStatus: "RENDERING",
      async: true,
      workerTriggered: dispatch.triggered,
      message: dispatch.triggered
        ? "Rendu lancé dans le Cloud (GitHub Actions Worker)."
        : "Rendu placé dans la file d'attente (en attente du worker de rendu).",
    });
  }

  // Environnement local uniquement : rendu synchrone via Remotion local
  try {
    const { renderEffectiveVideoToFile, renderTargets } = await import("@/lib/content-studio/render");
    const { uploadRenderedVideo } = await import("@/lib/content-studio/storage");

    const localRendered = await renderEffectiveVideoToFile(item);

    if (localRendered.status === "REJECTED") {
      await registry
        .setRenderStatus(item.contentKey, "FAILED", { renderError: `${localRendered.code}: ${localRendered.message}` })
        .catch(() => {});
      return NextResponse.json(
        { error: { code: localRendered.code, message: localRendered.message } },
        { status: 422 },
      );
    }

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
    const message = error instanceof Error ? error.message : "Erreur de rendu";
    await registry.setRenderStatus(item.contentKey, "FAILED", { renderError: message }).catch(() => {});
    return NextResponse.json({ error: { code: "RENDER_FAILED", message } }, { status: 500 });
  }
}