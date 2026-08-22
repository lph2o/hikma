# PHASE 35A — GLOBAL LEARNING PROGRESS & CROSS-SURFACE CONSISTENCY AUDIT

Statut : `PHASE_35A_AUDIT_COMPLETE_ACTION_REQUIRED`

Mode : **READ_ONLY**. Aucun fichier source, aucune migration, aucune donnée
Supabase, aucun test, aucun moteur pédagogique n'a été modifié. Aucun commit n'a
été créé. Ce document est l'unique livrable de la phase.

---

## A. Executive Summary

Hikma possède **une source de vérité pédagogique unique et saine** pour la
progression d'une leçon (`computeLessonStatuses` sur `user_word_progress.status`)
et, par extension, pour la progression d'une sourate (`computeSurahProgress`).
Le chaînage `leçon → unit → learning_path → sourate` est déjà exploité en
production par `/surahs`.

**Mais il existe une incohérence fonctionnelle réelle entre les surfaces** :

> Le **dashboard** (et, par transit, `/learn` et `/profile`) reste **ancré sur le
> parcours éditorial Al-Fātiḥah** (`quran-vocabulary`), tandis que **`/surahs`**
> agrège la progression sur **toutes** les sourates.

Conséquence observable : un utilisateur dont l'unique activité réelle est sur
Al-ʿAṣr (sourate 103) voit `/surahs` afficher « Reprendre Al-ʿAṣr », mais le
dashboard afficher « Commencer Al-Fātiḥah » comme *prochain pas*. Le dashboard
ignore la session active et la progression des sourates hors Al-Fātiḥah.

C'est précisément le type de divergence P1 que la Phase 35A devait détecter. La
base est saine ; la correction est une **harmonisation de périmètre** (faire du
dashboard une surface « toutes sourates » ou, à défaut, aligner explicitement
les deux), pas un changement de moteur.

**Décision : `PHASE_35A_AUDIT_COMPLETE_ACTION_REQUIRED`.**

---

## B. Current Architecture

```
                       ┌─────────────────────────────┐
                       │  computeLessonStatuses       │  lib/learning/session.ts
                       │  (user_word_progress.status) │  ← SOURCE DE VÉRITÉ
                       └──────────────┬──────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
   ┌──────────▼──────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐
   │ getLearningContext   │  │ computeSurahProgress│  │ LessonPlayer       │
   │ (parcours UNIQUE)    │  │ (toutes sourates)   │  │ (leçon courante)   │
   │ DEFAULT = Al-Fātiḥah │  │ lit statuses        │  │ lit statuses       │
   └──────────┬──────────┘  └─────────┬──────────┘  └─────────┬─────────┘
              │                       │                       │
   ┌──────────▼──────────┐  ┌─────────▼──────────┐  ┌─────────▼─────────┐
   │ Dashboard / Learn /  │  │ /surahs            │  │ /learn/[slug]      │
   │ Profile              │  │ (multi-sourate)    │  │ lesson-complete    │
   └─────────────────────┘  └────────────────────┘  └────────────────────┘
```

Points clés de l'architecture :

1. `computeLessonStatuses(orderedLessons, progressByWord)` est **pur**,
   déterministe, sans dépendance Supabase/React. `COMPLETED` = tous les mots
   `is_new = true` de la leçon ont un `status` `familiar`/`mastered`.

2. `getLearningContext(client, userId, query)` assemble le contexte pour **un
   parcours** (`getCurriculum`). Sans `query`, il **force `slug =
   "quran-vocabulary"`** (Al-Fātiḥah, parcours éditorial verrouillé).

3. `computeSurahProgress(surah, progressByWord, activeSessionLessonIds)` est
   pur et réutilise `computeLessonStatuses` ; il agrège sur **toutes** les
   sourates via `getSurahProgressByUser` (6 requêtes batchées, groupage mémoire).

4. Le `LessonPlayer` et `lesson-complete.tsx` reçoivent `nextLesson` /
   `pathProgress` calculés côté serveur dans `/learn/[slug]/page.tsx` à partir
   de `getLearningContext` **scopé à la sourate de la leçon**.

