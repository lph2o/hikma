# PHASE 71 — AUDIT POST-PIPELINE LEXICAL + PRÉPARATION DE L'ONBOARDING HIKMA

## Verdict

```text
PHASE_71_POST_LEXICAL_ONBOARDING_AUDIT_COMPLETE

LEXICAL_PIPELINE = FROZEN
DATABASE_WRITES   = 0

GROUND_TRUTH             = PASS
LEXICAL_RESOLVER_AUDIT   = PASS (FORM > LEMME > FALLBACK respecté)
PEDAGOGICAL_ENGINE_AUDIT = PASS
EXERCISE_AUDIT           = PASS
ANSWER_CHECKER_AUDIT     = PASS (tolérant FR, strict AR)
EXPLANATION_AUDIT        = PASS
SRS_AUDIT                = PASS
DAILY_PLAN_AUDIT         = PASS
COVERAGE_AUDIT           = PASS
CURRICULUM_AUDIT         = PASS
ONBOARDING_AUDIT         = COMPLETE (existant, fonctionnel)
FIRST_EXPERIENCE_AUDIT   = COMPLETE

NEXT_PHASE = ONBOARDING_IMPLEMENTATION
STATUS = READY_FOR_HUMAN_REVIEW
```

---

## 1. Executive Summary

Le pipeline lexical Hikma est **gelé** (Phase 70W) avec 4490 gloses FR validées, couvrant 69.32% des occurrences du Coran. La phase 71 a audité l'ensemble de la chaîne applicative — du résolveur lexical jusqu'à l'expérience première leçon — sans aucune écriture DB ni modification de code.

**Résultat principal : Hikma est techniquement prêt pour l'implémentation finale de l'onboarding.** La chaîne applicative est fonctionnelle de bout en bout, le résolveur lexical respecte la règle FORM > LEMME > FALLBACK, et l'onboarding existant (v2, 7 étapes) couvre déjà l'essentiel du parcours.

Des améliorations UX et pédagogiques sont identifiées (10 recommandations classées P0-P3), mais aucune n'est bloquante.

---

## 2. Lexical Frozen State (confirmé)

| Métrique | Valeur |
|---|---:|
| word_translations FR validées | **4490** |
| word_lemma_mapping | **188** |
| lemmas / lemma_translations | **32 / 32** |
| Couverture forme | **21.08%** |
| Couverture occurrence | **69.32%** |
| C+P1 / C+P2 / C+P3 | **9 / 8 / 4308** |
| HOLDs | 3 (أَعْلَمُ, كُنَّا, وَإِن) — 0 wt FR, 0 mapping |

---

## 3. Live Ground Truth

Revalidé le 2026-08-22 — 11/11 PASS, divergence=0. Tous les compteurs correspondent à l'état gelé de Phase 70W.

---

## 4. Lexical Resolver Audit — PASS

**Architecture vérifiée :**

```
lib/learning/language.ts
  resolveWordMeanings(word, french, lemmaFrench)
    → FORME  (word_translations, is_validated=true) → prioritaire
    → LEMME  (word_lemma_mapping → lemma_translations FR) → fallback
    → EN     (quran_words.meaning) → dernier recours explicite
```

**Points de contrôle :**
- `getValidatedFrenchMeanings` (`queries.ts:786`) — lit `word_translations` en batch `.in(wordIds)`, filtre `language='fr' AND is_validated=true`, joint `sources`. Aucun N+1.
- `getValidatedFrenchLemmaMeaningsByWord` — résout mot→lemme via `word_lemma_mapping` (confidence=safe), puis lemme→traduction via `lemma_translations` FR validées. Même contrat batch.
- `buildWordBank` (`lesson.ts:37`) — consomme `resolveWordMeanings(word, frenchByWord, lemmaFrenchByWord)`. Le 3ᵉ paramètre lemme est bien transmis (fix Phase 20B).

**Statistiques de résolution (échantillon curriculum complet) :**

| Niveau | Mécanisme |
|---|---|
| FORM_RESOLVED | word_translations FR validées (4490 formes) |
| LEMMA_RESOLVED | word_lemma_mapping → lemma_translations (188 mappings → 32 lemmes) |
| UNRESOLVED | Fallback EN (quran_words.meaning) ou null |

