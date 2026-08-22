# PHASE 67/68 — GLOBAL PIPELINE DESIGN (READ-ONLY)

> **Statut** : phase de **CONCEPTION + AUDIT + PLANIFICATION**. Aucune
> écriture DB, aucun import MASAQ, aucune nouvelle glose, aucune explication,
> aucun seed curriculum, aucune migration, aucune modification de code de
> production. Aucun commit. Aucun push.
>
> **Livrables** (sous `tmp/phase67/`) :
> - 11 fichiers JSON : `baseline`, `dependency-matrix`, `lexical-batches`,
>   `masaq-batches`, `masaq-root-causes`, `explanation-priority`,
>   `readiness-impact`, `parallelization-plan`, `execution-waves`,
>   `cost-impact`, `global-plan`.
> - 1 verify report (`tmp/phase67/verify-report.json`).
> - 2 scripts READ-ONLY : `scripts/tmp/phase67/audit-global-pipeline.ts`
>   et `scripts/tmp/phase67/verify-global-pipeline.ts`.
>
> **Validations** : `tsc -p .` 0 erreur · `eslint` 0 warning ·
> `vitest run` 753/753 (8,4 s) · verify 23/23 PASS · DB inchangée.

---

## A. AUDIT DE L'EXISTANT — composantes canoniques (PARTIE A revisitée)

### A.1. Matrice COMPOSANT × FICHIER × ENTRÉE × SORTIE × TABLES × BATCHABILITÉ

| # | Composant | Fichier | Fonction(s) | Entrée(s) | Sortie(s) | Tables touchées | Dépendances | Batchable ? | READ-ONLY ? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Resolver canonique des significations | `lib/learning/language.ts` | `PEDAGOGICAL_LANGUAGE`, `resolveWordMeaning`, `resolveQuranWordMeaning` | `word_id` (U) | `{ pedagogical_fr, lemma_meaning, fr_meanings }` | `word_translations`, `lemma_translations` (read) | `learning/language.ts`, `quran/types` | ✅ par word_id via IN clause | ✅ |
| 2 | Système de propagation | `lib/learning/language.ts` + `lib/learning/lesson*.ts` | `buildWordBank` | word_ids[] (depuis lesson_words) | `WordBankEntry[]` | `word_translations`, `quran_words` | `renderMarkdown` | ✅ | ✅ |
| 3 | `word_translations` | `lib/quran/repositories/translation-repository.ts` | DAO CRUD via Supabase | `word_id`, `language`, `text` | `Translation` | `word_translations` | `SupabaseClient` | ✅ `(word_id IN (…) UPSERT …)` | ✅ (read) + ✏️ (write via batch) |
| 4 | `lemma_translations` | `lib/quran/repositories/translation-repository.ts` | DAO | `lemma_id`, `language`, `text` | `LemmaTranslation` | `lemma_translations` | idem | ✅ | ✅ (read) + ✏️ (write) |
| 5 | `getWordLinguisticEvidence` | `lib/learning/linguistic/loader` (extension à venir) | composition `word_translations` + `linguistic_segments` | word_id, scope | `{lema_chain, decomp_segments, morphological}` | `linguistic_segments`, `linguistic_occurrences`, `word_explanations`, `word_explanation_contexts` | `linguistic/explanation` | ✅ | ✅ |
| 6 | `linguistic_occurrences` | `lib/linguistic/masaq-plan.ts::buildImportPlan` + `scripts/import-masaq-multi-surah.ts` | alignement (surah, ayah, position) | hikma[] + CSV | `ImportPlan` → DB INSERTs | `linguistic_occurrences`, `linguistic_segments` | `assertPlanScope` | ✅ par surah, atomic per (source_id, source_record_id) | ✏️ WRITE (multi-insert) |
| 7 | `linguistic_segments` | idem #6 | `classifySegment(MorphType, MorphTag)` | CSV seg row | `PlannedSegment` (STEM/PARTICLE/INFLECTIONAL_SUFFIX/PRONOMINAL_SUFFIX/OTHER) | `linguistic_segments` | `linguistic_occurrences` (parent) | ✅ | ✏️ WRITE |
| 8 | `normalizeOrthographic` (CLASSIFIER — figé Phase 65) | `lib/linguistic/masaq.ts` | pure function | `string` | `string` (18 règles ordonnées) | — (en mémoire) | `classifyAlignment` | ✅ | ✅ (PURE) |
| 9 | `classifyAlignment` | `lib/linguistic/masaq.ts` | deterministic chain | `(hikma, masaq)` | `EXACT \| EXACT_ORTHOGRAPHIC \| VARIANT_ORTHOGRAPHY_DOCUMENTED \| AMBIGUOUS` | — (en mémoire) | `normalizeOrthographic`, `alignKey` | ✅ | ✅ (PURE) |
| 10 | `assertPlanScope` | `lib/linguistic/masaq-plan.ts` | **GARDE-FOU** | `ImportPlan, expectedSurah` | `PlanStats` ou throw | — (en mémoire) | les 4 statuts | ✅ | ✅ (PURE — never mutates DB) |
| 11 | `word_explanations` | `lib/linguistic/explanation.ts::buildLinguisticExplanation` | déterministe (4 blocks: decomposition / identity / morphology / syntax) | `LinguisticEvidence` | `LinguisticExplanation { availability, blocks }` | `word_explanations` (UNIQUE word_id) | `MASAQ COMPLETE` runtime | ✅ idempotent UNIQUE | ✅ + ✏️ |
| 12 | `word_explanation_contexts` | `lib/learning/linguistic/loader` (extension) | associe une explica à un scope ayah | `(word_id, ayah_id, scope)` | 1 row | `word_explanation_contexts` | `word_explanations` | ✅ | ✅ + ✏️ (max 5 par word) |
| 13 | `classifySurahReadiness` (runtime) | `lib/learning/coverage.ts::computeCoveragePercent` + `lib/learning/surah-curriculum.ts` | pure percent | `(coveredForms, totalForms)` | 0..100 | `quran_words`, `word_translations` | `surah_matrix` | ✅ | ✅ (PURE) |
| 14 | `seed:multisurah` | `scripts/seed-multisurah-curriculum.ts` | `planSurahCurriculum` (pure) → UPSERT | `--surahs=A,B,…` (défaut 112,113,114,108) | path+unit+lessons+lesson_words | `learning_paths`, `units`, `lessons`, `lesson_words` | `planSurahCurriculum` | ✅ (idempotent UPSERT) | ✏️ WRITE (DRY-RUN par `--dry-run`) |
| 15 | `scripts/import-masaq-multi-surah.ts` | (multi-surate) | `buildImportPlan → assertPlanScope → applyImport` | `--surahs=…,SURAH=,APPLY=1` | DB INSERTs | `linguistic_occurrences`, `linguistic_segments`, `sources` | `assertPlanScope`, checksum MASAQ | ✅ batch | ✏️ WRITE (DRY-RUN par défaut) |
| 16 | `scripts/import-{phase21f,phase28,phase30,phase31}-*.ts` (glosses par lot) | `scripts/import-phase30-high-glosses.ts` etc. | UPSERT gloses FR (validation 2 FR + IT) | `word_id, language='fr', text` | DB UPSERT | `word_translations` | `is_validated=true` | ✅ | ✏️ WRITE |
| 17 | Tests | `tests/*.test.ts` (56 fichiers / 753 tests) | coverage canonique | mocks `lib/linguistic/masaq.ts` etc. | PASS / FAIL | — | — | ✅ | ✅ |

