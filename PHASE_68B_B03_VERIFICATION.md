# PHASE_68B_B03 — VÉRIFICATION READ-ONLY (état appliqué)

## Contexte
- B03 (sourates **39, 45, 46, 47, 49**) a déjà été **appliqué et vérifié** (APPLY réel du 2026-08-21).
  - `PHASE_68B_B03_REPORT.md` → verdict `PHASE_68B_B03_COMPLETE`
  - `tmp/phase68/execution-state-68b.json` → B03 `VERIFIED` (3189 occurrences / 6258 segments)
- Ce document est un **passage de vérification READ-ONLY** de l'état appliqué, demandé par l'utilisateur :
  **aucune écriture DB n'a été effectuée** pendant cette session.
- Artefact structuré : `tmp/phase68/68b_masaq_B03/verification-readonly.json`
- Script : `scripts/tmp/phase68/verify-68b-b03-readonly.ts` (uniquement `select`/`count`/fonctions pures).

## 1. Baseline (compteurs canoniques, live)
| Table | Live | Enregistré post-B03 | Match |
|-------|-----:|--------------------:|:-----:|
| linguistic_occurrences | **14590** | 14590 | ✓ |
| linguistic_segments | **28980** | 28980 | ✓ |
| quran_words 21296 · word_occurrences 77430 · ayahs 6236 · translations 24944 · lemmas 32 · lemma_translations 32 · word_lemma_mapping 184 · word_translations 538 · word_explanations 13 · word_explanation_contexts 1 · learning_paths 24 · units 24 · lessons 191 · lesson_words 1307 · review_items 23 · user_word_progress 23 · user_activity_lessons 8 · sources 6 | — | identiques | ✓ |

- `matches_recorded_post = true` — la DB live est exactement à l'état post-B03 enregistré.
- Checksum MASAQ : `777d0cc8…` **OK**.

## 2. Plan DRY-RUN par sourate (moteur canonique, pur)
`buildImportPlan` + `assertPlanScope` re-exécutés (aucune écriture) :

| Sourate | Attendues | Plan alignées | Segments plan | DB occurrences | DB segments | EXACT | ORTHO | VAR | AMBIG | MISSING | EXTRA |
|--------:|----------:|--------------:|--------------:|---------------:|------------:|------:|------:|----:|------:|--------:|------:|
| 39 | 1172 | 1172 | 2266 | 1172 | 2266 | 653 | 486 | 33 | 0 | 0 | 0 |
| 45 | 488 | 488 | 988 | 488 | 988 | 272 | 191 | 25 | 0 | 0 | 0 |
| 46 | 643 | 643 | 1242 | 643 | 1242 | 349 | 269 | 25 | 0 | 0 | 0 |
| 47 | 539 | 539 | 1084 | 539 | 1084 | 281 | 237 | 21 | 0 | 0 | 0 |
| 49 | 347 | 347 | 678 | 347 | 678 | 162 | 171 | 14 | 0 | 0 | 0 |
| **Total** | **3189** | **3189** | **6258** | **3189** | **6258** | — | — | — | **0** | **0** | **0** |

- `assertPlanScope` : **PASS (0 violation)** — aucune AMBIGUOUS/MISSING/EXTRA, périmètre sourate strict.
- Plan et DB coïncident parfaitement → aucune troncature, aucune perte, aucun doublon.

## 3. Propagation (matrice par sourate)
Matrice DB live identique à l'état enregistré post-B03 (`violations = []`, `ok = true`) :
- B03 : `{39: 1172, 45: 488, 46: 643, 47: 539, 49: 347}` — exactement les deltas attendus.
- B01 (8, 9, 13, 22, 28) : `1233, 2498, 853, 1274, 1430` — **inchangé**.
- B02 (29, 31, 32, 34, 36) : `976, 546, 372, 883, 725` — **inchangé**.
- Sourates pré-existantes (1, 87, 91, 93, 94, 96, 97, 101–114) : **inchangées**.
- Aucune sourate non ciblée n'est contaminée.

## 4. Segments B03
- Total DB des segments des 5 sourates B03 : **6258** = attendu **6258** (`ok = true`).
- Aucun segment manquant (chaque occurrence a ses segments, réparation glue vérifiée par construction).

## 5. Idempotence (démontrée sans réécrire — NO-OP)
- `source_record_id` du plan déjà présents en DB : **3189 / 3189**.
- Insertion si re-run : **0** (`idempotent = true`).
- Un nouvel APPLY B03 ne créerait aucune ligne — l'état est stable et idempotent.

## 6. Runtime (`getWordLinguisticEvidence`, chunking `selectInChunks` actif)
| Sourate | expected_words | resolved_words | % |
|--------:|---------------:|---------------:|--:|
| 39 | 761 | 761 | 100 |
| 45 | 365 | 365 | 100 |
| 46 | 482 | 482 | 100 |
| 47 | 379 | 379 | 100 |
| 49 | 248 | 248 | 100 |

- **100 % résolu**, `ok = true`.
- Sourate 39 (>1000 occurrences) résolue intégralement sans Header overflow / URL trop longue.

## 7. Non-régression
- `npx tsc --noEmit` : **PASS**
- `npx eslint .` : **PASS**
- `npx vitest run` : **775/775** PASS (59 fichiers)
- `npm run build` : **PASS**

## 8. État Git
- Aucun `commit` / `push` (interdit, respecté).
- Seul ajout de cette session : `scripts/tmp/phase68/verify-68b-b03-readonly.ts` (script de vérification) + `tmp/phase68/68b_masaq_B03/verification-readonly.json` + ce rapport.

## 9. Anomalies
- **Aucune.**

## 10. Verdict
**PHASE_68B_B03_STATE_VERIFIED** — B03 (39, 45, 46, 47, 49) reste appliqué, cohérent, idempotent et 100 % résolu au runtime. Aucune donnée n'a été modifiée pendant cette vérification.

## STOP
- **B04 et les batches suivants ne sont PAS exécutés.**
- Aucune nouvelle phase engagée.
- Attente d'une autorisation explicite distincte pour B04.
