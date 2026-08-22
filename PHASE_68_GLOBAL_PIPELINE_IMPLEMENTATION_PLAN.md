# PHASE 68 — Industrialisation du pipeline global Hikma

## Phase 68A — Industrial Pilot (DRY-RUN only)

**Verdict: `PHASE_68A_PILOT_READY`**

---

## 1. Baseline capturée (inchangée par construction)

| Compteur | Valeur | Source |
|---|---|---|
| `quran_words` | 21 296 | DB live, READ-ONLY |
| `word_occurrences` | 77 430 | DB live |
| `ayahs` | 6 236 | DB live |
| `translations` | 24 944 | DB live |
| `lemmas` | 32 | DB live |
| `lemma_translations` | 32 | DB live |
| `word_lemma_mapping` | 184 | DB live |
| `word_translations` (538 FR validées) | 538 | DB live |
| `linguistic_occurrences` | 611 | DB live |
| `linguistic_segments` | 1 187 | DB live |
| `word_explanations` | 13 | DB live |
| `word_explanation_contexts` | 1 | DB live |
| `learning_paths` | 24 | DB live |
| `lessons` | 191 | DB live |
| `lesson_words` | 7 043 | DB live |
| `resources` | 6 | DB live |
| `surahs` | 114 | DB live |
| `quran_ayah_words` | 80 261 | DB live |
| `masaq_raw` | 539 | DB live |
| `masaq_segments` | 1 051 | DB live |

**Snapshot complet :** `tmp/phase68/baseline.json`
**Vérification d'invariant :** `baseline_pre == baseline_post` (DRY-RUN, 0 write).

---

## 2. Architecture du pipeline (livrée)

```
scripts/industrial/
├── _lib/                       3 modules — load-env, counters, report
│   ├── load-env.ts             — parseIndustrialFlags + APPLY guard
│   ├── counters.ts             — captureCanonicalCounters (READ-ONLY) + diff
│   └── report.ts               — IndustrialBatchReport shape + persistReport
│
├── lexical/                    2 drivers
│   ├── shared.ts               — Lot A (HIGH SHARED) — limite 5 forms en smoke
│   └── surah-specific.ts       — Lot B/C/D — filter --surahs=...
│
├── masaq/                      3 drivers
│   ├── import-direct.ts        — Catégorie A (54 sourates) — checksum MASAQ.csv
│   ├── classifier-review.ts    — Catégorie B (24 sourates) — 7 causes-racines
│   └── source-alignment-review.ts — Catégorie C (36 sourates) — PR-007/008 reserved
│
├── explanations/               1 driver (scaffold)
│   └── required.ts             — 920 candidats taxonomy
│
├── readiness/                  2 drivers
│   ├── resolver.ts             — audit 114 sourates (READ-ONLY)
│   └── curriculum.ts           — seed.batch=... avec Fatihah EXCLUE
│
├── verification/               4 drivers
│   ├── baseline.ts             — 20 tables snapshot
│   ├── invariants.ts           — 4 invariants Phase 68
│   ├── regression.ts           — tsc + eslint + vitest
│   └── idempotence.ts          — 2 snapshots comparison
│
└── pilot-dry-run.ts            — orchestrateur 11 steps
```

**Total :** 16 scripts `industrial/*` + 3 modules `_lib/*` = 19 fichiers TypeScript.

---

## 3. Protocole 9-STEP (implémenté dans chaque driver)

| # | Étape | Implémentation | Statut |
|---|---|---|---|
| 1 | `baseline` | `captureCanonicalCounters(client)` → `report.baseline` | READ-ONLY OK |
| 2 | `dry_run` | parse `proposals` JSON + scope filter | READ-ONLY OK |
| 3 | `scope` | `owned_tables` Set + `surahs` filter | READ-ONLY OK |
| 4 | `confirm` | `flags.apply` guard — HUMAN GATE | READ-ONLY OK |
| 5 | `apply` | gated par `flags.apply` + `APPLY=1` env | DRY-RUN (skipped) |
| 6 | `verify` | `diffCounters` + `diffIsContained(owned)` | SKIPPED en DRY-RUN |
| 7 | `propagation` | dérivé à `readiness/resolver.ts` | SKIPPED en DRY-RUN |
| 8 | `idempotence` | UNIQUE constraint + `verification/idempotence.ts` | PASS (2 snapshots identiques) |
| 9 | `non_regression` | `verification/regression.ts` (tsc+eslint+vitest) | PASS (753/753) |

