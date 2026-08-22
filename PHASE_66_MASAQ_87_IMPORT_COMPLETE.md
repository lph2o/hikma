# PHASE 66 — IMPORT MASAQ SOURATE 87 (AL-AʿLĀ)

STATUT : **IMPORT COMPLETE** — uniquement la sourate 87, via le mécanisme
existant (`scripts/import-masaq-multi-surah.ts`, `SURAH=87`). Aucun classifieur
modifié, aucune autre table touchée, aucun commit, aucun push.

---

## A. Baseline avant import

Vérifiée depuis la DB réelle (`tmp/phase66-baseline.json`) :

| Élément | Valeur |
|---|---|
| word_translations FR validées | 538 |
| linguistic_occurrences / segments | 539 / 1 051 |
| MASAQ 91 / 87 / 96 | 54 / **0** / 72 |
| Segments 91 / 87 / 96 | 116 / 0 / 139 |
| Catalogue | 24 parcours — 1 REFERENCE + 23 READY + 0 IN_PREPARATION |
| Readiness 91 / 87 / 96 | READY / READY / READY |
| Tests | 753/753 (Phase 65) |

Données 91/96 intactes (54/72 occurrences, segments 116/139). Aucune divergence.

## B. Dry-run final

```
SURAH=87 npx tsx scripts/import-masaq-multi-surah.ts
✅ checksum MASAQ vérifié (777d0cc8…)
Plan sourate 87 : 72/72 alignées · EXACT=47 ORTHO=21 VARIANT=4
MISSING=0 EXTRA=0 AMBIGUOUS=0 · segments=137
```

`assertPlanScope` = PASS (min=max=87 → périmètre strict). Résultat exactement
conforme aux attentes.

## C. Plan d'écriture

- `target_surahs: [87]`, plan strictement limité à `surah_number = 87` ;
- 72 occurrences planifiées, 0 hors sourate (assertPlanScope vérifie
  min/max=87) ;
- 0 MISSING, 0 EXTRA, 0 AMBIGUOUS ;
- les deux cas bloquants sont dans le plan en alignement accepté :
  - 87:15:3 `رَبِّهِۦ` ↔ `رَبِّهِ` (règle A′, Phase 65) ;
  - 87:16:3 `ٱلْحَيَوٰةَ` ↔ `ٱلْحَيَاةَ` (règle B2, Phase 65).

## D. Résultat APPLY

```
SURAH=87 APPLY=1 npx tsx scripts/import-masaq-multi-surah.ts
Sourate 87 : INSERTED=72 DUPLICATES=0 ERRORS=0 SEGMENTS=137
```

Répartition : 47 EXACT · 21 EXACT_ORTHOGRAPHIC · 4 VARIANT_ORTHOGRAPHY_DOCUMENTED.
Aucune autre donnée MASAQ créée. Aucun SQL manuel, aucun garde-fou contourné.

## E. Compteurs avant / après

| Compteur | Avant | Après | Δ |
|---|---:|---:|---:|
| linguistic_occurrences | 539 | **611** | **+72** |
| linguistic_segments | 1 051 | **1 188** | **+137** |
| MASAQ 87 | 0 | 72 | +72 |
| MASAQ 91 | 54 | 54 | +0 |
| MASAQ 96 | 72 | 72 | +0 |
| word_translations FR | 538 | 538 | 0 |
| Toutes les autres tables | — | — | 0 |

## F. Matrice de propagation

Audit par sourate (avant/après, `tmp/phase66-verify.json`) :

| Sourate | Avant | Après | Δ |
|---:|---:|---:|---:|
| **87** | 0 | **72** | **+72** |
| 91 | 54 | 54 | +0 |
| 96 | 72 | 72 | +0 |
| 1, 93, 94, 97, 101–106, 108–114 | inchangées | inchangées | +0 |

**Seule la sourate 87 a changé.** Aucune autre sourate ne présente de delta.

## G. Idempotence

Deux relances en APPLY après l'import initial — chacune :

```
Sourate 87 : INSERTED=0 DUPLICATES=72 ERRORS=0 SEGMENTS=0
```

Les 72 occurrences sont détectées comme doublons (clé idempotence
source_id + source_record_id) ; compteurs stables à 611 / 1 188. **0 duplication.**

## H. Vérification runtime

`getWordLinguisticEvidence()` (chemin réel du moteur) :

