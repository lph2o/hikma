# PHASE 39A — PROGRESSION GLOBALE, HISTORIQUE & MOTIVATION PÉDAGOGIQUE

**Statut : `PHASE_39A_PROGRESS_AUDIT` (READ-ONLY)**

> Aucun code produit modifié, aucune migration, aucune écriture DB, aucun commit/push.
> Seul livrable : ce rapport.

---

## A. Executive Summary

Hikma possède **déjà** une représentation de progression riche et **cohérente avec son moteur pédagogique**, mais elle est **éclatée** sur le dashboard et **partiellement historique**.

**Ce qui est solide (READY) :**

- **Progression actuelle par forme** : `user_word_progress` (`status` + `mastery` 0–100 + compteurs) est une source de vérité unique et suffisante pour « vu / familier / maîtrisé ».
- **Progression quotidienne** : les journaux insert-only `user_activity_lessons` / `user_activity_words` donnent une progression du jour **fiable, idempotente et dérivée** (jamais stockée en compteur mutable).
- **Couverture du Coran** (Phase 37B) : `familiar + mastered` pondérés par `word_occurrences`, honnête et bornée par le curriculum.
- **SRS / révisions dues** : `review_items` + `LeitnerScheduler`, source unique partagée par `finish()` et les révisions.

**Ce qui manque ou est partiel :**

- **Historique par mot/mastery** : `user_word_progress` ne conserve **pas** l'historique des transitions de statut → impossible de reconstruire « mastery à J-7 » ou « date du 1er mot maîtrisé ».
- **Évolution de la couverture dans le temps** : **non reconstructible** sans nouvelle donnée (snapshot/event log).
- **Révisions effectuées / exercices réalisés / taux de réussite par période / temps d'étude** : **non disponibles** en l'état (pas de journal de tentatives ni de durée).
- **Sessions abandonnées** : non tracées (`lesson_sessions` est un état courant, supprimé à la complétion, jamais un historique).

**Conclusion** : la Phase 39B la plus rentable n'est **pas** une nouvelle métrique, mais une **consolidation UX** de la progression (fusion des 2 CTA primaires + ajout d'un résumé hebdomadaire dérivé des journaux existants, **sans migration**). L'« évolution de couverture » — la plus motivante — exige une nouvelle donnée persistée et doit être **déférée** avec une proposition de migration précise, pas improvisée.

---

## B. Sources de progression

| Source | Type | Clé utilisateur | Timestamp(s) | Granularité | Source de vérité de… |
|---|---|---|---|---|---|
| `user_word_progress` | état courant | `user_id` | `created_at`, `updated_at`, `last_seen_at`, `next_review_at` | 1 ligne / (user, mot) | statut, mastery, compteurs, dernière interaction |
| `user_word_skill_progress` | état courant (additif) | `user_id` | `created_at`, `updated_at`, `last_attempt_at`, `last_correct_at`, `last_incorrect_at` | 1 ligne / (user, mot, skill) | maîtrise par compétence (8 dims + `retention`) |
| `review_items` | état courant SRS | `user_id` | `created_at`, `updated_at`, `last_review_at`, `next_review_at` | 1 ligne / (user, mot) | planification SRS (intervalle, échéance) |
| `lesson_sessions` | état courant (reprise) | `user_id` | `started_at`, `last_activity_at`, `completed_at` | **UNIQUE** / (user, leçon) | leçon en cours uniquement (supprimée à la complétion) |
| `user_activity_lessons` | journal insert-only | `user_id` | `activity_date` (date), `created_at` | 1 ligne / (user, jour, leçon) | leçons complétées par jour |
| `user_activity_words` | journal insert-only | `user_id` | `activity_date` (date), `created_at` | 1 ligne / (user, jour, mot) | mots DISTINCTS étudiés par jour (leçons + révisions) |
| `user_settings` | configuration | `user_id` (PK) | `created_at`, `updated_at` | 1 ligne / user | objectif quotidien + préférences onboarding |

