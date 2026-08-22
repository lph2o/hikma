# PHASE 24C — RECHERCHE D'UNE SOURCE LINGUISTIQUE PROFONDE COMMERCIALISABLE

**STATUS = READ_ONLY** · **DATABASE_WRITES = 0** · **CODE_WRITES = 0** · **IMPORTS = 0** · **MIGRATIONS = 0** · **SEEDS = 0** · **VALIDATIONS = 0**

> Aucune donnée externe n'a été téléchargée ou importée. Aucun scraping. Aucune écriture.

---

## 1. DÉCISION

### `SUCCESS` — voie concrète identifiée (OPTION B : assemblage multi-sources juridiquement compatibles)

**MASAQ** (CC BY 3.0, déclaré sur la page Mendeley) est la source principale identifiée : **root + lemma + POS + morphologie + segmentation + syntaxe** pour l'ensemble du Coran, avec une licence d'attribution commercialement utilisable. Elle remplace QAMAR comme candidat technique de référence, précisément parce que la licence est **déclarée** là où QAMAR reste silencieux.

La chaîne complète `mot → racine → forme morphologique → schème/dérivation → préfixe → suffixe → particules attachées → lemme → sens lexical → usages coraniques → nuances contextuelles` est atteignable **sans QAMAR**.

---

## 2. SYNTHÈSE DE LA RECHERCHE

### 2.1 Le tournant : MASAQ

MASAQ (*Morphologically-Analyzed and Syntactically-Annotated Quran*, ~131 000 entrées) est une ressource universitaire (Data in Brief, S2352340924011739 + article ACL 2025). Étudiée pendant cette phase, elle apporte :

| Champ | MASAQ |
|---|---|
| Racine | ✅ |
| Lemme | ✅ |
| POS | ✅ |
| Traits morphologiques | ✅ (genre, nombre, cas, temps… ) |
| Segmentation | ✅ (préfixes / suffixes / enclitiques) |
| Syntaxe | ✅ (rôle grammatical) |
| Alignement | séquence suit la structure de la sourate/ayah avec positions de tokens |
| Licence | **CC BY 3.0** (page Mendeley : « made available under the Creative Commons Attribution 3.0 License ») |

Sa licence CC BY autorise l'usage commercial, la modification et la dérivation **avec attribution** — exactement le cas Hikma (SaaS propriétaire, données enrichies internes). Cette **autorisation explicite de licence distingue MASAQ de QAMAR** (aucune licence déclarée pour le jeu de données).

**Réserve documentée** : la licence a été constatée telle que déclarée sur la page Mendeley ; la vérification finale se fait **au téléchargement** (présence d'un fichier LICENSE à l'intérieur du fichier). Le premier téléchargement devra être effectué par une personne habilitée après validation, encadré par le workflow (§6).

### 2.2 Pourquoi QAMAR reste bloqué

Rien de nouveau dans la phase 24C en faveur de QAMAR : aucune licence de jeu de données, aucun repository officiel, aucun dataset card. La décision 24B (`LEGAL_REVIEW_REQUIRED`) est confirmée et maintenue. **QAMAR ne bloque plus le projet** car MASAQ offre le même niveau de profondeur avec une licence claire.

---

## 3. MATRICE COMPARATIVE COMPLETE

