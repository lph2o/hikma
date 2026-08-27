-- Hikma — Phase B1 : CONTENT REGISTRY (Content Studio).
--
-- Registre éditorial des contenus sociaux générés depuis la Content API V1.
-- Règles :
--   - `content_key` = identifiant DÉTERMINISTE (sha256-v1, gelé B3/Phase A) ;
--     unique ⇒ deux générations du même contenu ne créent jamais deux lignes ;
--   - `payload` = payload contractuel V1 complet (RevealPayloadV1 / QuizPayloadV1),
--     stocké tel quel (aucune donnée re-calculée à la lecture) ;
--   - `sources` / `licenses` = instantanés de traçabilité et de licence au
--     moment de la génération (jamais re-dérivés ensuite) ;
--   - statuts éditoriaux : DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED,
--     + REJECTED / ARCHIVED / EXPORTED. Les TRANSITIONS sont validées au niveau
--     du service (workflow.ts) ; le CHECK ci-dessous ne verrouille que l'ensemble
--     des statuts autorisés.
--   - aucun contenu de type `FREQUENCY_FACT_V1` n'est générable en V1 (pas de
--     builder contractuel) — le CHECK conserve le template dans l'enum gelé.
--
-- SÉCURITÉ : RLS ACTIVÉE avec ZÉRO policy. Ce registre est INTERNE (aucune
-- donnée utilisateur, aucun accès client) : anon / authenticated ne peuvent ni
-- lire ni écrire. Seul le client serveur dédié (service_role, côté serveur
-- uniquement, jamais importé côté client) accède à la table — même pattern que
-- `hikma_migrations` (écrite par le runner de migrations via la Management API).
--
-- Migration MINIMALE, ADDITIVE, IDEMPOTENTE. Aucune écriture de données.

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique
    check (content_key ~ '^[0-9a-f]{64}$'),
  template_key text not null
    check (template_key in ('WORD_QUIZ_V1', 'WORD_REVEAL_V1', 'FREQUENCY_FACT_V1')),
  template_version text not null default '1',
  language text not null default 'fr'
    check (language = 'fr'),
  word_id uuid not null references public.quran_words (id) on delete cascade,
  hook_variant_id text not null,
  cta_id text,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'EXPORTED')),
  -- Version du CONTENU : incrémentée à chaque modification substantielle du
  -- payload. Un ancien rendu n'est jamais associé à une nouvelle version.
  version integer not null default 1
    check (version >= 1),
  -- Statut de RENDU (indépendant du statut éditorial) : un contenu approuvé
  -- n'est pas forcément rendu ; une vidéo rendue n'est pas forcément publiée.
  render_status text not null default 'NOT_RENDERED'
    check (render_status in ('NOT_RENDERED', 'RENDERING', 'RENDERED', 'FAILED')),
  rendered_at timestamptz,
  render_error text,
  render_path text,
  payload jsonb not null default '{}'::jsonb,
  sources jsonb not null default '{}'::jsonb,
  licenses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_status_idx
  on public.content_items (status, updated_at desc);
create index if not exists content_items_word_idx
  on public.content_items (word_id);

comment on table public.content_items is
  'Registre éditorial Content Studio. content_key unique (sha256-v1) ⇒ idempotence ; statuts DRAFT/REVIEW/APPROVED/SCHEDULED/PUBLISHED/REJECTED/ARCHIVED/EXPORTED ; payload + instantanés sources/licenses. Accès serveur uniquement (RLS, zéro policy).';

comment on column public.content_items.content_key is
  'SHA-256 v1 (gelé) : wordId|templateKey|templateVersion|hookVariantId|language. Unique — clé d''idempotence.';

comment on column public.content_items.status is
  'Statut éditorial. Les transitions sont validées par lib/content-studio/workflow.ts (DRAFT→PUBLISHED et REVIEW→PUBLISHED interdits sans APPROVED).';

comment on column public.content_items.version is
  'Version du contenu (incrémentée à chaque modification substantielle du payload). Le rendu enregistré correspond à la version courante.';

comment on column public.content_items.render_status is
  'Statut de rendu vidéo (NOT_RENDERED/RENDERING/RENDERED/FAILED), indépendant du statut éditorial. PUBLISHED exige render_status = RENDERED.';

comment on column public.content_items.render_path is
  'Chemin de l''export MP4 rendu (stockage). null tant que non rendu.';

comment on column public.content_items.payload is
  'Payload contractuel V1 complet généré par la Content API (jamais re-dérivé à la lecture).';

comment on column public.content_items.sources is
  'Instantané SourcesBlock (sourceRowId réels, TASK A1) au moment de la génération.';

comment on column public.content_items.licenses is
  'Instantané LicensesBlock au moment de la génération (audio DISABLED, verseTranslation REVIEW_REQUIRED en V1).';

alter table public.content_items enable row level security;

-- Aucune policy : accès serveur uniquement (service_role via le client dédié
-- lib/content-studio/client.ts ; Management API pour les migrations).
