# PHASE 89C — R-003 Data Chunking — Résumé

## VERDICT

```
PHASE_89C_COMPLETE
DATABASE_WRITES = 0
R-003 = RESOLVED
```

## Cause racine

`getCoverageBySurah` (dashboard, carte « couverture lexicale ») exécutait un seul `.in("word_id", ids)` sur **tous les mots compris de l'utilisateur**. Cet ensemble croît sans borne (jusqu'au corpus ≈ 21 296 formes) et dépasse le seuil PostgREST ≈ 396 ids / ≈ 14,7 Ko → `TypeError: fetch failed` (header overflow) — **même classe que CAT-000/88J**.

**Reproduit sur DB réelle** (baseline avant correctif) : 500 word_ids réels → `word_occurrences : TypeError: fetch failed`.

## Correctif

`lib/learning/queries.ts — getCoverageBySurah` : la requête passe par le helper **`selectInChunks`** existant (Phase 52), taille `IN_FILTER_CHUNK_SIZE = 250`, même pattern validé en 88J/88K. Sémantique strictement préservée : déduplication identique, fusion déterministe, erreurs propagées, ordre final garanti par `computeCoverageBySurah` (tri par surahNumber).

## Baseline vs After (DB réelle, entrées déterministes)

| Case | Before | After | Verdict |
| --- | --- | --- | --- |
| Empty | `[]` | `[]` | EQUAL |
| Single (1) | 1 sourate | 1 sourate | EQUAL |
| Small (10) | 20 sourates | 20 sourates | EQUAL |
| Medium (200) | 80 sourates | 80 sourates | EQUAL |
| Boundary (249) | 80 sourates | 80 sourates | EQUAL |
| Boundary (250) | 80 sourates | 80 sourates | EQUAL |
| Boundary (251) | 80 sourates | 80 sourates | EQUAL |
| **Large (500)** | **ERROR fetch failed** | **OK — 91 sourates** | **FIXED_BY_R003** |
| Duplicated input (500 entrées, 250 distincts) | 80 sourates | 80 sourates | EQUAL |
| No occurrences | `[]` | `[]` | EQUAL |

**Vérification indépendante du cas critique (500 ids)** : le résultat est identique à l'union de 2 appels de 250 — `surahSetEqual = true`, `countBoundsOk = true` → aucune perte, aucun doublon, aucune sourate fantôme.

## Tests

```
BUILD      = PASS
TYPECHECK  = PASS (0 erreur)
LINT       = PASS (0 erreur)
VITEST     = 983/983 PASS  (975 + 8 nouveaux tests R-003)
```

8 tests dédiés dans `tests/in-chunking.test.ts` : empty / 1 id / 250 / 251 / 500 / 1001 / déduplication / erreur propagée — avec mock filtrant réellement les `.in()` (preuve d'absence d'omission/doublon) et comptage des appels (preuve d'absence de N+1).

## Database

```
DATABASE_WRITES = 0
```

## Régressions

```
REGRESSIONS = 0
```

## Découvert (non corrigé — hors périmètre)

- **DISC-001** : `getQuranCoverage` (même fichier) contient le même `.in("word_id", wordIds)` non chunké sur le compte des occurrences couvertes — même classe de bug, à traiter en priorité (recommandé : début de la phase 89D ou micro-phase dédiée).

## Prochaine phase

```
NEXT_PHASE = PHASE_89D_AUTH
NEXT_RISK  = R-004_PASSWORD_RESET
```
