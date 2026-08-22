# PHASE 34A — AUDIT DE PROGRESSION RÉELLE PAR SOURATE

## Statut

`PHASE_34A_PROGRESS_BY_SURAH_AUDIT_COMPLETE_READY_FOR_DESIGN`

Mode : **READ_ONLY**. Aucun fichier source, migration, donnée Supabase, donnée Quran, seed, test ou composant n'a été modifié. Aucun commit créé. Les changements non commités existants (dont Phase 33B) sont préservés.

## Réponse à la question centrale (section 3)

> **Hikma possède-t-il déjà suffisamment de données pour déterminer, pour chaque sourate exposable, si l'utilisateur ne l'a pas commencée, est en cours de parcours ou l'a terminée ?**

**OUI.**

Toutes les données nécessaires existent déjà, sans migration, sans nouveau moteur, sans modification du grading/scoring/SRS/mastery/scheduler/curriculum ni des données Quran. Le calcul peut être entièrement dérivé, côté serveur, en lecture seule, à partir de données déjà persistées.

Le seul travail restant est une **nouvelle fonction de lecture agrégée** (et sa couche de présentation), qui réutilise la fonction pure existante `computeLessonStatuses` — la même que le dashboard utilise déjà pour Al-Fātiḥah — appliquée à chaque sourate du catalogue.

---

## A. État actuel

### Ce qui existe déjà (source de vérité de la progression)

1. **Statut d'une leçon** : `lib/learning/session.ts` → `computeLessonStatuses(orderedLessons, progressByWord)` dérive, pour chaque leçon, `LOCKED / AVAILABLE / IN_PROGRESS / COMPLETED` à partir de `user_word_progress` uniquement. C'est la fonction pure, déterministe et déjà testée qui fait foi.
2. **Mots qui comptent pour la complétion** : `lib/learning/queries.ts` → `getLessonWordMap(lessonIds)` ne retient que les mots `lesson_words.is_new = true` (les mots de révision `is_new = false` réintroduits ne comptent pas).
3. **Contexte d'un utilisateur** : `getLearningContext(client, userId)` assemble déjà, pour **un seul** parcours (le parcours éditorial Al-Fātiḥah par défaut), `lessonStatuses`, `nextLesson`, `activeSession`, `lessonsCompleted`, `totalLessons`, etc.
4. **Session active** : `getActiveLessonSession(client, userId)` lit la session `lesson_sessions.status = 'in_progress'` la plus récente (une seule, `limit 1`).
5. **Catalogue de sourates** : `getSurahCatalog(client)` construit, en lecture seule et en batch, la liste des sourates exposables avec `state` (`REFERENCE` / `READY` / `IN_PREPARATION`), `lessonCount`, `firstLessonSlug`, `firstLessonTitle`. Il est **dépourvu de toute progression utilisateur** (aucun `userId`).
6. **Maîtrise par sourate (concept différent)** : `aggregateSurahMastery` existe mais agrège la **maîtrise des mots** (`STUDIED / MASTERED / DUE / …`), et n'est **consommée nulle part** dans l'application. Ce n'est pas la progression du parcours.

### Ce qui manque

Aucun code ne calcule actuellement, **pour toutes les sourates du catalogue à la fois**, la progression d'un utilisateur donné (leçons terminées / leçons disponibles / état par sourate). `getLearningContext` ne couvre que le parcours par défaut ; `getSurahCatalog` est sans utilisateur.

---

## B. Sources de données

### Relations (leçon → sourate)

```
surahs (id, number)
  ↑ learning_paths.surah_id  (nullable, 1:1 par convention de slug)
learning_paths (id, slug, sort_order)
  ↑ units.path_id  (1:N)
units (id, path_id, sort_order)
  ↑ lessons.unit_id  (1:N)
lessons (id, unit_id, slug, status, sort_order)   -- status ∈ draft|published|archived
  ↑ lesson_words.lesson_id  (1:N)
lesson_words (lesson_id, word_id, position, is_new)
  ↑ user_word_progress.word_id (1:1 par (user_id, word_id))
user_word_progress (user_id, word_id, status, mastery, …)  -- status ∈ new|learning|familiar|mastered
```

