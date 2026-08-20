-- Hikma — accès en LECTURE au bucket Storage privé « word-audio » (Phase 24H-AUDIO-FIX).
--
-- L'audit 24H-AUDIO-STATUS a établi que les 21 295 objets Storage existent
-- réellement, mais que `createSignedUrl` échouait sous le rôle ANON avec
-- « Object not found » : le bucket privé word-audio n'avait AUCUNE policy
-- storage.objects, donc la signature était refusée (le Storage masque
-- l'existence des objets privés aux rôles non autorisés).
--
-- La table public.word_audio expose déjà ses lignes (dont audio_url) en
-- lecture publique (migration 0009). Les fichiers sont des enregistrements
-- Muallim de RÉFÉRENCE (aucune donnée utilisateur). On autorise donc la
-- LECTURE strictement limitée à ce bucket :
--   - jamais d'écriture (aucune policy insert/update/delete) ;
--   - jamais d'autre bucket (filtre bucket_id = 'word-audio') ;
--   - le bucket reste PRIVÉ (public = false) : les objets ne sont accessibles
--     que via URL signée (TTL 1 h, voir lib/learning/queries.ts), jamais en
--     URL publique permanente.
--
-- Idempotent : on dépose puis recrée (le suivi hikma_migrations garantit une
-- seule exécution, ce drop protège d'une application partielle antérieure).

drop policy if exists "word_audio_storage_read" on storage.objects;

create policy "word_audio_storage_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'word-audio');
