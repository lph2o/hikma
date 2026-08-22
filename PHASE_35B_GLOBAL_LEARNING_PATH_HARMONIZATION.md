# PHASE 35B — GLOBAL LEARNING PATH HARMONIZATION

Statut : `PHASE_35B_GLOBAL_LEARNING_PATH_HARMONIZATION_COMPLETE_READY_FOR_APPROVAL`

---

## 1. BEFORE_STATE

La Phase 35A avait identifié une divergence architecturale P1 :

- `/surahs` utilisait une progression réelle et **globale** par sourate
  (`computeSurahProgress` / `getSurahProgressByUser`).
- `/dashboard`, `/learn` et `/learn/units/[slug]` étaient encore ancrés sur le
  parcours historique Al-Fātiḥah (`quran-vocabulary`) :
  - `getCurriculum()` sans filtre forçait `slug = "quran-vocabulary"` ;
  - `getLearningContext()` (sans query) héritait de ce défaut ;
  - `getActiveLessonSession()` (globale) était **filtrée** contre le curriculum
    Al-Fātiḥah dans `getLearningContext` → une session active sur Al-ʿAṣr était
    silencieusement ignorée par le dashboard ;
  - `/profile` présentait des statistiques Al-Fātiḥah sous le libellé global
    « Vos statistiques » ;
  - `lesson-complete.tsx` déclenchait la célébration de fin de sourate sur le
    seul `nextLesson === null` (dernière leçon de séquence), pas sur la vraie
    transition `completed === total`.

Conséquence observable : un utilisateur dont la progression réelle était sur
Al-ʿAṣr voyait `/surahs` afficher « Reprendre Al-ʿAṣr » mais le dashboard
afficher « Commencer Al-Fātiḥah ».

## 2. ROOT_CAUSE

Le concept de « parcours actif » n'existait pas comme **couche partagée**. Chaque
surface décidait localement :

- `/surahs` : `getSurahProgressByUser` (global) ;
- `/dashboard`, `/learn` : `getLearningContext` (Al-Fātiḥah par défaut) ;
- `/profile` : `getLearningContext` (Al-Fātiḥah par défaut).

Al-Fātiḥah était donc à la fois un **parcours de référence** (légitime) et le
**parcours actif universel par défaut** (illégitime dès qu'une progression réelle
existe ailleurs).

## 3. QURAN-VOCABULARY_DEPENDENCIES

Audit des occurrences de `quran-vocabulary` et des hypothèses `surah = 1` :

| Occurrence | Catégorie | Décision |
| --- | --- | --- |
| `queries.ts:111` `getCurriculum` → `slug = "quran-vocabulary"` sans filtre | **C — hypothèse incorrecte de parcours actif** | conservée comme FALLBACK pur, mais plus jamais utilisée comme parcours actif : `/dashboard`, `/learn`, `/learn/units/[slug]` résolvent désormais le parcours réel (surahNumber/pathId) |
| `onboarding.ts:85` fallback Al-Fātiḥah dans `recommendStartingSurah` | **B — valeur par défaut de découverte** | conservée (recommandation initiale légitime) |
| `personalization.ts:219` raison « Al-Fātiḥah est notre point de départ de référence » | **A — référence historique légitime** | conservée |
| `queries.ts:155` `classifySurahReadiness` → `surahNumber === 1` = REFERENCE | **D — dépendance structurelle légitime** (FATIHAH_REFERENCE_LOCKED) | conservée |
| `surah-curriculum.ts` `EDITORIAL_PATH_SURAH_NUMBERS = {1}` | **D — dépendance structurelle légitime** | conservée |
| Landing `href="/learn/basmala"` | **B — valeur par défaut de découverte** (visiteur) | conservée |

Aucune hypothèse `surah = 1` ne subsiste dans le chemin du parcours actif d'un
utilisateur authentifié.

## 4. DASHBOARD_AUDIT

Le dashboard utilise désormais une hiérarchie déterministe de parcours actif :

```
SESSION ACTIVE RÉELLE (globale, la plus récente)
        ↓
PROGRESSION RÉELLE (sourate in_progress la plus avancée)
        ↓
RECOMMANDATION (Pour toi, jamais « Continuer »)
        ↓
FALLBACK AL-FĀTIḤAH
```

Implémentation : `selectActiveLearningPath` (pure) consommée par le dashboard,
qui récupère en parallèle `getSurahProgressByUser` + `getActiveLessonSessionResolved`
+ `getGlobalWordStats` + `getReviewDueCount`. Le CTA principal est :
- `active_session` → « Reprendre » (vraie leçon de reprise) ;
- `in_progress` → « Continuer » + `X / Y leçons` + barre ;
- `recommendation`/`fallback` → « Découvrir » + raison toujours vraie ;
- aucune leçon → « Réviser mes mots » (`/review`).

