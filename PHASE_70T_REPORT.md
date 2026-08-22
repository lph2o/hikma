# PHASE 70T — AUDIT STRATÉGIQUE DES NON-HAPAX C+P3

## Verdict

```text
PHASE_70T_C3_NONHAPAX_STRATEGIC_AUDIT_COMPLETE

RECOMMEND_STOP_C3

DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN DECISION REQUIRED
```

## A. Ground truth live

| Élément | Attendu | Live | Status |
|---|---:|---:|---|
| word_translations FR | 4490 | 4490 | PASS |
| word_lemma_mapping | 188 | 188 | PASS |
| lemmas | 32 | 32 | PASS |
| lemma_translations | 32 | 32 | PASS |
| lemma_translations FR | 28 | 28 | PASS |
| translations | 24944 | 24944 | PASS |
| quran_words | 21296 | 21296 | PASS |
| word_occurrences | 77430 | 77430 | PASS |
| MASAQ occurrences | 22485 | 22485 | PASS |
| MASAQ segments | 44677 | 44677 | PASS |
| sourate 64 | 0 | 0 | PASS |
| HOLDs (3) | 0 wt FR / 0 mapping | 0/0 | PASS |
| Zones protégées | intactes | intactes | PASS |

## B. Pool C+P3 non-hapax

| Métrique | Valeur |
|---|---:|
| C+P3 total | 4243 |
| Non-hapax (≥2 occurrences) | **133** |
| Occurrences totales | **291** |
| % des occurrences C+P3 | 6.6% |
| % des formes C+P3 | 3.1% |

## C. Classification éditoriale

| Classe | Nombre | % |
|---|---:|---:|
| A — HIGH_VALUE | **1** | 0.8% |
| B — GOOD_VALUE | **3** | 2.3% |
| C — LOW_VALUE | **106** | 79.7% |
| D — REDUNDANT | **0** | 0% |
| E — AMBIGUOUS | **23** | 17.3% |
| F — DIFFICULT | **0** | 0% |

**Constat** : 79.7% des non-hapax ont une faible valeur pédagogique. Une seule forme
est classée HIGH_VALUE (مُّدَّكِرٍۢ, 6 occurrences, « celui qui se souvient / reçoit
l'avertissement »).

## D. Priorités

| Priorité | Nombre |
|---|---:|
| PRIORITY_1 | **1** |
| PRIORITY_2 | **11** |
| PRIORITY_3 | **73** |
| SKIP | **48** |

## E. ROI — Scénarios

| Scénario | Formes | Occurrences | Gain couverture |
|---|---|---|---:|
| A — PRIORITY_1 seule | 1 | 6 | +0.01% |
| B — PRIORITY_1+2 | 12 | 42 | +0.05% |
| C — Les 133 | 133 | 291 | +0.38% |
| D — Rien | 0 | 0 | 0.00% |

La couverture actuelle est de **69.32%** (53 678 / 77 430). Traiter les 133 formes
la porterait à **69.70%** — un gain de 0.38 point, pour un coût éditorial
disproportionné (revue occurrence-par-occurrence de 133 formes rares et ambiguës).

## F. La seule forme à haute valeur

| word_id | Forme | Occ. | Glose proposée |
|---|---|---|---|
| a130d7c6 | مُّدَّكِرٍۢ | 6 | celui qui se souvient / reçoit l'avertissement |

Cette forme apparaît dans 54:15, 54:17, 54:22, 54:32, 54:40. La glose est stable
et vérifiable sur les 4 sources. C'est le seul candidat dont le traitement manuel
aurait un ROI acceptable.

## G. Les 3 formes à bonne valeur

| word_id | Forme | Occ. | Glose |
|---|---|---|---|
| d04d9a5b | لِلذِّكْرِ | 4 | pour le rappel |
| 591c6ccf | يَسَّرْنَا | 4 | Nous avons facilité |
| 10e474c1 | رَضُوا۟ | 4 | ils sont satisfaits |

## H. Recommandation : RECOMMEND_STOP_C3

**Ne pas créer de Lot 16.** Les raisons :

1. **ROI quasi nul** : +0.38% de couverture pour 133 revues occurrence-par-occurrence.
2. **79.7% de formes à faible valeur** (LOW_VALUE) : variantes morphologiques mineures
   ou formes déjà résolubles par lemme.
3. **Aucune famille de lemme partiellement couverte** : pas d'effet de levier.
4. **La seule forme HIGH_VALUE** (مُّدَّكِرٍۢ) peut être traitée isolément si souhaité,
   sans lancer un lot complet.
5. **La couverture actuelle de 69.32%** est déjà excellente pour un lexique
   pédagogique. Les 30.68% restants sont des hapax sans impact réel sur la
   compréhension du texte.

### Alternative

Si l'utilisateur souhaite tout de même une action, traiter uniquement la forme
HIGH_VALUE (مُّدَّكِرٍۢ) comme ajout ponctuel, sans pipeline de lot complet.

## I. Tests non-régression

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | PASS |
| `eslint .` | PASS |
| `vitest run` | **775/775** PASS |
| `npm run build` | PASS |

## J. Artefacts

- `tmp/phase70t/` : ground-truth.json, non-hapax-pool.json, occurrence-analysis.json,
  source-analysis.json, morphology-analysis.json, scoring.json, roi-scenarios.json,
  recommendation.json, summary.json
- `PHASE_70T_REPORT.md` (ce document)

## K. Sécurité

```text
DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

**Aucune écriture DB. Aucun Lot 16 créé. Aucun APPLY. Aucun commit/push.**

---

> Après 15 lots, 4490 gloses, et 69.32% de couverture des occurrences, le
> pipeline de priorisation par fréquence a rempli sa mission. Les pools C+P1
> et C+P2 sont épuisés. Le C+P3 résiduel (4243 formes, dont 96.8% de hapax)
> ne présente pas de ROI suffisant pour justifier un traitement éditorial
> supplémentaire. La recommandation est d'arrêter ici le pipeline de
> traduction lexicale et de concentrer les efforts sur d'autres dimensions
> du produit Hikma.