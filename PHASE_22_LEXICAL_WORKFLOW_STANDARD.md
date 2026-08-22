# PHASE 22 — CONTROLLED LEXICAL ENRICHMENT WORKFLOW

STATUS = READ_ONLY
DATABASE_WRITES = 0
IMPORTS = 0
VALIDATIONS = 0
MIGRATIONS = 0
SEEDS = 0

## 1. Executive Summary

Le workflow lexical multi-traductions, validé de bout en bout de la Phase 19A
à la Phase 21G (analyse → revue humaine → import contrôlé → audit runtime), est
formalisé ici en **standard reproductible**. Aucune glose n'est générée
automatiquement : chaque glose Hikma est une **donnée éditoriale validée**,
dérivée du **mot arabe** et des **4 traductions alignées par ayah**, jamais
d'une traduction d'ayah copiée.

Décision : **A — LEXICAL_WORKFLOW_STANDARD_READY**.

## 2. Règle fondamentale

> On part **toujours du mot arabe**. Les traductions (Hamidullah, Kazimirski,
> Sahih International, Piccardo) sont des **ÉVIDENCES CONTEXTUELLES ALIGNÉES**.
> Elles ne deviennent **jamais** automatiquement une glose. La glose Hikma est
> une donnée éditoriale validée.

Interdictions absolues :

- ❌ `mot arabe → Hamidullah → glose automatique`
- ❌ `mot arabe → Kazimirski → glose automatique`
- ❌ `mot arabe → Sahih → traduction française automatique`
- ❌ `mot arabe → Piccardo → glose automatique`

## 3. Sources de traduction

| Source | resource_id | Langue | Rôle |
|---|---|---|---|
| Muhammad Hamidullah | 31 | FR | principale (analyse) |
| Kazimirski — Le Koran 1869 | 9001 | FR | principale (analyse) |
| Sahih International | 20 | EN | contrôle |
| Hamza Roberto Piccardo | 153 | IT | contrôle |

La hiérarchie FR > EN/IT concerne **l'analyse**, pas la glose elle-même.

## 4. Workflow actuel (validé 19A → 21G)

| Étape | Description | Artifacts réels |
|---|---|---|
| 1. DISCOVERY | Inventaire formes / occurrences / lemmes / audio | `tmp/phase21d-extract.ts` → `phase21d-lexical-data.json` |
| 2. LEXICAL_EXTRACTION | Par forme : quran_word_id, lemma_id, occurrences, ayah_id | `tmp/phase21c-evidence.ts` → `phase21c-evidence.json` |
| 3. MULTI_TRANSLATION_EVIDENCE | 4 traductions alignées sur le même ayah_id | `tmp/phase21d-extract.ts`, `phase19a-translations.json`, `phase19a-occurrences.json` |
| 4. SEMANTIC_ANALYSIS | semantic_core, contextual_variations, classification | `tmp/phase21d-build-json.ts`, `phase19a-multi-translation-analysis.json` |
| 5. GLOSS_PROPOSAL | proposed_gloss, storage_level, confidence | `tmp/phase21d-editorial-lexical-enrichment.json` |
| 6. HUMAN_REVIEW | ACCEPT / MODIFY / REJECT / MOVE_TO_LEMMA / NEEDS_REVIEW | `tmp/phase21e-human-gloss-review.json`, `phase21e-b-yakun-final-review.json` |
| 7. IMPORT | Import contrôlé, idempotent, DRY-RUN par défaut | `scripts/import-phase21f-approved-glosses.ts` |
| 8. RUNTIME_AUDIT | Compteurs + résolution + non-régression | `tmp/phase21g-verify.ts`, `phase21g-pilot-surahs.ts` |

Les étapes 1–6 sont **ad hoc** (scripts `tmp/` jetables par phase) ; elles
produisent des **artefacts traçables**. Seule l'étape 7 écrit en base.

## 5. Workflow cible

```
DISCOVERY
↓
LEXICAL_EXTRACTION
↓
MULTI_TRANSLATION_EVIDENCE
↓
SEMANTIC_ANALYSIS
↓
GLOSS_PROPOSAL
↓
HUMAN_REVIEW
↓
IMPORT
↓
RUNTIME_AUDIT
```

- Chaque étape est **séparée** et **traçable**.
- Aucune génération automatique de glose ne contourne **HUMAN_REVIEW**.
- Les étapes 1–6 produisent des artefacts ; seule l'étape IMPORT écrit en base,
  et uniquement après revue humaine.
- Industrialisation possible : extraire les scripts `tmp/` ad hoc en outils
  nommés réutilisables (hors périmètre de cette phase documentaire).

## 6. Invariants

1. Traduction d'ayah ≠ glose de mot (`translations` = contexte uniquement).
2. Le mot arabe est le point de départ conceptuel.
3. `quran_words` est global et sourate-agnostique (jamais de doublon par sourate).
4. Une glose de FORME est globale (jamais par sourate).
5. Contexte déterminé par `word → occurrence → ayah → surah` (jamais par défaut).
6. Précédence de résolution : FORME > LEMME > EN fallback.
7. `FATIHAH_REFERENCE_LOCKED` et les 4 pilotes (112, 113, 114, 108) sont intangibles.
8. ROOT = FUTURE WORK ; MORPHOLOGY = FUTURE WORK.

## 7. Règles de glose