---

## C. Canonical Progress Definitions

| État | Définition exacte | Source |
| --- | --- | --- |
| `not_started` | Aucune leçon démarrable n'a de session active, ni de statut `IN_PROGRESS`, ni `COMPLETED` | `computeSurahProgress` (sur `computeLessonStatuses` + `lesson_sessions`) |
| `in_progress` | ≥ 1 leçon a une session active ou un statut `IN_PROGRESS`/`COMPLETED`, **et** toutes les leçons ne sont pas `COMPLETED` | idem |
| `completed` | Toutes les leçons publiées/démarrables sont `COMPLETED` | idem |

`completed` = **parcours de découverte terminé**. Il ne signifie **pas** :
vocabulaire maîtrisé, sourate mémorisée, révisions SRS terminées, maîtrise SRS,
compréhension complète. Cette distinction est respectée partout où les mots
sont choisis avec soin (`Parcours terminé`, jamais « maîtrisé »).

`computeSurahProgress` documente explicitement cette sémantique et le dashboard
(`allDone`) réutilise la même convention (`lessonsCompleted === totalLessons`).

---

## D. Source-of-Truth Mapping

| Surface | Donnée | Source | Transformation | UI |
| --- | --- | --- | --- | --- |
| Dashboard | prochaine leçon | `getLearningContext` → `getCurriculum(slug=quran-vocabulary)` → `computeLessonStatuses` | `nextLesson` = 1ʳᵉ `IN_PROGRESS`/`AVAILABLE` | CTA principal |
| Dashboard | session active | `getActiveLessonSession` (global) **filtrée contre le curriculum Al-Fātiḥah** | match `lesson.id` dans le curriculum | « Reprendre la leçon » |
| Dashboard | leçons terminées | `getLearningContext` (Al-Fātiḥah) | `lessonsCompleted` | « X/Y leçons » |
| Dashboard | révisions dues | `getReviewDueCount` (**global**) | count `review_items` | « N mots attendent » |
| Surahs | statut sourate | `getSurahProgressByUser` → `computeSurahProgress` | agrégation **toutes sourates** | CTA Commencer/Continuer/Revoir |
| Surahs | progression | idem | `completedLessons/totalLessons` | barre + « 3/8 » |
| Learn | leçon actuelle | `getLearningContext({surahNumber})` → `computeLessonStatuses` | statut par leçon | liste du parcours |
| Completion | leçon terminée | `submitLessonResults` → `user_word_progress` | moteur Phase 3 | écran de fin |
| Profile | leçons/mots | `getLearningContext` (**Al-Fātiḥah**) | `lessonsCompleted`, `wordsSeen`, `wordsMastered` | « Vos statistiques » |
| Profile | à réviser | `getReviewDueCount` (**global**) | count `review_items` | « Mots à réviser » |

**Divergence de périmètre identifiée** : trois surfaces (dashboard, `/learn`,
`/profile`) lisent le **parcours Al-Fātiḥah uniquement**, tandis que `/surahs`
lit **toutes les sourates**. `getReviewDueCount` est **global** (toutes
sourates) même dans ces surfaces Al-Fātiḥah — incohérence interne au profil.

---

## E. Dashboard Audit

Hiérarchie réelle du dashboard :

```
primary = activeSession (dans le curriculum Al-Fātiḥah)
       ?? nextLesson (1ʳᵉ IN_PROGRESS/AVAILABLE d'Al-Fātiḥah)
       ?? null → CTA « Réviser mes mots » (/review)
```

- **P0** : aucune. La priorité session → prochaine leçon → révision est correcte
  **dans le périmètre Al-Fātiḥah**.
- **P1 — session active hors Al-Fātiḥah ignorée** : `getActiveLessonSession`
  retourne la session la plus récente **toutes sourates confondues**, mais le
  dashboard la matche contre `curriculum.units` (Al-Fātiḥah). Si la session est
  sur une leçon d'Al-ʿAṣr, le match échoue → `activeSession = null` → le
  dashboard retombe sur « Commencer Al-Fātiḥah ». Le prochain pas réel est
  perdu.
