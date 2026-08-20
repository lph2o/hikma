-- Hikma — learning_paths (parcours d'apprentissage)
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.learning_paths is
  'Parcours d''apprentissage. Le slug est la clé naturelle stable (seed idempotent).';

alter table public.learning_paths enable row level security;

create policy "learning_paths_read"
  on public.learning_paths
  for select
  using (true);
