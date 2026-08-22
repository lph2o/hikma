# PHASE 24D — MASAQ READ-ONLY PILOT — AL-FĀTIḤAH

**STATUS = PREPARE_AND_VALIDATE** · **DATABASE_WRITES = 0** · **HIKMA_DATA_WRITES = 0** · **IMPORTS = 0** · **MIGRATIONS = 0** · **SEEDS = 0** · **PRODUCTION_CODE_WRITES = 0**

> Téléchargement unique depuis la source officielle (Mendeley Data, DOI de v2) effectué pour ce pilote. **Aucune donnée MASAQ importée dans Supabase. Aucune modification Hikma.**

---

## A — PROVENANCE

| Élément | Valeur |
|---|---|
| Dataset | **MASAQ v2** — *Morphologically-Analyzed and Syntactically-Annotated Quran* |
| DOI | 10.17632/9yvrzxktmr.2 |
| Auteur | Majdi Sawalha |
| Institution | University of Jordan |
| Publication | 2024-10-22 (Mendeley Data) |
| Source textuelle | Tanzil.net (Uthmani, édition du Caire 1924, Ḥafṣ) |
| Fichiers | MASAQ.csv (18,6 Mo) · MASAQ.tsv · MASAQ.json (98 Mo) · MASAQ.db (59 Mo) |
| **Fichier téléchargé** | `tmp/MASAQ.csv` — 18 650 409 octets, 157 677 lignes, 19 colonnes |
| **SHA-256** | `777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900` — **identique** à la valeur déclarée par l'API officielle Mendeley |
| Téléchargement | URL officielle `data.mendeley.com/public-files/datasets/9yvrzxktmr/files/…/file_downloaded` (pas de miroir, pas de scraping) |

## B — LICENCE

- **Page Mendeley** : « made available under the **Creative Commons Attribution 3.0** License »
- **Registre DataCite** (métadonnées officielles du DOI) : « **Creative Commons Attribution 4.0 International** » (legalcode `creativecommons.org/licenses/by/4.0`)
- Les deux sont des licences **BY** : usage commercial autorisé, modification/dérivés autorisés, **attribution obligatoire**. Bien que la version diffère (3.0 vs 4.0), les deux permettent le cas Hikma (SaaS propriétaire + dérivés stockés en base).
- **Réserve** : le fichier CSV ne contient pas de fichier LICENSE embarqué ; la licence est portée par la page officielle et le registre DOI. Une mention d'attribution devra être incluse (ex. « MASAQ — Sawalha (2024), Mendeley Data, DOI 10.17632/9yvrzxktmr.2 »).
- Verdict : **SAFE_WITH_ATTRIBUTION** (pas de LEGAL_REVIEW_REQUIRED).

## C — STRUCTURE DU DATASET (19 colonnes réelles)

| Champ MASAQ | Type | Exemple (1:1) | Utilité Hikma |
|---|---|---|---|
| ID | int | 1 | — |
| Sura_No / Verse_No | int | 1, 1 | **alignement** (surah+ayah) |
| Word_No | int | 1 | **alignement** (position du token) |
| Segment_No | int | 1, 2 | segmentation (sous-token) |
| Word | texte diacrité | بِسْمِ | comparaison forme |
| Without_Diacritics | texte | بسم | clé de rapprochement |
| Segmented_Word | texte | ب / اسم | **segmentation préfixe/stem/suffixe** |
| Morph_Tag | enum | PREP / NOUN_ABSTRACT | **POS** (22 tags sur Fātiḥah) |
| Morph_Type | Prefix\|Stem\|Suffix | Prefix / Stem | **segmentation** |
| Punctuation_Mark | texte | (vide) | — |
| Invariable_Declinable | enum | INVAR / DECLN | **morphologie** (invariabilité) |
| Syntactic_Role | enum | PREP / PREP_OBJ | **syntaxe** |
| Possessive_Construct | enum | CONSTRUCT | **morphologie** (état construit) |
| Case_Mood | enum | GENITIVE | **morphologie** (cas/mode) |
| Case_Mood_Marker | enum | KASRA | **morphologie** (marque) |
| Phrase | enum | PHRASE | **syntaxe** |
| Phrasal_Function | enum | PRED | **syntaxe** |
| Gloss | str | in-(the)-name | glose EN (évidence, jamais glose FR) |
| **Root** | — | **ABSENTE** | ⚠️ nécessite une autre source |
| **Lemma** | — | **ABSENTE** (stem par segment) | ⚠️ comparer avec lemma_id Hikma |
| **Pattern/schème** | — | **ABSENT** | ⚠️ |

