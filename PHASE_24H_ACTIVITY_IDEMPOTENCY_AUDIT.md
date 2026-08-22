# PHASE 24H-ACTIVITY-IDEMPOTENCY — Audit du bug d'activité quotidienne (ÉTAPE A)

**STATUS = `AUDIT_COMPLETE_READY_FOR_APPROVAL`**
**Mode : READ-ONLY** — aucune modification de code, DB ou Storage. L'implémentation (Étape B) attend une approbation explicite.

---

## 1. Cause racine exacte

Le journal d'activité quotidienne est **non idempotent**, contrairement à son propre contrat.

Dans `lib/learning/actions.ts`, `recordLessonActivity()` et `recordWordActivity()` utilisent un **`.insert()` simple** :

```ts
// user_activity_lessons — PAS d'ON CONFLICT
await client.from("user_activity_lessons").insert({ ... });
// user_activity_words — PAS d'ON CONFLICT
await client.from("user_activity_words").insert(wordIds.map(...));
```

Or, la migration `0018_user_settings_and_activity.sql` et les commentaires de code promettent explicitement :

> « Idempotence GARANTIE PAR LA BASE : contraintes UNIQUE naturelles + **INSERT … ON CONFLICT DO NOTHING** côté application. »

Le script de vérification `scripts/verify-persistence.ts` utilise, lui, le **bon patron** :

```ts
.from("user_activity_lessons")
.upsert({ ... }, { onConflict: "user_id,activity_date,lesson_id", ignoreDuplicates: true });
```

**Le code de production ne correspond pas au patron attendu.**

## 2. Pourquoi l'erreur observée survient (double duplicate)

`recordLessonActivity()` est **non atomique** : elle insère d'abord la ligne **lesson**, puis les lignes **mots**.

1. `submitLessonResults()` → `recordLessonActivity()` :
   - **lesson** `(user, J, basmala)` insérée → **succès** ;
   - **mots** `(user, J, mot_i)` → au moins un mot existe déjà aujourd'hui (le curriculum est **cumulatif** : `ٱلرَّحْمَـٰنِ` / `ٱلرَّحِيمِ` sont partagés avec d'autres leçons, ou le mot a été révisé plus tôt) → **duplicate** → lève → `console.error("recordLessonActivity failed: user_activity_words … duplicate")`.
2. `submitLessonResults()` attrape l'erreur et renvoie `{ ok: true, activityRecorded: false }` — **la pédagogie est déjà sauvegardée**, mais la ligne lesson du jour est déjà committée.
3. Le LessonPlayer voit `activityRecorded === false` et appelle le fallback `recordLessonActivityOnly()` → `recordLessonActivity()` **une seconde fois** :
   - **lesson** `(user, J, basmala)` existe déjà → **duplicate** → lève → `console.error("recordLessonActivityOnly failed: user_activity_lessons … duplicate")`.
4. Le LessonPlayer affiche **« Oups… Progression non enregistrée »** — **message trompeur** : la progression pédagogique, elle, a bien été enregistrée.

## 3. Réponse à la question diagnostique

> duplicate-key vient-il de A (double soumission), B (insert non idempotent), C (recordLessonActivity appelé plusieurs fois), D (fallback après écriture partielle), E (combinaison) ?

**E — combinaison** :
- **B** (primaire) : `INSERT` non idempotent (pas de `ON CONFLICT DO NOTHING`), contrairement au contrat.
- **C/D** (secondaire) : le fallback `recordLessonActivityOnly` rejoue `recordLessonActivity` après un échec partiel **non atomique** (la ligne lesson déjà committée est ré-insérée).

`saveLessonSession` aux indices 25/26 n'est **pas** la cause (autosave normal de position).

## 4. Sémantique réelle des journaux (à respecter)

| Table | Une ligne = | Dédup |
|---|---|---|
| `user_activity_lessons` | une **lesson complétée** un jour donné (présence, PAS un compteur) | `UNIQUE (user_id, activity_date, lesson_id)` |
| `user_activity_words` | un **mot distinct étudié** un jour (leçons + révisions) | `UNIQUE (user_id, activity_date, word_id)` |

La progression quotidienne est **toujours dérivée par `COUNT`** (`getDailyActivity`) — aucun compteur incrémental. Les contraintes UNIQUE sont **correctes** et doivent être **conservées**.

## 5. Correction proposée (ÉTAPE B — non appliquée)

Aucune migration. Rendre les écritures idempotentes via `.upsert(..., { onConflict, ignoreDuplicates: true })` :

- `recordLessonActivity` → lesson : `onConflict: "user_id,activity_date,lesson_id"` ; mots : `onConflict: "user_id,activity_date,word_id"`.
- `recordWordActivity` → `onConflict: "user_id,activity_date,word_id"`.

Après correction : re-compléter la même leçon / revoir le même mot le même jour devient un **no-op** ; le fallback `recordLessonActivityOnly` devient inoffensif ; plus aucun « progression non enregistrée » mensonger.

**Durcissement optionnel** : dans le LessonPlayer, ne jamais afficher « progression non enregistrée » si la pédagogie est sauvegardée et que seule l'activité statistique échoue (distinguer échec critique / activité déjà présente / erreur récupérable).

## 6. Tests proposés (ÉTAPE B)

1. première complétion du jour → succès ;
2. deuxième soumission même leçon même jour → aucun duplicate ;
3. même mot plusieurs fois le même jour → aucun duplicate ;
4. leçon hier puis aujourd'hui → deux journées distinctes ;
5. mots déjà présents + nouveaux mots → insertion partielle correcte ;
6. double appel `submitLessonResults` → idempotent ;
7. activité déjà présente mais pédagogie absente → no-op ;
8. pédagogie sauvée + activité déjà existante → pas de « progression non enregistrée » ;
9. erreur réellement bloquante → toujours signalée ;
10. RLS respectée (`auth.uid() = user_id`).

## 7. Périmètre non touché

Aucune modification de `quran_words` / `word_occurrences` / `lemmas` / `word_translations` / `word_lemma_mapping` / `word_audio` / `ayah_audio` / resolver / grading / moteur pédagogique / curriculum / mastery / SRS / phonétique / AudioPlayer.

---

## Livrables (ÉTAPE A)

- `PHASE_24H_ACTIVITY_IDEMPOTENCY_AUDIT.md` (ce rapport)
- `tmp/phase24h-activity-idempotency-audit.json`
- `tmp/phase24h-activity-constraints.json`
- `tmp/phase24h-activity-flow.json`
- `tmp/phase24h-activity-proposed-fix.json`

**ARRÊT OBLIGATOIRE** : Étape B non démarrée — en attente d'approbation explicite.