Chaîne utilisée par `getLessonWithWords` (déjà en production) : `lessons.unit_id → units.path_id → learning_paths.surah_id → surahs.number`.

### Liaison sourate ↔ parcours (1:1 par convention)

- `lib/learning/surah-curriculum.ts` → `planSurahCurriculum` génère un **unique** `learning_path` par sourate : slug `quran-surah-{number}`, `surah_id` renseigné.
- Al-Fātiḥah (1) utilise le parcours éditorial verrouillé slug `quran-vocabulary`, rattaché à `surah_id` de la sourate 1 par la migration `0027_learning_paths_surah.sql`.
- **Attention (non bloquant)** : il n'existe **pas de contrainte UNIQUE** sur `learning_paths.surah_id`. L'unicité repose aujourd'hui sur la convention de slug et le seed idempotent. La future lecture devra dédupliquer défensivement (comme `getSurahCatalog` le fait déjà en itérant les parcours) ou prendre la 1re correspondance, jamais supposer l'unicité en base.

### Colonnes pertinentes

| Table | Colonne | Rôle pour la progression |
|---|---|---|
| `lessons` | `status = 'published'` | filtre des leçons réellement disponibles |
| `lessons` | `sort_order` | ordre du curriculum (déverrouillage séquentiel) |
| `lesson_words` | `is_new = true` | mots qui définissent la complétion d'une leçon |
| `user_word_progress` | `status` | `familiar`/`mastered` = mot acquis ; `learning` = en cours ; `new` = non commencé |
| `lesson_sessions` | `status = 'in_progress'` | leçon réellement commencée (à reprendre), même avant écriture de mots |
| `review_items` | `next_review_at` | révisions dues — **sans effet** sur le statut « completed » du parcours |

### Fonctions existantes réutilisables

- `computeLessonStatuses` (pure) — source de vérité du statut de leçon.
- `getLessonWordMap` — mots `is_new` par leçon.
- `getUserWordProgress` — lecture **batch** (`IN word_ids`) de la progression par mot.
- `getSurahCatalog` — structure statique du catalogue (batch).
- `getLearningContext` — exemple d'assemblage complet pour un parcours.

---

## C. Définition recommandée

Compatible à 100 % avec le modèle existant, sans nouvelle donnée :

### `not_started`

Aucune leçon réellement commencée dans le parcours de cette sourate.

- aucun mot `is_new` de la sourate n'a de ligne `user_word_progress` avec `status != 'new'` ;
- **et** aucune session `lesson_sessions.status = 'in_progress'` sur une leçon de la sourate.

### `in_progress`

Au moins une leçon réellement commencée, mais toutes les leçons publiées ne sont pas terminées.

- au moins une leçon `IN_PROGRESS` ou `COMPLETED` **ou** une session active sur une leçon de la sourate ;
- et il existe au moins une leçon publiée non `COMPLETED`.

### `completed`

Toutes les leçons actuellement **publiées et démarrables** de cette sourate sont réellement terminées (statut `COMPLETED`).

> ⚠️ `completed` signifie **« parcours de découverte de la sourate terminé »**, PAS « maîtrise définitive de tous les mots ». Un utilisateur peut avoir `completed` **et** des révisions/SRS dues. C'est exactement la même sémantique que `allDone` du dashboard (`lessonsCompleted === totalLessons`), indépendante de `reviewDueCount`. Voir section 7 du cahier des charges.

### Pourcentage (si affiché)

```
completed_lessons / available_lessons * 100
```

- `available_lessons` = leçons `status = 'published'` du parcours de la sourate (jamais `IN_PREPARATION`, jamais `draft`/`archived`).
- `completed_lessons` = parmi elles, celles dont le statut `computeLessonStatuses` vaut `COMPLETED`.
- Ne jamais compter une leçon future/absente comme terminée, et ne jamais compter une leçon `IN_PREPARATION` comme disponible.

