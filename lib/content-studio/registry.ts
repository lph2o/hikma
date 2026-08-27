// Hikma — Content Studio (B2/B5) : SERVICE REGISTRE.
//
// Responsabilités minimales :
//   - upsert IDEMPOTENT par contentKey (jamais deux lignes pour le même contenu) ;
//   - lecture par contentKey / liste filtrée par statut ;
//   - transitions de statut éditorial validées par workflow.ts (approval
//     obligatoire : DRAFT→PUBLISHED et REVIEW→PUBLISHED interdits) ;
//   - versioning : toute modification substantielle du payload incrémente la
//     version ET exige une nouvelle validation si le contenu était engagé ;
//   - statut de rendu vidéo (NOT_RENDERED → RENDERING → RENDERED/FAILED).
//
// AUCUNE logique métier du learning engine n'est déplacée ici. Aucun accès
// client : ce service s'exécute uniquement côté serveur.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertTransition,
  canExport,
  requiresReapproval,
} from "./workflow";
import { deleteRenderedVideoAssets } from "./storage";
import type {
  ContentItemInput,
  ContentItemRow,
  ContentItemStatus,
  ContentItemsPage,
  ContentStudioItem,
  ListContentItemsParams,
  RegistryUpsertResult,
  RenderStatus,
} from "./types";

