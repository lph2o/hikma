# PHASE_70E_REPORT — PRÉPARATION DU LOT 4 (WORKFLOW ÉDITORIAL HIKMA)

## STATUT

**`PHASE_70E_LOT4_READY_FOR_HUMAN_REVIEW`** · `DATABASE_WRITES = 0` · aucune écriture · aucun DRY-RUN d'import · aucun commit/push.

## 1. GROUND TRUTH LIVE (READ-ONLY)

Source : `tmp/phase70e/ground-truth.json` — reconstruit depuis la DB live, aucune confiance aux anciens JSON.

| Compteur | Valeur live |
|---|---|
| `quran_words` | 21 296 |
| `word_occurrences` | 77 430 |
| `translations` | 24 944 |
| `linguistic_occurrences` | 22 485 |
| `linguistic_segments` | 44 677 |
| `lemmas` | 32 |
| `lemma_translations` | 32 (28 FR validées) |
| `word_translations` FR validées | **587** |
| `word_lemma_mapping` safe | **188** |
| Sourate 64 | **0 occurrence MASAQ** (MASAQ_BLOCKED) |
| HOLDs (أَعْلَمُ, كُنَّا, وَإِن) | **0 wt FR validée · 0 mapping** |
| Lots présents | Lot 1 : 13 wt + 3 mappings · Lot 2 : 17 wt + 1 mapping · Lot 3 : 19 wt |

Aucune divergence avec l'état attendu post-Lot 3.

## 2. SÉLECTION DU LOT 4 (déterministe)

Source : `tmp/phase70e/lot4-candidates.json` · script `tmp/phase70e-select.ts` (READ-ONLY).

- **Pool** : 1 057 candidats (catégorie C + P1 + non enseigné + MASAQ, hors 52 formes traitées Lots 1-3 et 3 HOLDs, après garde-fous live 0 glose FR validée / 0 mapping safe).
- **20 candidats** sélectionnés par stratification par famille + tri fréquence décroissante (déterministe).

| Famille | Nb | Formes |
|---|---|---|
| Verbes lexicaux | 4 | **قِيلَ (passif)** · أَنزَلَ · جَعَلَ · أَرْسَلْنَا |
| Adjectifs | 3 | أَلِيمٌۭ · **عَلِيمٌۢ (sœur)** · **أَكْثَرَ (élatif vérifié)** |
| Noms nus | 3 | **شَيْـًۭٔا (sœur)** · **غَيْرَ (sœur)** · **يَـٰقَوْمِ (vocatif)** |
| Noms définis | 2 | ٱلشَّيْطَـٰنُ · ٱلْأَوَّلِينَ |
| Participes | 2 | أَصْحَـٰبُ · مُّبِينٌۭ |
| Lemma-résolvables → GLOSE | 2 | **وَيَوْمَ · وَٱلْأَرْضَ (mapping refusé)** |
| Clitique composé | 1 | **عَلَيْهِ (préposition + pronom)** |
| Grammaticaux | 3 | إِلَى · **مِنۢ (sœur de مِّنَ)** · **مُوسَىٰٓ (sœur, nom propre)** |

## 3. ÉVIDENCE (par candidat)

Source : `tmp/phase70e/lot4-evidence.json` (toutes occurrences + 4 traductions alignées + MASAQ + audio) · `tmp/phase70e/analyst-view.json` (vue compacte) · `tmp/phase70e/targeted-checks.json` (vérifications live ciblées).

Vérifications live décisives :
- **Formes sœurs vérifiées en base** (codepoints distincts, word_id distincts, jamais fusionnées) : مُوسَىٰٓ (madda U+0653) vs مُوسَىٰ (Lot 1) · مِنۢ (tanwin idgham U+06E2) vs مِّنَ (Lot 1) · عَلِيمٌۢ vs عَلِيمٌ (Lot 3) + عَلِيمٌۭ (Lot 2) · شَيْـًۭٔا vs شَىْءٍ (Lot 2) · غَيْرَ vs بِغَيْرِ (Lot 3) · يَـٰقَوْمِ vs قَوْمِهِۦ (Lot 3)
- **أَكْثَرَ** : 25/25 occurrences contextuellement élatives (« la plupart / plus nombreux »), 5/5 MASAQ ADJ_COMP, **0 occurrence verbale** (contrairement à أَعْلَمُ 7:188) → ACCEPT
- **وَيَوْمَ / وَٱلْأَرْضَ** : lemmes يَوْم / أَرْض status=proposed **sans lemma_translation FR validée** (0 traduction vérifiée) + composés وَ+nom → mapping impossible → GLOSE
- **قِيلَ** : PV_PASS 10/10 passif confirmé · **أَنزَلَ** : actif (paire avec أُنزِلَ Lot 3)

