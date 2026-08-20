-- Hikma — exercise_options (options de réponse d'un exercice)
create table if not exists public.exercise_options (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  position integer not null check (position > 0),
  content text not null,
  is_correct boolean not null default false,
  word_id uuid references public.quran_words (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint exercise_options_exercise_position_key unique (exercise_id, position)
);

create index if not exists exercise_options_exercise_id_idx on public.exercise_options (exercise_id);

comment on table public.exercise_options is
  'Option de réponse. is_correct marque la bonne réponse ; word_id relie l''option à un mot coranique lorsque pertinent.';

alter table public.exercise_options enable row level security;

create policy "exercise_options_read"
  on public.exercise_options
  for select
  using (true);