- **P1 — progression hors Al-Fātiḥah invisible** : `lessonsCompleted`,
  `wordsSeen`, `wordsMastered`, `pathPercent` sont Al-Fātiḥah-scopés. Un
  utilisateur qui a terminé Al-ʿAṣr mais pas Al-Fātiḥah est classé `firstVisit`
  (vrai si `wordsSeen === 0 && lessonsCompleted === 0` en Al-Fātiḥah) et reçoit
  « Commencer ».
- **P2 — `allDone` trompeur** : `allDone = lessonsCompleted === totalLessons`
  est vrai quand Al-Fātiḥah est terminée, même si d'autres sourates sont
  `IN_PREPARATION` ou `not_started`. Le CTA passe à « Réviser mes mots » alors
  que des parcours démarrables restent disponibles. Le wording « Ton parcours
  est terminé » est ambigu.
- La carte « Pour toi » respecte bien la règle : elle n'apparaît que si
  `firstVisit` ou (`primary == null` **et** `reviewDueCount === 0`). La
  recommandation ne remplace jamais un `primary` non-null. ✔️

---

## F. Surahs Audit

- Hiérarchie correcte : `Continuer ton parcours` (session active / plus avancé)
  → `Pour toi` (recommandation, seulement si `not_started`) → `Continuer` →
  `Prêtes à apprendre` → `Parcours terminés` → `Bientôt disponibles`.
- Le tri de `inProgress` est déterministe : session active d'abord, puis
  `completedLessons` décroissant, puis `surahNumber`. ✔️
- `nextLessonSlug` est la seule source du CTA `Continuer` ; sans slug, repli sûr
  sur `firstLessonSlug` (jamais de destination inventée). ✔️
- `IN_PREPARATION` (dont Al-Māʿūn 107) : aucune barre, aucun CTA, seule la
  mention « Bientôt disponible ». ✔️
- `preferred_surah_number` ne produit jamais `Continuer` : seul
  `computeSurahProgress` (activité réelle) alimente les statuts. ✔️
- Compteurs du hero issus uniquement de `computeSurahProgress` (jamais
  préférences ni `IN_PREPARATION`). ✔️

---

## G. Learn / Lesson Completion Audit

- `/learn/[slug]/page.tsx` calcule `nextLesson` et `pathProgress` via
  `getLearningContext(..., { surahNumber })` → **scopé à la sourate de la leçon**
  (contrairement au dashboard). ✔️
- **P1 — célébration liée à `nextLesson === null`, pas à `completed === total`** :
  `lesson-complete.tsx` déclenche la micro-célébration quand
  `nextLesson == null && pathProgress.total > 0`. Or `nextLesson` est `null`
  dès qu'on atteint la dernière leçon de la séquence, **y compris** si la leçon
  n'est pas réellement `COMPLETED` (ex. mots encore `learning`/`new` en cas de
  soumission partielle). La célébration peut donc se déclencher sans transition
  réelle vers `completed`.
- **P2 — `pathProgress.completed` périmé à l'écran de fin** : `pathProgress`
  est calculé au rendu serveur, **avant** la soumission des résultats. La barre
  de fin affiche donc le compte *pré*-complétion (ex. 7/8 après avoir fini la
  8ᵉ leçon).
- La célébration ne se rejoue pas à l'ouverture d'une page : elle est dans le
  composant client `LessonComplete`, uniquement atteint en fin de session. ✔️
  (mais cf. le P1 ci-dessus sur la condition de déclenchement).
- `Revoir` (sur une sourate `completed`) pointe vers `firstLessonSlug` : c'est
  un **rejeu de leçon** via le moteur normal, pas une réinitialisation. Il ne
  supprime ni ne réinitialise la progression, mais il **ré-applique** les
  réponses via `replayWordResults` (SRS/mastery avancent normalement). Ce n'est
  pas destructif, mais ce n'est pas non plus un simple « relire ». Nuance à
  trancher (cf. §K / §V).

---

## H. Profile Audit

