-- 0036 — content_items : élargit la CHECK template_key aux 5 clés ajoutées
-- côté code (GENERATABLE_TEMPLATES) depuis 0034. Migration ADDITIVE et
-- IDEMPOTENTE : aucune écriture de données, aucun autre changement.
--
-- Contexte : la CHECK initiale (0034) limitait template_key aux 3 templates
-- P0 (QUIZ/REVEAL/FREQUENCY) mais le code insère déjà VERSE_DEEP_DIVE_V1 et
-- SURAH_HIGHLIGHT_V1 depuis la Phase B — toute génération de ces templates
-- aurait échoué en production. 0036 réaligne la base sur le code et ajoute
-- VOCAB_SPEED_RUN_V1 (LOT 2 Video Factory).

-- Idempotence : ne s'exécute que si la clause ne couvre pas déjà les 6 clés.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.content_items'::regclass
      and conname = 'content_items_template_key_check'
      and pg_get_constraintdef(oid) like '%VOCAB_SPEED_RUN_V1%'
  ) then
    alter table public.content_items
      drop constraint if exists content_items_template_key_check;
    alter table public.content_items
      add constraint content_items_template_key_check
      check (template_key in (
        'WORD_QUIZ_V1',
        'WORD_REVEAL_V1',
        'FREQUENCY_FACT_V1',
        'VERSE_DEEP_DIVE_V1',
        'SURAH_HIGHLIGHT_V1',
        'VOCAB_SPEED_RUN_V1'
      ));
  end if;
end
$$;
