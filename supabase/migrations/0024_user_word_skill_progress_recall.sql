-- Hikma — user_word_skill_progress : colonnes de récence/stabilité du rappel.
--
-- Phase 23F-B (correction pédagogique du moteur de maîtrise). ADDITIF : la table
-- (migration 0023) garde sa structure de base (user_id, word_id, skill,
-- correct_count, incorrect_count, mastery, last_attempt_at). On ajoute trois
-- colonnes pour que la maîtrise et la rétention puissent tenir compte de la
-- récence et de la stabilité du rappel (audit 23F-A : le score net seul
-- ignorait le ratio réussites/erreurs et la récence) :
--
--   current_streak     : réussites consécutives se terminant à la dernière
--                        tentative (0 si le dernier essai est un échec) ;
--   last_correct_at    : horodatage du dernier rappel réussi ;
--   last_incorrect_at  : horodatage du dernier échec.
--
-- Aucune politique RLS nouvelle n'est nécessaire : les politiques SELECT /
-- INSERT / UPDATE existantes (auth.uid() = user_id) couvrent les nouvelles
-- colonnes. Aucune table existante n'est modifiée.

alter table public.user_word_skill_progress
  add column if not exists current_streak integer not null default 0
    check (current_streak >= 0),
  add column if not exists last_correct_at timestamptz,
  add column if not exists last_incorrect_at timestamptz;

comment on column public.user_word_skill_progress.current_streak is
  'Réussites consécutives se terminant à la dernière tentative (0 si dernier échec).';
comment on column public.user_word_skill_progress.last_correct_at is
  'Horodatage du dernier rappel réussi (null si jamais réussi).';
comment on column public.user_word_skill_progress.last_incorrect_at is
  'Horodatage du dernier échec (null si jamais échoué).';
