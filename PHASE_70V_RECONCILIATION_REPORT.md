# PHASE 70V — RÉCONCILIATION FINALE C+P3 ET GEL DU PIPELINE LEXICAL

## Verdict

```text
PHASE_70V_LEXICAL_PIPELINE_FROZEN

GROUND_TRUTH          = PASS
C3_RECONCILIATION     = PASS
LOTS_1_15_INTEGRITY   = PASS
PROTECTED_ZONES       = PASS
HOLDS                 = PASS
EDITORIAL_QUALITY     = PASS
NON_REGRESSION        = PASS

DATABASE_WRITES = 0
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

RECOMMENDATION = STOP_LEXICAL_PIPELINE

STOP — LEXICAL PIPELINE FROZEN
```

---

## A. Ground Truth — 11/11 PASS

| Élément | Attendu | Live | Delta | Status |
|---|---:|---:|---:|---|
| word_translations FR validées | 4490 | 4490 | 0 | ✅ |
| word_lemma_mapping | 188 | 188 | 0 | ✅ |
| lemmas | 32 | 32 | 0 | ✅ |
| lemma_translations | 32 | 32 | 0 | ✅ |
| lemma_translations FR | 32 | 32 | 0 | ✅ |
| translations | 24944 | 24944 | 0 | ✅ |
| quran_words | 21296 | 21296 | 0 | ✅ |
| word_occurrences | 77430 | 77430 | 0 | ✅ |
| MASAQ occurrences | 22485 | 22485 | 0 | ✅ |
| MASAQ segments | 44677 | 44677 | 0 | ✅ |
| sourate 64 MASAQ | 0 | 0 | 0 | ✅ |

**GROUND_TRUTH = PASS** — Aucune altération de la base depuis Phase 70U.

---

## B. La Différence « 82 Formes » — Explication Complète

### B.1 Origine du chiffre 82

Le chiffre « 82 » provient de la soustraction :

```
4325 (Phase 70U C+P3 rapporté) − 4243 (Phase 70T P3 rapporté) = 82
```

**Or les deux nombres ne mesurent pas la même chose.**

| Phase | Compteur | Valeur | Méthodologie | Bug ? |
|---|---|---|---|---|
| 70T | P3 (impact < 20) | 4243 | Impact = surahs×10 + freq; exclut lemma-FR-covered | ✅ Correct |
| 70U | « C+P3 » rapporté | 4325 | **Total des formes MASAQ non-traduites restantes** (C+P1+C+P2+C+P3 additionnés) | ❌ Bug de calcul de fréquence |

### B.2 Le bug du script Phase 70U

Le script `tmp/phase70u-audit.ts` contient une erreur de calcul de fréquence :

```typescript
// BUG : itère sur le Set masaqWordIds (chaque mot_id apparaît une seule fois),
// pas sur les occurrences MASAQ. Chaque mot reçoit donc freq = 1.
const freqMap = new Map<string, number>();
for (const wid of masaqWordIds) {
    if (!translatedIds.has(wid)) freqMap.set(wid, (freqMap.get(wid) ?? 0) + 1);
}
```

Conséquence : toutes les formes apparaissent comme `freq = 1` → toutes classées C+P3 → le script rapporte « C+P3 = 4325, 100% hapax ».

### B.3 Les vrais chiffres (live DB, ce script 70V)

| Pool 70U (freq-based) | Formes | Hapax (freq=1) | Non-hapax (freq≥2) |
|---|---:|---:|---:|
| C+P1 (freq ≥ 11) | **9** | — | 9 |
| C+P2 (freq 6–10) | **8** | — | 8 |
| C+P3 (freq ≤ 5) | **4308** | 4155 | **153** |
| **Total** | **4325** | 4155 | 170 |

Les 4325 du rapport Phase 70U sont bien le **total des 3 pools** additionnés, pas le C+P3 seul.

| Pool 70T (impact-based) | Formes | Hapax | Non-hapax |
|---|---:|---:|---:|
| P1 (impact ≥ 60) | **0** | — | 0 |
| P2 (impact ≥ 20) | **2** | — | 2 |
| P3 (impact < 20) | **4243** | 4110 | **133** |
| **Total** | **4245** | 4110 | 135 |

### B.4 Réconciliation C+P3 → P3

```
C+P3 (70U, freq ≤ 5) = 4308
P3   (70T, impact < 20) = 4243
Différence = 4308 − 4243 = 65
```

**Les 65 formes s'expliquent intégralement par deux facteurs :**

#### Facteur A : Lemma-FR-covered (66 formes)

66 formes MASAQ non-traduites au niveau **mot** sont **couvertes par une traduction de lemme** FR. La Phase 70T les exclut de son pool `catC` (méthodologie plus stricte), la Phase 70U ne les exclut pas.

Exemples (tous dérivés du lemme « rabb » — Seigneur) :

