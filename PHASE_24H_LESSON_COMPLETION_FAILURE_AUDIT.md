# PHASE 24H-LESSON-COMPLETION-FAILURE — ÉTAPE A
## AUDIT READ-ONLY DE L'ÉCHEC « PROGRESSION NON ENREGISTRÉE »

**STATUS = `AUDIT_COMPLETE_READY_FOR_APPROVAL`** — 100 % read-only, aucune correction appliquée.

---

## 0. Réponse directe à la question posée

> « Pourquoi cette leçon affiche-t-elle encore “Progression non enregistrée” alors
> que la phase 24H-ACTIVITY-IDEMPOTENCY est terminée ? »

**Réponse : le chemin de progression n'a plus aucun échec déterministe.** La cause
historique (duplicate key sur l'activité) est **éliminée**. Une reproduction contrôlée
de la **ré-complétion complète** de la Basmala (progression + activité ×2 + maîtrise ×2)
contre la vraie base avec RLS active **réussit avec 0 erreur**.

Le message ne peut être produit que par `submitLessonResults()` retournant `ok:false`,
ce qui n'arrive que si `persistWordAttempts()` lève une erreur Supabase. Ce catch est
**générique, non atomique et non classifié** : toute erreur *transitoire* (réseau,
timeout, rate-limit) — ou tout succès *partiel* — est présenté comme une perte totale.

---

## 1. Cartographie exacte de la chaîne

`components/learn/lesson-player.tsx` → `finish()` :

```
1. setPhase("submitting")
2. pending = pendingWordAttempts(finalResults, savedWordIds.current)
3. if (pending.length > 0) await submitLessonResults(lessonId, pending)
     if (!res.ok) → setError + setPhase("error")   ← SEUL chemin vers l'écran d'erreur
4. if (!activityRecorded) await recordLessonActivityOnly()   (NON BLOQUANT)
5. await submitSkillAttempts().catch()                        (NON BLOQUANT, résultat ignoré)
6. await clearLessonSession().catch()                         (NON BLOQUANT)
7. setPhase("complete")
```

`lib/learning/actions.ts` → `submitLessonResults()` :

```
createClient() → auth.getUser()  [si !user → « Connecte-toi… »]
boucle séquentielle : persistWordAttempts(word) pour chaque mot
   = Promise.all([getUserWordProgress, getUserReviewItems])
   → replayWordResults → upsert user_word_progress → upsert review_items
   catch → return { ok:false, error:"Impossible d'enregistrer la progression. Réessaie." }
après la boucle : recordLessonActivity (non bloquant) → { ok:true, activityRecorded }
```

Détail complet : `tmp/phase24h-lesson-completion/execution-flow.json`.

---

## 2. Contrat de retour (`submit-results-analysis.json`)

| Cas | Retour |
|---|---|
| A. Succès complet | `{ ok:true, savedWordIds, activityRecorded:true }` |
| B. Progression OK / activité KO | `{ ok:true, activityRecorded:false }` (leçon terminée) |
| C. Activité OK / progression KO | impossible (l'activité suit la progression) |
| D. Session OK / progression KO | session hors `submitLessonResults` |
| E. Erreur DB | `{ ok:false, error:"Impossible d'enregistrer la progression…", savedWordIds }` |
| F. Exception inattendue | captée → même forme que E (jamais de throw nu) |

**HTTP 200 ≠ succès métier** : une Server Action répond 200 même avec `{ok:false}`.

---

## 3. Les deux systèmes (progression vs activité)

| Fonction | Table |
|---|---|
| `persistWordAttempts` (progression + SRS) | `user_word_progress` + `review_items` |
| `persistSkillAttempt` (maîtrise) | `user_word_skill_progress` |
| `persistRetention` | `user_word_skill_progress` (`skill='retention'`) |
| `recordLessonActivity` | `user_activity_lessons` + `user_activity_words` |
| `recordWordActivity` | `user_activity_words` |
| `saveLessonSession` / `clearLessonSession` | `lesson_sessions` |

**Règle d'or respectée** : l'activité n'est jamais écrite avant la réussite de la
progression ; une erreur d'activité n'échoue jamais la progression (`ok:true` +
`activityRecorded:false`). → **Une erreur statistique ne peut plus afficher
« Progression non enregistrée »** (confirmé par la lecture du code post-fix).

---

## 4. Contraintes DB (`db-constraints.json`)

- `user_activity_lessons` : UNIQUE `(user_id, activity_date, lesson_id)`, FK → `lessons`, RLS select+insert.
- `user_activity_words` : UNIQUE `(user_id, activity_date, word_id)`, FK → `quran_words`, RLS select+insert.
- `user_word_skill_progress` : UNIQUE `(user_id, word_id, skill)`, CHECK `skill IN 8`, RLS select+insert+update.
- `lesson_sessions` : UNIQUE `(user_id, lesson_id)`, CHECK status, RLS select+insert+update+delete.

Toutes préservées. **Aucun trigger, aucun NOT NULL problématique.**

---

## 5. Leçon déjà terminée (ré-complétion) — vérifié

Reproduction contrôlée (`tmp/phase24h-lesson-completion/repro.ts`, utilisateur jetable
supprimé, **0 ligne de production touchée**) :

```
lesson = a98e58b8-bd33-48e6-a073-10d29e1a2562 (Basmala) — 4 mots, tous présents dans quran_words (4/4)
✅ 1re complétion (progression) OK
✅ activité ×2 OK (idempotent)
✅ maîtrise 1re passe OK (5,5 s pour 12 essais)
✅ 2e complétion (ré-complétion) OK — aucune erreur   ← scénario signalé
✅ maîtrise 2e passe OK
REPRO_RESULT: NO_ERROR
```

La deuxième complétion est **valide et sans erreur** : les upserts deviennent des
UPDATE, les journaux d'activité sont des no-op (même jour) ou de nouvelles lignes
(jour suivant). **Aucune opération ne considère la 2e complétion comme une erreur.**

---

## 6. `lesson_sessions` (`lesson-session-analysis.json`)

`clearLessonSession()` est appelé **en dernier**, après la persistance, avec `.catch()`.
Pas de double suppression, pas d'écriture après nettoyage, pas d'état incompatible.
La reprise borne l'index (`clampSessionIndex`). → **`lesson_sessions` n'est pas la source de l'échec.**

---

## 7. Le fallback (24H-ACTIVITY-IDEMPOTENCY)

Confirmé actif : `finish()` étape 4 ignore le `res.ok` de `recordLessonActivityOnly`
(leçon terminée quand même). Le seul chemin d'erreur restant est `submitLessonResults`
étape 3c. Aucun ancien fallback bloquant ne subsiste. Occurrences vérifiées
(`error-paths.json`) : la string « Progression non enregistrée » n'existe qu'en
`lesson-player.tsx`, et « Impossible d'enregistrer la progression. Réessaie. » qu'en
`actions.ts:241`.

---

## 8. Logs serveur

Les logs historiques (`recordLessonActivity failed: duplicate key`,
`recordLessonActivityOnly failed: duplicate key`) appartenaient au `.insert()` pré-fix.
**Aucune erreur équivalente n'existe plus** (upsert `ignoreDuplicates` partout).
La seule erreur de progression observable serait désormais
`console.error("submitLessonResults failed:", err)` — c'est ce log qui porterait la
nature exacte (RLS/FK/réseau/timeout) d'un échec transitoire.

---

## 9. Temps d'exécution (~18,8 s)

Mesure de reproduction : 12 `persistSkillAttempt` ≈ **5,5 s** → une leçon de 23 exercices
≈ **15-20 s**. Ce temps est porté par **`submitSkillAttempts`** (boucle séquentielle N+1),
**pas** par `submitLessonResults` (4 mots ≈ 1 s). Conséquence : le spinner
« Enregistrement de ta progression… » reste affiché ~18 s, mais cette lenteur **ne cause
pas** l'écran d'erreur (l'erreur de maîtrise est ignorée). C'est un facteur contributif,
pas la cause racine.

---

## 10. Client LessonPlayer — condition exacte

```tsx
if (!res.ok) {
  setError(res.error ?? "Une erreur est survenue.");
  setPhase("error");
  return;
}
```
Déclenchement de « Progression non enregistrée » = **exclusivement** `submitLessonResults`
→ `ok:false`. Le champ `res.savedWordIds` (succès partiels) **n'est pas exploité** pour
nuancer le message.

---

## 11. Double soumission (`duplicate-submit-analysis.json`)

Sûre : garde `phase !== "playing"` + `setPhase("submitting")` synchrone, ref
`savedWordIds` (anti double avancement), `activityRecorded` / `skillAttemptsSubmitted`
(refs). Pas de `useEffect` de soumission. **Pas de double soumission possible.**

---

## 12. Scénarios (`scenarios.json`)

A→G tracés. **Aucun des 7 ne reproduit l'échec** avec le code actuel. Le scénario B
(2e complétion) — celui signalé — est vérifié en base avec RLS : 0 erreur.

---

## 13. CAUSE RACINE PRINCIPALE

> **ROOT CAUSE** : le message ne peut être émis que par `submitLessonResults` → `ok:false`,
> donc uniquement par une erreur Supabase dans `persistWordAttempts`. La cause déterministe
> historique (duplicate key d'activité) est **éliminée** ; le chemin est désormais
> idempotent, RLS-clean et vérifié par reproduction (0 erreur). Le symptôme résiduel ne
> peut provenir que d'une **erreur transitoire** (réseau / timeout / rate-limit) que le
> **catch générique, non atomique et non classifié** présente à tort comme une perte
> totale de progression — y compris en cas de succès partiel (`savedWordIds` ignoré).

**CONTRIBUTING FACTORS**
- **CF1** — catch générique sans classification (toute erreur → même message).
- **CF2** — boucle par mot **non atomique** (un échec au mot N laisse 1..N-1 persistés,
  mais l'UI dit « non enregistrée »).
- **CF3** — `submitSkillAttempts` N+1 séquentiel (~15-20 s) bloque `finish()` et élargit
  la fenêtre d'échec transitoire.

**Correction recommandée (ÉTAPE B, sans migration)**
1. Classifier les erreurs de `persistWordAttempts` (RLS/FK/réseau/timeout) et les journaliser distinctement.
2. Si `savedWordIds.length > 0` → `partial:true` + UI « partiellement enregistré » au lieu de « non enregistrée ».
3. Rendre `submitSkillAttempts` non bloquant (ou paralléliser) pour supprimer la fenêtre de ~18 s.
4. Optionnel : transaction atomique sur la boucle de mots.

`root-cause.json` (format imposé) → `tmp/phase24h-lesson-completion/root-cause.json` :
`migrationRequired: false`.

---

## 14. Vérifications (read-only)

| Vérification | Résultat |
|---|---|
| `npm test` | **339/339** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **44/44** ✓ |

Compteurs DB **inchangés** : 21 296 / 77 430 / 21 295 / 0 / 32 / 25 / 183.
**0 écriture DB de production, 0 migration, 0 modification Storage/moteur/UI.**
(Reproduction sur utilisateur jetable, supprimé en fin de script.)

---

## 15. Livrables

- `PHASE_24H_LESSON_COMPLETION_FAILURE_AUDIT.md` (ce rapport)
- `tmp/phase24h-lesson-completion/`
  - `execution-flow.json` · `submit-results-analysis.json` · `progression-vs-activity.json`
  - `db-constraints.json` · `lesson-session-analysis.json` · `error-paths.json`
  - `duplicate-submit-analysis.json` · `scenarios.json` · `root-cause.json`
  - `repro.ts` (script de reproduction contrôlée, utilisateur jetable)

**ARRÊT OBLIGATOIRE** : Étape B non démarrée — en attente de l'approbation explicite du propriétaire.
