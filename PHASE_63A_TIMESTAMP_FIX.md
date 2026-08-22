# PHASE 63A — CORRECTION TIMESTAMP user_word_progress — RAPPORT

## A. Erreur originale

```
user_word_progress :
time zone displacement out of range: "+013510-04-02T14:55:14.114Z"
```

Symptôme UI : « Progression non enregistrée — Impossible d'enregistrer ta progression pour le moment. »

## B. Stack exacte

```
persistWordAttempts          → lib/learning/actions.ts:135 (upsert user_word_progress)
  appelé par runLessonSubmission → lib/learning/lesson-submit.ts:82
```

## C. Timestamp produit

`+013510-04-02T14:55:14.114Z` — **année 13 510**. Ce n'est PAS un format ISO classique :
JavaScript `Date.prototype.toISOString()` produit une année à 6 chiffres préfixée « + »
quand la date dépasse l'an 9999. PostgreSQL refuse ce format :
« time zone displacement out of range ».

## D. Variable fautive

`nextReview.nextReviewAt` — valeur calculée par `replayWordResults`
(`lib/learning/session.ts`) à partir de `schedule.nextReviewAt` produit par
`LeitnerScheduler.schedule` (`lib/review/scheduler.ts`) :

```ts
nextReviewAt: addDays(now, intervalDays).toISOString(),
```

## E. Calcul original (unité vérifiée : JOURS partout, aucune conversion fautive)

```ts
// lib/review/scheduler.ts — LeitnerScheduler.schedule
const previousInterval = state?.intervalDays ?? 0;   // jours
const intervalDays = correct
  ? previousInterval === 0 ? 1 : previousInterval * 2  // doublage SANS BORNE
  : 1;

// lib/review/scheduler.ts — addDays
out.setUTCDate(out.getUTCDate() + days);  // jours → date (correct)

// lib/learning/session.ts — replayWordResults
for (const correct of attempts) {
  const schedule = engine.recordAnswer(r, correct, now);  // relance par tentative
  r = { intervalDays: schedule.intervalDays, nextReviewAt: schedule.nextReviewAt, … };
}
```

## F. Unité incorrecte, si applicable

**Non — l'unité était correcte (jours).** Le bug était la **VALEUR de l'intervalle** :
le doublage Leitner est sans borne (`previousInterval * 2`) et `replayWordResults` le
relance pour CHAQUE tentative accumulée d'une leçon (jusqu'à 11 types d'exercices par
mot). La base contenait déjà des intervalles pathologiques : `interval_days = 262 144`
(= 2¹⁸ ≈ **718 ans** !) sur les mots `بِسْمِ` / `ٱللَّهِ` (leçon basmala), avec
`next_review_at` en 2744. Quelques bonnes réponses supplémentaires doublent à chaque
tentative : 2¹⁸ → 2¹⁹ → 2²⁰ → 2²¹ → 2²² = 4 194 304 jours ≈ 11 483 ans → **année 13 510**.

Reproduction (avant correctif), depuis l'état réel 2¹⁸ :

```
après 1 bonne réponse : 524 288 j  → 3462
après 2              : 1 048 576 j → 4897
après 3              : 2 097 152 j → 7768
après 4              : 4 194 304 j → +013510-04-02T15:05:00.674Z  ← l'erreur exacte
```

## G. Correction

**1. `lib/review/scheduler.ts` — borne de sécurité documentée (§6) :**

```ts
export const MAX_REVIEW_INTERVAL_DAYS = 365; // plafond documenté (1 an)
…
const intervalDays = Math.min(
  correct
    ? previousInterval === 0 ? 1 : previousInterval * 2
    : 1,
  MAX_REVIEW_INTERVAL_DAYS,
);
```

- La courbe pédagogique 1 → 2 → 4 → … → 256 est **inchangée** sous le plafond ;
- Au-delà, l'intervalle est borné à 365 j (maximum canonique Leitner/SM-2) ;
- **Auto-réparation** : les lignes existantes dépassant le plafond (262 144 j) sont
  recalculées à 365 j à la prochaine réponse — aucune donnée supprimée, aucune donnée inventée.

**2. `lib/learning/actions.ts` — validation de date AVANT upsert (§5, détecter, ne jamais masquer) :**

```ts
assertValidReviewDate(nextReview.nextReviewAt, "next_review_at", now);
// → NaN / non parseable  : erreur explicite (calcul fautif)
// → au-delà de now + 365 j : erreur explicite (intervalle non borné)
```

L'erreur est LEVÉE (jamais remplacée par une date arbitraire « maintenant ») : le but
est de détecter une régression du calcul, pas de masquer le bug.

**3. Export** de `MAX_REVIEW_INTERVAL_DAYS` dans `lib/review/index.ts`.

