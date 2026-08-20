-- Hikma — translations (traductions par verset, plusieurs langues)
create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  ayah_id uuid not null references public.ayahs (id) on delete cascade,
  language text not null,
  translator text not null,
  resource_id integer not null,
  text text not null,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint translations_ayah_resource_key unique (ayah_id, resource_id)
);

create index if not exists translations_ayah_id_idx on public.translations (ayah_id);
create index if not exists translations_language_idx on public.translations (language);

comment on table public.translations is
  'Traductions d''un verset. resource_id identifie la ressource source de manière stable.';

alter table public.translations enable row level security;

create policy "translations_read"
  on public.translations
  for select
  using (true);
