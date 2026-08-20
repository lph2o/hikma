-- Hikma — Phase 15 : workflow éditorial des unités de vocabulaire (lemmas).
--
-- Migration MINIMALE autorisée (Phase 15 §3). Ajoute uniquement :
--   - status        : proposed / validated / rejected ;
--   - validated_at  : NULL pour proposed/rejected, horodaté pour validated.
--
-- Invariant (identique à word_translations, migration 0019) :
--   proposed/rejected ⇔ validated_at IS NULL
--   validated         ⇔ validated_at IS NOT NULL
--
-- Volontairement EXCLUS (Phase 15 §3) :
--   confidence, normalized_text, root, POS, morphologie, famille lexicale, etc.
--   normalized_text se calcule à la volée (lib/quran/normalize-text.ts) ;
--   confidence sert au workflow de proposition, non stocké en V1.

alter table public.lemmas
  add column if not exists status text not null default 'proposed'
    check (status in ('proposed', 'validated', 'rejected')),
  add column if not exists validated_at timestamptz;

-- Contrainte d'invariant de validation (idempotente).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lemmas_validation_check'
      and conrelid = 'public.lemmas'::regclass
  ) then
    alter table public.lemmas
      add constraint lemmas_validation_check
      check (
        (status = 'validated' and validated_at is not null)
        or
        (status <> 'validated' and validated_at is null)
      );
  end if;
end $$;

-- RLS : inchangée. La policy `lemmas_read` (migration 0005) suffit pour la lecture
-- publique. Aucune policy d'écriture : seuls les scripts d'édition service-role
-- écrivent (comme word_translations).
