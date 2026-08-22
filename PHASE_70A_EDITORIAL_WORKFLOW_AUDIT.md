# PHASE 70A — AUDIT READ-ONLY DU WORKFLOW ÉDITORIAL DES GLOSES HIKMA

**STATUT : READ_ONLY · DATABASE_WRITES = 0 · IMPORTS = 0 · VALIDATIONS = 0 · MIGRATIONS = 0 · SEEDS = 0**
**DÉCISION : `READY_FOR_EDITORIAL_PILOT`**

---

## 0. CONTEXTE

La Phase 68B a terminé l'import MASAQ (`B01–B11 = VERIFIED`, 22 485 occurrences / 44 677 segments).
La Phase 69 a statué `READY_FOR_EDITORIAL_WORKFLOW` (audit READ-ONLY, 0 écriture).

Cette Phase 70A reconstruit **depuis le code et les données live** (jamais par supposition) le
workflow éditorial réel qui a produit les gloses Hikma d'Al-Fātiḥah et des pilotes, afin de
déterminer précisément ce qui existe, ce qui manque, et comment démarrer le pilote éditorial.

**Aucune écriture DB n'a eu lieu pendant cette phase.**

---

## 1. VÉRIFICATION LIVE READ-ONLY (Phase 70A)

Script : `tmp/phase70a-verify.ts` (lecture seule, aucune écriture).

| Élément | Valeur réelle (live) |
|---|---|
| Sources | 6 : `Hikma — lexique éditorial` (editorial, v1) · `Hugging Face — Quranic Word By Word Audio Data` (word_audio) · `Kazimirski — Dictionnaire arabe-français (1860)` (historical_dictionary) · `Kazimirski — Le Koran (1869)` (quran_translation) · `MASAQ` (linguistic, v2) · `Quran.com API v4` (api) |
| Traductions par resource | **31 → 6 236** (Hamidullah FR) · **9001 → 6 236** (Kazimirski 1869 FR) · **20 → 6 236** (Sahih International EN) · **153 → 6 236** (Piccardo IT) — les 4 sources couvrent l'intégralité des 6 236 ayahs |
| `word_translations` (fr) | **538 total = 538 validées · 0 proposée** |
| `lemma_translations` (fr) | **32 total = 28 validées · 4 proposées** |
| `word_lemma_mapping` | **184 total = 184 `confidence='safe'`** (0 review_required/rejected en base) |
| `lemmas` | **32 = 8 validés · 24 proposés · 0 rejeté** |
| `word_explanations` (fr) | **13 total = 13 validées** |

Ces chiffres sont conformes à la Phase 69 (538 word_translations FR validées, 32 lemma_translations,
28 FR validées, 8 lemmes validés, 13 explications validées).

---

## A. ARCHITECTURE ACTUELLE — TABLES ET FONCTIONS

### A.1 Tables éditoriales (schéma réel, migrations)

| Table | Migration | Clés / contraintes | Rôle |
|---|---|---|---|
| `word_translations` | 0019 | `UNIQUE(word_id, language, source_id)` · CHECK `is_validated ⇔ validated_at` | Gloses FR/EN de FORME ; seules les lignes `is_validated=true` sont actives pédagogiquement |
| `lemmas` | 0020 | `status ∈ proposed/validated/rejected` · CHECK `validated ⇔ validated_at NOT NULL` | Lemmes Hikma |
| `lemma_translations` | 0021 | `UNIQUE(lemma_id, language, source_id)` · même invariant de validation | Gloses au niveau LEMME |
| `word_lemma_mapping` | 0022 | `UNIQUE(word_id)` · `confidence ∈ safe/review_required/rejected` | Surcouche additive FORME → LEMME (seuls les `safe` sont en base) |
| `word_explanations` (+ contexts) | 0031 | `is_validated/validated_at` (même invariant) | Explications pédagogiques de sens (13 validées) |
| `linguistic_occurrences` / `linguistic_segments` | 0028 | `UNIQUE(source_id, source_record_id)` | Couche MASAQ passive (explication, jamais glose) |
| `translations` | (import) | `UNIQUE(ayah_id, resource_id)` | 4 traductions documentaires par ayah (contexte uniquement) |
| `sources` | — | name unique | Provenance : éditoriale, historique, API, MASAQ… |

### A.2 Fonctions runtime réelles (lib/learning/queries.ts + lib/learning/language.ts)