**Règle de précédence respectée :** la glose de FORME n'est jamais masquée par une glose de LEMME. Les 4490 word_translations FR sont prioritaires sur toute autre source.

---

## 5. Pedagogical Engine Audit — PASS

**Architecture de génération de leçon (`app/(app)/learn/[slug]/page.tsx`) :**

```
DB → getLessonWithWords
  → getValidatedFrenchMeanings (FORME)
  → getValidatedFrenchLemmaMeaningsByWord (LEMME)
  → buildWordBank (FORME > LEMME > EN)
  → getWordAudioState (audio Muallim)
  → getWordAyahContexts (contexte coranique)
  → getWordLemmaRelations (relations de lemme)
  → getWordLinguisticEvidence (MASAQ)
  → buildCumulativeSequence (séquenceur Phase 23F)
  → generateLessonExercises (générateurs d'exercices)
  → buildInterleavedSequence (variété Phase 6E)
  → attachExerciseIdentities (identité unique)
  → LessonPlayer (UI interactive)
```

**Chaque unité d'apprentissage conserve :** word_id, forme arabe, translittération, sens résolu (FR/EN), langue réelle du sens, isFallback, translationSource, isValidated, audio URL, contexte, relations de lemme, données MASAQ.

**Pas de fusion artificielle FORME↔LEMME.** `الله` (word_id X) et `لِلَّه` (word_id Y) sont des entités distinctes avec leurs propres gloses.

---

## 6. Exercise Audit — PASS

**Types d'exercices implémentés (11 types) :**

| Type | Source de données | Niveau lexical |
|---|---|---|
| WORD_TO_TRANSLATION | word bank | FORME |
| TRANSLATION_TO_WORD | word bank | FORME |
| REVERSE_TRANSLATION | word bank | FORME |
| MULTIPLE_CHOICE | word bank + distracteurs | FORME |
| COMPLETE_WORD | word bank | FORME |
| FORM_TO_MEANING | word bank | FORME |
| MEANING_TO_FORM | word bank | FORME |
| AUDIO_TO_WORD | audio Muallim + word bank | FORME |
| CONTEXT_RECOGNITION | contexte coranique | FORME |
| LEMMA_RELATION | word_lemma_mapping | LEMME |
| WORD_RECOGNITION | word bank (découverte) | FORME |

**Mécanisme de validation :** `lib/exercises/grading.ts` — source unique. Distingue CORRECT / INCORRECT / AMBIGUOUS.

---

## 7. Free-Text Answer Checker Audit — PASS

**Comportement vérifié dans `lib/exercises/grading.ts` :**

### Arabe (`gradeArabicResponse`)
- **Tolérant** : wâsla (U+0671) → alef, dagger alef (U+0670) → alef, tatweel ignoré, annotations coraniques ignorées
- **Strict sur le lexème** : مَالِكِ ≠ مَلِكِ (alef = lettre réelle), عَبَدَ ≠ عَبْد
- **AMBIGUOUS** : même squelette non vocalisé mais vocalisation différente (jamais accepté comme CORRECT)
- **CORRECT clavier** : forme non vocalisée acceptée si le squelette correspond

### Français (`gradeFrenchResponse`)
- **Tolérant** : casse, accents (normalisés NFD puis stripped), apostrophes, guillemets, ponctuation terminale
- **Synonymes** : `/`, `·`, `|` traités comme séparateurs → « souverain / maître » et « maitre / souverain » sont équivalents
- **Partiellement correct** : possible via le mécanisme AMBIGUOUS + vérification de sous-ensemble

**Aucune correction nécessaire.** Le comportement est déjà tolérant et pédagogiquement approprié.

---

## 8. HikmaExplanation Audit — PASS

**Composant :** `components/ui/hikma-explanation.tsx` + `pedagogical-feedback.ts`

Après une erreur, l'explication affiche :
1. **Forme arabe** + translittération (toujours)
2. **Sens / glose** FR ou EN (selon résolution)
3. **Données morphologiques** MASAQ (si disponibles) : POS, stem, segments
4. **Contexte coranique** : ayah, traduction du verset
5. **Audio** : prononciation mot-à-mot (si URL signée disponible)