## 4. PROPOSITIONS (20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT)

Source : `tmp/phase70e/lot4-proposals.json` — 14 HIGH · 6 MEDIUM.

| Forme | Glose proposée | Confiance | Action |
|---|---|---|---|
| قِيلَ | il fut dit / on dit | HIGH | GLOSE (passif) |
| أَنزَلَ | Il fit descendre / Il révéla | HIGH | GLOSE (actif) |
| جَعَلَ | Il fit / Il établit | HIGH | GLOSE |
| أَرْسَلْنَا | Nous envoyâmes / Nous avons envoyé | HIGH | GLOSE |
| أَلِيمٌۭ | douloureux / pénible | HIGH | GLOSE |
| عَلِيمٌۢ | Omniscient / qui sait tout | HIGH | GLOSE (sœur) |
| أَكْثَرَ | la plupart / le plus grand nombre | MEDIUM | GLOSE (élatif vérifié) |
| شَيْـًۭٔا | une chose / rien | HIGH | GLOSE (sœur) |
| غَيْرَ | autre que / sans | MEDIUM | GLOSE (sœur) |
| يَـٰقَوْمِ | ô mon peuple | MEDIUM | GLOSE (vocatif) |
| ٱلشَّيْطَـٰنُ | le Diable / Satan | HIGH | GLOSE |
| ٱلْأَوَّلِينَ | les premiers / les anciens | HIGH | GLOSE |
| أَصْحَـٰبُ | les compagnons / les gens de | HIGH | GLOSE (participe) |
| مُّبِينٌۭ | évident / clair / explicite | HIGH | GLOSE (participe) |
| وَيَوْمَ | et le jour | MEDIUM | GLOSE (mapping refusé) |
| وَٱلْأَرْضَ | et la terre | HIGH | GLOSE (mapping refusé) |
| عَلَيْهِ | sur lui / sur elle | MEDIUM | GLOSE (clitique) |
| إِلَى | vers / jusqu'à | MEDIUM | GLOSE |
| مُوسَىٰٓ | Moïse | HIGH | GLOSE (sœur) |
| مِنۢ | de / depuis / parmi | MEDIUM | GLOSE (sœur) |

### Points méthodologiques couverts par le Lot 4
1. **Passif** : قِيلَ (PV_PASS) — voix conservée ; **paire voix** أَنزَلَ (actif) / أُنزِلَ (passif, Lot 3).
2. **Élatif vérifié** : أَكْثَرَ 25/25 élatifs — différence documentée avec أَعْلَمُ (HOLD) où une occurrence verbale réelle existe.
3. **Formes sœurs ×6** : gloses identiques ou cohérentes, word_id jamais fusionnés (test renforcé de la règle 8, y compris variante purement orthographique مِنۢ).
4. **Constructions composées وَ+nom** : وَيَوْمَ, وَٱلْأَرْضَ — mapping refusé (règle 3) + lemmes sans FR validée (règle 2).
5. **Clitique préposition+pronom** : عَلَيْهِ — mapping refusé (précédent لَهُۥ/فِيهِ Lot 2).
6. **Participe ≠ lemme verbal** : أَصْحَـٰبُ, مُّبِينٌۭ — glose nominale directe (règle 4).

## 5. TESTS HELPERS (`tmp/phase70e/tests.json`) — 14/14 PASS

Périmètre 20/20 · unicité · correspondance candidats↔propositions · 0 glose FR validée live · 0 mapping safe · HOLDs absents · 20/20 word_id réels · NFC documenté (4 formes non-NFC signalées, jamais modifiées) · cohérence formes↔base · aucune forme identique à une forme déjà glosée · aucune famille UNKNOWN · 0 MOVE_TO_LEMMA.

