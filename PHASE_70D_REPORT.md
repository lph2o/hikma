# PHASE_70D_REPORT — PRÉPARATION DU LOT 3 (WORKFLOW ÉDITORIAL HIKMA)

## STATUT

```
PHASE_70D_LOT3_READY_FOR_HUMAN_REVIEW
DATABASE_WRITES: 0
```

Préparation complète du Lot 3, strictement READ-ONLY. Aucune écriture DB, aucun commit/push.

---

## 1. GROUND TRUTH LIVE (READ-ONLY)

Source : `tmp/phase70d/ground-truth.json`.

| Compteur | Attendu | Réel |
|---|---|---|
| `word_translations` FR validées | 568 | **568** ✅ |
| `word_lemma_mapping` safe | 188 | **188** ✅ |
| `linguistic_occurrences` | 22 485 | **22 485** ✅ |
| `linguistic_segments` | 44 677 | **44 677** ✅ |
| `translations` | 24 944 | **24 944** ✅ |
| `quran_words` | 21 296 | **21 296** ✅ |
| `word_occurrences` | 77 430 | **77 430** ✅ |
| `lemmas` | 32 | **32** ✅ |
| `lemma_translations` FR validées | 28 | **28** ✅ |
| `sources` | 6 | **6** ✅ |

- **`divergences = []`** — aucun écart.
- Lots présents : Lot 1 (13 gloses + 3 mappings) · Lot 2 (17 gloses + 1 mapping) ✅
- **HOLDs absents de la base** : أَعْلَمُ (0 ligne) · كُنَّا (0 ligne) — vérifié en `word_translations` et `word_lemma_mapping` ✅
- Sourate 64 (MASAQ_BLOCKED) : **0 occurrence** ✅
- Aucune duplication parmi les 34 formes traitées ✅

## 2. SÉLECTION DU LOT 3 (déterministe)

Source : `tmp/phase70d/lot3-candidates.json`.

- Pool : **1 077** candidats (catégorie C + P1 + non enseigné + MASAQ, hors 34 formes traitées et 2 HOLDs, garde-fous live : 0 glose FR validée, 0 mapping safe).
- **20 candidats** sélectionnés, répartition par famille :

| Famille | Nb | Test méthodologique |
|---|---|---|
| VERBAL_LEXICAL | 4 | verbes actifs + **1 passif (أُنزِلَ)** |
| ADJECTIVE | 3 | dont forme sœur عَلِيمٌ (vs عَلِيمٌۭ Lot 2) |
| BARE_NOUN | 3 | dont 2 noms propres (فِرْعَوْنَ, إِسْرَٰٓءِيلَ) |
| DEFINITE_NOUN | 2 | attributs divins (ٱلْعَزِيزُ, ٱلْحَكِيمُ) |
| PARTICIPLE | 2 | participe nominal vs lemme verbal |
| LEMMA_RESOLVABLE | 2 | **mapping douteux testé** (وَكَانَ, أَفَلَا) |
| LEMMA_NO_FR | 1 | clitique possessif (قَوْمِهِۦ) |
| COMPOSED_CLITIC | 1 | conjonction + relatif (وَٱلَّذِينَ) |
| GRAMMATICAL | 2 | homographe (وَإِن) + adverbe (إِذْ) |

## 3. ÉVIDENCE (par candidat)

`tmp/phase70d/lot3-evidence.json` (toutes occurrences + 4 traductions alignées 31/9001/20/153 + MASAQ + audio) · `tmp/phase70d/analyst-view.json` (vue compacte 3 contextes/candidat).

## 4. PROPOSITIONS (19 GLOSE · 0 MOVE_TO_LEMMA · 1 HOLD)

