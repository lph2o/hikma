# PHASE 24E — HARMONISATION LINGUISTIQUE MASAQ + CONCEPTION DE LA COUCHE LINGUISTIQUE PROFONDE

**STATUS = READ_ONLY** · **DATABASE_WRITES = 0** · **IMPORTS = 0** · **MIGRATIONS = 0** · **SEEDS = 0** · **VALIDATIONS = 0** · **PRODUCTION_CODE_CHANGES = 0**

> Phase d'analyse pure. Le fichier MASAQ déjà téléchargé en 24D (SHA-256 vérifié) est utilisé comme artefact d'analyse. Aucune écriture.

---

## 1. DÉCISION FINALE

### `A — READY_FOR_LINGUISTIC_SCHEMA_DESIGN`

MASAQ peut représenter **29/29 occurrences** Al-Fātiḥah avec segmentation, POS, morphologie, syntaxe et gloss EN. L'harmonisation avec le modèle Hikma est **compréhensible et documentée** (lemmes surface vs stems). Rien ne bloque la conception du schéma de la couche linguistique (Phase 24F) — **sous réserve** : racine et schème restent `EXTERNAL_SOURCE_REQUIRED`.

---

## 2. ÉTAT DE RÉFÉRENCE (vérifié READ-ONLY — aucune écriture)

| Compteur | Valeur vérifiée |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 (7 ayahs → 28 = 7 × 4 ressources) |
| lemmas | 32 |
| word_translations | 70 (FR validées : 70) |
| lemma_translations | **32 total = 28 FR validées + 4 non validées** (conforme Phase 21G) |
| word_lemma_mapping | 184 |
| audio word_audio vue | 1 000 lignes lues (échantillon) — Fātiḥah intacte |

Al-Fātiḥah : 8 leçons · 26 formes · 29 occurrences · 26/26 audio · FATIHAH_REFERENCE_LOCKED = PRESERVED.

## 3. ALIGNEMENT (surah + ayah + position — jamais chaîne seule)

| Statut | Nb | Détail |
|---|---|---|
| EXACT | 13 | identique après retrait diacritiques |
| EXACT_ORTHO | 14 | identique après normalisation orthographique (wasla, dagger-alif, hamzées) |
| Variantes ortho doc. | 2 | ٱلرَّحْمَـٰنِ vs الرَّحْمَنِ (alif élisé) — **mêmes mots, pas des désalignements** |
| MISSING / EXTRA / réellement AMBIGU | **0 / 0 / 0** | |

→ **29/29** reproduit depuis Phase 24D.

## 4. COUVERTURE MASAQ (29 occurrences)

| Donnée | Couverture | Détail |
|---|---|---|
| Stem | **29/29** | Segmented_Word Morph_Type=Stem |
| Segmentation | **24/29** mots segmentés (≥ 2 segments) | max 3 segments (préfixe+stem+suffixe) |
| POS | **29/29** | 22 tags (dont PV/IV/CV, DET, PREP, NSUFF…) |
| Morphologie | **29/29** | cas/mode (ACC/GEN/INV/NOM) + état construit + invariabilité |
| Syntaxe | **29/29** | Syntactic_Role (SUBJ/OBJ/PREP/ADJ/APPOS/GEN_CONS…) + Phrase/Phrasal_Function |
| Gloss EN | **29/29** | EXTERNAL_LINGUISTIC_EVIDENCE uniquement |
| **Racine** | **0** | `NOT_AVAILABLE_FROM_MASAQ` |
| **Pattern/schème** | **0** | `EXTERNAL_SOURCE_REQUIRED` |

## 4. MATRICE MORPHOLOGIQUE (vérifiée — aucun extrapolation)