| Source | Root | Lemma | POS | Morphologie | Segmentation | Licence | Commercial | SaaS | Alignement | Verdict |
|--------|------|-------|-----|------------|--------------|---------|-----------|------|------------|---------|
| **MASAQ** | ✅ | ✅ | ✅ | ✅ (détaillée) | ✅ | **CC BY 3.0** | ✅ (attribution) | ✅ | par position (sourate+verset+position) | **SAFE_WITH_ATTRIBUTION** |
| **QuranMorph** | ❌ | ✅ | ✅ | POS uniquement | ❌ | CC BY 4.0 | ✅ (attribution) | ✅ | word-level 77 429 | **SAFE_WITH_ATTRIBUTION** |
| Kazimirski 1860/69 / Lane | ✅ | ✅ | ❌ | ❌ | ❌ | domaine public (éd. originale) | ✅ | ✅ | lexicographique (pas token) | **SAFE_FOR_COMMERCIAL** |
| Quranic Arabic Corpus | ✅ | ✅ | ✅ | ✅ | ✅ | GNU GPL + terms of use | ⚠️ copyleft | ⚠️ risque | tokenisé | **LEGAL_REVIEW_REQUIRED** |
| QAMAR | ✅ | ✅ | ✅ | ✅ (stem) | partiel (stem) | **non divulguée** | inconnue | inconnue | à prouver | **LEGAL_REVIEW_REQUIRED** |
| EQTB / Quranic layered (Nashir) | ✅ | ✅ | ✅ | ✅ | ✅ | non vérifiée | ? | ? | ? | **LEGAL_REVIEW_REQUIRED** |
| Buckwalter / SAMA (LDC) | ✅ | ✅ | ✅ | ✅ | ✅ | LDC (accord payant) | ❌ | ❌ | couverture MSA, pas Coran | **LEGAL_REVIEW_REQUIRED / payant** |
| Hans Wehr (dictionnaire) | — | — | — | — | — | droit d'auteur | ❌ | ❌ | — | **NOT_SUITABLE** |
| Qabas | ❌ | ✅ | ✅ | ✅ | ? | CC-BY-ND-4.0 | ❌ (pas de dérivés) | ❌ | — | **NOT_SUITABLE** |

### Légende des verdicts