| # | Forme | Proposition | Action | Conf. |
|---|-------|-------------|--------|-------|
| 1 | وَقَالُوا۟ | « et ils dirent » (sœur de قَالُوٓا۟) | GLOSE | HIGH |
| 2 | تَجْرِى | « elle coule » | GLOSE | HIGH |
| 3 | يَقُولُونَ | « ils disent » | GLOSE | HIGH |
| 4 | أُنزِلَ | « fut révélé / fut descendu » (passif) | GLOSE | HIGH |
| 5 | قَلِيلًۭا | « peu » | GLOSE | MED |
| 6 | كَثِيرًۭا | « beaucoup » | GLOSE | MED |
| 7 | عَلِيمٌ | « Omniscient / qui sait tout » (sœur Lot 2) | GLOSE | HIGH |
| 8 | فِرْعَوْنَ | « Pharaon » (nom propre) | GLOSE | HIGH |
| 9 | بِغَيْرِ | « sans / autre que » | GLOSE | MED |
| 10 | إِسْرَٰٓءِيلَ | « Israël » (nom propre) | GLOSE | HIGH |
| 11 | ٱلْعَزِيزُ | « le Puissant » | GLOSE | HIGH |
| 12 | ٱلْحَكِيمُ | « le Sage » | GLOSE | HIGH |
| 13 | ٱلْـَٔاخِرَةِ | « l'Au-delà » | GLOSE | HIGH |
| 14 | خَـٰلِدِينَ | « éternels / immortels » | GLOSE | HIGH |
| 15 | وَكَانَ | « et il était / et il fut » (mapping كَان rejeté : conjonction perdue) | GLOSE ⚠️ | MED |
| 16 | أَفَلَا | « ne…-ils pas ? » (mapping لَا rejeté : composé triple) | GLOSE ⚠️ | MED |
| 17 | قَوْمِهِۦ | « son peuple » (mapping قَوْم rejeté : possessif perdu) | GLOSE ⚠️ | MED |
| 18 | وَٱلَّذِينَ | « et ceux qui » (clitique composé) | GLOSE | MED |
| 19 | إِذْ | « lorsque / quand » | GLOSE | MED |
| 20 | وَإِن | — (homographe إِنْ/إِنَّ) | **HOLD** | — |

### Flags méthodologiques (revue particulière requise)
- **MAPPING_DOUBTEUX ×3** : وَكَانَ, أَفَلَا, قَوْمِهِۦ — détectés LEMMA_RESOLVABLE par l'auto-classifieur mais **mapping rejeté** (construction composée / clitique : perte d'information) → GLOSE. Décision méthodologique à confirmer.
- **HOMOGRAPHE → HOLD ×1** : وَإِن (condition « et si » vs emphase « et certes ») — aucune glose artificielle.
- **FORME_SOEUR ×2** : عَلِيمٌ (vs عَلِيمٌۭ Lot 2), وَقَالُوا۟ (vs قَالُوٓا۟ Lot 2) — jamais fusionnées.