| Attribut | Statut | Source MASAQ |
|---|---|---|
| POS | AVAILABLE | Morph_Tag |
| CAS | AVAILABLE | Case_Mood + Case_Mood_Marker |
| MOOD (PV/IV/CV) | AVAILABLE | Morph_Tag (verbes) |
| TENSE | PARTIAL | dérivable PV=parfait / IV=imparfait / CV=impératif |
| ASPECT | PARTIAL | corrélé au tense, non explicite |
| GENDER | UNAVAILABLE | pas de colonne genre |
| NUMBER | PARTIAL | NSUFF_MASC_PL_GEN (pluriel) ; singulier implicite |
| PERSON | PARTIAL | PRON_3MP ; autres non explicites |
| STATE | AVAILABLE | Possessive_Construct (CONSTRUCT/NOT_CONSTRUCT) |
| VOICE | UNAVAILABLE | colonne absente |
| DETERMINATION | AVAILABLE | DET (article défini) / Invariable_Declinable |

## 5. LEMME : COMPARAISON MASAQ vs HIKMA (11 mappings existants + 18 sans lemme)

| Classification | Nb | Exemple |
|---|---|---|
| MATCH | 2 | رَبِّ : Hikma « رَبّ » ≡ MASAQ stem «رب » (après normalisation) ; يَوْمِ ≡ «يوم» |
| PARTIAL_MATCH | 4 | ٱلرَّحِيم : Hikma « الرَّحِيم » → stem «رحيم » — article retiré |
| DIFFERENT_NORMALIZATION | 3 | «الله» vs «له» (MASAQ écrit le stem الله sans alif) ; «بِسْم» vs «اسم» (préfixe بِ inclus) ; «لِلَّه » vs « له » |
| DIFFERENT_LEXICAL_LEVEL | 2 | «الرَّحْمَـٰن» vs «رحمن» — Hikma garde le nom propre avec article ; MASAQ stem nu |
| MASAQ_ONLY | 18 | mots sans lemma_id Hikma — MASAQ fournit un stem (ex. نعبد → stem ?) |

**CAUSE** : Hikma stocke des **lemmes-surface** (formes attachées/avec article : «بِسمِ», «لِلَّه», «ٱلْحَمْدُ») issus du mapping initial ; MASAQ produit des **stems lexicaux nus** (اسم, الله→له, حمد). C'est une différence de **niveau lexical**, pas une faute.

**Aucun mapping modifié.**

## 6. CLITIQUES / PARTICULES ATTACHÉES

Règle : ne **jamais** transformer un segment en mot lexical. Distinguer :

