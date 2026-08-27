// Hikma — Content Studio (Phase B) : TYPES du registre éditorial.
//
// Le registre stocke des contenus générés par la Content API V1 (gelée). Il
// n'invente AUCUNE donnée : `payload` est le payload contractuel complet,
// `sources`/`licenses` en sont des instantanés de traçabilité.
//
// `content_key` (sha256-v1, gelé B3/Phase A) est la clé d'idempotence : deux
// générations du même contenu produisent la même clé ⇒ jamais deux lignes.

/** Statuts éditoriaux du registre (transitions : workflow.ts). */
export type ContentItemStatus =
  | "DRAFT"
  | "REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED"
  | "EXPORTED";

/** Statut de RENDU vidéo — indépendant du statut éditorial. */
export type RenderStatus =
  | "NOT_RENDERED"
  | "RENDERING"
  | "RENDERED"
  | "FAILED";

/** Templates acceptés par le registre (formats vidéo Hikma). */
export type StudioTemplateKey =
  | "WORD_QUIZ_V1"
  | "WORD_REVEAL_V1"
  | "VERSE_DEEP_DIVE_V1"
  | "FREQUENCY_FACT_V1"
  | "SURAH_HIGHLIGHT_V1";

/** Templates générables dans le Content Studio. */
export const GENERATABLE_TEMPLATES = [
  "WORD_REVEAL_V1",
  "WORD_QUIZ_V1",
  "VERSE_DEEP_DIVE_V1",
  "FREQUENCY_FACT_V1",
  "SURAH_HIGHLIGHT_V1",
] as const;
export type GeneratableTemplateKey = (typeof GENERATABLE_TEMPLATES)[number];

export function isGeneratableTemplate(key: string): key is GeneratableTemplateKey {
  return (GENERATABLE_TEMPLATES as readonly string[]).includes(key);
}

/** Ligne du registre (mapping direct de `content_items`). */
export type ContentStudioItem = {
  id: string;
  contentKey: string;
  templateKey: StudioTemplateKey;
  templateVersion: string;
  language: string;
  wordId: string;
  hookVariantId: string;
  ctaId: string | null;
  status: ContentItemStatus;
  /** Version du contenu (incrémentée à chaque modification substantielle). */
  version: number;
  /** Statut de rendu vidéo (indépendant de l'éditorial). */
  renderStatus: RenderStatus;
  renderedAt: string | null;
  renderError: string | null;
  /** Chemin de l'export MP4 (null tant que non rendu). */
  renderPath: string | null;
  /** Payload contractuel V1 (RevealPayloadV1 | QuizPayloadV1), tel quel. */
  payload: Record<string, unknown>;
  /** Instantané SourcesBlock (sourceRowId réels). */
  sources: Record<string, unknown>;
  /** Instantané LicensesBlock. */
  licenses: Record<string, unknown>;
  /** Couche d'édition vidéo (Phase F) — overrides de montage, null = déterministe. */
  editorState: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

/** Ligne brute SQL `content_items` (snake_case). */
export type ContentItemRow = {
  id: string;
  content_key: string;
  template_key: StudioTemplateKey;
  template_version: string;
  language: string;
  word_id: string;
  hook_variant_id: string;
  cta_id: string | null;
  status: ContentItemStatus;
  version: number;
  render_status: RenderStatus;
  rendered_at: string | null;
  render_error: string | null;
  render_path: string | null;
  payload: Record<string, unknown>;
  sources: Record<string, unknown>;
  licenses: Record<string, unknown>;
  editor_state: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/** Données nécessaires à l'upsert idempotent d'un contenu. */
export type ContentItemInput = {
  contentKey: string;
  templateKey: StudioTemplateKey;
  templateVersion: string;
  language: string;
  wordId: string;
  hookVariantId: string;
  ctaId: string | null;
  payload: Record<string, unknown>;
  sources: Record<string, unknown>;
  licenses: Record<string, unknown>;
};

/** Résultat d'une génération/upsert : contenu existant ou nouvellement créé. */
export type RegistryUpsertResult = {
  item: ContentStudioItem;
  /** true si la ligne a été créée ; false si le content_key existait déjà. */
  created: boolean;
};

export type ListContentItemsParams = {
  status?: ContentItemStatus;
  limit?: number;
  offset?: number;
};

export type ContentItemsPage = {
  items: ContentStudioItem[];
  total: number;
  limit: number;
  offset: number;
};