- **SAFE_FOR_COMMERCIAL** — exploitation libre (domaine public)
- **SAFE_WITH_ATTRIBUTION** — exploitable avec attribution (CC BY)
- **LEGAL_REVIEW_REQUIRED** — licence ambiguë, copyleft ou non vérifiée
- **NOT_SUITABLE** — licence incompatible avec un SaaS propriétaire (ND, droit d'auteur)

---

## 4. CLASSIFICATION (§17)

### A — SOURCES IMMÉDIATEMENT EXPLOITABLES (domaine public)
- **Kazimirski 1860/1869** — édition originale : racines, famille lexicale, dérivations (complément lexicographique ; extraction lourde, source éditoriale déjà utilisée pour la traduction)
- **Lane's Arabic-English Lexicon** — racines / définitions (extraction volumineuse à planifier)

### B — SOURCES EXPLOITABLES SOUS CONDITIONS (attribution)
- **MASAQ** (CC BY 3.0) → source **principale** : racine + POS + morphologie + segmentation
- **QuranMorph** (CC BY 4.0) : contrôle / réconciliation lemma + POS (pas de racine) — bordage tool

### C — SOURCES NÉCESSITANT UNE REVUE JURIDIQUE
- **QAMAR** (licence dataset non divulguée) — à confirmer auprès des auteurs avant toute utilisation
- **Quranic Arabic Corpus** (copyleft GPL + terms of use) — risque copyleft sur données annotées
- **EQTB / Quranic (Nashir)** (Mendeley rk94pn66m4, licence non affichée)
- **Buckwalter / SAMA** (LDC, accord commerçé payant ; corpus MSA hors Coran)

### D — SOURCES À EXCLURE
- **Qabas** (CC-BY-ND : pas de dérivés)
- **Hans Wehr** (droit d'auteur, pas de racine exploitable sans licence)

### E — DONNÉES MANQUANTES (et fournisseur cible)
| Donnée | Fournisseur cible |
|---|---|
| racine | MASAQ (principal) / Kazimirski-Lane (contrôle) |
| POS + morphologie | MASAQ (principal) / QuranMorph (contrôle) |
| segmentation | MASAQ (principal) |
| sens contextuel | **toujours éditorial Hikma** (jamais auto-extrait) |

---

## 5. RÉPONSES AUX 10 QUESTIONS (§18)

1. **Meilleure source techniquement** : MASAQ (131K+ entrées : racine + lemme + POS + morphologie + segmentation + syntaxe) — devance QAMAR grâce à sa licence claire.
2. **Meilleure source juridiquement** : MASAQ (CC BY 3.0 déclarée) puis QuranMorph (CC BY 4.0) ; Kazimirski/Lane en domaine public.
3. **Meilleure combinaison** : MASAQ (morphologie + racine) **+** QuranMorph (lemme/POS de contrôle) **+** Kazimirski/Lane (racines lexicographiques) **+** données éditoriales Hikma (gloses, contexte).
4. **Chaîne sans QAMAR ?** **OUI** — `mot → racine → forme → schème → préfixe → suffixe → particules → lemme → sens → usages → nuances` est couverte par MASAQ (+ QuranMorph/Kazimirski en complément).
5. **Constructible avec les données Hikma actuelles** : sens lexical (gloses éditoriales), contexte, usages coraniques, nuances contextuelles, audio.
6. **Nécessite une source externe** : racine, POS, trait morphologiques, schème, préfixes/suffixes, particules attachées, segmentation, famille lexicale.
7. **Revue juridique en priorité** : MASAQ (confirmation licence du fichier au téléchargement) ; en parallèle QuranMorph (immédiatement utilisable en CC BY).
8. **Pilote minimal sur Al-Fātiḥah** : aligner MASAQ (/QuranMorph) sur 1:1 → 1:7 (26 formes, 29 occurrences) par `(sourate, verset, position)` ; documenter EXACT / AMBIGUOUS / MISSING.
9. **Coût technique** : modéré — un aligneur `(sourate, verset, position) → quran_word` (réutilisant les proximités Phase 23), validation humaine des cas ambigus, tables d'import dédiées hors du moteur de glose. **Aucun impact** sur le runtime lexical existant (FORME → LEMME → EN).
10. **Avant tout téléchargement** : licence exacte du fichier (LICENSE/README), colonnes réelles du format (racine présente ?), version du dataset, conformité de la source du texte (Tanzil).

---

## 6. WORKFLOW OBLIGATOIRE (non entamé ici)

```
AUDIT SOURCE (24A/24B/24C) ✓
↓
LICENCE (24C : MASAQ CC BY 3.0 déclarée — confirmation fichier au téléchargement)
↓
ALIGNEMENT (pilote READ_ONLY — Phase 24D)
↓
PILOTE READ_ONLY (Al-Fātiḥah : 1:1 → 1:7)
↓
VALIDATION QUALITÉ (humaine + tests)
↓
LEGAL APPROVAL (humain)
↓
MIGRATION (nouvelles tables linguistiques, hors données de glossaire)
↓
IMPORT CONTRÔLÉ (idempotent)
↓
INTÉGRATION HikmaExplanation (niveau 4-décomposition)
```

Aucune étape n'est sautée. Le **téléchargement de MASAQ** n'est pas effectué dans cette phase (décision humaine + validation de licence au fichier).

---

## 7. NON-RÉGRESSION

- `FATIHAH_REFERENCE_LOCKED = PRESERVED`
- Aucune modification : code produit, Supabase, `quran_words`, `lemmas`, `word_translations`, `lemma_translations`, `word_lemma_mapping`, curriculum, grading, SRS, mastery, progression, audio, traductions.
- Aucun import, aucun seed, aucune migration.

---

## 8. LIVRABLES

- `PHASE_24C_LINGUISTIC_SOURCE_COMMERCIAL_RESEARCH.md` (ce fichier)
- `tmp/phase24c-linguistic-source-commercial-research.json` (JSON validé : 10 sources, matrice, réponses aux 10 questions, classification A→E)

---

## 9. TERMINALE

```
DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

FATIHAH_REFERENCE_LOCKED = PRESERVED
AUTRES : toutes décisions 20D à 24B = PRESERVED

Aucune donnée externe intégrée.
Aucune décision d'import prise automatiquement.
```

**FIN PHASE 24C**