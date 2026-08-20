-- Hikma — review_items (programmation de la répétition espacée)
create table if not exists public.review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.quran_words (id) on delete cascade,
  status text not null default 'learning'
    check (status in ('learning', 'review', 'relearning')),
  interval_days integer not null default 0 check (interval_days >= 0),
  last_review_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_items_user_word_key unique (user_id, word_id)
);

create index if not exists review_items_user_next_idx
  on public.review_items (user_id, next_review_at);

comment on table public.review_items is
  'État de planification de la répétition espacée (scheduler remplaçable : Leitner aujourd''hui, SM-2/FSRS plus tard).';

alter table public.review_items enable row level security;

create policy "review_items_select"
  on public.review_items
  for select
  using (auth.uid() = user_id);

create policy "review_items_insert"
  on public.review_items
  for insert
  with check (auth.uid() = user_id);

create policy "review_items_update"
  on public.review_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "review_items_delete"
  on public.review_items
  for delete
  using (auth.uid() = user_id);
