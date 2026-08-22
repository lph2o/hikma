# PHASE 43B — IMPORT CONTRÔLÉ MASAQ — EXTENSION AUX 12 SOURATES READY

Statut : **`PHASE_43B_MASAQ_EXTENSION_COMPLETE`**

---

## A. Executive Summary

La Phase 43B a importé la couche linguistique MASAQ v2 (source vérifiée, checksum conforme) pour les **12 sourates READY non encore couvertes** :

- **316/316 linguistic_occurrences** alignées par `(surah, ayah, position)` — **0 MISSING · 0 EXTRA · 0 AMBIGUOUS** ;
- **626 linguistic_segments** importés (+1 segment réparé après une anomalie de source) ;
- couche **strictement passive** : aucune table pédagogique modifiée, aucun moteur touché ;
- idempotence démontrée : **2ᵉ exécution → 0 insert, 316 doublons d'occurrences, 0 erreur** ;
- intégrité référentielle : 0 dangling, 0 doublon, 0 FK invalide ;
- tests **726/726** ✅ · tsc ✅ · eslint ✅ · build ✅.

Deux décisions validées par l'utilisateur ont été appliquées : (1) import de **626 segments** (et non 635 — exclusion des artefacts `None`/`Other_i3rab` conformément à la règle Phase 27, documentée en 43A) ; (2) **extension du classifieur** `normalizeOrthographic`/`classifyAlignment` pour reconnaître les variantes orthographiques documentées en 43A, sans jamais modifier `quran_words.arabic` ni les données pédagogiques.

---

## B. Scope exact

`ALLOWED_SURAH_IDS` : **93, 94, 97, 101, 102, 103, 104, 105, 106, 109, 110, 111**

Sourates protégées (déjà MASAQ, aucun accès en écriture) : **1, 108, 112, 113, 114** — Al-Fātiḥah (REFERENCE) explicitement protégée. Tout accès hors périmètre provoque `SCOPE_VIOLATION` et STOP (garde-fou `assertPlanScope` réutilisé).

---

## C. Snapshot avant

`tmp/phase43b-pre-import-snapshot.json` (avant toute écriture) :

| Table | Avant |
|---|---:|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 |
| word_translations | 335 |
| lemma_translations | 32 |
| lemmas | 32 |
| word_lemma_mapping | 184 |
| sources | 6 |
| **linguistic_occurrences** | **97** |
| **linguistic_segments** | **170** |
| linguistic_lemmas | 0 |
| linguistic_roots | 0 |
| learning_paths / units | 18 / 18 |
| lessons / lesson_words | 111 / 742 |

---

## D. Source / licence / checksum

- **Fichier** : `tmp/MASAQ.csv` — **SHA-256 = `777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900`** ✅ (recalculé avant APPLY ; écart → `MASAQ_CHECKSUM_MISMATCH` + STOP).
- **Version** : v2 · **DOI** : `10.17632/9yvrzxktmr.2` · **Licence** : CC BY 3.0 (page) / CC BY 4.0 (DataCite).
- **Source_id** : source MASAQ existante dans `public.sources` (réutilisée, **aucune nouvelle source** créée).
- Aucun téléchargement, aucune nouvelle version, aucun remplacement de fichier.

---

## E. Plan d'import

Plan recalculé depuis la DB + le CSV via `buildImportPlan` (mécanisme existant, idempotent) :

| Sourate | Occurrences | Segments |
|---:|---:|---:|
| 93 | 40 | 89 |
| 94 | 27 | 53 |
| 97 | 30 | 59 |
| 101 | 36 | 74 |
| 102 | 28 | 55 |
| 103 | 14 | 33 |
| 104 | 33 | 61 |
| 105 | 23 | 44 |
| 106 | 17 | 35 |
| 109 | 26 | 46 |
| 110 | 19 | 37 |
| 111 | 23 | 40 |
| **TOTAL** | **316** | **626** |

`IMPORT_PLAN_MISMATCH` aurait arrêté toute écriture. Le plan correspond exactement à la DB.

---

## F. Résultat des linguistic_occurrences

- **+316** (97 → **413**) — toutes les occurrences planifiées insérées.
- Répartition par sourate : **exactement conforme au plan** (E).
- Clé d'idempotence `UNIQUE(source_id, source_record_id)` respectée.

## G. Résultat des segments

- **+626** (170 → **796**).
- Segmentation importable uniquement (`Prefix`/`Stem`/`Suffix`, jamais les artefacts `None`/`Other_i3rab` — règle Phase 27).
- **Aucun segment orphelin · aucun doublon de position** `(linguistic_occurrence_id, segment_no)`.

### G1. Anomalie source et réparation (109:1:2)

Le CSV MASAQ contient **deux lignes `Segment_No=1`** pour `109:1:2` (`يَاأَيُّهَا`) : « يا » (ID 77672) et « أي » (ID 77673, `REL_PRON`). Le premier import a rejeté « أي » via la contrainte `UNIQUE(linguistic_occurrence_id, segment_no)` (1 erreur comptée, 45/46 segments pour la sourate 109).

