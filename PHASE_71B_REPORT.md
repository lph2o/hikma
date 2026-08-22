# PHASE 71B — POLISH UX P2 — RAPPORT D'IMPLÉMENTATION

## Verdict

```text
PHASE_71B_ONBOARDING_P2_IMPLEMENTATION_COMPLETE

DATABASE_WRITES = 0
LEXICAL_WRITES = 0
P0 = 0
P1_REMAINING = 0

P2_01 (surah preview)    = PASS
P2_02 (progress counter) = PASS
P2_03 (coach line)       = PASS
P2_04 (surah coverage)   = NOT_APPLICABLE (requires new aggregated query)
P2_05 (pre-lesson)       = PASS

tsc     = PASS
eslint  = PASS
vitest  = 782/782 PASS
build   = PASS

COMMIT = false
PUSH = false

STOP — HUMAN REVIEW REQUIRED
```

---

## A. Ground Truth

| Élément | Attendu | Status |
|---|---|---|
| word_translations FR validées | 4490 | ✅ GELÉ |
| HOLDs (3) | 0 wtFR / 0 mapping | ✅ INTACTS |
| Zones protégées (6) | inchangées | ✅ INTACTES |
| Pipeline lexical | FROZEN | ✅ |

**DATABASE_WRITES = 0** — aucun INSERT/UPDATE/DELETE.

---

## B. Audit Avant Modification

Voir `tmp/phase71b/pre-implementation-audit.json` pour l'analyse complète.

Résumé :

| P2 | Existant | Action |
|---|---|---|
| P2-01 | `SurahChoice` tiles, pas de fiche info | Ajouter `SurahInfoCard` sous la grille |
| P2-02 | `ProgressRail` 6 étapes, pas de compteur | Ajouter « Étape X/7 » dans `ProgressRail` |
| P2-03 | firstVisit context de 71A | Ajouter objectif du jour dans le context |
| P2-04 | Couverture globale, pas par sourate | NOT_APPLICABLE (nécessite nouvelle requête agrégée) |
| P2-05 | Redirection directe après celebration | Ajouter `PreLesson` avec `?welcome=1` |

---

## C. P2-01 — Aperçu de la sourate ✅

**Fichier** : `components/app/onboarding-form.tsx`

**Modification** : Ajout d'un composant `SurahInfoCard` affiché sous la grille de sélection à l'étape 7.

La carte montre :
- Nom arabe + translittération de la sourate sélectionnée
- Nombre de leçons et de formes
- Description du statut (REFERENCE / READY)

Données utilisées : `SurahCatalogItem` (déjà chargé dans `catalog`). Aucune nouvelle donnée.

---

## D. P2-02 — Indicateur de progression ✅

**Fichier** : `components/app/onboarding-form.tsx`

**Modification** : `ProgressRail` reçoit désormais `step` en plus de `stage` (UX).

Règle :
- **step = 0** (welcome) : pas de compteur → « C'est presque prêt ✨ »
- **steps 1–7** : « Étape X sur 7 » (où X = step, 1-indexed)
- **step = 8** (confirmation) : « Confirmation »

Le fast-track (step 0→7) affiche « Étape 7 sur 7 ».

---

## E. P2-03 — Coach line personnalisée ✅

**Fichiers** : `lib/learning/daily-plan.ts`

**Modifications** :
- `composeAction` reçoit un `dailyGoal` optionnel
- Enrichit le `context` firstVisit avec l'objectif quotidien

Avant : `"Ta première sourate : Al-Fātiḥah."`
Après : `"Ta première sourate : Al-Fātiḥah. Objectif du jour : 5 mots."`

---

## F. P2-04 — Contexte de couverture par sourate ❌ NOT_APPLICABLE

**Décision** : NON IMPLÉMENTÉ.

Une couverture par sourate nécessiterait une requête agrégée (user_word_progress ∩ word_occurrences ∩ lesson_words) qui n'existe pas aujourd'hui. La métrique `effectiveFrPct` dans le catalogue mesure la disponibilité FR (pas la progression utilisateur).

Cette fonctionnalité est différée à une phase ultérieure (nouvelle query `getSurahCoverage`).

---

## G. P2-05 — Écran de pré-leçon ✅

**Fichiers** :
- `app/(app)/learn/[slug]/page.tsx` — lecture de `?welcome=1` + ajout de `PreLesson`
- `lib/learning/daily-plan.ts` — CTA firstVisit ajoute `?welcome=1` au href