Les stats « En quelques mots » sont **globales** (mots vus/maîtrisés toutes
sourates, révisions dues globales). La section « Tes sourates » agrège
`summarizeSurahProgress` (somme sur les sourates démarrables).

## 5. LEARN_AUDIT

`/learn` était un « conteneur du parcours quran-vocabulary » historique. Il est
désormais un **résolveur du parcours réel** :

- utilisateur authentifié → `selectActiveLearningPath` (session → progression →
  recommandation → fallback) → `getLearningContext({ surahNumber })` ;
- visiteur → `getLearningContext()` (fallback référence, inchangé).

Aucune nouvelle logique pédagogique : `/learn` délègue toujours le calcul de
statut à `computeLessonStatuses` via `getLearningContext`. Il ne fait que choisir
le bon `surahNumber`.

## 6. ACTIVE_SESSION_AUDIT

`getActiveLessonSession` reste la source de vérité de la session la plus récente
(toutes sourates, `last_activity_at DESC`). Nouveau : `getActiveLessonSessionResolved`
résout cette session vers `{ lessonSlug, surahNumber }` à travers la chaîne
`lesson → unit → path → surah`. Aucun N+1 (résolution d'une seule session).

Le dashboard et `/learn` utilisent cette résolution **sans** filtrer contre un
curriculum Al-Fātiḥah : une session active sur Al-ʿAṣr est trouvée même si
`preferred_surah_number = 1`.

## 7. GLOBAL_PROGRESS_MODEL

Nouveau module pur `lib/learning/active-path.ts` (aucune dépendance Supabase /
React / Next / MASAQ / moteur) :

- `selectActiveLearningPath({ progress, activeSession, recommendation, catalog })`
  → `ActivePathSelection` (`kind`, `surahNumber`, `surahName`, `lessonSlug`,
  `completedLessons`, `totalLessons`). Les sourates `IN_PREPARATION` sont
  exclues du parcours actif même si des données de progression historiques
  existent.
- `summarizeSurahProgress(progress, catalog)` → `SurahSummary` (sourates
  commencées/terminées/disponibles, leçons terminées/total) sur les sourates
  démarrables uniquement.

La source de vérité reste `computeLessonStatuses` / `computeSurahProgress` /
`getSurahProgressByUser`. Ces fonctions composent, elles ne recalculent rien.

## 8. IMPLEMENTATION

Fichiers modifiés / créés :

- **Créé** `lib/learning/active-path.ts` — sélection pure + résumé global.
- **Modifié** `lib/learning/queries.ts` — ajout `getActiveLessonSessionResolved`,
  `getGlobalWordStats`, `getPathIdByUnitSlug`.
- **Modifié** `app/(app)/dashboard/page.tsx` — CTA principal surah-aware + stats
  globales + section « Tes sourates ».
- **Modifié** `app/(app)/learn/page.tsx` — résout le parcours réel (plus de
  `quran-vocabulary` forcé).
- **Modifié** `app/(app)/learn/units/[slug]/page.tsx` — résout l'unité par son
  path globalement.
- **Modifié** `app/(app)/profile/page.tsx` — statistiques globales (leçons/mots
  toutes sourates).
- **Modifié** `components/learn/lesson-complete.tsx` + `lib/learning/surah-progress-copy.ts` —
  célébration liée à la vraie transition `completed === total - 1` avant la leçon.
- **Modifié** `components/learn/lesson-player.tsx` + `app/(app)/learn/[slug]/page.tsx` —
  propagation du nom de sourate à la célébration.

## 9. TESTS

- **Créé** `tests/active-path.test.ts` (15 tests) : couvre les cas A, B, C, D, F,
  H, I du cahier des charges, plus IN_PREPARATION, catalogue vide, fallback,
  déterminisme multi-sourates, « aucune préférence en entrée ».
- **Complété** `tests/surah-progress-copy.test.ts` (6 nouveaux tests) :
  transition vraie, leçon intermédiaire, revisite, leçons manquantes, parcours
  vide, sourate à une seule leçon.

Mapping des cas critiques :
- A (aucune progression → Al-Fātiḥah recommandation) ✅
- B (progression Al-ʿAṣr → Al-ʿAṣr) ✅
- C (session Al-ʿAṣr → Reprendre Al-ʿAṣr) ✅
- D (préférence Fātiḥah + progression ʿAṣr → progression gagne) ✅
- E (`/learn` progression ʿAṣr → ne revient pas à quran-vocabulary) ✅ (code)
- F (Fātiḥah terminée + ʿAṣr en cours → ʿAṣr) ✅
- G (session non-Fātiḥah → `getActiveLessonSessionResolved` correcte) ✅ (code)
- H (préférence ʿAṣr sans progression → Pour toi ʿAṣr) ✅
- I (préférence ʿAṣr sans progression → jamais Continuer) ✅

Total suite : **635 tests passent** (50 fichiers).

## 10. PERFORMANCE

- Aucun N+1 introduit.
- Dashboard : 7 requêtes batchées en `Promise.all` (goal, upcoming, history,
  surah progress, session résolue, global word stats, review due). `getSurahCatalog`
  reste une lecture batchée.
- `/learn` : `getSurahCatalog` + `getSurahProgressByUser` + `getActiveLessonSessionResolved`
  (4 requêtes structurelles batch) + `getLearningContext` scoped. Aucune requête
  par carte/leçon/sourate.
- `getActiveLessonSessionResolved` : chaîne constante (1 session → 4 petites
  requêtes), indépendante de la taille du catalogue.

## 11. NON_REGRESSION

Aucun moteur pédagogique ni donnée Quran modifiés :
- grading, scoring, SRS, mastery, scheduler, interleaving, curriculum,
  LessonPlayer (fonctionnel), audio, traductions, MASAQ, corpus lexical :
  **inchangés**.
- `LessonPlayer` : modification limitée à la propagation d'un prop `surahName`
  (aucun changement de logique de session/scoring).
- `computeLessonStatuses`, `computeSurahProgress`, `getSurahProgressByUser` :
  **inchangés** (seulement consommés).
- `FATIHAH_REFERENCE_LOCKED` (Al-Fātiḥah = REFERENCE) : **intact**.
- `IN_PREPARATION` (Al-Māʿūn 107) : toujours exclu de tout CTA / parcours actif.
- Aucune migration créée. Aucune donnée persistée en double.
- Onboarding, préférences, RLS, authentification : **inchangés**.

## 12. BROWSER_VALIDATION

`BROWSER_VALIDATION_LIMITED` — aucun navigateur contrôlable n'a pu être attaché.
Les scénarios visuels suivants n'ont **pas** été déclarés PASS :
- 390×844, 375×812, 1280×720 ;
- nouveau utilisateur / progression multi-sourates / session active ;
- fin de sourate + célébration + `prefers-reduced-motion` ;
- clavier/focus, contraste, RTL, absence d'overflow.

La logique a été validée par tests unitaires + TypeScript + ESLint + build uniquement.

## 13. LIMITATIONS

1. **Célébration** : la condition est désormais `completed === total - 1` (vraie
   transition), mais elle reste calculée côté rendu serveur (`pathProgress` pré-
   soumission). Le cas « dernière leçon terminée avec des mots non acquis » est
   couvert par le fait que `computeLessonStatuses` n'incrémente `completed` que
   pour une leçon réellement COMPLETED ; la barre affichée sur l'écran de fin
   reste pré-soumission (limitation cosmétique déjà documentée en 35A).
2. **`getPathIdByUnitSlug`** : prend la première unité par `sort_order` si un slug
   d'unité était dupliqué entre parcours (aujourd'hui les slugs générés
   `surah-{n}` sont uniques). Aucun risque actuel.
3. **`getGlobalWordStats`** : une requête `user_word_progress` sans filtre de
   mots ; acceptable au volume actuel, à surveiller si le corpus étudié par
   utilisateur devenait très grand.

## 14. AFTER_STATE

Le concept de parcours actif est désormais **cohérent** entre `/dashboard`,
`/learn`, `/surahs` et `/profile` :

```
SESSION ACTIVE RÉELLE → PROGRESSION RÉELLE → RECOMMANDATION → FALLBACK AL-FĀTIḤAH
```

Al-Fātiḥah reste le **point de départ recommandé** et le **parcours de
référence**, mais n'est **jamais** le parcours actif d'un utilisateur ayant une
progression réelle sur une autre sourate. `preferred_surah_number` ne produit
jamais « Continuer » ; il n'influence que « Pour toi / Découvrir ».

## 15. FINAL_DECISION

```
PHASE_35B_GLOBAL_LEARNING_PATH_HARMONIZATION_COMPLETE_READY_FOR_APPROVAL
```

Validation : `npx tsc --noEmit` ✅ · `npx eslint` ✅ · `npx vitest run` 635/635 ✅ ·
`npm run build` ✅. Aucun commit créé (règle des phases).
