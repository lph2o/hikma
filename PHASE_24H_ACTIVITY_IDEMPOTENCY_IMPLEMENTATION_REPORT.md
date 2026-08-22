# PHASE 24H-ACTIVITY-IDEMPOTENCY — Implémentation (ÉTAPE B)

**STATUS = `ACTIVITY_IDEMPOTENCY_COMPLETE`**

Le journal d'activité quotidienne est désormais **idempotent** : re-compléter une leçon ou revoir un mot le même jour est un no-op, et une erreur statistique n'est plus jamais présentée comme une perte de progression pédagogique.

---

## 1. Correction appliquée

| Fichier | Modification |
|---|---|
| `lib/learning/activity.ts` | + constantes `ACTIVITY_LESSON_CONFLICT` / `ACTIVITY_WORD_CONFLICT` (clés naturelles UNIQUE, documentées) |
| `lib/learning/actions.ts` → `recordLessonActivity` | leçon : `.insert()` → `.upsert({...}, { onConflict: "user_id,activity_date,lesson_id", ignoreDuplicates: true })` ; mots : `.insert()` → `.upsert([...], { onConflict: "user_id,activity_date,word_id", ignoreDuplicates: true })` |
| `lib/learning/actions.ts` → `recordWordActivity` | `.insert()` → `.upsert({...}, { onConflict: "user_id,activity_date,word_id", ignoreDuplicates: true })` |
| `components/learn/lesson-player.tsx` | le fallback `recordLessonActivityOnly` devient **non bloquant** : une erreur d'activité statistique (journalisée côté serveur) ne fait plus basculer en écran « Progression non enregistrée » — la leçon se termine quand même puisque la pédagogie est déjà persistée. |

## 2. Migration

**Aucune.** Le schéma était correct ; les contraintes UNIQUE sont **conservées** et vérifiées en base :

- `user_activity_lessons_user_date_lesson_key` → présente ✓
- `user_activity_words_user_date_word_key` → présente ✓

## 3. Résolution du bug observé

La chaîne fautive était : `recordLessonActivity` non idempotent (`.insert()` nu) + **non atomique** (lesson insérée avant les mots) → échec mots laisse une ligne lesson committée → le fallback la ré-insère → double duplicate → message trompeur.

Après correction, chaque écriture est un **upsert `ignoreDuplicates`** : les re-soumissions sont des no-ops, l'ordre des écritures n'a plus d'effet, et le fallback ne peut plus provoquer de duplicate.

## 4. Idempotence de `submitLessonResults`

- `persistWordAttempts` (progression pédagogique) était déjà un **upsert**.
- `recordLessonActivity` est maintenant un **upsert ignoreDuplicates**.
- Double soumission : `pendingWordAttempts` renvoie `[]` après le premier succès (`savedWordIds`), donc aucune réécriture — **aucun double avancement**.

## 5. Comportement des scénarios

| Scénario | Résultat |
|---|---|
| première complétion du jour | succès (1 leçon + N mots) |
| deuxième complétion même leçon même jour | **no-op**, aucun duplicate |
| même mot plusieurs fois le même jour | **no-op**, aucun duplicate |
| leçon hier puis aujourd'hui | deux lignes distinctes (`activity_date` différent) |
| mots déjà présents + nouveaux mots | insertion partielle correcte (`ignoreDuplicates`) |
| double soumission `submitLessonResults` | idempotent |
| activité déjà présente, pédagogie absente | `recordLessonActivityOnly` no-op |
| pédagogie sauvée + activité déjà existante | **pas** de « progression non enregistrée » |
| erreur réellement bloquante (persistance pédagogique) | toujours signalée |
| RLS | `auth.uid() = user_id` inchangé |

## 6. Vérifications

- `npm test` : **339/339** (336 + 3 tests `tests/activity-idempotency.test.ts`)
- `tsc --noEmit` : 0 erreur · lint clean · build OK
- `verify:persistence` : **13/13** · `verify:rls` : **44/44**
- Compteurs DB inchangés : quran_words 21 296 · word_occurrences 77 430 · word_audio 21 295 · ayah_audio 0 · lemmas 32 · word_translations FR 25 · mappings 183

## 7. Périmètre non touché

Aucune modification de `quran_words`, `word_occurrences`, `lemmas`, `word_translations`, `word_lemma_mapping`, `word_audio`, `ayah_audio`, resolver, grading, curriculum, mastery, SRS, phonétique, AudioPlayer.

---

## Livrables

- `PHASE_24H_ACTIVITY_IDEMPOTENCY_IMPLEMENTATION_REPORT.md` (ce rapport)
- `tmp/phase24h-activity-idempotency-evidence.json`
- (audit ÉTAPE A) `PHASE_24H_ACTIVITY_IDEMPOTENCY_AUDIT.md` + 4 JSON

**ARRÊT OBLIGATOIRE** : aucune phase suivante démarrée.