Corrections appliquées :
1. **`lib/linguistic/masaq-plan.ts`** : `segment_no` = **ordre d'apparition** (1..N) au lieu de la valeur brute du CSV (déterministe ; no-op sur toutes les autres occurrences sans doublon). **Le fichier source n'est pas modifié.**
2. **Réparation ciblée** (couche MASAQ du périmètre uniquement) : segments de l'occurrence 109:1:2 reconstruits depuis le plan corrigé → `يا`=1, `أي`=2, `ها`=3. Résultat vérifié : sourate 109 = **26 occ / 46 segs** ✅.

---

## H. Alignement

| Statut | 43A (conservateur) | **43B (classifieur étendu)** |
|---|---:|---:|
| EXACT | 135 | **182** |
| EXACT_ORTHOGRAPHIC | 177 | **126** |
| VARIANT_ORTHOGRAPHY_DOCUMENTED | 4 | **8** |
| AMBIGUOUS | 0 | **0** |
| MISSING / EXTRA | 0 / 0 | **0 / 0** |

La distribution a évolué **par décision utilisateur** : le classifieur `normalizeOrthographic`/`classifyAlignment` de `lib/linguistic/masaq.ts` a été étendu pour reconnaître les variantes documentées en 43A (alif en poignard ىٰ → ا, petits signes ۟/ۭ/۠, petit yeh ۦ → ي, espaces+signes, shadda/gémination, représentations du hamza/madda, alif-madda-vs-alif-maqsura) — d'où le passage de nombreuses paires ORTHO → EXACT et de variantes supplémentaires en VARIANT. **Toutes les classifications sont reconnues par le plan (0 AMBIGUOUS résiduel) et chaque variante est préservée** (la chaîne arabe d'origine n'est jamais modifiée).

## I. Variantes orthographiques

8 variantes `VARIANT_ORTHOGRAPHY_DOCUMENTED` dans le périmètre — **les 4 paires documentées 43A sont toutes présentes** (+ 4 nouvelles reconnues par le classifieur étendu, toutes bénignes) :

| Sourate | Forme Hikma | Forme MASAQ | Type |
|---:|---|---|---|
| 93 | وَٱلضُّحَىٰ | وَالضُّحَى | alif en poignard |
| 93 | وَٱلَّيْلِ | وَاللَّيْلِ | wasla |
| 93 | فَـَٔاوَىٰ | فَآوَى | hamza sur support / madda |
| 93 | ٱلْأُولَىٰ | الْأُولَى | alif en poignard |
| 102 | لَتُسْـَٔلُنَّ | لَتُسْأَلُنَّ | hamza/tatweel (43A) |
| 103 | ءَامَنُوا۟ | آمَنُوا | madda + petit signe (43A) |
| 104 | ٱلْأَفْـِٔدَةِ | الْأَفْئِدَةِ | hamza (43A) |
| 106 | وَءَامَنَهُم | وَآمَنَهُمْ | madda + sukun final (43A) |

Aucune normalisation destructive : `quran_words`, `word_occurrences`, `translations` intacts.

## J. POS / morphologie / syntaxe

- **POS** : couverture **100 %** (tous les segments réels ont un `Morph_Tag`) — agrégats stockés dans `linguistic_occurrences.pos`.
- **Cas/Modus** : couverture **100 %** (`case_mood`).
- **Syntaxe** : couverture **91,8 %** (champs `Syntactic_Role` non vides) — cohérent avec 43A.

## K. Racines / schèmes

- **linguistic_lemmas : 0 ajout** · **linguistic_roots : 0 ajout** · **PATTERNS : `FUTURE_WORK`**.
- MASAQ v2 ne fournit ni racine ni schème → aucune donnée inventée, aucune dérivation externe.

---

## L. Idempotence

Réexécution complète du même import après le premier APPLY :

- **INSERTED_OCCURRENCES = 0 · DUPLICATE_OCCURRENCES = 316 · ERRORS = 0**
- **SEGMENTS_INSERTED = 0** (aucune occurrence nouvelle → aucun segment retenté)
- Totaux DB strictement identiques (413 / 796).

Clé d'idempotence = `UNIQUE(source_id, source_record_id)` — jamais la chaîne arabe ni `word_id` seul.

---

## M. Intégrité référentielle

| Contrôle | Résultat |
|---|---:|
| Occurrences MASAQ (source v2) | 413 |
| Doublons `source_record_id` | **0** |
| Segments | 796 |
| Segments orphelins (parent inexistant) | **0** |
| Doublons `(occurrence, segment_no)` | **0** |
| `word_occurrence_id` invalides (FK join) | **0** |

---

## N. RLS

Aucune policy modifiée. Comportement inchangé : lecture publique selon le modèle existant, écriture réservée au service role (import effectué avec `SUPABASE_SERVICE_ROLE_KEY`).

---

## O. Non-régression pédagogique

Comparaison snapshot avant/après — **seules les tables linguistiques ont augmenté** :