| Fonction | Rôle |
|---|---|
| `resolveWordMeanings` | **Résolution FORME → LEMME → fallback EN → null** (FR proposé jamais utilisé) |
| `getValidatedFrenchMeanings` | Gloses FR validées par FORME (la plus récente `updated_at DESC`, chunké) |
| `getValidatedFrenchLemmaMeanings` | Gloses FR validées par LEMME (même règle) |
| `getValidatedFrenchLemmaMeaningsByWord` | Lemme effectif par mot : `quran_words.lemma_id` DIRECT prioritaire, sinon `word_lemma_mapping` safe |
| `getWordLemmaMappingsByWordIds` | Mappings `safe` uniquement |
| `getWordLinguisticEvidence` | Évidence MASAQ par mot (chunking `selectInChunks`, 1re occurrence par mot) |
| `getWordAyahContexts` | Contexte du verset (arabe + traduction FR réelle) pour CONTEXT_RECOGNITION |
| `getValidatedWordExplanations` / Contexts | Explications validées (couche passive) |

### A.3 Scripts éditoriaux existants (provenance réelle)

| Script | Phase | Écrit | Mécanisme |
|---|---|---|---|
| `scripts/seed-word-translations.ts` | 7 | oui (propositions) | 8 PROPOSITIONS (`is_validated=false`), ON CONFLICT DO NOTHING, résolution par forme NFC |
| `scripts/seed-lemma-translations.ts` | 17C | oui (propositions) | Gloses lexicographiques niveau lemme (source Kazimirski 1860), `is_validated=false` |
| `scripts/seed-priority-lemma-glosses.ts` | 21B-F | oui | 4 gloses de lemme (رَبّ/الله/الرَّحْمَـٰن/الْحَمْد) importées puis validées avec double garde (`WHERE id AND is_validated=false`) |
| `scripts/import-phase21f-approved-glosses.ts` | 21F | oui | Import contrôlé des 45 décisions 21E/21E-B (ACCEPT/MODIFY/MOVE_TO_LEMMA), DRY-RUN par défaut, contrôle de divergence, provenance `Hikma — lexique éditorial` |
| `scripts/import-phase31-medium-glosses.ts` | 31 | oui | 81 gloses MEDIUM (verbes conjugués, particules, formes composées) validées, même mécanisme additif |

---

## B. WORKFLOW LEXICAL EXISTANT — COMMENT UNE FORME DEVIENT UNE GLOSE

Le standard canonique est formalisé dans **PHASE_22_LEXICAL_WORKFLOW_STANDARD.md** (décision
`A — LEXICAL_WORKFLOW_STANDARD_READY`), validé de bout en bout des Phases 19A → 21G.

```
1. DISCOVERY                inventaire formes / occurrences / lemmes / audio
2. LEXICAL_EXTRACTION       par forme : quran_word_id, lemma_id, occurrences, ayah_id
3. MULTI_TRANSLATION_EVIDENCE   4 traductions alignées sur le MÊME ayah_id (31/9001/20/153)
4. SEMANTIC_ANALYSIS        semantic_core, contextual_variations, classification
                            (DIRECT_EQUIVALENT · CONTEXTUAL_EQUIVALENT ·
                             GRAMMATICAL_FUNCTION · AMBIGUOUS · NOT_OBSERVABLE)
5. GLOSS_PROPOSAL           proposed_gloss, storage_level, confidence
6. HUMAN_REVIEW             ACCEPT · MODIFY · REJECT · MOVE_TO_LEMMA · NEEDS_REVIEW
7. IMPORT                   import contrôlé idempotent (DRY-RUN par défaut)
8. RUNTIME_AUDIT            compteurs + résolution + non-régression
```

**Faits observés dans les artefacts réels :**
- Les étapes 1–6 sont **ad hoc** (scripts `tmp/` jetables par phase) et produisent des **artefacts
  traçables** (`tmp/phase21d-lexical-data.json` → `tmp/phase21e-human-gloss-review.json` →
  `tmp/phase21f-import-summary.json` → `tmp/phase21g-verify.ts`).
- **Seule l'étape 7 (IMPORT) écrit en base**, et uniquement après revue humaine.
- La revue humaine est documentée dans `tmp/phase21e-human-gloss-review.json` : 46 propositions →
  40 ACCEPT + 4 MODIFY + 1 MOVE_TO_LEMMA (وَٱلنَّاسِ → lemme نَاس) + 1 NEEDS_REVIEW (يَكُن, bloqué).
  Chaque décision porte `justification` (convergence multi-traductions, occurrences, sourates).
