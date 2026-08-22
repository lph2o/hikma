# PHASE 38A — DAILY LEARNING PLAN / COACH NARRATIF : AUDIT READ-ONLY

Statut : `PHASE_38A_AUDIT_COMPLETE` — **aucun fichier modifié, aucune migration, aucune écriture DB, aucun commit.**

---

## A. État actuel du moteur pédagogique

Une seule chaîne de vérité, réutilisée partout :

```
validateAnswer → score
   ├─ applyAnswer            (user_word_progress.status + mastery)   lib/learning/progress.ts
   ├─ applySkillAttempt      (8 compétences, maîtrise par compétence) lib/learning/skill-progress.ts
   └─ ReviewEngine/Leitner   (SRS : intervalle + next_review_at)      lib/review/{engine,scheduler}.ts
```

- `user_word_progress.status` : `new` → `learning` (1er contact) → `familiar` (≥3 corrects, précision ≥0,50) → `mastered` (≥8 corrects, précision ≥0,80, intervalle ≥14 j). Erreur à `mastered` → rétrogradation `familiar`.
- `computeLessonStatuses` : leçon `COMPLETED` = tous ses mots `is_new` en `familiar`/`mastered` ; sinon `LOCKED`/`AVAILABLE`/`IN_PROGRESS`.
- `computeSurahProgress` : sourate `not_started` / `in_progress` / `completed` (complétion = toutes les leçons publiées terminées, PAS « maîtrise complète »).
- **Sélection du prochain apprentissage** : `selectActiveLearningPath` (Phase 35B) — hiérarchie **session active → progression réelle → recommandation → fallback → all_done**, jamais les préférences.

## B. État actuel du SRS

- Table `review_items` (`user_id`, `word_id`, `status ∈ {learning, review, relearning}`, `interval_days`, `next_review_at`).
- Scheduler `LeitnerScheduler` (déterministe, remplaçable) : bonne réponse → intervalle double (1→2→4→8→16…), mauvaise → 1 j ; `review` à ≥7 j ; erreur après graduation → `relearning`.
- **Dû** = `next_review_at <= now` **ou** `next_review_at IS NULL` (jamais revu) — `ReviewEngine.getDueItems`, `getReviewDueCount`.
- **Overdue** : aucune distinction séparée ; tout `<= now` est « dû » (même bucket).
- Priorité/ordre : `getDueReviewItems` trie par `next_review_at` croissant. **Aucun plafond de quantité** (tous les mots dus sont renvoyés).
- Écriture : `persistWordAttempts` → `replayWordResults` (rejoue chaque réponse à travers ReviewEngine + applyAnswer). `finish()` et `recordReviewAnswer` passent par la même fonction — **un seul moteur SRS**.

## C. État actuel des sessions