| Sourate | word_ids | Évidences MASAQ | Couverture |
|---|---:|---:|---|
| 87 | 69 | **69** | 69/69 (72/72 occurrences) |
| 91 | 48 | 48 | 48/48 (54/54) |
| 96 | 59 | 59 | 59/59 (72/72) |

Représentativité vérifiée (début / milieu / fin, EXACT / ORTHO / VARIANT) :
- 87:1:1, 87:5:1 (EXACT) → évidence rattachée ;
- 87:15:3 (`رَبِّهِۦ`, A′) → évidence rattachée par (87,15,3), stem `رب` ;
- 87:16:3 (`ٱلْحَيَوٰةَ`, B2) → évidence rattachée par (87,16,3), stem `حيا` ;
- 87:19:1 (VARIANT) → évidence rattachée.

Rattachement par `(surah_number, ayah_number, position)` — jamais par texte
normalisé seul.

## I. Vérification des deux variantes critiques

| Cas | Hikma | MASAQ | Classification | Règle | Évidence runtime |
|---|---|---|---|---|---|
| 87:15:3 | `رَبِّهِۦ` | `رَبِّهِ` | alignement accepté (ORTHOGRAPHIC) | **A′** | ✅ stem `رب` |
| 87:16:3 | `ٱلْحَيَوٰةَ` | `ٱلْحَيَاةَ` | alignement accepté (ORTHOGRAPHIC) | **B2** | ✅ stem `حيا` |

Plus aucun AMBIGUOUS. Les deux word_occurrence_id correspondent à
l'occurrence MASAQ créée (masaqOccurrences = 1 pour chacun).

## J. Vérification word_id / position

- Les 72 occurrences importées appartiennent toutes à la sourate 87
  (périmètre assertPlanScope : min=max=87) ;
- aucun word_id partagé n'a créé d'occurrence dans une autre sourate
  (matrice de propagation : delta 0 partout sauf 87) ;
- aucune occurrence existante de 91/96 modifiée (delta 0, segments inchangés) ;
- MASAQ reste aligné par occurrence : un word_id partagé n'implique aucune
  couverture MASAQ automatique ailleurs.

## K. Vérification des tables modifiées

Delta vs baseline (toutes tables contrôlées) :

| Table | Δ |
|---|---|
| linguistic_occurrences | +72 ✅ (autorisé) |
| linguistic_segments | +137 ✅ (autorisé) |
| quran_words / word_occurrences / ayahs / translations / word_translations / lemmas / lemma_translations / word_lemma_mapping / word_explanations / word_explanation_contexts / learning_paths / units / lessons / lesson_words / sources | 0 ✅ |
| review_items / user_word_progress / lesson_progress | 0 ✅ |

Aucune modification hors périmètre.

## L. Vérification catalogue

- 24 parcours, 1 REFERENCE, 23 READY, 0 IN_PREPARATION (inchangé) ;
- readiness 87 / 91 / 96 = READY / READY / READY (inchangée) ;
- aucune sourate n'est devenue READY à cause de MASAQ (couche passive).

## M. Non-régression technique

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **753/753** (aucun test modifié/supprimé) |
| `npm run build` | ✅ Compilé |

## N. Conclusion

La sourate 87 dispose maintenant de l'intégralité de sa couche MASAQ
(72 occurrences / 137 segments), rattachée correctement par occurrence, avec
les deux variantes orthographiques documentées (Phases 64/65) résolues. Les
trois sourates récemment débloquées sont désormais couvertes en cumulé :
**198 occurrences MASAQ / 392 segments** (91 : 54/116 · 87 : 72/137 ·
96 : 72/139).

## Verdict

**`PHASE_66_MASAQ_87_IMPORT_COMPLETE`**

✓ 72/72 occurrences importées ✓ 137 segments importés ✓ 0 MISSING ✓ 0 EXTRA
✓ 0 AMBIGUOUS ✓ 0 duplication ✓ re-APPLY = 0 écriture ✓ runtime 87 = 72/72
✓ 91 inchangée ✓ 96 inchangée ✓ aucune propagation incorrecte
✓ aucune table hors MASAQ modifiée ✓ catalogue inchangé ✓ 753/753 tests
✓ tsc/eslint/build verts ✓ rapport complet.

**STOP.** Aucune Phase 67 lancée automatiquement. Aucune phase d'explications
lancée. Aucun commit. Aucun push.

---

### Artefacts
- `tmp/phase66-baseline.ts` / `.json` — état avant import
- `tmp/phase66-write-result.json` — rapport officiel du mécanisme d'import
- `tmp/phase66-verify.ts` / `.json` — vérification post-import complète
