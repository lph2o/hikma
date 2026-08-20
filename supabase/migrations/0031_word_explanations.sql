-- Hikma — word_explanations (explications pédagogiques de sens, Phase 44B).
--
-- Couche « EXPLICATION DE SENS » : courte formulation pédagogique française qui
-- répond « que signifie réellement ce mot / cette expression dans ce contexte ? ».
-- Elle est STRICTEMENT distincte de :
--   - word_translations      : la GLOSE lexicale (sens apprenable) — inchangée ;
--   - lemma_translations     : gloses au niveau du lemme — inchangées ;
--   - translations           : traductions de VERSET (Hamidullah…) — inchangées ;
--   - editorial_notes        : notes de décision de l'éditeur (jamais du contenu
--                              apprenant) ;
--   - la couche MASAQ        : infrastructure linguistique passive — jamais une
--                              autorité sémantique.
--
-- L'explication est une formulation ORIGINALE et courte de Hikma (25-35 mots
-- recommandés), validée par le workflow éditorial des 4 traductions
-- (Hamidullah FR + Kazimirski FR, contrôles Sahih International EN + Piccardo IT).
-- Aucune traduction protégée n'est reproduite. Une forme PEUT légitimement ne
-- pas avoir d'explication (absence ≠ erreur).
--
-- Workflow éditorial identique à word_translations / lemma_translations :
--   PROPOSED  → is_validated = false, validated_at IS NULL
--   VALIDATED → is_validated = true,  validated_at IS NOT NULL
--
-- word_explanation_contexts : override contextuel OPTIONNEL — utilisé
-- UNIQUEMENT lorsque le sens doit être précisé différemment selon le verset
-- (idiome, polysémie, usage particulier). Une explication générique réutilisable
-- reste dans word_explanations ; le contexte précise, jamais ne contredit.
--
-- Migration MINIMALE, ADDITIVE, NON DESTRUCTIVE, IDEMPOTENTE. Aucune écriture
-- de données pédagogiques existantes.

create table if not exists public.word_explanations (
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
  constraint word_explanations_validation_check check (
    (is_validated = false and validated_at is null)
    or
    (is_validated = true and validated_at is not null)
  ),
  -- Doublon impossible pour un même mot, une même langue, une même source.
  constraint word_explanations_word_lang_source_key unique (word_id, language, source_id)
);

create index if not exists word_explanations_word_lang_idx
  on public.word_explanations (word_id, language);
create index if not exists word_explanations_validated_idx
  on public.word_explanations (is_validated);
create index if not exists word_explanations_source_idx
  on public.word_explanations (source_id);

comment on table public.word_explanations is
  'Explications pédagogiques de sens (éditoriales Hikma). PROPOSED vs VALIDATED ; seules les lignes validées sont affichées. Distinctes des gloses, notes éditoriales et de la couche MASAQ.';

create table if not exists public.word_explanation_contexts (
  id uuid primary key default gen_random_uuid(),
  word_explanation_id uuid not null references public.word_explanations (id) on delete cascade,
  ayah_id uuid not null references public.ayahs (id) on delete cascade,
  text text not null check (btrim(text) <> ''),
  source_id uuid not null references public.sources (id),
  is_validated boolean not null default false,
  validated_at timestamptz,
  editorial_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Invariant de validation identique aux autres couches éditoriales.
  constraint word_explanation_contexts_validation_check check (
    (is_validated = false and validated_at is null)
    or
    (is_validated = true and validated_at is not null)
  ),
  -- Un seul override contextuel par explication et par verset.
  constraint word_explanation_contexts_expl_ayah_key unique (word_explanation_id, ayah_id)
);

create index if not exists word_explanation_contexts_expl_idx
  on public.word_explanation_contexts (word_explanation_id);
create index if not exists word_explanation_contexts_ayah_idx
  on public.word_explanation_contexts (ayah_id);
create index if not exists word_explanation_contexts_validated_idx
  on public.word_explanation_contexts (is_validated);

comment on table public.word_explanation_contexts is
  'Override contextuel optionnel d''une explication pédagogique (par verset). Uniquement lorsque le sens doit être précisé différemment selon le contexte.';

alter table public.word_explanations enable row level security;
alter table public.word_explanation_contexts enable row level security;

-- Lecture publique (comme word_translations / lemma_translations). AUCUNE policy
-- d'écriture : INSERT / UPDATE / DELETE sont refusés pour tous les rôles
-- applicatifs (seul le service role écrit, via les scripts d'édition dédiés).
create policy "word_explanations_read"
  on public.word_explanations
  for select
  using (true);

create policy "word_explanation_contexts_read"
  on public.word_explanation_contexts
  for select
  using (true);
