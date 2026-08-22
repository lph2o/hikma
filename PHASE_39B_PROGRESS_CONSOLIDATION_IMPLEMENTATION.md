# PHASE 39B — CONSOLIDATION DE LA PROGRESSION + RÉSUMÉ HEBDOMADAIRE

**Statut : `PHASE_39B_IMPLEMENTATION_COMPLETE`**

> Aucun moteur pédagogique modifié, aucune migration, aucun commit/push.
> Livrable : consolidation UX du dashboard + résumé hebdomadaire dérivé des journaux existants.

---

## A. Architecture avant/après

**Avant** (audit 39A) : 2 CTA primaires vers la même leçon, objectif ×2, révisions ×3, couverture ×2, répartis sur 5 zones redondantes.

**Après** : une seule zone primaire « Aujourd'hui » porte l'action, l'objectif, les révisions et la couverture ; une zone « Cette semaine » ajoute le résumé hebdomadaire ; les zones secondaires ne portent que des informations réellement différentes.

Flux inchangé :

```
queries existantes (déjà chargées en Promise.all)
   → composeDailyPlan (38B, intact)
   → composeWeeklySummary (39B, nouveau, pur)
   → TodayCard / WeeklyCard (présentation)
```

Aucune nouvelle source de vérité. Aucune query ajoutée.

## B. CTA consolidés

- L'ancienne carte « Ton prochain pas » (avec son bouton dupliqué) est **supprimée**.
- Son contexte utile (sourate / avancement / raison) est repris dans `TodayCard` via `plan.action.context` (et `recommendationReason` quand disponible).
- `TodayCard` est désormais **l'unique CTA primaire** (`plan.action.href`, toujours issu de `selectActiveLearningPath`).
- La révision n'y apparaît qu'en **CTA secondaire** « Réviser maintenant » → `/review`, uniquement quand `reviews.hasDue` **et** que l'action principale est une leçon (aucun doublon quand le CTA primaire est déjà `/review`).

## C. Objectif quotidien

- Affiché **une seule fois** (`X / Y mots|leçons` dans `TodayCard`).
- L'ancienne carte « Ton rythme » (GoalRing dupliqué) est **supprimée** ; son lien « Ajuster mon rythme » → `/profile` est déplacé en lien discret dans `TodayCard`.
- Logique `getDailyGoalProgress` **inchangée** (dépassement autorisé, UTC, informatif).

## D. Révisions

- Compteur **une seule fois** (`N à réviser` dans `TodayCard`).
- CTA de révision **une seule fois** (secondaire dans `TodayCard`).
- La section « Révisions à venir » (7 jours) est **conservée** (information distincte : échéancier futur).
- SRS / `review_items` / `LeitnerScheduler` **inchangés**.

## E. Couverture

- Affichée **une seule fois** (`≈ X % du Coran compris` dans `TodayCard`).
- L'ancienne carte `QuranCoverageCard` autonome est **supprimée**.
- Formule Phase 37 (`getQuranCoverage`) **inchangée**, toujours calculée pour alimenter le plan.

## F. Weekly Summary

Nouvelle couche pure : **`lib/learning/weekly-summary.ts`**

- `composeWeeklySummary(days, lastDays = 7)` → `{ words, lessons, activeDays }`.
- `formatWeeklySummary(summary)` → « 12 mots · 3 leçons · 4 jours actifs » (déterministe, singulier/pluriel correct, 0 au singulier).

## G. Définition des mots

`words` = **mots DISTINCTS étudiés** sur la période, issus de `user_activity_words` (définition identique à `recordLessonActivity` / `recordWordActivity`). Un mot × 6 exercices = 1. **Jamais** dérivé de `skill_attempts` (une tentative ≠ une acquisition).

## H. Définition des leçons

`lessons` = **leçons réellement terminées**, issues de `user_activity_lessons`. **Jamais** comptées depuis des sessions commencées/abandonnées ou de simples visites.

## I. Définition des jours actifs

`activeDays` = **nombre de dates distinctes** avec au moins une activité pédagogique (`wordsStudied > 0` ou `lessonsCompleted > 0`). Aucun lien avec `current_streak` (qui reste un compteur interne par compétence). Aucun streak créé.

## J. Période temporelle

**Fenêtre glissante des 7 derniers jours** (`days.slice(-7)` sur le résultat de `getActivityHistory(…, 30)`), cohérente avec la convention UTC existante (`getActivityDate`). Aucune nouvelle timezone introduite.