- `getLearningContext(client, user.id)` **sans query** → Al-Fātiḥah.
- **P2 — libellés globaux pour des données Al-Fātiḥah** : la section
  « Vos statistiques » affiche « Leçons terminées X/Y », « Mots appris »,
  « Mots maîtrisés » — toutes Al-Fātiḥah-scopées — à côté de « Mots à réviser »
  qui, lui, est **global** (`getReviewDueCount`). Le même écran mélange deux
  périmètres sous un même chapeau « Vos statistiques ».
- Les préférences (`LearningPreferences`) sont correctement présentées comme
  non-pédagogiques (« Elles personnalisent ton accueil sans modifier ta
  progression, tes révisions ou tes exercices »). ✔️

---

## I. Cross-Surface Consistency Matrix

| Scénario | Dashboard | Surahs | Learn | Profile | Attendu |
| --- | --- | --- | --- | --- | --- |
| Aucun progrès | Commencer Al-Fātiḥah (firstVisit) | Pour toi / Prêtes à apprendre | première leçon dispo | 0/8 leçons | cohérent |
| Session active (Al-Fātiḥah) | Reprendre la leçon ✔️ | Reprendre ✔️ | reprise ✔️ | — | cohérent |
| Session active (hors Al-Fātiḥah) | ⚠️ Commencer Al-Fātiḥah | Reprendre ✔️ | reprise (si ouverte) | — | **DIVERGENCE P1** |
| 1 leçon terminée (Al-Fātiḥah) | Continuer leçon 2 ✔️ | Continuer ✔️ | leçon 2 ✔️ | 1/8 ✔️ | cohérent |
| Sourate 50 % (hors Al-Fātiḥah) | ⚠️ inchangé (Al-Fātiḥah) | 4/8 Continuer ✔️ | — | ⚠️ inchangé | **DIVERGENCE P1** |
| Dernière leçon | — | — | célébration ⚠️ (condition) | — | **RISQUE P1** |
| Sourate terminée (Al-Fātiḥah) | allDone → Réviser ✔️ | ✓ Terminée / Revoir ✔️ | — | — | cohérent |
| Sourate terminée (hors Al-Fātiḥah) | ⚠️ inchangé | ✓ Terminée ✔️ | — | ⚠️ inchangé | **DIVERGENCE P1** |
| Revoir | — | rejoue la leçon (non destructif) | — | — | à trancher |
| Plusieurs sourates en cours | ⚠️ ignore (Al-Fātiḥah) | tri déterministe ✔️ | — | — | **DIVERGENCE P1** |
| Préférence différente de la progression | Pour toi secondaire ✔️ | Pour toi secondaire ✔️ | — | — | cohérent |
| Historique (onboarding v1) | fonctionne (null-tolerant) ✔️ | fonctionne ✔️ | — | — | cohérent |
| IN_PREPARATION (Al-Māʿūn 107) | absent ✔️ | Bientôt disponible, sans CTA ✔️ | 404 si publié seulement ✔️ | — | cohérent |

---

## J. Session Priority

`getActiveLessonSession` retourne la session `in_progress` **la plus récente**
(`last_activity_at DESC`), toutes sourates confondues. C'est correct comme
source **globale**. Le problème est le **consommateur** :

- `/surahs` marque `activeLessonSlug` par sourate (correct, multi-sourate).
- `/dashboard` matche la session contre le **seul** curriculum Al-Fātiḥah et
  l'ignore si elle appartient à une autre sourate.

**La session active est la destination de reprise la plus importante. Le
dashboard doit donc soit adopter le même périmètre multi-sourate que `/surahs`,
soit être explicitement aligné.** Aujourd'hui il ne l'est pas.

---

## K. Multiple Active Surahs

`/surahs` gère correctement le cas multi-sourate : la carte principale = sourate
avec session active (sinon la plus avancée), puis les autres en grille, ordre
déterministe. ✔️

Le **dashboard** ne gère pas ce cas : il ne voit qu'Al-Fātiḥah. Aucune sélection
arbitraire n'existe (ce qui est bien), mais au prix d'une **omission** de
progression réelle.

---

## L. Historical Users

