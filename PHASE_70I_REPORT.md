# PHASE 70I — LOT 8 — BATCH ACCÉLÉRÉ 100 CANDIDATS (PRÉPARATION READ-ONLY)

**MODE : READ-ONLY STRICT — `DATABASE_WRITES = 0`**
**STATUS : `PHASE_70I_LOT8_READY_FOR_HUMAN_REVIEW`**

---

## 1. Ground truth live — 0 divergence

| Compteur | Attendu | Réel | Statut |
|---|---:|---:|---|
| `word_translations` FR validées | 667 | 667 | ✅ |
| `word_lemma_mapping` | 188 | 188 | ✅ |
| `linguistic_occurrences` | 22 485 | 22 485 | ✅ |
| `linguistic_segments` | 44 677 | 44 677 | ✅ |
| `translations` | 24 944 | 24 944 | ✅ |
| `quran_words` | 21 296 | 21 296 | ✅ |
| `word_occurrences` | 77 430 | 77 430 | ✅ |
| `lemmas` | 32 | 32 | ✅ |
| `lemma_translations` | 32 | 32 (28 FR) | ✅ |

- Lots 1–7 présents : `13+3 / 17+1 / 19 / 20 / 20 / 20 / 20` ✅
- HOLDs historiques (word_id fixes) : **0 wt FR validée, 0 mapping** ✅
- Sourate 64 : 0 occurrence MASAQ ✅
- Artefact : `tmp/phase70i/ground-truth.json`

## 2. Pool et exclusions

- Pool initial C+P1+MASAQ+non-enseigné hors traités : **979**
- Exclusions : 136 word_id (Lots 1–7) + 3 HOLDs (word_id fixes : 0803c6da / b6d6520c / 52011330)
- Garde-fous live : 0 glose FR validée, 0 mapping safe sur les candidats
- Après garde-fous : **977**

## 3. Sélection — 100 candidats déterministes

| Famille | Nb |
|---|---:|
| VERBAL_LEXICAL | 34 |
| BARE_NOUN (dont noms propres مُوسَى, ءَادَمَ, عَلَىَّ) | 25 |
| ADJECTIVE | 12 |
| DEFINITE_NOUN | 10 |
| PARTICIPLE | 10 |
| UNKNOWN (particules/impératifs/gerunds — قُل, إِنَّمَا, أَلَا, جَهَنَّمَ, هُدًۭى…) | 9 |

