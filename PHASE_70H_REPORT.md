# PHASE 70H — LOT 7 — PRÉPARATION READ-ONLY

**MODE : READ-ONLY STRICT — `DATABASE_WRITES = 0`**
**STATUS : `PHASE_70H_LOT7_READY_FOR_HUMAN_REVIEW`**

---

## 1. Ground truth live — 0 divergence

| Compteur | Attendu | Réel | Statut |
|---|---:|---:|---|
| `word_translations` FR validées | 647 | 647 | ✅ |
| `word_lemma_mapping` | 188 | 188 | ✅ |
| `linguistic_occurrences` | 22 485 | 22 485 | ✅ |
| `linguistic_segments` | 44 677 | 44 677 | ✅ |
| `translations` | 24 944 | 24 944 | ✅ |
| `quran_words` | 21 296 | 21 296 | ✅ |
| `word_occurrences` | 77 430 | 77 430 | ✅ |
| `lemmas` | 32 | 32 | ✅ |
| `lemma_translations` | 32 | 32 | ✅ |
| `lemma_translations` FR validées | 28 | 28 | ✅ |

Vérifications complémentaires :
- Lots 1–6 présents : `13 / 17 / 19 / 20 / 20 / 20` ✅
- HOLDs historiques (أَعْلَمُ · كُنَّا · وَإِن) : **0 wt FR validée, 0 mapping** ✅
- Sourate 64 : 0 occurrence MASAQ ✅
- Artefact : `tmp/phase70h/ground-truth.json`

## 2. Sélection — 20 candidats (pool 997, déterministe)

Exclusions chargées : **116 word_id** (Lots 1–6 = 112 formes traitées + 3 HOLDs + 1 mapping supplémentaire), + garde-fous live (0 glose FR validée, 0 mapping safe).

| Famille | Nb | Formes |
|---|---|---|
| Verbes lexicaux (dont passif) | 4 | **تُتْلَىٰ (IV_PASS)** · كُنتَ · يَقُولُ · **يَشَآءُ ۚ** |
| Adjectifs | 3 | **ٱلْعَظِيمِ / ٱلْعَظِيمُ (paire sœur)** · عَزِيزٌ |
| Noms nus (dont nom propre) | 4 | **أَنفُسَهُمْ (composé)** · جَمِيعًۭا · لَـَٔايَـٰتٍۢ · **نُوحٍۢ (nom propre)** |
| Noms définis | 2 | **ٱلَّيْلَ / ٱلَّيْلِ (paire sœur)** |
| Participes | 2 | مُّؤْمِنِينَ · خَـٰلِدُونَ |
| Lemma-sans-FR → GLOSE | 2 | **ٱلْعَذَابِ · ٱلْقَوْمَ (mapping refusé)** |
| Clitique composé | 1 | **كَذَٰلِكَ (locution figée)** |
| Grammaticaux | 2 | **أَمْ · إِلَّآ** |

## 3. Propositions — 20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT (13 HIGH / 7 MED)

