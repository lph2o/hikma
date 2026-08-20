-- Hikma — audio : récitants et fichiers audio par verset / mot.
-- Architecture préparée en Phase 2 ; aucun gros fichier téléchargé à ce stade.

create table if not exists public.recitations (
  id uuid primary key default gen_random_uuid(),
  quran_com_id integer unique,
  reciter_id integer,
  name text not null,
  style text,
  qirat text,
  audio_url text,
  duration numeric,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ayah_audio (
  id uuid primary key default gen_random_uuid(),
  ayah_id uuid not null references public.ayahs (id) on delete cascade,
  recitation_id uuid not null references public.recitations (id) on delete cascade,
  audio_url text not null,
  duration numeric,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ayah_audio_ayah_recitation_key unique (ayah_id, recitation_id)
);

create table if not exists public.word_audio (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.quran_words (id) on delete cascade,
  recitation_id uuid references public.recitations (id) on delete set null,
  audio_url text not null,
  duration numeric,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint word_audio_word_recitation_key unique (word_id, recitation_id)
);

create index if not exists ayah_audio_ayah_id_idx on public.ayah_audio (ayah_id);
create index if not exists word_audio_word_id_idx on public.word_audio (word_id);

alter table public.recitations enable row level security;
alter table public.ayah_audio enable row level security;
alter table public.word_audio enable row level security;

create policy "recitations_read" on public.recitations for select using (true);
create policy "ayah_audio_read" on public.ayah_audio for select using (true);
create policy "word_audio_read" on public.word_audio for select using (true);
