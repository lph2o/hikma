# PHASE 23 — AUDIT & CONCEPTION DE LA COUCHE LINGUISTIQUE PROFONDE HIKMA

STATUS = READ_ONLY
DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

## 1. Executive Summary

Hikma sait expliquer un mot selon : **forme → lemme (partiel) → sens lexical
(partiel) → usages coraniques (complet) → nuances contextuelles (partiel)**.
Elle ne peut **pas** expliquer : **racine, forme morphologique, schème,
préfixes, suffixes, particules attachées, famille lexicale** — car ces données
sont **absentes en base** (`root = 0`, aucune morphologie, aucune segmentation
structure).

La bonne explication profonde exige une **source linguistique externe**.
Le candidat principal reste **QAMAR** (stem + lemme + racine + POS, vérifié),
mais sa **licence n'est pas confirmée**.

Décision : **D — LEGAL_REVIEW_REQUIRED**.

## 2. Audit live du schéma et des données (§3)

### A. quran_words — 21 296 lignes

| Champ | Type | Remplissage | Usage runtime |
|---|---|---|---|
| id | uuid | 100 % | clé |
| arabic | text unique | 100 % | forme affichée |
| transliteration | text | **21 296/21 296** | affichée |
| meaning | text (EN) | **21 296/21 296** | fallback EN |
| root | text | **0** | — (FUTURE WORK) |
| lemma_id | uuid | **135** | lemme direct |
| source_id | uuid | — | provenance |
| created_at | timestamptz | — | — |

> **Correction** : `quran_words` ne possède **pas** de colonne
> `normalized_text` (contrairement au prompt). `normalized_text` appartient à
> `word_occurrences` (et y est vide : 0/77 430).

### B. lemmas — 32 lignes

| Champ | Remplissage |
|---|---|
| arabic | 32/32 |
| transliteration | **0** |
| meaning | **0** |
| root | **0** |

Les 32 lemmes n'ont que leur forme arabe (le sens vient de
`lemma_translations`, séparément).

### C. word_lemma_mapping — 184 lignes (toutes `safe`)

- `exact_surface` : 171 · `editorial` : 13.
- `evidence` porte la décomposition **textuelle** (ex. « و + ال + ناس ») — pas
  une segmentation structurée.

### D. word_translations — 70 lignes (toutes fr + validées)

### E. lemma_translations — 32 lignes (28 fr validées, 4 non validées)

### F. word_occurrences — 77 430

`word → occurrence (ayah_id, position) → ayah → surah`. Chaîne dénormalisée
et fiable.

### G. translations — 24 944 = 6 236 × 4

| resource_id | Source | Lignes |
|---|---|---|
| 31 | Hamidullah FR | 6 236 |
| 9001 | Kazimirski 1869 FR | 6 236 |
| 20 | Sahih International EN | 6 236 |
| 153 | Piccardo IT | 6 236 |

Confirmé : utilisées **uniquement** comme contexte (jamais comme glose).

## 3. Évaluation de la chaîne linguistique (§4, §22)

| Niveau | Statut | Pourquoi |
|---|---|---|
| mot / forme | ✅ AVAILABLE | arabic + translittération 100 % |
| racine | ❌ EXTERNAL_SOURCE_REQUIRED | root = 0 partout |
| forme morphologique (POS…) | ❌ EXTERNAL_SOURCE_REQUIRED | MORPHOLOGY_UNAVAILABLE |
| schème / wazan | ❌ EXTERNAL_SOURCE_REQUIRED | aucun pattern |
| préfixes | ❌ EXTERNAL_SOURCE_REQUIRED | proclitiques fusionnés |
| suffixes | ❌ EXTERNAL_SOURCE_REQUIRED | enclitiques fusionnés |
| particules attachées | 🟡 PARTIAL | uniquement evidence textuelle |
| lemme | 🟡 PARTIAL | 135 + 184 mapping sur 21 296 |
| sens lexical | 🟡 PARTIAL | 70 + 28 FR validées ; EN 100 % |
| famille lexicale | ❌ UNAVAILABLE | racine absente |
| usages coraniques | ✅ AVAILABLE | occurrences → ayahs → 4 traductions |
| nuances contextuelles | 🟡 PARTIAL | 4 traductions alignées, pas de synthèse/occurrence |
| évolution historique | ❌ UNAVAILABLE | hors périmètre (Coran ≠ arabe historique ≠ lexicographie) |

## 4. Pourquoi les explications sont répétitives (§5, §17)

`HikmaExplanation` est une **primitive de présentation** qui reçoit, par mot :
`meaning`, `lemmaMeaning`, `lemmaRelation`, `context`, `audioUrl`. Deux mots
sans lemme/racine/morphologie produisent donc la **même structure**
« Sens + Contexte » : seule la valeur de la glose change. La diversité
dépend du texte de la glose, pas d'une structure linguistique.