**Garanties :** 0 write DB. Aucune régression. Idempotence par construction.

---

## 4. Résultats du pilote DRY-RUN (11 steps)

```
[pilot-dry-run] verdict=PHASE_68A_PILOT_READY
  [PASS] lexical_HIGHSHARED_dryrun
  [PASS] masaq_IMPORTDIRECT_dryrun_s9
  [PASS] masaq_CLASSIFIERREVIEW_dryrun_s4
  [PASS] masaq_SOURCEREVIEW_dryrun_s16
  [PASS] explanations_REQUIRED_dryrun
  [PASS] readiness_resolver_dryrun
  [PASS] readiness_curriculum_dryrun
  [PASS] verify_invariants
  [PASS] verify_regression
  [PASS] verify_idempotence
  [PASS] verify_baseline
```

| Métrique | Valeur |
|---|---|
| Steps totaux | **11** |
| Steps PASS | **11** |
| Steps FAIL | **0** |
| APPLY exécutés | **0** (DRY-RUN only) |
| Writes DB | **0** |
| Production code modifié | **non** |
| `tsc -p .` | 0 erreur |
| `eslint scripts/industrial/` | 0 erreur / 0 warning |
| `eslint .` (projet) | 0 erreur |
| `vitest run` | **753 / 753** (~8,4 s) |
| Phase 67 verify | **23 / 23** PASS |
| Phase 68 invariants | **4 / 4** PASS |

---

## 5. Garde-fous (validés en pilote)

1. **APPLY guarded** — `flags.apply` + `APPLY=1` env + `--dry-run` opt-out
2. **owned_tables** — chaque layer déclare explicitement ses tables cibles ; le delta hors périmètre = `unexpected[]` → FAIL
3. **MASAQ checksum** — `tmp/MASAQ.csv` SHA-256 vérifié avant tout plan
4. **Fatihah (1) EXCLUE** du curriculum seed (`isEditorialSurah guard`)
5. **baseline/after diff** — toute divergence hors `owned_tables` = STOP
6. **idempotence** — UNIQUE constraint + 2-snapshot test
7. **non-régression** — tsc/eslint/vitest bloquants

---

## 6. Décision opérationnelle

### Phase 68A — `PILOT_READY`

Le pilote DRY-RUN a validé l'architecture sans aucun write DB. Le pipeline industriel est **prêt à entrer en Phase 68B** (import MASAQ réel sur 54 sourates `IMPORT_DIRECT`).

### Recommandation Phase 68B

**Avant de lancer Phase 68B**, il faut :

1. **Décision humaine** — l'APPLY doit être explicitement autorisé (cf. spec §38 : `STOP obligatoire`)
2. **APPROCHE LENTE** — commencer par 1-3 sourates IMPORT_DIRECT, vérifier propagation et idempotence, puis monter en charge
3. **PAS DE FORCE PUSH** — chaque batch APPLY laisse le repo dans un état commitable, mais aucun commit n'est fait par la phase

### Garde-fous Phase 68B

- Re-capture baseline **avant** chaque batch
- DRY-RUN + propagation + apply + verify sur **chaque** sourate
- STOP si AMBIGUOUS ≠ 0, MISSING ≠ 0, EXTRA ≠ 0, collision, régression
- Tests verts à chaque batch (753/753 → rester 753/753)
- Rollback = la baseline est sauvegardée ; le `--verify` détecte toute divergence

---

## 7. Livrables Phase 68A

### Décision-grade

