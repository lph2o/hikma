# PHASE 45C — AUDIT READ-ONLY DU COACH ADAPTATIF HIKMA

Statut : **`PHASE_45C_READ_ONLY_AUDIT`** — aucune modification de code, DB,
migration, seed, onboarding, exercice, SRS, mastery, Daily Plan, resolver,
donnée utilisateur. Aucun commit, aucun push. Seuls les 6 artefacts listés en
§14 sont créés.

---

## A. Executive Summary

Le « coach » de Hikma est en réalité **deux couches de texte pures et
déterministes**, alimentées par des données déjà calculées par les moteurs
existants :

1. **`getCoachLine`** (`lib/learning/daily-plan.ts`) — la phrase de la carte
   « Aujourd'hui » (H2), choisie par une hiérarchie de **8 règles** déterministes.
2. **`getPersonalizedLearningCopy`** (`lib/learning/personalization.ts`) — la
   salutation + phrase d'ouverture de l'en-tête du dashboard.

**Constat central : le coach est déjà partiellement adaptatif.** Il varie son
message selon **5+ signaux réels** : objectif dépassé/atteint, session à
reprendre, progression en cours, révisions dues, première visite, rythme/durée
préférée, prénom, objectif déclaré, familiarité.

**Ce que « coach adaptatif » signifie chez Quran Progress est déjà couvert par
le SRS + Daily Plan de Hikma** : l'adaptation *des révisions* au niveau/rythme
est précisément ce que fait `review_items` (Leitner, intervalles qui s'allongent/
raccourcissent selon la réponse) + `composeDailyPlan` (compose la décision du
SRS sans la recalculer). **Créer un coach qui « adapte les révisions » serait
réintroduire un second SRS — interdit (§5).**

Le seul écart réellement identifié est **l'adaptation du MESSAGE** aux signaux
de **maîtrise par compétence** (`user_word_skill_progress` → `weakestSkills`),
aux **erreurs récentes** et à la **régularité** (jours actifs) — signaux qui
**existent déjà** mais ne sont **pas chargés** par le dashboard actuel. C'est un
écart **mineur, de présentation**, non structurant.

**Verdict : `PHASE_45C_ADAPTIVE_COACH_DEFERRED`.** Le coach actuel + SRS +
mastery + Daily Plan + Onboarding V2 offrent déjà l'essentiel de l'adaptation.
L'extension « guidance par signaux de maîtrise/régularité » est réelle mais de
priorité **P2/P3**, à n'envisager qu'après les travaux de données des sourates
READY, et uniquement comme couche de présentation pure.

---

## B. Documentation réellement consultée

**Rapports (déjà lus dans cette session 45A/45B + relus ici) :**
- `README.md` (limitation lexicale FR documentée) ;
- `PHASE_45A_GLOBAL_DOCUMENTATION_AUDIT.md` ;
- `PHASE_45B_QURAN_PROGRESS_BENCHMARK_AUDIT.md` ;
- `PHASE_38A_DAILY_PLAN_AUDIT.md` + `PHASE_38B_DAILY_PLAN_IMPLEMENTATION.md` ;
- `PHASE_39A_PROGRESS_AUDIT.md` + `PHASE_39B_PROGRESS_CONSOLIDATION_IMPLEMENTATION.md` ;
- `PHASE_33A_DISCOVERY_PERSONALIZATION_AUDIT.md` + `PHASE_33B_PERSONALIZED_DISCOVERY.md` ;
- `PHASE_32A/32B/32C/32D/32E/32G/32I` (Onboarding V2) ;
- `PHASE_37A/37B` (couverture, **Modèle A verrouillé**) ;
- `PHASE_40A/40D` (rejet de la fréquence comme axe pédagogique) ;
- `PHASE_23B` (méthode) + `PHASE_23F` (socle moteur, 8 compétences) ;
- `PHASE_29` (idées Quran Progress) ;
- `PHASE_44A/44B` (explications de sens) ; `PHASE_24I/24J` (feedback) ;
- `PHASE_43A/43B` (MASAQ).

**Code réel (lu dans cette phase) :**
- `lib/learning/daily-plan.ts`, `lib/learning/personalization.ts`,
  `lib/learning/onboarding.ts`, `lib/learning/active-path.ts`,
  `lib/learning/activity.ts`, `lib/learning/skills.ts`,
  `lib/learning/skill-progress.ts`, `lib/learning/weekly-summary.ts` ;