### Règle de cohérence obligatoire

Le calcul de « leçon terminée » doit **réutiliser exactement** `computeLessonStatuses` (sur les mots `is_new = true` via `getLessonWordMap`). Ne pas réinventer un second critère de complétion (ex. compter les lignes `lesson_sessions.status = 'completed'` ou `user_activity_lessons`) : cela créerait un second moteur et des divergences avec le dashboard.

---

## D. Architecture proposée

**Une nouvelle fonction serveur de lecture**, pas un nouveau moteur :

```ts
// lib/learning/queries.ts (ou nouveau lib/learning/surah-progress.ts)
export type SurahProgress = {
  surahNumber: number;
  state: SurahCatalogItem["state"];      // REFERENCE | READY | IN_PREPARATION
  totalLessons: number;                  // leçons publiées (= available_lessons)
  completedLessons: number;
  startedLessons: number;                // IN_PROGRESS + COMPLETED
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  hasActiveSession: boolean;             // leçon réellement commencée à reprendre
  firstLessonSlug: string | null;
};

export async function getSurahProgressByUser(
  client: SupabaseClient,
  userId: string,
  catalog?: SurahCatalogItem[],       // réutiliser le catalogue déjà chargé si fourni
): Promise<SurahProgress[]>
```

Étapes (toutes **batch**, aucune boucle par sourate) :

