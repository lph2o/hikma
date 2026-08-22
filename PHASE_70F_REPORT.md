# PHASE_70F_REPORT — LOT 5 — PRÉPARATION READ-ONLY

## Verdict

```
PHASE_70F_LOT5_READY_FOR_HUMAN_REVIEW
DATABASE_WRITES = 0
```

**Aucune écriture DB. Aucun DRY-RUN d'import. Aucun script d'APPLY créé.**

---

## 1. Ground truth live (ÉTAPE 1)

| Compteur | Attendu | Réel (live) |
|---|---:|---:|
| `quran_words` | 21 296 | 21 296 |
| `word_occurrences` | 77 430 | 77 430 |
| `translations` | 24 944 | 24 944 |
| `linguistic_occurrences` | 22 485 | 22 485 |
| `linguistic_segments` | 44 677 | 44 677 |
| `lemmas` | 32 | 32 |
| `lemma_translations` | 32 | 32 |
| `lemma_translations` FR validées | 28 | 28 |
| `word_translations` FR validées | **607** | **607** |
| `word_lemma_mapping` (safe) | **188** | **188** |

- **Lots 1–4 présents** : Lot 1 = 13 gloses · Lot 2 = 17 · Lot 3 = 19 · Lot 4 = 20 (mappings comptés séparément dans `word_lemma_mapping`)
- **HOLDs historiques absents** : أَعْلَمُ · كُنَّا · وَإِن → 0 `word_translation` FR validée, 0 mapping
- **Sourate 64** = 0 occurrence MASAQ (MASAQ_BLOCKED)
- **Aucune divergence** avec l'état attendu post-Lot 4

## 2. Sélection (ÉTAPE 2) — 20 candidats

Pool : **1 037 candidats** (catégorie C + P1 + non enseignés + MASAQ, hors 72 formes traitées Lots 1–4 + 3 HOLDs, après garde-fous live : 0 glose FR validée, 0 mapping safe).

Sélection déterministe stratifiée par famille (tri fréquence décroissante au sein de chaque famille) :

| Famille | Nb | Formes |
|---|---:|---|
| Verbes lexicaux (dont passif) | 4 | أُوتُوا۟ (**PV_PASS**) · ءَامَنُوٓا۟ · يُحِبُّ · يَهْدِى |
| Adjectifs | 3 | قَدِيرٌۭ · عَظِيمٌۭ · حَكِيمٌۭ |
| Noms nus (dont nom propre) | 4 | إِلَـٰهَ · جَنَّـٰتٍۢ · تَحْتِهَا · مَرْيَمَ |
| Noms définis | 2 | ٱلْأَنْهَـٰرُ · ٱلْعَلِيمُ |
| Participes | 2 | صَـٰدِقِينَ · ٱلْمُحْسِنِينَ |
| Lemma-résolvables → GLOSE | 2 | لِلنَّاسِ · لِّقَوْمٍۢ |
| Clitique composé | 1 | وَهُمْ |
| Grammaticaux | 2 | وَإِذَا · إِنَّا |

## 3. Propositions (ÉTAPE 6, avant revue ciblée) — 20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT (12 HIGH / 8 MEDIUM)

> ⚠️ Après revue ciblée (section 3bis) : **13 HIGH / 7 MEDIUM · 1 MODIFY** (جَنَّـٰتٍۢ « des jardins ») · إِنَّا promu HIGH.

