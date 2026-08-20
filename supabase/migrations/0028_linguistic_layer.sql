-- Hikma — couche linguistique profonde (Phase 24F).
--
-- ⚠️ MIGRATION PRÉPARÉE — APPLICATION SUSPENDUE À L'APPROBATION HUMAINE.
--   Phase 24F = design + DRY-RUN + décision (A — READY_FOR_ISOLATED_LINGUISTIC_IMPORT).
--   Ne pas appliquer tant que le workflow projet n'a pas explicitement autorisé
--   l'import isolé (Phase suivante 24G proposée).
--
-- OBJECTIF : couche LINGUISTIQUE isolée, ADDITIVE, SÉPARÉE du modèle lexical
-- existant. Elle NE modifie NI quran_words, NI word_occurrences, NI lemmas,
-- NI word_translations / lemma_translations / word_lemma_mapping, NI le runtime
-- (FORME → LEMME → EN fallback), NI HikmaExplanation actuel.
--
-- Principe de rattachement :
--   quran_words (identité lexicale Hikma)
--     → word_occurrences (occurrence réelle dans le Coran)
--         → linguistic_occurrences (analyse linguistique 1:1 d'une occurrence)
--             → linguistic_segments (segmentation MASAQ : préfixe/Stem/suffixe)
--               → linguistic_lemmas / linguistic_roots (futur, sources externes)
--
-- Source MASAQ (provenance obligatoire) :
--   row `sources` de type 'linguistic' créée par le script d'import (pas ici).
--   name='MASAQ', version='v2', doi 10.17632/9yvrzxktmr.2, licence CC BY
--   (3.0 page / 4.0 DataCite), checksum SHA-256 777d0cc8…a900.
--
-- RÉVERSIBILITÉ : toute la couche est supprimable (DROP des 4 tables) sans
-- toucher au corpus pédagogique. Aucune donnée lexicale éditoriale modifiée.
--
-- IDEMPOTENCE : UNIQUE(source_id, source_record_id) sur linguistic_occurrences.
--
-- RLS : lecture publique (comme le reste du corpus), AUCUNE policy d'écriture
-- (insertion uniquement par le service role, via script d'import dédié).

-- ---------------------------------------------------------------
-- linguistic_sources : N'EST PAS CRÉÉE — la table `public.sources`
-- (migration 0001) sert déjà de registre de provenance. MASAQ y sera
-- enregistré comme une ligne (type 'linguistic') par le script d'import.
-- ---------------------------------------------------------------

-- 1. Analyse linguistique PAR OCCURRENCE (1:1 par word_occurrence × source)
create table if not exists public.linguistic_occurrences (
  id uuid primary key default gen_random_uuid(),
  word_occurrence_id uuid not null references public.word_occurrences (id) on delete cascade,
  source_id uuid not null references public.sources (id),
  -- identifiant de l'enregistrement dans la source externe (ID de la ligne MASAQ)
  source_record_id text not null,
  -- snapshot d'alignement (jamais clé : la clé est l'occurrence réelle)
  surah_number int not null,
  ayah_number int not null,
  position int not null,
  alignment_status text not null check (alignment_status in (
    'EXACT', 'EXACT_ORTHOGRAPHIC', 'VARIANT_ORTHOGRAPHY_DOCUMENTED', 'AMBIGUOUS'
  )),
  masaq_word text not null,
  masaq_stem text,
  masaq_gloss_en text,
  -- correspondance lemme Hikma ↔ stem MASAQ (documentaire, jamais un mapping)
  hikma_lemma_id uuid references public.lemmas (id) on delete set null,
  lemma_mapping_status text not null default 'UNMAPPED' check (lemma_mapping_status in (
    'EXACT', 'PARTIAL', 'NORMALIZATION_DIFFERENCE', 'LEXICAL_LEVEL_DIFFERENCE', 'UNMAPPED', 'AMBIGUOUS'
  )),
  pos text[] not null default '{}',
  case_mood text[] not null default '{}',
  syntactic_roles text[] not null default '{}',
  -- idempotence : source + enregistrement source (jamais chaîne arabe)
  constraint linguistic_occurrences_dup_key unique (source_id, source_record_id),
  -- une analyse par source par occurrence (non duplicable)
  constraint linguistic_occurrences_occ_source_key unique (word_occurrence_id, source_id),
  -- snapshot cohérent (surah, ayah, position) = l'occurrence réelle
  constraint linguistic_occurrences_sap_key unique (source_id, surah_number, ayah_number, position),
  created_at timestamptz not null default now()
);

create index if not exists linguistic_occurrences_occurrence_idx
  on public.linguistic_occurrences (word_occurrence_id);
create index if not exists linguistic_occurrences_source_idx
  on public.linguistic_occurrences (source_id);

comment on table public.linguistic_occurrences is
  'Couche linguistique (Phase 24F/MASAQ ≤ v2) : analyse 1:1 d''une occurrence réelle. ADDITIVE : ne modifie aucun vocabulaire pédagogique. Idempotent par (source_id, source_record_id).';
comment on column public.linguistic_occurrences.lemma_mapping_status is
  'Documente la correspondance lemme Hikma (forme-surface) ↔ stem MASAQ (lexical nu) — ne crée JAMAIS de mapping.';
comment on column public.linguistic_occurrences.masaq_gloss_en is
  'Gloss EN MASAQ = EXTERNAL_LINGUISTIC_EVIDENCE. Ne devient JAMAIS une glose FR (workflow éditorial obligé).';

alter table public.linguistic_occurrences enable row level security;
create policy "linguistic_occurrences_read"
  on public.linguistic_occurrences
  for select
  using (true);

-- 2. Segments de la forme (préfixe / stem / suffixe) — enfants de l'occurrence
create table if not exists public.linguistic_segments (
  id uuid primary key default gen_random_uuid(),
  linguistic_occurrence_id uuid not null references public.linguistic_occurrences (id) on delete cascade,
  segment_no int not null,
  segment_text text not null,
  morph_type text not null check (morph_type in ('Prefix', 'Stem', 'Suffix')),
  morph_tag text not null,
  segment_kind text not null check (segment_kind in (
    'PARTICLE', 'ARTICLE', 'STEM', 'INFLECTIONAL_SUFFIX', 'PRONOMINAL_SUFFIX', 'OTHER'
  )),
  constraint linguistic_segments_pos_key unique (linguistic_occurrence_id, segment_no),
  created_at timestamptz not null default now()
);

create index if not exists linguistic_segments_occurrence_idx
  on public.linguistic_segments (linguistic_occurrence_id);

comment on table public.linguistic_segments is
  'Segments MASAQ (préfixe/Stem/suffixe) d''une occurrence. Un préfixe DET/PREP/CONJ n''est JAMAIS un mot lexical.';

alter table public.linguistic_segments enable row level security;
create policy "linguistic_segments_read"
  on public.linguistic_segments
  for select
  using (true);

-- 3. Lemmes linguistiques (futur : harmonisation stems MASAQ → lemme de référence)
create table if not exists public.linguistic_lemmas (
  id uuid primary key default gen_random_uuid(),
  lemma_arabic text not null,
  source_id uuid not null references public.sources (id),
  creation_rule text not null default 'masaq_stem',
  confidence text not null default 'review_required' check (confidence in ('safe', 'review_required', 'rejected')),
  notes text,
  constraint linguistic_lemmas_dup_key unique (lemma_arabic, source_id),
  created_at timestamptz not null default now()
);

comment on table public.linguistic_lemmas is
  'Lemmes linguistiques (futur) : harmonisation stems MASAQ → lexemes, AVEC provenance. Vide en 24F.';

alter table public.linguistic_lemmas enable row level security;
create policy "linguistic_lemmas_read"
  on public.linguistic_lemmas
  for select
  using (true);

-- 4. Racines (futur, source externe — Kazimirski/Lane en domaine public)
create table if not exists public.linguistic_roots (
  id uuid primary key default gen_random_uuid(),
  lemma_id uuid references public.linguistic_lemmas (id) on delete cascade,
  root_arabic text not null,
  source_id uuid not null references public.sources (id),
  source_record_id text,
  confidence text not null default 'review_required' check (confidence in ('safe', 'review_required', 'rejected')),
  evidence text,
  notes text,
  constraint linguistic_roots_dup_key unique (source_id, root_arabic, lemma_id),
  created_at timestamptz not null default now()
);

comment on table public.linguistic_roots is
  'Racines (FUTURE WORK) — reliées au lemme linguistique, jamais à une forme de surface arbitraire. AUCUNE donnée en 24F.';

alter table public.linguistic_roots enable row level security;
create policy "linguistic_roots_read"
  on public.linguistic_roots
  for select
  using (true);