> Le dataset est annoncé « 20 colonnes » mais le CSV réel en contient **19** ; la formulation « 131K » correspond au nombre de lignes (157 676 hors en-tête) ou de segments.

## D — AL-FĀTIḤAH EXTRACTION

- MASAQ : **29 mots** (Word_No 1..9) sur 7 versets — **exactement les 29 occurrences Hikma** (26 formes).
- 56 segments (24 mots > 1 segment, max 3 : préfixe + stem + suffixe).

## E — ALIGNEMENT (surah + ayah + position — pas de chaîne seule)

| Statut | Nombre | Détail |
|---|---|---|
| **EXACT** | 13 | chaîne identique après retrait des diacritiques |
| **EXACT_ORTHO** | 14 | identique après normalisation orthographique (wasla ٱ→ا, dagger alif ـٰ→ا, tatweel) |
| **VARIANTS** (2 cas) | 2 | `ٱلرَّحْمَـٰنِ` (Quran.com écrit l'alif minuscule) vs `الرَّحْمَنِ` (Tanzil ne l'écrit pas) — **même mot, variante orthographique documentée** |
| MISSING | **0** | |
| EXTRA | **0** | |
| AMBIGUOUS (vrai) | **0** | |

→ **29/29 occurrences alignées sans ambiguïté réelle**. Nécessite une normalisation orthographique simple (wasla, dagger-alif, hamzées, tatweel) — quasi-effet de bord, aucune règle sonore.

## F — RACINES

- Hikma : `quran_words.root` = **0/29 rempli** (0/21 296 globalement).
- MASAQ : **aucune colonne racine** (vérifié sur le CSV réel).
- Verdict : **ROOT_MISSING** — la racine devra venir d'une source complémentaire (Kazimirski 1860/69, Lane, ou future couche morphologique) ou rester FUTURE_WORK.

## G — LEMMES

Comparaison MASAQ (stem du segment Stem) vs lemma_id Hikma :

| Comparaison | Nb | Exemple |
|---|---|---|
| MATCH | 2 | (mots simples partageant la même forme) |
| DIFFERENCE | 9 | Hikma stocke des **lemmes ​*formels*** incluant article/préposition : « ٱلْحَمْد » (Hikma) vs « حمد » (MASAQ) ; « بِسْم » vs « اسم » ; « لِلَّه » vs « له » ; « الرَّحْمَـٰن » vs « رحمن » ; « الْعَـٰلَمِين » vs « عالم » |
| MASAQ_ONLY | 18 | MASAQ fournit un stem là où Hikma n'a pas de lemma_id (ex. نَسْتَعِينُ → « استعن » ? vérifié) |
| HIKMA_ONLY | 0 | |

→ MASAQ apporte des **stems normalisés** sur 29/29 occurrences ; les lemmes Hikma sont des **formes-surface** (déjà documenté Phase 23) — la future couche devra harmoniser (ex. لِلَّه → الله via segmentation MASAQ ل + الله). Aucun changement fait.

## H — POS

