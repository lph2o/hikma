-- Hikma — Phase 6 : réglages utilisateur et journal d'activité quotidienne.
--
-- Architecture approuvée (audit pré-Phase 6) :
--   - user_settings          : préférences par utilisateur (objectif quotidien, onboarding).
--   - user_activity_lessons  : journal insert-only, une ligne = une lesson complétée un jour.
--   - user_activity_words    : journal insert-only, une ligne = un mot DISTINCT étudié un jour.
--
-- Idempotence GARANTIE PAR LA BASE : contraintes UNIQUE naturelles + INSERT …
-- ON CONFLICT DO NOTHING côté application. AUCUN compteur incrémental (+1).
-- La progression quotidienne est TOUJOURS dérivée (COUNT) de ces journaux.
--
-- RLS : auth.uid() = user_id (select / insert / update). Aucun DELETE applicatif.

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_goal_type text not null default 'words'
    check (daily_goal_type in ('lessons', 'words')),
  daily_goal_value integer not null default 5
    check (daily_goal_value > 0),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is
  'Réglages par utilisateur : objectif quotidien et statut onboarding.';

-- ---------------------------------------------------------------------------
-- user_activity_lessons
-- ---------------------------------------------------------------------------
create table if not exists public.user_activity_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_activity_lessons_user_date_lesson_key
    unique (user_id, activity_date, lesson_id)
);

create index if not exists user_activity_lessons_user_date_idx
  on public.user_activity_lessons (user_id, activity_date);

comment on table public.user_activity_lessons is
  'Journal insert-only : une lesson complétée un jour donné. Re-compléter la même lesson le même jour est un no-op (UNIQUE).';

-- ---------------------------------------------------------------------------
-- user_activity_words
-- ---------------------------------------------------------------------------
create table if not exists public.user_activity_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  word_id uuid not null references public.quran_words (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_activity_words_user_date_word_key
    unique (user_id, activity_date, word_id)
);

create index if not exists user_activity_words_user_date_idx
  on public.user_activity_words (user_id, activity_date);

comment on table public.user_activity_words is
  'Journal insert-only : un mot DISTINCT étudié un jour donné (leçons + révisions). Un mot × 6 exercices = 1 ligne.';

-- ---------------------------------------------------------------------------
-- Backfill : les utilisateurs existants au moment de la migration ne sont PAS
-- dirigés vers l'onboarding (onboarded = true) et reçoivent l'objectif par
-- défaut (words / 5). Les nouveaux utilisateurs n'ont pas de ligne →
-- l'application les redirige vers /onboarding.
-- ---------------------------------------------------------------------------
insert into public.user_settings (user_id, daily_goal_type, daily_goal_value, onboarded)
select id, 'words', 5, true
from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.user_settings enable row level security;
alter table public.user_activity_lessons enable row level security;
alter table public.user_activity_words enable row level security;

create policy "user_settings_select"
  on public.user_settings for select using (auth.uid() = user_id);
create policy "user_settings_insert"
  on public.user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update"
  on public.user_settings for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_activity_lessons_select"
  on public.user_activity_lessons for select using (auth.uid() = user_id);
create policy "user_activity_lessons_insert"
  on public.user_activity_lessons for insert with check (auth.uid() = user_id);

create policy "user_activity_words_select"
  on public.user_activity_words for select using (auth.uid() = user_id);
create policy "user_activity_words_insert"
  on public.user_activity_words for insert with check (auth.uid() = user_id);

-- Pas de policy UPDATE/DELETE sur les journaux : append-only (aucun DELETE
-- applicatif ; la suppression du compte utilise la cascade).