function toItem(row: ContentItemRow): ContentStudioItem {
  return {
    id: row.id,
    contentKey: row.content_key,
    templateKey: row.template_key,
    templateVersion: row.template_version,
    language: row.language,
    wordId: row.word_id,
    hookVariantId: row.hook_variant_id,
    ctaId: row.cta_id,
    status: row.status,
    version: row.version,
    renderStatus: row.render_status,
    renderedAt: row.rendered_at,
    renderError: row.render_error,
    renderPath: row.render_path,
    payload: row.payload,
    sources: row.sources,
    licenses: row.licenses,
    editorState: row.editor_state ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ContentRegistryService {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Upsert IDEMPOTENT : si le content_key existe déjà, retourne la ligne
   * existante SANS modifier son statut/version (created = false). Sinon crée
   * la ligne en DRAFT (created = true).
   */
  async upsert(input: ContentItemInput): Promise<RegistryUpsertResult> {
    const existing = await this.getByContentKey(input.contentKey);
    if (existing) return { item: existing, created: false };

    const row = {
      content_key: input.contentKey,
      template_key: input.templateKey,
      template_version: input.templateVersion,
      language: input.language,
      word_id: input.wordId,
      hook_variant_id: input.hookVariantId,
      cta_id: input.ctaId,
      status: "DRAFT" as ContentItemStatus,
      version: 1,
      render_status: "NOT_RENDERED" as RenderStatus,
      rendered_at: null,
      render_error: null,
      render_path: null,
      payload: input.payload,
      sources: input.sources,
      licenses: input.licenses,
    };

    // `ignoreDuplicates: true` + onConflict content_key : si la ligne existe
    // déjà, RIEN n'est inséré et `.select()` ne retourne aucune ligne — on
    // relit alors l'existante (created = false). Idempotent et atomique.
    const { data, error } = await this.client
      .from("content_items")
      .upsert(row, { onConflict: "content_key", ignoreDuplicates: true })
      .select()
      .maybeSingle();
    if (error) throw new Error(`content_items upsert : ${error.message}`);
    if (data) return { item: toItem(data as ContentItemRow), created: true };

    // Concurrence : un autre processus a créé la ligne entre-temps → on la lit.
    const winner = await this.getByContentKey(input.contentKey);
    if (!winner) throw new Error("content_items : ligne introuvable après upsert");
    return { item: winner, created: false };
  }

  async getByContentKey(contentKey: string): Promise<ContentStudioItem | null> {
    const { data, error } = await this.client
      .from("content_items")
      .select("*")
      .eq("content_key", contentKey)
      .maybeSingle();
    if (error) throw new Error(`content_items get : ${error.message}`);
    return data ? toItem(data as ContentItemRow) : null;
  }

  async getById(id: string): Promise<ContentStudioItem | null> {
    const { data, error } = await this.client
      .from("content_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`content_items get : ${error.message}`);
    return data ? toItem(data as ContentItemRow) : null;
  }

  async list(params: ListContentItemsParams = {}): Promise<ContentItemsPage> {
    const limit = Math.min(Math.max(Math.trunc(params.limit ?? 50), 1), 100);
    const offset = Math.max(Math.trunc(params.offset ?? 0), 0);

    let query = this.client
      .from("content_items")
      .select("*", { count: "exact" });
    if (params.status) query = query.eq("status", params.status);
    query = query.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(`content_items list : ${error.message}`);
    const items = ((data ?? []) as ContentItemRow[]).map(toItem);
    return { items, total: count ?? items.length, limit, offset };
  }

  /**
   * Transition éditoriale validée par la machine à états (workflow.ts).
   * Garde supplémentaire : PUBLISHED exige un rendu RENDERED (jamais une vidéo
   * non rendue présentée comme publiée).
   */
  async setStatus(contentKey: string, next: ContentItemStatus): Promise<ContentStudioItem> {
    const item = await this.getByContentKey(contentKey);
    if (!item) throw new Error("CONTENT_NOT_FOUND");
    assertTransition(item.status, next);
    if (next === "PUBLISHED" && item.renderStatus !== "RENDERED") {
      throw new Error("RENDER_REQUIRED: PUBLISHED exige render_status = RENDERED");
    }
    const { data, error } = await this.client
      .from("content_items")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("content_key", contentKey)
      .select()
      .maybeSingle();
    if (error) throw new Error(`content_items update : ${error.message}`);
    if (!data) throw new Error("CONTENT_NOT_FOUND");
    return toItem(data as ContentItemRow);
  }

  /**
   * Modification substantielle du payload : incrémente la version, reset le
   * rendu (le rendu enregistré ne correspond plus à la version courante) et
   * repasse à DRAFT si le contenu était engagé (APPROVED/SCHEDULED/EXPORTED/
   * PUBLISHED) — nouvelle validation obligatoire.
   */
  async updatePayload(
    contentKey: string,
    patch: Pick<ContentItemInput, "payload" | "sources" | "licenses">,
  ): Promise<ContentStudioItem> {
    const item = await this.getByContentKey(contentKey);
    if (!item) throw new Error("CONTENT_NOT_FOUND");

    const nextStatus: ContentItemStatus = requiresReapproval(item.status) ? "DRAFT" : item.status;
    const nextVersion = item.version + 1;

    const { data, error } = await this.client
      .from("content_items")
      .update({
        payload: patch.payload,
        sources: patch.sources,
        licenses: patch.licenses,
        version: nextVersion,
        status: nextStatus,
        render_status: "NOT_RENDERED",
        rendered_at: null,
        render_error: null,
        render_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("content_key", contentKey)
      .select()
      .maybeSingle();
    if (error) throw new Error(`content_items update payload : ${error.message}`);
    if (!data) throw new Error("CONTENT_NOT_FOUND");
    return toItem(data as ContentItemRow);
  }

  // -------------------------------------------------------------------------
  // Couche d'édition vidéo (Phase F) — montage édité (durées, textes de scène)
  // -------------------------------------------------------------------------

  /**
   * Modifie la couche d'édition (editor_state) SANS toucher au payload contractuel.
   * Toute modification du montage rend le rendu précédent OBSOLÈTE : on reset
   * render_status → NOT_RENDERED (plus jamais un ancien MP4 présenté comme
   * actuel tant que le studio n'a pas re-rendu avec les scènes effectives).
   */
  async updateEditorState(
    contentKey: string,
    editorState: Record<string, unknown>,
  ): Promise<ContentStudioItem> {
    const item = await this.getByContentKey(contentKey);
    if (!item) throw new Error("CONTENT_NOT_FOUND");
    const { data, error } = await this.client
      .from("content_items")
      .update({
        editor_state: editorState,
        render_status: "NOT_RENDERED" as RenderStatus,
        rendered_at: null,
        render_error: null,
        render_path: null,
        updated_at: new Date().toISOString(),
      })
      .eq("content_key", contentKey)
      .select()
      .maybeSingle();
    if (error) throw new Error(`content_items update editor_state : ${error.message}`);
    if (!data) throw new Error("CONTENT_NOT_FOUND");
    return toItem(data as ContentItemRow);
  }

  /** Réinitialise la couche d'édition (revient au montage déterministe). */
  async clearEditorState(contentKey: string): Promise<ContentStudioItem> {
    return this.updateEditorState(contentKey, null as unknown as Record<string, unknown>);
  }

  // -------------------------------------------------------------------------
  // Statut de RENDU (indépendant de l'éditorial)
  // -------------------------------------------------------------------------

  async setRenderStatus(
    contentKey: string,
    renderStatus: RenderStatus,
    fields?: { renderPath?: string | null; renderError?: string | null },
  ): Promise<ContentStudioItem> {
    const item = await this.getByContentKey(contentKey);
    if (!item) throw new Error("CONTENT_NOT_FOUND");
    const { data, error } = await this.client
      .from("content_items")
      .update({
        render_status: renderStatus,
        rendered_at: renderStatus === "RENDERED" ? new Date().toISOString() : item.renderedAt,
        render_error: fields?.renderError ?? null,
        render_path: fields?.renderPath ?? item.renderPath,
        updated_at: new Date().toISOString(),
      })
      .eq("content_key", contentKey)
      .select()
      .maybeSingle();
    if (error) throw new Error(`content_items render : ${error.message}`);
    if (!data) throw new Error("CONTENT_NOT_FOUND");
    return toItem(data as ContentItemRow);
  }

  /** Export autorisé ? (délègue la règle à workflow.ts). */
  isExportAllowed(item: ContentStudioItem): boolean {
    return canExport(item.status);
  }

  /**
   * Supprime un contenu et ses assets vidéo générés associés :
   * 1. Supprime les fichiers dans le bucket 'hikma-video' (<contentKey>/...)
   * 2. Supprime l'enregistrement dans la table 'content_items'
   * Ne touche JAMAIS aux sources Quran partagées ('word_audio', etc.).
   */
  async deleteItem(contentKey: string): Promise<{ success: boolean; deletedKey: string }> {
    const item = await this.getByContentKey(contentKey);
    if (!item) throw new Error("CONTENT_NOT_FOUND");

    // 1. Suppression des assets générés dans Storage
    await deleteRenderedVideoAssets(item.contentKey, item.renderPath, this.client);

    // 2. Suppression de l'enregistrement DB
    const { error } = await this.client
      .from("content_items")
      .delete()
      .eq("content_key", contentKey);

    if (error) throw new Error(`content_items delete : ${error.message}`);
    return { success: true, deletedKey: contentKey };
  }
}
