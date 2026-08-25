# PHASE 72D — RAPPORT FINAL

# AUDIT DE COUVERTURE MASAQ + EXPLICATIONS PÉDAGOGIQUES
## CERTIFICATION DE LA COUVERTURE RÉELLE DU CORPUS HIKMA

## 1. Verdict

```text
PHASE_72D_PEDAGOGICAL_EVIDENCE_COVERAGE_AUDIT

MODE = READ_ONLY
PURPOSE = AUDIT / MEASUREMENT / CERTIFICATION
DATABASE_WRITES = 0
LEXICAL_WRITES = 0
CODE_WRITES = 0
MIGRATIONS = 0
SEEDS = 0
HOLDS_PROCESSED = false
LOT_16_STARTED = false
COMMIT = false
PUSH = false

PIPELINE_LEXICAL = FROZEN
NEXT_PHASE = NOT_STARTED

STOP_AFTER_REPORT = true
```

**RÉPONSE CENTRALE** : la chaîne complète `verset → mot → sens FR → MASAQ → explication` est certifiée à **100 % sur l'intégralité du curriculum actuellement enseigné** (24 parcours / 191 leçons, tous indicateurs à 100 %). Sur le corpus entier (114 sourates), l'expérience d'explication **minimale** couvre 100 % des occurrences (contexte + sens, jamais rien d'inventé), l'expérience **complète** (sens FR + élément linguistique/lemme) couvre **30,8 % des occurrences (23 867 / 77 430)** et **10,0 % des versets (621 / 6 236)**.

---

## 2. Ground Truth

Compteurs **réellement observés** le `2026-08-22T18:46:15Z` (SELECT uniquement, service-role en lecture seule). Les références connues sont confirmées sauf mention.

```text
BEFORE_AUDIT_GROUND_TRUTH

surahs                              = 114
ayahs                               = 6 236
quran_words                         = 21 296
word_occurrences                    = 77 430
translations                        = 24 944
  └─ translations FR                = 12 472   (2 traductions FR par verset en moyenne)
word_translations FR                = 4 490    (toutes is_validated = true)
lemmas                              = 32
lemma_translations FR validées      = 28
word_lemma_mapping                  = 188
linguistic_occurrences (MASAQ)      = 22 485
linguistic_segments (MASAQ)         = 44 677
word_explanations FR validées       = 13       (couche « Pourquoi ce sens ? », Phase 44B)
word_explanation_contexts validés   = 1
word_audio                          = 21 295   (audio quasi complet : 99,995 % des formes)
ayah_audio                          = 0
learning_paths                      = 24
lessons                             = 191
```

---

## 3. Architecture de HikmaExplanation (pipeline réel, inspection code READ_ONLY)

Fonctions réelles vérifiées dans le repository :

