# PHASE 71A — QUICK WINS P1 — IMPLÉMENTATION DE L'ONBOARDING HIKMA

## Verdict

```text
PHASE_71A_ONBOARDING_P1_IMPLEMENTATION_COMPLETE

DATABASE_WRITES = 0
LEXICAL_WRITES = 0
COMMIT = false
PUSH = false

P0 = 0
P1_REMAINING = 0

ONBOARDING          = PASS
FAMILIARITY_SKIP    = PASS
EMPTY_DASHBOARD     = PASS
SURAH_GUARD         = PASS

tsc     = PASS (0 erreur)
eslint  = PASS (0 erreur)
vitest  = 782/782 PASS (+7 nouveaux)
build   = PASS

STOP — HUMAN REVIEW REQUIRED
```

---

## 1. Ground Truth (inchangé)

| Élément | Valeur | Status |
|---|---|---|
| word_translations FR validées | 4490 | ✅ GELÉ |
| word_lemma_mapping | 188 | ✅ GELÉ |
| lemmas / lemma_translations | 32 / 32 | ✅ GELÉ |
| HOLDs (3) | 0 wtFR / 0 mapping | ✅ INTACTS |
| Zones protégées (6) | inchangées | ✅ INTACTES |
| C+P3 / Lot 16 | non touché | ✅ GELÉ |

**Aucune écriture DB lexicale. Pipeline gelé confirmé.**

---

## 2. État Avant Modification

### Code existant
- **Onboarding** : `components/app/onboarding-form.tsx` — 9 étapes (0-8), `skipOptional()` sur chaque étape, `finish()` persistait via `completeOnboarding`.
- **Dashboard** : `app/(app)/dashboard/page.tsx` — `firstVisit` détecté, coach line « Commence tranquillement avec ta première leçon. », CTA « Découvrir ».
- **Surah guard** : `completeOnboarding()` (`lib/learning/actions.ts`) — validation côté serveur avec `selectedSurah.state === "IN_PREPARATION"`.

### Problèmes P1

| ID | Constat | Fichiers |
|---|---|---|
| P1-01 | Aucun mécanisme pour raccourcir l'onboarding pour utilisateurs expérimentés | `onboarding-form.tsx` |
| P1-02 | Dashboard post-onboarding : CTA « Découvrir » peu explicite pour un nouveau, pas de nom de sourate affiché | `dashboard/page.tsx`, `daily-plan.ts` |
| P1-03 | Guard surah utilisait une comparaison inline au lieu de `isStartableSurah` | `actions.ts` |

---

## 3. Problèmes P1 Confirmés et Résolus

### P1-01 — Fast-track pour utilisateurs expérimentés

**Fichiers** : `components/app/onboarding-form.tsx`