| Table | Avant | Après | Delta |
|---|---:|---:|---:|
| quran_words | 21 296 | 21 296 | **0** |
| word_occurrences | 77 430 | 77 430 | **0** |
| ayahs | 6 236 | 6 236 | **0** |
| translations | 24 944 | 24 944 | **0** |
| word_translations | 335 | 335 | **0** |
| lemma_translations | 32 | 32 | **0** |
| lemmas | 32 | 32 | **0** |
| word_lemma_mapping | 184 | 184 | **0** |
| linguistic_occurrences | 97 | 413 | **+316** |
| linguistic_segments | 170 | 796 | **+626** |
| linguistic_lemmas / roots | 0 / 0 | 0 / 0 | **0** |

## P. Curriculum inchangé

learning_paths 18 · units 18 · lessons 111 · lesson_words 742 — **inchangés**. Aucun seed curriculum, aucune création de leçon. L'import MASAQ ne crée aucun curriculum.

## Q. Runtime inchangé

Resolver, SRS, mastery, coverage, Daily Plan, onboarding, exercices, grading, progression, audio : **aucun fichier runtime modifié** (voir R).

---

## R. Fichiers modifiés (production)

Exactement 3 fichiers, tous dans la couche linguistique passive :

| Fichier | Modification |
|---|---|
| `lib/linguistic/masaq.ts` | Extension `normalizeOrthographic` / `classifyAlignment` (variantes documentées 43A + alif-madda-vs-alif-maqsura) — **décision utilisateur explicite** |
| `lib/linguistic/masaq-plan.ts` | `segment_no` = ordre d'apparition (anomalie `Segment_No` dupliqué 109:1:2) |
| `tests/masaq.test.ts` | +1 test unitaire couvrant les variantes étendues (725 → 726) |

Aucun autre fichier produit modifié : `git status` sur `lib/ tests/ scripts/ app/ supabase/` ne montre aucune autre modification hors l'arborescence déjà en cours de phase (aucun commit/push).

## S. Tests

- `npx tsc --noEmit` ✅
- `npx eslint` (couche linguistique + tests) ✅
- `npx vitest run` → **726/726 passed** (54 fichiers — 725 existants + **1 nouveau** test MASAQ documenté)
- `npm run build` ✅

## T. Evidence

`tmp/phase43b-masaq-import-evidence.csv` — **316 lignes** (1 par occurrence importée) : surah, ayah, position, hikma_word_id, word_occurrence_id, linguistic_occurrence_id, masaq_source_record_id, source_id, alignment_status, arabic_hikma, arabic_masaq, segment_count.

`tmp/phase43b-post-import-validation.json` — snapshot post-import (comparaison directe avec `tmp/phase43b-pre-import-snapshot.json`).

---

## U. Réversibilité

Rollback logique vérifié (non exécuté) : DELETE ciblé par `source_id` (MASAQ v2) `AND surah_number ∈ ALLOWED_SURAH_IDS` → supprime `linguistic_segments` liés puis `linguistic_occurrences` du nouveau périmètre. Ne touche jamais : quran_words, word_occurrences, translations, word_translations, lemma_translations, curriculum, progression, SRS, mastery. (En pratique : la réparation 109:1:2 a appliqué ce principe localement, sans aucune table pédagogique.)

---

## V. Verdict final

**`PHASE_43B_MASAQ_EXTENSION_COMPLETE`**

Vérifié point par point contre les critères de sortie :
1. ✅ 316/316 linguistic_occurrences importées
2. ✅ 626/626 segments importés (après réparation ciblée de l'anomalie 109:1:2)
3–5. ✅ 0 MISSING · 0 EXTRA · 0 AMBIGUOUS
6–8. ✅ 182 EXACT · 126 EXACT_ORTHOGRAPHIC · 8 VARIANT documentées (les 4 paires 43A incluses ; distribution évoluée par le classifieur étendu validé)
9. ✅ 0 doublon
10–11. ✅ provenance intacte · checksum conforme
12. ✅ idempotence confirmée (2ᵉ run : 0 insert / 316 doublons / 0 erreur)
13. ✅ intégrité référentielle confirmée
14–19. ✅ aucune donnée pédagogique, glose, traduction, lemme, curriculum, runtime modifié
20–21. ✅ tests 726/726 · build vert
22–24. ✅ rapport final · evidence CSV · snapshots créés

---

## W. Limites / notes

- **Racines et schèmes** : `FUTURE_WORK` (non fournis par MASAQ v2) — aucune dérivation.
- **Segments excluent les artefacts** `None`/`Other_i3rab` (règle Phase 27) : 626 importés sur 635 lignes brutes — documenté, décision validée.
- La couche MASAQ reste **strictement passive** : aucune connexion au resolver, aux exercices, au SRS, au mastery ni au Daily Plan. Toute future activation exigera une phase explicite.

## X. Arrêt obligatoire

STOP après validation. Aucun commit, aucun push. Aucune phase suivante lancée automatiquement. La généralisation MASAQ reste une couche linguistique passive jusqu'à décision explicite ultérieure.