| Nature | Exemple MASAQ |
|---|---|
| PARTICULE attachée (préposition) | بِسْمِ → `ب`(PREP) + اسم(Stem) |
| ARTICLE défini | ٱلرَّحِيم → `ال`(DET) + رحيم(Stem) |
| SUFFIXE flexionnel (pluriel/cas) | ٱلْعَـٰلَمِين → ال + عالم + ين(NSUFF_MASC_PL_GEN) |
| PRONOMINAL SUFFIXE | ٱهْدِنَا → اهد(Stem) + نا(OBJ_PRON) |
| CONJONCTION | et إ + (ex. 1:5 p3 وَإِيَّاكَ → و(CONJ) + إيَّاك (Stem PRON) |

Le futur moteur pourra dire « Ce mot contient X + Y » **sans prétendre que chaque segment est un mot indépendant**.

## 7. RACINE / SCHÈME

- **ROOT = NOT_AVAILABLE_FROM_MASAQ** — aucune colonne racine dans le fichier réel (vérifié).
- Ne jamais inventer. La future colonne `linguistic_roots` devra relier `root_arabic/root_transliteration/root_source/root_confidence` **au lemme / unité lexicale**, pas à une forme de surface.
- **PATTERN = EXTERNAL_SOURCE_REQUIRED** — aucune donnée de schème ; pas de dérivation automatique.

## 8. GLOSSES EN MASAQ + TRADUCTIONS

- **Gloss EN MASAQ** : conservée comme `EXTERNAL_LINGUISTIC_EVIDENCE` ; **jamais** source de glose FR (interdiction de traduction automatique EN→FR comme glose validée).
- **Les 4 traductions** (31/9001/20/153, mêmes ayah_id — 28 lignes vérifiées) : **CONTEXT EVIDENCE uniquement** ; jamais sélection automatique ni vote mécanique.

## 9. ARCHITECTURE DE DONNÉES PROPOSÉE (conceptuel — AUCUNE création)

```
quran_words ─── word_occurrences ─── ayahs ─── surahs
                    │
                    ▼
        linguistic_occurrences   (1:1 par word_occurrence)
           │  source_id → linguistic_sources (MASAQ: name, version, doi, license, attribution, checksum)
           ├── linguistic_segments  (segment_no, text, morph_type, morph_tag, category)
           ├── pos / cas / syntaxe (colonnes sur occurrence)
           └── gloss_en (évidence)
        linguistic_lemmas (harmonisation stems → lemmas de référence)
        linguistic_roots (source externe, rattaché au lemma)
```

- **PAS de duplication de quran_words** : la couche se rattache à `word_occurrence_id`.
- **Ségrégation runtime** : le moteur actuel (FORME→LEMME→EN fallback) et les 4 traductions restent intouchés ; HikmaExplanation v2 consommera la couche séparément.
- **Provenance** : chaque ligne pointe `linguistic_sources` (source/version/doi/licence/attribution/checksum/date).

## 10. RÉPONSES AUX 20 QUESTIONS (§24)

1. **29/29 représentée** — segmentation + stem + POS + morpho + syntaxe + gloss, alignement par position.
2. **Reliabilité à word_occurrence** : OUI par (surah, ayah, position) → `word_occurrence_id`.
3. **Segmentation** : 24/29 mots prédécoupés, 29/29 stems.
4. **POS** : 29/29 (22 tags).
5. **Morphologie** : 29/29 cas/mode/état ; genre/voix/personne absentes.
6. **Syntaxe** : 29/29.
7. **Lemme** : 2 MATCH · 4 PARTIAL · 3 DIFF_NORM · 2 DIFF_LEVEL · 18 MASAQ_ONLY.
8. **Pourquoi la différence** : lemmes surface Hikma vs stems lexiques MASAQ.
9. **Clitiques** : segments conservés comme attractions grammaticales, jamais mots lexicaux.
10. **Racines** : NOT_AVAILABLE_FROM_MASAQ → source future.
11. **Schèmes** : EXTERNAL_SOURCE_REQUIRED.
12. **Glosses EN MASAQ** : contrôle/évidence OK, jamais glose FR automatique.
13. **4 traductions** : préservées en contexte (resource_id).
14. **Interdiction traduction→glose** : runtime inchangé, tests 21G (translation_source_leak=false) à rejouer après import 24F.
15. **Architecture** : linguistic_sources / linguistic_occurrences / linguistic_segments / linguistic_lemmas / linguistic_roots.
16. **Rattachement** : 1 ligne linguistique × 1 word_occurrence_id → pas de duplication.
17. **HikmaExplanation v2** : lecture via couche (join occurrence), hors runtime actuel.
18. **Hors runtime** : gloss EN, segmentation brute, méta (source/version/licence).
19. **Source complémentaire** : racine (Kazimirski/Lane), schème, lemmes de référence.
20. **24F — LINGUISTIC SCHEMA DESIGN + IMPORT PILOT ISOLÉ** (tables séparées, Al-Fātiḥah only).

---

## 25. ARRÊT OBLIGATOIRE

```
DATABASE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0
PRODUCTION_CODE_CHANGES = 0

FATIHAH_REFERENCE_LOCKED = PRESERVED
Aucune table créée, aucune donnée importée, aucune glose/modification.
L'import pilote (24F) ne s'exécutera qu'après approbation humaine.
```

## LIVRABLES

- `PHASE_24E_MASAQ_LINGUISTIC_HARMONIZATION.md` (ce fichier)
- `tmp/phase24e-masaq-linguistic-harmonization.json` (JSON validé)
- `tmp/phase24e-fatihah-linguistic-map.csv` (30 lignes = en-tête + 29 occurrences)

**FIN PHASE 24E**