- La validation (proposition → glose active) est une **étape éditoriale humaine distincte** :
  `is_validated=false` → `is_validated=true` + `validated_at`, avec double garde
  `WHERE id = … AND is_validated = false` (jamais d'écrasement d'une ligne déjà validée).
- Provenance : source `Hikma — lexique éditorial` (**jamais** 31/9001/20/153).

---

## C. WORKFLOW FĀTIḤAH RETROUVÉ DANS LE CODE

- **`FATIHAH_REFERENCE_LOCKED = TRUE`** (Phase 25) : Al-Fātiḥah est la référence pédagogique/UX
  verrouillée. 8 leçons · 26 formes · 29 occurrences · 26/26 audio · 25 gloses forme + 1 lemme.
- La chaîne pédagogique MASAQ : `getWordLinguisticEvidence → buildLinguisticExplanation →
  HikmaExplanation` — 2 blocs max, aucun tag brut, `AVAILABLE ≠ INFERABLE` (racine/schème =
  ABSENT_DATA), contexte de verset distinct de la glose (aucun `translation_source_leak`).
- Les gloses d'Al-Fātiḥah et des pilotes (112, 113, 114, 108) ont été produites par **exactement
  le même workflow multi-traductions** (Phases 7 → 21G), formalisé en Phase 22.
- L'import MASAQ pilote Fātiḥah (24G) a démontré l'alignement `(surah, ayah, position)` et
  l'isolation complète de la couche linguistique (aucune glose modifiée).

---

## D. SOURCES — COMMENT LES 4 RESSOURCES SONT RÉCUPÉRÉES

- Table `translations`, `UNIQUE(ayah_id, resource_id)`, **6 236 lignes par resource** (vérifié live).
- Récupération réelle (pattern `tmp/phase21d-extract.ts`, reproduit par le runtime) :
  `.from("translations").select("resource_id, text").eq("ayah_id", ayah.id).in("resource_id", [31, 9001, 20, 153])`
  puis strip HTML. **Alignement strict sur le même `ayah_id`** (règle Phase 22 §8).
- Resource_ids confirmés : **31** Hamidullah FR · **9001** Kazimirski 1869 FR · **20** Sahih
  International EN · **153** Piccardo IT.
- Les gloses Hikma ne sont **jamais** rattachées à ces resource_ids : provenance éditoriale
  dédiée (`Hikma — lexique éditorial`). Les 4 traductions restent du **contexte documentaire**.
- Le dictionnaire Kazimirski 1860 (`historical_dictionary`) alimente les **propositions** de
  lemma_translations (4 encore proposées, texte source OCR, revue humaine requise) — distinct de
  la traduction coranique Kazimirski 1869 (resource 9001).

---

## E. TRAÇABILITÉ — CE QUI PERMET DE CONSERVER LA TRACE

| Élément | Mécanisme réel |
|---|---|
| Forme / lemme / mapping | `quran_words.id`, `lemmas.id`, `word_lemma_mapping.word_id → lemma_id` (UNIQUE(word_id)) |
| Occurrences / ayahs | `word_occurrences(word_id, ayah_id, position)` → `ayahs(surah_id, ayah_number)` |
| Traductions-évidences | `translations(ayah_id, resource_id)` — même ayah_id pour les 4 |
| Analyse / noyau sémantique | artefacts JSON par phase (`tmp/phase21d-editorial-lexical-enrichment.json`…) + `editorial_notes` |
| Proposition | `is_validated=false`, `validated_at=NULL` |
| Décision humaine | `tmp/phase21e-human-gloss-review.json` (ACCEPT/MODIFY/REJECT/MOVE_TO_LEMMA/NEEDS_REVIEW + justification) |
| Validation | `is_validated=true` + `validated_at` horodaté + `editorial_notes` (phase, décision, confiance) |
| Idempotence | `UNIQUE(word_id, language, source_id)` / `UNIQUE(lemma_id, language, source_id)` / `UNIQUE(word_id)` + ON CONFLICT |

---

## F. PRIORISATION — COMMENT P1/P2/P3 SONT CALCULÉS

- Définition **réelle** (Phase 66, `tmp/phase66-audit.ts`) : `impact = sourates × 10 + occurrences` ;
  **HIGH ≥ 60 · MEDIUM ≥ 20 · LOW < 20**.
