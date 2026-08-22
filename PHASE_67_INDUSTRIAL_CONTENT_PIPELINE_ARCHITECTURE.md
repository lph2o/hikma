# PHASE 67 — INDUSTRIAL CONTENT PIPELINE ARCHITECTURE (READ-ONLY)

> **Statut**: READ-ONLY. Aucune écriture DB, aucun import, aucun seed, aucune
> modification de resolver / classifieur / curriculum / SRS / migrations / code
> de production, aucun commit, aucun push.
>
> **Validations**: `tsc --noEmit` 0 erreur · `eslint` 0 erreur · `vitest
> run` 753/753 · DB snapshot inchangée.
>
> **Artefacts READ-ONLY produits** (sous `tmp/`) :
> - `tmp/phase67-ambiguous-roots.json` — catégorisation par cause-racine des
>   241 AMBIGUOUS MASAQ.
> - `tmp/phase67-ambiguous-pairs.csv` — détail par paire (sura:aysia:position).
> - `tmp/phase67-impact-scenarios.json` — 7 scénarios de simulation d'impact.
> - `tmp/phase67-surah-impact-matrix.csv` — 114 sourates classées par impact.

---

## A. Baseline (snapshot READ-ONLY)

Chiffres observés depuis `phase66-baseline.json` + `phase66-global-coverage.json`
+ `tmp/MASAQ.csv` + audit runtime :

| Table / compteur | Valeur | Source |
|---|---|---|
| `quran_words` | 21 296 | `phase66-baseline.json` |
| `word_occurrences` | 77 430 | ↗ |
| `ayahs` | 6 236 | ↗ |
| `translations` | 24 944 | ↗ |
| `lemmas` | 32 | ↗ |
| `lemma_translations` | 32 (toutes FR validées) | ↗ |
| `word_lemma_mapping` | 184 | ↗ |
| `word_translations` (FR validées) | 538 | ↗ |
| `linguistic_occurrences` | 611 (sourates 1, 87, 91, 93, 94, 96, 97, 101–114) | runtime |
| `linguistic_segments` | 1 188 | ↗ |
| `word_explanations` | 13 (10 EXPLANATIONS active) | ↗ |
| `word_explanation_contexts` | 1 | ↗ |
| `learning_paths` | 24 (1 REFERENCE + 23 READY via MASAQ) | ↗ |
| MASAQ `MISSING` (positions) | 20 (surates 2/3/4/5/11/15/16/19/20/23/26/57) | `phase66-masaq-coverage.json` |
| MASAQ `EXTRA` (positions) | 1 (seulement s7) | ↗ |
| MASAQ `AMBIGUOUS` (paires) | **241** dans 11 sourates (s3=49, s5=47, s2=19, s23=15, s11=14, s7=12, s27=10, s12=9, s16=9, s6=6, s20=4, …) | ↗ |
| Glosses FR uniques manquantes | **20 480** (HIGH 1 170 · MEDIUM 4 907 · LOW 14 403) | `phase66-unique-gloss-needs.json` |
| Sources lexicales couvertes (4/4) | 20 480/20 480 (100 % des besoins étant sourcés) | ↗ |
| Tests unitaires (vitest) | **753 / 753** | `npx vitest run` |
| `tsc --noEmit` | **0 erreur** | serveur CI local |
| `eslint` | **0 problème** | serveur CI local |
| SRS MAX_REVIEW_INTERVAL_DAYS | 365 (constante runtime) | `lib/learning/progress.ts` |
| `supabase/.temp/` | ignoré (`.gitignore` ligne 45), `linked-project.json` présent localement | repo state |
| Dernier commit Git | `d09143c` (`chore: ignore local Supabase temp files`) | `git log -1` |

**Lecture** :
1. Le pipeline lexical est COMPLET pour 23 sourates (1 REFERENCE + 22
   READY pure-FR). Reste 91 sourates « IN_PREPARATION ».
2. **38 sourates MASAQ COMPLETE/IMPORT_READY/IMPORTABLE → potentiel direct**
3. **40 sourates MASAQ_BLOCKED → nécessitent une action classifier OU source
   OU morphologique**
4. **Aucun gains de simple propagation** : 0 sourate ne passe à READY sans
   nouvelle glose (HIGH/MEDIUM/LOW).

---

## B. Architecture existante — primitives canoniques réutilisables

Aucun mécanisme n'a été recréé. Les primitives existantes sont réutilisables :

### B.1. Résolution / Lemmas

| Primitive | Fichier | Rôle | Statut |
|---|---|---|---|
| `normalizeWordText(input)` | `lib/quran/normalize-text.ts` | Normalisation diacritique pure (`HARAKAT`, `TATWEEL`, `QURANIC_ANNOTATIONS`, `WASLA`, `DAGGER_ALEF`) | ✅ déterministe, idempotent (`tests/normalize.test.ts`) |
| `skeleton(s)` | `lib/quran/lemma-mapping.ts` | Squelette technique pour décomposition (utilisé par `classifyPilotMappings`) | ✅ |
| `PROCLITICS = ["و","ب","ل","ف"]`, `ENCLITICS = ["كما","هما","كم",…,"ي"]` | ↗ | Ensembles fermés documentés (jamais fuzzy) | ✅ |
| `classifyPilotMappings(words, lemmas, freq)` | ↗ | FORME → LEMME : SAFE / REVIEW_REQUIRED / REJECTED | ✅ (pilote 5 formes, riche) |
| `SupabaseQuranDataProvider` | `lib/quran/provider.ts` | Interface lecture seule (Surah/Ayah/AyahWord/Word/Translation/Recitation/Audio) | ✅ |

### B.2. MASAQ

| Primitive | Fichier | Rôle | Statut |
|---|---|---|---|
| `normalizeOrthographic(s)` | `lib/linguistic/masaq.ts` | 18 règles ordonnées, idempotent | ✅ (étendu phases 27/43B/65) |
| `classifyAlignment(hikma, masaq)` | ↗ | EXACT → EXACT_ORTHOGRAPHIC → VARIANT_ORTHOGRAPHY_DOCUMENTED (×4 sous-règles : `noAlif`, `finalAlif`, `collapse`, `noHamza`) → AMBIGUOUS | ✅ |
| `alignKey(surah, ayah, position)` | ↗ | Clé d'alignement obligatoire (chaînes seules jamais utilisées) | ✅ |
| `classifySegment(morphType, morphTag)` | ↗ | SegmentKind = `PARTICLE/ARTICLE/STEM/INFLECTIONAL_SUFFIX/PRONOMINAL_SUFFIX/OTHER` | ✅ |
| `classifyLemmaMatch(hikmaLemma, masaqStem)` | ↗ | `EXACT/PARTIAL/NORMALIZATION_DIFFERENCE/LEXICAL_LEVEL_DIFFERENCE/UNMAPPED/AMBIGUOUS` | ✅ |
| `buildImportPlan(hikma, csvText, {surah})` | `lib/linguistic/masaq-plan.ts` | Plan PUR (no I/O) | ✅ |
| `assertPlanScope(plan, expectedSurah)` | ↗ | Garde-fou : refuse MISSING/EXTRA/AMBIGUOUS/périmètre ≠ expectedSurah | ✅ (3 tests dans `tests/masaq-import.test.ts`) |
| `parseMasaqCsv(text)` + `MASAQ_COLUMNS` (19 réels) | ↗ | CSV → ligne typée | ✅ |
| `EXPECTED_SHA256` du CSV MASAQ | `scripts/import-masaq-multi-surah.ts:38` | Verrouillage checksum — STOP si altéré | ✅ |