Stratification par quotas (HIGH d'abord, puis MEDIUM ; **jamais HIGH-RISK automatique**), tri par fréquence décroissante au sein de chaque famille — déterministe et reproductible.

## 4. Classification de risque (propositions)

| Risque | Nb | Traitement |
|---|---:|---|
| **HIGH** | 70 | Acceptables après vérification mécanique |
| **MEDIUM** | 9 | Vérification ciblée (participies définis, attributs divins) |
| **HIGH-RISK** | 21 | **Isolés — revue ciblée obligatoire, jamais acceptés automatiquement** |

**21 HIGH-RISK** (liste complète dans `lot8-proposals.json`) :
عَـٰقِبَةُ · قَبْلِ · قَبْلِكَ · أَجْمَعِينَ · أَيْدِيهِمْ · قُلُوبِهِمْ · كُلٌّۭ · لِلْكَـٰفِرِينَ · قُل · أَلَا · قُلِ · هُدًۭى · ضَلَـٰلٍۢ · أَلَآ · تَكُونُوا۟ · بَعْضُهُمْ · ءَايَـٰتِنَا · أَنفُسِهِمْ · ءَايَـٰتِهِۦ · يَكُونَ · دُونِهِۦ

Catégories couvertes par la revue ciblée : composés préposition/conjonction + pronom (mapping refusé) · particules grammaticales (قُل, إِنَّمَا, أَلَا) · formes faibles de كَان (يَكُونَ, تَكُونُوا۟) · gerunds (هُدًۭى, ضَلَـٰلٍۢ) · sœurs de formes déjà glosées (كُلٌّۭ, قَبْلِ, عَـٰقِبَةُ) · noms propres cliticisés (لِلَّهِ ۚ, عَلَىَّ).

## 5. Propositions — 100/100 gloses

- 100 % des candidats ont une proposition de glose (glossaire éditorial par stem MASAQ, noyau sémantique vérifié sur les 4 traductions 31/9001/20/153)
- **0 mapping proposé** (toutes les constructions composées conservent leur glose directe — préposition/conjonction/pronom/particule préservés)
- 3 formes avec < 2 sources de traduction alignées (بَصِيرٌۭ, خَبِيرٌۭ, خَبِيرٌۢ — attributs divins) → signalées pour vérification ciblée
- 29 formes non-NFC documentées (diacritiques combinants — clé = word_id, aucune normalisation)

## 6. Vérifications (READ-ONLY)

| Contrôle | Résultat |
|---|---|
| 100 candidats · word_id réels 100/100 · 0 doublon | ✅ |
| 0 glose FR existante · 0 mapping safe existant | ✅ |
| HOLDs absents (0 wt, 0 mapping) · 0 candidat des Lots 1–7 | ✅ |
| Déterminisme · 6 familles · propositions 100/100 alignées | ✅ |
| HIGH-RISK isolés (21) — aucun marqué acceptable automatiquement | ✅ |

## 7. Non-régression

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **11 PASS / 0 FAIL / 1 INFO**

## 8. HOLDs historiques — OUT OF LOT 8 (inchangés)

أَعْلَمُ · كُنَّا · وَإِن — identifiés par word_id fixe, aucun traitement, vérifiés absents de la base et du pool.

## 9. Artefacts (READ-ONLY)

- `tmp/phase70i/ground-truth.json` · `lot8-candidates.json` · `lot8-evidence.json` · `lot8-proposals.json` · `tests.json`
- scripts read-only : `tmp/phase70i-ground-truth.ts` · `tmp/phase70i-select.ts` · `tmp/phase70i-check.ts` · `tmp/phase70i-proposals.ts` · `tmp/phase70i-tests.ts`

---

# HUMAN GATE — PHASE 70I / LOT 8 — REVUE HUMAINE

**`DATABASE_WRITES = 0`** · Verdict : `PHASE_70I_LOT8_READY_FOR_HUMAN_REVIEW`

**100 candidats** · 70 HIGH / 9 MEDIUM / **21 HIGH-RISK isolés** (revue ciblée obligatoire) · 0 mapping · 0 écriture.

Décisions possibles :
- **REVUE CIBLÉE** (recommandé) : examen des 21 HIGH-RISK + des 9 MEDIUM + des 3 attributs divins à traductions incomplètes → puis acceptation du périmètre révisé
- **ACCEPT global** du périmètre complet (avec les réserves signalées)
- **AJUSTER la sélection** · **REJETER** certains candidats

**Aucun DRY-RUN ni APPLY ne sera lancé avant votre décision explicite** (2 gates distincts : Gate 1 = périmètre, Gate 2 = DRY-RUN → APPLY).

---

# REVUE CIBLÉE — 37 DOSSIERS ANALYSÉS (décision humaine : REVUE CIBLÉE)

Analyse occurrence-par-occurrence sur données live (`tmp/phase70i/targeted-data.json` : toutes occurrences + POS MASAQ par occurrence + 4 traductions alignées 31/9001/20/153). **Correction des formes** : les 4 formes non reconnues (عَلَىَّ, لِلَّهِ ۚ, إِنَّمَآ, قُلِ) l'étaient par variantes Unicode — re-matcher sur les formes stockées réelles → 37 cibles (25 HIGH-RISK + 9 MEDIUM + 3 attributs divins).

## Verdict — 32 ACCEPT · 5 MODIFY · 0 HOLD · 0 REJECT

### 5 gloses MODIFY (intégrées dans `lot8-proposals.json` par override word_id)

| Forme | word_id | Avant → Après | Raison |
|---|---|---|---|
| يَكُونَ | 687b55ca | « soyez / vous serez » → **« il soit / il sera »** | 3e pers. sg. subjonctif de كَان (glose initiale = 2e pers. pl. copiée de تَكُونُوا۟). 17/17 occurrences. |
| قَبْلِكَ | 7b19ffa8 | « avant / auparavant » → **« avant toi / avant que toi »** | Clitique ـكَ préservé (12:109, 30:47 « avant toi »). Précédent قَوْمِهِۦ. |
| لِلْكَـٰفِرِينَ | 90ae3abd | « les mécréants / les infidèles » → **« pour les mécréants / aux mécréants »** | Préposition لِـ préservée (76:4, 8:14). Précédent لِلنَّاسِ. |
| ءَايَـٰتِنَا | d26b58ee | « signes / versets » → **« Nos signes / Nos versets »** | Possessif نَا préservé (15:81, 41:53). |
| ءَايَـٰتِهِۦ | 07e1aa51 | « signes / versets » → **« Ses signes / Ses versets »** | Possessif هِ préservé (30:24, 42:29). |

### 20 HIGH-RISK ACCEPT (après vérification complète)

عَلَىَّ · لِلَّهِ ۚ · إِنَّمَا · إِنَّمَآ · قُل · قُلِ · أَلَا · أَلَآ · هُدًۭى · ضَلَـٰلٍۢ · تَكُونُوا۟ · بَعْضُهُمْ · أَنفُسِهِمْ · دُونِهِۦ · أَيْدِيهِمْ · قُلُوبِهِمْ · عَـٰقِبَةُ · قَبْلِ · أَجْمَعِينَ · كُلٌّۭ

Points clés : POS MASAQ 100 % homogènes par forme (aucune homographie contradictoire) · إِنَّمَا 82/82 restriction (0 lecture إِنْ + مَا) · قُل 45/45 impératif (0 homographie) · أَلَا 31/31 incitation · عَلَىَّ POS NOUN_PROP = artefact MASAQ, lecture « sur moi » stable 13/13 · mappings refusés ×16 (clitiques/prépositions/possessifs/locutions).

### 9 MEDIUM + 3 attributs divins — ACCEPT

Participies définis et attributs divins : POS participe/adjectif homogènes, traductions convergentes. **Attributs divins بَصِيرٌۭ / خَبِيرٌۭ / خَبِيرٌۢ : 4/4 sources alignées en données live** (le signalement « < 2 sources » était un artefact du calcul sur l'échantillon d'évidence — corrigé).

## Périmètre révisé du Lot 8

**100 candidats · 100 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT · 5 MODIFY intégrés** · 66 HIGH / 9 MEDIUM / 25 HIGH-RISK (dont 5 corrigés) — aucune écriture.

## Risques résiduels documentés

Unicode 29 formes non-NFC (clé = word_id) · couverture MASAQ partielle sur certaines formes (compensée par lecture stable 100 % des occurrences) · artefact POS عَلَىَّ.

## Non-régression (ré-exécutée après la revue)

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **11 PASS / 0 FAIL / 1 INFO**

---

# HUMAN GATE — PHASE 70I / LOT 8 — REVUE CIBLÉE TERMINÉE

**`DATABASE_WRITES = 0`** · Verdict : `PHASE_70I_LOT8_TARGETED_REVIEW_COMPLETE`

**32 ACCEPT · 5 MODIFY · 0 HOLD · 0 REJECT** · périmètre final : **100 GLOSE** (aucune écriture).

Décisions possibles :
- **ACCEPT global** du périmètre révisé (100 gloses avec les 5 modifications intégrées)
- **MODIFIER** certaines gloses · **HOLD** certains cas · **REJETER** certains candidats · **seconde revue ciblée**

**Aucun DRY-RUN ni APPLY ne sera lancé avant votre décision explicite.**

---

# DRY-RUN — PHASE 70I / LOT 8 (Gate 1 ACCEPT GLOBAL + revue ciblée intégrée)

Script `tmp/phase70i-lot8-import.ts` (verrouillé : `APPLY=1` requis pour toute écriture) — exécuté en **DRY-RUN strictement READ-ONLY**.

## Résultats DRY-RUN — VERT

| Critère | Résultat |
|---|---|
| Candidats | **100** |
| INSERT | **100** |
| ALREADY_EXISTS | **0** |
| Divergence | **0** |
| Collision | **0** |
| Écrasement | aucun risque (0 ligne existante) |
| Mapping / lemmas / lemma_translations | **0 / 0 / 0** |
| HOLDs (hors périmètre) | 3 : أَعْلَمُ · كُنَّا · وَإِن |
| Unicode | 103/103 NFC match · **30 formes non-NFC documentées** (clé = word_id, aucune normalisation) |
| Provenance | « Hikma — lexique éditorial » existante · fr · `is_validated=true` |
| Idempotence | 100 INSERT (0 ALREADY_EXISTS) — `UNIQUE(word_id, language, source_id)` |
| Diff DB attendu | uniquement `word_translations` +100 |
| MODIFY intégrés | يَكُونَ · قَبْلِكَ · لِلْكَـٰفِرِينَ · ءَايَـٰتِنَا · ءَايَـٰتِهِۦ (5/5 présents dans le plan) |

## Baseline DB (live, avant import)

`667` FR validées · `188` mappings safe · MASAQ `22 485`/`44 677` · `24 944` translations · `21 296` quran_words · `77 430` occurrences · `32` lemmas · `32` lemma_translations (28 FR) · sourate 64 = 0 · Fātiḥah et pilotes protégés.

## Non-régression (ré-exécutée après le DRY-RUN)

Tests helpers **11 PASS / 0 FAIL / 1 INFO** · `tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS

## Artefacts

`tmp/phase70i/lot8-review-decisions.json` · `lot8-import-summary.json` · script `tmp/phase70i-lot8-import.ts` (APPLY verrouillé par `APPLY=1`) · `PHASE_70I_REPORT.md` (sections 6bis + 8bis)

---

# HUMAN GATE — PHASE 70I / LOT 8 — DRY-RUN VERT

**`DATABASE_WRITES = 0`** · Verdict : `PHASE_70I_LOT8_DRY_RUN_READY`

**100 INSERT prévus · 0 collision · 0 divergence · 0 doublon · écriture future limitée à `word_translations`.**

**Autorisez-vous l'APPLY réel des 100 `word_translations` du Lot 8 ?** L'APPLY n'aura lieu qu'après cette autorisation humaine séparée et explicite.