### Lemmes
Aucun MOVE_TO_LEMMA proposé au Lot 3 (les 3 candidats lemma-résolvables sont des constructions composées). Lemme قَوْم (FR « peuple / gens ») vérifié live mais non mappé (possessif). Lemmes كَان/لَا existants mais mapping rejeté (perte d'information).

## 5. TESTS HELPERS (`tmp/phase70d/tests.json`) — 13/13 PASS

Périmètre 20 · unicité · NFC 20/20 · HOLDs absents · aucune glose/mapping existant sur les candidats · 19 GLOSE avec texte + 1 HOLD sans texte · aucun MOVE_TO_LEMMA · slots familiaux déterministes.

## 6. NON-RÉGRESSION (réellement exécutée)

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | **PASS** |
| `eslint .` | **PASS** |
| `vitest run` | **775/775 PASS** |
| `npm run build` | **PASS** |

## 7. GARANTIES

- **DATABASE_WRITES = 0** · aucun script d'APPLY exécuté · aucun lemme/traduction créé.
- Tables intactes : `word_translations`, `lemma_translations`, `word_lemma_mapping`, `translations`, `quran_words`, `word_occurrences`, MASAQ, curriculum, progression, Fātiḥah, pilotes.
- HOLDs conservés hors plan : **أَعْلَمُ**, **كُنَّا**.
- Aucun commit/push.

## 8. REVUE CIBLÉE (demandée par le décideur) — 4 cas examinés occurrence-par-occurrence

Source : `tmp/phase70d/targeted-review.json` (dossiers complets, toutes occurrences + 4 traductions + MASAQ) · `tmp/phase70d/lot3-review-analysis.json`.

### A. Décisions recommandées sur les 4 cas ciblés

| Forme | Occurrences | Analyse clé | Décision |
|---|---|---|---|
| **وَكَانَ** | 84 (MASAQ 2× CONJ,PV) | Composé وَ + كَانَ (copule « et il était / et il fut », 2:34, 19:51, 25:67) ; mapping كَان rejeté (perte de la conjonction « et ») | **ACCEPT — GLOSE « et il était / et il fut »** |
| **أَفَلَا** | 44 (MASAQ 13× INTERROG,CONJ,NEG_PART) | Composé triple أَ+فَ+لَا, question rhétorique de reproche (2:44, 4:82, 37:155, 51:21) ; mapping لَا rejeté (destruction de la construction) | **ACCEPT — GLOSE « ne…-ils/vous pas ? »** |
| **قَوْمِهِۦ** | 17 (MASAQ 3× NOUN_CONCRETE,POSS_PRON) | قَوْم + possessif « son peuple » (7:59, 7:75) ; mapping قَوْم rejeté (perte du possessif) | **ACCEPT — GLOSE « son peuple »** |
| **وَإِن** | 146 (MASAQ 37× CONJ,CONDITION_PART) | **Homographe إِنْ/إِنَّ** : 37/37 MASAQ conditionnels, 0 emphase confirmée dans les 146 traductions, MAIS rasm normalisé (146 × « وَإِن », aucune forme « وَإِنَّ » en base), text_uthmani vide, 109 occurrences sans MASAQ → distinction non tranchable de manière fiable sur tout le périmètre | **HOLD** |

**Verdict : 3 ACCEPT (GLOSE) · 1 HOLD (وَإِن) · 0 MOVE_TO_LEMMA · 0 REJECT.**

### B. Les 16 autres candidats — soumis à la revue ciblée suivante (section 9)
وَقَالُوا۟ · تَجْرِى · يَقُولُونَ · أُنزِلَ · قَلِيلًۭا · كَثِيرًۭا · عَلِيمٌ · فِرْعَوْنَ · بِغَيْرِ · إِسْرَٰٓءِيلَ · ٱلْعَزِيزُ · ٱلْحَكِيمُ · ٱلْـَٔاخِرَةِ · خَـٰلِدِينَ · وَٱلَّذِينَ · إِذْ — aucune modification, aucune écriture à ce stade.

### C. HOLDs historiques — hors périmètre
أَعْلَمُ (homographie élatif/verbe) · كُنَّا (mapping différé) — absents de la base, conservés hors plan.

### D. DATABASE_WRITES
**0** — aucun script d'APPLY exécuté, aucune écriture.

### E. Non-régression (ré-exécutée après la revue ciblée)
`tsc --noEmit` PASS · `eslint .` PASS · `vitest run` **775/775 PASS** · `npm run build` PASS.

## 9. REVUE DES 16 CANDIDATS RESTANTS (demandée par le décideur) — occurrence-par-occurrence, READ-ONLY

Source : `tmp/phase70d/remaining-16-review.json` (vérifications live) · `tmp/phase70d/remaining-16-analysis.json` (décisions).

### Vérifications live décisives

| Contrôle | Résultat |
|---|---|
| NFC | 14/16 **NFC_OK** · ٱلْـَٔاخِرَةِ stockée NFD · وَٱلَّذِينَ shadda directe — clé = word_id, formes réelles utilisées telles quelles |
| Formes sœurs | قَالُوٓا۟ (140a05de, « ils dirent » validée) ≠ وَقَالُوا۟ · عَلِيمٌۭ (728fb6a7, « Omniscient / qui sait tout » validée) ≠ عَلِيمٌ — **word_id distincts vérifiés, aucune fusion** |
| Gloses existantes | **0 word_translation FR existante** sur les 16 · aucun doublon |
| Lemmes | **0 lemme** pour خالد/غير/أنزل/إذ/جري/قال/قول/عليم/قليل/كثير/عزيز/حكيم/آخر → **aucun MOVE_TO_LEMMA possible**, gloses directes |
| POS MASAQ | Homogènes 11/11 : أُنزِلَ = **PV_PASS** (passif confirmé) · خَـٰلِدِينَ = **NOUN_ACTIVE_PART** (participe, pas verbal) · بِغَيْرِ = PREP+NOUN_ABSTRACT · وَٱلَّذِينَ = CONJ+REL_PRON · إِذْ = ADV · تَجْرِى/يَقُولُونَ = IV · قَلِيلًۭا/كَثِيرًۭا = ADJ_QUALIT |
| Compteurs live | 568 / 188 / 22 485 / 44 677 / 21 296 / 77 430 / 32 / 32 — stables, 0 divergence |

### Décisions recommandées — 16/16 ACCEPT (11 HIGH · 5 MEDIUM · 0 MOVE_TO_LEMMA)

| Forme | Occ. | Glose | Confiance | Analyse clé |
|---|---|---|---|---|
| وَقَالُوا۟ | 46 | et ils dirent | HIGH | Sœur de قَالُوٓا۟ (Lot 2) + وَ — word_id distincts, CONJ+PV homogène |
| تَجْرِى | 41 | elle coule | HIGH | Imparfait fém. de جَرَى « coulent » (2:25) — convention verbes conjugués |
| يَقُولُونَ | 41 | ils disent | HIGH | Imparfait 3MP de قَالَ (vs parfait قَالُوٓا۟) — aspect distingué |
| أُنزِلَ | 43 | fut révélé / fut descendu | HIGH | **PV_PASS 10/10** — voix passive conservée dans la glose (exigence) |
| قَلِيلًۭا | 25 | peu | MEDIUM | Adjectif indéfini accusatif, usage quantitatif/adverbial stable |
| كَثِيرًۭا | 28 | beaucoup | MEDIUM | Paire antonymique قَلِيلًۭا/كَثِيرًۭا « peu / beaucoup » |
| عَلِيمٌ | 14 | Omniscient / qui sait tout | HIGH | Sœur de عَلِيمٌۭ (Lot 2) — glose identique, **jamais fusionnée** |
| فِرْعَوْنَ | 39 | Pharaon | HIGH | Nom propre, 4/4 — précédent مُوسَىٰ (Lot 1) |
| بِغَيْرِ | 29 | sans / autre que | MEDIUM | بِ+غَيْر (PREP+NOUN_ABSTRACT) — mapping impossible/destructeur, glose de fonction |
| إِسْرَٰٓءِيلَ | 35 | Israël | HIGH | Nom propre, 4/4 |
| ٱلْعَزِيزُ | 42 | le Puissant | HIGH | Attribut divin défini, stable |
| ٱلْحَكِيمُ | 26 | le Sage | HIGH | Attribut divin défini, 4/4 |
| ٱلْـَٔاخِرَةِ | 35 | l'Au-delà | HIGH | Participe fém. de آخر « dernier » — terme eschatologique stable (cohérent ٱلْقِيَـٰمَةِ Lot 2) |
| خَـٰلِدِينَ | 36 | éternels / immortels | HIGH | **NOUN_ACTIVE_PART 14/14** — participe ≠ lemme verbal (aucun خلد), mapping verbal incompatible refusé |
| وَٱلَّذِينَ | 149 | et ceux qui | MEDIUM | وَ+ٱلَّذِينَ (CONJ+REL_PRON) — aucun lemme, conjonction intégrée ; fréquence justifiée par la fonction, pas par le volume |
| إِذْ | 144 | lorsque / quand | MEDIUM | Adverbe temporel (ADV 41/41) — stable, cohérent قَبْلُ (Lot 2) |

**Verdict : 16/16 ACCEPT (GLOSE) · 0 MOVE_TO_LEMMA · 0 MODIFY · 0 HOLD · 0 REJECT.**

## 10. HUMAN GATE — PHASE 70D / LOT 3 — PÉRIMÈTRE FINAL PROPOSÉ

### Composition Lot 3 après revues (propositions — AUCUNE écriture)

| Élément | Valeur |
|---|---|
| **Gloses directes** | **19** : وَكَانَ · أَفَلَا · قَوْمِهِۦ (revue ciblée) + وَقَالُوا۟ · تَجْرِى · يَقُولُونَ · أُنزِلَ · قَلِيلًۭا · كَثِيرًۭا · عَلِيمٌ · فِرْعَوْنَ · بِغَيْرِ · إِسْرَٰٓءِيلَ · ٱلْعَزِيزُ · ٱلْحَكِيمُ · ٱلْـَٔاخِرَةِ · خَـٰلِدِينَ · وَٱلَّذِينَ · إِذْ (revue restante) |
| **MOVE_TO_LEMMA** | **0** — aucun lemme n'existe pour les stems ; constructions composées (وَكَانَ, أَفَلَا, قَوْمِهِۦ, بِغَيْرِ, وَٱلَّذِينَ, وَقَالُوا۟) gardent leur information (conjonction/interrogatif/possessif/préposition) |
| **HOLD** | **وَإِن** (homographe إِنْ/إِنَّ non tranchable) + HOLDs historiques **أَعْلَمُ**, **كُنَّا** — absents du plan, vérifiés |
| **Écritures potentielles** | `word_translations` **+19** · `word_lemma_mapping` **+0** (uniquement après autorisation APPLY) |
| **Tables autorisées** | `word_translations` (+19) · `word_lemma_mapping` (0) — aucun lemme créé, aucune lemma_translation, aucune table MASAQ/métier |
| **Provenance** | « Hikma — lexique éditorial » · `is_validated=true` uniquement sur les gloses acceptées |

### DATABASE_WRITES
**0** — aucun DRY-RUN d'import lancé, aucune écriture, aucun commit/push.

Décisions possibles : accepter globalement · revue ciblée supplémentaire · modifier certaines propositions · ajuster la sélection · rejeter certains cas.

**Aucune écriture DB ne doit avoir lieu avant votre décision.**

## 11. DRY-RUN LOT 3 (autorisé par la décision « ACCEPT GLOBAL + PRÉPARATION DRY-RUN ») — `DATABASE_WRITES = 0`

Source : `tmp/phase70d/lot3-import-summary.json` · `tmp/phase70d/lot3-review-decisions.json` · script `tmp/phase70d-lot3-import.ts`.

### Périmètre du plan (réel, DRY-RUN)

| Table | Écritures prévues | Détail |
|---|---|---|
| `word_translations` (fr, `is_validated=true`) | **19 INSERT** · 0 ALREADY_EXISTS · 0 DIVERGENCE · 0 COLLISION | voir liste ci-dessous |
| `word_lemma_mapping` | **0** | aucun mapping au Lot 3 (vérifié) |
| `lemma_translations` / `lemmas` | **0** | aucun lemme créé |
| **Exclus (HOLD)** | وَإِن · أَعْلَمُ · كُنَّا | absents du plan (vérifié) |

### Les 19 gloses exactes
وَكَانَ « et il était / et il fut » · أَفَلَا « ne…-ils/vous pas ? » · قَوْمِهِۦ « son peuple » · وَقَالُوا۟ « et ils dirent » · تَجْرِى « elle coule » · يَقُولُونَ « ils disent » · أُنزِلَ « fut révélé / fut descendu » · قَلِيلًۭا « peu » · كَثِيرًۭا « beaucoup » · عَلِيمٌ « Omniscient / qui sait tout » · فِرْعَوْنَ « Pharaon » · بِغَيْرِ « sans / autre que » · إِسْرَٰٓءِيلَ « Israël » · ٱلْعَزِيزُ « le Puissant » · ٱلْحَكِيمُ « le Sage » · ٱلْـَٔاخِرَةِ « l'Au-delà » · خَـٰلِدِينَ « éternels / immortels » · وَٱلَّذِينَ « et ceux qui » · إِذْ « lorsque / quand »

### Contrôles DRY-RUN — tous PASS
- **Identité** : 19 word_id réels + 3 HOLD vérifiés dans `quran_words` · 0 word_id inventé · 0 candidat hors périmètre
- **Unicode** : 22/22 match `normalize(NFC)` (0 MISMATCH) · 3 formes stockées avec shadda combinante (ٱلْـَٔاخِرَةِ, وَٱلَّذِينَ, كُنَّا) documentées, **aucune normalisation artificielle** — clé = word_id
- **Unicité** : 0 word_id dupliqué · **Collisions** : `unexpected_collisions = 0` · **Divergences** : 0 (aucune word_translation existante sur ces formes)
- **Idempotence** : 19 INSERT (0 ALREADY_EXISTS) — aucune ligne existante à écraser
- **Provenance** : source « Hikma — lexique éditorial » existante ✅ · `is_validated=true` uniquement sur les 19 ACCEPT · HOLDs absents du plan
- **Tables interdites** : le script n'écrit que dans `word_translations` — translations/quran_words/word_occurrences/linguistic_*/lemmas/lemma_translations/word_lemma_mapping/curriculum/progression = 0 (vérifié dans le code du script)

### Compteurs DB avant import (baseline live)
`word_translations` FR validées **568** · `word_lemma_mapping` **188** · `linguistic_occurrences` **22 485** · `linguistic_segments` **44 677** · `translations` **24 944** · `quran_words` **21 296** · `word_occurrences` **77 430** · `lemmas` **32** · `lemma_translations` **32**

### Non-régression (ré-exécutée après DRY-RUN)
`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS

### Tables susceptibles d'être écrites (uniquement après votre autorisation APPLY)
`word_translations` (**+19**) — aucune autre table. Aucun lemme créé, aucune lemma_translation, aucune donnée MASAQ/métier touchée, aucun commit/push.

## 12. HUMAN GATE — PHASE 70D / LOT 3 — DEMANDE D'AUTORISATION APPLY

**`DATABASE_WRITES = 0`** — le DRY-RUN est vert, **aucune écriture n'a eu lieu**.

| Élément | Valeur |
|---|---|
| Candidats (gloses ACCEPT) | **19** |
| INSERT prévus (`word_translations`) | **19** |
| Doublons (ALREADY_EXISTS) | **0** |
| Collisions | **0** |
| Divergences | **0** |
| HOLD exclus (vérifiés absents) | **3** : وَإِن · أَعْلَمُ · كُنَّا |
| Mapping / lemmes / lemma_translations | **0 / 0 / 0** |
| Table à écrire | `word_translations` uniquement (+19) |
| Provenance | « Hikma — lexique éditorial » · fr · `is_validated=true` |
| Baseline DB | 568 / 188 / 22 485 / 44 677 / 24 944 / 21 296 / 77 430 / 32 / 32 |
| Tests | `tsc` PASS · `eslint` PASS · `vitest` 775/775 PASS · `build` PASS |
| Runtime | non applicable au DRY-RUN (vérifié à l'étape post-APPLY) |

**J'attends votre autorisation explicite pour l'APPLY réel des 19 `word_translations`.** Aucun APPLY ne sera exécuté sans cette autorisation séparée. Verdict attendu : `PHASE_70D_LOT3_DRY_RUN_READY` avec `DATABASE_WRITES = 0`.
