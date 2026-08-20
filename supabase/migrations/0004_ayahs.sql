-- Hikma — ayahs (versets). Le texte est immuable côté utilisateur.
create table if not exists public.ayahs (
  id uuid primary key default gen_random_uuid(),
  surah_id uuid not null references public.surahs (id) on delete cascade,
  ayah_number integer not null check (ayah_number > 0),
  global_ayah_number integer check (global_ayah_number > 0),
  text_uthmani text not null,
  text_simple text,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ayahs_surah_ayah_key unique (surah_id, ayah_number)
);

create index if not exists ayahs_surah_id_idx on public.ayahs (surah_id);
create index if not exists ayahs_global_number_idx on public.ayahs (global_ayah_number);

comment on table public.ayahs is
  'Versets du Coran. text_uthmani préserve exactement le texte importé.';

alter table public.ayahs enable row level security;

create policy "ayahs_read"
  on public.ayahs
  for select
  using (true);