- Phase 69 (audit READ-ONLY) a cartographié : **P0 = 0 · P1 = 1 170 · P2 = 4 907 · P3 = 14 403**
  (21 296 formes). Parmi les P1, les formes de **catégorie C** (évidence MASAQ disponible, sans
  glose FR validée) constituent la cible prioritaire : 8 819 formes ont une évidence MASAQ,
  8 127 restent sans glose FR.
- Aucun score n'est inventé : la priorisation est fondée sur les données (occurrences réelles,
  spread de sourates, couverture MASAQ/FR).

---

## G. GAP ANALYSIS — CE QUI EXISTE / CE QUI MANQUE

### Existe déjà (réutilisable tel quel)
1. **Workflow complet 8 étapes validé** (Phase 22, `LEXICAL_WORKFLOW_STANDARD_READY`).
2. **Mécanismes d'import contrôlé** idempotents avec DRY-RUN, contrôle de divergence et double
   garde de validation (`scripts/import-phase21f-approved-glosses.ts`,
   `scripts/import-phase31-medium-glosses.ts`).
3. **Helpers runtime batch** (chunking `selectInChunks`) : résolution FR, lemmes, MASAQ, contexte.
4. **Données complètes** : 4 traductions (6 236 × 4), MASAQ B01–B11, 538 gloses FR validées,
   184 mappings safe, 13 explications.
5. **Traçabilité** complète (editorial_notes, validated_at, artefacts par phase).

### Manque / à construire pour le pilote éditorial (sans rien écrire en base)
1. **Industrialisation des étapes 1–6** : les scripts DISCOVERY→HUMAN_REVIEW sont ad hoc dans
   `tmp/` ; le standard Phase 22 §5 note explicitement l'opportunité de les extraire en outils
   nommés réutilisables. Pour le pilote, un extracteur de candidats **ciblé P1 + catégorie C**
   (avec POS/morphologie MASAQ, occurrences, sourates, présence lemma, audio) manque.
2. **Générateur de dossier de revue** : le grid de revue humaine (décisions ACCEPT/MODIFY/…)
   n'a pas d'outil dédié ; il était produit par phase (`tmp/phase21e-build.ts`).
3. **Sélection du pilote** : le prompt exige un petit échantillon représentatif (noms, verbes,
   adjectifs, particules, polysémiques, multi-contextes MASAQ, résolvables par lemme) — à
   construire **après** ce gate, sur données réelles.
4. **Correcteur pédagogique à tolérance de synonymes** : explicitement futur (Phase 70) — ne
   justifie pas de multiplier les gloses ; ne pas développer massivement avant validation du
   workflow de gloses.

### Risques documentés (non bloquants, hors périmètre de correction)
- Kazimirski 1860 (dictionnaire) : statut `LEGAL_REVIEW_REQUIRED` documenté (Phases 16–17) ;
  utilisé uniquement comme matériau de proposition, jamais comme glose validée sans revue.
- `lemma_translations` : 4 lignes encore PROPOSÉES (revue requise avant validation).

---

## 2. CONCLUSION

**`READY_FOR_EDITORIAL_PILOT`**

- Le workflow éditorial multi-traductions existe, est standardisé (Phase 22) et a déjà produit
  538 gloses FR validées + 8 lemmes validés + 184 mappings safe, de façon traçable et idempotente.
- Les 4 ressources documentaires couvrent 100 % des ayahs (6 236 × 4), le corpus MASAQ est
  complet pour le périmètre IMPORT_DIRECT, et le runtime résout 100 % des formes.
- Il ne manque **aucun prérequis bloquant** : la prochaine étape est la construction du
  **pilote éditorial** (petit échantillon représentatif, P1 + catégorie C), avec un
  **human gate** avant chaque écriture en base (`word_translations` / `lemma_translations` /
  `word_lemma_mapping` uniquement, jamais les tables documentaires ou MASAQ).

**Garanties Phase 70A :**
- DATABASE_WRITES = 0 · IMPORTS = 0 · VALIDATIONS = 0 · MIGRATIONS = 0 · SEEDS = 0
- Moteur MASAQ, schéma DB, tables métier et traductions intacts · aucun commit/push
- Vérifications live : `tmp/phase70a-verify.ts` (read-only) · rapport `PHASE_70A_EDITORIAL_WORKFLOW_AUDIT.md`

**FIN PHASE 70A — ARRÊT OBLIGATOIRE au HUMAN GATE.**
