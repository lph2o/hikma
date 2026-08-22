# PHASE 63 — IMPORT MASAQ 91 + 96, 87 DIFFÉRÉ — RAPPORT

**Verdict : `PHASE_63_MASAQ_91_96_IMPORT_COMPLETE`**

Import MASAQ des sourates **91 (Ash-Shams)** et **96 (Al-ʿAlaq)** via le mécanisme
existant — **87 (Al-Aʿlā) explicitement exclu** du plan d'écriture, conformément à la
décision post-Phase 62. Aucun garde-fou contourné, aucun classifieur modifié.

---

## A. Baseline (avant écriture — tmp/phase63-baseline.json)

| Compteur | Avant | Compteur | Avant |
|---|---:|---|---:|
| quran_words | 21 296 | linguistic_occurrences | **413** |
| word_occurrences | 77 430 | linguistic_segments | **796** |
| translations | 24 944 | word_explanations / contexts | 13 / 1 |
| word_translations FR validées | 538 | learning_paths / units | 24 / 24 |
| lemmas / lemma_translations | 32 / 32 | lessons / lesson_words | 191 / 1 307 |
| word_lemma_mapping | 184 | sources | 6 |

**Readiness :** 91 READY (48 formes, 100 % FR) · 87 READY (69 formes, 100 % FR) ·
96 READY (59 formes, 100 % FR).
**Catalogue :** 24 parcours — 1 REFERENCE + 23 READY.
**MASAQ scope :** 17 sourates (1, 93, 94, 97, 101–106, 108–114) — 91/87/96 absents.
Conforme aux Phases 61/62 — aucune divergence.

## B. Plan DRY-RUN (SURAH=91,96 — 87 absent)

| Sourate | Hikma | Alignées | EXACT | ORTHO | VARIANT | AMBIGUOUS | MISSING | EXTRA | Segments |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **91** | 54 | **54/54** | 28 | 25 | 1 | **0** | 0 | 0 | 116 |
| **96** | 72 | **72/72** | 43 | 21 | 8 | **0** | 0 | 0 | 139 |
| 87 | — | **EXCLUDED** | — | — | — | — | — | — | — |

`assertPlanScope` : **actif et satisfait** (0 MISSING / 0 EXTRA / 0 AMBIGUOUS).
DRY-RUN concluant : aucune écriture.

## C. Écriture (APPLY=1, SURAH=91,96)

| Sourate | Occurrences insérées | Segments insérés | Doublons | Erreurs |
|---|---:|---:|---:|---:|
| 91 | **54** | **116** | 0 | 0 |
| 96 | **72** | **139** | 0 | 0 |
| **Total** | **126** | **255** | 0 | 0 |

Aucune autre table fonctionnelle modifiée. Les 2 occurrences bloquantes de 87
(`رَبِّهِۦ` 87:15:3, `ٱلْحَيَوٰةَ` 87:16:3) **ne sont pas dans le plan** et n'ont pas
été reclassées.

## D. Idempotence (2ᵉ exécution)

| Sourate | 2ᵉ exécution — insérées | Doublons détectés |
|---|---:|---:|
| 91 | **0** | 54 |
| 96 | **0** | 72 |

Compteurs stables après ré-exécution (539 occurrences / 1 051 segments) — idempotence
démontrée via `UNIQUE(source_id, source_record_id)`.

## E. Couverture post-import

| Sourate | Occurrences | Segments | Ayahs couverts | Couverture |
|---|---:|---:|---:|---:|
| **91** | 54 | 116 | **15/15** | 100 % |
| **96** | 72 | 139 | **19/19** | 100 % |
| **87** | **0** | **0** | 0/19 | 0 % (inchangé — voulu) |

## F. Propagation / effets de bord (tmp/phase63-propagation.json)

| Sourate | Avant | Après | Delta |
|---|---:|---:|---:|
| 87 | 0 | 0 | **0** ✅ |
| 91 | 0 | 54 | +54 |
| 96 | 0 | 72 | +72 |
| 1, 93–114 (autres) | — | — | **0** (toutes inchangées) |

