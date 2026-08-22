# PHASE 23 — LINGUISTIC DATA RESEARCH & EXPLANATION ENRICHMENT FOUNDATION

STATUS = READ_ONLY
DATABASE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
VALIDATIONS = 0

## 1. Executive Summary

L'explication après erreur est **correcte mais générique** : elle répète la
bonne réponse (« شَرِّ signifie le mal ») sans expliquer *pourquoi*, ni la
forme, ni le lemme, ni la racine, ni la construction.

Cette phase de recherche établit que le blocage est **uniquement une question
de données linguistiques**, pas d'architecture. Un candidat principal —
**QAMAR** (2026) — fournit en une seule source, manuellement vérifiée, le
**stem, le lemme, la racine et le POS** pour chaque mot coranique. Sa licence
n'est toutefois **pas divulguée publiquement** : elle doit passer en revue
juridique avant tout usage.

Décision : **A — LINGUISTIC_SOURCE_READY_FOR_LEGAL_REVIEW**.

## 2. Pourquoi les explications actuelles sont génériques

Le moteur (`resolveWordMeanings` → `buildWordBank` → `HikmaExplanation`) ne
possède, par mot, que : forme arabe, translittération, glose (forme/lemme),
contexte du verset, audio. Il ne possède **ni racine, ni morphologie, ni
segmentation, ni sens contextuel** — donc il ne peut pas les expliquer.

## 3. Données manquantes (mesurées en base)

| Donnée | État Hikma |
|---|---|
| Forme + translittération | ✅ 21 296/21 296 |
| Gloses FR (forme/lemme) | ✅ 70 + 28 |
| Lemme (direct + mapping) | 🟡 135 + 184 |
| **Racine** | ❌ `quran_words.root` = 0 · `lemmas.root` = 0 |
| **Morphologie (POS/cas/genre/…)** | ❌ aucune table |
| **Segmentation** | ❌ `normalized_text` = 0, aucune structure |
| **Sens contextuel par occurrence** | ❌ gloses globales uniquement |

## 4. Niveaux linguistiques (à ne pas confondre)

