# PHASE_70G_REPORT — LOT 6 — PRÉPARATION READ-ONLY

## Verdict

```
PHASE_70G_LOT6_READY_FOR_HUMAN_REVIEW
DATABASE_WRITES = 0
```

**Aucune écriture DB. Aucun DRY-RUN d'import. Aucun script d'APPLY créé.**

---

## 1. Ground truth live (ÉTAPE 3)

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
| `word_translations` FR validées | **627** | **627** |
| `word_lemma_mapping` (safe) | **188** | **188** |

- **Lots 1–5 présents** : 13 · 17 · 19 · 20 · 20 gloses (mappings comptés dans `word_lemma_mapping`)
- **HOLDs historiques absents** : أَعْلَمُ · كُنَّا · وَإِن → 0 `word_translation` FR validée, 0 mapping
- **Sourate 64** = 0 occurrence MASAQ (MASAQ_BLOCKED) · Fātiḥah et sourates protégées intactes
- **Aucune divergence** avec la baseline post-Lot 5

## 2. Sélection (ÉTAPE 5) — 20 candidats

Pool : **1 017 candidats** (catégorie C + P1 + non enseignés + MASAQ, hors 92 formes traitées Lots 1–5 + 3 HOLDs, après garde-fous live : 0 glose FR validée, 0 mapping safe).

Sélection déterministe stratifiée par famille (tri fréquence décroissante au sein de chaque famille) :

| Famille | Nb | Formes |
|---|---:|---|
| Verbes lexicaux (dont passif) | 4 | تُرْجَعُونَ (**IV_PASS**) · يُرِيدُ · كَذَّبُوا۟ · كُنتُم |
| Adjectifs | 3 | خَيْرُ (élatif) · نَذِيرٌۭ · أَشَدُّ (élatif) |
| Noms nus (dont nom propre) | 4 | بِـَٔايَـٰتِ · بِكُلِّ · بَنِىٓ · فِرْعَوْنُ (nom propre) |
| Noms définis | 2 | ٱلرَّحِيمُ (attribut divin) · ٱلْـَٔايَـٰتِ |
| Participes | 2 | صَـٰلِحًۭا · مُّبِينٍۢ |
| Lemma-résolvables → GLOSE | 2 | ٱلْيَوْمَ · ٱلْقَوْمِ |
| Clitique composé | 1 | عَلَيْكُمْ |
| Grammaticaux | 2 | وَلَقَدْ · وَلَوْ |

## 3. Propositions (ÉTAPE 8) — 20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT (12 HIGH / 8 MEDIUM)

| Forme | Famille | Occ. | POS MASAQ | Proposition | Confiance |
|---|---:|---|---|---|---|
| تُرْجَعُونَ | verbal | 19 | IV_PASS | « vous serez ramenés / vous serez reconduits » | MEDIUM |
| يُرِيدُ | verbal | 38 | IV | « Il veut / Il désire » | HIGH |
| كَذَّبُوا۟ | verbal | 37 | PV | « ils traitèrent de mensonge / ils démentirent » | HIGH |
| كُنتُم | verbal | 36 | PV | « vous étiez / vous fûtes » | MEDIUM |
| خَيْرُ | adj (élatif) | 20 | ADJ_COMP | « meilleur / le meilleur » | HIGH |
| نَذِيرٌۭ | adj | 20 | ADJ_QUALIT | « avertisseur / celui qui avertit » | HIGH |
| أَشَدُّ | adj (élatif) | 18 | ADJ_COMP | « plus fort / plus dur » | HIGH |
| بِـَٔايَـٰتِ | nom nu (composé) | 34 | PREP+NOUN | « par les versets / par les signes » | MEDIUM |
| بِكُلِّ | nom nu (composé) | 33 | PREP+NOUN | « par chaque / par tout » | MEDIUM |
| بَنِىٓ | nom nu | 31 | NOUN_CONCRETE | « fils / enfants » | HIGH |
| ٱلرَّحِيمُ | nom défini (attribut) | 28 | DET+NOUN_PROP | « le Très Miséricordieux » | HIGH |
| ٱلْـَٔايَـٰتِ | nom défini | 25 | DET+NOUN | « les versets / les signes » | HIGH |
| صَـٰلِحًۭا | participe | 29 | NOUN_ACTIVE_PART | « bonne / vertueuse (œuvre) » | MEDIUM |
| مُّبِينٍۢ | participe | 25 | NOUN_ACTIVE_PART | « clair / évident » | HIGH |
| ٱلْيَوْمَ | lemma-résolvable | 33 | DET+ADV | « ce jour-là / aujourd'hui » | MEDIUM |
| ٱلْقَوْمِ | lemma-résolvable | 30 | DET+NOUN | « le peuple / les gens » | MEDIUM |
| عَلَيْكُمْ | clitique composé | 107 | PREP+POSS_PRON | « sur vous / à votre charge » | MEDIUM |
| وَلَقَدْ | grammatical | 115 | CONJ+PREP+CERT | « et certes / et vraiment » | MEDIUM |
| فِرْعَوْنُ | nom propre | 17 | NOUN_PROP_FOREIGN | « Pharaon » | HIGH |
| وَلَوْ | grammatical | 103 | CONJ+CONDITION | « et si / même si » | MEDIUM |