- `user_settings` est lu via `getUserSettings` avec coalescence `?? null` sur
  chaque champ ; `profileFromSettings` / le profil manuel du dashboard sont
  null-tolérants. ✔️
- `computeSurahProgress` ne dépend que de l'activité réelle : un utilisateur
  historique avec progression existante obtient les **mêmes** statuts qu'un
  nouvel utilisateur ayant la même activité. Aucune réinterprétation
  rétroactive. ✔️
- `onboarding_version = 1` n'affecte pas la progression (l'onboarding est une
  préférence, pas une donnée pédagogique). ✔️

---

## M. Recommendation vs Progression

- `recommendStartingSurah` (préférences + catalogue) est **distinct** de
  `computeSurahProgress` (activité réelle). Aucune fusion. ✔️
- Dashboard : la carte « Pour toi » n'apparaît que sans action prioritaire ;
  « Pour plus tard » quand une progression existe et qu'une sourate préférée
  différente a été choisie. ✔️
- Surahs : la recommandation n'est montrée que si `not_started`. ✔️
- `preferred_surah_number` ne produit jamais « Continuer ». ✔️

---

## N. Completed vs SRS/Mastery

| Concept | Signification | Surface(s) |
| --- | --- | --- |
| Progression sourate | leçons de découverte terminées | `/surahs` |
| Progression leçon | état d'une leçon (`computeLessonStatuses`) | dashboard/learn |
| SRS | révisions programmées (`review_items`) | `/review`, dashboard, profile |
| Mastery | maîtrise calculée (`user_word_progress.mastery`) | dashboard, profile |
| Word progress | progression sur les mots | moteur |
| Recommandation | suggestion personnalisée | dashboard, `/surahs` |

`completed` (sourate) est calculé **sans** consulter le SRS ni la mastery :
finir le parcours ne signifie pas « plus de révisions dues ». Ce point est
correctement documenté et implémenté. ✔️

Nuance : le dashboard affiche « Maîtrise moyenne » (`avgMastery`) **à côté** de
la progression de parcours, dans la même carte « En quelques mots ». C'est une
juxtaposition acceptable (deux métriques distinctes, libellées distinctement),
mais c'est le seul endroit où les deux concepts cohabitent visuellement.

---

## O. QuranProgress Inspiration

### Ce qui est pertinent pour Hikma
- Sentiment de chemin parcouru (déjà dans `/surahs` : hero + sections).
- Visibilité immédiate de « commencé / terminé » (déjà : badge + barre).
- Accès rapide au prochain point (`nextLessonSlug` → `Continuer`).
- Organisation en parcours/collection (déjà : sections conditionnelles).

### Ce qui ne doit pas être reproduit
- Badges artificiels, scores sans sens pédagogique, pourcentages de « maîtrise »
  inventés, classement, compétition, streak culpabilisant, gamification
  enfantine. Aucun n'est présent. ✔️

### Ce qui pourrait être envisagé plus tard
- Une surface « Mon parcours » globale (cf. §P), **une fois** le périmètre du
  dashboard harmonisé.

---

## P. Global Progress Feasibility

Une notion « X sourates commencées · Y terminées · Z leçons découvertes » est
**faisable sans migration** :

- `getSurahProgressByUser` fournit déjà, par sourate, `status`,
  `completedLessons`, `totalLessons`. Sommer `completedLessons` sur les sourates
  `REFERENCE/READY` donne « leçons découvertes » ; compter les `status` donne
  « commencées/terminées ».
- **Aucune nouvelle colonne/table n'est nécessaire.** La somme est un calcul en
  mémoire sur des données déjà chargées.
- **Performance** : 1 appel existant (6 requêtes batchées), aucune requête par
  sourate. Aucun N+1.
- **Pertinence pédagogique** : correcte **à condition** de libeller « leçons de
  découverte terminées » et non « maîtrise » / « Coran parcouru ». Risque UX :
  confondre « 24/90 leçons » avec une maîtrise du corpus.

**MAIS** : tant que le dashboard lit uniquement Al-Fātiḥah, toute métrique
globale affichée sur le dashboard divergerait de `/surahs`. La progression
globale doit donc être introduite **en même temps** que l'harmonisation du
périmètre, pas avant.

