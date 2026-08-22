# PHASE 70J — LOT 9 (BATCH 250) — RAPPORT GATE 0

**Verdict : `PHASE_70J_LOT9_READY_FOR_HUMAN_REVIEW`** · `DATABASE_WRITES = 0`

## 1. Ground truth live — 0 divergence

| Compteur | Valeur |
|---|---:|
| word_translations FR validées | **767** |
| word_lemma_mapping | **188** |
| lemma_translations | 32 (28 FR validées) |
| lemmas | 32 |
| linguistic_occurrences | 22 485 |
| linguistic_segments | 44 677 |
| translations | 24 944 |
| quran_words | 21 296 |
| word_occurrences | 77 430 |

Lots 1–8 présents (16/20/20/20/20/20/20/100) · HOLDs أَعْلَمُ/كُنَّا/وَإِن absents (0 wt, 0 mapping, word_id fixes) · sourate 64 = 0 · Fātiḥah et pilotes protégés.

## 2. Sélection — 250 candidats

- Pool : `catégorie C + P1 + non enseigné + MASAQ` hors 236 formes traitées (Lots 1–8) et 3 HOLDs → **pool 877** après garde-fous live (0 glose FR, 0 mapping safe)
- **250 sélectionnés** (objectif atteint — suffisamment de candidats sûrs)
- Déterministe : tri fréquence décroissante, sélection stratifiée par familles (HIGH d'abord, complément MEDIUM à faible risque, HIGH-RISK jamais automatiques)

### Répartition par famille
| Famille | Nb |
|---|---:|
| VERBAL_LEXICAL (verbes actifs/passifs/faibles) | 72 |
| BARE_NOUN (dont noms propres) | 61 |
| DEFINITE_NOUN | 39 |
| ADJECTIVE (dont élatifs) | 29 |
| PARTICIPLE | 25 |
| UNKNOWN (gerunds, formes à POS partiel) | 24 |

### Répartition par risque
| Risque | Nb |
|---|---:|
| HIGH | **174** |
| MEDIUM | **33** (élatifs + participes) |
| HIGH-RISK (isolés — revue ciblée obligatoire) | **43** |

## 3. Propositions — 250/250 gloses · 0 mapping

- **0 sans glose automatique** (3 cas initialement manquants corrigés : أَصْحَـٰبَ/أَصْحَـٰبِ/ٱلْحَكِيمِ)
- Glossaire éditorial Hikma par stem MASAQ (noyau vérifié sur les 4 traductions 31/9001/20/153) + **overrides word_id** pour les formes composées (clitiques/préfixes/prépositions/interrogatifs) — mapping refusé
- **33 formes avec < 2 sources de traduction alignées** sur l'échantillon d'évidence (à re-vérifier en données live lors de la revue ciblée — précédent 70I : artefact de calcul échantillonné)

### 43 HIGH-RISK isolés (revue ciblée obligatoire)
Catégories couvertes :
- **Verbes + pronom objet** : جَآءَهُم/جَآءَهُمْ/جَآءَهُمُ/جَآءَكَ/جَآءَكُمْ/جَآءَتْهُمْ « il/elle leur/toi/vous vint » · أَرْسَلْنَـٰكَ « Nous t'avons envoyé »
- **Interrogatif** : أَرَءَيْتُمْ « avez-vous vu ? »
- **Noms + possessif** : يَدَيْهِ · دُونِهِۦٓ · قَبْلِهِۦ · بَيْنَنَا · بَيْنِى · ءَايَـٰتُنَا · قُلُوبِهِم · بَعْدِهِمْ · عِبَادِهِۦ · أَنفُسِكُمْ · أَنفُسُهُمْ · رُسُلُهُم · أَكْثَرَهُمْ/أَكْثَرُهُمْ
- **Préposition + nom** : كَمَثَلِ · لَـَٔايَةًۭ · بِذَاتِ · لِكُلِّ/لِّكُلِّ · لِّلَّهِ · بِٱلْمَعْرُوفِ · لِلْمُتَّقِينَ · لِلظَّـٰلِمِينَ · لِلْمَلَـٰٓئِكَةِ · لِّلْعَـٰلَمِينَ
- **Conjonction + nom** : وَٱلْمَلَـٰٓئِكَةُ · وَيَعْقُوبَ · وَٱلنَّهَارَ
- **Particules/grammaticaux** : سُبْحَـٰنَ · أَنَّمَا · ٱبْتِغَآءَ · ۞ قُلْ (marqueur rub-el-hizb U+06DE documenté)
- **Gerunds** : ذِكْرِ « le rappel / la mention »

## 4. Exclusions et HOLDs

- HOLDs historiques (word_id fixes) : أَعْلَمُ · كُنَّا · وَإِن — absents du pool et du plan
- 0 candidat des Lots 1–8 (236 exclus) · 0 doublon · 0 glose/mapping existant

## 5. Unicode

**66 formes non-NFC documentées** (clé = word_id, aucune normalisation destructive) : marques ۚ/ۖ/ۗ/ۜ, tanwin ۭ/ً/ٍ, madda ٓ, shadda combinante, ۞ rub-el-hizb. Aucune normalisation utilisée comme mécanisme de fusion.

## 6. Tests & non-régression

Tests helpers **12 PASS / 0 FAIL / 1 INFO** (250 candidats, word_id réels 250/250, unicité, 0 glose/mapping existant, HOLDs absents, 0 candidat Lots 1–8, déterminisme, 6 familles, HIGH-RISK isolés 43, propositions 250/250, gloses 250/250) · `tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS

## 7. Cas sensibles pour la revue ciblée (HUMAN GATE 1)

Priorité : les **43 HIGH-RISK** (composés, clitiques, prépositions, interrogatif, marqueur ۞) + **33 MEDIUM** (élatifs أَحْسَنُ/أَكْثَرُ/أَشَدَّ…, participes définis ٱلْمُنَـٰفِقِينَ/ٱلْمُجْرِمُونَ/ٱلْفَـٰسِقِينَ…) + **33 formes < 2 sources** (à re-vérifier en données live).

## 8. Artefacts (READ-ONLY)

`tmp/phase70j/ground-truth.json` · `lot9-candidates.json` · `lot9-evidence.json` · `lot9-proposals.json` · `analyst-view.json` · `tests.json` · scripts `tmp/phase70j-*.ts` · `PHASE_70J_REPORT.md`

---

# HUMAN GATE — PHASE 70J / LOT 9 — REVUE HUMAINE

**`DATABASE_WRITES = 0`** · Verdict : `PHASE_70J_LOT9_READY_FOR_HUMAN_REVIEW`

**250 candidats** · 174 HIGH / 33 MEDIUM / **43 HIGH-RISK isolés** (revue ciblée obligatoire) · 0 mapping · 0 écriture.

Décisions possibles :
- **REVUE CIBLÉE** (recommandé) : examen des 43 HIGH-RISK + 33 MEDIUM + 33 formes < 2 sources → puis acceptation du périmètre révisé
- **ACCEPT global** du périmètre complet (avec les réserves signalées)
- **AJUSTER la sélection** · **REJETER** certains candidats

**Aucun DRY-RUN ni APPLY ne sera lancé avant votre décision explicite** (Gate 1 = périmètre, Gate 2 = DRY-RUN → APPLY).

---

# REVUE CIBLÉE — 95 DOSSIERS ANALYSÉS (décision humaine : REVUE CIBLÉE)

Analyse occurrence-par-occurrence sur données live (`tmp/phase70j/targeted-data.json` : toutes occurrences + POS MASAQ par occurrence + 4 traductions alignées). Cibles = union 43 HIGH-RISK + 33 MEDIUM + 33 formes < 2 sources = **95 dossiers**.

## Verdict — 83 ACCEPT · 12 MODIFY · 0 HOLD · 0 REJECT

### 1. Couverture des traductions — 33/33 ARTEFACTS

Les 33 formes signalées « < 2 sources » ont toutes **4/4 sources alignées (min=4 max=4) en données live complètes** — artefact d'échantillonnage (précédent Lot 8), aucun vrai manque de couverture.

### 2. Les 12 gloses MODIFY (intégrées par override word_id dans `lot9-proposals.json`)

| Forme | Avant → Après | Raison |
|---|---|---|
| كُنتُ | « j'étais / tu étais / que je sois » → **« j'étais / je fus »** | 1re pers. sg. (46:9, 19:31) |
| تَكُن | → **« que tu sois / tu sois »** | 2e pers. sg. jussif (27:70) |
| تَكُونَ | → **« que tu sois / tu sois »** | 2e pers. sg. subj. (17:91) |
| يَكُونُوا۟ | → **« ils seront / qu'ils soient »** | 3e pers. pl. subj. (60:2) |
| تَكُونُ | → **« tu es / tu seras »** | 2e pers. sg. (10:61) |
| أَكُونَ | → **« que je sois / je sois »** | 1re pers. sg. subj. (39:12) |
| نَشَآءُ | « Il veut / Il désire » → **« Nous voulions / Nous voulons »** | 1re pers. pl. (43:60 « Si Nous voulions ») — stem شاء partagé |
| ٱلْجِنِّ | « des jardins » (stem) → **« les djinns / les génies »** | Homographie racine جن (جَنَّة vs جِنّ) — 6:130 « Ô communauté des djinns » |
| بِذَاتِ | « dans l'essence de » → **« le contenu de / ce que recèlent »** | بِذَاتِ ٱلصُّدُورِ « le contenu des poitrines » (67:13) |
| يَتَّقُونَ | « vous craignez » → **« ils craignent / ils se préservent »** | 3e pers. pl. |
| يُبْصِرُونَ | « vous voyez » → **« ils voient / ils distinguent »** | 3e pers. pl. |
| تَكْفُرُونَ | « ils ont mécru » → **« vous mécroyez / vous êtes mécréants »** | 2e pers. pl. |
| يَشْكُرُونَ | « vous remerciez » → **« ils remercient / ils sont reconnaissants »** | 3e pers. pl. |

### 3. Les 43 HIGH-RISK initiaux — ACCEPT (composés vérifiés occurrence-par-occurrence)

Verbes + pronom objet (جَآءَهُم ×4 « il leur vint », جَآءَكَ, جَآءَكُمْ, جَآءَتْهُمْ, أَرْسَلْنَـٰكَ « Nous t'avons envoyé ») · interrogatif أَرَءَيْتُمْ « avez-vous vu ? » (12/12) · noms + possessif (يَدَيْهِ « ses deux mains », دُونِهِۦٓ, قَبْلِهِۦ, بَيْنَنَا, بَيْنِى, ءَايَـٰتُنَا « Nos signes », قُلُوبِهِم, بَعْدِهِمْ, عِبَادِهِۦ « Ses serviteurs », أَنفُسِكُمْ, أَنفُسُهُمْ, رُسُلُهُم, أَكْثَرَهُمْ/أَكْثَرُهُمْ « la plupart d'entre eux ») · préposition + nom (كَمَثَلِ « semblables à », لِكُلِّ/لِّكُلِّ « pour chaque », لِّلَّهِ « à Allah », بِٱلْمَعْرُوفِ, لِلْمُتَّقِينَ, لِلظَّـٰلِمِينَ, لِلْمَلَـٰٓئِكَةِ, لِّلْعَـٰلَمِينَ) · conjonction + nom (وَٱلْمَلَـٰٓئِكَةُ « et les anges », وَيَعْقُوبَ « et Jacob », وَٱلنَّهَارَ « et le jour ») · particules (سُبْحَـٰنَ « Gloire à », أَنَّمَا « que / seulement », ٱبْتِغَآءَ, ۞ قُلْ marqueur rub-el-hizb U+06DE).

Règle FORM > LEMME respectée : **mapping refusé pour les 51 formes composées** (clitique/préfixe/préposition/conjonction/interrogatif préservé dans la glose).

### 4. Les 33 MEDIUM — ACCEPT

Élatifs (أَحْسَنُ « meilleur », أَكْثَرُ « la plupart », أَشَدَّ « plus fort », أَكْبَرُ « plus grand », أَقْرَبُ « plus proche », أُخْرَىٰ « autre », ٱلْأَعْلَىٰ « le Plus Haut », ٱلْـَٔاخِرِ « l'Au-delà ») — 0 lecture verbale attestée (≠ أَعْلَمُ) · participes (ٱلْمُنَـٰفِقِينَ « les hypocrites », ٱلْمُجْرِمُونَ, ٱلْفَـٰسِقِينَ, مٌبِين « clair / évident », سُجَّدًۭا « prosternés », مُصَدِّقًۭا « confirmant ») — gloses nominales correctes, aucun mapping vers lemme verbal.

## Périmètre révisé du Lot 9

**250 candidats · 250 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT · 12 MODIFY intégrés** · 166 HIGH / 33 MEDIUM / 51 HIGH-RISK (43 initiaux + 8 formes corrigées, tous ACCEPT après vérification) — aucune écriture.

## Non-régression (ré-exécutée après la revue)

Tests helpers **12 PASS / 0 FAIL / 1 INFO** · `tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS

---

# HUMAN GATE — PHASE 70J / LOT 9 — REVUE CIBLÉE TERMINÉE

**`DATABASE_WRITES = 0`** · Verdict : `PHASE_70J_LOT9_TARGETED_REVIEW_COMPLETE`

**83 ACCEPT · 12 MODIFY · 0 HOLD · 0 REJECT** · périmètre final : **250 GLOSE** (aucune écriture).

Décisions possibles :
- **ACCEPT global** du périmètre révisé (250 gloses avec les 12 modifications intégrées)
- **MODIFIER** certaines gloses · **HOLD** certains cas · **REJETER** certains candidats · **seconde revue ciblée**

**Aucun DRY-RUN ni APPLY ne sera lancé avant votre décision explicite (Gate 2).**

---

# DRY-RUN — PHASE 70J / LOT 9 (Gate 1 ACCEPT GLOBAL + Gate 2 revue ciblée intégrée)

Script `tmp/phase70j-lot9-import.ts` (verrouillé : `APPLY=1` requis pour toute écriture) — exécuté en **DRY-RUN strictement READ-ONLY**.

## Résultats DRY-RUN — VERT

| Critère | Résultat |
|---|---|
| Candidats | **250** |
| INSERT | **250** |
| ALREADY_EXISTS | **0** |
| Divergence | **0** |
| Collision | **0** |
| Écrasement | aucun risque (0 ligne existante) |
| Mapping / lemmas / lemma_translations | **0 / 0 / 0** |
| HOLDs (hors périmètre) | 3 : أَعْلَمُ · كُنَّا · وَإِن |
| Unicode | 253/253 NFC match · **67 formes non-NFC documentées** (clé = word_id, aucune normalisation) |
| Provenance | « Hikma — lexique éditorial » existante · fr · `is_validated=true` |
| Idempotence | 250 INSERT (0 ALREADY_EXISTS) — `UNIQUE(word_id, language, source_id)` |
| Diff DB attendu | uniquement `word_translations` +250 |
| MODIFY intégrés | 13/13 présents dans le plan (personnes verbales + ٱلْجِنِّ + بِذَاتِ) |

## Baseline DB (live, avant import)

`767` FR validées · `188` mappings safe · MASAQ `22 485`/`44 677` · `24 944` translations · `21 296` quran_words · `77 430` occurrences · `32` lemmas · `32` lemma_translations (28 FR) · sourate 64 = 0 · Fātiḥah et pilotes protégés.

## Non-régression (ré-exécutée après le DRY-RUN)

Tests helpers **12 PASS / 0 FAIL / 1 INFO** · `tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS

## Artefacts

`tmp/phase70j/lot9-review-decisions.json` · `lot9-import-summary.json` · script `tmp/phase70j-lot9-import.ts` (APPLY verrouillé par `APPLY=1`) · `PHASE_70J_REPORT.md`

---

# HUMAN GATE — PHASE 70J / LOT 9 — DRY-RUN VERT

**`DATABASE_WRITES = 0`** · Verdict : `PHASE_70J_LOT9_DRY_RUN_READY`

**250 INSERT prévus · 0 collision · 0 divergence · 0 doublon · écriture future limitée à `word_translations`.**

**Autorisez-vous l'APPLY réel des 250 `word_translations` du Lot 9 ?** L'APPLY n'aura lieu qu'après cette autorisation humaine séparée et explicite.
