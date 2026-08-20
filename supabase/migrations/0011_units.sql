-- Hikma — units (unité d'un parcours)
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint units_path_slug_key unique (path_id, slug),
  constraint units_path_sort_key unique (path_id, sort_order)
);

create index if not exists units_path_id_idx on public.units (path_id);

comment on table public.units is
  'Unité d''un parcours. (path_id, slug) est la clé naturelle (seed idempotent).';

alter table public.units enable row level security;

create policy "units_read"
  on public.units
  for select
  using (true);
