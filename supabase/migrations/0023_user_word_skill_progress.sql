-- Hikma — user_word_skill_progress (maîtrise multi-dimensionnelle par compétence).
--
-- Phase 23F (socle du moteur pédagogique) : la maîtrise ne doit plus être
-- réduite à un compteur QCM unique. `user_word_progress` (migration 0016)
-- reste la vue AGRÉGÉE par mot (status, mastery 0-100, SRS) ; cette table est
-- la couche ADDITIVE par COMPÉTENCE (8 dimensions), une ligne par
-- (user_id, word_id, skill). Elle ne modifie aucune table existante.
--
-- Les 8 compétences (Phase 23B §4) :
--   form_recognition    : reconnaître la forme arabe ;
--   meaning_recognition : reconnaître la signification française ;
--   form_to_meaning     : rappeler/produire le sens à partir de la forme ;
--   meaning_to_form     : retrouver la forme arabe à partir du sens ;
--   audio_recognition   : identifier le mot à l'écoute ;
--   context_recognition : comprendre le mot dans son verset ;
--   lemma_relation      : relier plusieurs formes au même lemme ;
--   retention           : récupérer l'information après délai.
--
-- RLS : auth.uid() = user_id (select / insert / update), même convention que
-- user_word_progress. Aucun DELETE applicatif (cascade à la suppression du compte).

create table if not exists public.user_word_skill_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.quran_words (id) on delete cascade,
  skill text not null check (skill in (
    'form_recognition',
    'meaning_recognition',
    'form_to_meaning',
    'meaning_to_form',
    'audio_recognition',
    'context_recognition',
    'lemma_relation',
    'retention'
  )),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  mastery integer not null default 0 check (mastery between 0 and 100),
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_word_skill_progress_user_word_skill_key
    unique (user_id, word_id, skill)
);

create index if not exists user_word_skill_progress_user_word_idx
  on public.user_word_skill_progress (user_id, word_id);

comment on table public.user_word_skill_progress is
  'Maîtrise par compétence (8 dimensions) d''un utilisateur sur un mot. Couche additive : user_word_progress reste la vue agrégée.';

comment on column public.user_word_skill_progress.mastery is
  'Niveau de maîtrise de la compétence : 0 | 25 | 50 | 75 | 100 (dérivé des compteurs, voir lib/learning/skill-progress.ts).';

alter table public.user_word_skill_progress enable row level security;

create policy "user_word_skill_progress_select"
  on public.user_word_skill_progress for select using (auth.uid() = user_id);
create policy "user_word_skill_progress_insert"
  on public.user_word_skill_progress for insert with check (auth.uid() = user_id);
create policy "user_word_skill_progress_update"
  on public.user_word_skill_progress for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
