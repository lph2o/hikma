-- Hikma — lesson_sessions (session de leçon persistante, Phase 24E).
--
-- Résout U2 (24A) : une leçon commencée peut être reprise exactement là où
-- l'utilisateur s'est arrêté, après refresh / fermeture du navigateur /
-- reconnexion.
--
-- État MINIMAL uniquement : la séquence d'exercices est DÉTERMINISTE
-- (lesson + maîtrise utilisateur + données lexicales → même séquence, aucune
-- randomisation). On persiste donc seulement :
--   - la position (current_exercise_index) ;
--   - les réponses en attente de rejeu (results, skill_attempts).
-- La progression pédagogique réelle (user_word_progress / review_items /
-- user_word_skill_progress) reste écrite UNIQUEMENT à la fin de la leçon par
-- les Server Actions existantes — aucune duplication de la progression.

create table if not exists public.lesson_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  current_exercise_index integer not null default 0
    check (current_exercise_index >= 0),
  results jsonb not null default '[]'::jsonb,
  skill_attempts jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint lesson_sessions_user_lesson_key unique (user_id, lesson_id)
);

create index if not exists lesson_sessions_user_activity_idx
  on public.lesson_sessions (user_id, last_activity_at desc);

comment on table public.lesson_sessions is
  'État minimal d''une leçon en cours (position + réponses non encore rejouées). La séquence d''exercices est déterministe et reconstruite au chargement.';

alter table public.lesson_sessions enable row level security;

create policy "lesson_sessions_select"
  on public.lesson_sessions for select using (auth.uid() = user_id);
create policy "lesson_sessions_insert"
  on public.lesson_sessions for insert with check (auth.uid() = user_id);
create policy "lesson_sessions_update"
  on public.lesson_sessions for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "lesson_sessions_delete"
  on public.lesson_sessions for delete using (auth.uid() = user_id);
