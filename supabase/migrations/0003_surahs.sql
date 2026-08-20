-- Hikma — surahs (114 sourates)
create table if not exists public.surahs (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique
    check (number between 1 and 114),
  name_arabic text not null,
  name_transliteration text,
  name_translation text,
  revelation_place text
    check (revelation_place in ('makkah', 'madinah') or revelation_place is null),
  ayah_count integer not null check (ayah_count > 0),
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.surahs is
  'Sourates du Coran. Le numéro (1..114) est l''identifiant logique stable.';

alter table public.surahs enable row level security;

create policy "surahs_read"
  on public.surahs
  for select
  using (true);