| # | Forme | Occ. | POS MASAQ | Glose proposée | Confiance | Action |
|---|---|---:|---|---|---|---|
| 1 | تُتْلَىٰ | 16 | IMPERF_PREF,IV_PASS | est récitée / on récite | HIGH | GLOSE |
| 2 | كُنتَ | 35 | PV,SUFF_FEM_TA | tu étais / tu fus | HIGH | GLOSE |
| 3 | يَقُولُ | 35 | IMPERF_PREF,IV | il dit / il dira | HIGH | GLOSE |
| 4 | يَشَآءُ ۚ | 32 | IMPERF_PREF,IV | Il veut / Il désire | HIGH | GLOSE |
| 5 | ٱلْعَظِيمِ | 18 | DET,ADJ_QUALIT | l'Immense / le Très Grand | HIGH | GLOSE |
| 6 | عَزِيزٌ | 17 | ADJ_QUALIT | puissant / fort | MED | GLOSE |
| 7 | ٱلْعَظِيمُ | 16 | DET,ADJ_QUALIT | l'Immense / le Très Grand | HIGH | GLOSE |
| 8 | أَنفُسَهُمْ | 29 | NOUN_ABSTRACT,POSS_PRON | eux-mêmes / leurs personnes | MED | GLOSE |
| 9 | جَمِيعًۭا | 29 | NOUN_ABSTRACT,CASE_INDEF_ACC | tous / entièrement | MED | GLOSE |
| 10 | لَـَٔايَـٰتٍۢ | 28 | OTHER,NOUN_ABSTRACT,NSUFF_FEM_PL | des signes / des versets | HIGH | GLOSE |
| 11 | ٱلَّيْلَ | 25 | DET,NOUN_ABSTRACT | la nuit | HIGH | GLOSE |
| 12 | ٱلَّيْلِ | 25 | DET,NOUN_ABSTRACT | la nuit | HIGH | GLOSE |
| 13 | مُّؤْمِنِينَ | 24 | NOUN_ACTIVE_PART,NSUFF_MASC_PL_GEN | croyants / les croyants | MED | GLOSE |
| 14 | خَـٰلِدُونَ | 24 | NOUN_ACTIVE_PART,NSUFF_MASC_PL_NOM | éternels / immortels | HIGH | GLOSE |
| 15 | ٱلْعَذَابِ | 30 | DET,GERUND | le châtiment / le supplice | HIGH | GLOSE |
| 16 | ٱلْقَوْمَ | 26 | DET,NOUN_CONCRETE | le peuple / les gens | HIGH | GLOSE |
| 17 | كَذَٰلِكَ | 81 | PREP,DEM_PRON | ainsi / de cette manière | HIGH | GLOSE |
| 18 | أَمْ | 103 | CONJ | ou / ou bien | MED | GLOSE |
| 19 | نُوحٍۢ | 16 | NOUN_PROP_FOREIGN | Noé | HIGH | GLOSE |
| 20 | إِلَّآ | 100 | EXCEPT_PART | sauf / excepté | MED | GLOSE |

## 4. Cas signalés pour la revue ciblée (8)

- **تُتْلَىٰ** — passif : voix conservée explicitement.
- **كُنتَ** — forme faible : 35/35 copule vérifiée ; sœur de كُنتُمْ (Lot 1) / كُنتُم (Lot 6) / **كُنَّا (HOLD hors périmètre, aucune influence)**.
- **يَشَآءُ ۚ** — marque de pause ۚ (U+06DA) dans la forme stockée ; sœur de يَشَآءُ (Lot 2, même glose) — word_id distincts, aucune fusion.
- **أَنفُسَهُمْ** — composé + possessif ـهُمْ : mapping perdrait le pronom → glose directe (précédents قَوْمِهِۦ / تَحْتِهَا).
- **مُّؤْمِنِينَ** — participe : rendu idiomatique « ne croient pas » en FR — glose nominale « croyants » conservée (précédent صَـٰدِقِينَ / ٱلْمُحْسِنِينَ).
- **كَذَٰلِكَ** — locution figée كَ + ذَٰلِكَ : mapping impossible.
- **أَمْ** — grammatical : POS MASAQ 103/103 CONJ, aucune homographie (أَمَّا distinct).
- **إِلَّآ** — grammatical : POS MASAQ 100/100 EXCEPT_PART, aucune homographie (إِلَى distinct).

## 5. Mappings refusés / informations préservées

- **ٱلْعَذَابِ / ٱلْقَوْمَ** — lemme عَذَاب / قَوْم existe mais **statut « proposed »** (pas de `lemma_translation` FR validée) → glose directe requise ; l'article ٱلْ serait de toute façon perdu par un mapping.
- **أَنفُسَهُمْ / كَذَٰلِكَ** — composés : pronom / démonstratif préservés.
- **Participles ×2** — jamais mappés vers un lemme verbal.

## 6. Formes sœurs vérifiées en base (word_id distincts, aucune fusion)

