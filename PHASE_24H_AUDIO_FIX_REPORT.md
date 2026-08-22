# PHASE 24H-AUDIO-FIX — Réparation définitive de la chaîne word_audio

**STATUS = `AUDIO_FIX_COMPLETE`** (SUCCESS)

La chaîne `word_audio` est réparée : les audios existants sont désormais réellement accessibles, les URLs signées sont générées sous ANON, et les exercices `AUDIO_TO_WORD` / `WORD_TO_AUDIO` reçoivent de vraies URLs. **Aucune donnée pédagogique ni lexicale modifiée, aucun nouvel audio importé.**

---

## 1. Cause racine

Le bucket **privé** `word-audio` ne possédait **aucune policy `storage.objects`**. `createSignedUrl` sous ANON renvoyait donc « Object not found » (le Storage masque les objets privés aux rôles non autorisés), `getWordAudioUrls()` avalait l'erreur → map vide → `audioCount === 0` → badge « indisponibles » + `audioUrl = null` (exercices audio non générés).

## 2. Architecture retenue

**OPTION A — policy Storage RLS de LECTURE** limitée au bucket `word-audio`, pour `anon` + `authenticated`. Le bucket reste **privé** (`public = false`), aucune policy d'écriture, aucun autre bucket concerné.

## 3. Justification

- La table `public.word_audio` expose déjà ses lignes (dont `audio_url`) en lecture publique (`word_audio_read`, migration 0009) : les métadonnées audio sont déjà publiques.
- Les fichiers sont des enregistrements **Muallim de référence** (aucune donnée utilisateur).
- Le code existant (`getWordAudioUrls`) signe déjà avec le **client ANON** : l'Option A le fait fonctionner tel quel, sans nouvel endpoint ni secret (contrairement à l'Option B, génération service-role, surdimensionnée ici).
- Accès strict : `bucket_id = 'word-audio'` uniquement, URLs signées TTL 1 h, jamais d'URL publique permanente.

## 4. Fichiers modifiés

| Fichier | Modification |
|---|---|
| `supabase/migrations/0026_word_audio_storage_access.sql` | **créé** — policy `word_audio_storage_read` (SELECT, anon+authenticated, `bucket_id='word-audio'`), idempotente |
| `lib/learning/queries.ts` | `getWordAudioUrls` refactoré → nouveau `getWordAudioState` (URLs + `registered`/`signed`) ; classification d'erreurs + `console.error` serveur ; validation du chemin (`muallim/{uuid}.opus`) ; `getWordAudioUrls` conservé en wrapper rétrocompatible |
| `app/(app)/learn/[slug]/page.tsx` | importe `getWordAudioState` ; badge affiché **uniquement si `audio.registered === 0`** (jamais sur une erreur de signature) |

## 5. Migration

`0026_word_audio_storage_access.sql` — appliquée via `npm run db:migrate` (✅ 1 appliquée). `drop policy if exists` + `create policy` (idempotent).

## 6. Policies

- `word_audio_storage_read` — `SELECT`, rôles `{anon, authenticated}`, `using (bucket_id = 'word-audio')`.
- **Aucune** policy d'écriture (insert/update/delete) ajoutée.
- Bucket `word-audio` : `public = false` (vérifié en base).

## 7. Tests

- `npm test` : **328/328**
- `npx tsc --noEmit` : 0 erreur
- `npm run lint` : clean
- `npm run build` : OK
- `npm run verify:persistence` : **13/13**
- `npm run verify:rls` : **44/44**

## 8. Basmala — 4/4 ✅

Les 4 mots (`بِسْمِ`, `ٱللَّهِ`, `ٱلرَّحْمَـٰنِ`, `ٱلرَّحِيمِ`) signent désormais leur URL sous ANON : **4/4 signed**.

## 9. Al-Fatiha — 26/26 ✅

Les 26 formes signent leur URL sous ANON : **26/26 signed** (26 lignes `word_audio`, 26 signatures réussies).

## 10. Vraie lecture audio ✅

`GET` d'une URL signée réelle : **HTTP 200**, `Content-Type: audio/opus`, **9 197 octets** lus.

## 11. Validation sécurité ✅ (9/9)

Voir `tmp/phase24h-audio-security-validation.json` : bucket privé, policy SELECT seule, rôles limités, pas d'URL permanente (public URL → 400), service role absent du client, aucune clé dans les livrables, TTL 1 h.

## 12. Non-régression

Tous les garde-fous sont verts (voir §7). Aucun test supprimé ni affaibli.

## 13. Compteurs avant/après

| Donnée | Avant | Après |
|---|---|---|
| quran_words | 21 296 | 21 296 |
| word_occurrences | 77 430 | 77 430 |
| word_audio | 21 295 | 21 295 |
| ayah_audio | 0 | 0 |
| lemmas | 32 | 32 |
| word_translations FR | 25 | 25 |
| word_lemma_mapping | 183 | 183 |

**Aucun changement de données.**

## 14. Risques restants

- **Faible** : la policy autorise la lecture de tout objet du bucket `word-audio` pour anon — c'est voulu (audios de référence), mais toute future donnée sensible ne devra **jamais** être placée dans ce bucket.
- **Observabilité** : un échec de signature est désormais journalisé côté serveur (`console.error`) mais reste invisible côté client (aucun badge « indisponible » mensonger). Un monitoring des logs serait l'étape suivante éventuelle.
- **Validation navigateur** : la lecture réelle est prouvée au niveau HTTP (200 + `audio/opus`), mais le rendu/touch/clavier dans le composant `AudioPlayer` reste à confirmer en phase de validation navigateur (24I/24J).

---

## Livrables

- `PHASE_24H_AUDIO_FIX_REPORT.md` (ce rapport)
- `tmp/phase24h-audio-fix-evidence.json` (4/4, 26/26, HTTP 200, bucket privé)
- `tmp/phase24h-audio-access-matrix.json` (architecture avant/après + comparaison A/B)
- `tmp/phase24h-audio-security-validation.json` (9/9 vérifications)

**Arrêt obligatoire respecté** : 24H-Q1/Q2/Q3, 24I/J/K, 23G, SRS, gamification, 114 sourates non démarrés.
