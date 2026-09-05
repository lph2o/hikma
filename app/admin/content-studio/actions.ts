"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/content-studio/admin";
import { ContentStudioService } from "@/lib/content-api/service";
import { getContentStudioClient } from "@/lib/content-api/client";
import { ContentGenerationService } from "@/lib/content-studio/generate";
import { ContentRegistryService } from "@/lib/content-studio/registry";
import { getContentStudioDbClient } from "@/lib/content-studio/client";
import { isGeneratableTemplate } from "@/lib/content-studio/types";
import {
  sanitizeEditorGraphics,
  sanitizeEditorScenes,
} from "@/lib/content-studio/editor/state";

const STUDIO_PATH = "/admin/content-studio";

/** Garde admin ré-exécutée dans CHAQUE action (jamais fiée au rendu). */
async function requireAdmin(): Promise<void> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/");
}

export type SaveEditorResult =
  | { ok: true; savedAt: string }
  | { ok: false; reason: string };

/**
 * Sauvegarde la couche d'édition vidéo (montage) d'un contenu.
 * Valide le pipeline complet : admin → contenu existant → scènes sanitizées.
 * NE redirige PAS (le client garde son état local) : rend un résultat sérialisable
 * pour afficher Saved ✓ / FAILED + Retry sans navigation ni perte d'édition.
 * N'écrit JAMAIS dans le payload contractuel (données Quran read-only).
 */
export async function saveEditorState(formData: FormData): Promise<SaveEditorResult> {
  await requireAdmin();
  const contentKey = String(formData.get("contentKey") ?? "").trim();
  const raw = formData.get("scenes");
  if (!contentKey || raw === null) return { ok: false, reason: "INVALID_REQUEST" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    return { ok: false, reason: "EDIT_BAD_JSON" };
  }
  const { scenes, reason } = sanitizeEditorScenes(parsed);
  if (!scenes) return { ok: false, reason: `EDIT_REJECTED:${reason}` };

  // Clips graphiques (additifs, optionnels) — sanitization stricte aussi.
  const rawGraphics = formData.get("graphics");
  let graphics: unknown;
  if (rawGraphics !== null) {
    try {
      graphics = JSON.parse(String(rawGraphics));
    } catch {
      return { ok: false, reason: "EDIT_BAD_JSON_GRAPHICS" };
    }
  }
  const sanitizedGraphics =
    graphics === undefined ? undefined : sanitizeEditorGraphics(graphics);
  if (sanitizedGraphics && !sanitizedGraphics.graphics) {
    return { ok: false, reason: `EDIT_REJECTED:${sanitizedGraphics.reason}` };
  }

  try {
    const registry = new ContentRegistryService(getContentStudioDbClient());
    await registry.updateEditorState(contentKey, {
      scenes,
      ...(sanitizedGraphics ? { graphics: sanitizedGraphics.graphics } : {}),
    });
    revalidatePath(STUDIO_PATH);
    return { ok: true, savedAt: new Date().toISOString() };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "ERREUR" };
  }
}

/** Recherche de mots candidats pour la création vidéo (arabe, translittération, sens français). */
export async function searchWordsAction(query = ""): Promise<import("@/lib/content-api/types").WordCandidateItem[]> {
  await requireAdmin();
  const service = new ContentStudioService(getContentStudioClient());
  const res = await service.listWordCandidates({ query, limit: 30 });
  return res.items;
}

export type CreateVideoDraftResult =
  | { ok: true; contentKey: string }
  | { ok: false; reason: string };

/** Crée un nouveau draft vidéo à partir du mot sélectionné et renvoie la clé de contenu. */
export async function createVideoDraft(params: {
  wordId: string;
  templateKey: import("@/lib/content-studio/types").GeneratableTemplateKey;
}): Promise<CreateVideoDraftResult> {
  await requireAdmin();
  const { wordId, templateKey } = params;
  if (!wordId || !isGeneratableTemplate(templateKey)) {
    return { ok: false, reason: "Paramètres de création invalides." };
  }
  try {
    const generator = new ContentGenerationService(
      new ContentStudioService(getContentStudioClient()),
      new ContentRegistryService(getContentStudioDbClient()),
    );
    const outcome = await generator.generate({ wordId, templateKey });
    if (outcome.status === "REJECTED") {
      return { ok: false, reason: `${outcome.code}: ${outcome.message}` };
    }
    revalidatePath(STUDIO_PATH);
    return { ok: true, contentKey: outcome.item.contentKey };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Erreur inattendue lors de la création.",
    };
  }
}

/** Génère un draft depuis un formulaire standard (rétro-compatibilité). */
export async function generateDraft(formData: FormData): Promise<void> {
  await requireAdmin();
  const wordId = String(formData.get("wordId") ?? "").trim();
  const templateKey = String(formData.get("templateKey") ?? "").trim();

  if (wordId.length === 0 || !isGeneratableTemplate(templateKey)) {
    redirect(`${STUDIO_PATH}?msg=INVALID_REQUEST`);
  }
  try {
    const generator = new ContentGenerationService(
      new ContentStudioService(getContentStudioClient()),
      new ContentRegistryService(getContentStudioDbClient()),
    );
    const outcome = await generator.generate({ wordId, templateKey });
    if (outcome.status === "REJECTED") {
      redirect(`${STUDIO_PATH}?msg=${encodeURIComponent(`${outcome.code}: ${outcome.message}`)}`);
    }
    revalidatePath(STUDIO_PATH);
    redirect(`${STUDIO_PATH}?contentKey=${encodeURIComponent(outcome.item.contentKey)}`);
  } catch (error) {
    redirect(
      `${STUDIO_PATH}?msg=${encodeURIComponent(error instanceof Error ? error.message : "ERREUR")}`,
    );
  }
}

/** Transition éditoriale (validée par workflow.ts ; PUBLISHED exige RENDERED). */
export async function transition(formData: FormData): Promise<void> {
  await requireAdmin();
  const contentKey = String(formData.get("contentKey") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (contentKey.length === 0 || status.length === 0) {
    redirect(`${STUDIO_PATH}?msg=INVALID_REQUEST`);
  }
  try {
    const registry = new ContentRegistryService(getContentStudioDbClient());
    await registry.setStatus(contentKey, status as Parameters<ContentRegistryService["setStatus"]>[1]);
    revalidatePath(STUDIO_PATH);
    redirect(`${STUDIO_PATH}?msg=STATUS:${status}`);
  } catch (error) {
    redirect(
      `${STUDIO_PATH}?msg=${encodeURIComponent(error instanceof Error ? error.message : "ERREUR")}`,
    );
  }
}

export type DeleteVideoResult =
  | { ok: true; contentKey: string }
  | { ok: false; reason: string };

/**
 * Supprime un draft / vidéo générée et ses assets associés après confirmation.
 * Authentifié admin, idempotent et sécurisé.
 */
export async function deleteVideoContentAction(contentKeyInput: string): Promise<DeleteVideoResult> {
  await requireAdmin();
  const contentKey = String(contentKeyInput ?? "").trim();
  if (!contentKey) return { ok: false, reason: "Clé de contenu requise." };

  try {
    const registry = new ContentRegistryService(getContentStudioDbClient());
    await registry.deleteItem(contentKey);
    revalidatePath(STUDIO_PATH);
    return { ok: true, contentKey };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Erreur lors de la suppression de la vidéo.",
    };
  }
}