**Aucune table « événements d'apprentissage » générique, aucun historique de tentatives, aucune table de durée d'étude n'existe.**

---

## C. Unités pédagogiques

- **forme coranique** = 1 ligne `quran_words` (unité de la couverture et de `user_word_progress`). `الله ≠ لِلَّه` (formes distinctes).
- **occurrence** = 1 ligne `word_occurrences` (une forme apparaît N fois dans le Coran).
- **mot** (dans l'UI) = la forme coranique.
- **leçon** = unité du curriculum (`lessons`), complétée ou non.
- **session** = une leçon en cours (`lesson_sessions`), reprise possible, supprimée à la fin.
- **exercice / tentative** = événement pédagogique produit par le moteur, **non persisté individuellement** (seuls les agrégats `correct_count`/`incorrect_count` et les `last_*_at` sont stockés).
- **compétence** = une des 8 dimensions (`form_recognition` … `retention`).
- **jour** = `getActivityDate()` = **UTC** (YYYY-MM-DD).
- **objectif quotidien** = `daily_goal_type` (`words`|`lessons`) × `daily_goal_value`.
- **couverture** = `familiar + mastered` pondérés par occurrences.

**Définitions de statut (`user_word_progress.status`) — déjà établies, non modifiées ici :**
- `new` : jamais étudié ;
- `learning` : vu / en cours (≠ compris) ;
- `familiar` : familier (compris pour la couverture) ;
- `mastered` : maîtrisé.

---

## D. `user_word_progress`

- Structure (migration 0016) : `status ∈ {new, learning, familiar, mastered}`, `mastery 0–100`, `correct_count`, `incorrect_count`, `last_seen_at`, `next_review_at`, `created_at`, `updated_at`, `UNIQUE(user_id, word_id)`.
- **Fiable aujourd'hui** : mots commencés (`status ≠ new`), mots familiers, mots maîtrisés, mots compris (`familiar|mastered`), mastery moyenne (des mots ≠ new).
- **Non fiable / impossible** :
  - « date du 1er passage à `mastered` » → **impossible** (pas de `mastered_at` ; `updated_at` change à chaque révision ultérieure) ;
  - « mots maîtrisés à une date passée » → **impossible** ;
  - historique des transitions → **impossible**.

> Conséquence directe : **la couverture à une date passée n'est pas reconstructible** (voir K).

---

## E. `skill_attempts`

⚠️ **Précision de vocabulaire (le brief le laissait ambigu) :** il n'existe **pas** de table `skill_attempts`.

- `lesson_sessions.skill_attempts` est une colonne **JSONB** (liste des tentatives *en attente de rejeu* pendant une leçon en cours). C'est un état de reprise **transitoire**, pas un historique.
- La **maîtrise persistante par compétence** vit dans la table **`user_word_skill_progress`** (migration 0023 + 0024) : `correct_count`, `incorrect_count`, `current_streak`, `last_correct_at`, `last_incorrect_at`, `last_attempt_at`, `mastery`.

Ce que `user_word_skill_progress` permet de calculer de façon **agrégée** :
- taux de réussite = `correct_count / (correct_count + incorrect_count)` (par mot × skill) ;
- `current_streak` (réussites consécutives, interne à la maîtrise — **pas** un streak d'activité) ;
- récence du dernier succès/échec.

Ce qu'il **ne permet pas** :
- nombre d'exercices réalisés par jour/semaine (aucun log par tentative) ;
- série temporelle de réussites/erreurs (seuls `last_*_at` existent).

---

## F. Sessions

- `lesson_sessions` = **état minimal de reprise** (position + `results`/`skill_attempts` JSONB). `UNIQUE(user_id, lesson_id)` ; supprimée à la complétion (`clearLessonSession`).
- **Mesurable** : « leçon en cours » (1 seule, la plus récente `in_progress`) → CTA « Reprendre ».
- **Non mesurable en l'état** :
  - **sessions terminées** comme entité historique (la table est vidée à la fin) — on dispose seulement des **leçons complétées par jour** via `user_activity_lessons` ;
  - **sessions abandonnées** (aucun marqueur, aucune rétention) ;
  - **temps d'apprentissage** (pas de durée ; `started_at`/`last_activity_at` d'une seule ligne courante inclurait l'idle — **non fiable**, à ne pas afficher).

---

## G. SRS / Reviews

- `review_items` : `status ∈ {learning, review, relearning}`, `interval_days`, `last_review_at`, `next_review_at`, `UNIQUE(user_id, word_id)`.
- `LeitnerScheduler` : bonne réponse → intervalle double (1→2→4→8…) ; erreur → 1 jour ; graduation à 7 jours.
- **Mesurable** : révisions **dues** (`next_review_at ≤ now`), révisions **à venir** (7 jours), intervalle courant, dernière révision (`last_review_at`).
- **Non mesurable** : **nombre de révisions effectuées** sur une période (aucun journal de révisions ; `last_review_at` ne garde que la dernière). Les révisions alimentent `user_activity_words` mais **fusionnées** avec les mots de leçon, sans distinction possible.
- **Cohérence** : Daily Plan (`getReviewDueCount`) et écran `/review` lisent la **même** `review_items` → une seule source de vérité. Aucun second SRS.

---

## H. Activities

- `user_activity_lessons` : **insert-only**, `UNIQUE(user_id, activity_date, lesson_id)`, une ligne = une leçon complétée un jour. **Pas de policy UPDATE/DELETE** (append-only).
- `user_activity_words` : **insert-only**, `UNIQUE(user_id, activity_date, word_id)`, une ligne = un mot DISTINCT étudié un jour (leçons + révisions). Un mot × 6 exercices = 1 ligne.
- **Idempotence par la base** (`INSERT … ON CONFLICT DO NOTHING`) ; progression **toujours dérivée** (`COUNT`), jamais stockée en compteur +1.
- Ces deux journaux sont **la seule source historique fiable** (et elle est **conservée** — aucun DELETE applicatif, cascade uniquement à la suppression du compte).

---

## I. Daily Goal

- `getDailyGoalProgress` : lit `getDailyActivity` (COUNT des journaux) et compose avec `daily_goal_type`/`daily_goal_value`.
- Défaut : `words / 5` (`DEFAULT_DAILY_GOAL_VALUE = 5`, migration 0018 + backfill).
- **Purement informatif** : jamais utilisé par le moteur pédagogique (ne force pas 5 mots, ne pilote pas le curriculum).
- **Jour = UTC** (`getActivityDate` sans timezone) ; **dépassement autorisé** (pas de plafond) ; `percent` borné à 100.
- **Historique** : les journaux conservent toutes les dates → on peut calculer « aujourd'hui », « hier », « 7 derniers jours », « semaine actuelle/précédente » **par COUNT sur une plage de dates** (voir J).

---

## J. Weekly Progress

| Métrique | Verdict | Source |
|---|---|---|
| mots étudiés cette semaine (distincts) | **CALCULABLE** | `user_activity_words` (`activity_date` plage 7 j) |
| leçons terminées cette semaine | **CALCULABLE** | `user_activity_lessons` (plage 7 j) |
| jours actifs cette semaine | **CALCULABLE** | `DISTINCT activity_date` (union des 2 journaux) |
| mots maîtrisés cette semaine | **NOT_AVAILABLE** | pas de `mastered_at` |
| révisions effectuées cette semaine | **NOT_AVAILABLE** | pas de journal de révisions (fusionnées dans `user_activity_words`) |
| exercices réalisés cette semaine | **NOT_AVAILABLE** | pas de log par tentative |
| temps d'étude cette semaine | **NOT_AVAILABLE** | pas de durée |

> Le résumé hebdomadaire **fiable et sans migration** se limite donc à : *mots étudiés + leçons terminées + jours actifs*.

---

## K. Quran Coverage History

- La couverture actuelle dépend de `user_word_progress.status` (un état courant, écrasé par upsert).
- **Il n'existe aucun snapshot ni event log** des changements de `status` → **la couverture à une date passée n'est pas reconstructible**.
- Les journaux `user_activity_*` enregistrent de l'**activité** (mots étudiés), pas les **transitions `familiar`/`mastered`** → ils ne permettent pas non plus de recalculer une couverture passée (on ne peut pas savoir si un mot étudié il y a 7 jours était alors déjà `mastered`).

**Verdict : `REQUIRES_NEW_DATA`.** Formulation honnête :

> « La couverture **actuelle** est disponible ; son **historique fiable** n'est pas reconstructible avec les données actuelles. »

---

## L. Metrics Matrix

| Métrique | Disponible | Source | Fiabilité | Coût |
|---|---|---|---|---|
| mots familiers | READY | `user_word_progress` | haute | 1 requête |
| mots maîtrisés | READY | `user_word_progress` | haute | 1 requête |
| mots compris (familiar+mastered) | READY | `user_word_progress` | haute | 1 requête |
| mots commencés (≠ new) | READY | `user_word_progress` | haute | 1 requête |
| couverture du Coran | READY | `word_occurrences` × `user_word_progress` | haute | 3 requêtes (count head) |
| mots appris aujourd'hui | READY | `user_activity_words` | haute (UTC) | 1 requête |
| mots appris cette semaine | CALCULABLE | `user_activity_words` (plage) | bonne (UTC) | 1 requête |
| leçons terminées (jour/semaine) | CALCULABLE | `user_activity_lessons` | bonne (UTC) | 1 requête |
| jours actifs (semaine) | CALCULABLE | union `activity_date` | bonne (UTC) | 1–2 requêtes |
| révisions effectuées | NOT_AVAILABLE | — (fusionnées dans l'activité) | — | — |
| révisions dues | READY | `review_items.next_review_at` | haute | 1 requête |
| sessions terminées | PARTIAL | ≈ `user_activity_lessons` (leçons, pas « sessions ») | moyenne | 1 requête |
| sessions abandonnées | NOT_AVAILABLE | — | — | — |
| exercices réalisés | NOT_AVAILABLE | — (agrégats seuls) | — | — |
| taux de réussite | CALCULABLE (agrégé, non temporel) | `user_word_skill_progress` | bonne | 1 requête |
| temps d'apprentissage | NOT_AVAILABLE | — | — | — |
| évolution couverture | REQUIRES_NEW_DATA | — | — | — |
| objectif quotidien | READY | journaux + `user_settings` | haute (UTC) | 1 requête |

---

## M. Activity vs Acquisition vs Retention vs Coverage

Distinction stricte à préserver :

- **Engagement / activité** : exercices, tentatives, sessions → majoritairement **non persistés** (seuls les agrégats et les journaux de mots/leçons existent).
- **Acquisition** : `user_word_progress.status` (`new → learning → familiar → mastered`) — la notion de « compris ».
- **Rétention** : `review_items` (SRS) + `user_word_skill_progress.retention` (dérivée du délai de rappel).
- **Couverture** : `familiar + mastered` pondérés par occurrences (Phase 37B).

> 100 exercices ≠ 100 mots compris ; 10 sessions ≠ 10 % de couverture ; 100 tentatives ≠ 100 acquisitions. Le dashboard actuel respecte cette distinction (aucune métrique vanity inventée).

---

## N. Current Dashboard

Cartes affichées (ordre réel dans `app/(app)/dashboard/page.tsx`) :

1. **Header** — « Ton prochain pas » + salutation + phrase d'ouverture personnalisée.
2. **TodayCard** (38B) — coach line + `X / Y mots` + `N à réviser` + `≈ X % du Coran` + **CTA** (`plan.action.href`).
3. **Continue** (« Ton prochain pas », `aria continue-title`) — grosse carte avec **CTA** `Reprendre/Continuer/Découvrir` (ou « Réviser mes mots » si aucun parcours) + barre de progression si `in_progress`.
4. **QuranCoverageCard** (37B) — `≈ X % du Coran` + détail occurrences.
5. **« Découvrir les sourates »** → `/surahs`.
6. **Grid** — « Réviser » (`reviewDueCount` + CTA `/review`) + « Ton rythme » (`GoalRing` `current/goalValue`).
7. **« Tes sourates »** — progression (commencées/terminées, barre, prochaine étape).
8. **Grid** — « En quelques mots » (Mots étudiés / Mots maîtrisés / Maîtrise moyenne / **À réviser**) + « Activité récente » (30 jours).
9. **« Révisions à venir »** (7 jours).

Sources : `selectActiveLearningPath`, `getReviewDueCount`, `getQuranCoverage`, `getGlobalWordStats`, `getDailyGoalProgress`, `getActivityHistory`, `getUpcomingReviewCounts` — **toutes déjà chargées en parallèle** (`Promise.all`).

---

## O. UX Redundancies

Confirmées par lecture du code :

1. **Double CTA primaire** (le point signalé en 38B) : `TodayCard` et la carte « Ton prochain pas » pointent **le même** `selection.lessonSlug` avec des libellés quasi identiques. Deux boutons primaires concurrents pour la même action.
2. **Objectif du jour affiché 2×** : `TodayCard` (texte) + carte « Ton rythme » (`GoalRing`).
3. **Révisions dues affichées 3×** : `TodayCard` + carte « Réviser » + « En quelques mots » (« À réviser »).
4. **Couverture affichée 2×** : `TodayCard` + `QuranCoverageCard`.

Pas de **contradiction** de données (mêmes sources), mais une **redondance de lecture** qui dilue l'histoire de progression.

---

## P. Motivation Opportunities

Mesurables, pertinentes, non trompeuses, peu coûteuses :

- « Tu as étudié **X** mots » (READY).
- « Tu maîtrises **X** mots » (READY).
- « Tu comprends **≈ X %** du Coran » (READY, 37B).
- « **X / Y** aujourd'hui » (READY).
- « Cette semaine : **X** mots · **Y** leçons · **Z** jours actifs » (CALCULABLE, 0 migration).
- « **X** mots à réviser » (READY).

À **ne pas** promettre : durée de session, « mots maîtrisés cette semaine », « tu as progressé de +2 % cette semaine » (non reconstructible).

---

## Q. Milestones

| Jalon | Verdict |
|---|---|
| premier mot étudié | CALCULABLE (`MIN(created_at)` de `user_word_progress`) |
| premier mot maîtrisé | **NOT_AVAILABLE** (pas de `mastered_at`) |
| N mots maîtrisés (10/100…) | CALCULABLE (état courant) — mais la **date de franchissement** est NOT_AVAILABLE |
| 1 % / 5 % / 10 % de couverture | CALCULABLE (état courant) — la **date de franchissement** est NOT_AVAILABLE |
| première leçon terminée | CALCULABLE (`MIN(activity_date)` de `user_activity_lessons`) |
| première semaine active | CALCULABLE (journaux) |

> Les jalons **d'état courant** sont fiables ; les jalons **datés** exigent un event log. Aucun badge à créer dans cette phase.

---

## R. Streak Feasibility

- Une notion de **« jours actifs consécutifs »** est **CALCULABLE** à partir des journaux (`DISTINCT activity_date`, conservés sans DELETE). Définition honnête : « un jour où au moins un mot a été étudié ou une leçon complétée ».
- `current_streak` dans `user_word_skill_progress` n'a **rien à voir** : c'est un compteur de réussites consécutives par compétence (signal pédagogique interne).
- **Verdict produit : `REJECT` / `DEFER`.** Techniquement possible, mais contraire à l'identité Hikma (anti-pattern documenté : « pas de streak culpabilisant », `docs/ui-ux-skills/`, Phase 29/36). En outre, le calcul reposerait sur **UTC** (un utilisateur à GMT+8 verrait son « jour » coupé à 8h du matin) — acceptable pour un journal, trompeur pour un streak.

---

## S. Historical Data

| Élément | Historique |
|---|---|
| derniers mots appris (ordre) | **natif** : `user_word_progress.last_seen_at` (dernier vu, pas une liste ordonnée) |
| dernières sessions | **non natif** (`lesson_sessions` supprimée) ; « leçons terminées » reconstructible par jour via `user_activity_lessons` |
| dernières révisions | **impossible** (pas de journal de révisions) |
| progression journalière | **natif** : journaux `user_activity_*` (conservés) |
| évolution de couverture | **impossible** (pas de snapshot) |

---

## T. Irreversible / Missing Data

Données **non reconstructibles après coup** :

- couverture à J-7 / J-30 ;
- état `mastery` historique ;
- nombre exact de mots maîtrisés à une date ;
- score historique ;
- toute série temporelle de tentatives/réussites/erreurs ;
- durée d'apprentissage passée.

Aucune reconstruction fictive proposée.

---

## U. Timezone

- Tous les `timestamptz` sont stockés en UTC.
- `getActivityDate()` = **UTC** (`toISOString().slice(0,10)`), avec un paramètre `timeZone` **prévu mais non activé**.
- **Conséquence UX** : le « jour » pédagogique se coupe à **00:00 UTC** (ex. 02:00 à Paris, 08:00 à Pékin). Documenté, **non modifié** (hors scope 39A). Toute future métrique « jour actif »/streak hériterait de cette limite.

---

## V. Security / RLS

- Chaque table utilisateur a des policies `auth.uid() = user_id` : `user_word_progress`, `user_word_skill_progress`, `review_items`, `lesson_sessions`, `user_settings`, `user_activity_lessons`, `user_activity_words`.
- Les journaux `user_activity_*` n'ont **pas** de policy UPDATE/DELETE (append-only) → impossibilité de tricher/d'effacer l'historique.
- Le corpus (`quran_words`, `word_occurrences`, `word_translations`, `lemmas`…) est en lecture publique (`using (true)`), sans écriture applicative.
- Aucune métrique future ne nécessite un accès croisé : tout se joint sur `user_id` + filtres explicites, en plus de la RLS.

---

## W. Performance

- Le dashboard charge déjà **toutes** les données nécessaires en **un seul `Promise.all`** (aucune N+1).
- Progression actuelle : `getGlobalWordStats` = 1 requête `user_word_progress` (lignes `status, mastery`).
- Progression quotidienne/hebdomadaire : `COUNT` sur des journaux indexés `(user_id, activity_date)` → 1 requête par plage.
- Couverture : 3 requêtes `count: exact, head: true` (aucune ligne récupérée).
- **Aucune agrégation/cache/RPC/matérialized view nécessaire** à la volumétrie actuelle. Un résumé hebdomadaire = 1–2 requêtes `COUNT` supplémentaires sur des tables indexées.

---

## X. Product Alignment

Alignement avec l'objectif pédagogique (réciter le Coran → comprendre les mots → les reconnaître dans les versets) :

- **Prioritaires** : compréhension (couverture), rétention (révisions dues), progression (objectif jour, mots maîtrisés), régularité (jours actifs) — tous déjà disponibles ou calculables.
- **Vanity à éviter** : durée d'étude (non mesurable), streak (REJECT), exercices bruts (non persistés), « +N % cette semaine » (non reconstructible).

---

## Y. Recommendations

| P | Action | Données | Migration |
|---|---|---|---|
| **P0** | Aucune correction bloquante identifiée. | — | — |
| **P1** | **Consolidation UX de la progression** : fusionner les 2 CTA primaires + dé-dupliquer objectif/révisions/couverture (une seule carte « Aujourd'hui » enrichie). | existantes | **0** |
| **P1** | **Résumé hebdomadaire** : « Cette semaine : X mots · Y leçons · Z jours actifs » (dérivé des journaux). | existantes | **0** |
| **P2** | **Évolution de couverture** (la plus motivante, type Quran Progress) : exige un snapshot/event log des statuts. | `REQUIRES_NEW_DATA` | **1 migration** (voir Z) |
| **P3** | Jalons datés (premier mot maîtrisé, franchissements de %). | `REQUIRES_NEW_DATA` | idem P2 |
| **REJECT** | streak, classement, XP, badges sans valeur, durée d'étude, IA de motivation, faux historique, « +N % de compréhension » dérivé du nombre de sessions. | — | — |

---

## Z. Proposed Phase 39B

**Une seule prochaine phase logique : « Consolidation UX de la progression »** (P1, **0 migration**).

1. **Fonctions pures** (comme 38B) :
   - `composeWeeklySummary(history)` — `mots étudiés / leçons / jours actifs` sur 7 jours, dérivé des journaux déjà chargés (étendre `getActivityHistory` ou réutiliser ses résultats).
   - `getProgressLine(...)` déterministe (pas d'IA) — une phrase de progression, sans promesse de durée ni de « +X % ».
2. **Fusion des 2 CTA** : la carte « Aujourd'hui » porte **l'unique** CTA principal ; la carte « Ton prochain pas » redevient du **contexte** (sans bouton) ou est absorbée.
3. **Dé-dupliquer** objectif/révisions/couverture (une seule occurrence de chaque).
4. **Tests unitaires** (composeWeeklySummary + getProgressLine + états limite : 0 jour, objectif atteint/dépassé, révisions 0) ; E2E minimal du dashboard consolidé.

**Déféré (P2, à décider séparément, jamais improvisé)** : l'« évolution de couverture » — qui nécessiterait une migration **additive et minimale** du type `user_progress_snapshots (user_id, snapshot_date, covered_occurrences, coverage_percent)` écrite une fois par jour (ou une table d'événements `word_status_events (user_id, word_id, from_status, to_status, at)`). À ne lancer qu'après validation explicite de ce schéma.

---

## Verdict

| Fonctionnalité | État | Justification |
|---|---|---|
| Progression actuelle | READY | `user_word_progress.status`/`mastery` + `getGlobalWordStats` |
| Mots maîtrisés | READY | `status = mastered` (compté) |
| Mots compris | READY | `familiar + mastered` |
| Couverture | READY | Phase 37B, pondérée par occurrences |
| Progression quotidienne | READY | journaux insert-only + `getDailyGoalProgress` (UTC) |
| Progression hebdomadaire | PARTIAL | mots/leçons/jours actifs CALCULABLE ; maîtrisés/révisions NOT_AVAILABLE |
| Historique | PARTIAL | activité (journaux) native ; transitions de statut impossibles |
| Évolution couverture | REQUIRES_NEW_DATA | aucun snapshot/event log |
| Sessions | PARTIAL | leçons complétées/jour oui ; sessions abandonnées/durée non |
| Révisions | PARTIAL | dues/à venir READY ; effectuées NOT_AVAILABLE |
| Streak | REJECT | calculable mais contraire à l'identité Hikma + UTC trompeur |
| Jalons | PARTIAL | état courant CALCULABLE ; dates de franchissement NOT_AVAILABLE |
| Statistiques dashboard | READY | déjà affichées, redondantes à consolider |

**Décision : `PHASE_39A_AUDIT_COMPLETE`** — aucune implémentation avant validation de la Phase 39B.
