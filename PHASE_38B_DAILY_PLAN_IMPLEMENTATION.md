# PHASE 38B — DAILY LEARNING PLAN / COACH NARRATIF : IMPLÉMENTATION

Statut : `PHASE_38B_IMPLEMENTATION_COMPLETE`

Référence : `PHASE_38A_AUDIT_APPROVED` (`PHASE_38A_DAILY_PLAN_AUDIT.md`).

---

## A. Architecture

Couche **d'orchestration / présentation pure** au-dessus des moteurs existants — aucune nouvelle source de vérité :

```
Supabase → queries existantes → dashboard data
   → composeDailyPlan(...)   [pur, sans I/O]
   → getCoachLine(...)       [pur, déterministe, sans IA]
   → TodayCard               [présentation, composants Hikma]
```

- Aucun second moteur de curriculum, SRS, priorité, planification, ni IA.
- Aucune requête DB supplémentaire : les données sont déjà chargées par le dashboard.

## B. Fonctions créées

### `lib/learning/daily-plan.ts`
- **`composeDailyPlan(input)`** — compose un `DailyPlan` à partir de données déjà calculées. N'appelle Supabase, ne lit pas l'heure, n'écrit rien.
- **`getCoachLine({ plan, profile, firstVisit })`** — une phrase déterministe, sans réseau/DB, toujours une chaîne valide.

## C. Fichiers modifiés / créés

| Fichier | Nature |
| --- | --- |
| `lib/learning/daily-plan.ts` | **créé** (logique pure) |
| `tests/daily-plan.test.ts` | **créé** (21 tests) |
| `app/(app)/dashboard/page.tsx` | **modifié** (imports + `plan`/`coachLine` + carte `TodayCard`) |

## D. Queries réutilisées (aucune nouvelle)

| Donnée | Source (inchangée) |
| --- | --- |
| Prochaine action | `selectActiveLearningPath` (via `selection`) |
| Objectif du jour | `getDailyGoalProgress` (via `goal`) |
| Révisions dues | `getReviewDueCount` (via `reviewDueCount`) |
| Couverture | `getQuranCoverage` (via `coverage`) |

## E. Structure `DailyPlan`

```ts
type DailyPlan = {
  action:  { kind, label, href, context };   // dérivé de selection uniquement
  goal:    { type, current, target, remaining, completed, exceeded };
  reviews: { dueCount, hasDue };
  coverage:{ percent: number | null };       // null = indisponible (jamais un faux 0 %)
};
```

- L'action **ne recalculé jamais** la prochaine leçon : `href = /learn/{selection.lessonSlug}` ; `all_done`/`none` → `/review` (route réelle, comportement identique au dashboard actuel).
- L'objectif est **informatif** : `exceeded` autorisé, `current` jamais plafonné (`7 / 5` affiché tel quel).

## F. Règles du coach (hiérarchie déterministe)

1. objectif dépassé → « Tu as dépassé ton objectif du jour. 👏 »
2. objectif atteint → « Bravo, ton objectif du jour est atteint. »
3. session active → « Reprends ta leçon, tu avais bien avancé. »
4. progression en cours → « Continue comme ça, tu avances bien aujourd'hui. »
5. révisions dues → « N mots à réviser t'attendent aujourd'hui. »
6. première visite → « Commence tranquillement avec ta première leçon. »
7. rythme tranquille (`daily_short` ou `daily_duration === 5`) → « Avance tranquillement… »
8. neutre → « Continue ton apprentissage à ton rythme. »

Chaque phrase n'affirme que des faits présents dans les données. **Aucune promesse de durée**, aucune IA, aucun réseau.

## G. UX

Carte **« Aujourd'hui »** ajoutée en tête du dashboard (après le header), recomposant :

> **Aujourd'hui**
> [coach line]
> `2 / 5 mots` · `4 à réviser` · `≈ 18 % du Coran compris`
> **[ Continuer ]**

- Un seul CTA principal, issu de `selection` ; révisions et couverture en stats compactes (pas de priorité inventée).
- Tokens Hikma existants (`Card`, `Button`, `Caption`, `H2`, `BodyMedium`), teal structure / accent discret.

## H. Tests

- `npx tsc --noEmit` ✅
- `npx eslint` ✅
- `npx vitest run` → **714/714** (693 + 21 nouveaux) ✅
- `npm run build` ✅

`tests/daily-plan.test.ts` couvre : nouvel utilisateur, progression 2/5, objectif atteint 5/5, dépassé 7/5, révisions 0 et N, couverture propagée/nulle, `all_done`/`none` (plan valide, jamais de leçon inventée), action dépendant uniquement de la sélection ; coach : atteint, dépassé, progression, session, révisions (sing./pluriel), première visite, neutre, préférence dispo/absente, données incohérentes (chaîne toujours valide).

## I. E2E (Playwright + Chrome, authentifié, 390×844 fr-FR)

1. Login → `/dashboard` → carte « Aujourd'hui » présente, coach « Commence tranquillement », objectif `0 / 5`, couverture `≈ 0 %`, `0 à réviser`, CTA « Découvrir ».
2. Seed 1 mot `familiar` + 1 révision due → rechargement → coach « 1 mot à réviser », `1 à réviser`, couverture `≈ 1 %` (recalcul).
3. **0 erreur console**, **aucun overflow horizontal**. Compte supprimé (0 résidu).

## J. Performance

**0 requête DB ajoutée** : `composeDailyPlan`/`getCoachLine` sont pures et composent des données déjà chargées (le dashboard charge déjà `goal`, `reviewDueCount`, `coverage`, `selection`).

## K. Accessibilité / RTL

- Composants sémantiques existants (`section aria-labelledby`, `Button`, typographie), focus/hover hérités.
- **Non vérifié en navigateur** pour RTL/reduced-motion dans cette phase → `BROWSER_VALIDATION_LIMITED` (responsive/fr-FR vérifiés à 390×844).

## L. Migrations

**Aucune** (0 migration, 0 table, 0 RPC, 0 donnée modifiée).

## M. Non-régression

- SRS, mastery, curriculum, onboarding, sessions, retry, couverture : **inchangés**.
- Les 693 tests préexistants restent verts ; aucune suppression/altération de test pour masquer une régression.

## N. Limites

- Le plan est une **présentation** : il n'ajoute aucune nouvelle donnée (pas de durée fiable, pas de « mots faibles du jour », pas de fuseau utilisateur — cf. audit 38A).
- Deux CTA coexistent (carte « Aujourd'hui » + carte « Ton prochain pas ») ; consolidation éventuelle hors scope pour rester minimal.
- RTL/reduced-motion non observés en navigateur.

## O. Décision finale

`PHASE_38B_IMPLEMENTATION_COMPLETE`

Le Daily Plan est une couche pure, déterministe et transparente qui **compose** les décisions existantes de Hikma sans en prendre de nouvelles. Tests verts (714), build vert, E2E authentifié vert, 0 migration, 0 régression.

**Aucun commit, aucun push.**