- `lesson_sessions` : état minimal de reprise (`current_exercise_index`, `results`, `skill_attempts`), `status ∈ {in_progress, completed}`, `UNIQUE(user_id, lesson_id)`.
- Reprise : `getActiveLessonSessionResolved` (session la plus récente, résolue vers sa sourate).
- Fin : `submitLessonResults` → `runLessonSubmission` (progression d'abord, activité ensuite, non bloquante). Aucune session « de révision » persistée (les révisions sont sans session, une réponse à la fois via `recordReviewAnswer`).

## D. Objectif quotidien

- Stocké dans `user_settings.daily_goal_type` (`words` | `lessons`) + `daily_goal_value` (**défaut 5**, migration 0018 + `DEFAULT_DAILY_GOAL_VALUE`).
- **Pourquoi 5** : constante produit par défaut, arbitraire mais volontairement conservatrice, **configurable** dans `/profile` (`GoalSettings`).
- Calcul : `getDailyGoalProgress` — `current = COUNT(journaux du jour)` ; `percent = min(100, round(current/goal×100))`.
  - `words` : mots **distincts** étudiés (leçons + révisions), dédup par `UNIQUE(user_id, activity_date, word_id)`.
  - `lessons` : leçons complétées (dédup par `UNIQUE(user_id, activity_date, lesson_id)`).
- **Jour** : `getActivityDate()` = **UTC uniquement** (aucun fuseau utilisateur aujourd'hui ; `timeZone` prévu mais jamais activé). Changement de jour = bascule de la date UTC → les journaux du nouveau jour sont naturellement vides.
- **Dépassement autorisé** : `current > goal` → `reached = true`, `percent` borné à 100. L'objectif est **purement informatif** : jamais utilisé par le moteur pédagogique.

## E. Préférences utilisateur exploitables

| Préférence | Valeurs | Usage réel | Exploitable pour le Daily Plan ? |
| --- | --- | --- | --- |
| `daily_goal_type/value` | words/lessons, int>0 | progress jour | **Oui** (X / objectif) |
| `daily_duration` | 5/10/15/20/30 | **copie seule** (`getDailyDurationLabel`) | **Seulement en libellé soft** — aucune estimation fiable de durée réelle (voir G) |
| `learning_pace` | daily_short/some_days/flexible/unknown | **copie seule** | Copie narrative seulement |
| `learning_goal` | 5 valeurs | **copie seule** | Copie narrative seulement |
| `preferred_surah_number` | number | recommandation (jamais > progression) | Copie de recommandation seulement |
| `arabic_reading_level`, `quran_familiarity` | enums | copie / recommandation | Copie seulement |

**Conclusion** : `daily_duration`, `learning_pace`, `learning_goal` sont **déclaratifs** (Phase 33B : « jamais un diagnostic de niveau »). Ils ne pilotent **aucun** moteur. Un Daily Plan peut s'en servir pour la **copie**, jamais pour décider quoi apprendre.

## F. Données disponibles (tout est déjà calculé)

| Besoin du Daily Plan | Donnée / fonction existante | Chargée par le dashboard ? |
| --- | --- | --- |
| Prochaine leçon / action | `selectActiveLearningPath` + `recommendStartingSurah` | ✅ |
| Session à reprendre | `getActiveLessonSessionResolved` | ✅ |
| Mots dus aujourd'hui | `getReviewDueCount`, `getDueReviewItems` | ✅ |
| Révisions à venir (7 j) | `getUpcomingReviewCounts` | ✅ |
| Objectif du jour (X / Y) | `getDailyGoalProgress` | ✅ |
| Historique 30 j | `getActivityHistory` | ✅ |
| Couverture du Coran | `getQuranCoverage` (Phase 37B) | ✅ |
| Stats globales mots | `getGlobalWordStats` | ✅ |
| Libellé de durée | `getDailyDurationLabel` | ✅ |
| Copie personnalisée | `getPersonalizedLearningCopy` | ✅ |

## G. Données manquantes

1. **Aucune estimation fiable de durée de session** : le nombre d'exercices varie (mots × types exploitables) et aucune donnée de timing n'existe. `daily_duration` est une **préférence déclarative**, pas une mesure. → Interdit de promettre « 10 minutes » ; au mieux reprendre le libellé soft existant (« une session d'environ 10 minutes ») déjà qualifié.
2. **Pas de notion « mots faibles du jour »** hors SRS : `user_word_skill_progress` permet de dériver des mots faibles, mais aucune query ne les expose en priorité quotidienne. (Non bloquant : le SRS couvre déjà la ré-exposition.)
3. **Pas de fuseau utilisateur** (UTC seulement) — le « jour » peut décaler de quelques heures selon l'utilisateur.
4. **Pas d'entité « plan »** : tout est **dérivé en lecture**, ce qui est justement l'architecture voulue (pas de table d'agrégation).

## H. Calcul de progression quotidienne

- Source de vérité : journaux insert-only `user_activity_lessons` / `user_activity_words`, **COUNT** dérivé (`getDailyActivity`), jamais stocké.
- `X / objectif` = `getDailyGoalProgress`.current / goalValue.
- Nouvelle acquisition vs révision : `words` **mélange** les deux (un mot étudié = 1 ligne, qu'il vienne d'une leçon ou d'une révision) ; `lessons` ne compte que les complétions. Le type d'objectif sélectionne l'un ou l'autre.
- **Pas de double comptage** : contraintes UNIQUE naturelles + `ignoreDuplicates`.

## I. Calcul des révisions

- Dû = `getReviewDueCount` (exact count, `next_review_at <= now`).
- Priorité = ordre d'échéance (`next_review_at` asc) ; aucun plafond, aucune « session » de révision (une réponse à la fois).
- `finish()` et `recordReviewAnswer` ré-planifient via le **même** `persistWordAttempts`/`replayWordResults`.

## J. Sélection de la prochaine activité

Déjà entièrement résolue par `selectActiveLearningPath` :

```
1. session active réelle  → « Reprendre » (la sourate réelle, jamais Al-Fātiḥah forcée)
2. progression réelle     → « Continuer X/Y » (sourate en cours la plus avancée)
3. recommandation         → « Découvrir » (uniquement sourate not_started)
4. fallback               → Al-Fātiḥah (référence)
5. all_done               → plus de nouvelle leçon
```

**Écart clé pour un Daily Plan unifié** : aujourd'hui les **révisions dues** ne sont **pas** intégrées à cette hiérarchie — elles sont affichées dans une carte séparée (« Réviser »). Il n'existe pas de « prochaine action unique » qui dise « révise d'abord X mots, puis continue ta leçon ». Ce n'est **pas** une lacune du moteur (la séparation apprentissage/révision est saine), mais le Daily Plan devra composer les deux sans inventer de priorité contradictoire.

## K. Interaction avec la couverture du Coran

- `getQuranCoverage` (Phase 37B) = métrique **cumulative** (`familiar ∪ mastered`, pondérée par occurrences).
- À utiliser comme **contexte/motivation** dans le plan (« Tu comprends ≈ X % du Coran »), **jamais** comme objectif quotidien (ce serait artificiel). Recommandation : affichage, pas cible.

## L. Cas limites (réponse actuelle du système)

| Cas | Comportement réel aujourd'hui |
| --- | --- |
| Nouvel utilisateur (0 progression) | recommandation/fallback « Découvrir », objectif 0/5, couverture 0 % |
| Onboardé mais aucune leçon | idem (aucune progression) |
| Objectif atteint | `reached=true`, `percent=100`, « Tu peux t'arrêter ici » |
| Objectif dépassé | `current>goal`, `reached=true`, percent borné 100 |
| Beaucoup de révisions dues | `reviewDueCount>0` → « Réviser maintenant » |
| Aucune révision due | « Tout est à jour » + prochaine échéance |
| Nouvelle leçon indisponible | `all_done` → « revoir tes mots » |
| Session interrompue | `active_session` → « Reprendre » |
| Session terminée | session disparaît → progression → prochaine leçon |
| Changement de jour | date UTC bascule → journaux du jour vides (recomptés) |
| Changement de timezone | N/A (UTC only) |
| Retour après plusieurs jours | révisions overdue réapparaissent + session active conservée |
| Préférences changées | copie/recommandation seulement, jamais la progression |
| Curriculum insuffisant | `all_done` ou fallback 1re sourate disponible |
| Couverture 0 % | nouvel utilisateur |
| Couverture proche du plafond (~18,76 %) | ~19 % (aucun plafond codé) |

## M. Architecture recommandée

**Option A — Réutilisation maximale : RETENUE.**

Le Daily Plan est une **couche d'orchestration/présentation PURE** qui compose des données **déjà chargées** par le dashboard. Aucune nouvelle query, aucun RPC, aucune agrégation :

```
composeDailyPlan({
  selection,        // selectActiveLearningPath (prochaine action)
  reviewDueCount,   // getReviewDueCount
  goal,             // getDailyGoalProgress
  coverage,         // getQuranCoverage
  durationLabel,    // getDailyDurationLabel
  personalized,     // getPersonalizedLearningCopy
}) → {
  primaryAction,    // Reprendre / Continuer / Découvrir / Réviser
  goalProgress,     // X / Y
  reviewDueCount,
  coveragePercent,
  coachLine,        // phrase déterministe (O)
}
```

- Option B (nouvelle query serveur) : **non nécessaire** — tout existe.
- Option C (RPC) : **non nécessaire**.
- Option D (agrégation persistée) : **non nécessaire** (volumétrie minuscule, 3 requêtes `count: exact` déjà mesurées en 37B).

## N. UX recommandée

Une carte « Aujourd'hui » qui **recompose** (ne remplace pas) les cartes existantes :

```
Aujourd'hui
  2 / 5 mots                ← getDailyGoalProgress
  3 mots à réviser           ← getReviewDueCount
  [ Reprendre ]              ← selectActiveLearningPath (CTA principal)

  ≈ 1 % du Coran compris     ← getQuranCoverage (contexte, pas cible)
```

- **Une seule action principale** (celle de `selection`), les révisions en **action secondaire** — on ne fait **pas** concurrencer révisions et parcours (le moteur les sépare déjà ; le Daily Plan ne doit pas inventer une priorité contraire).
- `daily_duration` → libellé soft existant (« une session d'environ 10 minutes »), **jamais** une durée garantie.
- La couverture apparaît en `Caption`/accent, pas comme objectif.

## O. Coach narratif

Un texte **déterministe et explicable**, sans IA. Exemples réalisables à partir des données actuelles :

- `goal.reached` → « Tu as terminé ton objectif du jour. »
- `!goal.reached` → « Il te reste N mots aujourd'hui. »
- `reviewDueCount > 0` → « N révisions t'attendent aujourd'hui. »
- `selection.kind === "active_session"` → « Reprends là où tu t'étais arrêté. »
- `coverage.coveragePercent > 0` → « Ta compréhension du Coran continue de progresser. »

Règle : une **seule** phrase, choisie par priorité déterministe (session → révisions → objectif → progression), composée à partir de données réelles. Réutiliser `getPersonalizedLearningCopy` pour le ton.

## P. Performance

- **0 requête supplémentaire** : le dashboard charge déjà toutes les données nécessaires (`goal`, `upcoming`, `history`, `progress`, `activeSession`, `globalWords`, `reviewDueCount`, `coverage`, `settings`, `catalog`). Le Daily Plan est une fonction pure en mémoire.
- Aucun N+1, aucun cache, aucune table.

## Q. Sécurité / RLS

- Toutes les lectures sont déjà protégées (RLS `auth.uid() = user_id` + filtre `userId` explicite). Le Daily Plan n'introduit aucune nouvelle surface.

## R. Tests nécessaires (Phase 38B)

- `composeDailyPlan` : session → Reprendre ; progression → Continuer ; recommandation → Découvrir ; all_done → Réviser ; 0/1/N révisions ; objectif atteint/dépassé ; couverture 0 %/positive/absente ; coach par état ; priorité déterministe.
- Non-régression : les **693** tests restent verts.

## S. Migrations éventuelles

**Aucune nécessaire.** Le Daily Plan est de la composition pure sur des données existantes.

## T. Proposition de Phase 38B

1. **MUST** — `lib/learning/daily-plan.ts` : `composeDailyPlan(...)` pure + `getCoachLine(...)` pure.
2. **MUST** — carte dashboard « Aujourd'hui » recomposant CTA principal + objectif + révisions + couverture, en réutilisant les composants/tokens existants (aucun nouveau design system).
3. **SHOULD** — coach narratif déterministe (1 phrase).
4. **COULD** — surligner la sourate/session dans le plan.
5. **REJECT** — toute IA de coaching, tout plan persistant, tout nouveau moteur de priorité, toute promesse de durée, tout objectif quotidien dérivé de la couverture.

---

## Décision finale

### MUST HAVE
- `composeDailyPlan` (composition pure de données existantes).
- Carte « Aujourd'hui » (CTA + objectif + révisions + couverture).

### SHOULD HAVE
- Coach narratif déterministe (une phrase, priorité explicite).

### COULD HAVE
- Surbrillance de la sourate active dans le plan.
- Libellé de durée soft (déjà existant).

### REJECT
- IA de coaching.
- Deuxième moteur de priorité/pédagogique.
- Promesse de durée garantie.
- Plan/agrégation persisté.
- Couverture comme objectif quotidien.

**STOP après ce rapport** — aucune implémentation tant que la Phase 38B n'est pas approuvée.
