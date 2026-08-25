# PHASE 89K — R-89J-01 — GET QURAN COVERAGE CHUNKING

## VERDICT

```
PHASE_89K_COMPLETE
DATABASE_WRITES = 0
R-89J-01 = RESOLVED
```

## ROOT CAUSE

`getQuranCoverage` (dashboard, « couverture lexicale ») exécutait un count `.in("word_id", wordIds)` **non chunké** sur tous les mots compris de l'utilisateur. Au-delà de ~396 ids (seuil PostgREST) → `TypeError: fetch failed`. Même classe que CAT-000/88J/88K/R-003. **Reproduit sur DB réelle : 500 ids → fetch failed.**

## FIX

Count **exact par lots de 250** (`chunk` + `Promise.all` + `head:true`, mêmes primitives que `selectInChunks`), somme des counts.

**Découverte clé de la validation DB** : `selectInChunks` (lignes) aurait **introduit une troncature** — plafond REST de 1 000 lignes par GET : 250 mots (1 376 occurrences) → exactement 1 000 lignes. Le test d'équivalence a attrapé ce bug avant production (baseline : 1 376 vs 1 000). Le count par lot est le seul moyen correct de compter.

## ÉQUIVALENCE (DB réelle, 1 000 word_ids réels)

| Cas | Avant | Après | Verdict |
|---|---|---|---|
| empty / single / 249 / 250 / 251 | OK 0 / 1 / 1375 / 1376 / 1377 | identiques | **EQUAL ×5** |
| **500** | **ERROR fetch failed** | **OK 1942** | **FIXED_BY_89K** |
| **1001** | **ERROR** | **OK 3673** | **FIXED_BY_89K** |
| doublons (500 lignes → 250 distincts) | OK 1376 | OK 1376 | EQUAL |
| ids inexistants | OK 0 | OK 0 | EQUAL |

**0 MISMATCH · 0 perte · 0 doublon · 0 faux positif.**

## TESTS

```
BUILD = PASS · TYPECHECK = PASS (app + scripts) · LINT = PASS
VITEST = 1046/1046 PASS (1038 existants + 8 nouveaux tests getQuranCoverage :
         empty / 1 / 250 / 251 / 500 / 1001 / déduplication / erreur → null)
```

## DASHBOARD

Métrique inchangée (`coveragePercent`, `coveredOccurrences`, `totalOccurrences`, `comprehendedWordIds`) — équivalence prouvée. Aucune UI modifiée.

## SECURITY / DATABASE

RLS, isolation user, CSP, routes : **intactes** · `DATABASE_WRITES = 0`.

## DISCOVERED_NOT_IN_SCOPE

- **DISC-89K-001 (NOTE)** : `getCoverageBySurah` (89C) compte via des lignes — lot > 1 000 occurrences tronquerait (marginal aujourd'hui ~900/lot) ; paginer `.range()` ou documenter.
- **DISC-89K-002 (NOTE)** : jusqu'à 5-6 requêtes `.in` par page dashboard pour un utilisateur très avancé (pas de N+1, acceptable).

## FINAL

```
CHUNKING_CORRECT = YES · SEMANTICS_PRESERVED = YES · ERROR_PROPAGATION_PRESERVED = YES
NO_DATA_LOSS = YES · NO_DUPLICATES = YES · NO_REGRESSION = YES
REGRESSIONS = 0
NEXT_PHASE = PRODUCTION_CONFIGURATION
```

Rapport : `reports/phase-89k-r89j-01-quran-coverage-chunking.json` · Script read-only : `scripts/phase-89k-r89j-01-quran-coverage-chunking.ts`.
