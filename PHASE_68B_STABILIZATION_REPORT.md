# PHASE 68B — RAPPORT DE STABILISATION

**Verdict : `PHASE_68B_STABILIZATION_COMPLETE`**
**Décision : `READY_FOR_B02`**

Objet : traiter proprement les trois défauts de glue découverts pendant B01,
avec priorité au bug runtime n°2. Aucun import MASAQ supplémentaire lancé.

---

## 1. BUG #1 — pagination PostgREST (plafond 1000 lignes)

**Cause** : le fetch MASAQ (copié du script canonique Phase 27, jamais exécuté
sur une sourate >26 mots) ne pagine pas. PostgREST renvoie max 1000 lignes →
les 5 sourates >1000 occurrences (8→1233, 9→2498, 22→1274, 28→1430, 39→1172)
étaient tronquées silencieusement, produisant de faux `EXTRA`.

**Correction** : helper réutilisable `selectAllPages<T>(run)` dans
`lib/quran/repositories/shared.ts` — concatène toutes les pages, s'arrête à la
première page incomplète, propage la première erreur, sans omission ni doublon.
Déjà validé en conditions réelles sur B01.

**Test de non-régression** : `tests/select-all-pages.test.ts` (4 tests) — petit
volume, 2500 lignes (3 pages), multiple exact (dernière page vide), propagation
d'erreur.

---

## 2. BUG #2 — `getWordLinguisticEvidence` / limite d'URL (PRIORITAIRE)

**Cause** : `getWordLinguisticEvidence` (lib/learning/queries.ts) construisait
un filtre `.in("linguistic_occurrence_id", …)` non chunké. Une sourate entière
produit >1000 occurrences (9 → 2498), et l'URL GET dépasse le plafond HTTP/1.1
de Node (undici) → `fetch failed` (Header overflow). Seuil mesuré Phase 51 :
395 IDs OK / 397 IDs FAIL. Jamais déclenché avant car seules de petites sourates
étaient importées.

**Correction canonique** : les deux `.in()` (occurrences **et** segments) passent
désormais par le helper projet `selectInChunks` (`IN_FILTER_CHUNK_SIZE = 250`,
déjà documenté Phase 51/52 pour ce même problème). Aucun workaround local.

Contraintes respectées :
- sémantique métier du resolver **inchangée** — chaque `word_id` n'appartient
  qu'à un seul lot → politique « première occurrence par mot » (ordre
  ayah_number, position) préservée ;
- segments re-associés par `linguistic_occurrence_id`, ordre `segment_no` conservé ;
- petits volumes : comportement identique (1 requête par table) ;
- aucune donnée inventée, aucun fallback silencieux (la première erreur remonte) ;
- `normalizeOrthographic`, `classifyAlignment`, `buildImportPlan`,
  `assertPlanScope` **non modifiés** ;
- schéma DB **non modifié**.

**Test de non-régression** : `tests/linguistic-evidence-chunking.test.ts` (9
tests) — volumes 501/411/250/5, absence d'omission/doublon, absence de faux
rattachement, ordre des segments, filtre `surah_number`, politique
première-occurrence, déduplication d'entrée.

---

## 3. BUG #3 — interruption partielle / segments

**Audit** : une interruption entre l'insertion des occurrences et celle des
segments laissait des occurrences sans segments (constaté sur B01 : 2 segments
manquants de la sourate 9, tués en plein insert par le premier timeout).

**Correction** : glue d'écriture extrait et canonisé dans
`lib/linguistic/masaq-apply.ts` (nouveau module, moteur PUR réutilisé) :
- occurrences : upsert BULK `ignoreDuplicates` sur `UNIQUE(source_id,
  source_record_id)` — seules les absentes sont insérées ;
- segments : upsert BULK `ignoreDuplicates` sur `UNIQUE(linguistic_occurrence_id,
  segment_no)` pour **toutes** les occurrences du plan (pas seulement les
  nouvelles) → réparation automatique des trous.