1. **Structure** : réutiliser la même lecture que `getSurahCatalog` (parcours+unités+leçons publiées+`lesson_words`), ou accepter le catalogue déjà chargé par l'appelant pour éviter la redondance.
2. **Mots `is_new` par leçon** : une requête `lesson_words` `is_new = true` `IN (tous les lesson_ids publiés)` → `Map<lesson_id, word_id[]>` (même logique que `getLessonWordMap`, mais étendue à toutes les sourates d'un coup).
3. **Progression utilisateur** : une requête `user_word_progress` `user_id = X` `IN (tous les word_ids is_new)` → `Map<word_id, row>` (réutilise `getUserWordProgress`).
4. **Sessions actives** : une requête `lesson_sessions` `user_id = X` `status = 'in_progress'` `IN (tous les lesson_ids publiés)` → `Set<lesson_id>`.
5. **Calcul en mémoire** : pour chaque sourate, reconstruire la liste ordonnée de ses leçons et appeler `computeLessonStatuses(orderedLessons, progressByWord)`, puis compter les `COMPLETED`/`IN_PROGRESS` et vérifier `hasActiveSession`.

**Aucune nouvelle table, colonne, migration ni seed.** Aucune écriture. Aucun changement dans `LessonPlayer`, le SRS, `user_word_progress`, le grading ou la mastery.

### Couche responsable du calcul

Le **serveur** (page `/surahs` et `/dashboard` en `force-dynamic`). Le calcul ne doit pas être effectué côté client, afin de respecter les RLS et d'éviter d'exposer la progression des mots.

---

## E. Performance (éviter le N+1)

Interdit (section 10) : boucle par sourate de `query lessons + query progress`.

Approche recommandée : **2 requêtes agrégées supplémentaires** en plus de la structure catalogue (déjà batch) :

| Requête | Coût | Notes |
|---|---|---|
| `lesson_words` (`is_new=true`, `IN lesson_ids`) | 1 | déjà la forme de `getLessonWordMap` |
| `user_word_progress` (`user_id`, `IN word_ids`) | 1 | déjà la forme de `getUserWordProgress` |
| `lesson_sessions` (`user_id`, `status=in_progress`, `IN lesson_ids`) | 1 | nouvelle, mais batch |

Soit **3 requêtes batch au total** pour la progression de toutes les sourates exposables, quel que soit leur nombre (14 aujourd'hui). Le regroupement par sourate se fait **en mémoire** à partir de maps `Map<id, …>`, exactement comme `getSurahCatalog` regroupe déjà les leçons par unité/parcours.

Optimisation possible : si l'appelant a déjà chargé `getSurahCatalog`, passer ce catalogue en paramètre pour ne pas relire la structure ; dans ce cas le coût additionnel tombe à **2 requêtes**.

Aucun chargement de mots coraniques, d'exercices, d'audio ou de MASAQ n'est nécessaire pour la progression.

---

## F. Dashboard (intégration sans écraser le prochain pas réel)

Hiérarchie à conserver (sections 3 et 8) :

1. **Priorité 1 — progression réelle** : session active à reprendre → prochaine leçon réelle → révision réellement due.
2. **Priorité 2 — découverte** : uniquement en l'absence d'action pédagogique prioritaire.

Impact de la future progression :

- La progression par sourate ne **remplace jamais** le CTA principal. Elle sert uniquement de contexte (« Ton parcours », « 3/8 leçons ») et éventuellement de CTA **secondaire** « Continuer ».
- Le CTA « Continuer » ne doit apparaître que si la sourate concernée est réellement `IN_PROGRESS` (session active ou mots commencés), **jamais** parce que `preferred_surah_number` est renseigné.
- La carte « Pour toi » (recommandation) reste secondaire et indépendante : recommandation (préférences/fallback) et progression (activité réelle) sont deux systèmes distincts qui peuvent coexister côte à côte, sans se mélanger.

Cas nominal proposé (cohérent avec Phase 33B) :

- session active sur la sourate S → CTA principal « Reprendre S » (données réelles), progression de S affichée en contexte ;
- aucune session mais sourate S `in_progress` → « Continuer S » en priorité sur la recommandation ;
- sourate préférée P sans aucune progression → « Découvrir P », jamais « Continuer P ».

---

## G. `/surahs` (affichage de la progression par sourate)

Le catalogue fournit déjà `state`, `lessonCount`, `firstLessonSlug`. La future fonction de progression ajoute, par sourate exposable, `completedLessons`, `status`, `hasActiveSession`.

Affichage possible par carte :

| État | Ligne de progression | CTA |
|---|---|---|
| `NOT_STARTED` | (aucune, ou « X leçons ») | `Commencer` |
| `IN_PROGRESS` (session active ou mots commencés) | `3 / 8` + barre `████░░░` | `Continuer` |
| `COMPLETED` | `8 / 8` | `Terminé` (non cliquable, ou « Revoir » secondaire) |

Contraintes :

- **`IN_PREPARATION`** : visible, explicatif, **jamais** de progression, de « Terminé », de CTA de démarrage, même si des données historiques existent (section 11). La progression ne s'affiche que pour `REFERENCE` et `READY`.
- **`preferred_surah_number`** ne doit jamais produire « Continuer » (section 12) : `Découvrir` si non commencée, `Continuer` seulement si réellement commencée.
- La barre de progression est une **présentation** de `completedLessons / totalLessons` ; elle n'est pas une mesure de maîtrise.

---

## H. Cas limites (liste complète et comportement attendu)

| Cas | Comportement attendu |
|---|---|
| Utilisateur sans aucune progression | Toutes sourates `NOT_STARTED`, CTA `Commencer` |
| Session active sur une leçon de la sourate S | S `IN_PROGRESS`, `hasActiveSession=true`, CTA `Continuer` (prioritaire) |
| Une seule leçon terminée | `IN_PROGRESS` : `1 / N`, CTA `Continuer` |
| Toutes les leçons publiées terminées | `COMPLETED` : `N / N`, CTA `Terminé` (non démarrable) |
| Toutes les leçons terminées + révisions dues | **`COMPLETED`** (le parcours est fini) ; les révisions restent visibles séparément (SRS ≠ progression) |
| Utilisateur historique (aucune préférence) | Aucun effet : progression calculée uniquement depuis l'activité réelle |
| `preferred_surah_number` sans progression | `NOT_STARTED` → `Découvrir`, jamais `Continuer` |
| Préférence vers sourate devenue indisponible | Préférence ignorée pour la progression ; aucun CTA illégitime |
| Sourate `REFERENCE` (Al-Fātiḥah) | Progression calculée normalement |
| Sourate `READY` | Progression calculée normalement |
| Sourate `IN_PREPARATION` (ex. Al-Māʿūn 107) | Aucune progression affichée, aucun CTA, jamais « Terminé » |
| Catalogue vide | Aucune carte ; aucune erreur |
| Leçon supprimée / archivée | `available_lessons` recalculé depuis les seules leçons `published` actuelles → les compteurs s'ajustent, jamais de « 3/8 » figé |
| Progression partielle (leçon abandonnée) | Session `in_progress` conservée → `IN_PROGRESS`/`Continuer` ; nettoyée à la complétion par `clearLessonSession` |
| Doublons de progression | Impossible par contrainte : `UNIQUE(user_id, word_id)` sur `user_word_progress`, `UNIQUE(user_id, lesson_id)` sur `lesson_sessions`, `UNIQUE(user_id, activity_date, lesson_id)` sur l'activité |

---

## I. Tests nécessaires

### Unitaires (fonction pure)

- `computeLessonStatuses` appliquée à un parcours multi-leçons avec progression nulle / partielle / complète (déjà couvert en partie, à étendre) ;
- fonction pure `deriveSurahStatus(completedLessons, totalLessons, hasActiveSession, anyStarted)` : `NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` (à extraire pour testabilité) ;
- pourcentage borné (0..100, arrondi, `totalLessons = 0` → pas de division) ;
- exclusion des mots `is_new = false` du critère de complétion.

### Intégration (requête simulée / mocks)

- catalogue vide → `[]` sans erreur ;
- sourate `IN_PREPARATION` → jamais de `status`/CTA de progression ;
- session active détectée par `lesson_sessions` même sans mot persisté ;
- `preferred_surah_number` sans progression → `NOT_STARTED` ;
- leçon archivée → `available_lessons` réduit, `completed` recalculé ;
- aucune préférence (historique) → progression inchangée.

### Non-régression (invariants)

- modification de `learning_goal`, `arabic_reading_level`, `quran_familiarity`, `daily_duration`, `learning_pace`, `preferred_surah_number` **ne change jamais** la progression, la maîtrise, le SRS, le scheduler ni le grading ;
- aucune nouvelle écriture : la future fonction ne doit être que `SELECT`.

---

## J. Risques

### P0 — aucun

### P1

1. Réinventer un second critère de « leçon terminée » (ex. `lesson_sessions.status='completed'` ou `user_activity_lessons`) → divergence avec le dashboard. **Mitigation** : réutiliser `computeLessonStatuses` sur les mots `is_new`.
2. Faire produire « Continuer » par `preferred_surah_number` → falsification de la progression. **Mitigation** : `Continuer` uniquement si `IN_PROGRESS` (données réelles).
3. Afficher une progression/CTA pour `IN_PREPARATION`. **Mitigation** : gate strict sur `state ∈ {REFERENCE, READY}`.

### P2

1. Absence de contrainte UNIQUE sur `learning_paths.surah_id` → risque théorique de parcours multiples par sourate. **Mitigation** : déduplication défensive côté lecture (même convention que `getSurahCatalog`).
2. Confusion « completed » vs « maîtrise/SRS ». **Mitigation** : documenter explicitement, garder les révisions séparées.
3. N+1 si implémentation naïve. **Mitigation** : 2-3 requêtes batch + regroupement en mémoire.

### P3

1. Accessibilité de la barre de progression (texte équivalent, `role="progressbar"`, `aria-valuenow`, contraste teal/or, RTL, mobile). À traiter en phase de design/implémentation.
2. Redondance si le catalogue est rechargé deux fois (dashboard + `/surahs`). **Mitigation** : accepter le catalogue déjà chargé en paramètre.

---

## K. Décision

`READY_FOR_IMPLEMENTATION`

La Phase 34B peut implémenter, en lecture seule, une progression réelle par sourate :

- **sans migration** (aucune table/colonne nouvelle) ;
- **sans nouveau moteur** (réutilisation de `computeLessonStatuses`) ;
- **sans modifier** `LessonPlayer`, le SRS, `user_word_progress`, le grading, la mastery, le scheduler, le curriculum ni les données Quran ;
- **sans N+1** (2-3 requêtes batch + calcul en mémoire) ;
- **sans falsification** (préférences exclues, `IN_PREPARATION` exclu, « Continuer » conditionné aux données réelles).

---

## Réponses explicites aux 12 questions (section 16)

1. **Source de vérité de « leçon terminée »** : `computeLessonStatuses` sur `user_word_progress.status` (`familiar`/`mastered` pour tous les mots `is_new = true` de la leçon).
2. **Leçon commencée** : statut `IN_PROGRESS`/`COMPLETED` dans `computeLessonStatuses`, **ou** une ligne `lesson_sessions.status = 'in_progress'` (session active) sur la leçon.
3. **Relier une leçon à une sourate** : `lessons.unit_id → units.path_id → learning_paths.surah_id → surahs.id` (chaîne déjà utilisée par `getLessonWithWords`).
4. **Sans migration ?** Oui.
5. **Sans nouveau moteur ?** Oui — réutilisation de `computeLessonStatuses`.
6. **Sans modifier `LessonPlayer` ?** Oui — lecture seule, aucun changement au joueur.
7. **Sans modifier le SRS ?** Oui — `review_items` n'intervient pas dans le statut de parcours.
8. **Sans modifier `user_word_progress` ?** Oui — lecture seule de cette table.
9. **Éviter le N+1 ?** Oui — 2-3 requêtes batch + regroupement en mémoire.
10. **Couche de calcul** : le serveur (page `force-dynamic`), via une nouvelle fonction de lecture type `getSurahProgressByUser`.
11. **Tests nécessaires** : section I ci-dessus.
12. **Cas limites** : section H ci-dessus.

---

## Non-régression

Aucune proposition de changement sur : grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, réponses libres, audio, Quran, traductions, MASAQ, corpus lexical, `LessonPlayer`. La future fonctionnalité est une **couche de lecture/présentation de la progression existante**.

Invariants préservés (non re-vérifiés en base dans cet audit read-only, inchangés par construction) : 114 sourates, 90 leçons publiées, 14 parcours exposables, Al-Māʿūn 107 `IN_PREPARATION`, `word_translations = 263`, MASAQ `97 / 170`, `FATIHAH_REFERENCE_LOCKED`.

## Fichiers inspectés

- `supabase/migrations/0003, 0010, 0011, 0012, 0013, 0016, 0017, 0018, 0025, 0027` ;
- `lib/learning/session.ts` (`computeLessonStatuses`), `lib/learning/surah-mastery.ts` (`aggregateSurahMastery`), `lib/learning/curriculum.ts`, `lib/learning/surah-curriculum.ts` (`planSurahCurriculum`, `isEditorialSurah`) ;
- `lib/learning/queries.ts` (`getSurahCatalog`, `getLearningContext`, `getLessonWordMap`, `getUserWordProgress`, `getActiveLessonSession`, `getLessonWithWords`) ;
- `lib/learning/actions.ts` (`submitLessonResults`, `saveLessonSession`, `clearLessonSession`), `lib/learning/lesson-submit.ts` ;
- `scripts/seed-multisurah-curriculum.ts` ;
- `app/(app)/dashboard/page.tsx`, `app/(app)/surahs/page.tsx`, `app/(app)/profile/page.tsx`.

`PHASE_34A_PROGRESS_BY_SURAH_AUDIT_COMPLETE_READY_FOR_DESIGN`