**Comportement** :
- Le CTA « Commencer ma première leçon » pointe vers `/learn/basmala?welcome=1`
- La page leçon détecte le paramètre et affiche `PreLesson` au-dessus du `LessonPlayer`
- `PreLesson` montre : nom de la sourate, titre de la leçon, nombre de mots, nombre d'exercices, brève explication de la méthode
- Un CTA « Commence quand tu es prêt » (texte informatif, le bouton est en-dessous via LessonPlayer)

---

## H. Architecture inchangée

```
DB → getValidatedFrenchMeanings → lemma → buildWordBank
  → buildCumulativeSequence → generateLessonExercises
  → PreLesson (si ?welcome=1)
  → LessonPlayer → gradeFreeResponse → HikmaExplanation
  → runLessonSubmission → SRS → Dashboard
```

Aucune nouvelle source de vérité, aucun chemin parallèle.

---

## I. Accessibilité

- `ProgressRail` : `aria-label`, `aria-hidden="true"` sur la barre décorative
- `SurahInfoCard` : contenu sémantique (Card/CardContent), pas de div cliquable
- `PreLesson` : contenu sémantique, pas d'élément interactif
- Aucune régression d'accessibilité

---

## J. Responsive / RTL

- `SurahInfoCard` : layout flex, responsive via les classes existantes
- `PreLesson` : centré, padding adaptatif (`p-6 sm:p-8`)
- `ProgressRail` : compteur aligné à droite, `tabular-nums`
- RTL préservé : les composants utilisent les classes et patterns RTL existants

---

## K. Tests

### Baseline confirmée : 782/782 PASS

Aucune régression P1 :
- Fast-track → ✅
- Parcours normal → ✅
- Dashboard firstVisit → ✅ (test mis à jour pour l'objectif)
- Surah guard → ✅

### Test mis à jour

| Test | Changement |
|---|---|
| `firstVisit utilise le libellé 'Commencer ma première leçon'` | Context inclut désormais « Objectif du jour : 5 mots. » |

---

## L. Non-régression

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | ✅ 0 erreur |
| `eslint . --quiet` | ✅ 0 erreur |
| `vitest run` | ✅ 59 fichiers / 782 tests / 0 échec |
| `npm run build` | ✅ Build Next.js réussi |

---

## M. Fichiers Modifiés

| Fichier | Modifications |
|---|---|
| `components/app/onboarding-form.tsx` | P2-01: `SurahInfoCard`, P2-02: `ProgressRail` step label |
| `lib/learning/daily-plan.ts` | P2-03: dailyGoal context, P2-05: `?welcome=1` href |
| `app/(app)/learn/[slug]/page.tsx` | P2-05: `searchParams` + `PreLesson` component |
| `tests/daily-plan.test.ts` | Test mis à jour pour P2-03 |

---

## N. Sécurité

```text
DATABASE_WRITES = 0
LEXICAL_WRITES = 0
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

---

## O. Limitations

- **P2-04** n'est pas implémenté — nécessite une nouvelle requête agrégée `getSurahCoverage`
- **PreLesson** n'est affiché que via `?welcome=1` — pas un overlay interactif (pas de bouton « Commencer » séparé, le flux continue naturellement vers la leçon)
- Les tests pour PreLesson et SurahInfoCard sont couverts par le build (rendu serveur) — pas de test unitaire dédié car ce sont des composants de présentation pure

---

## P. Recommandation Phase 71C

La phase 71C (Pédagogie & Tests) peut être lancée après validation humaine.

Rappel :
- D-01 : Introduction narrative première leçon
- P1-01 (from Phase 71) : Skip familiarité pour utilisateurs expérimentés (déjà fait en 71A)
- E-01 : Test E2E onboarding → dashboard
- P3-01 : Overlay guidé première leçon (optionnel)

---

> Après 4 implémentations UX sur 5 P2 (P2-04 différé), l'onboarding Hikma
> est désormais plus lisible (compteur d'étape), plus informatif (fiche
> sourate, objectif quotidien), et plus engageant (écran de pré-leçon). Aucune
> donnée lexicale n'a été modifiée. Le pipeline est GELÉ. Les 782 tests
> passent.
>
> **PHASE_71B_ONBOARDING_P2_IMPLEMENTATION_COMPLETE**
>
> **STOP — HUMAN REVIEW REQUIRED**