## 6. NON-RÉGRESSION (réellement exécutée)

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | **PASS** |
| `eslint .` | **PASS** |
| `vitest run` | **775/775 PASS** |
| `npm run build` | **PASS** |

## 7. GARANTIES

- **DATABASE_WRITES = 0** · aucun script d'APPLY créé ni exécuté · aucun lemme/traduction créé.
- Tables intactes : `word_translations`, `lemma_translations`, `word_lemma_mapping`, `translations`, `quran_words`, `word_occurrences`, MASAQ, curriculum, progression, Fātiḥah, pilotes.
- **HOLDs historiques conservés hors Lot 4** (section séparée) :

### HISTORICAL_HOLDS — OUT OF LOT 4
| Forme | Statut | Raison |
|---|---|---|
| **أَعْلَمُ** | HOLD | Homographie élatif / forme verbale attestée (7:188) — analyse occurrence-par-occurrence requise |
| **كُنَّا** | HOLD | Mapping كَان différé — normalisation/stem des lettres faibles à analyser |
| **وَإِن** | HOLD | Homographie إِنْ (condition) / إِنَّ (emphase) — rasm normalisé, couverture MASAQ incomplète |

- Aucun commit/push.

## 8. REVUE CIBLÉE (demandée par le décideur) — 10 cas sensibles examinés occurrence-par-occurrence

Source : `tmp/phase70e/targeted-data.json` (toutes occurrences + POS MASAQ par occurrence + 4 traductions) · `tmp/phase70e/lot4-targeted-review.json` (décisions).

### Vérifications live décisives (POS MASAQ par occurrence)
| Forme | Occ. | MASAQ | POS |
|---|---|---|---|
| قِيلَ | 34 | 12/12 | PV_PASS (homogène) |
| أَنزَلَ | 47 | 11/11 | PV (homogène) |
| جَعَلَ | 43 | 13/13 | PV+PVSUFF_SUBJ:3MS (homogène) |
| أَكْثَرَ | 25 | 5/5 + lecture 25/25 | ADJ_COMP (élatif confirmé) |
| شَيْـًۭٔا | 40 | 14/14 | NOUN_ABSTRACT+CASE_INDEF_ACC |
| غَيْرَ | 39 | 7/7 | NOUN_ABSTRACT 5 + EXCEPT_NOUN 2 |
| أَصْحَـٰبُ | 41 | 12/12 | NOUN_ACTIVE_PART (participe) |
| مُّبِينٌۭ | 32 | 12/12 | NOUN_ACTIVE_PART (participe) |
| عَلَيْهِ | 131 | 39/39 | PREP+POSS_PRON (clitique) |
| مِنۢ | 131 | 23/23 | PREP (grammatical) |

### Décisions recommandées — 10/10 ACCEPT (6 HIGH · 4 MEDIUM · 0 MODIFY · 0 HOLD · 0 REJECT)
| Forme | Proposition | Décision | Analyse clé |
|---|---|---|---|
| قِيلَ | il fut dit / on dit | **ACCEPT** | Passif impersonnel 34/34 ; deux rendus français naturels (récit / exhortation) |
| أَنزَلَ | Il fit descendre / Il révéla | **ACCEPT** | Deux faces du même verbe : pluie (physique) + Livre (révélation) — 4/4 |
| جَعَلَ | Il fit / Il établit | **ACCEPT** | Polysémie **convergente** (noyau causatif « faire devenir »), pas contradictoire |
| أَكْثَرَ | la plupart / le plus grand nombre | **ACCEPT** | **Confirmation 25/25 élative, 0 verbale** — distinction établie avec أَعْلَمُ (HOLD) |
| شَيْـًۭٔا | une chose / rien | **ACCEPT** | « rien » = rendu de construction négative, noyau « une chose » (cohérent شَىْءٍ Lot 2) |
| غَيْرَ | autre que / sans | **ACCEPT** | Deux valeurs attestées (NOUN_ABSTRACT/EXCEPT_NOUN) mais complémentaires |
| أَصْحَـٰبُ | les compagnons / les gens de | **ACCEPT** | Participe stable, toujours en annexion « gens de X » |
| مُّبِينٌۭ | évident / clair / explicite | **ACCEPT** | Noyau perceptif « qui rend manifeste » — 4/4 |
| عَلَيْهِ | sur lui / sur elle | **ACCEPT** | GLOSE confirmée — mapping détruirait le pronom enclitique (précédents لَهُۥ/فِيهِ) |
| مِنۢ | de / depuis / parmi | **ACCEPT** | Préposition stable, identique à مِّنَ (Lot 1), variante orthographique (word_id distincts) |