Aucune occurrence de 87 créée, aucune occurrence hors 91/96 créée, aucune autre
sourate modifiée. Le runtime filtre par `surah_number` — pas de faux rattachement
des word_id partagés.

## G. Vérification runtime (getWordLinguisticEvidence)

| Sourate | word_ids testés | évidences retournées | Résultat |
|---|---:|---:|---|
| **91** | 48 | **48** | MASAQ disponible ✅ |
| **96** | 59 | **59** | MASAQ disponible ✅ |
| **87** | 69 | **0** | `ABSENT_DATA` valide ✅ (aucune erreur, aucun fallback inventé, aucune donnée extrapolée d'une autre sourate) |

Échantillons vérifiés : 91:1-2 (serments, POS CONJ/DET…), 96:1 (`CV_PREF`/`CV` pour
`ٱقْرَأْ`, `PREP`/`NOUN_ABSTRACT` pour `بِٱسْمِ`, `NOUN_CONCRETE`/`POSS_PRON` pour
`رَبِّكَ`).

## H. 87 — confirmation explicite

```
87 → NOT IMPORTED ✅
```
- delta MASAQ 87 : **0** (0 avant → 0 après) ;
- `رَبِّهِۦ` (87:15:3) et `ٱلْحَيَوٰةَ` (87:16:3) : **non importées, non reclassées** ;
- `normalizeOrthographic`, `classifyAlignment`, `assertPlanScope` : **non modifiés** ;
- le traitement des 2 variantes orthographiques reste **reporté** à une phase dédiée.

## I. Compteurs avant / après

| Compteur | Avant | Après | Delta |
|---|---:|---:|---:|
| linguistic_occurrences | 413 | **539** | **+126** ✅ (54 + 72) |
| linguistic_segments | 796 | **1 051** | **+255** ✅ (116 + 139) |
| quran_words / word_occurrences / translations | 21 296 / 77 430 / 24 944 | identiques | 0 |
| word_translations FR validées | 538 | 538 | 0 |
| lemmas / lemma_translations / word_lemma_mapping | 32 / 32 / 184 | identiques | 0 |
| word_explanations / contexts | 13 / 1 | identiques | 0 |
| learning_paths / units / lessons / lesson_words | 24 / 24 / 191 / 1 307 | identiques | 0 |
| sources | 6 | 6 | 0 |

Deltas conformes aux attentes calculées (413 → +126, 796 → +255) — mesurés en DB, jamais forcés.

## J. Tests

- `npx tsc --noEmit` → **0 erreur** ✅
- `npx eslint .` → **0 erreur** ✅
- `npx vitest run` → **743/743** ✅ (identique à la baseline — aucun test modifié)
- `npm run build` → **OK** ✅
- `getSurahCatalog()` → 24 parcours, 1 REFERENCE + 23 READY, 91/87/96 READY — **aucune modification de readiness** provoquée par MASAQ (couche passive) ✅

## K. Verdict

**`PHASE_63_MASAQ_91_96_IMPORT_COMPLETE`**

- 91 : 54/54 occurrences, 116 segments, 15/15 ayahs — MASAQ disponible au runtime ;
- 96 : 72/72 occurrences, 139 segments, 19/19 ayahs — MASAQ disponible au runtime ;
- 87 : **NOT IMPORTED**, delta 0, protection vérifiée ;
- 126 occurrences + 255 segments insérés (413 → 539, 796 → 1 051) — seules tables modifiées :
  `linguistic_occurrences` + `linguistic_segments` ;
- aucune explication rédigée, aucun curriculum modifié, aucune autre sourate touchée ;
- idempotence démontrée (2ᵉ exécution : 0 insertion) ;
- non-régression complète (tsc / eslint / vitest 743 / build) ;
- **aucun fichier de production modifié, aucun commit, aucun push.**

**STOP — aucune Phase 64 lancée automatiquement.** La décision sur 87 et ses 2 variantes
orthographiques (`رَبِّهِۦ`, `ٱلْحَيَوٰةَ`) devra être prise séparément, après analyse dédiée
du classifieur.