| Forme | Famille | Occ. | POS MASAQ | Proposition | Confiance |
|---|---:|---|---|---|---|
| أُوتُوا۟ | verbal | 31 | PV_PASS | « ils reçurent / il leur fut donné » | HIGH |
| ءَامَنُوٓا۟ | verbal | 39 | PV | « ils ont cru / ils crurent » | HIGH |
| يُحِبُّ | verbal | 39 | IV | « Il aime » | HIGH |
| يَهْدِى | verbal | 38 | IV | « Il guide / Il dirige » | MEDIUM |
| قَدِيرٌۭ | adj | 25 | ADJ_QUALIT | « Puissant / Omnipotent » | HIGH |
| عَظِيمٌۭ | adj | 23 | ADJ_QUALIT | « immense / grand » | HIGH |
| حَكِيمٌۭ | adj | 21 | ADJ_QUALIT | « sage / plein de sagesse » | HIGH |
| إِلَـٰهَ | nom nu | 37 | NOUN_CONCRETE | « dieu / divinité » | HIGH |
| جَنَّـٰتٍۢ | nom nu | 37 | NOUN_CONCRETE | « des jardins (du Paradis) » | MEDIUM |
| تَحْتِهَا | nom nu (composé) | 34 | NOUN_ABSTRACT+POSS_PRON | « sous elle / au-dessous d'elle » | MEDIUM |
| ٱلْأَنْهَـٰرُ | nom défini | 29 | DET+NOUN_CONCRETE | « les rivières / les fleuves » | HIGH |
| ٱلْعَلِيمُ | nom défini (attribut) | 28 | DET+NOUN_PROP | « l'Omniscient / Celui qui sait tout » | HIGH |
| صَـٰدِقِينَ | participe | 31 | NOUN_ACTIVE_PART | « véridiques / sincères » | MEDIUM |
| ٱلْمُحْسِنِينَ | participe | 30 | DET+NOUN_ACTIVE_PART | « les bienfaisants / les gens de bien » | MEDIUM |
| لِلنَّاسِ | lemma-résolvable | 36 | PREP+DET+NOUN | « aux gens / pour les gens » | MEDIUM |
| لِّقَوْمٍۢ | lemma-résolvable | 35 | PREP+NOUN | « pour un peuple / à un peuple » | MEDIUM |
| وَهُمْ | clitique composé | 110 | CONJ+PRON | « et eux / et ils » | MEDIUM |
| وَإِذَا | grammatical | 117 | CONJ+ADV | « et lorsque / et quand » | MEDIUM |
| مَرْيَمَ | nom propre | 23 | NOUN_PROP_FOREIGN | « Marie » | HIGH |
| إِنَّا | grammatical | 115 | INF_ANNUL_PART+POSS_PRON | « certes Nous / Nous » | HIGH ⚠️ |

### Décisions méthodologiques clés (vérifiées en live)