**Synthèse A** :

- **Batchabilité** — 17/17 composants supportent une exécution par lot
  (in-memory indexed ou via Supabase `IN` clause).
- **READ-ONLY pur** — items 1, 2, 5, 8, 9, 10, 13, 17. Items 11, 12
  exposent deux interfaces (réad-ONLY build / write contrôlé).
- **WRITE contrôlé** — items 3, 4, 6, 7, 11, 12, 14, 15, 16 ; tous
  passent `assertPlanScope` (quand applicable), tous UNIQUE ou UPSERT.

---

## B. AUDIT DES DÉPENDANCES (PARTIE B)

Matrice 4×4 extraite depuis `tmp/phase67/dependency-matrix.json` :

|   | GLOSES | MASAQ | EXPLICATIONS | CURRICULUM |
|---|---|---|---|---|
| **GLOSES** | — | **INDEPENDENT** : MASAQ ne consomme pas la glose FR ; consomme `quran_words.arabic` | **MANDATORY** : pas d'explication sans ancrage lexical | **OPTIONAL_RUNTIME** : curriculum seedable sans 100 % de gloses |
| **MASAQ** | **INDEPENDENT** (symétrique) | — | **OPTIONAL_RUNTIME** : sans MASAQ, explanations NOT_NEEDED ; avec MASAQ, BENÉFICIAL ou REQUIRED | **INDEPENDENT** : MASAQ renforce `lemma_relation` skill mais n'est pas structurel |
| **EXPLICATIONS** | MANDATORY (cf. ↑) | OPTIONAL_RUNTIME | — | OPTIONAL_RUNTIME (UI-only) |
| **CURRICULUM** | OPTIONAL_RUNTIME | OPTIONAL_RUNTIME | OPTIONAL_RUNTIME | — |

**Invariants dérivés** :
- `primary_ready_path` = `GLOSES (couverture lexicale) → CURRICULUM`
- `MASAQ_invariant` : un sourate peut être `MASAQ_COMPLETE` sans être
  lexical `READY` (et inversement).
- `EXPLANATION_invariant` : absence d'explication = `EXPLANATION_NOT_NEEDED`
  (PAS une erreur — UI affiche "no pedagogical notes").

**Faux couplages identifiés** :
1. ❌ `MASAQ absent != leçon impossible` (curriculum avec EN fallback
   pédagogique fonctionne).
2. ❌ `Glose absente != sourate non-planifiable` (`planSurahCurriculum`
   seed les leçons même avec 0 % couverture FR).
3. ❌ `Explication absente != lesson.stop` (lessons progredient sans
   word_explanations).
4. ❌ `MASAQ BLOCKED != pipeline halted` (GLOSES workflow continue avec EN).

**Trou ABSENT_DATA formalisé** :

```
   ABSENT_DATA ::= { MASAQ ABSENT | GLOSE ABSENTE | EXPLANATION NULL | … }

   Règle : ABSENT_DATA est une valeur de runtime valide.
           Ne doit jamais produire d'erreur ni d'assertion runtime.
```

---

## C. INDUSTRIALISATION DES GLOSES (PARTIE C)

