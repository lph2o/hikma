-- Hikma — imports (suivi des exécutions du pipeline)
create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  version text,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  records_imported integer not null default 0,
  records_updated integer not null default 0,
  records_failed integer not null default 0,
  error_log jsonb,
  created_at timestamptz not null default now()
);

create index if not exists imports_source_id_idx on public.imports (source_id);
create index if not exists imports_status_idx on public.imports (status);

comment on table public.imports is
  'Une ligne par exécution du pipeline d''import coranique.';

alter table public.imports enable row level security;

create policy "imports_read"
  on public.imports
  for select
  using (true);