يَشَآءُ ۚ / يَشَآءُ (Lot 2) · يَقُولُ / يَقُولُونَ (Lot 3) · ٱلْعَظِيمِ / ٱلْعَظِيمُ / عَظِيمٌۭ (Lot 5) · ٱلَّيْلَ / ٱلَّيْلِ · خَـٰلِدُونَ / خَـٰلِدِينَ (Lot 3) · لَـَٔايَـٰتٍۢ / بِـَٔايَـٰتِ (Lot 6) / ٱلْـَٔايَـٰتِ (Lot 6) · ٱلْقَوْمَ / ٱلْقَوْمِ (Lot 6) · كُنتَ / كُنتُم (Lot 6) / كُنتُمْ (Lot 1) / كُنَّا (HOLD) · نُوحٍۢ / نُوح.

## 6bis. REVUE CIBLÉE DES 12 CAS SENSIBLES (décision humaine : REVUE CIBLÉE + DRY-RUN)

Analyse occurrence-par-occurrence sur données live (`tmp/phase70h/targeted-data.json` : toutes occurrences + POS MASAQ par occurrence + 4 traductions). **Verdict : 12 ACCEPT · 0 MODIFY · 0 HOLD · 0 REJECT** — aucune glose modifiée, périmètre inchangé (20 GLOSE).

| # | Forme | Occ. | POS MASAQ (couvert) | Décision | Analyse clé |
|---|---|---:|---|---|---|
| 1 | تُتْلَىٰ | 16 | IMPERF_PREF,IV_PASS 10/16 | **ACCEPT** « est récitée / on récite » | 16/16 passif — voix conservée |
| 2 | كُنتَ | 35 | PV,SUFF_FEM_TA 10/35 | **ACCEPT** « tu étais / tu fus » | 35/35 copule — sœur كُنَّا HOLD sans influence |
| 3 | يَشَآءُ ۚ | 32 | IMPERF_PREF,IV 5/32 | **ACCEPT** « Il veut / Il désire » | 32/32 — marque ۚ documentée, sœur Lot 2 distincte |
| 4 | أَنفُسَهُمْ | 29 | NOUN_ABSTRACT,POSS_PRON 6/29 | **ACCEPT** « eux-mêmes / leurs personnes » | 29/29 réflexif — mapping perdrait ـهُمْ → refusé |
| 5 | جَمِيعًۭا | 29 | NOUN_ABSTRACT,CASE_INDEF_ACC 10/29 | **ACCEPT** « tous / entièrement » | 29/29 adverbial « rassembler tous » |
| 6 | لَـَٔايَـٰتٍۢ | 28 | OTHER,NOUN_ABSTRACT,NSUFF_FEM_PL 9/28 | **ACCEPT** « des signes / des versets » | لَـ initial = article (pas préposition) — nom nu indéfini |
| 7 | مُّؤْمِنِينَ | 24 | NOUN_ACTIVE_PART,NSUFF_MASC_PL_GEN 3/24 | **ACCEPT** « croyants / les croyants » | 24/24 participe — ≠ lemme verbal |
| 8 | ٱلْعَذَابِ | 30 | DET,GERUND 10/30 | **ACCEPT** « le châtiment / le supplice » | lemme « proposed » sans FR → glose directe |
| 9 | ٱلْقَوْمَ | 26 | DET,NOUN_CONCRETE 13/26 | **ACCEPT** « le peuple / les gens » | sœur ٱلْقَوْمِ (Lot 6) distincte — article préservé |
| 10 | كَذَٰلِكَ | 81 | PREP,DEM_PRON 14/81 | **ACCEPT** « ainsi / de cette manière » | 81/81 locution figée — mapping impossible |
| 11 | أَمْ | 103 | CONJ 43/103 | **ACCEPT** « ou / ou bien » | 103/103 disjonctif — 0 homographie (أَمَّا distincte) |
| 12 | إِلَّآ | 100 | EXCEPT_PART 22/100 | **ACCEPT** « sauf / excepté » | 100/100 exception — 0 homographie (إِلَى distincte) |

**Correction documentée** : لَـَٔايَـٰتٍۢ — le لَـ initial (U+0644) est l'article assimilé, pas une préposition (POS MASAQ sans PREP) → nom nu indéfini, glose « des signes / des versets » confirmée. Aucun mapping concerné.

