# PHASE 24F — LINGUISTIC SCHEMA DESIGN + ISOLATED AL-FĀTIḤAH IMPORT PILOT

**STATUT : DESIGN + DRY-RUN TERMINÉS** · Migration **préparée mais NON appliquée** (approbation humaine requise pour l'import).

---

## DÉCISION FINALE

### `A — READY_FOR_ISOLATED_LINGUISTIC_IMPORT`

Le schéma de la couche linguistique est cohérent, MASAQ y est correctement représenté, les **29/29 occurrences** Al-Fātiḥah sont alignées avec 0 missing / 0 extra / 0 ambiguous, aucune donnée existante n'a été modifiée. **L'application de la migration et l'import ne sont PAS exécutés dans cette phase** — la Phase 24G (sur décision humaine) appliquera `0028_linguistic_layer.sql` puis importera uniquement Al-Fātiḥah.

---

## A — ÉTAT INITIAL (vérifié read-only, inchangé)

| Table | Compte |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 |
| lemmas | 32 |
| word_translations | 70 |
| lemma_translations | 32 (28 FR validées) |
| word_lemma_mapping | 184 |

Al-Fātiḥah : 8 leçons · 26 formes · 29 occurrences · 26/26 audio · FATIHAH_REFERENCE_LOCKED = TRUE.

## 2. SOURCE MASAQ (pas de retéléchargement)

- `tmp/MASAQ.csv` (vérifié Phase 24D) — SHA-256 `777d0cc8…a900` — 19 colonnes.
- Licence : CC BY (3.0 page / 4.0 registre) → `SAFE_WITH_ATTRIBUTION`.
- Attribution conservée : « MASAQ — Majdi Sawalha, University of Jordan (2024), Mendeley Data, DOI 10.17632/9yvrzxktmr.2 ».

## 3. ARCHITECTURE CIBLE

```
sources (0001, existante — MASAQ y sera une ligne type 'linguistic')
   │
quran_words (identité lexicale)          ← INCHANGÉE
   │
word_occurrences (occurrence réelle)     ← INCHANGÉE
   │
linguistic_occurrences (1:1 par occurrence × source)
   ├── linguistic_segments (préfixe/stem/suffixe)
   ├── linguistic_lemmas (futur — vide)
   └── linguistic_roots (futur — vide)
```

**Aucune duplication de quran_words** : chaque ligne linguistique référence `word_occurrence_id`.

## 4. TABLES RETENUES (migration `0028_linguistic_layer.sql` — préparée, PAS appliquée)

### linguistic_occurrences
| Colonne | Type | Contrainte |
|---|---|---|
| id | uuid PK | |
| word_occurrence_id | uuid NOT NULL FK → word_occurrences | cascade |
| source_id | uuid NOT NULL FK → sources | |
| source_record_id | text NOT NULL | **UNIQUE (source_id, source_record_id)** — idempotence |
| surah_number / ayah_number / position | int NOT NULL | **UNIQUE (source_id, surah, ayah, position)** |
| alignment_status | text CHECK | EXACT/EXACT_ORTHOGRAPHIC/VARIANT_ORTHOGRAPHY_DOCUMENTED/AMBIGUOUS |
| masaq_word / masaq_stem | text | |
| masaq_gloss_en | text | évidence, jamais glose FR |
| hikma_lemma_id | uuid FK → lemmas | set null |
| lemma_mapping_status | text CHECK | EXACT/PARTIAL/NORMALIZATION_DIFFERENCE/LEXICAL_LEVEL_DIFFERENCE/UNMAPPED/AMBIGUOUS |
| pos / case_mood / syntactic_roles | text[] | |

**UNIQUE (word_occurrence_id, source_id)** — 1 analyse par occurrence et par source.

RLS : select public ; aucune policy d'écriture (service role uniquement).

### linguistic_segments
`linguistic_occurrence_id FK` (cascade) + `segment_no` (**UNIQUE pair**) + segment_text + morph_type (Prefix/Stem/Suffix) + morph_tag + segment_kind (ARTICLE/PARTICLE/STEM/INFLECTIONAL_SUFFIX/PRONOMINAL_SUFFIX/OTHER).

### linguistic_lemmas / linguistic_roots (futur, VIDES en 24F)
Architecture de provenance posée (source_id, confidence safe/review_required/rejected, source_record_id, evidence) ; racines uniquement reliées au lemme, jamais à une forme de surface. AUCUNE racine/schème importée.

## 5. PROVENANCE & LICENCE

- `linguistic_occurrences` : provenance de chaque ligne par `source_id` → `sources` (MASAQ : nom, v2, DOI, licence, attribution, checksum).
- Le registre `sources` est réutilisé — **pas de table nouvelle** pour la provenance.

## 6. STRATÉGIE D'ALIGNEMENT

Par `(surah, ayah, position)` — jamais par chaîne arabe seule. Statuts complets :

| Statut | Nb |
|---|---|
| EXACT | 13 |
| EXACT_ORTHOGRAPHIC (normalisation) | 14 |
| VARIANT_ORTHOGRAPHY_DOCUMENTED (alif élidé) | 2 |
| MISSING / EXTRA / AMBIGUOUS | **0 / 0 / 0** |

## 7. STRATÉGIE D'IDEMPOTENCE

`UNIQUE (source_id, source_record_id)` — la clé est la provenance + l'identifiant de ligne MASAQ. RUN 2 → 0 doublon garanti par contrainte (testé au niveau unitaire : `idempotencyKey`).

## 8. MAPPING MASAQ (documenté, aucun mapping créé)

| Hikma | MASAQ | Status (29 occ) |
|---|---|---|
| 2 | 2 | EXACT |
| 4 | 4 | PARTIAL (article retiré) |
| 3 (الله/له, لله/له, بسم/اسم) | 3 | NORMALIZATION_DIFFERENCE |
| 2 (الرَّحْمَٰـن/رحمن) | 2 | LEXICAL_LEVEL_DIFFERENCE |
| 18 sans lemme Hikma | 18 | UNMAPPED (stem MASAQ disponible pour TOUT) |
| — | 0 | AMBIGUOUS |

## 9. SEGMENTATION / CLITIQUES

Segments conservés avec catégorie stricte (`classifySegment`) : `ب`(PARTICLE), `ال`(ARTICLE), `نَا`(PRONOMINAL_SUFFIX), `ين`(INFLECTIONAL_SUFFIX), `صل`(STEM). **Jamais** de transformation d'une particule en mot lexical.

## 10. MORPHOLOGIE / SYNTAXE / GLOSS

- Disponible : POS (22 tags), cas/mode (4), invariabilité, état construit, syntactique (SUBJ/OBJ/PREP/ADJ/APPOS/GEN_CONS…), gloss EN.
- Non disponible : genre/voix/personne structurelles.

## 11. RACINES / SCHÈMES

- **Racine : AUCUNE donnée MASAQ** — `linguistic_roots` créé vide ; importation future (Kazimirski/Lane, domaine public) après audit.
- **Schème/pattern : ABSENT** — aucune colonne ; ajout du champ `pattern` quand une source fiable existera.
- Aucune racine ni schème inventés.

## 12. RUNTIME / HIKMAEXPLANATION

- Aucun code runtime modifié : `resolveWordMeanings`, feedback, grading, SRS, mastery restent sur FORME → LEMME → EN fallback.
- La couche est READABLE mais non consommée par le grading (cette phase crée la fondation).
- HikmaExplanation v2 lira la couche via API dédiée, uniquement les niveaux AVAILABLE — ABSENT_DATA sinon.

## 13. TESTS

| Check | Résultat |
|---|---|
| `npm test` | **472 passed / 39 files** (456 existants + 16 nouveaux) |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **clean** |
| `npm run build` | **PASS** |

## 14. NON-RÉGRESSION (mesurée par le dry-run)

Tous les compteurs (cf. §1) sont strictement identiques avant/après le dry-run (qui n'écrit rien). DRY-RUN: `tmp/phase24f-fatihah-linguistic-dry-run.json`.

## 15. RÉPONSES §26 (13 questions)

1. Schéma correct ? **OUI** — 4 tables isolées, additive, réversible, provenance obligatoire.
2. MASAQ isolé ? **OUI** — aucun contact avec le lexique pédagogique.
3. 29/29 alignées ? **OUI**.
4. Info MASAQ dispo : stem, segmentation, POS, morphologie (cas/mode/invariabilité/état construit), syntaxe, gloss EN.
5. Info NON dispo : racine, schème/pattern, lemme explicite, genre/voix/personne structurées.
6. Lemmes Hikma/MASAQ reliables auto ? **PARTIELLEMENT** — 2 EXACT + classification documentée ; AUCUN mapping auto ; `lemma_mapping_status` par occurrence.
7. Clitiques ? Segments classifiés (ARTICLE/PARTICLE/PRONOMINAL/INFLEXIV) — jamais de mot lexical.
8. Racines futures ? `linguistic_roots` vide, source Kazimirski/Lane (domaine public), rattachées au lemme.
9. Schèmes futurs ? ajout du champ `pattern` quand une source fiable.
10. HikmaExplanation v2 ? lecture via API, niveaux AVAILABLE uniquement.
11. Gloses inchangées ? **OUI** (70/32).
12. Al-Fātiḥah identique ? **OUI** (8/26/29/26).
13. Prochaine phase ? **24G déterminée par l'humain** : appliquer migration + import pilote Al-Fātiḥah + tests.

## 15. ORDRE D'EXÉCUTION SUIVI

1. Schéma actuel inspecté → 2. CSV MASAQ réel inspecté (19 col.) → 3. Migrations inspectées → 4. Schéma proposé → 5. **DRY-RUN (écritures = 0)** → 6. Alignement 29/29 vérifié → 7. Contraintes vérifiées → 8. Résultat présenté → 9. Migration **préparée** → 10. **NON appliquée** (approbation humaine).

## 16. REVUES FINALES

```
FATIHAH_REFERENCE_LOCKED = PRESERVED (TRUE)
DATABASE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0 (non appliquée) · SEEDS = 0
PRODUCTION_CODE_CHANGES = 0 (module pur nouveau lib/linguistic/masaq.ts : hors runtime)

Aucune donnée MASAQ importée.
Aucune racine / schème inventée.
Aucun mapping ambigu créé.
```

**FIN PHASE 24F**