| word_id | Forme | Freq | Surahs |
|---|---|---|---|
| 4726f3ae | رَبَّهُمْ | 5 | 3 |
| a41a1667 | رَبَّكُمْ | 4 | 4 |
| 2937d395 | رَبُّنَا | 4 | 4 |
| a2e2fee6 | رَبِّهَا | 4 | 4 |
| 3e1de36b | رَبُّهُمْ | 4 | 3 |
| … | (+ 61 autres dérivés de ربّ/اللّه/رحمن) | 1–5 | 1–4 |

**Catégorie précédente (70T)** : Exclus (lemma-covered)  
**Catégorie actuelle (70U)** : C+P3 (freq ≤ 5)  
**Pool précédent** : Exclus (jamais dans P3)  
**Pool actuel** : Phase 70U C+P3  
**Raison** : Différence de définition du périmètre — 70T considère la couverture lemma comme suffisante, 70U ne filtre que sur word_translations.

#### Facteur B : Pool boundary (1 forme)

Une forme a `freq ≤ 5` mais un `impact ≥ 20`, donc classée C+P3 en 70U mais P2 en 70T.

| word_id | Forme | Freq | Surahs | Impact |
|---|---|---|---|---|
| 3f1c22da | وَأَنْهَـٰرٌۭ | 3 | 2 | 23 |

**Raison** : Le seuil C+P3 est purement fréquentiel (freq ≤ 5), le seuil P3 est basé sur l'impact (surahs×10 + freq < 20). Cette forme apparaît dans 2 sourates → impact=23 → P2 en 70T, mais freq=3 → C+P3 en 70U.

#### Formes dans l'autre sens (70T P3 mais pas 70U C+P3) : 2 formes

| word_id | Forme | Freq | Surahs | Impact | Statut 70U |
|---|---|---|---|---|---|
| a130d7c6 | مُّدَّكِرٍۢ | **6** | 1 | 16 | **C+P2** (freq ≥ 6) |
| bd82f92e | وَنُذُرِ | **6** | 1 | 16 | **C+P2** (freq ≥ 6) |

Ces deux formes ont freq=6 → C+P2 en 70U (seuil freq ≥ 6), mais impact=16 < 20 → P3 en 70T.  
**Note** : مُّدَّكِرٍۢ est la forme HIGH_VALUE identifiée par Phase 70T (score 33, PRIORITY_1).

#### Bilan net

```
66 (lemma-covered, exclues 70T) + 1 (boundary diff) − 2 (freq=6, P2 en 70U) = 65 ✓
```

---

## C. Distribution de Fréquence du C+P3 (Live)

Le C+P3 réel (freq ≤ 5) contient **4308 formes**, dont **153 non-hapax** (3.55%).

| Fréquence | Nombre de formes | % | Occurrences | % occs |
| --: | --: | --: | --: | --: |
| **1** | 4155 | 96.45% | 4155 | 92.4% |
| **2** | 129 | 2.99% | 258 | 5.7% |
| **3** | 12 | 0.28% | 36 | 0.8% |
| **4–5** | 12 | 0.28% | 49 | 1.1% |
| **Total** | **4308** | 100% | **4498** | 100% |

**Le terme « 100 % hapax » du rapport Phase 70U est infirmé** : 3.55% des formes C+P3 apparaissent 2 fois ou plus, totalisant 343 occurrences.

---

## D. Comparaison avec Phase 70T

### D.1 Les 133 non-hapax de Phase 70T — statut actuel

| Statut dans les pools 70U | Nombre |
|---|---|
| En C+P3 (freq ≤ 5) | **131** |
| En C+P2 (freq 6–10) | **2** |
| En C+P1 (freq ≥ 11) | **0** |
| Disparus (lemma-covered ou translated) | **0** |
| **Total** | **133** ✅ |

Les 133 formes non-hapax identifiées par Phase 70T existent toujours dans la base. **131** d'entre elles sont dans le C+P3 actuel (freq 2–5), **2** sont passées en C+P2 (freq=6).

### D.2 La forme HIGH_VALUE (مُّدَّكِرٍۢ)

| Attribut | Valeur |
|---|---|
| word_id | a130d7c6 |
| Forme | مُّدَّكِرٍۢ |
| Occurrences | 6 |
| Sourates | 1 (sourate 54, Al-Qamar) |
| Pool 70T | P3 (impact=16 < 20) |
| Pool 70U | **C+P2** (freq=6 ≥ 6) |
| Classification 70T | A — HIGH_VALUE (score 33, PRIORITY_1) |
| Glose MASAQ | who-will-receive-admonition |
| Statut actuel | **Non traitée** — aucune glose FR |

Cette forme reste le seul candidat à forte valeur pédagogique non couvert. Elle n'est ni dans C+P3 ni couverte par lemme ou traduction. Son traitement ponctuel (sans Lot 16) reste une option éditoriale.