- `lib/learning/queries.ts` (fonctions `getReviewDueCount`,
  `getGlobalWordStats`, `getSurahProgressByUser`, `getActiveLessonSessionResolved`,
  `getQuranCoverage`) ;
- `app/(app)/dashboard/page.tsx` ;
- `types/learning.ts`.

Les spécifications obsolètes `archive/lingua-nextjs-prompts/` sont écartées
(architecture pré-Hikma : Clerk/PostHog/agent Python, non pertinentes).

---

## C. Architecture actuelle du coach

```text
INPUTS (déjà calculées par le dashboard)                 LOGIQUE PURE             OUTPUT                UI
──────────────────────────────────────────────────────  ───────────────────────  ────────────────────  ─────────────────
user_settings (profil V2)                                                          {greeting, opening}   header dashboard
  ├ displayName, learningGoal, arabicReadingLevel,        getPersonalizedLearningCopy
  ├ quranFamiliarity, dailyDuration, learningPace,        (personalization.ts)                            (H1 + BodyLarge)
  └ preferredSurahNumber
                                                     +
selectActiveLearningPath → selection (session→prog→reco→fallback)
getDailyGoalProgress    → goal {current,target,reached}
getReviewDueCount       → reviewDueCount                   composeDailyPlan        DailyPlan              TodayCard
getQuranCoverage        → coveragePercent                 (daily-plan.ts)         {action, goal,          (« Aujourd'hui »)
getActivityHistory      → history (30 j)                                           reviews, coverage}
                                                     +     composeWeeklySummary   WeeklySummary          WeeklyCard
                                                           getCoachLine
                                                           (daily-plan.ts)         chaîne (1 phrase)      H2 TodayCard
```

**Fichiers / fonctions / composants :**

| Élément | Emplacement | Rôle |
|---|---|---|
| `getCoachLine` | `lib/learning/daily-plan.ts` | phrase coach (8 règles) |
| `composeDailyPlan` | `lib/learning/daily-plan.ts` | compose le plan sans recalcul |
| `getPersonalizedLearningCopy` | `lib/learning/personalization.ts` | salutation + ouverture |
| `getRecommendationReason` | `lib/learning/personalization.ts` | justification de la reco |
| `selectActiveLearningPath` | `lib/learning/active-path.ts` | décision de la prochaine action |
| `summarizeSurahProgress` | `lib/learning/active-path.ts` | résumé progression |
| `composeWeeklySummary` | `lib/learning/weekly-summary.ts` | résumé 7 jours |
| `getDailyGoalProgress` / `getActivityHistory` | `lib/learning/activity.ts` | objectif + historique |
| `getReviewDueCount` / `getQuranCoverage` / `getGlobalWordStats` | `lib/learning/queries.ts` | révisions / couverture / mastery agrégée |
| `TodayCard` / `WeeklyCard` / `DashboardMain` | `app/(app)/dashboard/page.tsx` | rendu |

---

## D. Inputs actuellement disponibles (dans le dashboard)

| Input | Source | Type | Chargé ? |
|---|---|---|---|
| `profile` (7 champs V2) | `getUserSettings` → `user_settings` | profil déclaratif | OUI |
| `selection` | `selectActiveLearningPath` | décision d'action | OUI |
| `goal` | `getDailyGoalProgress` | progression objectif | OUI |
| `reviewDueCount` | `getReviewDueCount` | SRS dus | OUI |
| `coveragePercent` | `getQuranCoverage` | couverture | OUI |
| `upcoming` (7 j) | `getUpcomingReviewCounts` | révisions à venir | OUI |
| `history` (30 j) | `getActivityHistory` | activité | OUI |
| `globalWords` | `getGlobalWordStats` | wordsSeen/Mastered/avgMastery | OUI |
| `weekly` | `composeWeeklySummary` | mots/leçons/jours actifs | OUI |

**Inputs disponibles mais NON chargés par le dashboard/coach (GAP) :**
- `user_word_skill_progress` (8 compétences) → `weakestSkills`, niveaux par
  compétence, précision, `lastIncorrectAt`/`lastCorrectAt` (récence des erreurs) ;
