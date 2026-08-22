# PHASE 62 — IMPORT MASAQ 91 / 87 / 96 — RAPPORT

**Verdict : `PHASE_62_MASAQ_IMPORT_BLOCKED`**
**Cause exacte :** la sourate 87 contient **2 occurrences classées `AMBIGUOUS`** par le
classifieur canonique d'alignement. `assertPlanScope` refuse toute planification avec
`AMBIGUOUS > 0` (garde-fou délibéré, §4 : « Le mapping doit être EXACT »).
**Aucune écriture n'a été effectuée.**

---

## A. Baseline (tmp/phase62-baseline.json)

| Compteur | Valeur | Compteur | Valeur |
|---|---:|---|---:|
| quran_words | 21 296 | linguistic_occurrences | **413** |
| word_occurrences | 77 430 | linguistic_segments | **796** |
| ayahs | 6 236 | word_explanations | 13 |
| translations | 24 944 | word_explanation_contexts | 1 |
| word_translations FR validées | 538 | learning_paths / units | 24 / 24 |
| lemmas / lemma_translations | 32 / 32 | lessons / lesson_words | 191 / 1 307 |
| word_lemma_mapping | 184 | sources | 6 |

Conforme à la Phase 61 — aucune divergence.

## B. Source MASAQ utilisée

- **MASAQ v2** — DOI 10.17632/9yvrzxktmr.2, licence CC BY 3.0/4.0, attribution MASAQ
  (Majdi Sawalha, University of Jordan, 2024).
- Fichier `tmp/MASAQ.csv` — checksum SHA-256 `777d0cc8…a900` **✅ MATCH** (vérifié par
  le script avant toute opération).
- Source DB `72d4ac84-4c73-4e02-aaa0-52d0b405eb34` (ligne `sources` existante).

## C. Mécanisme d'import utilisé

- **Réutilisé tel quel :** `scripts/import-masaq-multi-surah.ts` (mécanisme des Phases
  24G / 27 / 43B) — **aucune méthode parallèle, aucun code modifié**.
- Scoping par variable `SURAH=91,87,96` (aucun élargissement).
- Alignement **obligatoire par `(surah, ayah, position)`** — jamais par chaîne arabe seule
  (`lib/linguistic/masaq-plan.ts` `buildImportPlan`).
- Garde-fous : `assertPlanScope` refuse `MISSING` / `EXTRA` / `AMBIGUOUS` /
  périmètre sourate violé.
- Idempotence : clé `UNIQUE(source_id, source_record_id)`.
- Segments : seuls les `Prefix`/`Stem`/`Suffix` réels sont importés (exclusion des
  marqueurs i3rab vides — `AVAILABLE ≠ INFERABLE`).

## D. Données source — plan d'import (DRY-RUN, aucune écriture)

| Sourate | Hikma | Alignées | EXACT | ORTHO | VARIANT | AMBIGUOUS | MISSING | EXTRA | Segments |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **91** | 54 | **54/54** | 28 | 25 | 1 | **0** | 0 | 0 | 116 |
| **87** | 72 | 72/72 | 47 | 19 | 4 | **2** ⛔ | 0 | 0 | 137 |
| **96** | 72 | **72/72** | 43 | 21 | 8 | **0** | 0 | 0 | 139 |

## E. Alignement occurrence par occurrence (tmp/phase62-preimport-matrix.csv)

198 lignes (54 + 72 + 72), clé `(surah, ayah, position, forme, word_id, masaq_available)`.
**196/198 alignables** ; les 2 refusées sont :

| Sourate | Ayah | Pos | Forme Hikma | Forme MASAQ | Nature |
|---|---:|---:|---|---|---|
| 87 | 15 | 3 | `رَبِّهِۦ` (petit yeh exposant U+06E6) | `رَبِّهِ` (yeh omis) | Variante orthographique (suffixe pronominal) |
| 87 | 16 | 3 | `ٱلْحَيَوٰةَ` (waw + dagger-alif U+0670) | `ٱلْحَيَاةَ` (alif plein) | Variante orthographique (dagger-alif après waw) |

**Diagnostic précis (codepoints) :**
- `رَبِّهِۦ` : `normalizeOrthographic` mappe `U+06E6 → ي` (règle Phase 27 pour
  `إِۦلَـٰفِهِمْ`/`إِيلَافِهِمْ`), mais ici MASAQ **omet** le yeh plutôt que de l'écrire
  plein → la forme normalisée Hikma (`رَبِّهِي`) ≠ MASAQ (`رَبِّهِ`) ; aucune règle
  `noAlif` / `finalAlif` / `collapse` / `noHamza` ne couvre le cas.
