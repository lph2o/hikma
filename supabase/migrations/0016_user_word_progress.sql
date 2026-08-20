-- Hikma — user_word_progress (progression d'un utilisateur sur un mot)
create table if not exists public.user_word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.quran_words (id) on delete cascade,
  status text not null default 'new'
    check (status in ('new', 'learning', 'familiar', 'mastered')),
  mastery integer not null default 0
    check (mastery between 0 and 100),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  last_seen_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_word_progress_user_word_key unique (user_id, word_id)
);

create index if not exists user_word_progress_word_id_idx on public.user_word_progress (word_id);

comment on table public.user_word_progress is
  'Progression individuelle d''un utilisateur sur un mot (statut, maîtrise, compteurs).';

alter table public.user_word_progress enable row level security;

create policy "user_word_progress_select"
  on public.user_word_progress
  for select
  using (auth.uid() = user_id);

create policy "user_word_progress_insert"
  on public.user_word_progress
  for insert
  with check (auth.uid() = user_id);

create policy "user_word_progress_update"
  on public.user_word_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_word_progress_delete"
  on public.user_word_progress
  for delete
  using (auth.uid() = user_id);
