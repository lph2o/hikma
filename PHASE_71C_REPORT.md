# PHASE 71C — PÉDAGOGIE + TESTS — FINALISATION DE L'ONBOARDING HIKMA

## Verdict

```text
PHASE_71C_ONBOARDING_PEDAGOGY_COMPLETE

DATABASE_WRITES = 0
LEXICAL_WRITES = 0
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

D-01 = PASS
P3-01 = NOT_NEEDED
E-01 = PASS

tsc     = PASS (0 erreur)
eslint  = PASS (0 erreur)
vitest  = 789/789 PASS (+7 nouveaux tests)
build   = PASS
```

---

## A. Ground Truth

Les compteurs de référence sont inchangés depuis Phase 70W :

| Élément | Valeur |
|---|---|
| word_translations FR | 4490 |
| word_lemma_mapping | 188 |
| lemmas | 32 |
| lemma_translations / FR | 32 / 28 |
| translations | 24944 |
| quran_words | 21296 |
| word_occurrences | 77430 |
| MASAQ occurrences / segments | 22485 / 44677 |
| Pipeline lexical | FROZEN |
| HOLDs | 3 intacts |

---

## B. Modifications

| Fichier | Changement |
|---|---|
| `app/(app)/learn/[slug]/page.tsx` | D-01 : narration pédagogique dans PreLesson |
| `tests/onboarding-ux.test.ts` | E-01 : +7 tests (stages fast-track, contrat copy, PreLesson) |

---

## C. D-01 — Introduction narrative PreLesson

**Avant** (Phase 71B) :
```
Chaque exercice t'aide à reconnaître, comprendre puis utiliser les mots du Coran.
Réponds à ton rythme — il n'y a pas de minuterie.
```

**Après** (Phase 71C) :
```
Tu vas découvrir les mots de cette sourate un par un.
Essaie de retrouver leur sens — Hikma t'accompagnera à chaque réponse.
Plus tard, ces mots reviendront au bon moment pour que tu les retiennes durablement.
```

La narration :
- Explique la promesse Hikma en 3 phrases, sans jargon (pas de « SRS », « Leitner », « lemma », « MASAQ », « algorithme »)
- Respecte le principe ACTION > EXPLICATION
- Ton : calme, pédagogique, encourageant, sobre

---

## D. P3-01 — Guidage première leçon

**Décision : NOT_NEEDED.**

Le flux existant est déjà auto-explicatif :
1. **PreLesson** (nouvelle narration) → explique ce qui arrive
2. **LessonDiscovery** → un mot à la fois, révélation volontaire du sens, navigation précédent/suivant
3. **Exercices** → `HikmaExerciseShell` avec instruction + feedback immédiat
4. **HikmaExplanation** → après erreur : forme arabe + glose FR + contexte + morphologie

Aucun écran n'est ambigu. Ajouter un overlay/tutoriel serait redondant et nuirait au rythme de la première expérience.

---

## E. E-01 — Tests

### Nouveaux tests (onboarding-ux.test.ts)

| Test | Description |
|---|---|
| fast-track step 0 → stage 0 | L'écran welcome reste bienvenu |
| selection screen (step 7) → stage 4 | La sélection sourate mappe sur goal |
| final screen (step 8) → stage 5 | Le récapitulatif est la dernière étape UX |
| PreLesson copy : pas de jargon | SRS, Leitner, lemma, MASAQ, algorithme absents des helpers |
| getAnticipationCopy : pas de durée | Pas de « X min » inventé |
| getSignatureCopy(null) → null | Pas d'ayah inventée |
| getSignatureCopy avec ayahRef | L'ayahRef réelle est bien incluse |

### Tests existants préservés

- Surah guard (isStartableSurah : REFERENCE/READY → true, IN_PREPARATION → false)
- Fast-track via recommendStartingSurah
- FirstVisit dashboard labels
- Daily plan coach line
- Onboarding version gate

---

## F. Non-régression

```
tsc     = 0 erreur
eslint  = 0 erreur
vitest  = 789/789 PASS
build   = PASS
```

Aucune régression. Les 782 tests de la baseline Phase 71A/71B passent tous.

---

## G. UX

| Aspect | État |
|---|---|
| Desktop | PreLesson centré, carte gold, mascotte |
| Mobile | Responsive (gap-6, px-5, sm:px-8) |
| RTL | Arabe dans la sourate, pas d'inversion |
| Accessibilité | aria-hidden sur icônes décoratives |

---

## H. DB

```
DATABASE_WRITES = 0
LEXICAL_WRITES = 0
```

Aucune requête d'écriture. Aucune migration. Le pipeline lexical est resté gelé.

---

## I. Sécurité

```
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

---

## J. Limitations

1. **P2-04 (couverture par sourate)** reste DIFFÉRÉ — nécessite `getSurahCoverage` (nouvelle query agrégée).
2. **E-01 E2E complet** — les tests sont des tests unitaires de contrat ; un test E2E avec Playwright couvrant le parcours complet (onboarding → dashboard → première leçon → exercice → SRS → retour dashboard) serait l'étape suivante logique mais nécessite une infrastructure E2E.
3. **P3-01** — le guidage overlay n'est pas nécessaire aujourd'hui mais pourrait être reconsidéré après des tests utilisateurs réels.

---

## K. Handoff — État final de l'onboarding Hikma

### Pipeline lexical

```
GELÉ — 4490 gloses FR validées
Couverture forme = 21.08%
Couverture occurrence = 69.32%
C+P1 = 9 / C+P2 = 8 / C+P3 = 4308
HOLDs = 3
```

### Parcours onboarding (Phases 71A → 71B → 71C)

```
WELCOME
  ↓           ← fast-track « Je connais déjà le Coran »
ONBOARDING (ProgressRail « Étape X/7 »)
  ↓
CHOIX / RECOMMANDATION SOURATE
  ↓           ← SurahInfoCard (nom, leçons, formes)
SURAH INFO
  ↓           ← isStartableSurah guard
PRÉFÉRENCES + GOAL
  ↓
RÉCAPITULATIF
  ↓
DASHBOARD     ← firstVisit : « Commencer ma première leçon »
  ↓              + « Objectif du jour : 5 mots »
PRE-LESSON    ← ?welcome=1, narration pédagogique
  ↓
LESSON DISCOVERY → EXERCISES → EXPLANATION → SRS → DASHBOARD
```

### Ce qui fonctionne

- P1-01 : Fast-track utilisateurs expérimentés
- P1-02 : Dashboard firstVisit accueillant
- P1-03 : Surah guard normalisé (`isStartableSurah`)
- P2-01 : SurahInfoCard (aperçu sourate)
- P2-02 : ProgressRail (Étape X/7)
- P2-03 : Coach line enrichie (daily goal)
- P2-05 : PreLesson (transition onboarding → leçon)
- D-01 : Narration pédagogique PreLesson
- E-01 : Tests de contrat onboarding → leçon
- 789 tests, 0 échec

### Ce qui est différé

- P2-04 : Couverture par sourate (nécessite nouvelle query)
- P3-01 : Overlay guidé (NOT_NEEDED après audit)

---

```text
PHASE_71C_ONBOARDING_PEDAGOGY_COMPLETE

DATABASE_WRITES = 0
LEXICAL_WRITES = 0
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN REVIEW REQUIRED
```