### B. Vérification des 10 autres candidats — tous UNCHANGED
أَرْسَلْنَا · أَلِيمٌۭ · عَلِيمٌۢ · يَـٰقَوْمِ · ٱلشَّيْطَـٰنُ · ٱلْأَوَّلِينَ · وَيَوْمَ · وَٱلْأَرْضَ · إِلَى · مُوسَىٰٓ — aucune information nouvelle justifiant une modification.

### C. Périmètre final recommandé du Lot 4
**20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT** — 20 `word_translations` potentielles, 0 mapping.

### D. Enseignements méthodologiques de la revue ciblée
1. **Critère de HOLD homographique précisé** : l'existence d'une occurrence verbale réelle (أَعْلَمُ 7:188), pas la seule couverture MASAQ partielle (أَكْثَرَ 5/25 mais 25/25 élatives).
2. **« rien » ≠ sens lexical** : rendu de construction négative (شَيْـًۭٔا) — le noyau reste « chose ».
3. **Polysémie convergente ≠ HOLD** : جَعَلَ (noyau causatif) reste glosable ; une glose n'est HOLD que si les sens sont contradictoires.
4. **Deux faces d'un même verbe** : أَنزَلَ « faire descendre » (pluie) / « révéler » (Livre) — glose double nécessaire.

## 9. HUMAN GATE — PHASE 70E / LOT 4 — PÉRIMÈTRE FINAL PROPOSÉ (post-revue ciblée)

**20 candidats** · **20 GLOSE** · 0 MOVE_TO_LEMMA · 0 HOLD supplémentaire · 0 REJECT · 14 HIGH / 6 MEDIUM · 0 écriture.

### HISTORICAL_HOLDS — OUT OF LOT 4 (inchangés)
أَعْلَمُ · كُنَّا · وَإِن — aucun traitement dans cette phase.

**Décisions possibles** : accepter globalement le périmètre révisé · modifier certaines gloses · placer certains cas en HOLD · rejeter certains candidats · demander une seconde revue ciblée.

**Aucune écriture DB ne doit avoir lieu avant votre décision.** Le prochain DRY-RUN d'import ne pourra commencer qu'après validation humaine explicite du périmètre final du Lot 4.

## 10. DRY-RUN LOT 4 (autorisé par la décision « ACCEPTATION GLOBALE ET PRÉPARATION DU DRY-RUN ») — `DATABASE_WRITES = 0`

Source : `tmp/phase70e/lot4-import-summary.json` · `tmp/phase70e/lot4-review-decisions.json` · script `tmp/phase70e-lot4-import.ts`.

### Périmètre du plan (réel, DRY-RUN)

| Table | Écritures prévues | Détail |
|---|---|---|
| `word_translations` (fr, `is_validated=true`) | **20 INSERT** · 0 ALREADY_EXISTS · 0 DIVERGENCE · 0 COLLISION | voir liste ci-dessous |
| `word_lemma_mapping` | **0** | aucun mapping au Lot 4 (vérifié) |
| `lemma_translations` / `lemmas` | **0 / 0** | aucun lemme créé |
| **Exclus (HOLD)** | أَعْلَمُ · كُنَّا · وَإِن | absents du plan (vérifié) |