---

## E. Vérification des 3 HOLDs

| Forme | wt FR | mapping | Status |
|---|---|---|---|
| أَعْلَمُ | 0 | 0 | ✅ Intact |
| كُنَّا | 0 | 0 | ✅ Intact |
| وَإِن | 0 | 0 | ✅ Intact |

Les 3 HOLDs historiques sont strictement hors pipeline. Aucune traduction, aucun mapping.

---

## F. Lots 1–15 — Intégrité Confirmée

| Vérification | Résultat |
|---|---|
| word_translations FR validated | **4490** ✅ |
| Source unique (Hikma editorial) | **100%** (79e6412e) ✅ |
| Tables non-liées inchangées | **8/8** ✅ |
| unexpected_table_changes | `[]` ✅ |

---

## G. Zones Protégées — 5/5 Intactes

| Sourate | MASAQ occurrences | Status |
|---|---:|---|
| 1 (Fātiḥah) | 29 | ✅ |
| 108 (Al-Kawthar) | 10 | ✅ |
| 112 (Al-Ikhlas) | 15 | ✅ |
| 113 (Al-Falaq) | 23 | ✅ |
| 114 (An-Nas) | 20 | ✅ |
| 64 (At-Taghabun) | 0 | ✅ |

---

## H. Couverture Finale

| Métrique | Valeur |
|---|---:|
| Formes couvertes (wt FR) | **4490 / 21296** |
| Couverture par forme | **21.08%** |
| Occurrences couvertes | **53678 / 77430** |
| Couverture par occurrence | **69.32%** |

---

## I. Décision

### C3_RECONCILED = true

La différence « 82 » (4325 − 4243) est intégralement expliquée :

1. **Le 4325 de Phase 70U n'est pas le C+P3** — c'est le total des 3 pools (9 + 8 + 4308), et il est affecté par un bug de calcul de fréquence (toutes les formes apparaissent comme hapax).

2. **Le vrai C+P3 = 4308** (freq ≤ 5), à comparer avec le vrai P3 = 4243 (impact < 20). La différence nette de 65 formes provient de :
   - **66 formes lemma-FR-covered** (exclues par 70T, incluses par 70U) — purement une différence de définition du périmètre
   - **1 forme boundary** (freq=3, impact=23 → P2 en 70T, C+P3 en 70U)
   - **−2 formes** (freq=6 → C+P2 en 70U, P3 en 70T)

3. **Le « 100% hapax » est incorrect** — 153 formes C+P3 (3.55%) apparaissent 2 fois ou plus.

4. **Aucune écriture DB n'a eu lieu entre les phases** — le ground truth est identique.

### RECOMMENDATION = STOP_LEXICAL_PIPELINE

La réconciliation est cohérente. La différence C+P3 n'est pas une erreur de données mais une divergence méthodologique entre deux scripts d'audit. Le pipeline lexical est stable, complet, et ne nécessite aucun traitement supplémentaire.

---

## J. Ce Qui Reste Volontairement Non Traité

- **3 HOLDs** (أَعْلَمُ, كُنَّا, وَإِن) — décision humaine requise
- **4308 formes C+P3** (dont 4155 hapax + 153 non-hapax) — ROI négatif
- **1 forme HIGH_VALUE** (مُّدَّكِرٍۢ, 6 occ.) — traitement ponctuel optionnel

---

## K. Sécurité Finale

```text
DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

**Aucune écriture DB. Aucun Lot 16. Aucun APPLY. Aucun HOLD traité.**

---

## L. Artefacts

```
tmp/phase70v/
  ground-truth.json              — Métriques live vs attendues
  c3-reconciliation.json         — Analyse de la divergence C+P3
  c3-frequency-distribution.json  — Distribution de fréquence du C+P3
  discrepancy-82.json            — Les 67 formes de la divergence (liste complète)
  hold-verification.json         — Vérification des 3 HOLDs
  protected-zones.json           — Vérification des zones protégées
  final-summary.json             — Synthèse finale

tmp/phase70v-reconcile.ts        — Script d'audit READ-ONLY reproductible
PHASE_70V_RECONCILIATION_REPORT.md — Ce document
```

---

> Après 15 lots éditoriaux, 4490 gloses FR validées, 69.32% de couverture des
> occurrences, et une réconciliation méthodologique complète entre les audits
> Phase 70T et Phase 70U, le pipeline lexical Hikma est officiellement gelé.
> La différence de 82 formes entre les deux audits est entièrement expliquée
> par une divergence de périmètre (lemma-covered) et un bug de calcul dans le
> script Phase 70U. Le pipeline est stable, complet, et prêt pour la transition
> produit.
>
> **PHASE_70V_LEXICAL_PIPELINE_FROZEN**
>
> **STOP — LEXICAL PIPELINE FROZEN**