-- Hikma — exercises (exercice d'une leçon)
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  type text not null,
  position integer not null check (position > 0),
  difficulty integer not null default 1
    check (difficulty between 1 and 5),
  prompt text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint exercises_lesson_position_key unique (lesson_id, position)
);

create index if not exists exercises_lesson_id_idx on public.exercises (lesson_id);

comment on table public.exercises is
  'Exercice : type, question (prompt), métadonnées. Les options sont dans exercise_options.';

alter table public.exercises enable row level security;

create policy "exercises_read"
  on public.exercises
  for select
  using (true);
