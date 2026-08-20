-- Hikma — word_lemma_mapping (mapping lexical éditorial FORME → LEMME).
--
-- Phase 21B-C (pilote « Option B » retenue en 21B-B) : table ADDITIVE qui
-- SUPPLEMENTE (ne remplace JAMAIS) `quran_words.lemma_id`.
--
-- Raison d'être : la segmentation word-by-word de Quran.com fusionne les
-- proclitiques (و، ب، ف، ل، ت، ك) et les enclitiques pronominaux (-ي، -كَ، -هم…)
-- dans des unités « mot » distinctes. `quran_words.lemma_id` ne couvre que les
-- formes NUES (135 formes). Cette table permet d'étendre la couverture SANS
-- modifier la table source (provenance Quran.com préservée, réversibilité
-- totale : supprimer une ligne suffit).
--
-- Invariant de résolution (à intégrer plus tard dans le resolver, Phase 21B-D) :
--   COALESCE(word_lemma_mapping.lemma_id, quran_words.lemma_id)
-- La table est donc une SURCOUCHE, jamais un remplacement.
--
-- Provenance obligatoire : source_id NOT NULL (FK sans ON DELETE SET NULL),
-- même convention que word_translations / lemma_translations. Chaque ligne
-- répond à « quel word_id → quel lemma_id, pourquoi, comment, avec quel degré
-- de confiance » (mapping_method + confidence + evidence + editorial_notes).
--
-- Migration MINIMALE, ADDITIVE, NON DESTRUCTIVE, IDEMPOTENTE. Aucune écriture
-- de données ici : le pilote est importé par scripts/seed-word-lemma-mapping.ts
-- (UNIQUEMENT les mappings SAFE, idempotent).

create table if not exists public.word_lemma_mapping (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.quran_words (id) on delete cascade,
  lemma_id uuid not null references public.lemmas (id) on delete cascade,
  source_id uuid not null references public.sources (id),
  mapping_method text not null check (mapping_method in ('exact_surface', 'editorial')),
  confidence text not null check (confidence in ('safe', 'review_required', 'rejected')),
  evidence text,
  editorial_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un mot n'a QU'UN seul lemme mappé : la précédence FORME > LEMME > EN est
  -- préservée (aucune ambiguïté de résolution possible).
  constraint word_lemma_mapping_word_key unique (word_id)
);

create index if not exists word_lemma_mapping_lemma_id_idx
  on public.word_lemma_mapping (lemma_id);
create index if not exists word_lemma_mapping_source_idx
  on public.word_lemma_mapping (source_id);
create index if not exists word_lemma_mapping_confidence_idx
  on public.word_lemma_mapping (confidence);

comment on table public.word_lemma_mapping is
  'Mapping éditorial FORME → LEMME (surcouche additive de quran_words.lemma_id). Seules les lignes confidence=safe sont actives ; REVIEW_REQUIRED/REJECTED ne sont jamais importés.';

comment on column public.word_lemma_mapping.mapping_method is
  'Méthode du mapping : exact_surface (décomposition exacte proclitique/cœur/enclitique) ou editorial (décision humaine).';
comment on column public.word_lemma_mapping.confidence is
  'Degré de confiance : safe (insertion autorisée), review_required (décision linguistique requise), rejected (faux positif démontré — jamais importé).';
comment on column public.word_lemma_mapping.evidence is
  'Preuve du mapping (pourquoi ce word_id appartient à ce lemma_id).';

alter table public.word_lemma_mapping enable row level security;

-- Lecture publique (comme quran_words / lemmas / word_translations). AUCUNE
-- policy d'écriture : INSERT / UPDATE / DELETE sont refusés pour tous les rôles
-- applicatifs (seul le service role écrit, via scripts/seed-word-lemma-mapping.ts).
create policy "word_lemma_mapping_read"
  on public.word_lemma_mapping
  for select
  using (true);