22 tags MASAQ sur Fātiḥah : `CONJ, DET, PREP, NEG_PART, PRON, REL_PRON, SUBJ_PRON, OBJ_PRON, PRON_3MP, NOUN_ABSTRACT, NOUN_CONCRETE, NOUN_ACTIVE_PART, NOUN_PASSIVE_PART, NOUN_PROP, GERUND, PV, IV, CV, IMPERF_PREF, NSUFF_MASC_PL_GEN, CASE_DEF_ACC, CASE_DEF_GEN` → mappable aux 9 catégories Hikma futures (VERB/NOUN/PARTICLE/…) — à normaliser à l'import (ex: `IV` = verbe imparfait, `PV` = verbe parfait).

## I — MORPHOLOGIE

- Cas/Mode : **ACCUSATIVE, GENITIVE, INVARIABLE, NOMINATIVE** (4 valeurs sur Fātiḥah) + marques (KASRA, …) + invariabilité (INVAR/DECLN/DEF_ART…) + état construit (CONSTRUCT).
- Découpage préfixe/stem/suffixe (Morph_Type) → **proclitiques/enclitiques documentés** (ex. `وَ+إِيَّاكَ`, `ال+رَّحِيم`, `نَا` suffixe d'objet dans ٱهْدِنَا).
- Pas de temps/aspect/voix/personne explicites hors Morph_Tag (PV=perfect verb, IV=imperfect verb, CV=command verb) — **PARTIAL**.

## J — SEGMENTATION

- **24 des 29 mots** sont segmentés en préfixe + stem + suffixe.
- Exemples réussis : **ٱهْدِنَا → اهد (stem) + نَا (suffixe OBJ)** ; **بِسْمِ → بِ (préfixe PREP) + اِسْم (stem NOUN_ABSTRACT)** ; **ٱلرَّحْمَـٰنِ → اَل (préfixe DET) + رَحْمَنَ (stem NOUN_PROP)** ; **صِرَٰطَ → صَرَاط (stem, cas ACCUSATIVE)**. La segmentation MASAQ fournit exactement la décomposition attendue par les Phases 22/23 (ex. `وَ + ال + نَاس` sur la sourate 114) — structure, pas simple texte.

## K — SCHÈMES / PATTERNS

**PATTERN = UNAVAILABLE** — aucune colonne pattern/schème dans MASAQ. Ne pas dériver de schème automatiquement. (FUTURE_WORK.)

## L — SYNTAXE

**Syntactic_Role (9 valeurs sur F receptacle) :** SUBJ, OBJ, PREP, PREP_OBJ, AGNT, ADJ, APPOS, CONJ, CONJ_N, CV, IV, NON_INFLECT, GEN_CONS + **Phrase / Phrasal_Function** (PHRASE/PRED…). → exploitable pour « Ce mot fonctionne ici comme sujet/objet… » dans HikmaExplanation v2 (donnée réelle, pas d'invention).

## M — COMPARAISON HIKMA (avant/après — aucune écriture)

| Champ | Hikma actuel | MASAQ (pilot) | Compat |
|---|---|---|---|
| forme | ✅ 29/29 | ✅ 29/29 | aligné EXACT/ORTHO |
| translittération | ✅ | non fourni | Hikma garde |
| meaning (EN) | ✅ | ✅ Gloss EN | complémentaire, PAS glose FR |
| lemme | 9 lemma_id (forme-surface) | stem 29/29 | **différence documentée** (harmonisation future) |
| racine | 0 | **ABSENTE** | source externe requise |
| POS | aucune table | ✅ 29/29 | NOUVEAU |
| morphologie (cas/mode) | aucune | ✅ 29/29 | NOUVEAU |
| segmentation | relation `word_lemma_mapping.evidence` textuelle | ✅ segments | NOUVEAU (structuré) |
| syntaxe | aucune | ✅ 29/29 | NOUVEAU |
| glose éditoriale FR | ✅ (25 + 1 lemme) | — | **Union : la glose FR reste éditoriale Hikma, jamais MASAQ** |

## N — VALEUR PÉDAGOGIQUE

MASAQ permet de passer de :

> « Le mot يَوْمِ signifie jour. »

à une explication structurée (données réelles) :

```
يَوْمِ
  segmenté : [يَوْم] (stem, NOUN_ABSTRACT, cas GENITIVE)
  POS      : NOUN_ABSTRACT
  cas      : GENITIVE (marque KASRA)
  rôle     : (syntaxe disponible)
  glose    : jour (éditoriale Hikma)
  contexte : ayah 1:4 + 4 traductions
```

Niveaux HikmaExplanation courants : L1 sens (déjà), L2 contexte (déjà), L3 identité (déjà), **L4 construction : NOUVEAU (segmentation MASAQ)**, **L5 morpho : NOUVEAU partiel (POS/cas/mode)**, L6 racine : ABSENT, L7 famille : ABSENT.

## O — ANOMALIES

1. Annonce « 20 colonnes » vs **19 réelles** — pas bloquant.
2. Différence DataCite (CC BY 4.0) vs page (CC BY 3.0) — **à documenter dans l'attribution finale** (les deux permettent le commercial).
3. 16 formes nécessitent une normalisation orthographique (systématique, non ambiguë) + 2 variantes alif-elided (documentées).
4. Lemas Hikma (forme-surface : « بِسْمِ », « لِلَّه ») vs stems MASAQ (اسم، الله) — miroir d'un verrou connu (Phase 23), harmonisation future.
5. `tmp/phase24d-masaq-fatihah-alignment.csv` — 30 lignes (29 + en-tête).

## P — RISQUES

| Risque | Niveau | Mitigation |
|---|---|---|
| Licence : légère divergence 3.0/4.0 | Faible | Attribution explicite + note dans la mention |
| Racine absente → niveau famille impossible | Moyen | Source racine dédiée (Kazimirski/Lane) en phase suivante |
| Stems as-merger avec les lemmas-surface Hikma | Moyen | Règle d'harmonisation explicite avant import |
| MOS-tags MASAQ (PV/IV/CV…) non-standard | Faible | Mapping POS documenté |
| Données dérivées (entrées hole guesses MASAQ, Gloss EN) | Faible | La glose FR ne viendra JAMAIS de MASAQ |

## Q — RECOMMANDATION

**`A — MASAQ_VALIDATED_FOR_NEXT_PHASE`** (réserve : racine).

- **OUI** : segmentation, POS, cas/morphologie, syntaxe, gloss EN — 29/29 occurrences, alignement excellent, licence CC BY exploitable (attribution).
- **NON** : racine, lemme explicite, pattern — à obtenir ailleurs (Kazimirski/Lane) ou FUTURE_WORK.
- Prochaine étape (décision humaine) : pilote d'import contrôlé dans des **tables linguistiques séparées** (`linguistic_analysis` etc.), via le workflow `LICENCE → alignement → PILOT → MIGRATION → IMPORT`, sans toucher au runtime lexical.

---

## VERIFICATION FINALE

```
DATABASE_WRITES = 0
HIKMA_DATA_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
PRODUCTION_CODE_WRITES = 0

FATIHAH_REFERENCE_LOCKED = PRESERVED
Aucune donnée MASAQ importée.
Aucune modification de HikmaExplanation, gloses, lemmes, racines, curriculum.
```

## LIVRABLES

- `PHASE_24D_MASAQ_FATIHAH_READONLY_PILOT.md` (ce fichier)
- `tmp/phase24d-masaq-fatihah-pilot.json` (JSON validé : licence, dataset, 29 alignements, couvertures)
- `tmp/phase24d-masaq-fatihah-alignment.csv` (30 lignes : 1 par occurrence alignée)
- Source téléchargée (officielle) : `tmp/MASAQ.csv` (SHA-256 vérifié)
- Scripts jetables : `tmp/phase24d-hikma.ts`, `tmp/phase24d-lemmas.ts`, `tmp/phase24d-align.py`, `tmp/phase24d-final.py`, `tmp/phase24d-stats.py`

**FIN PHASE 24D**