| Étape | Fonction / table réelle | Données requises | Données optionnelles | Condition d'échec |
|---|---|---|---|---|
| AYAH | `ayahs` (text_uthmani, surah_id, ayah_number) | texte arabe du verset | traduction FR (`translations` language=fr) | verset absent → aucune occurrence possible |
| OCCURRENCE | `word_occurrences` (ayah_id → ayahs, word_id → quran_words) | lien ayah + forme | — | 0 orphelin observé (77 430/77 430 liées) |
| FORME | `quran_words` (arabic, meaning EN, lemma_id) | identité de la forme | gloss EN (`meaning`) | — |
| LEMME | `quran_words.lemma_id` puis `word_lemma_mapping` (Phase 21B-C) | lemma_id | — | forme sans lemme → étape sautée (jamais bloquante) |
| SENS FR | `resolveWordMeanings` (lib/learning/language.ts) : `getValidatedFrenchMeanings` (`word_translations` fr validées) → `getValidatedFrenchLemmaMeanings` (`lemma_translations` fr validées) → fallback EN | glose FR forme OU FR lemme | EN (`quran_words.meaning`) | ni FR ni EN → sens null (jamais observé : 100 % ont au moins EN) |
| EXPLICATION DE SENS | `getValidatedWordExplanations` + `getValidatedWordExplanationContexts` → `resolveSenseExplanation` (générique → override contextuel → null) | `word_explanations` fr validée | `word_explanation_contexts` validés | absence = état légitime (null, jamais fabriqué) |
| PREUVE MASAQ | `getWordLinguisticEvidence` (lib/learning/queries.ts) : `linguistic_occurrences.word_occurrence_id → word_occurrences.id` (1:1 par source) + `linguistic_segments` ; puis `buildLinguisticExplanation` (lib/linguistic/explanation.ts) | occurrence liée + segments | pos / case_mood / syntactic_roles / stem | AVAILABLE ≠ INFERABLE : données absentes ou ambiguës → blocs omis, jamais inventés |
| COMPOSITION | `pedagogicalExplanation` (components/learn/exercises/pedagogical-feedback.ts) : `availability = verified | partial | unavailable` | au moins un élément (sens, explication de sens, lemme, contexte, audio, blocs MASAQ) | aucun élément → null (pas d'explication du tout) |
| AFFICHAGE | `HikmaExplanation` (components/ui/hikma-explanation.tsx) | `HikmaExplanationData` | — | affiche « Explication indisponible » si `unavailable` |

**Points clés dérivés du code (fondent les définitions) :**
- `meaningValidated` (= glose FR validée) est le seul déclencheur du label `verified` ; tout le reste (EN, contexte, MASAQ, lemme) donne `partial`.
- Le contexte arabe du verset (`ayahs.text_uthmani`) est toujours présent pour toute occurrence → un élément d'explication existe **toujours** (bloc « Contexte »).
- La traduction FR du verset (`translations` fr) est disponible pour **100 % des ayahs** (12 472 lignes observées).
- Rien n'est REQUIRED : chaque bloc est optionnel et omis si absent. Le label d'honnêteté (`verified`/`partial`/`unavailable`) est déjà implémenté et affiché.

---

## 4. Définitions formelles (dérivées du code réel, pas arbitraires)

- **AYAH_EXISTING** : ligne de `ayahs` (6 236).
- **OCCURRENCE_EXISTING** : ligne de `word_occurrences` liée à un ayah et une forme (77 430 ; 0 orphelin).
- **FORM_RESOLVED_FR** : forme dont la résolution réelle (précédence `word_translations` FR validée → `lemma_translations` FR validée via `quran_words.lemma_id` / `word_lemma_mapping`) aboutit à un sens FR validé. **4 703 formes (22,1 %)** = 4 490 directes + 213 via lemme. *(Les 28 traductions FR de lemme existent, mais seules 213 formes en bénéficient via un lien lemme effectif.)*
- **MASAQ_OCCURRENCE_COVERED** : occurrence liée à une `linguistic_occurrences` (22 485, soit 29,0 %).
- **MASAQ_BLOCKS** : occurrence dont les données MASAQ produisent ≥ 1 bloc pédagogique selon la logique exacte de `buildLinguisticExplanation` (décomposition / identité / morphologie / syntaxe). **22 484 (29,0 %)**.
- **EXPLANATION_GENERABLE** : occurrence pour laquelle `pedagogicalExplanation` produirait une explication non vide (sens FR ou EN, explication de sens, lemme FR, contexte, audio, blocs MASAQ). **77 430 (100 %)** — le sens EN + le contexte arabe suffisent toujours ; ce niveau mesure « possible », pas « complet ».
- **EXPLANATION_FULL** : occurrence avec sens **FR** résolu **ET** au moins un élément d'approfondissement (blocs MASAQ OU explication de sens OU sens de lemme FR). **23 867 (30,8 %)**.
- **AYAH_EXPLANABLE_MINIMAL** : toutes les occurrences du verset ont ≥ 1 élément d'explication (contexte inclus). **6 236 (100 %)**.
- **AYAH_EXPLANABLE_FULL** : toutes les occurrences du verset sont EXPLANATION_FULL. **621 (10,0 %)**.

La distinction MINIMAL / FULL est **pertinente** : elle sépare « une expérience d'explication est possible » (toujours vraie, contexte) de « les données d'approfondissement attendues sont disponibles pour toutes les occurrences » (10 %).

---

## 5. AYAH_COVERAGE (Niveau 1)

| Metric | Total | Covered | % |
|---|---|---|---|
| Ayahs (AYAH_EXISTING) | 6 236 | 6 236 | 100 |
| Ayahs avec occurrences | 6 236 | 6 236 | 100 |
| Ayahs avec toutes les occurrences résolues FR | 6 236 | 870 | 13,9 |
| Ayahs avec au moins une preuve MASAQ | 6 236 | 2 318 | 37,2 |
| Ayahs avec toutes les occurrences liées MASAQ | 6 236 | 2 318 | 37,2 |
| Ayahs avec toutes les occurrences à blocs MASAQ | 6 236 | 2 317 | 37,1 |
| Ayahs MINIMAL_EXPLANABLE | 6 236 | 6 236 | 100 |
| Ayahs FULL_EXPLANABLE | 6 236 | 621 | 10,0 |

Note : la couverture MASAQ est « tout ou rien » par verset (aucun verset partiellement MASAQ-couvert) — cohérent avec des imports par sourate entière.

## 6. OCCURRENCE_COVERAGE (Niveau 2)

| Metric | Total | Covered | % |
|---|---|---|---|
| Occurrences (OCCURRENCE_EXISTING) | 77 430 | 77 430 | 100 |
| Occurrences avec forme identifiable | 77 430 | 77 430 | 100 |
| Occurrences avec sens FR (forme ou lemme) | 77 430 | 55 454 | 71,6 |
| Occurrences EN uniquement (sans FR) | 77 430 | 21 976 | 28,4 |
| Occurrences avec sens de lemme FR | 77 430 | 8 027 | 10,4 |
| Occurrences avec preuve MASAQ liée | 77 430 | 22 485 | 29,0 |
| Occurrences avec segments MASAQ | 77 430 | 22 485 | 29,0 |
| Occurrences avec blocs MASAQ (exploitables) | 77 430 | 22 484 | 29,0 |
| Occurrences EXPLANATION_GENERABLE | 77 430 | 77 430 | 100 |
| Occurrences EXPLANATION_FULL | 77 430 | 23 867 | 30,8 |

## 7. FORM_COVERAGE (Niveau 3)

| Metric | Total | Covered | % |
|---|---|---|---|
| Formes (quran_words) | 21 296 | 21 296 | 100 |
| Formes avec traduction FR directe (word_translations validées) | 21 296 | 4 490 | 21,1 |
| Formes résolues FR via lemme | 21 296 | 213 | 1,0 |
| Formes avec résolution FR (FORM_RESOLVED_FR) | 21 296 | 4 703 | 22,1 |
| Formes sans résolution FR | 21 296 | 16 593 | 77,9 |
| Formes reliées à un lemme | 21 296 | 323 | 1,5 |
| Formes avec preuve MASAQ (≥ 1 occurrence liée) | 21 296 | 8 819 | 41,4 |
| Formes avec blocs MASAQ exploitables | 21 296 | 8 818 | 41,4 |
| Formes avec explication de sens validée (word_explanations) | 21 296 | 13 | 0,06 |
| Formes avec explication générable (≥ 1 source, EN incluse) | 21 296 | 21 296 | 100 |

⚠️ FORM_COVERAGE ≠ OCCURRENCE_COVERAGE : les 4 703 formes FR couvrent **71,6 % des occurrences** (les formes fréquentes sont mieux couvertes — le travail éditorial FR a ciblé la fréquence). Une métrique de compréhension doit rester pondérée par occurrences.

## 8. MASAQ_COVERAGE (Niveau 4)

| Metric | Total | Covered | % |
|---|---|---|---|
| Occurrences Quran couvertes (liées) | 77 430 | 22 485 | 29,0 |
| Occurrences avec segments | 22 485 | 22 485 | 100 |
| Occurrences avec blocs exploitables | 22 485 | 22 484 | 99,995 |
| Formes couvertes (≥ 1 occurrence liée) | 21 296 | 8 819 | 41,4 |
| Sourates couvertes (≥ 1 occurrence liée) | 114 | 74 | 64,9 |
| Ayahs couverts (≥ 1 occurrence liée) | 6 236 | 2 318 | 37,2 |

**MASAQ_MISSING_DISTRIBUTION** (occurrences sans blocs MASAQ = 54 946) :

| Cause | Count | % des occurrences | Définition |
|---|---|---|---|
| NO_LINK | 54 945 | 71,0 | aucune `linguistic_occurrences` liée (sourates non importées MASAQ) |
| NO_SEGMENT | 0 | 0 | occurrence liée mais sans segment |
| NO_BLOCK | 1 | 0,001 | segments présents mais ne produisant aucun bloc (règle AVAILABLE ≠ INFERABLE) |
| OTHER / UNKNOWN | 0 | 0 | — |

Aucune cause inventée : NO_LINK est la cause unique et déterminée (le corpus MASAQ importé couvre 74 sourates ; les 40 autres n'ont aucune ligne).

## 9. EXPLANATION_COVERAGE (Niveau 5 — HikmaExplanation)

Matrice des exigences (dérivée de `pedagogicalExplanation`) :

| Requirement | Required? | Disponible (occurrences) | Source | Couverture |
|---|---|---|---|---|
| ayah text (contexte arabe) | Non (optionnel) | 77 430 / 77 430 | `ayahs.text_uthmani` | 100 % |
| contextual translation FR | Non (optionnel) | 77 430 / 77 430 | `translations` fr | 100 % |
| FR meaning | Non (optionnel) | 55 454 / 77 430 | `word_translations` / `lemma_translations` fr | 71,6 % |
| EN meaning (fallback) | Non (optionnel) | 77 430 / 77 430 | `quran_words.meaning` | 100 % |
| sense explanation (« Pourquoi ce sens ? ») | Non (optionnel) | 328 / 77 430 | `word_explanations` fr validées (13 formes) | 0,4 % |
| lemma meaning (famille) | Non (optionnel) | 8 027 / 77 430 | `lemma_translations` fr via lemme | 10,4 % |
| MASAQ blocks | Non (optionnel) | 22 484 / 77 430 | `linguistic_occurrences` + `linguistic_segments` | 29,0 % |
| root | Non — jamais requis | — | (non utilisé par l'explication actuelle) | — |
| audio | Non (optionnel) | ~100 % (21 295 formes) | `word_audio` | quasi total |

Aucune donnée n'est REQUIRED : le produit affiche honnêtement `verified` (FR validé), `partial` (EN/contexte/MASAQ/lemme) ou `unavailable`.

## 10. Coverage par sourate (114 sourates)

Colonnes : `# | Sourate | Ayahs | Occurrences | FR % | MASAQ % (blocs) | Expl. min % | Expl. full % | LEXICAL_READY | MASAQ_READY | EXPLANATION_READY | PEDAGOGICAL_READY`

| # | Sourate | Ayahs | Occ | FR % | MASAQ % | ExplMin % | ExplFull % | LEX | MASAQ | EXPL | PED |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Al-Fatihah | 7 | 29 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 2 | Al-Baqarah | 286 | 6117 | 68 | 0 | 100 | 11.3 | — | — | ✅ | — |
| 3 | Ali 'Imran | 200 | 3481 | 71.2 | 0 | 100 | 13.6 | — | — | ✅ | — |
| 4 | An-Nisa | 176 | 3747 | 63.9 | 0 | 100 | 11.7 | — | — | ✅ | — |
| 5 | Al-Ma'idah | 120 | 2804 | 69.4 | 0 | 100 | 11.3 | — | — | ✅ | — |
| 6 | Al-An'am | 165 | 3050 | 70.3 | 0 | 100 | 10 | — | — | ✅ | — |
| 7 | Al-A'raf | 206 | 3320 | 66.7 | 0 | 100 | 9.6 | — | — | ✅ | — |
| 8 | Al-Anfal | 75 | 1233 | 81.1 | 99.9 | 100 | 81 | — | — | ✅ | — |
| 9 | At-Tawbah | 129 | 2498 | 77.5 | 100 | 100 | 77.5 | — | ✅ | ✅ | — |
| 10 | Yunus | 109 | 1833 | 75.4 | 0 | 100 | 12.7 | — | — | ✅ | — |
| 11 | Hud | 123 | 1917 | 69.1 | 0 | 100 | 10.4 | — | — | ✅ | — |
| 12 | Yusuf | 111 | 1777 | 59.3 | 0 | 100 | 8 | — | — | ✅ | — |
| 13 | Ar-Ra'd | 43 | 853 | 83.4 | 100 | 100 | 83.4 | — | ✅ | ✅ | — |
| 14 | Ibrahim | 52 | 830 | 69.8 | 0 | 100 | 12.7 | — | — | ✅ | — |
| 15 | Al-Hijr | 99 | 655 | 69.5 | 0 | 100 | 6.7 | — | — | ✅ | — |
| 16 | An-Nahl | 128 | 1844 | 72.1 | 0 | 100 | 12.2 | — | — | ✅ | — |
| 17 | Al-Isra | 111 | 1556 | 62.1 | 0 | 100 | 9.7 | — | — | ✅ | — |
| 18 | Al-Kahf | 110 | 1579 | 61.1 | 0 | 100 | 7.5 | — | — | ✅ | — |
| 19 | Maryam | 98 | 961 | 61.1 | 0 | 100 | 10.4 | — | — | ✅ | — |
| 20 | Taha | 135 | 1335 | 62.7 | 0 | 100 | 8.2 | — | — | ✅ | — |
| 21 | Al-Anbya | 112 | 1169 | 67.9 | 0 | 100 | 8.3 | — | — | ✅ | — |
| 22 | Al-Hajj | 78 | 1274 | 81.5 | 100 | 100 | 81.5 | — | ✅ | ✅ | — |
| 23 | Al-Mu'minun | 118 | 1050 | 72.7 | 0 | 100 | 8.1 | — | — | ✅ | — |
| 24 | An-Nur | 64 | 1316 | 65.6 | 0 | 100 | 10.8 | — | — | ✅ | — |
| 25 | Al-Furqan | 77 | 893 | 68.5 | 0 | 100 | 7.3 | — | — | ✅ | — |
| 26 | Ash-Shu'ara | 227 | 1318 | 69.7 | 0 | 100 | 10.5 | — | — | ✅ | — |
| 27 | An-Naml | 93 | 1151 | 72 | 0 | 100 | 10.1 | — | — | ✅ | — |
| 28 | Al-Qasas | 88 | 1430 | 81.8 | 100 | 100 | 81.8 | — | ✅ | ✅ | — |
| 29 | Al-'Ankabut | 69 | 976 | 85.2 | 100 | 100 | 85.2 | — | ✅ | ✅ | — |
| 30 | Ar-Rum | 60 | 817 | 74.7 | 0 | 100 | 12 | — | — | ✅ | — |
| 31 | Luqman | 34 | 546 | 85.2 | 100 | 100 | 85.2 | — | ✅ | ✅ | — |
| 32 | As-Sajdah | 30 | 372 | 88.4 | 100 | 100 | 88.4 | — | ✅ | ✅ | — |
| 33 | Al-Ahzab | 73 | 1287 | 62.2 | 0 | 100 | 14.2 | — | — | ✅ | — |
| 34 | Saba | 54 | 883 | 83.2 | 100 | 100 | 83.2 | — | ✅ | ✅ | — |
| 35 | Fatir | 45 | 775 | 69.5 | 0 | 100 | 13.3 | — | — | ✅ | — |
| 36 | Ya-Sin | 83 | 725 | 82.5 | 100 | 100 | 82.5 | — | ✅ | ✅ | — |
| 37 | As-Saffat | 182 | 860 | 68.4 | 0 | 100 | 7.8 | — | — | ✅ | — |
| 38 | Sad | 88 | 733 | 62.1 | 0 | 100 | 6.5 | — | — | ✅ | — |
| 39 | Az-Zumar | 75 | 1172 | 85.2 | 100 | 100 | 85.2 | — | ✅ | ✅ | — |
| 40 | Ghafir | 85 | 1219 | 74.2 | 0 | 100 | 12.3 | — | — | ✅ | — |
| 41 | Fussilat | 54 | 794 | 72.8 | 0 | 100 | 9.1 | — | — | ✅ | — |
| 42 | Ash-Shuraa | 53 | 860 | 76.5 | 0 | 100 | 12 | — | — | ✅ | — |
| 43 | Az-Zukhruf | 89 | 830 | 71.8 | 0 | 100 | 7.5 | — | — | ✅ | — |
| 44 | Ad-Dukhan | 59 | 346 | 72.3 | 0 | 100 | 12.7 | — | — | ✅ | — |
| 45 | Al-Jathiyah | 37 | 488 | 90.4 | 100 | 100 | 90.4 | — | ✅ | ✅ | — |
| 46 | Al-Ahqaf | 35 | 643 | 84.6 | 100 | 100 | 84.6 | — | ✅ | ✅ | — |
| 47 | Muhammad | 38 | 539 | 76.4 | 100 | 100 | 76.4 | — | ✅ | ✅ | — |
| 48 | Al-Fath | 29 | 560 | 62.7 | 0 | 100 | 10.5 | — | — | ✅ | — |
| 49 | Al-Hujurat | 18 | 347 | 75.2 | 100 | 100 | 75.2 | — | ✅ | ✅ | — |
| 50 | Qaf | 45 | 373 | 77.2 | 100 | 100 | 77.2 | — | ✅ | ✅ | — |
| 51 | Adh-Dhariyat | 60 | 360 | 82.2 | 100 | 100 | 82.2 | — | ✅ | ✅ | — |
| 52 | At-Tur | 49 | 312 | 77.9 | 100 | 100 | 77.9 | — | ✅ | ✅ | — |
| 53 | An-Najm | 62 | 360 | 72.5 | 100 | 100 | 72.5 | — | ✅ | ✅ | — |
| 54 | Al-Qamar | 55 | 342 | 63.5 | 100 | 100 | 63.5 | — | ✅ | ✅ | — |
| 55 | Ar-Rahman | 78 | 351 | 73.8 | 100 | 100 | 73.8 | — | ✅ | ✅ | — |
| 56 | Al-Waqi'ah | 96 | 379 | 69.4 | 100 | 100 | 69.4 | — | ✅ | ✅ | — |
| 57 | Al-Hadid | 29 | 574 | 74.6 | 0 | 100 | 11.7 | — | — | ✅ | — |
| 58 | Al-Mujadila | 22 | 472 | 83.7 | 100 | 100 | 83.7 | — | ✅ | ✅ | — |
| 59 | Al-Hashr | 24 | 445 | 73.7 | 0 | 100 | 14.8 | — | — | ✅ | — |
| 60 | Al-Mumtahanah | 13 | 348 | 64.4 | 0 | 100 | 14.4 | — | — | ✅ | — |
| 61 | As-Saf | 14 | 221 | 84.6 | 100 | 100 | 84.6 | — | ✅ | ✅ | — |
| 62 | Al-Jumu'ah | 11 | 175 | 87.4 | 100 | 100 | 87.4 | — | ✅ | ✅ | — |
| 63 | Al-Munafiqun | 11 | 180 | 81.7 | 100 | 100 | 81.7 | — | ✅ | ✅ | — |
| 64 | At-Taghabun | 18 | 241 | 78.4 | 0 | 100 | 11.6 | — | — | ✅ | — |
| 65 | At-Talaq | 12 | 287 | 75.6 | 100 | 100 | 75.6 | — | ✅ | ✅ | — |
| 66 | At-Tahrim | 12 | 249 | 73.5 | 100 | 100 | 73.5 | — | ✅ | ✅ | — |
| 67 | Al-Mulk | 30 | 333 | 81.1 | 100 | 100 | 81.1 | — | ✅ | ✅ | — |
| 68 | Al-Qalam | 52 | 300 | 76.3 | 100 | 100 | 76.3 | — | ✅ | ✅ | — |
| 69 | Al-Haqqah | 52 | 258 | 67.4 | 100 | 100 | 67.4 | — | ✅ | ✅ | — |
| 70 | Al-Ma'arij | 44 | 217 | 80.2 | 100 | 100 | 80.2 | — | ✅ | ✅ | — |
| 71 | Nuh | 28 | 226 | 74.8 | 100 | 100 | 74.8 | — | ✅ | ✅ | — |
| 72 | Al-Jinn | 28 | 285 | 59.3 | 0 | 100 | 10.5 | — | — | ✅ | — |
| 73 | Al-Muzzammil | 20 | 199 | 74.4 | 100 | 100 | 74.4 | — | ✅ | ✅ | — |
| 74 | Al-Muddaththir | 56 | 255 | 69.4 | 100 | 100 | 69.4 | — | ✅ | ✅ | — |
| 75 | Al-Qiyamah | 40 | 164 | 63.4 | 0 | 100 | 4.9 | — | — | ✅ | — |
| 76 | Al-Insan | 31 | 243 | 66.7 | 100 | 100 | 66.7 | — | ✅ | ✅ | — |
| 77 | Al-Mursalat | 50 | 181 | 71.3 | 100 | 100 | 71.3 | — | ✅ | ✅ | — |
| 78 | An-Naba | 40 | 173 | 74 | 100 | 100 | 74 | — | ✅ | ✅ | — |
| 79 | An-Nazi'at | 46 | 179 | 69.8 | 100 | 100 | 69.8 | — | ✅ | ✅ | — |
| 80 | 'Abasa | 42 | 133 | 59.4 | 100 | 100 | 59.4 | — | ✅ | ✅ | — |
| 81 | At-Takwir | 29 | 104 | 67.3 | 0 | 100 | 2.9 | — | — | ✅ | — |
| 82 | Al-Infitar | 19 | 80 | 75 | 100 | 100 | 75 | — | ✅ | ✅ | — |
| 83 | Al-Mutaffifin | 36 | 169 | 77.5 | 100 | 100 | 77.5 | — | ✅ | ✅ | — |
| 84 | Al-Inshiqaq | 25 | 107 | 74.8 | 100 | 100 | 74.8 | — | ✅ | ✅ | — |
| 85 | Al-Buruj | 22 | 109 | 82.6 | 100 | 100 | 82.6 | — | ✅ | ✅ | — |
| 86 | At-Tariq | 17 | 61 | 60.7 | 100 | 100 | 60.7 | — | ✅ | ✅ | — |
| 87 | Al-A'la | 19 | 72 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 88 | Al-Ghashiyah | 26 | 92 | 62 | 100 | 100 | 62 | — | ✅ | ✅ | — |
| 89 | Al-Fajr | 30 | 137 | 61.3 | 100 | 100 | 61.3 | — | ✅ | ✅ | — |
| 90 | Al-Balad | 20 | 82 | 72 | 100 | 100 | 72 | — | ✅ | ✅ | — |
| 91 | Ash-Shams | 15 | 54 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 92 | Al-Layl | 21 | 71 | 71.8 | 100 | 100 | 71.8 | — | ✅ | ✅ | — |
| 93 | Ad-Duhaa | 11 | 40 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 94 | Ash-Sharh | 8 | 27 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 95 | At-Tin | 8 | 34 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 96 | Al-'Alaq | 19 | 72 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 97 | Al-Qadr | 5 | 30 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 98 | Al-Bayyinah | 8 | 94 | 83 | 100 | 100 | 83 | — | ✅ | ✅ | — |
| 99 | Az-Zalzalah | 8 | 36 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 100 | Al-'Adiyat | 11 | 40 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 101 | Al-Qari'ah | 11 | 36 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 102 | At-Takathur | 8 | 28 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 103 | Al-'Asr | 3 | 14 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 104 | Al-Humazah | 9 | 33 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 105 | Al-Fil | 5 | 23 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 106 | Quraysh | 4 | 17 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 107 | Al-Ma'un | 7 | 25 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 108 | Al-Kawthar | 3 | 10 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 109 | Al-Kafirun | 6 | 26 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 110 | An-Nasr | 3 | 19 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 111 | Al-Masad | 5 | 23 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 112 | Al-Ikhlas | 4 | 15 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 113 | Al-Falaq | 5 | 23 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |
| 114 | An-Nas | 6 | 20 | 100 | 100 | 100 | 100 | ✅ | ✅ | ✅ | ✅ |

**Synthèse des statuts (114 sourates, aucune "READY" déclarée sur un seul indicateur) :**

| Statut | Définition | Sourates |
|---|---|---|
| LEXICAL_READY | 100 % des occurrences avec sens FR résolu | 24 |
| MASAQ_READY | 100 % des occurrences avec blocs MASAQ exploitables | 73 |
| EXPLANATION_READY | 100 % des occurrences EXPLANATION_GENERABLE (≥ 1 élément) | 114 |
| PEDAGOGICAL_READY | LEXICAL_READY + MASAQ_READY + EXPLANATION_READY (100 % EXPLANATION_FULL) | **24** |

Répartition : 24 PEDAGOGICAL_READY (= exactement les sourates du curriculum) ; 49 MASAQ_READY mais FR incomplet (ex. 9, 13, 22, 28, 29, 31, 32, 34, 36, 39…) ; 0 LEXICAL_READY sans MASAQ ; 41 sourates ni FR complet ni MASAQ (ex. 2, 3, 4, 5, 6, 7, 8, 10, 11, 12…).

## 11. Curriculum actuel (24 parcours réels, lus en base)

| Parcours | Sourate | Leçons | Mots distincts | FR % mots | MASAQ % mots | Expl. min % | Expl. full % | Sourate : FR / MASAQ / full |
|---|---|---|---|---|---|---|---|---|
| quran-vocabulary (référence éditoriale) | 1 Al-Fatihah | 8 | 26 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-87 | Al-A'la | 19 | 69 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-91 | Ash-Shams | 15 | 48 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-93 | Ad-Duhaa | 11 | 36 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-94 | Ash-Sharh | 8 | 24 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-95 | At-Tin | 8 | 34 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-96 | Al-'Alaq | 19 | 59 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-97 | Al-Qadr | 5 | 27 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-99 | Az-Zalzalah | 8 | 30 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-100 | Al-'Adiyat | 11 | 35 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-101 | Al-Qari'ah | 11 | 29 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-102 | At-Takathur | 8 | 20 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-103 | Al-'Asr | 3 | 13 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-104 | Al-Humazah | 9 | 32 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-105 | Al-Fil | 5 | 22 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-106 | Quraysh | 4 | 17 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-107 | Al-Ma'un | 7 | 23 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-108 | Al-Kawthar | 3 | 10 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-109 | Al-Kafirun | 6 | 19 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-110 | An-Nasr | 3 | 18 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-111 | Al-Masad | 5 | 22 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-112 | Al-Ikhlas | 4 | 13 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-113 | Al-Falaq | 5 | 17 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |
| quran-surah-114 | An-Nas | 6 | 17 | 100 | 100 | 100 | 100 | 100 / 100 / 100 |

**Question critique — toutes les sourates actuellement enseignées peuvent-elles produire l'expérience HikmaExplanation complète sans donnée manquante critique ?**

> **YES.** Sur les 24 parcours : 100 % des mots enseignés ont un sens FR résolu, 100 % ont des blocs MASAQ exploitables, 100 % sont EXPLANATION_FULL. Aucune donnée manquante critique sur le curriculum actuel. (Rappel : l'explication de sens « Pourquoi ce sens ? » reste absente pour la quasi-totalité des mots — couche Phase 44B minimale — mais elle est optionnelle et n'empêche aucune expérience.)

## 12. Funnel complet (chaîne d'intégrité)

```text
6 236 ayahs (100 % avec occurrences)
    ↓ -0
6 236 ayahs avec occurrences
    ↓ -5 366   (86,1 % des ayahs ont ≥ 1 occurrence sans sens FR)
  870 ayahs avec sens FR complet (toutes occurrences)
    ↓ (chaîne croisée, non séquentielle : FR et MASAQ sont indépendants)
2 318 ayahs avec MASAQ complet (lié)   — 2 317 avec blocs exploitables
    ↓ -1 696
  621 ayahs pleinement explicables (toutes occurrences EXPLANATION_FULL)
```

Pertes à chaque étape (calculées, jamais estimées) :
- **FR** : 5 366 ayahs (86,1 %) ont au moins une occurrence sans sens FR → couverture FR complète par ayah = 13,9 %.
- **MASAQ** : 3 918 ayahs (62,8 %) sans aucune preuve MASAQ.
- **Combiné** : 5 615 ayahs (90,0 %) ne sont pas FULL_EXPLANABLE.

## 13. MASAQ vs Explanation Matrix (occurrences)

| | Explanation YES (≥ 1 élément) | Explanation NO | Total |
|---|---:|---:|---:|
| **MASAQ YES** (blocs exploitables) | 22 484 | 0 | 22 484 |
| **MASAQ NO** | 54 946 | 0 | 54 946 |
| **Total** | 77 430 | 0 | 77 430 |

Lecture : **MASAQ n'est jamais la seule source d'explication** — chaque occurrence est expliquable au minimum par son sens (EN) et son contexte. La matrice « MASAQ disponible mais explication impossible » et « ni MASAQ ni explication » sont **vides** (0). L'enjeu n'est pas l'absence d'explication mais la **qualité** (FR + approfondissement) : 53 563 occurrences (69,2 %) sont expliquées au niveau minimal (sens EN + contexte) sans FR ni blocs MASAQ.

## 14. Gaps (analysés, non traités — pipeline FROZEN)

| GAP_ID | Niveau | Count | % | Root cause | Impact | Action requise | Priorité |
|---|---|---|---|---|---|---|---|
| GAP-FR-1 | FR_SENSE_GAP | 16 593 formes / 21 976 occurrences | 77,9 % formes / 28,4 % occ. | word_translations FR validées limitées à 4 490 formes (travail éditorial par lots, sourates du curriculum priorisées) | Word bank en fallback EN (flag `meaningFallback`) sur 28,4 % des occurrences ; label `partial` au lieu de `verified` | FUTURE_DATA_PHASE (pipeline gelé) — **aucun impact sur le curriculum actuel** | P1 (extension curriculum) |
| GAP-MASAQ-1 | MASAQ_GAP | 54 945 occurrences / 40 sourates | 71,0 % | Corpus MASAQ importé sur 74 sourates uniquement | Pas de décomposition linguistique hors des 74 sourates ; exercice d'explication moins riche | FUTURE_DATA_PHASE (import MASAQ restant) | P1 (extension curriculum) |
| GAP-EXPL-1 | EXPLANATION_GAP (sens) | 13 formes (0,06 %) avec `word_explanations` validées ; 1 contexte validé | 99,94 % sans | Couche Phase 44B à peine amorcée (Al-Fātiḥah) | Bloc « Pourquoi ce sens ? » absent quasi partout (optionnel, ne bloque rien) | FUTURE_DATA_PHASE (éditorial, priorité Al-Fātiḥah puis curriculum) | P2 |
| GAP-LEMMA-1 | LEMMA_GAP | 20 973 formes sans lemme (98,5 %) ; 28 traductions FR de lemme, 213 formes seulement en bénéficient | 98,5 % | Mapping lemme à l'état pilote (323 formes, 188 mappings) ; les 28 FR de lemme ne couvrent pas les lemmas liés aux formes | Bloc « famille » et exercice LEMMA_RELATION limités aux formes mappées | FUTURE_RESEARCH (architecture lemma) | P2 |
| GAP-DATA-1 | DATA_LINK_GAP | 1 occurrence NO_BLOCK | 0,001 % | Segments présents mais aucune règle de bloc satisfaite (AVAILABLE ≠ INFERABLE) | Aucun impact produit (explication minimale conservée) | NO_ACTION | P3 |
| GAP-DATA-2 | DATA_LINK_GAP | 0 orphelin / 0 segment manquant | 0 | Intégrité des liens parfaite (77 430/77 430 liées ; 22 485/22 485 avec segments) | Aucun | NO_ACTION | — |

Aucun gap ne touche le curriculum actuel. Les actions listées sont des **phases futures** ; aucune écriture n'est proposée ni exécutée ici.

## 15. Réponse définitive aux deux questions

### Question 1 — « Tous les versets ont-ils une explication pédagogique Hikma réellement exploitable ? »

> **PARTIALLY_CONFIRMED**

- Versets pleinement explicables (EXPLANATION_FULL) : **621 / 6 236 (10,0 %)**
- Versets partiellement explicables (minimal : contexte + sens EN/FR, sans approfondissement complet) : **5 615 / 6 236 (90,0 %)**
- Versets non expliquables : **0 / 6 236 (0 %)**
- Taux minimal : **100 %** — jamais « 100 % complet » sans preuve : le full est à 10,0 %.

### Question 2 — « Tous les versets ont-ils des données MASAQ exploitables ? »

> **NO_CONFIRMED**

- Versets avec preuve MASAQ (≥ 1 occurrence liée) : **2 318 / 6 236 (37,2 %)**
- Versets sans MASAQ : **3 918 / 6 236 (62,8 %)**
- Précision : un verset n'est compté « couvert » que si **toutes** ses occurrences sont liées (aucun verset partiellement couvert — 2 318/2 318 à 100 % liées ; 2 317 avec blocs).

## 16. Impact produit

| Cible | Impact |
|---|---|
| **PHASE 73 (Régularité & Rappels)** | **Aucun blocage.** La phase 73 ne touche ni le lexical ni l'explication : le curriculum est certifié 100 % couvert, l'expérience HikmaExplanation est complète sur tout le contenu enseigné. |
| **PHASE 74 (Couche fréquence)** | **Contrainte.** Les segments fréquents et le « chemin fréquence » ne peuvent être construits honnêtement qu'avec FR + MASAQ : réserver la phase 74 aux sourates PEDAGOGICAL_READY (24) et aux formes FR-résolues (4 703), en signalant explicitement le reste comme données futures. |
| **CURRICULUM** | **Règle dérivée du système (non inventée)** : « Une sourate est PEDAGOGICAL_READY ssi 100 % de ses occurrences sont EXPLANATION_FULL (sens FR résolu ET ≥ 1 élément d'approfondissement : blocs MASAQ OU explication de sens OU sens de lemme FR). » Toute extension de curriculum doit passer par cette règle. Candidats naturels suivants : sourates MASAQ_READY à FR partiel (ex. 98 Al-Bayyinah : FR 83 %, MASAQ 100 %) — nécessitent une phase data FR. |
| **POSITIONNEMENT PRODUIT** | La promesse « explication après chaque réponse » est **vraie à 100 %** (au minimum : sens + contexte ; jamais de bloc vide). La promesse « explication vérifiée » (label `verified`) doit rester réservée aux mots FR validés. Les labels `verified / partial / unavailable` déjà implémentés sont la bonne honnêteté : ne pas les supprimer ni les détourner. |

## 17. Recommandation

> **PROCEED_PHASE_73_WITH_CONSTRAINTS**

Justification : la certification ne révèle **aucun gap critique sur le contenu enseigné** (24/24 parcours à 100 % FR + MASAQ + explication complète ; 0 verset non expliquable ; 0 donnée manquante bloquante). La PHASE 73 (Régularité & Rappels) peut démarrer. Contraintes associées :

1. **Curriculum** : toute extension de parcours exige la règle PEDAGOGICAL_READY (100 % EXPLANATION_FULL par sourate) — vérifiable par le même audit avant toute ouverture.
2. **Communication** : `verified` uniquement pour le FR validé ; ne jamais afficher de « 100 % » global du Coran (le full global est à 10,0 %, le minimal à 100 %).
3. **PHASE 74** : couche fréquence construite uniquement sur les données FR+MASAQ réelles, avec signalement explicite des zones non couvertes ; prioriser au préalable une phase data FR ciblée (GAP-FR-1) si l'extension du curriculum devient prioritaire.

## 18. État final

```text
PHASE_72D_COMPLETE

DATABASE_WRITES = 0
LEXICAL_WRITES = 0
CODE_WRITES = 0
MIGRATIONS = 0
SEEDS = 0

PIPELINE_LEXICAL = FROZEN
HOLDS_PROCESSED = false
LOT_16_STARTED = false

IMPLEMENTATION_STARTED = false
COMMIT = false
PUSH = false

NEXT_PHASE_NOT_STARTED

STOP
```

---

*Méthode : script d'analyse temporaire read-only (SELECT uniquement, service-role, paginé, supprimé après exécution) répliquant les règles exactes de `buildLinguisticExplanation` / `pedagogicalExplanation` ; compteurs observés le 2026-08-22T18:46:15Z. Vérification finale `git status` / `git diff` : aucun changement non intentionnel (section 19 du prompt maître — cf. vérification jointe).*