### Les 20 gloses exactes
قِيلَ « il fut dit / on dit » · أَنزَلَ « Il fit descendre / Il révéla » · جَعَلَ « Il fit / Il établit » · أَرْسَلْنَا « Nous envoyâmes / Nous avons envoyé » · أَلِيمٌۭ « douloureux / pénible » · عَلِيمٌۢ « Omniscient / qui sait tout » · أَكْثَرَ « la plupart / le plus grand nombre » · شَيْـًۭٔا « une chose / rien » · غَيْرَ « autre que / sans » · يَـٰقَوْمِ « ô mon peuple » · ٱلشَّيْطَـٰنُ « le Diable / Satan » · ٱلْأَوَّلِينَ « les premiers / les anciens » · أَصْحَـٰبُ « les compagnons / les gens de » · مُّبِينٌۭ « évident / clair / explicite » · وَيَوْمَ « et le jour » · وَٱلْأَرْضَ « et la terre » · عَلَيْهِ « sur lui / sur elle » · إِلَى « vers / jusqu'à » · مُوسَىٰٓ « Moïse » · مِنۢ « de / depuis / parmi »

### Contrôles DRY-RUN — tous PASS
- **Identité** : 20 word_id réels + 3 HOLD vérifiés dans `quran_words` · 0 word_id inventé · 0 candidat hors périmètre
- **Unicode** : 23/23 match `normalize(NFC)` (0 MISMATCH) · 5 formes stockées avec combinaisons de diacritiques documentées (شَيْـًۭٔا, ٱلشَّيْطَـٰنُ, ٱلْأَوَّلِينَ, مُّبِينٌۭ, كُنَّا-HOLD) · **aucune normalisation artificielle** — clé = word_id
- **Unicité** : 0 word_id dupliqué · **Collisions** : `unexpected_collisions = 0` · **Divergences** : 0 (aucune word_translation existante sur ces formes)
- **Idempotence** : 20 INSERT (0 ALREADY_EXISTS) — `UNIQUE(word_id, language, source_id)` · aucun écrasement
- **Provenance** : source « Hikma — lexique éditorial » existante ✅ · `is_validated=true` uniquement sur les 20 ACCEPT · HOLDs absents du plan
- **Tables interdites** : le script n'écrit que dans `word_translations` — translations/quran_words/word_occurrences/linguistic_*/lemmas/lemma_translations/word_lemma_mapping/curriculum/progression = 0 (vérifié dans le code du script)

### Compteurs DB avant import (baseline live)
`word_translations` FR validées **587** · `word_lemma_mapping` **188** · `linguistic_occurrences` **22 485** · `linguistic_segments` **44 677** · `translations` **24 944** · `quran_words` **21 296** · `word_occurrences` **77 430** · `lemmas` **32** · `lemma_translations` **32** (28 FR validées)

### Non-régression (ré-exécutée après DRY-RUN)
`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers 14/14 PASS (inchangés)

### Tables susceptibles d'être écrites (uniquement après votre autorisation APPLY)
`word_translations` (**+20**) — aucune autre table. Aucun lemme créé, aucune lemma_translation, aucune donnée MASAQ/métier touchée, aucun commit/push.

## 11. HUMAN GATE — PHASE 70E / LOT 4 — DEMANDE D'AUTORISATION APPLY

**`DATABASE_WRITES = 0`** — le DRY-RUN est vert, **aucune écriture n'a eu lieu**.

| Élément | Valeur |
|---|---|
| Candidats (gloses ACCEPT) | **20** |
| INSERT prévus (`word_translations`) | **20** |
| Doublons (ALREADY_EXISTS) | **0** |
| Collisions | **0** |
| Divergences | **0** |
| HOLD exclus (vérifiés absents) | **3** : أَعْلَمُ · كُنَّا · وَإِن |
| Mapping / lemmes / lemma_translations | **0 / 0 / 0** |
| Table à écrire | `word_translations` uniquement (+20) |
| Provenance | « Hikma — lexique éditorial » · fr · `is_validated=true` |
| Baseline DB | 587 / 188 / 22 485 / 44 677 / 24 944 / 21 296 / 77 430 / 32 / 28 FR |
| Tests | `tsc` PASS · `eslint` PASS · `vitest` 775/775 PASS · `build` PASS |
| Runtime | non applicable au DRY-RUN (vérifié à l'étape post-APPLY) |

**J'attends votre autorisation explicite pour l'APPLY réel des 20 `word_translations`.** Aucun APPLY ne sera exécuté sans cette autorisation séparée. Verdict attendu : `PHASE_70E_LOT4_DRY_RUN_READY` avec `DATABASE_WRITES = 0`.