### Décisions méthodologiques clés (vérifiées en live)

- **Mappings refusés (7)** : بِـَٔايَـٰتِ · بِكُلِّ (perte de بِـ) · ٱلْيَوْمَ (perte de la deixis temporelle) · ٱلْقَوْمِ (perte de l'article) · عَلَيْكُمْ (perte du pronom) · وَلَقَدْ · وَلَوْ (perte de la conjonction) — précédents validés Lots 2–5 (عَلَيْهِ, تَحْتِهَا, لِلنَّاسِ, وَهُمْ, وَإِذَا…).
- **Participations (2)** : صَـٰلِحًۭا, مُّبِينٍۢ — participe nominal ≠ lemme verbal.
- **Passif (1)** : تُرْجَعُونَ — IV_PASS 9/9 homogène, voix conservée.
- **Élatifs vérifiés (2)** : خَيْرُ (5/5 ADJ_COMP), أَشَدُّ (7/7 ADJ_COMP) — **aucune lecture verbale** (différence décisive avec أَعْلَمُ, HOLD).
- **Formes sœurs ×8 vérifiées** (word_id distincts, aucune fusion) : كُنتُم (≠ كُنتُمْ mappée Lot 1 · ≠ كُنَّا HOLD) · خَيْرُ (≠ خَيْرٌۭ/خَيْرًۭا) · ٱلرَّحِيمُ (≠ ٱلرَّحِيمِ glosée) · بِـَٔايَـٰتِ/ٱلْـَٔايَـٰتِ · مُّبِينٍۢ (≠ مُّبِينٌۭ Lot 4) · فِرْعَوْنُ (≠ فِرْعَوْنَ Lot 3) · بِكُلِّ (≠ كُلَّ/كُلُّ Lot 2) · عَلَيْكُمْ (≠ عَلَىٰ/عَلَى) · وَلَقَدْ (≠ لَقَدْ) · وَلَوْ (≠ لَوْ).
- **Homographes écartés** : وَلَوْ (27/27 CONJ,CONDITION_PART — aucun doublet إِنْ/إِنَّ) · كُنتُم (10/10 PV, pas de كَان حرف) — aucun HOLD nécessaire (aucune ambiguïté réelle démontrée).

## 4. Cas sensibles (ÉTAPE 9) — revue humaine ciblée recommandée

- **كُنتُم** — forme faible (كان) : cohérence avec le mapping safe de كُنتُمْ (Lot 1) et l'exclusion de كُنَّا (HOLD)
- **خَيْرُ / أَشَدُّ** — élatifs : homographie verbale écartée occurrence-par-occurrence
- **Constructions composées ×7** (mapping refusé) : بِـَٔايَـٰتِ, بِكُلِّ, ٱلْقَوْمِ, ٱلْيَوْمَ, عَلَيْكُمْ, وَلَقَدْ, وَلَوْ
- **تُرْجَعُونَ** — passif
- **صَـٰلِحًۭا / مُّبِينٍۢ** — participes
- **فِرْعَوْنُ / ٱلرَّحِيمُ** — formes sœurs de gloses déjà validées

## 5. Tests (ÉTAPE 10)

`tmp/phase70g/tests.json` — **20 PASS / 0 FAIL / 1 INFO** :

- périmètre 20/20 · unicité word_id + formes · word_id réels dans `quran_words` · formes conformes NFC
- formes non-NFC documentées (clé = word_id, aucune normalisation artificielle)
- HOLDs absents · 0 glose FR existante · 0 mapping safe existant · 0 MOVE_TO_LEMMA · 20 GLOSE
- diversité familles ≥ 8 · lemma_match uniquement sur familles LEMMA_RESOLVABLE · glosses non vides · confiances valides

## 6. Non-régression

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | PASS |
| `eslint .` | PASS |
| `vitest run` | **775/775 PASS** |
| `npm run build` | PASS |

## 7. HOLDs historiques — OUT OF LOT 6

| Forme | Raison | État |
|---|---|---|
| أَعْلَمُ | homographe élatif / forme verbale | absent (0 wt, 0 mapping) |
| كُنَّا | mapping différé (lettres faibles) | absent (0 wt, 0 mapping) |
| وَإِن | homographie إِنْ / إِنَّ, rasm normalisé | absent (0 wt, 0 mapping) |

## 8. Garanties

- `DATABASE_WRITES = 0` — aucun script d'écriture, aucun INSERT/UPDATE/DELETE
- Tables non touchées : `word_translations`, `word_lemma_mapping`, `lemmas`, `lemma_translations`, `translations`, `quran_words`, `word_occurrences`, `linguistic_occurrences`, `linguistic_segments`, MASAQ, curriculum, progression
- Fātiḥah et pilotes protégés intacts · aucun commit, aucun push

## 9. Artefacts

`tmp/phase70g/ground-truth.json` · `lot6-candidates.json` · `lot6-evidence.json` · `analyst-view.json` · `targeted-checks.json` · `lot6-proposals.json` · `tests.json` · scripts READ-ONLY `tmp/phase70g-*.ts` · `PHASE_70G_REPORT.md`

---

## 4bis. REVUE CIBLÉE DES 12 CAS SENSIBLES (décision humaine : revue ciblée avant DRY-RUN)

Analyse occurrence-par-occurrence sur données live (`tmp/phase70g/targeted-data.json` : toutes occurrences + POS MASAQ par occurrence + 4 traductions alignées).

### Verdict — 11 ACCEPT · 1 MODIFY · 0 HOLD · 0 REJECT (4 HIGH / 8 MEDIUM sur les 12 ciblés)

| Forme | Occ. | POS MASAQ (couvert) | Décision | Confiance | Analyse clé |
|---|---:|---|---|---|---|
| تُرْجَعُونَ | 19 | IV_PASS 9/19 | **ACCEPT** | MEDIUM | 19/19 passif « vous serez ramenés » — voix conservée |
| كُنتُم | 36 | PV 10/36 | **ACCEPT** | MEDIUM | 36/36 « vous étiez » — sœur كُنتُمْ mappée, كُنَّا HOLD hors périmètre |
| خَيْرُ | 20 | ADJ_COMP 5/20 | **ACCEPT** | HIGH | 20/20 élatif « meilleur » — 0 lecture verbale |
| أَشَدُّ | 18 | ADJ_COMP 7/18 | **ACCEPT** | HIGH | 18/18 élatif « plus fort / plus dur » — 0 lecture verbale |
| بِـَٔايَـٰتِ | 34 | PREP+NOUN 9/34 | **ACCEPT** | MEDIUM | 34/34 بِـ rendue — mapping perdrait بِـ |
| بِكُلِّ | 33 | PREP+NOUN 8/33 | **ACCEPT** | MEDIUM | 33/33 بِـ rendue — mapping perdrait بِـ |
| صَـٰلِحًۭا | 29 | NOUN_ACTIVE_PART 7/29 | **MODIFY** | MEDIUM | 29/29 « bonne / vertueuse » — « (œuvre) » retiré (précédent جَنَّـٰتٍۢ) |
| ٱلْيَوْمَ | 33 | DET+ADV 11/33 | **ACCEPT** | MEDIUM | Deux faces du même noyau « ce jour-là / aujourd'hui » |
| ٱلْقَوْمِ | 30 | DET+NOUN 6/30 | **ACCEPT** | MEDIUM | 30/30 « le peuple » — mapping perdrait l'article |
| عَلَيْكُمْ | 107 | PREP+POSS_PRON 16/107 | **ACCEPT** | MEDIUM | 107/107 « sur vous » — mapping perdrait le pronom |
| وَلَقَدْ | 115 | CONJ+PREP+CERT 32/115 | **ACCEPT** | MEDIUM | 115/115 « et certes » — mapping perdrait la conjonction |
| وَلَوْ | 103 | CONJ+CONDITION 27/103 | **ACCEPT** | MEDIUM | 103/103 « et si / même si » — aucune homographie |

### Décisions clés

- **صَـٰلِحًۭا — MODIFY** : glose réduite à « bonne / vertueuse » (l'explicitation « (œuvre) » est contextuelle, non portée par le lexème — précédent جَنَّـٰتٍۢ Lot 5).
- **Homographes écartés (0 HOLD)** : وَلَوْ (27/27 CONJ,CONDITION_PART), كُنتُم (10/10 PV), خَيْرُ/أَشَدُّ (ADJ_COMP, 0 lecture verbale — différence décisive avec أَعْلَمُ).
- **Mappings refusés confirmés (7)** : بِـَٔايَـٰتِ · بِكُلِّ · ٱلْيَوْمَ · ٱلْقَوْمِ · عَلَيْكُمْ · وَلَقَدْ · وَلَوْ — perte de préposition/article/pronom/conjonction/deixis.
- **Les 8 autres candidats vérifiés** (HIGH, inchangés) : يُرِيدُ · كَذَّبُوا۟ · نَذِيرٌۭ · بَنِىٓ · ٱلرَّحِيمُ · ٱلْـَٔايَـٰتِ · مُّبِينٍۢ · فِرْعَوْنُ.

### Périmètre du Lot 6 après revue ciblée

**20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT · 1 MODIFY** (صَـٰلِحًۭا « bonne / vertueuse ») · **13 HIGH / 7 MEDIUM** — `word_translations` +20 potentielles, 0 mapping.

---

## HUMAN GATE — PHASE 70G / LOT 6 — REVUE CIBLÉE TERMINÉE

### A. Verdict des 12 cas ciblés

**11 ACCEPT · 1 MODIFY · 0 HOLD · 0 REJECT** — détail dans `lot6-targeted-review.json` et section 4bis.

### B. Périmètre révisé du Lot 6

**20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT · 1 MODIFY** (صَـٰلِحًۭا « bonne / vertueuse ») · **13 HIGH / 7 MEDIUM** → 20 `word_translations` potentielles, 0 mapping.

### C. Ground truth DB (reconfirmé)

`627` FR validées · `188` mappings safe · MASAQ `22 485`/`44 677` · `24 944` translations · `21 296` quran_words · `77 430` occurrences · `32` lemmas · `28` lemma_translations FR validées · Lots 1–5 présents · HOLDs absents · sourate 64 = 0.

### D. Non-régression

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **20 PASS / 0 FAIL / 1 INFO** (ré-exécutés).

### E. Décision demandée

**DATABASE_WRITES = 0** · aucun DRY-RUN lancé. Décisions possibles : **ACCEPT globalement le périmètre révisé · MODIFIER certaines gloses · placer des cas en HOLD · REJETER certains candidats · seconde revue ciblée**. Le DRY-RUN ne commencera qu'après votre décision explicite.

---

## 5bis. DRY-RUN (autorisation : DRY-RUN d'import des 20 word_translations)

Décision humaine : **20 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD supplémentaire · 0 REJECT · MODIFY صَـٰلِحًۭا → « bonne / vertueuse »**.

`tmp/phase70g/lot6-review-decisions.json` (20 gloses + 3 HOLD exclus) · `tmp/phase70g-lot6-import.ts` (DRY-RUN par défaut, APPLY verrouillé par `APPLY=1`).

### Résultat DRY-RUN — tous contrôles PASS

| Table | Plan |
|---|---|
| `word_translations` (fr, `is_validated=true`) | **20 INSERT** · 0 ALREADY_EXISTS · 0 DIVERGENCE · 0 COLLISION |
| `word_lemma_mapping` / `lemma_translations` / `lemmas` | **0 / 0 / 0** |
| Exclus (HOLD vérifiés absents) | أَعْلَمُ · كُنَّا · وَإِن |

- **Identité** : 20 word_id réels + 3 HOLD vérifiés dans `quran_words` (23/23) · 0 word_id inventé · 0 candidat hors périmètre
- **Unicode** : 23/23 match `normalize(NFC)` (0 MISMATCH) · 8 formes avec combinaisons de diacritiques documentées (كَذَّبُوا۟, أَشَدُّ, بِـَٔايَـٰتِ, بِكُلِّ, ٱلرَّحِيمُ, ٱلْـَٔايَـٰتِ, مُّبِينٍۢ, كُنَّا-HOLD) — **aucune normalisation artificielle**, clé = word_id
- **MODIFY confirmé** : صَـٰلِحًۭا → « bonne / vertueuse » (sans « œuvre »)
- **Écrasement** : aucune ligne existante sur ces formes → aucun risque
- **Idempotence** : 20 INSERT (0 ALREADY_EXISTS) — `UNIQUE(word_id, language, source_id)`
- **Provenance** : « Hikma — lexique éditorial » existante ✅ · `is_validated=true` uniquement sur les 20 ACCEPT
- **Tables interdites** : le script n'écrit que dans `word_translations`

### Baseline DB (avant import, live)

`word_translations` FR validées **627** · `word_lemma_mapping` **188** · `linguistic_occurrences` **22 485** · `linguistic_segments` **44 677** · `translations` **24 944** · `quran_words` **21 296** · `word_occurrences` **77 430** · `lemmas` **32** · `lemma_translations` **32** (28 FR validées)

### Non-régression

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **20 PASS / 0 FAIL / 1 INFO**

---

## HUMAN GATE — PHASE 70G / LOT 6 — DRY-RUN VERT

**DATABASE_WRITES = 0** — aucune écriture effectuée. Verdict : `PHASE_70G_LOT6_DRY_RUN_READY`.

**Autorisez-vous l'APPLY réel des 20 `word_translations` du Lot 6 ?** L'APPLY n'aura lieu qu'après une autorisation humaine séparée et explicite.
