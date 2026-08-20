-- Hikma — sources (provenance des données importées)
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  url text,
  version text,
  license text,
  retrieved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint sources_name_version_key unique (name, version)
);

comment on table public.sources is
  'Provenance de chaque donnée coranique importée.';

alter table public.sources enable row level security;

create policy "sources_read"
  on public.sources
  for select
  using (true);