Invariant de reprise : relancer converge toujours vers l'état complet — 0
doublon, 0 perte, 0 réimport destructif, réparation automatique.

**Test de non-régression** : `tests/masaq-apply.test.ts` (9 tests) —
planification PURE, insertion complète, idempotence (seconde exécution → 0/0),
réparation d'une occurrence sans segments, non-écrasement des données existantes,
lignes strictement dérivées du plan.

---

## 4. Tests

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | PASS (0 erreur) |
| `npx eslint .` | PASS (0 erreur) |
| `npx vitest run` | **775/775** (753 existants + 22 nouveaux) |
| `npm run build` | PASS (Next.js 16.3.0, Turbopack) |

Nouveaux tests : `select-all-pages` (4), `linguistic-evidence-chunking` (9),
`masaq-apply` (9) = 22. Aucun test existant modifié.

---

## 5. État DB (READ-ONLY — aucune écriture pendant cette étape)

Compteurs canoniques confirmés :

```
linguistic_occurrences : 7899
linguistic_segments    : 15805
quran_words            : 21296
word_occurrences       : 77430
```

**B01 intact** (aucune suppression, aucune réécriture) :

| Sourate | Occurrences |
|---|---|
| 8 | 1233 |
| 9 | 2498 |
| 13 | 853 |
| 22 | 1274 |
| 28 | 1430 |
| **Total B01** | **7288** ✓ |

`15805 − 1188 (pré-B01) = 14617` segments ✓. Hors B01 : 611 occurrences
(sourates 1, 87, 91, 93–114) inchangées.

---

## 6. Validation runtime

La correction n°2 est validée par tests (mock) ET par le run B01 réel :
`getWordLinguisticEvidence` a retourné 762/1400/601/808/935 formes par sourate
après chunking — 0 erreur réseau, 0 faux rattachement.

---

## 7. Risques résiduels

1. **Undici / limite d'URL** : le seuil 250 reste une heuristique mesurée ; si un
   futur déploiement HTTP élargit les en-têtes, `IN_FILTER_CHUNK_SIZE` est le
   point de réglage unique (documenté). Risque faible.
2. **Bulk upsert vs contrainte** : la correction n°3 repose sur les contraintes
   `UNIQUE` existantes. Elles ont été vérifiées sur B01 ; aucun changement de
   schéma requis. À re-confirmer implicitement à chaque batch via le diff
   baseline-pre/post (déjà prévu par le pipeline).
3. **`selectAllPages` et `selectAll` coexistent** : `selectAll` (ancien) reste
   utilisé ailleurs et n'est pas paginé de façon robuste pour les tables
   filtrées — hors périmètre de cette étape, mais à auditer plus tard si une
   table dépasse 1000 lignes dans un autre pipeline.

---

## 8. Recommandation pour B02

**`READY_FOR_B02`** — le pipeline est stable et les trois défauts sont couverts
par des tests de non-régression. B02→B11 peuvent être exécutés avec le
mécanisme canonique (baseline → dry-run → apply → diff → propagation → runtime →
idempotence), en reprenant au premier batch non `VERIFIED`.

---

## 9. Git (aucun commit/push effectué)

Fichiers production modifiés :
- `lib/learning/queries.ts` (chunking `getWordLinguisticEvidence`)
- `lib/quran/repositories/shared.ts` (helper `selectAllPages`)

Fichiers production créés :
- `lib/linguistic/masaq-apply.ts` (glue d'écriture canonique)

Fichiers de test créés :
- `tests/select-all-pages.test.ts`
- `tests/linguistic-evidence-chunking.test.ts`
- `tests/masaq-apply.test.ts`

Fichiers temporaires (hors prod) :
- `scripts/tmp/phase68/import-68b.ts` (orchestrateur, câblé sur les modules canoniques)
- `scripts/tmp/phase68/db-check.ts` (README-only, vérification B01)

`git diff --stat` (production) : `lib/learning/queries.ts` (+51/-25),
`lib/quran/repositories/shared.ts` (+27).

Aucun commit, push, reset, rebase ou squash effectué.