- `ٱلْحَيَوٰةَ` : `normalizeOrthographic` mappe `U+0670 → ا` mais conserve le waw →
  `حَيَواة` ≠ `حَيَاة` ; la règle `ىٰ → ا` couvre le dagger-alif sur ya, **pas après waw**.

Ce sont les **mêmes classes de variantes documentées** que les Phases 27/43A–43B ont
traitées (petit yeh, dagger-alif), mais pour des **configurations précises non couvertes**
par le classifieur actuel. Le classifieur est volontairement conservateur
(`AVAILABLE ≠ INFERABLE`) : il refuse plutôt que d'affirmer une correspondance non
documentée — comportement **correct** du garde-fou.

## F. Lignes insérées — **0**

## G. Lignes déjà existantes — **0 concernées** (aucune occurrence 91/87/96 en base)

## H. Idempotence

Non testable en écriture (import bloqué avant insertion). Le mécanisme reste idempotent
par construction (`UNIQUE(source_id, source_record_id)`, démontré en 24G/27/43B).
La **ré-exécution du DRY-RUN est déterministe** (même plan, même refus).

## I–K. Couverture 91 / 87 / 96 (runtime — inchangée, 0 %)

| Sourate | linguistic_occurrences | segments | ayahs couverts | couverture |
|---|---:|---:|---:|---:|
| 91 | 0 | 0 | 0/15 | 0 % |
| 87 | 0 | 0 | 0/19 | 0 % |
| 96 | 0 | 0 | 0/19 | 0 % |

`getWordLinguisticEvidence(…, surah)` retourne `∅` pour les trois — **rien n'a été
modifié en base**, conformément au STOP.

## L. Vérification runtime

Non applicable en l'état (aucune donnée importée). Le chemin runtime n'a pas été touché.

## M. Propagation / effets de bord

**Aucun.** Aucune écriture → aucun mot partagé n'a été rattaché, aucune sourate hors
périmètre affectée. Les 17 sourates MASAQ existantes conservent exactement leur couverture
(413 / 796) — `tmp/phase62-propagation-audit.json`.

## N. Compteurs avant/après — **identiques** (diff = 0 partout, tmp/phase62-verify.json)

Seule variation attendue dans un scénario nominal : `linguistic_occurrences` 413 → 611
(+198) et `linguistic_segments` 796 → ~1 188 (+392). **Non atteinte.**

## O. Tests

- `npx tsc --noEmit` → **0 erreur** ✅
- `npx eslint .` → **0 erreur** ✅
- `npx vitest run` → **743/743** ✅ (identique à la baseline Phase 59/60/61)
- `npm run build` → **OK** ✅

## P. Fichiers modifiés

**Aucun fichier de production modifié.** Aucune migration, aucun commit, aucun push.
Seuls artefacts d'audit créés : ce rapport + `tmp/phase62-*` (baseline, preimport-matrix,
write-result, coverage, propagation-audit, verify, verify.ts).

## Q. Décision finale

**`PHASE_62_MASAQ_IMPORT_BLOCKED`**

- **Blocage :** 2 occurrences de la sourate 87 classées `AMBIGUOUS` par le classifieur
  canonique — `assertPlanScope` refuse, conformément au workflow EXACT des Phases
  24G/27/43A-43B.
- **Non écrit :** aucune donnée, aucune table, aucun mot.
- **91 et 96 sont entièrement propres** (0 AMBIGUOUS, alignement 100 %) — le blocage
  porte uniquement sur 87.

### Options de remédiation (aucune exécutée — décision explicite requise)

1. **Étendre `normalizeOrthographic`/`classifyAlignment`** avec les 2 variantes
   documentées (petit yeh exposant final omis par MASAQ ; waw+dagger-alif → alif),
   selon le précédent des Phases 27 / 43A→43B, puis relancer l'import. *Nécessite une
   décision éditoriale explicite (modification du code de la couche linguistique).*
2. **Importer uniquement 91 et 96** (propres à 100 %) et différer 87. *Nécessite une
   décision de périmètre explicite.*
3. **Classifier les 2 occurrences en `VARIANT_ORTHOGRAPHY_DOCUMENTED`** après revue
   manuelle documentée. *Nécessite une décision éditoriale explicite.*

**STOP — aucune Phase 63 lancée automatiquement. Aucun commit, aucun push.**