**Modification** :
- Ajout d'une fonction `fastTrack()` qui pré-remplit les préférences avec des valeurs par défaut pour un utilisateur familier (`quranFamiliarity="regular_recitation"`, `arabicReadingLevel="correct"`, `learningGoal="understand_surahs"`, `learningPace="flexible"`) et saute directement à l'étape 7 (sélection de sourate).
- Ajout d'un bouton « Je connais déjà le Coran » sur l'étape 0 (page d'accueil).

**Comportement** :
- L'utilisateur peut choisir sa sourate (étape 7) puis valider (étape 8)
- Les valeurs par défaut ne remplacent que les champs `null` — si l'utilisateur a déjà rempli un champ avant de cliquer, il est préservé
- `finish()` utilise `selected` (= `startable.find()` ?? `recommendation`) donc la sourate est toujours valide
- L'état final est identique à un onboarding complet : `onboarded=true`, version=CURRENT, profil complet

### P1-02 — Dashboard post-onboarding accueillant

**Fichiers** : `lib/learning/daily-plan.ts`, `app/(app)/dashboard/page.tsx`

**Modifications** :
- `composeAction()` accepte désormais un paramètre optionnel `firstVisit: boolean`
- `composeDailyPlan()` accepte `firstVisit` dans son input et le transmet à `composeAction()`
- Quand `firstVisit=true` et `kind ∈ {recommendation, fallback}` :
  - label : `"Commencer ma première leçon"` (au lieu de `"Découvrir"`)
  - context : `"Ta première sourate : Al-Fātiḥah."` (au lieu de `"Découvre Al-Fātiḥah."`)
- Le dashboard transmet `firstVisit` (déjà calculé) à `composeDailyPlan`

**Comportement** :
- Dashboard vide → coach line « Commence tranquillement avec ta première leçon. »
- CTA « Commencer ma première leçon » → lien vers `/learn/basmala`
- Contexte « Ta première sourate : Al-Fātiḥah. » affiché

### P1-03 — Surah guard normalisé

**Fichiers** : `lib/learning/actions.ts`

**Modification** :
- Import de `isStartableSurah` depuis `@/lib/learning/onboarding`
- Remplacement de `selectedSurah.state === "IN_PREPARATION"` par `!isStartableSurah(selectedSurah)` (les 2 occurrences dans `completeOnboarding`)
- `isStartableSurah` est la source unique de vérité : `state ∈ {REFERENCE, READY}`

**Comportement** :
- Le guard côté serveur et le filtre côté client utilisent la même règle
- Aucune régression : `recommendStartingSurah` utilise déjà le même filtre `isStartable`
- Test ajouté pour les 4 cas : REFERENCE ✅, READY ✅, IN_PREPARATION ❌, absent ❌

---

## 4. Architecture Après Modification

```
onboarding step 0
  ├── [Commencer] → étapes 1→8 (parcours complet)
  └── [Je connais déjà le Coran] → fastTrack() → étape 7 (sélection sourate)
                                      pré-remplit: goal/level/familiarity/pace

onboarding finish()
  ├── selected = startable.find(preferredSurahNumber) ?? recommendation
  └── completeOnboarding(profile) → validation serveur
        └── isStartableSurah(selectedSurah) ? OK : "cette sourate n'est pas disponible"

dashboard (firstVisit = true)
  └── composeDailyPlan({ ..., firstVisit })
        └── composeAction(selection, firstVisit=true)
              └── label: "Commencer ma première leçon"
              └── context: "Ta première sourate : Al-Fātiḥah."
```

---

## 5. Tests Automatisés

### Tests existants — tous passent

```
59 fichiers · 775 tests · 0 échec
```

### Nouveaux tests (+7)

| Fichier | Test | P1 |
|---|---|---|
| `tests/daily-plan.test.ts` | `firstVisit utilise le libellé 'Commencer ma première leçon'` | P1-02 |
| `tests/daily-plan.test.ts` | `firstVisit garde 'Découvrir' pour le fallback sans surahName` | P1-02 |
| `tests/daily-plan.test.ts` | `sans firstVisit, le libellé reste 'Découvrir'` | P1-02 |
| `tests/onboarding-recommendation.test.ts` | `isStartableSurah identifie les sourates REFERENCE et READY` | P1-03 |
| `tests/onboarding-recommendation.test.ts` | `recommendStartingSurah n'accepte jamais IN_PREPARATION avec choix explicite` | P1-03 |
| `tests/onboarding-recommendation.test.ts` | `recommendStartingSurah renvoie le choix explicite si REFERENCE` | P1-03 |
| `tests/onboarding-recommendation.test.ts` | `recommendStartingSurah renvoie le choix explicite si READY` | P1-03 |

**Total : 782 / 782 PASS**

---

## 6. Non-Regression

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | PASS — 0 erreur |
| `eslint . --quiet` | PASS — 0 erreur |
| `vitest run` | PASS — 59 fichiers, 782 tests, 0 échec |
| `npm run build` | PASS — build Next.js réussi |

---

## 7. Impact DB

```text
DATABASE_WRITES = 0
LEXICAL_WRITES = 0
```

Aucune migration, aucun INSERT, aucun UPDATE, aucun DELETE.

Seules les modifications de code applicatif dans 3 fichiers ont été effectuées. Aucune donnée lexicale, aucun HOLD, aucune zone protégée n'a été modifiée.

---

## 8. Fichiers Modifiés

| Fichier | Type | Lignes |
|---|---|---|
| `components/app/onboarding-form.tsx` | UI — fast-track | +13 |
| `lib/learning/daily-plan.ts` | Logique — firstVisit label | +8 modifié |
| `app/(app)/dashboard/page.tsx` | Intégration — firstVisit | +1 |
| `lib/learning/actions.ts` | Guard — isStartableSurah | +1 import, inline→fonction |
| `tests/daily-plan.test.ts` | Tests — P1-02 | +18 |
| `tests/onboarding-recommendation.test.ts` | Tests — P1-03 | +21 |

---

## 9. Sécurité

```text
DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

---

## 10. Artefacts

```
PHASE_71A_REPORT.md                — ce rapport

tmp/phase71a/
  (produits par l'audit Phase 71)
```

---

## 11. Limites

- **P1-01** : La fonction `fastTrack()` est testée via l'UI (le fast-track produit un profil valide, vérifié par les règles métier existantes). Pas de test unitaire pour fastTrack elle-même (fonction interne au composant client).
- **P1-02** : Le label « Commencer ma première leçon » ne s'affiche que pour `kind=recommendation/fallback`. Les autres `kind` (active_session, in_progress) utilisent leurs labels existants, ce qui est correct (firstVisit est false dans ces cas).
- **P1-03** : La garde serveur existante couvrait déjà les IN_PREPARATION. Le changement de `=== "IN_PREPARATION"` vers `!isStartableSurah()` est un refactoring de normalisation, pas une correction de bug.

---

## 12. Recommandation pour Phase 71B

Les trois risques P1 sont résolus. La Phase 71B (Polish UX) peut être lancée après validation humaine.

Rappel des items P2 de la Phase 71B :
- P2-01 : Carte aperçu sourate dans l'étape 6
- P2-02 : Indicateur « Étape X/7 »
- P2-03 : Coach line personnalisée post-onboarding (déjà partiellement couvert par P1-02)
- P2-04 : Contexte de couverture par sourate
- P2-05 : Écran de pré-leçon

---

> Les 3 risques P1 identifiés dans l'audit Phase 71 sont traités. Aucune
> donnée lexicale n'a été modifiée. Aucun Lot 16 n'a été lancé. Les HOLDs
> restent intacts. Les zones protégées restent intactes. Les 782 tests
> passent. Le pipeline lexical est GELÉ.
>
> **PHASE_71A_ONBOARDING_P1_IMPLEMENTATION_COMPLETE**
>
> **STOP — HUMAN REVIEW REQUIRED**