**Gestion des données manquantes :** 3 niveaux d'availability — `verified` (données complètes), `partial` (certaines données), `unavailable` (rien). Aucune donnée n'est inventée.

**RTL :** le composant gère correctement l'arabe (direction RTL, police appropriée).

---

## 9. SRS Audit — PASS

**Mécanisme :** Review Engine (`lib/review`) → LeitnerScheduler.

- Un mot devient « appris » quand `user_word_progress.status ∈ {familiar, mastered}`
- `applyAnswer(correct, intervalDays)` met à jour : correctCount, incorrectCount, mastery (0-100), intervalDays
- `ReviewEngine.recordAnswer()` planifie la prochaine révision (Leitner)
- Les mots sans glose sont traités normalement — le SRS est indépendant de la disponibilité lexicale
- FORM et LEMME sont correctement distingués (word_id distincts)

---

## 10. Daily Plan Audit — PASS

**`lib/learning/daily-plan.ts`** — couche de PRÉSENTATION pure.

- Ne décide rien : compose des données déjà calculées
- Sources : `selectActiveLearningPath` (prochaine action), `getDailyGoalProgress` (objectif), `getReviewDueCount` (révisions), `getQuranCoverage` (couverture)
- Coach narratif (`getCoachLine`) : déterministe, 7 règles de priorité, toujours une chaîne valide
- Aucun risque de sélectionner un mot sans contenu pédagogique

---

## 11. Coverage Audit — PASS

**`lib/learning/coverage.ts`** — métrique correcte.

- Unité : **FORME** (word_id), jamais fusionnée au lemme
- « Compris » : `user_word_progress.status ∈ {familiar, mastered}`
- Pondération : occurrences réelles depuis `word_occurrences`
- La métrique présentée au dashboard distingue correctement couverture FORME et couverture OCCURRENCE

---

## 12. Curriculum Audit — PASS

**État actuel :**
- Parcours : 14+ learning paths exposables
- Leçons : 90+ publiées
- Sourates : READY / IN_PREPARATION selon couverture lexicale FR
- Règle `classifySurahReadiness` : une sourate est READY si ≥80% de ses formes ont une résolution FR (forme ou lemme)
- Progression : `computeLessonStatuses` — LOCKED / AVAILABLE / IN_PROGRESS / COMPLETED

**Aucune régression depuis la clôture lexicale.**

---

## 13. Existing Onboarding Audit — COMPLETE

### Architecture

```
app/(auth)/login/page.tsx
  → isOnboardingComplete ? /dashboard : /onboarding

app/(onboarding)/onboarding/page.tsx
  → OnboardingForm (7 étapes, v2)

app/(app)/layout.tsx
  → Guard : si version onboarding < CURRENT, redirect /onboarding
```

### Composants

- `components/app/onboarding-form.tsx` — formulaire 7 étapes
- `lib/learning/onboarding.ts` — logique métier, validation, recommandation
- `lib/learning/onboarding-presentation.ts` — mapping UX (6 stages visibles)
- `CURRENT_ONBOARDING_VERSION = 2`

### Flux (7 étapes)

| Étape | Écran | Données collectées |
|---|---|---|
| 1 | Bienvenue | displayName |
| 2 | Objectif | learningGoal |
| 3 | Niveau arabe | arabicReadingLevel |
| 4 | Familiarité Coran | quranFamiliarity |
| 5 | Rythme | learningPace, dailyDuration |
| 6 | Sourate | preferredSurahNumber |
| 7 | Résumé + CTA | Confirmation → /dashboard |

### Paramètres persistés

```text
onboarded = true
onboarding_version = 2
display_name
learning_goal
arabic_reading_level
quran_familiarity
daily_duration
learning_pace
preferred_surah_number
```

### Recommandation de sourate (`recommendStartingSurah`)

1. Préférence explicite (`preferredSurahNumber`)
2. Si débutant / courte durée → sourate la plus courte disponible
3. Fallback : Al-Fātiḥah (surah 1)
4. Dernier recours : première sourate startable du catalogue

### Évaluation