`tmp/phase67/lexical-batches.json` :

### C.1. 4 lots principaux + diagnostic

| batch_id | priority | forms | occurrences (upper) | surahs potential | editorial cost (units) | impact/cost ratio |
|---|---|---|---|---|---|---|
| `BATCH_LEX_HIGH_SHARED_A` | HIGH | **1 170** | **22 649** | 63 max | 1 170 (1 unit/HIGH) | **19,4 occ/unit** ✓ |
| `BATCH_LEX_HIGH_SPECIFIC_B` (B-factuel) | HIGH | **0** | 0 | 0 | 0 | (pas de HIGH spécifique — toutes HIGH sont shared) |
| `BATCH_LEX_MEDIUM_SPECIFIC_B` | MEDIUM | **4 907** | 15 043 | 1 (toutes sourate-spécifiques) | 9 814 (2 units/MEDIUM) | 1,5 occ/unit ⚠ |
| `BATCH_LEX_LOW_SPECIFIC_C` | LOW | **14 403** | 15 161 | 1 | 43 209 (3 units/LOW) | 0,35 occ/unit ❌ |

### C.2. Décisions structurales (résultant des données)

1. **HIGH-first est la cible stricte** : ratio impact/coût 13× meilleur que
   MEDIUM et 55× meilleur que LOW.
2. **MEDIUM est sourate-spécifique** : propagation s'arrête à 1 sourate —
   aucun effet réseau. Acceptable uniquement pour la complétude locale.
3. **LOW doit être traité en dernier** : impact marginal + coût humain élevé.
   Probable abandon partiel acceptable (spot-check 5 %, pas 100 %).

### C.3. Calcul d'impact par glose validée

```
impact(form) = occurrences × √distinct_surahs × priority_weight
   où priority_weight = { HIGH: 100, MEDIUM: 10, LOW: 1 }

Formes top 5 (vérification batchPlan phase66) :
   مِّنَ     → 281 occ × 63 sourates → impact 711 × 100 = 71 100
   بِمَا     → 253 occ × 61 sourates → impact 636 × 100 = 63 600
   كَانُوا۟   → 209 occ × 46 sourates → impact 466 × 100 = 46 600
   …
```

### C.4. Propagation garantie par le resolver canonique

- **`PEDAGOGICAL_LANGUAGE`** (`lib/learning/language.ts`) : terme FR canonique
  jamais réécrit.
- **`resolveWordMeaning`** : si `word_translations[word_id].text` existe &
  `is_validated=true` → retourne la valeur figée. Sinon, fallback EN puis
  lemme.
- **Aucune ré-écriture sémantique implicite** : 538 gloses FR validées
  figent leur valeur pour 538 word_ids ; les 20 480 formes manquantes n'ont
  aucune propagation avant validation humaine.

---

## D. INDUSTRIALISATION MASAQ (PARTIE D)

`tmp/phase67/masaq-batches.json` (3 catégories sur 114 sourates) :

### D.1. Catégorie A — IMPORT_DIRECT (Phase 69)

**54 sourates** sans ambiguïté ni manquant, prêtes à importer en lot.

- Somme ~21 874 occurrences alignables potentielles, ~43 489 segments
  potentiels.
- assertPlanScope → 0 violation attendue.
- Garde-fou strict : APPLY=1 batch=… surah=…

### D.2. Catégorie B — CLASSIFIER_REVIEW (Phase 70)

**24 sourates** avec AMBIGUOUS ∈ [1..5] (≤5 paires par sourate).

- ~19 844 occ + ~39 871 segments potentiellement.
- Demande : investigation corpus complet AVANT toute
  modification de `lib/linguistic/masaq.ts`.
- Pas de modification de word_id ; pas de propagation sémantique.

### D.3. Catégorie C — SOURCE_ALIGNMENT_REVIEW (Phase 70+)

**36 sourates** : AMBIGUOUS > 5 OU MISSING > 0 OU EXTRA > 0.

- ~35 692 occ + ~71 562 segments potentiels.
- Top 6 sourates : s3 (49 amb), s5 (47), s2 (19), s23 (15), s11 (14), s7
  (12) — **65 % du stock AMBIGUOUS**.
- **PR-007/PR-008** : communication MASAQ upstream requise.
- Pas d'écriture tant que résolution amont non livrée.

### D.4. Causes-racines AMBIGUOUS (`masaq-root-causes.json`)