- **Mappings refusés (5)** : تَحْتِهَا, لِلنَّاسِ, لِّقَوْمٍۢ, وَهُمْ, وَإِذَا — constructions composées (préposition/conjonction + nom/pronom) : le mapping détruirait une information (précédents validés عَلَيْهِ, فِيهِ, قَوْمِهِۦ, بِغَيْرِ). Lemmes نَاس / قَوْم existent avec FR validée mais la préposition لِ serait perdue.
- **Participles (2)** : صَـٰدِقِينَ, ٱلْمُحْسِنِينَ — participe nominal ≠ lemme verbal, aucun lemme existant → glose directe (règle 4).
- **Passif (1)** : أُوتُوا۟ — PV_PASS 10/10 homogène, voix conservée.
- **Attributs divins définis** : ٱلْعَلِيمُ (« l'Omniscient ») — cohérence avec la famille عَلِيم glosée aux Lots 2–4 ; حَكِيمٌۭ cohérent avec ٱلْحَكِيمُ (Lot 3) — **word_id distincts, aucune fusion**.
- **Formes sœurs vérifiées** : قَدِيرٌۭ (≠ ٱلْقَدِيرُ non glosée) · عَظِيمٌۭ (≠ ٱلْعَظِيمُ non glosée) · جَنَّـٰتٍۢ (≠ ٱلْجَنَّةِ Fātiḥah) · حَكِيمٌۭ (≠ ٱلْحَكِيمُ Lot 3) · وَهُمْ (≠ هُمْ/لَهُمْ glosées) · وَإِذَا (≠ إِذَا glosée).
- **إِنَّا — cas signalé à la revue humaine** : rasm **UNAMBIGUOUS** (shadda portée : codepoints 625 650 646 651 64e 627) → **aucune homographie avec إِنْ** (contrairement à وَإِن, HOLD historique). Signification stable (« certes Nous »), 4/4 convergentes. **Couverture MASAQ = 0/115** (non importée) — évidence reposant sur les 4 traductions ; non ambigu mais à confirmer par la revue humaine.

## 3bis. REVUE CIBLÉE DES 10 CAS SENSIBLES (décision humaine : REVUE CIBLÉE avant DRY-RUN)

Analyse occurrence-par-occurrence sur données live (`tmp/phase70f/targeted-data.json` : toutes occurrences + POS MASAQ par occurrence + 4 traductions alignées). **Correction Unicode** : comparaison en NFC (tanwin précomposé vs combinant).

### Verdict — 9 ACCEPT · 1 MODIFY · 0 HOLD · 0 REJECT (4 HIGH / 6 MEDIUM)

| Forme | Occ. | POS MASAQ (couvert) | Décision | Confiance | Analyse clé |
|---|---:|---|---|---|---|
| يَهْدِى | 38 | IV 15/38 | **ACCEPT** | HIGH | 38/38 « guider / diriger » — forme faible, aucune lecture contradictoire |
| جَنَّـٰتٍۢ | 37 | NOUN_CONCRETE 18/37 | **MODIFY** | MEDIUM | « des jardins » — « (du Paradis) » est contextuel (26:147 mondain) → retiré |
| تَحْتِهَا | 34 | NOUN_ABSTRACT+POSS_PRON 14/34 | **ACCEPT** | MEDIUM | 34/34 « sous lesquels coulent » — clitique ـهَا, mapping interdit |
| صَـٰدِقِينَ | 31 | NOUN_ACTIVE_PART 12/31 | **ACCEPT** | MEDIUM | 31/31 « véridiques/sincères » — participe ≠ lemme verbal |
| ٱلْمُحْسِنِينَ | 30 | DET+NOUN_ACTIVE_PART 8/30 | **ACCEPT** | MEDIUM | 30/30 « bienfaisants / gens de bien » — participe |
| لِلنَّاسِ | 36 | PREP+DET+NOUN 7/36 | **ACCEPT** | MEDIUM | 36/36 لِ + ٱلنَّاسِ — mapping perdrait لِ → refusé |
| لِّقَوْمٍۢ | 35 | PREP+NOUN 10/35 | **ACCEPT** | MEDIUM | 35/35 لِ + قَوْمٍ — mapping perdrait لِ → refusé |
| وَهُمْ | 110 | CONJ+PRON 39/110 | **ACCEPT** | MEDIUM | 110/110 وَ + هُمْ — mapping perdrait la conjonction → refusé |
| وَإِذَا | 117 | CONJ+ADV 40/117 | **ACCEPT** | MEDIUM | 117/117 « et lorsque/quand » — distinct de وَإِن (HOLD) et إِذْ |
| إِنَّا | 115 | INF_ANNUL_PART+POSS_PRON 38/115 | **ACCEPT** | HIGH | Rasm non ambigu (shadda) · MASAQ corrigé 38/115 · 115/115 « certes Nous / Nous » |

### Corrections et décisions clés

- **إِنَّا — correction importante** : la couverture MASAQ réelle est **38/115** (le 0/115 initial provenait d'une requête avec mismatch de codepoints tanwin). POS homogène (INF_ANNUL_PART,POSS_PRON), rasm shadda non ambigu → **promu HIGH, ACCEPT**. Aucun HOLD.
- **جَنَّـٰتٍۢ — MODIFY** : glose réduite à « des jardins » (l'explicitation « du Paradis » n'est pas portée par le lexème — 26:147 est un jardin mondain).
- **Mappings refusés confirmés (5)** : تَحْتِهَا · لِلنَّاسِ · لِّقَوْمٍۢ · وَهُمْ · وَإِذَا — la perte de préposition/conjonction/clitique interdit tout mapping (règle Hikma, précédents Lots 2-4).
- **Participations confirmées (2)** : صَـٰدِقِينَ · ٱلْمُحْسِنِينَ — participe nominal ≠ lemme verbal.
- **Les 10 autres candidats restent CANDIDATE inchangés** (aucune contradiction révélée).

### Périmètre du Lot 5 après revue ciblée

**20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT · 1 MODIFY** (جَنَّـٰتٍۢ) · 13 HIGH / 7 MEDIUM — `word_translations` +20 potentielles, 0 mapping.

## 4. Tests (ÉTAPE 7)

`tmp/phase70f/tests.json` — **20 PASS / 0 FAIL / 1 INFO** :

- périmètre 20/20 · unicité word_id + formes · word_id réels dans `quran_words` · formes conformes
- NFC : 15/20 NFC directes, **5 formes stockées avec shadda combinante documentées** (يُحِبُّ, جَنَّـٰتٍۢ, لِلنَّاسِ, لِّقَوْمٍۢ, إِنَّا) — clé d'import = word_id, **aucune normalisation artificielle** (règle des Lots 3–4)
- HOLDs absents · 0 glose FR existante · 0 mapping safe existant · 0 MOVE_TO_LEMMA · 20 GLOSE
- diversité familles ≥ 8 · lemma_match uniquement sur familles LEMMA_RESOLVABLE · glosses non vides · confiances valides

## 5. Non-régression

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | PASS |
| `eslint .` | PASS |
| `vitest run` | **775/775 PASS** |
| `npm run build` | PASS |

## 6. HOLDs historiques — OUT OF LOT 5

| Forme | Raison | État |
|---|---|---|
| أَعْلَمُ | homographe élatif / forme verbale | absent (0 wt, 0 mapping) |
| كُنَّا | mapping différé (lettres faibles) | absent (0 wt, 0 mapping) |
| وَإِن | homographie إِنْ / إِنَّ, rasm normalisé | absent (0 wt, 0 mapping) |

## 7. Garanties

- `DATABASE_WRITES = 0` — aucun script d'écriture, aucun INSERT/UPDATE/DELETE
- Tables non touchées : `word_translations`, `word_lemma_mapping`, `lemmas`, `lemma_translations`, `translations`, `quran_words`, `word_occurrences`, `linguistic_occurrences`, `linguistic_segments`, MASAQ, curriculum, progression
- Fātiḥah et pilotes protégés intacts
- Aucun commit, aucun push

## 8. Artefacts

`tmp/phase70f/ground-truth.json` · `lot5-candidates.json` · `lot5-evidence.json` · `analyst-view.json` · `targeted-checks.json` · `targeted-data.json` (10 cas, toutes occurrences + POS par occurrence + 4 traductions) · `lot5-targeted-review.json` (décisions revue ciblée) · `lot5-proposals.json` · `tests.json` · scripts READ-ONLY `tmp/phase70f-*.ts` · `PHASE_70F_REPORT.md`

---

## HUMAN GATE — PHASE 70F / LOT 5 — REVUE CIBLÉE TERMINÉE

### A. Verdict des 10 cas ciblés

**9 ACCEPT · 1 MODIFY · 0 HOLD · 0 REJECT** — détail dans `lot5-targeted-review.json` et section 3bis.

### B. Périmètre révisé du Lot 5

**20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT · 1 MODIFY** (جَنَّـٰتٍۢ « des jardins ») · **13 HIGH / 7 MEDIUM** → 20 `word_translations` potentielles, 0 mapping.

### C. Corrections documentées

- **إِنَّا** : MASAQ réel **38/115** (corrigé — 0/115 initial = mismatch codepoints tanwin) · POS homogène · rasm shadda non ambigu → **HIGH, ACCEPT** (aucun HOLD)
- **جَنَّـٰتٍۢ** : glose réduite à « des jardins » (explicitation théologique non portée par le lexème)

### D. Ground truth DB (reconfirmé)

`607` FR validées · `188` mappings safe · MASAQ `22 485`/`44 677` · `24 944` translations · `21 296` quran_words · `77 430` occurrences · `32` lemmas · `28` lemma_translations FR validées · Lots 1–4 présents · HOLDs absents · sourate 64 = 0.

### E. Non-régression

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **20 PASS / 0 FAIL / 1 INFO** (ré-exécutés).

### F. Décision demandée

**DATABASE_WRITES = 0** · aucun DRY-RUN lancé. Décisions possibles : **ACCEPT globalement le périmètre révisé · MODIFIER certaines gloses · placer des cas en HOLD · REJETER certains candidats · seconde revue ciblée**. Le DRY-RUN ne commencera qu'après votre décision explicite.

---

## 9. DRY-RUN (autorisation : ACCEPT global du périmètre révisé)

Décision humaine : **20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD supplémentaire · 0 REJECT · MODIFY جَنَّـٰتٍۢ → « des jardins »**.

`tmp/phase70f/lot5-review-decisions.json` (20 gloses + 3 HOLD exclus) · `tmp/phase70f-lot5-import.ts` (DRY-RUN par défaut, APPLY verrouillé par `APPLY=1`).

### Résultat DRY-RUN — tous contrôles PASS

| Table | Plan |
|---|---|
| `word_translations` (fr, `is_validated=true`) | **20 INSERT** · 0 ALREADY_EXISTS · 0 DIVERGENCE · 0 COLLISION |
| `word_lemma_mapping` / `lemma_translations` / `lemmas` | **0 / 0 / 0** |
| Exclus (HOLD vérifiés absents) | أَعْلَمُ · كُنَّا · وَإِن |

- **Identité** : 20 word_id réels + 3 HOLD vérifiés dans `quran_words` (23/23) · 0 word_id inventé · 0 candidat hors périmètre
- **Unicode** : 23/23 match `normalize(NFC)` (0 MISMATCH) · 6 formes avec combinaisons de diacritiques documentées (يُحِبُّ, جَنَّـٰتٍۢ, لِلنَّاسِ, لِّقَوْمٍۢ, إِنَّا, كُنَّا-HOLD) — **aucune normalisation artificielle**, clé = word_id
- **MODIFY confirmé** : جَنَّـٰتٍۢ → « des jardins » (exclusivement)
- **Écrasement** : aucune ligne existante sur ces formes → aucun risque
- **Idempotence** : 20 INSERT (0 ALREADY_EXISTS) — `UNIQUE(word_id, language, source_id)`
- **Provenance** : « Hikma — lexique éditorial » existante ✅ · `is_validated=true` uniquement sur les 20 ACCEPT
- **Tables interdites** : le script n'écrit que dans `word_translations`

### Baseline DB (avant import, live)

`word_translations` FR validées **607** · `word_lemma_mapping` **188** · `linguistic_occurrences` **22 485** · `linguistic_segments` **44 677** · `translations` **24 944** · `quran_words` **21 296** · `word_occurrences` **77 430** · `lemmas` **32** · `lemma_translations` **32** (28 FR validées)

### Non-régression

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **20 PASS / 0 FAIL / 1 INFO**

---

## HUMAN GATE — PHASE 70F / LOT 5 — DRY-RUN VERT

**DATABASE_WRITES = 0** — aucune écriture effectuée. Verdict : `PHASE_70F_LOT5_DRY_RUN_READY`.

**Autorisez-vous l'APPLY réel des 20 `word_translations` du Lot 5 ?** L'APPLY n'aura lieu qu'après une autorisation humaine séparée et explicite.