FORME (`وَٱلنَّاسِ`) ≠ LEMME (`نَاس`) ≠ RACINE (`ن و س`) ≠ SEGMENTATION
(`و + ال + ناس`) ≠ POS (`nom`) ≠ TRAITS (`cas/nombre/genre`) ≠ FONCTION
(`sujet/objet`) ≠ SENS LEXICAL (`gens/hommes`) ≠ SENS CONTEXTUEL (dans l'ayah).

## 5. Sources auditées

### A. QAMAR (candidat principal)

- **Référence** : Faqihi, Bouzoubaa, Tajmout, Namly — *AbjadNLP/EACL 2026*.
  DOI `10.18653/v1/2026.abjadnlp-1.38`.
- **Données** : MSA equivalent + **stem + lemma + root + POS**, pour **chaque
  mot coranique**, **manuellement vérifié** (gold-standard), multi-tâches
  (normalisation, lemmatisation, extraction de racine, POS).
- **Licence** : **NON divulguée** dans les métadonnées publiques. Le
  *supplementary material* (`2026.abjadnlp-1.38.OptionalSupplementaryMaterial.zip`)
  doit être vérifié auprès des auteurs / de la source officielle.
- **Commercial** : **UNKNOWN → REQUIRES_REVIEW** (ne pas supposer compatible).
- **Atout** : c'est la **seule source** identifiée qui couvre stem+lemme+racine+POS
  en un seul corpus manuellement vérifié.

### B. QuranMorph (2025)

- CC BY 4.0 (commercial compatible avec attribution). 77 429 tokens, 6 235
  versets, 19 009 formes uniques, **4 616 lemmes** (Qabas), **40 POS**
  (SAMA/Qabas). **Pas de racine.** Tokenisation « mots » (clitiques fusionnés),
  localisation `(chapter:verse:word)`.

### C. Quranic Arabic Corpus (corpus.quran.com)

- Référence morphologie **complète** (cas, genre, nombre, personne, temps,
  mode, voix) + **segmentation clitique** (128 219 formes) + syntaxe + sens.
  **Non-commercial** → **NOT_SUITABLE**.

### D. Autres sources lexicales classiques

| Source | Racine | Licence | Statut |
|---|---|---|---|
| Qabas | lemmes | CC-BY-ND-4.0 | NOT_SUITABLE (ND) |
| Buckwalter / SAMA (LDC) | stems+affixes | LDC (accord) | REQUIRES_REVIEW (MSA, pas Coran) |
| Lane's Lexicon (1863-93) | ✅ racines+defs | domaine public | SAFE_FOR_COMMERCIAL |
| Hans Wehr | ✅ racines | copyright | NOT_SUITABLE |
| Kazimirski 1860/69 | ✅ racines+defs FR | domaine public (édition originale) | SAFE_FOR_COMMERCIAL |

## 6. Matrice de comparaison

| Source | Licence | Forme | Lemme | Racine | POS | Morpho | Segment. | Sens | Couverture | Commercial |
|---|---|---|---|---|---|---|---|---|---|---|
| QAMAR | UNKNOWN | ✅ | ✅ | ✅ | ✅ | stem | partiel | ❌ | complet | REVIEW |
| QuranMorph | CC BY 4.0 | ✅ | ✅ | ❌ | ✅ | POS | ❌ | ❌ | 77 429 | ATTR |
| Quranic Arabic Corpus | non-comm. | ✅ | ✅ | ✅ | ✅ | complète | ✅ | ✅ | complet | NO |
| Qabas | CC-BY-ND | — | ✅ | ❌ | ✅ | ✅ | — | — | 60K lemmes | NO |
| Buckwalter/SAMA | LDC | — | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | MSA | REVIEW |
| Lane | pub. dom. | — | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | lexique | SAFE |
| Hans Wehr | copyright | — | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | lexique | NO |
| Kazimirski 1860/69 | pub. dom. | — | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | lexique | SAFE |

## 7. Alignement des tokens (point critique)

| Corpus | Tokens | Versets | Formes uniques |
|---|---|---|---|
| Hikma | **77 430** | **6 236** | **21 296** |
| QuranMorph | 77 429 | 6 235 | 19 009 |

- **Δ tokens = +1**, **Δ versets = +1** (cohérent, probablement la basmala 1:1).
- **Écart formes uniques 21 296 vs 19 009** : la segmentation Quran.com produit
  plus de variantes orthographiques (diacritiques, marques de pause).
- **Recommandation** : aligner au niveau **occurrence** (`surah + ayah + position`),
  **jamais par chaîne arabe**. Le format `location (chapter:verse:word)` de
  QuranMorph/QAMAR est la clé. Aucun mapping silencieux : toute correspondance
  incertaine doit être signalée.

## 8. Corpus pilote Al-Fātiḥah (26 formes, mesuré)

| Métrique | Valeur |
|---|---|
| Formes | 26 |
| Occurrences (sourate 1) | 29 |
| Gloses de forme | 25 |
| Lemme couvert (direct) | 9 |
| Audio | 26/26 |
| Racine | 0/26 |
| Morphologie | 0/26 |

- **9 formes avec lemme** : الرَّحِيم · الْحَمْد · يَوْم · رَبّ · بِسْم ·
  الْعَـٰلَمِين · الرَّحْمَـٰن · الله · **لِلَّه**.
- **Anomalie documentée** : `لِلَّهِ → lemme « لِلَّه »` (lemme fusionné avec
  le proclitique لِ) alors que `ٱللَّهِ → الله`. L'inventaire des lemmes
  mélange **vrais lemmes** (الله) et **formes fusionnées** (لِلَّه) — une
  source morphologique (QAMAR) nettoierait ceci.
- **17 formes sans lemme** (إِيَّاكَ, أَنْعَمْتَ, نَسْتَعِينُ, وَلَا,
  ٱلَّذِينَ, عَلَيْهِمْ…) : exactement les formes fléchies/fusionnées que la
  morphologie doit décomposer.

## 9. Cas particuliers

- **يَكُن** : glose « être », 24 occurrences, `lemma_id = null`. Une couche
  morphologique relierait كَانَ / يَكُونُ / يَكُن par le lemme كَانَ **sans
  mapping inventé** (source fiable).
- **وَٱلنَّاسِ** : mapping éditorial → نَاس ; la décomposition و+ال+ناس n'est
  que textuelle aujourd'hui — une source de segmentation la structurerait.
- **الله / ٱللَّهِ / لِلَّه** : doit distinguer forme/lemme/éléments
  grammaticaux ; ne pas remplacer le mapping existant.

## 10. Réponses aux 17 questions

1. **Pourquoi générique ?** Données absentes (racine/morphologie/segmentation/sens contextuel).
2. **Données manquantes ?** Racine, POS, traits morphologiques, segmentation, sens contextuel.
3. **Quelle source pour chaque donnée ?** QAMAR (stem/lemme/racine/POS) ; glose = Hikma éditorial.
4. **Source juridiquement exploitable ?** QuranMorph (CC BY 4.0, sans racine) ; Kazimirski/Lane (domaine public, racines) ; QAMAR à confirmer.
5. **Techniquement la meilleure ?** QAMAR (couverture complète + racine + stem + POS, vérifié).
6. **Alignable avec Hikma ?** Oui, au niveau occurrence (surah+ayah+position), à prouver sur les 26 formes.
7. **Coût/risque d'intégration ?** Modéré : alignement + validation juridique + import contrôlé.
8. **Que stocker ?** Racine, lemme, POS, stem, MSA (additif, source_id + is_validated).
9. **Que calculer ?** Sens contextuel, famille lexicale, connexions coraniques (dérivations).
10. **Varier selon l'erreur ?** Diagnostic d'erreur (catégories A–J) ; lexical faisable, grammatical exige morphologie.
11. **Exploiter la racine ?** Regrouper famille lexicale (une fois racine peuplée).
12. **Exploiter le lemme ?** Déjà fait (FORME > LEMME > EN) ; étendre la couverture lemme.
13. **Exploiter la segmentation ?** Montrer و+ال+ناس (une fois segmentation structurée).
14. **Exploiter la morphologie ?** POS + traits « juste assez » (débutant).
15. **Exploiter la famille ?** Racine → lemmes → formes (une fois racine disponible).
16. **Éviter la surcharge ?** Disclosure progressive Essentiel → Comprendre → Décomposer → En savoir plus.
17. **Prochaine phase ?** Revue juridique QAMAR + preuve d'alignement token sur Fātiḥah.

## 11. Architecture cible (proposée, non implémentée)

```
quran_words ──► linguistic_analysis (lemma, root, pos, stem, msa, source_id, is_validated)
word_occurrences ──► occurrence_analysis (contextual_morphology, syntactic_role, contextual_sense)
```

- **Additif** : aucune modification de `quran_words` / `word_translations` /
  `lemma_translations` sans phase contrôlée.
- Peupler `quran_words.root` / `lemmas.root` depuis une source validée (jamais
  par déduction).
- `source_id` + `is_validated` obligatoires (traçabilité + workflow éditorial).

## 12. Classification juridique

| Source | Classification |
|---|---|
| QAMAR | REQUIRES_REVIEW (licence à confirmer) |
| QuranMorph | SAFE_WITH_ATTRIBUTION |
| Quranic Arabic Corpus | NOT_SUITABLE |
| Qabas | NOT_SUITABLE |
| Buckwalter/SAMA | REQUIRES_REVIEW (LDC) |
| Lane | SAFE_FOR_COMMERCIAL |
| Hans Wehr | NOT_SUITABLE |
| Kazimirski 1860/69 | SAFE_FOR_COMMERCIAL (édition originale) |

## 13. Non-régression (vérifiée)

`quran_words = 21 296` · `word_occurrences = 77 430` · `ayahs = 6 236` ·
`translations = 24 944` · Fātiḥah : 8 leçons, 26 formes, 29 occurrences,
26/26 audio. Gloses validées inchangées. `FATIHAH_REFERENCE_LOCKED = PRESERVED`.

## 14. Décision

**A — LINGUISTIC_SOURCE_READY_FOR_LEGAL_REVIEW**

QAMAR est techniquement excellent et suffisamment documenté (paper ACL +
supplementary material) pour passer à une **revue juridique** de sa licence,
puis à une **preuve d'alignement** token sur les 26 formes Fātiḥah — avant
tout import contrôlé selon le standard lexical Phase 22.

---

DATABASE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
VALIDATIONS = 0

FATIHAH_REFERENCE_LOCKED = PRESERVED
grading / scoring / SRS / mastery / progression / curriculum = PRESERVED

FIN PHASE 23