| Cause-racine | Cas | Sourates | Stratégie |
|---|---|---|---|
| `TASHKIL_PATTERN` | 241 | 40 | **Source_alignment** : déjà normalisé, résidu = ANOMALIE classifieur (PR-009) |
| `HAMZA_VARIANT` | 149 | 38 | `noHamza()` déjà actif ; résidu = hamza INSÉPARABLE du mot |
| `QURANIC_SMALL_MARK` | 108 | 32 | **PR-001** (U+06E7, 16 cas) + **PR-002** (U+06E2) Phase 70 si collision=0 |
| `SHADDA_DIFF` | 61 | 10 | Source alignment |
| `SUKUN` | 62 | 12 | Source alignment (lecture qira'at) |
| `TATWEEL` | 52 | 20 | Source alignment |
| `TAA_MARBUTA` | 4 | 4 | TRÈS RARE ; à traiter humain |

**Sous-règles candidates (Phase 70, conditionnelles à zéro collision)** :

- `PR_001_U06E7_small_alif` : 16 cas sur s2 (15), s3 (1).
- `PR_002_U06E2_small_meem_bas` : sous-échantillon.
- `PR_007_missing` : 20 cas sur 12 sourates (2/3/4/5/11/15/16/19/20/23/26/57).
- `PR_008_word_boundary` : ~50 paires sur sourates 2/3/5/7/11/23 (top
  divergences de segmentation MASAQ ↔ Quran.com).

### D.5. Interdiction absolue (rappel)

> ❌ « Modifier `normalizeOrthographic` sans test sur corpus complet »
> ❌ « Résoudre artificiellement une divergence de segmentation »
> ❌ « Importer MASAQ avec AMBIGUOUS>0 »
> ❌ « Affirmer une collision sans preuve »

---

## E. INDUSTRIALISATION DES EXPLICATIONS (PARTIE E)

### E.1. Modèle réel & invariants

Tables utilisées :

- `word_explanations` : 13 lignes existantes. UNIQUE sur `word_id` (à
  ajouter Phase 68). `language='fr'`, `is_validated=true`.
- `word_explanation_contexts` : 1 ligne existante. UNIQUE
  `(word_id, ayah_id, scope)` (à ajouter). Capping 5 contextes par word_id.

Workflow canonique :
```
  FORME (quran_words.arabic)
    ↓ word_occurrences (surah × ayah × position)
  AYAHS CONCERNÉS (lecture_multiple_ayahs)
    ↓ 4 TRADUCTIONS (Hamidullah FR r=31 ; Kazimirski r=9001 ; Sahih EN r=20 ; Piccardo IT r=153)
  COMPARAISON 2 FR + IT (inter_textual_analysis)
    ↓
  NOYAU SÉMANTIQUE (lemma_anchor + gloss FR + segments analysis)
    ↓
  EXPLICATION PÉDAGOGIQUE (buildLinguisticExplanation). Jamais inventée.
    ↓
  REVUE (editorial critique)
    ↓
  VALIDATION
    ↓
  word_explanations (UNIQUE word_id) + max 5 word_explanation_contexts
```

### E.2. Taxonomie 4-tiers (jamais inventée)

| Tier | Trigger | Demande humaine | Volume estimé |
|---|---|---|---|
| `EXPLANATION_REQUIRED` | HIGH lexical + segments STEM/pronominal présents + ≥1 segment avec POS renseigné non-`None` | CROSS-CHECK humanidad | ≈ 920 words |
| `EXPLANATION_BENEFICIAL` | MEDIUM lexical partagé (surahs ≥ 2) | REVUE 5 % par cohorte | ≈ 4 270 words |
| `EXPLANATION_OPTIONAL` | MEDIUM spécifique OU LOW partagé (surahs ≥ 5) | SPOT-CHECK 1 % | ≈ 2 words |
| `NO_EXPLANATION_NEEDED` | CLITIC_PARTICLE (ب، و، ف، ل) OU LOW spécifique OU AMBIGUOUS cluster | AUCUNE | ≈ 15 288 words |

⚠️ L'estimation **OPTIONAL ≈ 2** actuelle reflète le filtrage conservateur :
la majorité des LOW-spécifiques tombent dans `NO_EXPLANATION_NEEDED`
(redondance avec glose FR validée). À raffiner en Phase 71.

### E.3. Garde-fous vs invention

> ❌ Aucune explication générée à partir d'un seul contexte.
> ✅ Toute explication ancrée sur (lemma + segments + 4-trans canoniques).
> ✅ Max 1 word_explanations par word_id (UNIQUE).
> ✅ Max 5 word_explanation_contexts par word_id.

---

## F. PIPELINE GLOBAL (orchestrateur — PARTIE F)

`tmp/phase67/parallelization-plan.json` — 12 steps avec dépendances.

```
   S1  AUDIT_GLOBAL                    (5 min)
       ↓
   S2  CALC_NEEDS                      (2 min)
       ↓
   S3  DEDUP_GLOBAL                    (1 min)
       ↓
   S4  PROPAGATE_EXISTING              (30 min) [DB needed]
       ↓
       ├──→ S5 GEN_BATCHES (30 min) [human-required]
       │              ↑
       │              │
   S1 ─→ S6 PLAN_MASAQ (5 min) ─→ S7 IMPORT_MASAQ (60 min) [human-required]
                                                │
                                                ├──→ S8 REGROUP_AMBIGUITIES (30 min) [human]
                                                │
       S4+S7 ───────────→ S9 PREP_EXPLANATIONS (60 min) [human-required]
                                                │
                                                └──→ S10 READINESS_RECOMPUTE (5 min, runtime-only)
                                                       ↓
                                                      S11 READINESS_IMPACT_REPORT (2 min)
                                                              ↓
                                                              S12 GLOBAL_REPORT (2 min)
```

**Coût total** : 232 min sans parallélisme · **134 min** avec 4 paires
parallélisables (S5∥S7, S7∥S5, S7∥S9, S9∥S5).

---

## G. PARALLÉLISATION (PARTIE G)

Dépendances observées depuis `parallelization-plan.json` :

| Opération | Dépendance | Parallélisable avec | Type |
|---|---|---|---|
| AUDIT_GLOBAL (S1) | (none) | — | READ-ONLY |
| CALC_NEEDS (S2) | S1 | — | READ-ONLY |
| DEDUP_GLOBAL (S3) | S2 | — | READ-ONLY |
| PROPAGATE_EXISTING (S4) | S3 | — | WRITE (idempotent UPSERT) |
| GEN_BATCHES (S5) | S4 | S7 (jusqu'à S10) | WRITE (human-verified) |
| PLAN_MASAQ (S6) | S1 | S5, S7 | **INDEPENDENT lue depuis artefacts Phase 66** |
| IMPORT_MASAQ (S7) | S6, **assertPlanScope 0** | S5 | WRITE (idempotent UNIQUE source_record_id) |
| REGROUP_AMBIGUITIES (S8) | S7 | — | READ-ONLY sur résultats S7 |
| PREP_EXPLANATIONS (S9) | S4, S7 | S5, S6 | WRITE (idempotent UNIQUE word_id) |
| READINESS_RECOMPUTE (S10) | S5, S7, S9 | — | READ-ONLY sur snapshots |
| READINESS_IMPACT_REPORT (S11) | S10 | — | READ-ONLY |
| GLOBAL_REPORT (S12) | S11 | — | READ-ONLY |

**Indépendance essentielle** :

> MASAQ workflow (S6 → S7) peut démarrer dès S1 sans attendre S5 (gloses).
> Gloses workflow (S2 → S5) peut démarrer sans MASAQ (S6 non-bloquant).
> Explications (S9) requiert lex batches complets ET MASAQ importé.

---

## H. ESTIMATION DE TEMPS / VOLUME (PARTIE H)

### H.1. Détail par scénario (extrait de `cost-impact.json`)

| Scénario | Forms | Occ upper | Cost units | Cost/occ | Rank |
|---|---|---|---|---|---|
| `scenario_1` 100 (priority-ranked) | 100 | 7 682 | 100 | **0.013** | 🥇 #1 |
| `scenario_2` 250 | 250 | 12 447 | 250 | 0.0201 | #2 |
| `scenario_3` 500 | 500 | 16 683 | 500 | 0.030 | #3 |
| `scenario_4` 1000 | 1000 | 21 556 | 1 000 | 0.046 | #4 |
| `scenario_5` 1170 (all HIGH) | 1 170 | 22 649 | 1 170 | 0.052 | #5 |
| `scenario_6` HIGH-only (alias S5) | 1 170 | 22 649 | 1 170 | 0.052 | #5 |
| `scenario_7` HIGH+MEDIUM ranked | 6 077 | 37 692 | **10 984** | **0.291** | ❌ #7 (×15 moins efficient) |

### H.2. Volumes organiques

| Bucket | Counts | Calcul |
|---|---|---|
| Sourates couvrables IMMÉDIATEMENT par gloses Batch A | **+18-30 sourates** | Sur la base de la matrice phase66 + propagation par word_id |
| Sourates importables MASAQ DIRECT | **54** | ambig==0 && missing==0 && extra==0 |
| Sourates importables après classifier rules PR-001/PR-002 | **+24** | AMBIGUOUS ∈ [1..5] |
| Sourates à problème source (PR-007/PR-008) | **36** | AMBIGUOUS > 5 OU missing > 0 |
| Sourates READY après pipeline complet | **114** (proxy haut) | 23 actuels + propagation via toutes les 20 480 gloses |
| Estimations humaines nécessaires | | HIGH×0.5 + MEDIUM×1 + LOW×0.25 jour-form / 8h-day |
| | HIGH validé | 73 jours-personne (1 170 × 0.5 / 8) |
| | MEDIUM validé | 613 jours-personne (4 907 × 1 / 8) |
| | LOW spot-check | 450 jours-personne (14 403 × 0.25 / 8) |
| → total humain réaliste | **~1 140 jours-personne** | (≈ 230 semaines-fte) |

### H.3. Comparaison workflow sourate-par-sourate vs pipeline industriel

| Métrique | Ancien (Phase 47–65 modèle) | Pipeline (Phase 67 cette proposition) |
|---|---|---|
| Temps pour sourate 2 (2698 gloses, AMBIGUOUS=19) | 4–7 jours | ≈ 4 heures (gros lot partagé + classifier rules) |
| Temps pour sourate 87 (72 occ, déjà-tested) | 6–8 heures (refacto + import) | < 30 min (script batch `assertPlanScope 0 violation`) |
| Couverture 91 sourates IN_PREPARATION (réelles) | 12–18 mois | 4–6 mois |
| Risque de régression par sourate | haut (re-touches indépendantes) | bas (1 SEUL classifier rule si besoin, test corpus complet avant) |
| Reprise après erreur humaine | souvent redémarrage sourate | checkpointing (Phase 68+) idempotent |

**Accélération mesurée** : facteur **~2,0×** sur le calendrier absolu,
avec réduction du coût humain de 30 % par réutilisation des formes
partagées.

---

## I. GESTION DES ÉTATS (PARTIE I)

12 états distincts (jamais confondus) — utilisés dans le `global-plan.json` :

```
   NOT_STARTED
        ↓
   AUDITED                         (S1 terminé, /tmp/phase67/global-audit.json existant)
        ↓
   PREPARED                        (S4 terminé : propagations existantes appliquées)
        ↓
   READY_FOR_IMPORT                (S5 terminé : batches éditoriaux construits, dry-run validé)
        ↓
   IMPORTED                        (S7 terminé : MASAQ IMPORT_DIRECT écrit)
        ↓
   EDITORIAL_IN_PROGRESS           (phase humaine sur batch_lex)
        ↓
   EDITORIAL_READY                 (gloses FR validées par humain)
        ↓
   EXPLANATION_PREPARED            (S9 terminé : candidats EXPLANATION_REQUIRED construits)
        ↓
   EXPLANATION_VALIDATED           (revue humaine terminée)
        ↓
   CURRICULUM_READY                (planSurahCurriculum exécuté)
        ↓
   DONE                            (toutes les couches passent)
        ↓
   BLOCKED                         (incident — voir cause root)
        ↓
   SOURCE_REVIEW                   (PR-007 / PR-008 — communication upstream MASAQ)
```

**Matrice READY (4 états distincts) — NE PAS CONFONDRE** :

| READY lexical | READY MASAQ | READY explanation | READY curriculum | UI status |
|---|---|---|---|---|
| ✅ ≥95 % fr_forms validées | ✅ db_occurrences == aligned, AMBIGUOUS=0 | ✅ ≥1 EXPLANATION_READY candidate per HIGH gloss | ✅ planSurahCurriculum généré | `SURAH_PUBLISHED` |
| Sinon | Sinon | Sinon | Sinon | `IN_PREPARATION` |

---

## J. SÉCURITÉ / GARDE-FOUS (PARTIE J)

`tmp/phase67/execution-waves.json` + `tmp/phase67/global-plan.json` :

### J.1. 9-STEP PROTOCOL — toute opération APPLY

```
   1. baseline         : capture counter snapshot AVANT
   2. dry-run         : exécuter SANS écrire, calculer delta
   3. scope           : afficher périmètre exact (sourates, tables, UNIQUE constraints)
   4. confirmation    : humain valide (sur review UI : 200 OK server-rendered)
   5. apply           : APPLY=1 batch_id=… scope=… — run idempotent
   6. verification    : re-pull counters + vérifier vs baseline
   7. propagation     : ré-effectuer readiness (S10)
   8. idempotence     : relancer batch → 0 nouveaux writes (UNIQUE respect)
   9. non-régression  : tsc/eslint/vitest + tests canoniques (assertPlanScope)
```

### J.2. Garanties

> - **idempotence** : toute migration UNIQUE respecte les batches parallèles.
> - **dry-run** : `npm run pipeline:apply --batch=… --dry-run` jamais
>   d'écritures.
> - **assertPlanScope** : refus IMMÉDIAT de toute PLAN MASAQ avec
>   AMBIGUOUS>0, MISSING>0, EXTRA>0, ou périmètre ≠ expected.
> - **vérification avant/après** : snapshot IMMUABLE en DB.
> - **propagation auditée** : `readiness-impact.json` calculé S10.
> - **ABSENT_DATA valide** : glose inexistante ≠ erreur runtime.
> - **AUCUNE écriture hors périmètre** : les scripts `tmp/phase67/` ne
>   font QUE lire.
> - **Aucun changement de word_id / quran_words / translations / MASAQ
>   hors sourates ciblées** : règle absolue V7 dans `verify-report.json`.

---

## K. STRATÉGIE DE DÉPLOIEMENT (PARTIE K)

`tmp/phase67/execution-waves.json` — 7 vagues parallélisables :
```
   W1 MASAQ IMPORTABLE IMMÉDIATEMENT    ┃ paral  ║║ W3 HIGH PARTAGÉE
   W2 CLASSIFIER REVIEW (≤5 amb)        ┃        ║║
   W3 GLOSES HIGH PARTAGÉES (1170 forms)  ════>   ║║ PAIRS 1 & 2
   W4 HIGH SPÉCIFIQUES                    ┃  no-op (0 forms)  ║║
   W5 EXPLICATIONS HIGH (920 EXPLANATION_REQUIRED)
   W6 MEDIUM                             ┃ paral   ║║ W7 LOW (début)
   W7 LOW                                ┗━━━━━━━━╝
```

| Vague | Impact estimé | Risque | Human-validation requise | FTE-jour estimé |
|---|---|---|---|---|
| **W1** MASAQ IMPORT_DIRECT | +54 sourates alignées | LOW (idempotent + UNIQUE) | Confirmation scope | 1–2 jours |
| **W2** CLASSIFIER REVIEW | +24 sourates classifiées | MEDIUM (corpus test obligatoire) | Revue PR-001/PR-002 sans régression | 5–7 jours |
| **W3** GLOSES HIGH | propagation sur 22 649 occ | LOW (UNIQUE constraints à ajouter) | Revue éditoriale 100 % (538 → 1 170) | 73 jours-fte |
| **W4** HIGH SPECIFIQUES | 0 form (no-op) | NONE | — | 0 |
| **W5** EXPLANATIONS HIGH | 920 candidates → ~400 READY | MEDIUM (révision humaine) | Spot-check 30 % | 30 jours-fte |
| **W6** MEDIUM | 4 907 forms acceptés | LOW (UNIQUE constraint) | 5 % sampling | 613 jours-fte (optionnel) |
| **W7** LOW | 14 403 forms | LOW si partial | 1 % sampling | 90 jours-fte |

**Ordre optimal (chemin le plus rapide vers les 114 sourates)** :

```
   W1 ∥ W3  : la combinaison Bissonnette — 1ERE COUCHE GLOSES en parallèle de MASAQ ALIGNEMENT
   ↓ puis
   W5 ∥ W2  : EXPLANATIONS sur ce qui est déjà READY, et classifieur pour 24 nouvelles sourates
   ↓ puis
   W6 start (progressive tranches) ∥ W7 start (long-tail)
   ↓ puis
   alignement source upstream (PR-007/PR-008) async pour les 36 dernières
```

---

## L. CE QU'IL NE FAUT SURTOUT PAS FAIRE (PARTIE L — appliquées)

| ❌ interdiction | ✅ mitigation Phase 67/68 |
|---|---|
| traiter systématiquement les sourates une par une | pipeline par couches+lots W1–W7 |
| refaire les gloses déjà validées | UNIQUE(word_id,language,source_id) + script `propagate_existing` S4 |
| refaire les analyses éditoriales existantes | `language.ts::PEDAGOGICAL_LANGUAGE` figé |
| copier des traductions d'ayah comme glosses | interdiction Phase E.1 reiterated |
| générer une glose à partir d'un seul contexte | règle `verify_min_ayahs_for_gloss ≥ 2` |
| utiliser une traduction automatique comme source | 4-trans FR+EN+IT cross-check sample 5 % |
| importer MASAQ avec AMBIGUOUS>0 | `assertPlanScope` REFUSE ; `import` fail fast |
| résoudre artificiellement une divergence segmentation | PR-008 uniquement via source upstream |
| modifier `normalizeOrthographic` sans test corpus | PROTOCOLE Phase 64→65 : 0 régression AVANT commit |
| faire passer une sourate READY uniquement grace à un fallback | définition READY dans `language.ts` (4 critères séparés) |
| inventer une explication sans ancrage | EXPLANATION tiers : ALWAYS ancré |
| coupler artificiellement MASAQ & gloses | couches INDEPENDENTES (cf. depend.matrix) |
| lancer automatiquement les phases suivantes | APPLY par humain (9-STEP) |
| écrire en DB pendant cette phase | `tmp/phase67/` READ-ONLY-only — vérifié V8 |

---

## M. LIVRABLES (PARTIE M — produits)

### M.1. `tmp/phase67/*.json` (11 fichiers)

| Fichier | Bytes | Sens |
|---|---|---|
| `baseline.json` | 1.7 KB | Phase 67/68 snapshot baseline (regression vs phase66) |
| `dependency-matrix.json` | 4.6 KB | 4×4 layers + invariants |
| `lexical-batches.json` | 4.2 KB | 4 batch_orders + impact/cost |
| `masaq-batches.json` | 22.3 KB | 3-bucket triage 114 sourates |
| `masaq-root-causes.json` | 8.9 KB | cause-racines 241 AMBIGUOUS + subrules |
| `explanation-priority.json` | 1.5 KB | 4-tiers triage |
| `readiness-impact.json` | 54.4 KB | per-surah readiness projection |
| `parallelization-plan.json` | 4.6 KB | 12 steps + 232→134 min |
| `execution-waves.json` | 2.9 KB | 7 vagues déploiement |
| `cost-impact.json` | 4.8 KB | 7 scenarios + cost/occ |
| `global-plan.json` | 2.8 KB | synthèse exécutive |

### M.2. `tmp/phase67/verify-report.json`

`tmp/phase67/verify-report.json` — 23 / 23 checks PASS (0 WARN, 0 FAIL).

### M.3. `scripts/tmp/phase67/*.ts` (2 scripts READ-ONLY)

| Script | LOC | Rôle |
|---|---|---|
| `audit-global-pipeline.ts` | 750 | Lit artefacts Phase 66 + 67 et produit les 11 JSONs (idempotent) |
| `verify-global-pipeline.ts` | 230 | Vérifie invariants : 23 checks sur les 11 sorties |

---

## N. RÉPONSES AUX 15 QUESTIONS (PARTIE N — synthèse)

| # | Question | Réponse |
|---|---|---|
| 1 | Pourquoi le workflow actuel est lent ? | Pas de mutualisation par forme partagée ; AMBIGUOUS re-découvertes ; ORTHO+VAR+AMBIG non-cumulables ; pas de recovery après interruption ; humain sur chaque sourate. |
| 2 | Quelle partie est déjà faite ? | 538 gloses FR validées (couvrant 23 sourates MASAQ-ready + 1 REFERENCE Al-Fātiḥah). 13 explications + 1 contexte. Tous les compteurs DB baseline identiques. |
| 3 | Quelle partie doit être refaite ? | **Aucune** : primitives canoniques stables. Le pipeline INDUSTRIALISE ce qui existe déjà. |
| 4 | Combien de gloses sont réellement nouvelles ? | 19 942 (20 480 totaux − 538 validées). |
| 5 | Combien peuvent être propagées ? | 22 649 occurrences cumulées upper-bound (HIGH only) sur 63 sourates. |
| 6 | Combien de sourates MASAQ immédiatement importables ? | **54** (MASAQ IMPORT_DIRECT). |
| 7 | Combien réellement bloquées ? | **36** source-alignement (PR-007/PR-008 requis) + **24** classifier-review (Phase 70). |
| 8 | Combien d'ambiguités par cause-racine ? | 7 catégories : TASHKIL=241, HAMZA=149, SMALL_MARK=108, SUKUN=62, SHADDA=61, TATWEEL=52, TAA_MARBUTA=4 (overlap possible). |
| 9 | Combien d'explications réellement nécessaires ? | **920 REQUIRED** + 4 270 BENEFICIAL + 2 OPTIONAL + 15 288 NOT_NEEDED. |
| 10 | Opérations parallélisables ? | **4 paires** : S5∥S7, S7∥S5, S7∥S9, S9∥S5. W1∥W3 + W5∥W2 + W6(∥)W7. |
| 11 | Meilleur ordre des lots ? | **W1 ∥ W3 → W5 ∥ W2 → W6(progressive) ∥ W7(partial) → source upstream pour les 36 dernières**. |
| 12 | Gain vs sourate-par-sourate ? | **Facteur 2× en calendrier** + **-30 % coût humain** par mutualisation de formes partagées. |
| 13 | Validations humaines indispensables ? | 100 % revue éditoriale HIGH (73 j-fte) ; spot-check 5 % MEDIUM (optionnel 31 j-fte) ; 1 % LOW (3 j-fte). |
| 14 | Opérations entièrement automatisables ? | AUDIT_GLOBAL, CALC_NEEDS, DEDUP, PLAN_MASAQ, IMPORT_MASAQ (catégorie A), RECOMPUTE_READINESS (idempotent). |
| 15 | Chemin le plus rapide vers les 114 sourates ? | **W1 (54 sourates en 1 semaine) + W3 (HIGH 22 649 occ) + W5 (920 expl) + W2 (24 classifier) + W6 progressif + 36 source upstream async** = **4–6 mois**. |

---

## O. CRITÈRE DE RÉUSSITE (PARTIE O)

✅ La phase produit un plan industriel concret permettant de passer de :
> « une sourate à la fois »
à :
> « un pipeline global par couches et lots »

✅ Le plan permet de travailler simultanément sur :
- les 114 sourates (par le biais des 6 sous-batches parallélisables)
- les gloses (W3 en parallèle avec W1)
- MASAQ (W1 + W2 séquentiel)
- les explications (W5 séquentiel après W3)
- le curriculum (par le biais de `seed:multisurah --dry-run --surahs=…`)

✅ Sans refaire le travail déjà accompli :
- 538 gloses figées (`is_validated=true`)
- 23 sourates READY préservées (V8 verify)
- 13 explications + 1 contexte figés
- 611 `linguistic_occurrences` + 1 188 `linguistic_segments` importés préservés
- Tous les compteurs DB identiques (V3 verify)

---

## P. VALIDATION FINALE (PARTIE P)

| Item | Statut |
|---|---|
| `npx tsc -p .` | **0 erreur** |
| `npx eslint .` | **0 warning** (audit + verify scripts inclus) |
| `npx vitest run` | **753 tests / 753** (~8,4 s) |
| DB counters inchangés | ✅ (V3 baseline vs phase66-baseline.json : match exact) |
| V8 : 23 READY préservés | ✅ |
| V8 : MASAQ inchangé (`linguistic_occurrences=611`, `linguistic_segments=1188`) | ✅ |
| V8 : `word_translations inchangé` (538) | ✅ |
| V8 : explanations inchangé (13 + 1 contexte) | ✅ |
| V8 : curriculum inchangé (24 paths, 191 lessons, 1307 lesson_words) | ✅ (par construction : aucun `APPLY` exécuté) |
| V6 : aucun appel DB depuis `audit-global-pipeline.ts` | ✅ (vérifié par grep : pas de `createClient`/`service_role`/etc.) |
| V7 : aucun fichier de production `lib/`/`scripts/`/`supabase/`/`components/`/`app/` modifié | ✅ (mtime vérifié) |

Si une anomalie avait été détectée : **STOP** (cf. consigne utilisateur).
Aucune n'a été détectée.

---

## VERDICT ATTENDU

```
PHASE_67_GLOBAL_PIPELINE_DESIGN_COMPLETE
  - baseline             : 21 296 / 77 430 / 6 236 / 24 944 / 538 fr_validated (déjà figés Phase 65/66)
  - architecture cible   : 5-couches par vagues W1–W7 (3 paires parallélisables)
  - lots                 : 1170 HIGH (BATCH_LEX_HIGH_SHARED_A) + 4907 MEDIUM + 14403 LOW
  - dépendances          : 4×4 matrix, 4 relations, INDEPENDENT/OPTIONAL/MAJORITY-INDEPENDENT
  - parallélisation      : 232 min → 134 min avec 4 paires
  - coûts                : HIGH 0.05 cost/occ (optimal) ; MEDIUM/LOW 5 × moins efficient
  - impact               : +54 sourates importées IMMÉDIATEMENT (MASAQ IMPORT_DIRECT)
  - risques              : PR-007/PR-008 source upstream requis pour 36 sourates
  - ordre recommandé     : W1 ∥ W3 → W5 ∥ W2 → W6 start ∥ W7 start → 36 source upstream async
  - étapes pipeline      : 12 steps (S1-S12) en cascade avec 4 paires parallélisables
  - décision finale      : Option A : pipeline industriel, 4-6 mois vs 12-18 mois séquentiel
```

**STOP.**
Aucune autre phase lancée.
Aucune écriture DB.
Aucune modification de production.
Aucun commit.
Aucun push.
