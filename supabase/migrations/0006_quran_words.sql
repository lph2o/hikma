-- Hikma — quran_words (unités lexicales distinctes, réutilisables)
create table if not exists public.quran_words (
  id uuid primary key default gen_random_uuid(),
  arabic text not null unique,
  transliteration text,
  meaning text,
  root text,
  lemma_id uuid references public.lemmas (id) on delete set null,
  source_id uuid references public.sources (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists quran_words_lemma_id_idx on public.quran_words (lemma_id);

comment on table public.quran_words is
  'Forme lexicale distincte du Coran. translittération / sens / racine / lemme : NULL si non fournis.';

alter table public.quran_words enable row level security;

create policy "quran_words_read"
  on public.quran_words
  for select
  using (true);
