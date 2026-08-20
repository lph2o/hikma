-- Hikma — word_occurrences (occurrence réelle d'un mot dans un verset)
create table if not exists public.word_occurrences (
  id uuid primary key default gen_random_uuid(),
  ayah_id uuid not null references public.ayahs (id) on delete cascade,
  word_id uuid not null references public.quran_words (id) on delete cascade,
  position integer not null check (position > 0),
  text text not null,
  normalized_text text,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint word_occurrences_ayah_position_key unique (ayah_id, position)
);

create index if not exists word_occurrences_ayah_id_idx on public.word_occurrences (ayah_id);
create index if not exists word_occurrences_word_id_idx on public.word_occurrences (word_id);

comment on table public.word_occurrences is
  'Occurrence d''un mot dans un verset, avec sa position et sa forme réelle.';

alter table public.word_occurrences enable row level security;

create policy "word_occurrences_read"
  on public.word_occurrences
  for select
  using (true);