---

## Q. Performance Audit

- `getSurahProgressByUser` : 6 requêtes batchées (paths → units → lessons →
  lesson_words `is_new` → user_word_progress → lesson_sessions), groupage en
  mémoire, `computeSurahProgress` pur par sourate. **Aucun N+1.** ✔️
- `getLearningContext` : curriculum (paths+units+lessons) + `getLessonWordMap`
  (1) + `getUserWordProgress` (1) + `getReviewDueCount` (1) + session (1). Pas
  de boucle par leçon/sourate. ✔️
- Dashboard exécute `getLearningContext` **et** `getSurahCatalog` **et** 3
  appels activity en `Promise.all` : acceptable, mais `getSurahCatalog`
  charge la résolution FR + lemme (coûteuse) alors que le dashboard n'a besoin
  que de la recommandation. **P3 — optimisation possible** (un sous-ensemble du
  catalogue suffirait).
- `/surahs` exécute `getSurahCatalog` + `getSurahProgressByUser` (le second
  refait 6 requêtes structure). Pas de N+1, mais **P3 — duplication partielle**
  de la lecture structure (paths/units/lessons lus deux fois).

---

## R. Accessibility Audit (statique)

- Barres de progression : `HikmaProgress` reçoit `label` (« X / Y leçons ») et
  le rend texte + visuel. Statut non transmis par la seule couleur (badge
  « Terminée » = icône + texte). ✔️
- CTA accessibles (boutons/labels explicites), focus via composants du design
  system. ✔️
- Headings structurés (`H1` hero, `H2` par section, `aria-labelledby`). ✔️
- `prefers-reduced-motion` : confettis désactivés/réduits en CSS. ✔️
- **Non vérifié en navigateur** : contraste teal/or réel, RTL, ordre de tabulation,
  annonce lecteur d'écran de la barre. `BROWSER_VALIDATION_LIMITED`.

---

## S. Responsive Audit (code uniquement)

- `/surahs` : mobile-first, grilles `sm:grid-cols-2 lg:grid-cols-3`, carte
  principale pleine largeur. Pas de tableau. ✔️
- Aucune barre de progression débordante détectée statiquement (bornée par
  `HikmaProgress`).
- **Non vérifié** : 390×844, 375×812, 1280×720, RTL réel, scroll horizontal
  involontaire. `BROWSER_VALIDATION_LIMITED`.

---

## T. Risks

### P0
- Aucune détectée (aucune surface ne réinitialise ni ne perd de progression).

### P1
1. **Dashboard ignore la progression/session des sourates hors Al-Fātiḥah**
   (ancrage `quran-vocabulary` vs `/surahs` multi-sourate). Divergence
   Dashboard ↔ Surahs sur le « prochain pas ».
2. **Célébration de fin de sourate déclenchée sur `nextLesson === null`**, pas
   sur la transition réelle `completed === total` (risque de célébration
   prématurée en cas de soumission partielle).

### P2
3. `allDone` (dashboard) = « Al-Fātiḥah terminée », pas « tous parcours
   terminés » ; wording « Ton parcours est terminé » ambigu.
4. Profil : « Vos statistiques » mélange données Al-Fātiḥah (leçons/mots) et
   données globales (à réviser).
5. `Revoir` = rejeu de leçon (ré-applique SRS/mastery) : non destructif mais
   pas un simple « relire » — sémantique à trancher.
6. `pathProgress.completed` périmé à l'écran de fin (calculé avant soumission).

### P3
7. Dashboard charge `getSurahCatalog` complet (FR + lemme) pour la seule
   recommandation.
8. `/surahs` lit la structure (paths/units/lessons) deux fois (catalogue +
   progression).

---

## U. Missing Tests

Couverture existante : `tests/surah-progress.test.ts` (10 cas),
`tests/surah-progress-copy.test.ts` (12 cas), `tests/session.test.ts`
(`computeLessonStatuses`), `tests/lesson-completion.test.ts` (soumission),
`tests/personalized-learning-copy.test.ts`, `tests/onboarding-*.test.ts`.