- `review_items` en détail (état `learning/review/relearning`, degré de retard) ;
- `user_word_progress` par mot (au-delà de l'agrégat wordsSeen/Mastered).

---

## E. Signaux utilisateur (profil) disponibles

| Signal | Source | Fiabilité | Utilisé par le coach actuel ? | Peut influencer le coach ? |
|---|---|---|---|---|
| `learning_goal` | user_settings | haute (déclaratif) | OUI (ouverture) | OUI (accent sens/mémoire) |
| `arabic_reading_level` | user_settings | déclaratif (jamais diagnostic) | PARTIEL (reco seulement) | OUI (guidance lecture) |
| `daily_duration` | user_settings | haute | OUI (règle 7) | OUI (longueur de session) |
| `learning_pace` | user_settings | haute | OUI (règle 7) | OUI (rythme) |
| `quran_familiarity` | user_settings | déclaratif | OUI (ouverture) | OUI (guidance) |
| `display_name` | user_settings | haute | OUI (salutation) | OUI |
| `preferred_surah_number` | user_settings | haute (validé vs catalogue) | PARTIEL (reco) | non (décision, pas message) |

---

## F. Signaux SRS disponibles

| Signal | Source | Fiabilité | Déjà utilisé ? | Peut influencer le coach ? |
|---|---|---|---|---|
| révisions **dues** (count) | `review_items` (`getReviewDueCount`) | haute | OUI (règle 5) | OUI (charge) |
| révisions **à venir** 7 j | `review_items` (`getUpcomingReviewCounts`) | haute | OUI (UI, pas coach) | OUI (charge future) |
| **overdue** (degré de retard) | `review_items.next_review_at` vs now | calculable | **NON (GAP)** | OUI (rassurance) |
| réussites/échecs récents | `review_items` (état) + `user_word_skill_progress` | haute | **NON (GAP)** | OUI (stratégie) |
| intervalles SRS | `review_items` | haute | NON (interne SRS) | **NON** (ne pas exposer) |

---

## G. Signaux mastery disponibles

| Signal | Source | Fiabilité | Déjà utilisé ? | Peut influencer le coach ? |
|---|---|---|---|---|
| wordsSeen / wordsMastered / avgMastery | `user_word_progress` (`getGlobalWordStats`) | haute | OUI (UI, pas coach) | OUI (encouragement) |
| **compétences faibles** | `user_word_skill_progress` → `weakestSkills` | haute | **NON (GAP)** | OUI (guidance ciblée) |
| **erreurs récentes** (`lastIncorrectAt > lastCorrectAt`) | `user_word_skill_progress` | haute | **NON (GAP)** | OUI (réassurance) |
| **rétention** (`retentionLevel`) | `user_word_skill_progress` (dérivé temps) | haute | **NON (GAP)** | OUI (rappel stratégie) |

---

## H. Signaux Daily Plan disponibles

| Signal | Source | Fiabilité | Déjà utilisé ? | Peut influencer le coach ? |
|---|---|---|---|---|
| action kind (session/prog/reco/fallback/all_done/none) | `selectActiveLearningPath` | haute | OUI (règles 3-4) | OUI |
| goal reached / exceeded | `getDailyGoalProgress` | haute | OUI (règles 1-2) | OUI |
| coverage percent | `getQuranCoverage` | haute | OUI (UI, pas coach) | OUI (encouragement) |
| session à reprendre | `getActiveLessonSessionResolved` | haute | OUI (règle 3) | OUI |

---

## I. Relation avec l'Onboarding V2

L'Onboarding V2 est **terminé et indépendant** (`CURRENT_ONBOARDING_VERSION = 2`).
Aucune V3 à créer. Les données collectées sont déjà **lisibles** par le coach
via `profileFromSettings` :

| Donnée onboarding | Collectée ? | Stockée ? | Utilisée actuellement ? | Utilisable par coach ? |
|---|---|---|---|---|
| `display_name` | OUI | user_settings | OUI (salutation) | OUI |
| `learning_goal` | OUI | user_settings | OUI (ouverture) | OUI |
| `arabic_reading_level` | OUI | user_settings | PARTIEL (reco) | OUI (futur) |
| `quran_familiarity` | OUI | user_settings | OUI (ouverture) | OUI |
| `daily_duration` | OUI | user_settings | OUI (règle 7) | OUI |
| `learning_pace` | OUI | user_settings | OUI (règle 7) | OUI |
| `preferred_surah_number` | OUI | user_settings | PARTIEL (reco) | non (décision) |
| `daily_goal_type/value` | OUI | user_settings | OUI (objectif) | OUI (objectif) |

→ Aucune migration, aucune nouvelle collecte nécessaire pour alimenter un
éventuel coach enrichi.

---

## J. Relation avec HikmaExplanation / Phase 44B

**Confirmé indépendant.** `word_explanations` + `word_explanation_contexts`
(44B) vivent dans `HikmaExplanation`, affichées **après l'effort / après la
réponse**, uniquement si une explication existe. Le coach **ne doit pas** devenir
un générateur d'explications, ni déplacer les explications de sens vers
l'onboarding ou le dashboard. Un éventuel coach enrichi ne ferait que
**recommander une stratégie** (ex. « concentre-toi sur la reconnaissance »),
jamais **produire** de contenu pédagogique.

---

## K. Définition technique du caractère adaptatif

| | Coach **déterministe** (actuel) | Coach **adaptatif** (cible étudiée) |
|---|---|---|
| Définition | même état pédagogique → même message | le message/ton/guidance change selon des signaux pédagogiques réels supplémentaires |
| Actuel | OUI — fonctions pures, hiérarchie fixe | **déjà partiel** (5+ signaux) |
| Manquant | — | maîtrise par compétence, erreurs récentes, régularité, degré de retard |

Le caractère adaptatif étudié ici est **uniquement la formulation/guidance**, pas
la sélection des mots ni le scheduling (interdits §5).

---

## L. Matrice des adaptations possibles

| Dimension | Sous-signal | Existe déjà ? | Donnée fiable ? | Valeur péda | Risque | Recommandation |
|---|---|---|---|---|---|---|
| A. Profil | objectif (sens vs mémoire) | OUI (ouverture) | OUI | 3 | 1 | déjà fait |
| A. Profil | niveau lecture arabe | NON (reco only) | déclaratif | 2 | 2 | P3 |
| A. Profil | familiarité Coran | OUI (ouverture) | OUI | 2 | 1 | déjà fait |
| A. Profil | durée/rythme | OUI (règle 7) | OUI | 2 | 1 | déjà fait |
| B. Comportement | réussites/erreurs récents | **NON (GAP)** | OUI | 3 | 2 | P2 |
| B. Comportement | régularité (jours actifs) | NON (calculé, pas utilisé) | OUI | 2 | 1 | P3 |
| B. Comportement | abandon de session | NON | faible | 2 | 2 | REJECT |
| C. Maîtrise | compétences faibles | **NON (GAP)** | OUI | 3 | 1 | P2 |
| C. Maîtrise | rétention | NON | OUI | 2 | 2 | P3 |
| D. Contexte | début/fin session | NON | partiel | 1 | 2 | REJECT |
| D. Contexte | surcharge révisions | OUI (règle 5) | OUI | 3 | 1 | déjà fait |
| D. Contexte | retard de révision | **NON (GAP)** | OUI | 2 | 1 | P3 |
| D. Contexte | absence nouveau contenu | OUI (all_done) | OUI | 2 | 1 | déjà fait |

*(Voir `tmp/phase45c-adaptation-matrix.csv` pour la matrice complète.)*

---

## M. Risques (sur-personnalisation)

1. **Bavardage** — trop de variations → messages longs, dilution du CTA unique.
2. **Répétition** — le même état doit donner le même message (déterminisme).
3. **Messages génériques déguisés en personnalisés** (fausse personnalisation).
4. **Culpabilisation** — signaler « mots faibles » ou « retard » peut décourager.
5. **Gamification / pression** — ne jamais transformer régularité en streak-objectif.
6. **Contradiction identité Hikma** — pas de fréquence, pas de vanity, pas de clone QP.
7. **Second moteur** — le coach ne doit jamais décider QUOI réviser (risque
   architectural n°1, cf. §5).

*(Voir `tmp/phase45c-risk-analysis.json` pour l'analyse détaillée.)*

---

## N. Architecture minimale proposée (si décidée plus tard — NON implémentée)

Sous contrainte absolue « SRS = source de vérité », le coach enrichi serait une
**couche de présentation pure** au-dessus du plan existant :

```text
SRS (review_items, inchangé)
   ↓
Daily Plan (composeDailyPlan, inchangé)
   ↓
signaux pédagogiques (profil + mastery + régularité, READ-ONLY)
   ↓
COACH ADAPTATIF  →  formulation / guidance / présentation  (jamais sélection)
```

Esquisse conceptuelle (noms non imposés, à définir en phase d'implémentation) :

```text
getCoachContext()      → agrège les signaux déjà disponibles (profil, weakestSkills,
                         régularité, dueCount) SANS nouvelle décision
buildCoachSignals()    → transforme en signaux booléens/énumérés purs
selectCoachMode()      → choisit un « mode » de guidance (ex. reassure / focus /
                         continue) de façon déterministe
getCoachLine()         → conserve la hiérarchie actuelle, enrichie par le mode
```

Propriétés requises : réutiliser les données existantes · ne créer aucun moteur
de priorité · pur autant que possible · déterministe (même état → même sortie) ·
testable · extensible · ne modifier ni SRS, ni mastery, ni Daily Plan, ni onboarding.

*(Voir `tmp/phase45c-implementation-design.json` pour le design détaillé.)*

---

## O. Tests nécessaires (si une Phase 46 était validée — aucun test ajouté ici)

1. même état → même coach (déterminisme) ;
2. objectif différent → formulation différente ;
3. niveau/compétence faible différente → guidance adaptée ;
4. erreurs récentes → réassurance adaptée ;
5. aucune donnée / profil NULL → fallback sûr (jamais de valeur inventée) ;
6. **SRS inchangé** (aucune écriture `review_items`) ;
7. **mastery inchangé** (aucune écriture `user_word_progress`/`user_word_skill_progress`) ;
8. **Daily Plan inchangé** (`composeDailyPlan` identique) ;
9. **onboarding inchangé** (aucune migration, `CURRENT_ONBOARDING_VERSION` intact) ;
10. **absence de gamification** (pas de streak, pas de score, pas de pression) ;
11. **absence de second moteur de priorité** (le coach ne produit jamais une
    sélection de mots/révisions) ;
12. non-régression des tests existants (daily-plan, personalized-learning-copy).

---

## P. Complexité estimée

| Élément | Estimation |
|---|---|
| Lecture des signaux (weakestSkills, régularité) | faible (données existantes, agrégation simple) |
| Nouvelles règles de message | faible à moyenne (2–4 règles, fonctions pures) |
| Requêtes DB additionnelles | faible (1 agrégation `user_word_skill_progress`, éventuellement 1 par jour actif) |
| Tests | faible (unitaires purs) |
| **Total** | **faible–moyen** (présentation pure, sans schéma ni moteur) |

Mais la valeur pédagogique de cette extension est **incrémentale** (ton de
guidance), pas structurante — d'où le verdict « différé » malgré un coût faible.

---

## Q. Décision finale

**`PHASE_45C_ADAPTIVE_COACH_DEFERRED`**

Justification factuelle :

1. **Le coach est déjà partiellement adaptatif** (objectif dépassé/atteint,
   session, progression, révisions dues, première visite, rythme/durée, prénom,
   objectif déclaré, familiarité) — `getCoachLine` + `getPersonalizedLearningCopy`.
2. **L'adaptation des révisions** (le cœur du « coach » de Quran Progress) est
   **déjà assurée par le SRS (`review_items`) + `composeDailyPlan`** ; la
   reproduire dans un « coach » serait un second moteur de priorité (interdit).
3. **L'écart réel** (guidance par compétences faibles / erreurs récentes /
   régularité) est **de présentation**, de valeur **incrémentale**, et exigerait
   de charger des signaux (`user_word_skill_progress`) aujourd'hui non lus par le
   dashboard.
4. **Le prompt priorise explicitement** : terminer/importer les données des
   sourates READY → préserver la stabilité pédagogique → (onboarding si besoin) →
   **seulement ensuite** une fonctionnalité QP à vraie valeur différenciante. Le
   coach adaptatif ne remplit **pas** ce critère de priorité immédiate.

**Recommandation de séquence (si reprise plus tard) :**
1. Sourates READY (données/gloses des sourates courtes restantes) ;
2. stabilité pédagogique ;
3. éventuellement un coach enrichi **P2/P3** en couche de présentation pure,
   **après** une Phase 46 d'audit dédiée — **non lancée automatiquement**.

**STOP.** Aucune implémentation, aucune modification de code/DB/migration/seed/
onboarding/Daily Plan/SRS/mastery/exercices/HikmaExplanation. Aucun commit/push.
