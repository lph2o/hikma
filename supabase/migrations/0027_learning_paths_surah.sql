-- Hikma — rattachement explicite d'un parcours à une sourate.
--
-- Nullable pour préserver les parcours historiques. Les nouveaux parcours
-- multi-sourates doivent fournir surah_id. Le backfill ciblé de l'ancien
-- parcours Al-Fatihah est idempotent et ne duplique aucune donnée.

alter table public.learning_paths
  add column if not exists surah_id uuid
    references public.surahs (id) on delete set null;

create index if not exists learning_paths_surah_id_idx
  on public.learning_paths (surah_id);

update public.learning_paths as paths
set surah_id = surahs.id
from public.surahs
where paths.slug = 'quran-vocabulary'
  and paths.surah_id is null
  and surahs.number = 1;

comment on column public.learning_paths.surah_id is
  'Sourate de référence du parcours ; NULL est réservé aux parcours historiques non rattachés.';