**Données interrogeables mais non affichées** : compteur d'occurrences,
autres sourates du mot, autres formes du même lemme.

## 5. Exemple complet (§13, §17) — résolution runtime actuelle

| Mot | Glose | Lemme | Racine | Relation lemme |
|---|---|---|---|---|
| وَٱلنَّاسِ | gens / hommes (validé) | via mapping نَاس | ❌ | ✅ siblings |
| يَكُن | être (validé) | ❌ null | ❌ | ❌ |
| قُلْ | dis (validé) | ❌ null | ❌ | ❌ |
| شَرِّ | le mal (validé) | ❌ null | ❌ | ❌ |

Pour chacun, l'explication actuelle = **Sens + (Contexte) + (Audio)**. Une
source morphologique ajouterait : racine, POS, stem, segmentation, famille,
pour les niveaux 4–8.

## 6. Cas particuliers (§14–16)

- **وَٱلنَّاسِ** : mapping éditorial → نَاس (glose OK). Manque : segmentation
  structurée `و + ال + ناس` + informations grammaticales.
- **يَكُن** : glose « être », 24 occ., `lemma_id = null`. Manque : lemme كَانَ
  + forme verbale + valeur grammaticale — à fournir par une source (pas de
  mapping inventé).
- **ٱللَّهِ** : `lemma_id` direct → الله (OK). Manque : cas grammatical,
  décomposition du proclitique لِ. NB : `لِلَّهِ → lemme « لِلَّه »` (lemme
  fusionné) — inventaire lemmes à nettoyer via une source.

## 7. Sources externes (§7, §8)

| Source | Licence | Racine | Lemme | POS | Morpho | Segment. | Commercial |
|---|---|---|---|---|---|---|---|
| **QAMAR** | non divulguée | ✅ | ✅ | ✅ | stem | partiel | REVIEW |
| QuranMorph | CC BY 4.0 | ❌ | ✅ | ✅ | POS | ❌ | ATTR |
| Quranic Arabic Corpus | non-commercial | ✅ | ✅ | ✅ | complète | ✅ | NO |
| Qabas | CC-BY-ND | ❌ | ✅ | — | — | — | NO |
| Buckwalter/SAMA | LDC | ❌ | ✅ | ✅ | ✅ | ✅ | REVIEW |
| Lane | domaine public | ✅ | — | — | — | — | SAFE |
| Hans Wehr | copyright | ✅ | — | — | — | — | NO |
| Kazimirski 1860/69 | domaine public | ✅ | — | — | — | — | SAFE |

**Règle absolue** : Hikma est commercial ; aucune donnée externe n'est
intégrée sans audit juridique. Glose = éditorial Hikma (jamais depuis une
source) ; morphologie = source morphologique ; lexique = source
lexicographique. Ne jamais demander à une source ce qu'elle ne contient pas.

## 8. Alignement (§9)

| Corpus | Tokens | Versets | Formes uniques |
|---|---|---|---|
| Hikma | 77 430 | 6 236 | 21 296 |
| QuranMorph | 77 429 | 6 235 | 19 009 |

- Δ +1/+1 (probable basmala 1:1).
- Écart formes uniques (21 296 vs 19 009) : la segmentation Quran.com produit
  plus de variantes orthographiques.
- **Aligner par occurrence (`surah + ayah + position`), jamais par chaîne
  arabe.** Constaté : les recherches par chaîne exacte (رَحْمَة, ٱللَّهِ)
  échouent selon la normalisation diacritique.

## 9. Architecture de données proposée (§10 — non implémentée)

```
word → linguistic_analysis (root, lemma_id, stem, pattern, pos, features, source_id, is_validated)
word → segmentation (prefix, stem, suffix, particles, source_id, is_validated)
occurrence → occurrence_analysis (contextual_morphology, syntactic_role, contextual_sense)  [optionnel]
```

- Additif, réversible, `source_id` + `is_validated` obligatoires.
- **Séparer** données linguistiques et données pédagogiques (mastery/SRS/grading/progression intactes).
- Ne pas toucher `quran_words` / `word_translations` / `lemma_translations` /
  `word_lemma_mapping` / `translations` sans phase contrôlée.

## 10. Stratégie pédagogique (§6, §11)

Progressive (9 niveaux), jamais tout montrer :

```
NIVEAU 1 Réponse → NIVEAU 2 Identité → NIVEAU 3 Contexte
→ [« Comprendre le mot »] NIVEAU 4 Structure (racine) → NIVEAU 5 Morphologie
→ NIVEAU 6 Famille → NIVEAU 7 Usage → NIVEAU 8 Nuance (4 traductions) → NIVEAU 9 Audio
```

Un niveau n'apparaît **que** si la donnée est réelle (sinon `ABSENT_DATA`).

