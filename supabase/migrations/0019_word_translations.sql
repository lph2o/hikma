-- Hikma — word_translations (lexique Hikma : traductions éditoriales).
--
-- Phase 7 (Voie B) : canal de traduction LEXICALE française produit et
-- validé par l'équipe Hikma, strictement séparé de :
--   - quran_words.meaning      : glosses anglaises externes (Quran.com) — inchangé ;
--   - translations             : traductions de VERSET (Hamidullah) — inchangé.
--
-- Workflow éditorial obligatoire (garanti par la base, pas seulement le code) :
--   PROPOSED  → is_validated = false, validated_at IS NULL
--   VALIDATED → is_validated = true,  validated_at IS NOT NULL
-- Seules les lignes VALIDATED sont utilisées comme traduction pédagogique
-- principale. Aucune traduction n'est validée automatiquement.

create table if not exists public.word_translations (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.quran_words (id) on delete cascade,
  language text not null check (language in ('fr', 'en')),
  text text not null check (btrim(text) <> ''),
  source_id uuid not null references public.sources (id),
  is_validated boolean not null default false,
  validated_at timestamptz,
  editorial_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Invariant de validation : proposé ⇔ validated_at NULL, validé ⇔ horodaté.
  constraint word_translations_validation_check check (
    (is_validated = false and validated_at is null)
    or
    (is_validated = true and validated_at is not null)
  ),
  -- Doublon impossible pour un même mot, une même langue, une même source.
  constraint word_translations_word_lang_source_key unique (word_id, language, source_id)
);

create index if not exists word_translations_word_lang_idx
  on public.word_translations (word_id, language);
create index if not exists word_translations_validated_idx
  on public.word_translations (is_validated);
create index if not exists word_translations_source_idx
  on public.word_translations (source_id);

comment on table public.word_translations is
  'Traductions lexicales Hikma (éditoriales). PROPOSED vs VALIDATED ; seules les lignes validées sont actives pédagogiquement.';

-- Source éditoriale Hikma (idempotent). La provenance est obligatoire :
-- source_id NOT NULL + FK sans ON DELETE SET NULL.
insert into public.sources (name, type, url, version, license, metadata)
values (
  'Hikma — lexique éditorial',
  'editorial',
  null,
  '1',
  'Données originales Hikma — production interne',
  jsonb_build_object(
    'workflow', 'proposed → validated',
    'validation', 'validation humaine obligatoire'
  )
)
on conflict (name, version) do nothing;

alter table public.word_translations enable row level security;

-- Lecture publique (comme quran_words / lemmas). AUCUNE policy d'écriture :
-- INSERT / UPDATE / DELETE sont refusés pour tous les rôles applicatifs
-- (seul le service role écrit, via les scripts d'édition dédiés).
create policy "word_translations_read"
  on public.word_translations
  for select
  using (true);