- courte, française, pédagogique, lexicalement honnête, traçable ;
- indépendante d'une citation directe ou d'une phrase de verset ;
- plusieurs équivalents autorisés si les données le justifient (ex. « gens / hommes ») ;
- interdite : phrase complète, traduction de verset, paraphrase, invention mono-source.

## 8. Règles multi-traductions

- Alignement strict sur le **même ayah_id** (jamais comparer des ayahs différents).
- FR prioritaires (Hamidullah, Kazimirski) ; EN/IT en contrôle.
- Ne jamais traduire automatiquement EN/IT vers le français.
- Classification : DIRECT_EQUIVALENT · CONTEXTUAL_EQUIVALENT · GRAMMATICAL_FUNCTION · AMBIGUOUS · NOT_OBSERVABLE.
- Convergence = semantic_core + contextual_variations ; pas de glose unique forcée en cas de polysémie.

## 9. Règles forme / lemme

- Précédence : word_translation validée > lemma_translation validée > EN fallback.
- Glose de forme = globale (pas par sourate).
- MOVE_TO_LEMMA quand plusieurs formes partagent la même valeur lexicale.
- Ne jamais créer automatiquement une lemma_translation.
- Réutiliser une glose existante (forme ou lemme) au lieu de créer un doublon.

## 10. Règles audio

- L'audio Muʿallim est une **information pédagogique séparée** (ne détermine pas la glose).
- Documenter `audio_present = true/false` par forme.
- Aucun import audio automatique dans le workflow lexical.

## 11. Règles ROOT / MORPHOLOGY

- ROOT = FUTURE WORK ; MORPHOLOGY = FUTURE WORK.
- Ne jamais inventer racine, schème, POS, segmentation, dérivation.
- `MORPHOLOGY_UNAVAILABLE` / `NOT_AVAILABLE` si une explication l'exigerait.

## 12. Règles de revue humaine

- Toute proposition est `PROPOSED` + `human_review = REQUIRED` (même confidence HIGH).
- Décisions : ACCEPT · MODIFY · REJECT · MOVE_TO_LEMMA · NEEDS_REVIEW.
- REJECT ne remplace jamais par une invention ; si aucune glose fiable → NO_RELIABLE_GLOSS.
- Les gloses existantes auditées restent PRESERVED.

## 13. Règles d'import

- Transcription contrôlée des décisions validées (jamais de nouvelle décision sémantique).
- Provenance : « Hikma — lexique éditorial » (jamais 31/9001/20/153).
- `is_validated = true` + `validated_at` horodaté (invariant de validation de la base).
- DRY-RUN obligatoire avant écriture ; divergence → STOP.

## 14. Règles d'idempotence

- RUN 1 = création ; RUN 2 = 0 duplication ; RUN 3 = 0 duplication.
- Jamais d'UPDATE destructif.
- Contraintes : `UNIQUE(word_id, language, source_id)` + `ON CONFLICT` ; `UNIQUE(word_id)` sur mapping.

## 15. Règles de non-régression

- Fātiḥah : 8 leçons · 26 formes · 29 occurrences · 26/26 audio · 25 gloses forme + 1 lemme.
- Les 4 sources traductions intactes.
- `quran_words` / `word_occurrences` / `translations` / `lemmas` inchangés.
- `npm test` + `tsc --noEmit` + `lint` + `build` verts après import.

## 16. Traçabilité

Chaque future glose doit pouvoir être reliée à :

- mot arabe + quran_word_id ;
- lemma_id + word_lemma_mapping éventuel ;
- occurrences + ayah_id + sourates ;
- 4 traductions utilisées comme évidence ;
- semantic_core + contextual_variations ;
- décision humaine + statut ;
- source éditoriale + date de validation (`validated_at`).

## 17. Schéma de stockage

| Table | Colonnes clés | Contraintes |
|---|---|---|
| `word_translations` | word_id, language, text, source_id, is_validated, validated_at, editorial_notes | UNIQUE(word_id, language, source_id) |
| `lemma_translations` | lemma_id, language, text, source_id, is_validated, validated_at, editorial_notes | UNIQUE(lemma_id, language, source_id) |
| `word_lemma_mapping` | word_id, lemma_id, source_id, mapping_method, confidence, evidence, editorial_notes | UNIQUE(word_id) ; confidence ∈ safe/review_required/rejected |

Invariant de validation : `is_validated = false ⇔ validated_at NULL` ;
`is_validated = true ⇔ validated_at NOT NULL`.

## 18. Validation

Phase 22 étant strictement documentaire (aucun code/donnée modifié), les
résultats de la Phase 21G restent valides :

| Check | Résultat |
|---|---|
| `npm test` | 456 passed / 38 files (inchangé) |
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | clean |
| `npm run build` | PASS |

## 19. Décision

**A — LEXICAL_WORKFLOW_STANDARD_READY**

Le standard est suffisamment formalisé et traçable pour être appliqué à de
nouvelles sourates avec le même workflow (analyse multi-traductions → revue
humaine → import contrôlé → audit runtime), sans génération automatique de glose.

---

DATABASE_WRITES = 0
IMPORTS = 0
VALIDATIONS = 0
MIGRATIONS = 0
SEEDS = 0

FATIHAH_REFERENCE_LOCKED = PRESERVED
PILOTES (112, 113, 114, 108) = PRESERVED

FIN PHASE 22
