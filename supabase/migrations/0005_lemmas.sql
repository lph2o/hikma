-- Hikma — lemmas (lemme d'une forme). Champs renseignés seulement si la source les fournit.
create table if not exists public.lemmas (
  id uuid primary key default gen_random_uuid(),
  arabic text not null unique,
  transliteration text,
  meaning text,
  root text,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.lemmas is
  'Lemmes du vocabulaire coranique. Aucune déduction automatique : données de provenance uniquement.';

alter table public.lemmas enable row level security;

create policy "lemmas_read"
  on public.lemmas
  for select
  using (true);