Les 8 candidats non ciblés (يَقُولُ, ٱلْعَظِيمِ, عَزِيزٌ, ٱلْعَظِيمُ, ٱلَّيْلَ, ٱلَّيْلِ, خَـٰلِدُونَ, نُوحٍۢ) restent **ACCEPT HIGH inchangés**.

## 7. Tests & non-régression

Tests helpers **10 PASS / 0 FAIL / 1 INFO** (20 candidats, word_id réels 20/20, unicité, 0 glose FR existante, 0 mapping safe, HOLDs absents, 0 candidat des Lots 1–6, déterminisme, 8 familles, propositions 20/20 alignées ; 6 formes non-NFC documentées — clé = word_id, aucune normalisation).
- `tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS

## 8. HOLDs historiques — OUT OF LOT 7 (inchangés)

أَعْلَمُ · كُنَّا · وَإِن — aucun traitement, vérifiés absents de la base et du pool.

## 9. Artefacts (READ-ONLY)

- `tmp/phase70h/ground-truth.json`
- `tmp/phase70h/lot7-candidates.json`
- `tmp/phase70h/lot7-evidence.json`
- `tmp/phase70h/lot7-proposals.json`
- `tmp/phase70h/tests.json`
- scripts read-only : `tmp/phase70h-ground-truth.ts` · `tmp/phase70h-select.ts` · `tmp/phase70h-check.ts` · `tmp/phase70h-tests.ts`

---

## 8bis. DRY-RUN COMPLET (ÉTAPE 4 — autorisé par votre décision)

**Résultat : 20 INSERT · 0 ALREADY_EXISTS · 0 DIVERGENCE · 0 COLLISION** · `DATABASE_WRITES = 0`.

| Contrôle | Résultat |
|---|---|
| Identité | 20 word_id réels (0 inventé) · HOLDs vérifiés par word_id fixe (23/23 formes) |
| Unicode | 23/23 NFC match · **7 formes non-NFC documentées** (ordre de diacritiques non canonique / shadda combinante — clé = word_id, aucune normalisation) |
| Unicité | 0 doublon · 0 collision · 0 divergence · 0 écrasement |
| Idempotence | 20 INSERT prévus (0 ALREADY_EXISTS) — `UNIQUE(word_id, language, source_id)` |
| Provenance | « Hikma — lexique éditorial » existante · fr · `is_validated=true` |
| Tables | écriture future strictement limitée à `word_translations` · toutes les autres tables = 0 |
| Baseline | 647 / 188 / 22 485 / 44 677 / 24 944 / 21 296 / 77 430 / 32 / 28 |

**Correction technique documentée** : les HOLDs sont désormais identifiés par leur **word_id fixe** (0803c6da / b6d6520c / 52011330) plutôt que par chaîne arabe — les formes stockées présentent des variantes Unicode non canoniques (ex. كُنَّا : shadda U+0651 AVANT fatha U+064E, alors que la séquence canonique est l'inverse ; NFC les réordonne, rendant les `eq`/`in` naïfs sur l'arabe non fiables). Cohérence forme→word_id re-vérifiée par comparaison « bare » (diacritiques retirés) : 3/3 OK.

Artefact : `tmp/phase70h/lot7-import-summary.json` · script `tmp/phase70h-lot7-import.ts` (APPLY verrouillé par `APPLY=1`).

---

# HUMAN GATE — PHASE 70H / LOT 7 — DRY-RUN VERT

**`DATABASE_WRITES = 0`** · Verdict : `PHASE_70H_LOT7_DRY_RUN_READY`

Revue ciblée : **12 ACCEPT · 0 MODIFY · 0 HOLD · 0 REJECT** · Périmètre : **20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT** · 13 HIGH / 7 MED · DRY-RUN : **20 INSERT · 0 collision · 0 divergence** · non-régression PASS.

**Autorisez-vous l'APPLY réel des 20 `word_translations` du Lot 7 ?** L'APPLY n'aura lieu qu'après cette autorisation humaine séparée et explicite.