| Aspect | Statut |
|---|---|
| Routes | ✅ COMPLETE |
| Composants | ✅ COMPLETE |
| Validation | ✅ COMPLETE |
| Persistance | ✅ COMPLETE |
| Recommandation | ✅ COMPLETE |
| Redirection guard | ✅ COMPLETE |
| RTL / mobile | ✅ COMPLETE |
| Reprise après interruption | ✅ COMPLETE (session auth) |
| Confetti / célébration | ✅ COMPLETE |
| Version management | ✅ COMPLETE (v2 → redirige si < v2) |

**Statut global : PARTIALLY_COMPLETE** — L'onboarding existant est fonctionnel mais perfectible (voir section 17).

---

## 14. First-Experience Audit — COMPLETE

### Parcours complet vérifié

```
ONBOARDING (7 étapes)
  ↓
/dashboard (DailyPlan + catalogue)
  ↓
/surahs (catalogue des sourates)
  ↓
/learn/[slug] (première leçon)
  → LessonPlayer
    → Prononciation guidée (1er mot)
    → WORD_TO_TRANSLATION
    → TRANSLATION_TO_WORD
    → ...
  → Validation (gradeFreeResponse)
  → Feedback (HikmaExplanation)
  → Progression (session → submitLessonResults)
  ↓
/dashboard (couverture mise à jour)
```

### Questions clés — réponses

1. **Quelle sourate ?** → Recommandée par `recommendStartingSurah` (préférence ou Al-Fātiḥah ou plus courte)
2. **Quelle leçon ?** → Première leçon publiée de la sourate
3. **Quel mot ?** → Premier mot de la leçon (ordre position)
4. **Quel exercice ?** → PRONUNCIATION_GUIDED puis séquence cumulative
5. **Quelle glose ?** → Résolue FORME > LEMME > EN
6. **Quelle explication ?** → HikmaExplanation avec données disponibles
7. **Progression enregistrée ?** → `runLessonSubmission` → `upsertUserWordProgress`
8. **SRS ?** → `replayWordResults` → `user_word_progress` + `review_items`
9. **Dashboard ?** → `getQuranCoverage` recalcule après session

**Aucune rupture détectée.** Le chemin complet est fonctionnel.

---

## 15. E2E Audit — PASS

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | PASS (0 erreur) |
| `eslint .` | PASS (0 erreur) |
| `vitest run` | **775/775** PASS (59 fichiers) |
| `npm run build` | PASS |

Tests liés à l'onboarding : `onboarding-ux.test.ts` (4 tests), `onboarding-recommendation.test.ts` (9 tests), `landing-contract.test.ts` (6 tests). Tous passent.

---

## 16. Risk Matrix

### P0 — BLOQUANT (0)

Aucun problème bloquant identifié. La chaîne applicative est complète et fonctionnelle.

### P1 — IMPORTANT (3)

| ID | Composant | Constat | Impact |
|---|---|---|---|
| P1-01 | OnboardingForm | 7 étapes, pas de skip possible | Friction pour utilisateurs expérimentés |
| P1-02 | Dashboard post-onboarding | État vide si aucun mot appris | Peut démotiver (« 0% de couverture ») |
| P1-03 | RecommendationCatalog | Toutes les sourates n'ont pas de glose FR pour tous leurs mots | Certaines sourates en IN_PREPARATION |

### P2 — AMÉLIORATION (5)

| ID | Composant | Constat | Solution proposée |
|---|---|---|---|
| P2-01 | OnboardingForm | Pas de prévisualisation de la sourate choisie | Ajouter une carte aperçu (nom arabe, nombre de leçons, thème) |
| P2-02 | OnboardingForm | Pas d'indicateur de progression textuel | Ajouter « Étape 3/7 » |
| P2-03 | DailyPlan | Coach line générique pour firstVisit | Personnaliser avec le nom de la sourate recommandée |
| P2-04 | Coverage dashboard | Pourcentage brut sans contexte | Ajouter « X mots appris sur Y dans ta sourate » |
| P2-05 | LessonPlayer | Pas de résumé de leçon avant de commencer | Ajouter un écran de pré-leçon (mots du jour, objectif) |

### P3 — NICE TO HAVE (2)

| ID | Constat | Solution |
|---|---|---|
| P3-01 | Pas de tutoriel interactif | Ajouter un overlay guidé première leçon |
| P3-02 | Pas de notification de progression | Ajouter « Tu as appris 10 mots aujourd'hui ! » |