## K. UX

Structure cible réalisée :

```
AUJOURD'HUI
[Coach line]
[contexte sourate]
X / Y mots · N à réviser · ≈ X % du Coran
[CTA principal]  [Réviser maintenant si dû]
Ajuster mon rythme

CETTE SEMAINE
12 mots · 3 leçons · 4 jours actifs

(puis les zones secondaires : Découvrir les sourates · Tes sourates ·
 En quelques mots · Activité récente · Révisions à venir)
```

Nouvel utilisateur : « 0 mot · 0 leçon · 0 jour actif » + « Tes premiers chiffres apparaîtront avec ta première leçon. » — aucune valeur fictive, aucune culpabilisation.

## L. Responsive

- `390×844` et `1280×720` vérifiés en navigateur réel : **aucun overflow horizontal**, CTA et stats lisibles.

## M. RTL

- Composants et tokens Hikma réutilisés tels quels (aucune inversion artificielle des données). **Non observé en navigateur** (voir U).

## N. Accessibilité

- Structure sémantique conservée (`aria-labelledby`, `Caption`/`H1`/`H2`), focus/contraste hérités des composants Hikma existants. Aucun composant purement visuel introduit.

## O. Tests unitaires

**`tests/weekly-summary.test.ts`** — 11 tests :
- 0 activité → 0/0/0 ; une activité de mot ; un jour actif unique (mots + leçons le même jour) ; addition sur plusieurs jours ; leçon seule = jour actif ; semaine partielle ; jours hors fenêtre ignorés ; fenêtre personnalisée ; `formatWeeklySummary` (0/1/pluriel).

## P. E2E

E2E Playwright + Chrome authentifié (compte dédié, supprimé après) :

- **390×844** et **1280×720** : carte « Aujourd'hui » ✓, coach « Commence tranquillement » ✓, **objectif affiché 1×** ✓, **révisions 1×** ✓, **couverture 1×** ✓, « Cette semaine » + « 0 mot · 0 leçon · 0 jour actif » ✓, **1 seul CTA primaire** ✓, **pas de CTA de révision superflu** ✓.
- **Après seed** (hier 1 mot · aujourd'hui 1 mot + 1 leçon · 1 révision due) : « 2 mots · 1 leçon · 2 jours actifs » ✓, CTA secondaire « Réviser maintenant » apparaît ✓, **toujours 1 seul CTA primaire** ✓.
- **0 erreur console**, aucun overflow.
- **Nettoyage** : 0 compte de test résiduel (`phase39b-*`/`phase38b-*`).

## Q. Performance

**Aucune nouvelle requête DB** : le résumé hebdomadaire est dérivé du résultat déjà chargé de `getActivityHistory(…, 30)` (une requête déjà présente dans le `Promise.all`). Aucun N+1, aucun cache, aucune agrégation.

## R. Sécurité / RLS

- Aucun `user_id` accepté depuis le client : tout est dérivé de `client.auth.getUser()` côté serveur.
- RLS inchangée (`auth.uid() = user_id` sur toutes les tables utilisateur). Aucune fuite inter-utilisateur possible.

## S. Migrations

**`0 migration`.** Aucune table, RPC, snapshot ou agrégation créée.

## T. Non-régression

- `npx tsc --noEmit` ✅
- `npx eslint` ✅
- `npx vitest run` → **725/725** (714 + 11 nouveaux) ✅
- `npm run build` ✅
- SRS, mastery, curriculum, onboarding, formule de couverture, Daily Plan (38B) : **inchangés**.

## U. Limites

- **Non implémentés (hors scope, documentés, pas des bugs)** : historique de couverture, évolution de couverture (`REQUIRES_NEW_DATA`), streak, durée réelle d'étude, XP/classement, IA, badges.
- **RTL / reduced-motion** non observés en navigateur (`BROWSER_VALIDATION_LIMITED` pour ces seuls points).

## V. Décision finale

`PHASE_39B_IMPLEMENTATION_COMPLETE` — le dashboard raconte désormais **une** histoire de progression cohérente, sans nouvelle source de vérité ni migration.

### Fichiers modifiés / créés

- **Créé** : `lib/learning/weekly-summary.ts`, `tests/weekly-summary.test.ts`.
- **Modifié** : `app/(app)/dashboard/page.tsx` (consolidation UI uniquement).
- **Aucun** fichier de moteur pédagogique, de données Quran ou de migration touché.