Scénarios manquants (pour une future Phase 35B) :

1. Cohérence Dashboard ↔ Surahs sur un même utilisateur (session active hors
   Al-Fātiḥah → le dashboard ne doit pas afficher « Commencer »).
2. Célébration déclenchée **uniquement** quand `completedLessons === totalLessons`
   (et non `nextLesson === null`).
3. `pathProgress.completed` reflétant la complétion **post**-soumission.
4. `allDone` multi-sourate (toutes sourates `REFERENCE/READY` terminées vs
   seulement Al-Fātiḥah).
5. Périmètre du profil (leçons/mots globaux vs Al-Fātiḥah) explicité.
6. Intégration batchée : cohérence `getSurahProgressByUser` ↔
   `computeLessonStatuses` ↔ `getLearningContext` sur un même jeu de données.
7. Exclusion `IN_PREPARATION` dans toute métrique globale.
8. Catalogue vide / aucun parcours `READY` → états contrôlés (partiellement
   couvert par `getSurahHeroCopy`).
9. Utilisateur historique `onboarding_version = 1` → mêmes statuts.
10. `Revoir` : assertion explicite de non-destruction (aucune ligne supprimée,
    aucune réinitialisation de `completed`).

---

## V. Recommended Phase 35B

**Objectif** : éliminer la divergence de périmètre P1, sans toucher au moteur.

1. **Harmoniser le dashboard en surface « toutes sourates »** :
   - soit basculer le « prochain pas » sur `getSurahProgressByUser` (choix
     déterministe : session active → plus avancé → ordre catalogue), en
     conservant la priorité session → leçon → révision ;
   - soit, à défaut, aligner explicitement le dashboard sur `/surahs` en
     affichant la même carte principale.
2. **Corriger la condition de célébration** : la lier à la transition réelle
   `completedLessons === totalLessons` (pas `nextLesson === null`), et ne pas
   célébrer si la soumission n'a pas abouti (`phase === "complete"` seulement
   après `success`).
3. **Clarifier `pathProgress.completed`** à l'écran de fin (incrémenter le
   compte affiché pour la leçon qui vient d'être terminée, ou recalculer).
4. **Clarifier le périmètre du profil** : soit rendre les statistiques
   globales, soit libeller explicitement « sur Al-Fātiḥah ».
5. **Trancher `Revoir`** : garder le rejeu (et l'assumer) ou pointer vers une
   relecture non notée.
6. Ajouter les tests manquants du §U.

**Non-régression** : ne rien modifier dans grading, scoring, SRS, mastery,
scheduler, interleaving, curriculum, LessonPlayer, audio, Quran, traductions,
MASAQ, corpus lexical, `FATIHAH_REFERENCE_LOCKED`.

---

## W. Non-Regression

Aucun moteur pédagogique ni aucune donnée Quran n'a été modifié. Les invariants
sont préservés :

- grading, scoring, réponses libres, SRS, mastery, scheduler, interleaving,
  curriculum, LessonPlayer, audio : **inchangés**.
- Données Quran, traductions, MASAQ, corpus lexical : **inchangés**.
- `FATIHAH_REFERENCE_LOCKED` (Al-Fātiḥah = `REFERENCE`) : **intact**.
- `IN_PREPARATION` (dont Al-Māʿūn 107) : **protégé**, aucun CTA.
- Progression utilisateur existante : **intacte** (aucune écriture).

---

## X. Final Decision

```
PHASE_35A_AUDIT_COMPLETE_ACTION_REQUIRED
```

Justification : la base est saine (source de vérité unique et pure), mais une
**incohérence fonctionnelle P1 réelle** existe entre le dashboard (et ses
satellites `/learn`/`/profile`, ancrés sur Al-Fātiḥah) et `/surahs`
(multi-sourate). Un utilisateur dont la progression réelle est hors Al-Fātiḥah
voit deux « prochain pas » différents selon la surface. Une correction de
périmètre est requise **avant** tout travail de design. La célébration de fin
de sourate présente également une condition de déclenchement à durcir (P1).

Aucun code n'a été modifié pendant cette phase.