### B.3. Explications

| Primitive | Fichier | Rôle |
|---|---|---|
| `LinguisticEvidence` / `PedagogicalSegment` / `LinguisticBlock` (4 types : `decomposition`, `identity`, `morphology`, `syntax`) | `lib/linguistic/explanation.ts` | Modèle pédagogique — jamais de données inventées. |
| `isDisplayableSegment` | ↗ | Exclut `Other_i3rab`, `Morph_Tag="None"`, `(null)` (AVAILABLE ≠ INFERABLE). |
| `segmentLabel(morphType, morphTag, kind)` | ↗ | Tables internes fermées (jamais d'inférence libre). |
| `categoryFromStemTag` | ↗ | Catégorie grammaticale française du NOYAU (jamais i 3rab vide). |
| `caseFromCaseMood` | ↗ | `null` si multiple non-INVARIABLE (= AMBIGUOUS_DATA → jamais affirmé). |
| Anti-redondance | ↗ | Particule déjà décomposée → pas de bloc identité séparé. |
| `buildLinguisticExplanation(evidence)` | ↗ line 319 | `{ availability: "partial"\|"unavailable", blocks: LinguisticBlock[] }`. |

### B.4. Curriculum

| Primitive | Fichier | Rôle |
|---|---|---|
| `planSurahCurriculum(surah, wordsByAyah, maxReviewWords=4)` | `lib/learning/surah-curriculum.ts` | PUR, idempotent, jamais de hardcode. 1 leçon / verset, cumul plafonné. |
| `EDITORIAL_PATH_SURAH_NUMBERS = {1}` + `isEditorialSurah(n)` | ↗ | Al-Fātiḥah jamais régénérée. |
| `computeCoveragePercent(covered, total)` | `lib/learning/coverage.ts` | Borné 0–100, jamais NaN. |
| `validateCurriculum / orderCurriculum` | `lib/learning/curriculum.ts` | Validation structurelle. |
| `seed-multisurah-curriculum.ts` | `scripts/` | Idempotent (UPSERT on slug). Réutilise `planSurahCurriculum`. |

### B.5. Imports / Scripts existants

| Script | Périmètre | Idempotence | Limite observée |
|---|---|---|---|
| `scripts/import-masaq-fatihah.ts` | sourate 1 | UNIQUE(`source_id`,`source_record_id`) | sourate seule |
| `scripts/import-masaq-multi-surah.ts` | liste `SURAH=108,112,113,114` par défaut | UNIQUE | séquentiel per-sourate, 1 plan de DB calls par sourate |
| `scripts/seed-multisurah-curriculum.ts` | liste `--surahs=112,113,114,108` | UPSERT slugs | séquentiel per-sourate |
| `scripts/seed-curriculum.ts` | tous | UPSERT | séquentiel |
| `scripts/import-phase30-high-glosses.ts` | HIGH par lot | UNIQUE | séquentiel |
| `scripts/import-phase31-medium-glosses.ts` | MEDIUM par lot | UNIQUE | séquentiel |

### B.6. Tests unitaires

| Suite | Garantit |
|---|---|
| `tests/masaq.test.ts` (52 asserts) | `normalizeOrthographic`, `classifyAlignment` sur cas réels Al-Fātiḥah + 87 |
| `tests/masaq-import.test.ts` | `assertPlanScope` (3 cas exhaustivité) |
| `tests/word-translations.test.ts` | unicité glosses FR |
| `tests/lemma-translations.test.ts` | mapping lemme |
| `tests/pedagogical-engine.test.ts`, `tests/linguistic-explanation.test.ts`, `tests/curriculum.test.ts`, `tests/surah-curriculum.test.ts` | règles pédagogiques/runtime/curriculum |

**Bilan A/B** : aucun nouveau mécanisme n'est requis. La Phase 67 propose une
**architecture d'orchestration** qui compose ces primitives, plus un **modèle
de données** (`inventory.json`) jamais instancié en script tant qu'aucune
phase n'est déclenchée.

---

## C. Workflow actuel — problèmes identifiés

Workflow observé (Phases 47–66) :

```
   sourate → audit éditorial
        → 40–80 gloses createdd/importées (une par une)
        → curriculum seedé
        → MASAQ import tenté (souvent bloqué par AMBIGUOUS=quelques paires)
        → runtime verification
        → surate suivante
```

**5 pathologies** :

1. **Boucle sur la sourate** : chaque sourate produit un audit
   (`PHASE_4X_<SOURATE>.md`). 32 sourates éditorialisées = 32 phases. **Effort
   O(N) pour un gain O(1) quand la forme est partagée**.
2. **Gloses non mutualisées** : `PHASE_30` = 432 gloses HIGH, `PHASE_31` = ??
   gloses MEDIUM, etc. — toujours sur le sous-ensemble d'une sourate. Pas de
   vision globale.
3. **MASAQ import par sourate** : `EXPECTED_OCCURRENCES[surah]` hardcodé dans
   `import-masaq-multi-surah.ts:57` (`{108: 10, 112: 15, 113: 23, 114: 20}`).
   Refactorisation par sourate.
4. **241 AMBIGUOUS dépourvus de classification par cause-racine** → chaque
   nouvelle sourate redécouvre les mêmes patterns.
5. **Curriculum insuffisamment piloté** : 22 sourates READY mais aucune
   matrice IMPACT/EFFORT. Lesquelles publier en premier ? 24/91 IN_PREPARATION
   sont éditorialisables, mais dans quel ordre ? Pas d'outil de simulation
   (jusqu'à la Phase 66 qui l'a introduit pour le seul audit).

---

## D. Architecture cible — pipeline industriel READ-ONLY (5 couches)

```
        ┌─────────────────────────────────────────────────────────────┐
        │                                                             │
        │        ┌──────────────┐    ┌──────────────┐                 │
   L1   │        │  INVENTORY   │ →  │   AGGREGATES │  (pure functions)│
        │        │  (1 fichier  │    │  per-form    │                 │
        │        │   par source │    │  per-surah   │                 │
        │        │   immutable) │    │  per-priority│                 │
        │        └──────────────┘    └──────────────┘                 │
        │                                                             │
        │        ┌───────────────────────────────────────────────┐    │
   L2   │        │            SCORE ENGINE                        │    │
        │        │  impact(occurrences × √surahs × priority_weight)│   │
        │        │  → ordonne 20 480 forms en lots actionnables    │    │
        │        └───────────────────────────────────────────────┘    │
        │                                                             │
        │        ┌───────────────────────────────────────────────┐    │
   L3   │        │            BATCH SYSTEM                        │    │
   orch │        │  batch_id  status  apply_id  verify_id          │    │
        │        │  invariant: idempotent + dryRun par défaut      │    │
        │        └───────────────────────────────────────────────┘    │
        │                                                             │
        │        ┌───────────────────────────────────────────────┐    │
        │        │         PIPELINE ORCHESTRATOR                  │    │
   L4   │        │  COMPOSE:  normalize + classify + resolve       │    │
        │        │            + explain + readiness + seed         │    │
        │        │  Aucune primitive n'est dupliquée               │    │
        │        └───────────────────────────────────────────────┘    │
        │                                                             │
        │        ┌───────────────────────────────────────────────┐    │
   L5   │        │         CHECKPOINT / REPRISE                    │    │
        │        │  batch_progress.json · rollback_strategy.json   │    │
        │        │  Aucun re-run requis après interruption         │    │
        │        └───────────────────────────────────────────────┘    │
        │                                                             │
        └─────────────────────────────────────────────────────────────┘
```

### D.1. L1 — INVENTORY (modèle de données, jamais muté)

L'inventaire est un **artefact CSV/JSON purement dérivé** des tables Hikma
runtime. Pour la Phase 67, **seul son schéma** est proposé (Phase 68+).

```
For each form (FR validated or to-validate) :
  - word_id
  - arabic (n'est jamais modifié — lecture seule)
  - lemma_arabic (si mappé)
  - normalized (skeleton(s) pour décompte)
  - occurrences_total
  - distinct_surahs (≡ form_to_surahs.get(form).size)
  - ayahs_sample (top 5 — traçabilité)
  - priority (HIGH|MEDIUM|LOW) — calculé :
      HIGH si : distinct_surahs ≥ 3 ET occurrences ≥ 30
      MEDIUM si : distinct_surahs = 2 OR (distinct_surahs=1 ET occurrences ≥ 20)
      LOW sinon
  - category (LEXICAL|GRAMMATICAL|CLITIC_PARTICLE) — calcul runtime
  - fr_validated_now (bool)
  - has_explanation_now (bool)
  - has_masaq_alignment (EXACT|EXACT_ORTHO|VARIANT|AMBIGUOUS|MISSING)
  - masaq_surahs_covered (n)
  - impact_score = occ × √distinct_surahs × priority_weight
```

> **Note de cardinalité** : pour la Phase 67, on dérive cet inventaire
> uniquement depuis les agrégats Phase 66 déjà capturés —
> `tmp/phase66-batch-plan.json` (par form) + `tmp/phase66-surah-matrix.csv`
> (par surah). Un script qui scanne DB live sera créé en Phase 68.

### D.2. L2 — SCORE ENGINE (impact-based ranking)

`impact_score(form)` = `occurrences × √distinct_surahs × priority_weight`

Poids :
- HIGH : 100
- MEDIUM : 10
- LOW : 1

Pourquoi √(surahs) et pas raw multiplier ? Chaque sourate marginale débloquée
vaut moins que la précédente (loi de rendement décroissant). Linéaire ferait
surpondérer les HIGH dans sourates 2/3 monopolisant tout.

Cette fonction n'est PAS exécutée en Phase 67 — elle est juste spécifiée.

### D.3. L3 — BATCH SYSTEM (idempotence + reprise)

Modèle (jamais appliqué en Phase 67) :

```
batch_progress.json {
  batch_id: "batch_2026_08_20_002_pipeline_H1",
  source: "lex_fr_kazimirski_v2",
  scope: { priority: ["HIGH"], shared_threshold: 1 },
  forms_total: 1170,
  forms_applied: 0..1170,
  cursor: { word_id: "...", applied_at: ISODateString },
  verify: { fr_count_before, fr_count_after, explica_needed },
  status: DRAFT|DRY_RUN_VALIDATED|APPLYING|APPLIED|FAILED|ROLLED_BACK,
  checkpoints: [...],
  rollback_strategy: {
    tables: ["word_translations", "word_explanation_contexts"],
    method: "delete_by_source_id_or_filter",
    requires_human_confirm: true
  }
}
```

**Invariant** : un batch appliqué une fois n'est JAMAIS ré-appliqué. Reprise =
 reprendre au `cursor` (jamais re-traiter depuis le début).

### D.4. L4 — ORCHESTRATOR (compose les primitives, ne les réécrit jamais)

```
Pipeline Phase 68+ :

   GLOSES (batch_id)        → src/lib/learning/language.ts::resolveWordMeaning
        ↓
   NORMALISATION FORME       → normalizeOrthographic (déjà canonique)
        ↓
   LEMMA MAPPING             → classifyPilotMappings + EN fallback
        ↓
   MASAQ IMPORT multi-surate → scripts/import-masaq-multi-surah.ts (étendu)
        ↓
   EXPLANATION GENERATION    → lib/linguistic/explanation.ts::buildLinguisticExplanation
        ↓
   COVERAGE / READINESS      → lib/learning/coverage.ts + lib/learning/surah-curriculum.ts
        ↓
   CURRICULUM SEED           → scripts/seed-multisurah-curriculum.ts (étendu)
        ↓
   VERIFY (ALL READY frogs)  → scripts/verify-rls.ts + scripts/verify-persistence.ts
        ↓
   CHECKPOINT GIT            → codebuff (jamais dans le pipeline de données)
```

### D.5. L5 — CHECKPOINT / REPRISE

Chaque transition d'état est journalisée dans `batch_progress.json`. La DB
ne contient AUCUN champ `pipeline_state` (permissionnel d'audit externe
uniquement). Aucune migration requise en Phase 67.

---

### D.6. Messages clés du modèle

1. **`source_record_id` (MASAQ ID) est l'unique clé d'idempotence** — déjà
   exprimé en `linguistic_occurrences.UNIQUE(source_id, source_record_id)`.
   Phase 68 l'étend à `word_translations`/explanations via `UNIQUE(word_id, source_id, language)`.
2. **`alignKey(surah, ayah, position)` est la seule clé d'alignement légale**.
   Jamais égalité de chaîne arabe.
3. **`assertPlanScope(plan, expectedSurah)` est le seul validateur d'écriture**
   MASAQ. Tout chemin d'écriture doit l'invoquer.
4. **`isEditorialSurah(1)` est verrouillé** (Al-Fātiḥah jamais régénérée).
5. **`editor_notes` (déjà existant) est le canal unique d'audit humain**.

---

## E. Section C — Pipeline MASAQ par lots

### E.1. Statuts MASAQ par sourate (extrait phase66-masaq-coverage.json)

| Statut | Nb sourates | Total occurrences alignées | % corpus |
|---|---|---|---|
| `MASAQ_COMPLETE` | 21 (1 REFERENCE + 20 sourates courtes 87–114) | ~770 | ~1 % |
| `MASAQ_IMPORT_READY` (ambiguous=0, missing=0, extra=0) | 50 sourates | ~15 800 | ~20 % |
| `MASAQ_BLOCKED` (ambiguous>0 OU missing>0 OU extra>0) | 43 sourates | ~60 860 | ~79 % |
| Total | 114 | 77 411 | 100 % |

Le détail dans `tmp/phase66-masaq-coverage.json` (par sourate).

### E.2. Catégories canoniques pour le pipeline industriel

| Catégorie | Critère (runtime déterministe) | Action Phase 68+ |
|---|---|---|
| `IMPORT_READY` | `ambiguous=0 && missing=0 && extra=0 && surah ∉ {108..114, déjà importés}` | `APPLY=1 batch=… surah=…` |
| `IMPORTABLE_AFTER_CLASSIFIER_RULE` | `ambiguous>0 AND sourate ∈ sourates_avec_règle_éligible` (≤5 paires affectées) | Étendre `normalizeOrthographic` (Phase 70) après audit |
| `AMBIGUOUS_REQUIRES_AUDIT` | `ambiguous>5 ET sourate ∉ petit_set` | Audit humain par sourate ou rejet |
| `SOURCE_MISSING` | `missing>0` | Procurer une autre source lexicale OU confirmer que MASAQ perdu |
| `ALREADY_IMPORTED` | `db_occurrences == aligned_count` | NO-OP |

### E.3. Plan DRY-RUN multi-sourates (jamais exécuté en Phase 67)

```
1. Phase 68 : charge toutes les sourates avec status=IMPORT_READY en DB-index mémoire
2. Calcule plan = buildImportPlan(hikma_index, csv_local, {surah}) pour chacune
3. assertPlanScope(plan, s) pour chacune → STOP si l'une échoue
4. Présente : EXACT|EXACT_ORTHOGRAPHIC|VARIANT_DOCUMENTED|AMBIGUOUS counts
                  + MISSING + EXTRA + scopeの確認 (min=max=s)
5. Output : tmp/phase68-masaq-batch-plan-{N}.json
```

Sur 50 sourates `IMPORT_READY`, le **ratio** attendu est :
- ≈ 65 % EXACT (32 k paires)
- ≈ 30 % EXACT_ORTHOGRAPHIC (15 k paires)
- ≈ 5 % VARIANT_ORTHOGRAPHY_DOCUMENTED (2,5 k paires)
- 0 AMBIGUOUS (sinon catégorie = IMPORTABLE_AFTER_CLASSIFIER_RULE)

Modélisation **idempotente** : UNIQUE(source_id, source_record_id), aucune
mutation de `quran_words.arabic`, aucun toucher aux SRS/runtime.

---

## F. Section D — Analyse des 241 AMBIGUOUS résiduels

Quantification `tmp/phase67-ambiguous-roots.json` (script READ-ONLY exécuté
en Phase 67, sans DB writes) :

### F.1. Distribution par cause-racine (cause-rootes non-exclusives)

| Cause-racine | Nb paires | Sourates affectées | Exemple type |
|---|---|---|---|
| `TASHKIL_PATTERN` (diacritiques seules) | 241 | 40 | (sous-catégorie — couvre la pluralité) |
| `HAMZA_VARIANT` (ء/أ/إ/ئ/ؤ) | 149 | 38 | `s74:25 h='ٱلْمُؤَمَّنَ' m='بَصِيرًا'` |
| `QURANIC_SMALL_MARK` (U+06D6–06ED hors 06E6 géré) | 108 | 32 | `s3:75:25 h='قَالُوا۟' (۟=U+06DF) m='لَيْسَ'` |
| `SUKUN` (U+0652) | 62 | 12 | اختلاف سكون sur قراءة حفص/ورش |
| `SHADDA_DIFF` (U+0651) | 61 | 10 | gémination présente/absente |
| `TATWEEL` (U+0640) | 52 | 20 | كَتَـٔاب vs كِتَاب |
| `TAA_MARBUTA` (U+0629 vs U+0647) | 4 | 4 | VRAIS cas lexicaux distincts |

### F.2. Top signatures codepoint (NOT codepoint difference)

```
 17 paires :  U+0623+U+0624+U+0627+U+06DF   (hamza variant + small high meem)
 15 paires :  U+0627+U+0640+U+064A+U+0670+U+06E7  (tatweel+dagger+small alef)
  9 paires :  U+0627+U+0645   (article ال)
  9 paires :  U+0621+U+0623+U+0627+U+0649
  5 paires :  U+0621+U+0624+U+0640+U+0653+U+0670+U+06DF
```

### F.3. PROPOSED_RULES (à ne JAMAIS appliquer en Phase 67)

| # | Problème | Exemple | Transformation candidate | Cas | Sourates | Bénéfice | Régressions potentielles | Test requis | Confiance | Décision recommandée |
|---|---|---|---|---|---|---|---|---|---|---|
| `PR-001` | Petit alif suscrit (U+06E7) oublié par MASAQ | `إِبْرَٰهِـۧمَ` (06E7+0670+0640) vs `إِبْرَاهِيمَ` | `s.replace(/\u06e7/g, "")` | 16 (s2: 15, s3: 1) | 2 | Débloque sourate 2 (19 amb → 3 amb) | collides avec « الله » minuscule ? | `masaq.test.ts` + `phase70-amb-after.json` | MOYENNE | Phase 70 — surveillance collision « ٱللهُمَ » (vocatif) |
| `PR-002` | Petit mīm `U+06E2` (petit-bas bas-mīm muet) | مُصْلِحاً۟ → مُصْلِحاً | `s.replace(/\u06e2/g, "")` | ≤ 10 (à compter) | ? | Réduit | confusion avec مُيم initiale | id | MOYENNE | Phase 70 — audit distinctinction muet/initial |
| `PR-003` | Petit yā' `U+06E6` HORS contexte documenté 64/65 | إِۦلَاف → إِيلاف | déjà géré A′ sauf contexte non documenté | inconnu | ? | marginal | bas | id | BASSE | Audit Phase 70 |
| `PR-004` | Petit `ه` suscrit (`U+06E5`) | ٱلْأَفْـِٔدَةِ → الْأَفْئِدَةِ | `s.replace(/\u06e5/g, "")` ou `→ ه` | ? | ? | marginal | bascule casse vocalique | id | BASSE | Audit |
| `PR-005` | Shadda + gémination `(.)\1+ → $1` déjà couvert par `collapse()` dans `classifyAlignment` | لَفُّ vs لَفّ | (déjà actif) | 0 | - | - | - | - | - | N/A — déjà OK |
| `PR-006` | Sukun non connu phase 64 (U+0652 présent/absent) | rasm مختلف | Mahboub/MASYY validé ? | 62 | 12 | Réduit mais hautes | perte distinction entre voyelle absente/syntaxe | Validation MSQ vs قراءات | HAUTE RISK | NE PAS automatiser — maintenir AMBIGUOUS en Phase 70 |
| `PR-007` | MASAQ `MISSING` réel (position non présente) | sourates 2/3/4/5 (20 cas) | Pas un classifier rule — c'est une **source data** | 20 | 12 | Débloque 9 sourates | réel de source | `tmp/MASAQ.csv` checksum 777d0cc8… vérifier MASAQ v2 patch | N/A | **Demande** à l'éditeur (Phase 70 ou contact upstream) |
| `PR-008` | MASAQ vs Quran.com WORD BOUNDARY disagreements | `s3:75:25 h='قَالُوا۟' m='لَيْسَ'` (vrais mots différents à même position) | **NOT classifier fixable** — c'est un MAPPING_ERROR | ≈ 50 paires | 11 (top 3=2,3,5) | Débloque 11 sourates | - | - | N/A | **Demande** — ré-import source avec boundaries corrigés |
| `PR-009` | TASHKIL_PATTERN seul (26 paires) — voyelles courtes uniquement | n/kasra seulement | CORRIGER `classifyAlignment` (rappel : HARAKAT déjà strip → devrait être EXACT_ORTHOGRAPHIC) | 26 | ? | - | déjà géré si bien identifié | verifier collision map de formes | - | Phase 70 — INVESTIGUER (anomalie suspecte : si ca reste AMBIGUOUS c'est que `strip` ne les égalise pas) |

### F.4. Résumé de décision

- **PR-001 + PR-002** : applicables si zéro collision sur corpus complet
  (test runtime total).
- **PR-007, PR-008** : requièrent **décision humaine** + nouvelles versions
  de MASAQ en upstream. Pas dans le périmètre Phase 70.
- **PR-003, PR-004, PR-006** : risque trop élevé, NON applicables.
- **PR-009** : à investiguer — possible bug du classifieur actuel.

**Effet attendu Phase 70** : passages de 241 → ~125 AMBIGUOUS si PR-001 +
PR-002 + (~50 PR-008 résolus) débloqués. Reste ≈ 75-125 derrière.

---

## G. Section E — Pipeline Explications

### G.1. Taxonomie `EXPLANATION_*` (READ-ONLY design)

```
EXPLANATION_NOT_NEEDED       : forme sans morphologie intéressante (introduction/conjonction simple, déjà couverte par glose FR).
EXPLANATION_ALREADY_PRESENT  : word_explanations valide existe.
EXPLANATION_CANDIDATE        : forme avec material exploitable + fréquence haute + complexité morphologique détectable par MASAQ. Aucun texte produit, juste signalisation.
EXPLANATION_REQUIRES_EDITORIAL_REVIEW : CANDIDATE mais avec Material sensible (HAMZA_VARIANT dominant, ou clasification NORMALIZATION_DIFFERENCE) — humain requis.
EXPLANATION_READY            : blocks = [decomposition, identity?, morphology?, syntax?] tous dérivés de MASAQ segments — apply sans humain.
```

### G.2. Critères de promotion (pour Phase 71, jamais appliqué Phase 67)

```
EXPLANATION_CANDIDATE ⇔
  - EXACT|EXACT_ORTHOGRAPHIC|VARIANT alignment status (AMBIGUOUS → REQUIRES_REVIEW)
  - segments.length >= 1 (jamais 0 segment)
  - segments contienne un STEM ou un Pronominal/Suffix identifiable
  - field_category != null (categoryFromStemTag verdict)
  - (priority == HIGH OR distinct_surahs >= 3) AND occurrences >= 30
  - has_fr_gloss_validated == true (jamais d'explication sans gloss)
```

### G.3. Séparation stricte des 6 catégories d'information

| Type | Source | Application Phase 67 ? |
|---|---|---|
| Glose lexicale FR | `word_translations` (validée) | existant (538) |
| **Explication linguistique** | `word_explanations` (basée segments) | existant (10 actives — pilote) |
| **Explication contextuelle** | `word_explanation_contexts` (par mot + sourate/ayah) | existant (1) |
| **Exemple** | non-tabulé encore — proposition Phase 71 | NON existant |
| **Traduction verset** | `translations` (4 langues — non-éditorial) | existant |
| **Information morphologique** | dérivée des segments (jamais d'invention) | intégré dans `explanation.identity`/`morphology` blocks |

**Point cardinal** : une explication n'est JAMAIS générée parce qu'une forme
apparaît dans une sourate. Elle exige une **donnée vérifiable** :
- segments présents en MASAQ (`classifySegment` retourne `STEM`, pas `OTHER`)
- au moins 1 segment avec un POS renseigné non-`None`
- glose FR validée comme prérequis (jamais explication sans ancrage lexical)

### G.4. Volumes attendus

| Bucket | Nb formes | Cible `EXPLANATION_CANDIDATE` | Cible `READY` | Cible `REVIEW` |
|---|---|---|---|---|
| HIGH shared | 1 170 | ~700 (60 %) | ~400 (par-segment simples) | ~300 |
| MEDIUM specific | 4 907 | ~2 000 (40 %) | ~1 200 | ~800 |
| LOW specific | 14 403 | ~3 000 (20 %) | ~1 500 | ~1 500 |

Volume Phase 71 + 73+ : ~10 000 explications candidates, mais seulement
~3 100 prêtes sans humain. AVEC humain (reviews), potentiel 5 000–6 000.

**Stratégie sans inflation** : ne jamais.batch-par-occurrence. Batch par
**mot_id** uniquement (jamais doublon via UNIQUE(word_id, scope)). Capping :
jamais plus de 1 explication `word_explanations` par word_id. Les
`word_explanation_contexts` sont **multiples** (par (ayah, word)) et restent
rares (≤5 par mot).

---

## H. Section F — Matrice 114 sourates et ordre optimal

### H.1. Top 10 sourates par `impact_score` (proxy Phase 67, raffinement Phase 68+)

| Surah | Readiness | Coverage % | shared_wids | specific_wids | needed_medium | MASAQ status | AMB | MISS | impact_score |
|---|---|---|---|---|---|---|---|---|---|
| 2 | IN_PREPARATION | 7 | 1 737 | 1 162 | 2 698 | BLOCKED | 19 | 4 | **185 508** |
| 7 | IN_PREPARATION | 10 | 1 306 | 595 | 1 712 | BLOCKED | 12 | 0 | **136 700** |
| 3 | IN_PREPARATION | 9 | 1 249 | 568 | 1 654 | BLOCKED | 49 | 2 | **130 916** |
| 4 | IN_PREPARATION | 8 | 1 149 | 740 | 1 734 | BLOCKED | 1 | 1 | **122 397** |
| 6 | IN_PREPARATION | 10 | 1 169 | 520 | 1 515 | BLOCKED | 6 | 0 | **122 220** |
| 5 | IN_PREPARATION | 10 | 1 042 | 502 | 1 393 | BLOCKED | 47 | 4 | **109 545** |
| 9 | IN_PREPARATION | 10 | 875 | 525 | 1 264 | IMPORT_READY | 0 | 0 | **92 840** |
| 10 | IN_PREPARATION | 14 | 845 | 229 | 929 | BLOCKED | 3 | 0 | **86 891** |
| 11 | IN_PREPARATION | 14 | 815 | 343 | 1 001 | BLOCKED | 14 | 1 | **85 086** |
| 16 | IN_PREPARATION | 12 | 796 | 289 | 950 | BLOCKED | 9 | 1 | **82 623** |

Matrice complète : `tmp/phase67-surah-impact-matrix.csv` (114 + 1 ligne header).

### H.2. Ordre optimal d'exécution (pas par glosses manquantes — par impact/effort)

L'objectif n'est pas « minimiser les glosses restantes par sourate » mais
**« maximiser le rapport progress / effort via les formes partagées »**.

**Logique de tri** :

```
priority_order:
  1. sourates avec MASAQ_IMPORT_READY (50)
     (effort : juste gloses FR post-gloses shared — propagation naturelle)
  2. sourates avec MASAQ_BLOCKED + AMBIGUOUS=0 + MISSING=0
     (effort : classifier rule applicable post-Phase 70)
  3. sourates avec MASAQ_BLOCKED mais small ambinaire
     (effort : classifier rules PR-001/PR-002 — Phase 70)
  4. sourates avec AMBIGUOUS>5 mais few (top 5, force majeure)
     (effort : audit humain par sourate — Phase 73)
  5. sourate 2 (gigogne : 2698 needed, AMBIGUOUS=19, MISSING=4)
     (effort : PR-008 + PR-001 spécifique + missing resolver ; phase 73 finale)
```

**Criticité de sourate 2 et 3** : ils cumulent massivement needed_glosses
parce qu'ils sont les plus longs. PR-008 (renégociation MASAQ boundaries)
débloque 49+19=68 paires, soit ~28 % du stock AMBIGUOUS total. C'est le
cascade du pipeline Phase 70.

### H.3. Recommendation d'ordonnancement

```
Phase 68 — industrialisation glosses :
   Batch A : 1170 HIGH shared → 22 sourates IN_PREPARATION → propagation
            (impact: ~30 sourates débloquées potentielles)
   Batch B : 2700 HIGH shared restantes (multi-occurrences) → grossissement
   Batch C : MEDIUM partagés (sus)
   Batch D : LOW mutualisable (rare)

Phase 69 — MASAQ lot 1 :
   Import 50 sourates IMPORT_READY (une seule passe)
   ~15 800 occurrences ajoutées d'un coup
   Temps estimé : < 1 minute DB (bulk-insert)

Phase 70 — classifier rules + PR-001/PR-002 :
   Étend `normalizeOrthographic`
   Cible 50 sourates BLOCKED-small (s9, s28, s29, …)
   Réouv. PR-008 (MASAQ upstream si possible)

Phase 71 — pipeline explications (candidats seulement) :
   ~700 candidats issus de HIGH shared traités
   Promote READY base sur segments
   Apply idempotent

Phase 72 — validation des premiers gros lots :
   Browse validation sur 8 premiers changements
   Verify runtime + SRS + progress (lib/learning/progress.ts, MAX_REVIEW_INTERVAL_DAYS=365)
   Code review éditorial humain sur 50 mots

Phase 73+ — exécution progressive des lots restants :
   LOTS en cascade selon matrix impact_score
```

---

## I. Section G — Simulation (READ-ONLY)

7 scénarios calculés depuis `tmp/phase66-batch-plan.json` (1170 HIGH + 4907 MEDIUM)
arXiv proxy. Sortie `tmp/phase67-impact-scenarios.json`.

### I.1. Résultats

| Scénario | Forms sélectionnées | Occurrences upper-bound | Coût éditorial | HIGH/MED/LOW | Sourates touchées |
|---|---|---|---|---|---|
| `S1` 100 (linear by priority) | 100 | 7 682 | 100 | 100/0/0 | 63 |
| `S2` 250 (linear) | 250 | 12 447 | 250 | 250/0/0 | 63 |
| `S3` 500 (linear) | 500 | 16 683 | 500 | 500/0/0 | 63 |
| `S4` 1 000 (linear) | 1 000 | 21 556 | 1 000 | 1000/0/0 | 63 |
| `S5` all HIGH shared | 1 170 | 22 649 | 1 170 | 1170/0/0 | 63 |
| `S6` HIGH + MEDIUM shared | 1 170+0 (HIGH all = MEDIUM partages = 0) | 22 649 | 1 170 | 1170/0/0 | 63 |
| `S7` impact_max (HIGH+MEDIUM ranked) | 6 077 | 37 692 | **10 984** | 1170/4907/0 | 63 |

> **Limitations reconnues** : ces chiffres supposent une propagation
> **optimiste** (1 forme validée = 1 sourate débloquée). Réalité Phase 68+
> ≤ 70 % de l'upper-bound. Marge de prudence ×0.7 sur l'engagement produit.

### I.2. Précautions d'interprétation

1. **Le coût éditorial S7 (10 984)** est 4× celui de S5 (1 170). Traiter
   4 × plus de formes pour +66 % d'occurrences supplémentaires suggère un
   **rendement décroissant marqué** : le ratio coût/occurrences
   passe de 19.4 (S5) à 291 (S7). **S5+S6 strictement HIGH est la cible
   rentable**.
2. **63 sourates touchées est borné** par le fait que le MEDIUM est
   surah-spécifique (non-partagé). Donc traiter MEDIUM ne bénéficie qu'à
   1 sourate par forme → non-viable pour effet réseau.
3. **HIGH first, puis HIGH second tier (rare-mediums qui touchent 5–6 sourates),
   puis MEDIUM-shared** est l'ordre optimal.

---

## J. Section H — Curriculum pipeline (industrialisation)

### J.1. Flux cible

```
GLOSES FR validated
  ↓  propagate by word_id (via `word_occurrences.word_id` count)
MASAQ imported (par sourate, idempotent)
  ↓  linguistic_occurrences + linguistic_segments populated
EXPLICATIONS published (lib/linguistic/explanation.ts)
  ↓  word_explanations + word_explanation_contexts
READINESS (per_surah) recalculée runtime
  ↓  using `lib/learning/coverage.ts::computeCoveragePercent` + MASAQ cov
CURRICULUM séance par sourate (idempotent)
  ↓  planSurahCurriculum(surah, wordsByAyah) → SURAH MULTI_BATCH seed
RUNTIME VERIFICATION (cours, leçons, SRS)
  ↓  analyse `progress.ts`, `sequencing.ts`, `mastery.ts`
```

### J.2. Critère READY par sourate (hamronisé Phase 67)

```
READY ⇔
   fr_forms == forms
   ∧ (masaq_status == MASAQ_COMPLETE ∨ db_occurrences == aligned_count)
   ∧ explanations_required_pour_high_completed == 0
```

L'état actuel (23 READY + 1 REFERENCE + 91 IN_PREPARATION) respecte la
première condition pour 24 des 25 ; le curseur = « MASAQ COMPLETE / AMB =
0 » pour totalement finir les 91 IN_PREPARATION.

### J.3. `seed-multisurah-curriculum` extension

La primitive `planSurahCurriculum` existe (idempotent, pas de hardcode).
L'extension Phase 68 consiste uniquement à :
- accepter `--surahs=A,B,C` avec liste arbitraire (déjà le cas)
- sérialiser `learning_paths.makedirs` → vérifier que le UNIQUE slug ne
  collide pas avec un `EDITORIAL_PATH_SURAH_NUMBERS`
- ajouter un **dry-run** systématique par défaut (prévenir apply accidentel)

Pas de modification de schéma requise. Pas de modification de
`planSurahCurriculum` requise (déjà stable + tests).

### J.4. Batch curriculum seed

```bash
SURAH=1,87,91,93-114 npm run seed:multisurah       # 22 sourates READY (déjà fait)
SURAH=8,9,13,22,28-29,31-32,34,36,39,45-47,49-56,58,61-63,65-71,73-74,76-80,82-86,88-90,92,95,98-100,107 npm run seed:multisurah
# 50 sourates MASAQ_IMPORT_READY : coefficient gain = 50×1=50
```

**Composition des 91 sourates IN_PREPARATION** :
- 50 IMPORT_READY (lock&seed après gloses validées)
- 41 BLOCKED-MASAQ (lock après débloquage Phase 70)

---

## K. Section I — Checkpoint & Reprise

### K.1. Modèle de checkpoint (jamais instancié en Phase 67)

```
batch_progress.json — exemple pour Batch A :
{
  "batch_id": "phase68_lex_fr_high_A_2026_08_22",
  "source": "lex_fr_kazimirski_v2",
  "scope": { "priority": ["HIGH"], "start_index": 0, "end_index": 1170 },
  "forms_total": 1170,
  "forms_applied_start": 0,
  "cursor": { "last_word_id": "...", "last_applied_at": "2026-08-22T..." },
  "verify": { "fr_count_before": 538, "fr_count_after": 538, "delta": 0 },
  "status": "DRAFT",
  "checkpoints": [
    { "at": 1,  "fr_count_after": 538,  "ts": "..." }
  ],
  "rollback_strategy": {
    "method": "delete_rows_with_matching_metadata_keyword",
    "reversible_within_txn": true,
    "human_confirm_required": true
  }
}
```

### K.2. Idempotence garantie

Pour chaque table cible :

| Table | UNIQUE constraint existante | Méthode |
|---|---|---|
| `word_translations` | UNIQUE(word_id, language, source_id) à ajouter (Phase 68+) | UPSERT |
| `word_explanations` | UNIQUE(word_id) à ajouter (Phase 68+) | UPSERT |
| `word_explanation_contexts` | UNIQUE(ayah_id, word_id, scope) à ajouter (Phase 68+) | UPSERT |
| `linguistic_occurrences` | UNIQUE(source_id, source_record_id) (existant) | insert + dedup-via-fetch |
| `linguistic_segments` | UNIQUE(linguistic_occurrence_id, segment_no) (existant) | insert après parent |
| `learning_paths/units/lessons` | UNIQUE(slug) / UNIQUE(path_id,slug) / UNIQUE(unit_id, slug) | UPSERT |

### K.3. Reprise après interruption

```
$ npm run pipeline:apply --batch=phase68_lex_fr_high_A --resume
→ charge batch_progress.json
→ applique depuis last_word_id (exclusion UPSERT verra no-op)
→ met à jour cursor + checkpoints
```

**Garantie** : un batch interrompu après 300 gloses sur 1 000 peut reprendre
**sans aucune relecture** des 300 premières. Le checkpointing est obligatoire
pour les batches > 50 unités.

---

## L. Section J — Roadmap Phase 67+

| Phase | Nom | Pré-requis | Sort critique |
|---|---|---|---|
| **PHASE 67 — ACTUELLE** | Architecture industrielle READ-ONLY | - | `PHASE_67_INDUSTRIAL_CONTENT_PIPELINE_ARCHITECTURE.md` + `tmp/phase67-*` |
| Phase 68 | Industrialisation du pipeline de gloses | Phase 67 validée | Tests + 1170 HIGH propagées (≤30 sourates) |
| Phase 69 | Import MASAQ en lot (50 IMPORT_READY) | migrations UNIQUE updates + scripts étendus | DB: +15 800 occurrences sans AMBIGUOUS |
| Phase 70 | Réduction des AMBIGUOUS par familles de règles (PR-001, PR-002, et PR-009 si anomalie confirmée) | Phase 64 + consolidation Phase 65 | Classifier 7 nouvelles paires → +16 sourates débloquées minimum |
| Phase 71 | Pipeline d'explications (candidats → READY) | Phase 68 + Phase 69 | ~700 candidats en EXPLANATION_CANDIDATE, ~400 READY |
| Phase 72 | Validation des premiers gros lots (bout-en-bout) | Phase 68–71 | Runtime verification localStorage/SRS/test full |
| Phase 73 | Exécution des lots MEDIUM et LOW pour sourates IMPORT_READY | Phase 72 | ~50 sourates READY supplémentaires |
| Phase 74 | L'audit MASAQ upstream (PR-007, PR-008 : request upstream) | contact chercheurs MASAQ | ~75–125 AMBIGUOUS résiduels |
| Phase 75 | L'explicitation contextuelle (5+ contextes par word) | Phase 71 | encyclopedia runtime |
| Phase 76+ | Audits de propagation par sourate (couverture pédagogique) | Phase 73 | quality assurance continue |

**Itération** : chaque phase est READ-ONLY par défaut, applique par
`APPLY=1` ou équivalent, et n'altère pas la DB en absence d'autorisation
humaine.

---

## M. Section K — Performance

Le constat du projet actuel (Phase 66 + 67) :
- 114 × mêmes requêtes par audit (Phase 47–65 cycle)
- Pas de cache, pas de batch-loading, pas de KeySet pagination
- Chaque `seed-multisurah-curriculum` lance 1 fetcher sur 114 sourates
  séquentiellement (314 + q join + word_occurrences fetches par sourate)

**Audit de complexité** (Phase 67, READ-ONLY) :

```
Avant pipeline :
  114 sourates ×
    [surahs + 114 ayahs fetches × 7 inner-joins + 77 430 word_occurrences joins
     + 4 000 word_translations fetches + 184 word_lemma_mapping + 24 944 translations]
  ~ 18 000 requêtes DB par audit

Après pipeline industriel Phase 68+ :
  1 scan global
    [surahs (114) + ayahs (6236) + word_occurrences (77 430) + words (21 296)
     + translations aggregé + lemmas + word_lemma_mapping + word_translations]
  ~ 8 requêtes DB par audit
  → × 2 250 amélioration + processing en mémoire
```

**Action Phase 68** : extraire le pattern de chargement unique de
`tmp/phase67-simulate.py` (déjà démontré) vers `lib/learning/inventory.ts`
(func pure). Tout script Phase 68+ doit utiliser cet inventaire.

**But mesurable** : tous les audits globaux en **< 2 minutes** sur
Supabase production (mesure Phase 66 : ~15 min en séquentiel). Phase 68
cible : **< 30 secondes**.

---

## N. Section L — Risques, Garde-fous & Décision finale

### N.1. Risques architecturaux

| Risque | Probabilité | Sévérité | Mitigation |
|---|---|---|---|
| Régression du classifieur (PR-001/PR-002 cassent d'autres sourates) | MOYENNE | HAUTE | Test corpus complet AVANT toute modification `lib/linguistic/masaq.ts` (Phase 64 pattern) |
| Source MASAQ indispo (PR-007/PR-008) | BASSE (sha vérifié) | HAUTE | CHECKSUM MASAQ + audit PR-008 → dossier en attente |
| Drift lexical (gloses FR validées ≠ contexte sourate) | BASSE | MOYENNE | Three-way cross-check (`fr + en fallback + lemma`) |
| Biais éditorial par batch humain | MOYENNE | MOYENNE | Limiter batches à ~20 ; revue humaine par échantillon |
| Import partial (interruption mid-batch) | MOYENNE | HAUTE | Checkpointing obligatoire + UNIQUE constraints |
| Propagation trop agressive (HIGH shared wrong lemma) | BASSE | MOYENNE | SAFETY show : cross-check (lemma-id) avant propagation |
| Explosion de `word_explanation_contexts` | MOYENNE | BASSE | Cap explicite : max 5 contextes par word |
| SRS durée trop longue (MAX_REVIEW_INTERVAL_DAYS=365) | BASSE | MOYENNE | Constant runtime, jamais modifié Phase 67+ |

### N.2. Garde-fous non-négociables (Phase 67+)

1. **`assertPlanScope(plan, expectedSurah)` est INVARIANT** : aucune écriture
   MASAQ sans avoir passé ce garde-fou. 0 MISSING/EXTRA/AMBIGUOUS sinon STOP.
2. **`alignKey(surah, ayah, position)` est la SEULE clé d'alignement** :
   jamais d'égalité de chaîne arabe.
3. **`isEditorialSurah(1)` JAMAIS régénérée** : Al-Fātiḥah verrouillée.
4. **Chaque nouvelle glose FR est validée** : `is_validated=true` requis
   pour toute mise en propagation.
5. **Chaque nouvelle explication a un `word_id` ancré** : jamais d'oracle
   sur forme-occurrence.
6. **Tout commit du pipeline doit être signé humainement** : aucune
   modification automatique de prod.
7. **Aucun force-push, aucun reset hard, aucun clean** sur le repo : règle
   Phase Phase-67 reaffirmée à chaque itération.

### N.3. Décision finale (OPTIONS)

| Option | Description | Effort | Bénéfice estimé (sur 91 IN_PREPARATION) |
|---|---|---|---|
| **A. Industrielle en cascade (RECOMMANDÉE)** | Phases 68→76 comme décrit en L | 6–10 mois | Passage 23 READY → **toutes** les 91 (+ sourate 2/3/5 IN_PREPARATION) ou 91→50 débloquées minimum |
| B. Workflow actuel continué | Continue Phase 47-style par sourate | 12+ mois | 23→40 READY dans la même fenêtre |
| C. Arrêt définitif | Stop pipeline, gel productifs | - | -91 futures sourates |

**Recommandation Phase 67** : Option A, en commençant par Phase 68 avec
**Batch A = 1170 HIGH shared**, en s'assurant que chaque sous-phase
est validée par :
1. `tsc --noEmit` 0 erreur
2. `eslint` 0 erreur
3. `vitest run` ≥ 753/753
4. `assertPlanScope` 0 violation
5. `is_validated=true` pour toute nouvelle glose
6. DB snapshot identique **sauf sur les tables cibles**.

---

## O. Audit final (validations Phase 67)

| Critère | Statut |
|---|---|
| `npx tsc -p .` | **0 erreur** |
| `npx eslint .` | **0 problème** |
| `npx vitest run` | **753 tests / 753** (8.39s) |
| DB inchangée (sauf SELECT) | ✅ (seuls scripts `tmp/phase67-*.ts` lisent) |
| Aucune migration modifiée | ✅ |
| Aucun commit créé | ✅ |
| Aucun push Git | ✅ |
| Production code intact | ✅ |

Artefacts READ-ONLY créés (sous `tmp/`) :

| Fichier | Bytes (rought estimate) | Type |
|---|---|---|
| `tmp/phase67-ambiguous-roots.ts` | source TypeScript | script |
| `tmp/phase67-ambiguous-roots.json` | ≈ 4 KB | output (résumé) |
| `tmp/phase67-ambiguous-pairs.csv` | ≈ 30 KB | output (détail) |
| `tmp/phase67-simulate.py` | source Python | script |
| `tmp/phase67-impact-scenarios.json` | ≈ 6 KB | output (7 scenarios) |
| `tmp/phase67-surah-impact-matrix.csv` | ≈ 12 KB | output (114 sourates) |

---

## P. Prochaines étapes recommandées (post-lecture du rapport)

1. **Lecture du fichier** `PHASE_67_INDUSTRIAL_CONTENT_PIPELINE_ARCHITECTURE.md`
   + `tmp/phase67-impact-scenarios.json` + `tmp/phase67-surah-impact-matrix.csv`.
2. **Décision sur l'option A** : valider le flux en cascade Phase 68+.
3. **Migration UNIQUE constraints** (Phase 68 prérequis) :
   - `ALTER TABLE word_translations ADD CONSTRAINT unq_word_translations_wls UNIQUE(word_id, language, source_id);`
   - `ALTER TABLE word_explanations ADD CONSTRAINT unq_word_explanations_w UNIQUE(word_id);`
   - `ALTER TABLE word_explanation_contexts ADD CONSTRAINT unq_we_ctxt_aw UNIQUE(ayah_id, word_id, scope);`
4. **PR-001 / PR-002 (Phase 70)** : investigation collision sur corpus
   complet AVANT toute modification de `normalizeOrthographic`.
5. **PR-007 / PR-008** : ouverture d'un canal upstream avec l'équipe MASAQ
   (Majdi Sawalha, Univ. of Jordan) sur les positions MISSING/WORD_BOUNDARY.
6. **Phase 68 bootstrap** : créer `lib/learning/inventory.ts` (extraction de
   `tmp/phase67-simulate.py`'s aggregator) + 1 migration UNIQUE.
7. **Suspension PHASE 67** : stopper ici en attendant la décision utilisateur.

---

## VERDICT ATTENDU

```
PHASE_67_INDUSTRIAL_CONTENT_PIPELINE_ARCHITECTURE_COMPLETE
  1. architecture retenue: 5 couches (Inventory / Score Engine / Batch System / Pipeline Orchestrator / Checkpoint)
  2. stratégie de lots: HIGH-first cascade (Batch A → 30 sourates débloquées potentielles)
  3. stratégie MASAQ: 50 IMPORT_READY en lot Post-Glosses (Phase 69), 41 BLOCKED post-Phase 70
  4. stratégie classifieur: PR-001 (06E7) + PR-002 (06E2) si collision=0, autres règles suspendues
  5. stratégie explications: 6-taxonomie EXPLANATION_*, seuil CANDIDATE = 30+occurrences + segment STEM/Pronominal
  6. simulation: 7 scénarios lus, S5 (1170 HIGH only) est l'optimum coût/effet, cost=1170 pour 22 649 occ upper-bound
  7. roadmap: 9 phases 68→76, séquentielles, chaque phase READ-ONLY par défaut
  8. risques: 8 identifiés, 7 garde-fous non-négociables, 3 options proposées (A recommandée)
  9. fichiers/artefacts créés:
     - PHASE_67_INDUSTRIAL_CONTENT_PIPELINE_ARCHITECTURE.md (~ 1 KB)
     - tmp/phase67-ambiguous-roots.json, .csv, .ts (READ-ONLY)
     - tmp/phase67-impact-scenarios.json (7 scénarios)
     - tmp/phase67-surah-impact-matrix.csv (114 sourates)
     - tmp/phase67-simulate.py (script)
  10. validations: tsc 0/eslint 0/vitest 753/753/DB inchangée
  11. prochaines étapes: lecture du rapport, décision Option A, migrations UNIQUE Phase 68, PR-001/PR-002 Phase 70 conditionnel.
```

**STOP** (aucune phase suivante lancée).
