-- Hikma — lemma_translations (gloses lexicographiques AU NIVEAU DU LEMME).
--
-- Phase 17C-A (Option B retenue) : Kazimirski 1860 (et futurs dictionnaires)
-- fournissent une glose attachée à une ENTRÉE LEXICALE / LEMME, pas à une
-- forme fléchie. `word_translations` (migration 0019) reste la traduction AU
-- NIVEAU DE LA FORME (word_id → quran_words) et n'est PAS modifiée.
-- `lemma_translations` en est le miroir AU NIVEAU DU LEMME (lemma_id → lemmas).
--
-- Workflow éditorial identique à word_translations (invariant garanti par la base) :
--   PROPOSED  → is_validated = false, validated_at IS NULL
--   VALIDATED → is_validated = true,  validated_at IS NOT NULL
--
-- Provenance : source_id NOT NULL (édition / référence / scan → table `sources`
-- dont le champ jsonb `metadata` peut porter l'identifiant du scan). La page et
-- le statut de vérification scan sont conservés dans `editorial_notes` (texte
-- libre) — même convention que `word_translations.editorial_notes`.
--
-- Migration MINIMALE, ADDITIVE, NON DESTRUCTIVE, IDEMPOTENTE. Aucune écriture
-- de données : la ligne `sources` Kazimirski sera créée lors de la phase
-- d'import (17C), avec son statut de licence documenté.

create table if not exists public.lemma_translations (
  id uuid primary key default gen_random_uuid(),
  lemma_id uuid not null references public.lemmas (id) on delete cascade,
  language text not null check (language in ('fr', 'en')),
  text text not null check (btrim(text) <> ''),
  source_id uuid not null references public.sources (id),
  is_validated boolean not null default false,
  validated_at timestamptz,
  editorial_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Invariant de validation : proposé ⇔ validated_at NULL, validé ⇔ horodaté.
  constraint lemma_translations_validation_check check (
    (is_validated = false and validated_at is null)
    or
    (is_validated = true and validated_at is not null)
  ),
  -- Doublon impossible pour un même lemme, une même langue, une même source.
  constraint lemma_translations_lemma_lang_source_key unique (lemma_id, language, source_id)
);

create index if not exists lemma_translations_lemma_lang_idx
  on public.lemma_translations (lemma_id, language);
create index if not exists lemma_translations_validated_idx
  on public.lemma_translations (is_validated);
create index if not exists lemma_translations_source_idx
  on public.lemma_translations (source_id);

comment on table public.lemma_translations is
  'Gloses lexicographiques au niveau du LEMME (Kazimirski 1860 et futurs dictionnaires). PROPOSED vs VALIDATED ; seules les lignes validées sont actives pédagogiquement.';

alter table public.lemma_translations enable row level security;

-- Lecture publique. Aucune policy d'écriture : INSERT / UPDATE / DELETE sont
-- refusés pour tous les rôles applicatifs (seul le service role écrit).
create policy "lemma_translations_read"
  on public.lemma_translations
  for select
  using (true);
