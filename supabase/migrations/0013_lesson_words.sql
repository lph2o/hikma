-- Hikma — lesson_words (mots sélectionnés pour une leçon)
create table if not exists public.lesson_words (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  word_id uuid not null references public.quran_words (id) on delete cascade,
  position integer not null check (position > 0),
  is_new boolean not null default true,
  importance integer not null default 1,
  created_at timestamptz not null default now(),
  constraint lesson_words_lesson_word_key unique (lesson_id, word_id),
  constraint lesson_words_lesson_position_key unique (lesson_id, position)
);

create index if not exists lesson_words_word_id_idx on public.lesson_words (word_id);

comment on table public.lesson_words is
  'Sélection explicite d''un mot coranique dans une leçon. Un mot peut appartenir à plusieurs leçons (pas de duplication de quran_words).';

alter table public.lesson_words enable row level security;

create policy "lesson_words_read"
  on public.lesson_words
  for select
  using (true);