## H. Pourquoi la correction est correcte

1. **Cause racine traitée** : le doublage sans borne est la seule source de l'année
   13 510. Borner l'intervalle empêche la construction d'une date aberrante.
2. **Pédagogie préservée** : doublage identique sous 365 j (tests inchangés : 1 → 2 → 4,
   graduation ≥ 7 j, seuil mastered 14 j — tous largement sous le plafond).
3. **Détection, pas masquage** : la validation lève une erreur explicite si un intervalle
   anormal réapparaissait ; elle ne remplace jamais la date.
4. **Auto-réparation sans toucher aux données** : aucune suppression, aucune mise à jour
   manuelle — les lignes pathologiques se normalisent à la prochaine réponse réelle.

## I. Impact SRS

- Intervalles stockés : plafonnés à 365 j (1 an) au lieu de croître sans fin.
- Statuts (`learning` / `review` / `relearning`), graduation (7 j), seuils de maîtrise
  (`masteredMinIntervalDays = 14`), `applyAnswer`, `computeLessonStatuses` : **inchangés**.
- Un mot réussi est révisé au plus une fois par an — comportement standard Leitner/SM-2.

## J. Tests

Nouveaux tests (5, ajoutés à l'existant) :

| Test | Fichier | Vérifie |
|---|---|---|
| borne l'intervalle au plafond documenté | `tests/review.test.ts` | 10 bonnes réponses au plafond → reste 365 j, date exacte `now+365 j` |
| jamais de next_review_at au-delà de l'horizon | `tests/review.test.ts` | cas réel 2¹⁸ + 30 bonnes réponses → date valide, ≤ now+365 j, jamais de « + » |
| préserve le doublage sous le plafond | `tests/review.test.ts` | 1→2→4→…→256 (8 doublages) |
| 30 bonnes réponses → date bornée (régression 63A) | `tests/session.test.ts` | rejeu complet : jamais `+013510`, ≤ now+365 j |
| intervalle en jours, jamais s/ms | `tests/session.test.ts` | 1 jour = 86 400 000 ms (pas 1 000) |

## K. Test réel /learn/basmala

Le serveur `next dev` tournait pendant la correction (hot-reload). Après le correctif,
la leçon basmala a été soumise **réellement** (écritures `review_items` à 15:07:47,
activité `user_activity_lessons` à 15:07:50) :

| Mot | interval_days avant | après | next_review_at |
|---|---:|---:|---|
| بِسْمِ | **262 144 (2¹⁸ ≈ 718 ans)** | **365** | 2027-08-20 ✅ |
| ٱللَّهِ | **262 144 (2¹⁸ ≈ 718 ans)** | **365** | 2027-08-20 ✅ |
| ٱلرَّحْمَـٰنِ / ٱلرَّحِيمِ | — | 2 | 2026-08-22 ✅ |

**Aucune erreur timestamp** : `submitLessonResults` a retourné le succès, l'activité a été
enregistrée, les dates sont valides et PostgreSQL les accepte. La progression est visible
après retour vers /learn.

## L. Idempotence

`persistWordAttempts` repose sur `upsert(…, { onConflict: "user_id,word_id" })` (idem
`review_items`) : deux soumissions du même résultat produisent un succès sur les deux
écritures, **aucune violation UNIQUE, aucune duplication**. La validation de date est
idempotente (même entrée → même résultat déterministe). Aucun changement de cette sémantique.

## M. Non-régression

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **748/748** (743 existants + 5 nouveaux — tous verts) |
| `npm run build` | ✅ OK |

Aucun autre système modifié : resolver, curriculum, mastery, Daily Plan, coach, onboarding,
MASAQ, explications, schéma, migrations, RLS — **intacts**.

## N. Verdict

**`PHASE_63A_TIMESTAMP_FIX_COMPLETE`**

- Cause racine identifiée et reproduite : doublage d'intervalle **sans borne** du
  `LeitnerScheduler` combiné au rejeu par tentative → année 13 510 → format `+013510-…`
  rejeté par PostgreSQL ;
- Correction ciblée : plafond documenté `MAX_REVIEW_INTERVAL_DAYS = 365` + validation de
  date avant upsert (détecte, ne masque jamais) ;
- Pédagogie SRS inchangée sous le plafond ; lignes pathologiques auto-réparées à la
  prochaine réponse ;
- Test réel `/learn/basmala` concluant (mots basmala repassés de 2¹⁸ jours à 365 j, dates
  valides, activité enregistrée) ;
- Idempotence préservée ; non-régression complète (tsc ✅ · eslint ✅ · **vitest 748/748** ✅ · build ✅) ;
- **Aucun commit, aucun push.**

**STOP.**