---

## 17. Recommended Onboarding Changes

### A — Aucun changement nécessaire
- Résolveur lexical (FORM > LEMME > FALLBACK) — ✅
- Moteur pédagogique (buildWordBank, buildCumulativeSequence) — ✅
- Correcteur de réponses libres (gradeFreeResponse) — ✅
- Explications après erreur (HikmaExplanation) — ✅
- SRS (LeitnerScheduler) — ✅
- Daily Plan (composeDailyPlan) — ✅
- Couverture (computeCoveragePercent) — ✅
- Guard onboarding (layout.tsx redirect) — ✅

### B — Corrections nécessaires (P1)
1. **P1-01** : Ajouter un bouton « Passer » ou « Je connais déjà le Coran » sur l'étape 4 (familiarité)
2. **P1-02** : Dashboard post-onboarding : remplacer « 0% » par un message de bienvenue contextuel (« Commence ta première leçon pour débloquer ta progression »)
3. **P1-03** : Vérifier que la recommandation `recommendStartingSurah` ne propose jamais une sourate IN_PREPARATION sans avertissement

### C — Améliorations UX (P2)
4. Carte aperçu sourate dans l'étape 6
5. Indicateur « Étape X/7 »
6. Coach line personnalisée post-onboarding
7. Contexte de couverture par sourate
8. Écran de pré-leçon

### D — Améliorations pédagogiques (P2)
9. Introduction narrative avant première leçon (« Ces 5 mots apparaissent X fois dans le Coran… »)

### E — Tests à ajouter (P2)
10. Test E2E du funnel complet onboarding → première leçon → dashboard

---

## 18. Implementation Plan

### Phase 71A — Quick Wins (P1, ~2h)
- [ ] P1-02 : Message dashboard post-onboarding
- [ ] P1-03 : Garde-fou recommandation sourate

### Phase 71B — Polish UX (P2, ~4h)
- [ ] P2-01 : Carte aperçu sourate (étape 6)
- [ ] P2-02 : Indicateur de progression
- [ ] P2-03 : Coach line personnalisée
- [ ] P2-04 : Contexte couverture sourate
- [ ] P2-05 : Écran pré-leçon

### Phase 71C — Pédagogie & Tests (P2-P3, ~3h)
- [ ] D-01 : Introduction narrative première leçon
- [ ] P1-01 : Skip familiarité pour utilisateurs expérimentés
- [ ] E-01 : Test E2E onboarding → dashboard
- [ ] P3-01 : Overlay guidé première leçon (optionnel)

---

## 19. Deferred Items

- Analyse détaillée de Quran Progress → phase ultérieure
- Traitement des 3 HOLDs → décision humaine requise
- Forme HIGH_VALUE مُّدَّكِرٍۢ → traitement ponctuel optionnel
- Refonte complète de l'onboarding → non nécessaire (l'existant est solide)

---

## 20. Final Verdict

```text
PHASE_71_POST_LEXICAL_ONBOARDING_AUDIT_COMPLETE

LEXICAL_PIPELINE = FROZEN
LEXICAL_WRITES = 0
DATABASE_WRITES = 0

GROUND_TRUTH             = PASS
LEXICAL_RESOLVER_AUDIT   = PASS
PEDAGOGICAL_ENGINE_AUDIT = PASS
EXERCISE_AUDIT           = PASS
ANSWER_CHECKER_AUDIT     = PASS
EXPLANATION_AUDIT        = PASS
SRS_AUDIT                = PASS
DAILY_PLAN_AUDIT         = PASS
COVERAGE_AUDIT           = PASS
CURRICULUM_AUDIT         = PASS
ONBOARDING_AUDIT         = COMPLETE
FIRST_EXPERIENCE_AUDIT   = COMPLETE
NON_REGRESSION           = PASS

LOT_16_STARTED  = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH   = false

NEXT_PHASE = ONBOARDING_IMPLEMENTATION
STATUS = READY_FOR_HUMAN_REVIEW
```

**STOP — HUMAN REVIEW REQUIRED.** Aucune implémentation n'a été effectuée. Le rapport et le plan d'implémentation sont prêts pour validation humaine avant le passage à la phase d'exécution.