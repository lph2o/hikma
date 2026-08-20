-- Hikma — lessons (leçon d'une unité)
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units (id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  difficulty integer not null default 1
    check (difficulty between 1 and 5),
  objective text,
  status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_unit_slug_key unique (unit_id, slug),
  constraint lessons_unit_sort_key unique (unit_id, sort_order)
);

create index if not exists lessons_unit_id_idx on public.lessons (unit_id);

comment on table public.lessons is
  'Leçon : titre, objectif, difficulté, statut. (unit_id, slug) = clé naturelle.';

alter table public.lessons enable row level security;

create policy "lessons_read"
  on public.lessons
  for select
  using (true);