Adaptatif selon l'erreur : sens→glose+contexte ; lemme→forme+lemme+famille ;
reconnaissance→identité+distinctifs ; répétée→plus profonde ; déjà vu→lien
avec l'apparition précédente.

## 11. Décision

**D — LEGAL_REVIEW_REQUIRED**

Justification :
- données actuelles **insuffisantes** (donc pas A) ;
- un **candidat principal unique** est identifié — QAMAR — qui couvre
  racine+stem+lemme+POS (donc pas C comme réponse primaire) ;
- sa **licence n'est pas confirmée** : la porte d'entrée obligatoire est la
  revue juridique (donc D), avant alignement, pilote, import ;
- l'architecture n'a **pas besoin d'être refondue** (donc pas E) : les champs
  optionnels de `HikmaExplanation` accueillent déjà l'enrichissement progressif.

Workflow à respecter (aucune étape sautée) :
`AUDIT SOURCE → LICENCE → ALIGNEMENT → PILOTE READ_ONLY → VALIDATION QUALITÉ → APPROVAL → MIGRATION → IMPORT → INTÉGRATION HIKMAEXPLANATION`.

## 12. État final

- Décision : **D — LEGAL_REVIEW_REQUIRED**
- Base : `quran_words 21 296` · `word_occurrences 77 430` · `ayahs 6 236` ·
  `translations 24 944` · `word_translations 70` · `lemma_translations 28` ·
  `word_lemma_mapping 184` — **inchangées**.
- Fātiḥah : 8 leçons · 26 formes · 29 occ · 26/26 audio — **PRESERVED**.
- Fichiers créés : `PHASE_23_LINGUISTIC_DATA_FOUNDATION_AUDIT.md`,
  `tmp/phase23-linguistic-data-foundation-audit.json`.
- Tests : hérités de 21G (456 passed) — aucune modification en Phase 23.
- Anomalies : `لِلَّهِ → lemme « لِلَّه »` (lemme fusionné) ; inventaire lemmes à nettoyer via source.
- Risques : licence QAMAR non confirmée · alignement token à prouver · surcharge pédagogique.

---

DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

FATIHAH_REFERENCE_LOCKED = PRESERVED

---

## PROMPT POUR LA PHASE SUIVANTE (copiable)

```
# PHASE 24 — LINGUISTIC SOURCE LEGAL REVIEW & ALIGNMENT PILOT (READ_ONLY)

Contexte verrouillé : FATIHAH_REFERENCE_LOCKED · runtime FORME>LEMME>EN
inchangé · translations = contexte uniquement · 4 sourates pilotes (112/113/
114/108) intangibles · grading/scoring/SRS/mastery/progression/curriculum
inchangés · gloses éditoriales (word_translations 70 / lemma_translations 28)
inchangées · word_lemma_mapping 184 safe inchangé.

STATUS = READ_ONLY. DATABASE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0 ·
SEEDS = 0 · VALIDATIONS = 0.

OBJECTIF :
1. Établir la LICENCE EXACTE de QAMAR (Faqihi et al., AbjadNLP 2026, DOI
   10.18653/v1/2026.abjadnlp-1.38) auprès de la source officielle/auteurs :
   licence, attribution, share-alike, ND, NC, usage commercial, stockage,
   transformation, redistribution. Sans confirmation : LEGAL_REVIEW_REQUIRED,
   ne rien importer.
2. En parallèle, préparer la PREUVE D'ALIGNEMENT (lecture seule) : comparer la
   tokenisation QAMAR/QuranMorph (77 429 tokens, 6 235 versets) à Hikma
   (77 430 occurrences, 6 236 ayahs) sur les 26 formes Al-Fātiḥah, au niveau
   occurrence (surah+ayah+position). Identifier la source du Δ +1/+1 (basmala)
   et l'écart formes uniques (21 296 vs 19 009). Aucun mapping silencieux.
3. Produire un dossier de décision : matrice licence (SAFE_FOR_COMMERCIAL /
   SAFE_WITH_ATTRIBUTION / REQUIRES_REVIEW / NOT_SUITABLE / UNKNOWN), taux
   d'alignement estimé, plan d'import contrôlé (racine/stem/lemma/POS) selon le
   standard lexical Phase 22 (revue humaine, idempotence, non-régression).

DÉCISION attendue : A — SOURCE_LICENSE_CONFIRMED (prêt pour pilote d'import)
ou B — LICENSE_BLOCKED (source non exploitable commercialement) ou
C — ALIGNMENT_UNRESOLVED (impossible d'aligner proprement) ou
D — RESEARCH_CONTINUES.

Livrables : PHASE_24_LINGUISTIC_SOURCE_LEGAL_REVIEW.md +
tmp/phase24-linguistic-source-legal-review.json.

NE PAS importer, NE PAS créer de migration, NE PAS modifier HikmaExplanation,
NE PAS créer de racines/mappings/gloses. FIN PHASE 24.
```

FIN PHASE 23