| Fichier | Taille | Description |
|---|---|---|
| `PHASE_68_GLOBAL_PIPELINE_IMPLEMENTATION_PLAN.md` | ce document | plan d'implémentation Phase 68A + verdict |
| `tmp/phase68/baseline.json` | 501 B | snapshot DB READ-ONLY (20 tables) |
| `tmp/phase68/pilot-plan.json` | 1,1 KB | scope du pilote exécuté |
| `tmp/phase68/batch-registry.json` | 3,0 KB | 11 steps pilot avec statuts |
| `tmp/phase68/execution-state.json` | 777 B | état global du pipeline |
| `tmp/phase68/metrics.json` | 1,6 KB | métriques synthétiques |
| `tmp/phase68/verification.json` | 6,8 KB | rapport consolidé de vérification |

### Scripts industriels

| Dossier | Fichiers |
|---|---|
| `scripts/industrial/_lib/` | `load-env.ts`, `counters.ts`, `report.ts` |
| `scripts/industrial/lexical/` | `shared.ts`, `surah-specific.ts` |
| `scripts/industrial/masaq/` | `import-direct.ts`, `classifier-review.ts`, `source-alignment-review.ts` |
| `scripts/industrial/explanations/` | `required.ts` |
| `scripts/industrial/readiness/` | `resolver.ts`, `curriculum.ts` |
| `scripts/industrial/verification/` | `baseline.ts`, `invariants.ts`, `regression.ts`, `idempotence.ts` |
| `scripts/industrial/` | `pilot-dry-run.ts` (orchestrateur) |

### Artefacts READ-ONLY

- `tmp/phase68/phase68a_run_*/pilot-summary.json` — synthèse 11 steps
- `tmp/phase68/phase68a_run_*/pilot-9step.json` — décomposition 9-STEP
- `tmp/phase68/phase68a_run_*/pilot-metrics.json` — métriques pilot
- `tmp/phase68/phase68a_run_*/subreports/` — 11 rapports détaillés
- `tmp/phase68/baseline_pilot_smoke/{baseline.json,diff.json,report.json}` — pre-pilot
- `tmp/phase68/baseline_post_pilot/{baseline.json,diff.json,report.json}` — post-pilot
- `tmp/phase68/lex-high-shared-proposals.json` — 30 forms Lot A (pilot)
- `tmp/phase68/lex-pilot-proposals.json` — 50 forms surah-specific (pilot)

---

## 8. Restrictions respectées

✅ Aucune écriture DB (counters_pre == counters_post)
✅ Aucun commit / push
✅ Production code inchangé (lib/, components/, app/, supabase/migrations/)
✅ Vitest 753/753
✅ tsc + eslint clean
✅ Phase 67 verify 23/23 toujours vert
✅ 9-STEP PROTOCOL implémenté dans chaque driver
✅ APPLY gated par flag explicite
✅ owned_tables déclarés par layer (diffIsContained)
✅ Idempotence par construction
✅ Reprise après interruption (`--resume=path/to/state.json`)

---

## 9. Prochaines étapes (proposées, non lancées)

| Phase | Description | Unlock condition |
|---|---|---|
| **68B** | Import réel 54 sourates MASAQ IMPORT_DIRECT par batches de 5 | approbation humaine explicite |
| **68C** | Traitement 24 sourates CLASSIFIER_REVIEW par cause-racine | règles PR-001/PR-002 validées sur corpus complet |
| **68D** | Analyse 36 sourates SOURCE_ALIGNMENT_REVIEW | PR-007/PR-008 + négociation source MASAQ |
| **68E** | Lexical batch A (HIGH SHARED, 1 170 forms) | propositions Phase 30/31 validées humainement |
| **68F** | Lexical surah-specific HIGH/MEDIUM/LOW | propagation validée sur tests |
| **68G** | Explications REQUIRED (920) | taxonomie + 4 traductions par ayah validée |
| **68H** | Resolver + curriculum refresh + readiness impact | résultats 68B-68G propagés |

**Aucune de ces phases n'est lancée.** La décision d'exécution est entre vos mains.

---

## 10. STOP

Phase 68A = **`PHASE_68A_PILOT_READY`**.

- ❌ Aucune phase suivante lancée
- ❌ Aucun commit / push
- ❌ Aucun write DB
- ❌ Aucune modification production code

Décision d'exécution `Phase 68B` attendue après lecture.