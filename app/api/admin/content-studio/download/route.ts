// Hikma — Content Studio : Route de téléchargement forcé de la vidéo MP4.
//
// GET /api/admin/content-studio/download?contentKey=...
//
// Redirige (307) vers l'URL signée Supabase Storage avec Content-Disposition: attachment.
// Garantit que le navigateur mobile ou desktop télécharge le fichier MP4 au lieu de
// l'ouvrir en streaming dans le lecteur web.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/content-studio/admin";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { signedUrlForVideo } from "@/lib/content-studio/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdminEmail(): Promise<boolean> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return Boolean(user && isAdminEmail(user.email));
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
  if (!item || !item.renderPath || item.renderStatus !== "RENDERED") {
    return NextResponse.json(
      { error: { code: "NOT_RENDERED", message: "Vidéo non disponible ou pas encore rendue." } },
      { status: 404 },
    );
  }

  const filename = `${item.templateKey}-${item.contentKey.slice(0, 8)}.mp4`;
  const downloadUrl = await signedUrlForVideo(item.renderPath, { download: filename });
  if (!downloadUrl) {
    return NextResponse.json(
      { error: { code: "SIGN_FAILED", message: "Impossible de générer l'URL de téléchargement." } },
      { status: 500 },
    );
  }

  return NextResponse.redirect(downloadUrl, 307);
}
