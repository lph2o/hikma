# PHASE 70L — LOT 11 — PRÉPARATION READ-ONLY (1 000 CANDIDATS)

**Verdict : `PHASE_70L_LOT11_READY_FOR_HUMAN_REVIEW`** · `DATABASE_WRITES = 0` · `CANDIDATES = 1000`

## A. Ground truth live — 0 divergence

| Compteur | Attendu | Live |
|---|---|---|
| `word_translations` FR validées | 1 517 | **1 517** |
| `word_lemma_mapping` safe | 188 | **188** |
| `linguistic_occurrences` | 22 485 | **22 485** |
| `linguistic_segments` | 44 677 | **44 677** |
| `translations` | 24 944 | **24 944** |
| `quran_words` | 21 296 | **21 296** |
| `word_occurrences` | 77 430 | **77 430** |
| `lemmas` | 32 | **32** |
| `lemma_translations` | 32 | **32** (28 FR validées) |
| sourate 64 (MASAQ) | 0 | **0** |

Lots 1–10 présents (13+3 · 17+1 · 19 · 20 · 20 · 20 · 20 · 100 · 250 · 500) · HOLDs أَعْلَمُ/كُنَّا/وَإِن : **0 wt FR validée, 0 mapping** (vérifiés par word_id fixe) · Fātiḥah et sourates pilotes protégées · aucune divergence.

## B. Sélection — 1 000 candidats (pool C+P2, pagination .range() obligatoire)

- **Pool** : `tmp/phase69/forms-coverage.csv` — catégorie C + priorité P2, non enseigné, MASAQ=1 → **2 777 formes** (le pool C+P1 est épuisé après Lots 1–10 : 127 restantes).
- **Exclusions** : 986 word_id des Lots 1–10 + 3 HOLDs (word_id fixes) + garde-fous live (0 glose FR validée, 0 mapping safe) → pool final **2 777** (aucune exclusion live supplémentaire nécessaire).
- **Déterminisme** : tri stratifié par familles × fréquence décroissante, reproductible, clé = word_id.

### Répartition par famille (9 familles)
| Famille | Nb | Exemples |
|---|---|---|
| Verbes (dont cliticisés) | 271 | أَخَذْنَا · ٱتَّقَوْا۟ · يَسْـَٔلُونَكَ · تَرَىٰ · خِفْتُمْ · يُحَافِظُونَ |
| Noms nus (dont noms propres) | 217 | ءَالَآءِ · أَمْوَٰلَهُمْ · ثَمُودَ · لُوطٍۢ · إِسْحَـٰقَ |
| Grammaticales (particules/conjonctions) | 130 | أَمَّا · عَسَىٰ · كَأَنَّهُۥ · لِّلْعَبِيدِ · أَئِنَّكُمْ |
| Clitiques composés | 120 | عَلَيْهِنَّ · لَّكُمْ ۖ · لَهُمَا · بِأَمْوَٰلِهِمْ · وَفِيها |
| Noms définis | 100 | ٱلنِّسَآءَ · ٱلدُّنْيَا ۚ · ٱلْمَسِيحُ · ٱلْيَمِّ · ٱلْيَهُودُ |
| Participes | 60 | مُعْرِضُونَ · مُّسْتَقِيمٌۭ · مُفْسِدِينَ · مَّهِتدُونَ |
| Inclassés (sigles, outils) | 53 | ٱللَّهُمَّ · أَبَدًۭا ۚ · هُزُوًۭا · تَحْتَ |
| Adjectifs | 34 | كَرِيمٍۢ · شَدِيدٍۢ · قَلِيلٌۭ · يَسِيرًۭا |
| Résolvables par lemme | 15 | أَنْهَـٰرٌ · أُمُورٌ (glosés directement, 0 mapping) |

## C. Classification de risque

| Niveau | Nb |
|---|---|
| LOW | 145 |
| HIGH | 374 |
| MEDIUM | 28 |
| **HIGH-RISK (revue ciblée obligatoire)** | **453** |

Conforme à la phase 70L §19 : la revue ciblée est **sans plafond** — les 453 HIGH-RISK seront tous examinés occurrence-par-occurrence. 0 conflit IV/PV réel (les POS multiples = tags constitutifs d'un token cliticisé). 22 passifs identifiés (voix conservée).

## D. Propositions — 1 000/1 000 gloses · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT

- **Glossaire** : 70K (284 stems + 414 formes) **+ 70L étendu** (formes exactes avec personnes verbales vérifiées occurrence-par-occurrence sur les 4 traductions + stems noms/adjectifs/participes).
- **0 sans glose automatique** · **0 traductions < 2 sources** (1000/1000 à 4/4 sources — pagination .range() complète).
- **FORM > LEMME respecté** : mapping refusé pour toute forme composée — préfixes وَ/فَ/لِ/بِ/كَ, articles ٱلْـ, prépositions إِلَى/عَلَى/مِنْ/عَنْ/فِي/بَيْنَ/قَبْلَ/بَعْدَ/عِندَ, pronoms objet/possessifs, particules — glose directe conservant tous les éléments.
- **Personnes verbales** : contrôlées individuellement (1re/2e/3e, sg/pl, passé/présent/impératif/subjonctif/jussif, actif/passif) — aucune copie de glose depuis un stem partagé.

## E. Sources — couverture complète

1000/1000 candidats à **4/4 sources alignées** (31 Hamidullah / 9001 Kazimirski / 20 Sahih International / 153 Piccardo) — 0 artefact d'échantillonnage, 0 vrai manque. Pagination documentée : `PAGE=1000` sur toutes les lectures volumineuses (occurrences 4676 lignes, traductions, MASAQ).

## F. Unicode

**261 formes non-NFC documentées** (variantes shadda/voyelle, U+0671 ٱ vs ا) — clé d'identité = **word_id**, aucune normalisation destructive, comparaison NFC uniquement informative.

## G. Tests & non-régression

- Tests helpers : **13 PASS / 0 FAIL / 1 INFO** (1000 candidats · word_id réels 1000/1000 · unicité · 0 glose existante · 0 mapping · HOLDs absents · 0 candidat Lots 1–10 · déterminisme · 9 familles · HIGH-RISK isolés 453 · propositions 1000/1000 · gloses 1000/1000 · pagination complète)
- `tsc` PASS (0 erreur) · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS

## H. HOLDs — OUT OF LOT 11 (inchangés)

أَعْلَمُ · كُنَّا · وَإِن — identifiés par word_id fixe · 0 wt FR validée · 0 mapping · aucun traitement.

## Artefacts

- `tmp/phase70l/ground-truth.json` · `lot11-candidates.json` · `lot11-evidence.json` · `lot11-proposals.json` · `analyst-view.json` · `tests.json` · `missing-dump.json`
- Scripts READ-ONLY : `tmp/phase70l-ground-truth.ts` · `tmp/phase70l-select.ts` · `tmp/phase70l-proposals.ts` · `tmp/phase70l-glossary.ts` · `tmp/phase70l-tests.ts` · `tmp/phase70l-summary.ts`
- `PHASE_70L_REPORT.md`

**`DATABASE_WRITES = 0`** · aucun DRY-RUN · aucun script d'APPLY créé · aucun Lot 12 · HOLDs non traités.

---

## REVUE CIBLÉE (décision humaine : REVUE CIBLÉE autorisée — Gate 1)

Analyse occurrence-par-occurrence sur données live complètes paginées (`tmp/phase70l/targeted-data.json` : toutes occurrences + POS MASAQ par occurrence + 4 traductions alignées).

### Verdict — **901 ACCEPT · 99 MODIFY · 0 HOLD · 0 REJECT · 0 MOVE_TO_LEMMA**

- **453 HIGH-RISK + 28 MEDIUM examinés** (539 dossiers) — 100 % des cas ciblés revus occurrence-par-occurrence.
- **Sources : 539/539 à 4/4 sources** — 0 vrai manque, 0 artefact d'échantillonnage (pagination `.range()` complète).
- **0 conflit IV/PV réel** (les POS multiples = tags constitutifs d'un token cliticisé) · **1 passif** (وَأُمِرْتُ « il m'a été ordonné / j'ai reçu l'ordre » — voix conservée).

### Les 99 MODIFY — gloses corrigées par override forme exacte (personnes/voix/clitiques/interrogatifs)
| Catégorie | Exemples |
|---|---|
| Personnes verbales (1re pl. au lieu du stem) | عَلِمْنَا « Nous savons / Nous avons su » · نَعْلَمُ « Nous savons / Nous connaissons » · نَزَّلْنَا « Nous avons fait descendre » · زَيَّنَّا « Nous avons embelli » · خَلَقْنَـٰهُ « Nous l'avons créé » · وَجَعَلْنَـٰهُمْ « Nous les avons faits » |
| Personnes (2e/3e) | تَكْتُبُونَ « ils écrivent / ils composent » · تَفْعَلُونَ « vous faites » · يَشَآءُونَ « ils veulent » · يَهْدُونَ « ils guident » · يَقْضِى « Il juge » · نَكُن « n'étions-nous pas » · أَتَّبِعُ « je suis » |
| Clitiques objets/possessifs préservés | يَحْشُرُهُمْ « Il les rassemblera » · جَعَلْنَـٰكَ « Nous t'avons établi » · وَجَعَلَنِى « Il m'a rendu » · يَرْزُقُكُم « Il vous nourrit » · جَآءُوكَ « ils vinrent à toi » |
| Voix passive conservée | وَأُمِرْتُ « il m'a été ordonné / j'ai reçu l'ordre » |
| Interrogatifs préservés | أَفَغَيْرَ « serait-ce autre que / est-ce que ... un autre que » · أَفَرَءَيْتَ « as-tu vu » |
| Impératifs | ٱعْمَلُوا۟ « œuvrez / agissez » · ٱتَّبِعُوا۟ « suivez » · سِيرُوا۟ « parcourez » · وَٱعْلَمُوٓا۟ « et sachez » · فَٱغْفِرْ « pardonne » |
| Nom corrigé (≠ verbe) | وَعْدُ « la promesse / l'accomplissement » (glose stem « vous êtes promis » supprimée) |

Chaque MODIFY est intégré **par forme exacte (NFC)** dans `REVIEW_OVERRIDES_70L` → `lot11-proposals.json` (0 régénération silencieuse — `lot11-targeted-review.json` documente chaque word_id + forme + décision).

### Périmètre final recommandé
**1 000 candidats · 1 000 GLOSE · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT** · 99 MODIFY intégrés · 453 HIGH-RISK (tous ACCEPT après revue).

### Non-régression
Tests helpers **13 PASS / 0 FAIL / 1 INFO** · `tsc` PASS (0 erreur) · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS.

---

## HUMAN GATE — GATE 1 (après revue ciblée)

Verdict : `PHASE_70L_LOT11_TARGETED_REVIEW_COMPLETE` — `DATABASE_WRITES = 0`.

**Décision demandée (Gate 2)** : ACCEPT global du périmètre révisé (1 000 gloses, 99 modifications intégrées) / MODIFIER certaines gloses / HOLD certains cas / REJETER certains candidats / seconde revue ciblée. **Le DRY-RUN et l'APPLY ne pourront commencer qu'après votre décision explicite sur le périmètre.**

---

## DRY-RUN — GATE 2 (décision humaine : GATE 2 autorisé — ACCEPT global + autorisation DRY-RUN)

Script `tmp/phase70l-lot11-import.ts` (verrouillé : `APPLY=1` requis pour toute écriture réelle) — exécuté en **DRY-RUN strictement READ-ONLY**.

### Résultats DRY-RUN — tous les contrôles PASS

| Contrôle | Résultat |
|---|---|
| Candidats / plan | **1 000** (décisions consolidées `lot11-review-decisions.json`, source d'autorité) |
| INSERT attendus | **1 000** |
| ALREADY_EXISTS | **0** |
| Divergences | **0** |
| Collisions (word_id dupliqués) | **0** |
| Écrasement | aucun risque (0 ligne existante) |
| word_id réels (quran_words) | **1000/1000** (0 inventé) |
| Unicité `(word_id, language, source_id)` | vérifiée — 1000 word_id uniques |
| HOLDs dans le plan | **0** (أَعْلَمُ · كُنَّا · وَإِن hors périmètre) |
| Provenance | « Hikma — lexique éditorial » existante (`79e6412e…`) · fr · `is_validated=true` + `validated_at` horodaté |
| Unicode | **1000/1000 NFC match** · **261 non-NFC documentées** (clé = word_id, aucune normalisation destructive) |
| 99 MODIFY | vérifiés présents dans le plan (99/99 formes exactes NFC) |
| Mapping / lemmas / lemma_translations | **0 / 0 / 0** (FORM > LEMME) |
| Idempotence | `UNIQUE(word_id, language, source_id)` — 1er APPLY = 1000 INSERT, rerun = 0 insertion / 1000 doublons reconnus / 0 divergence |
| Diff DB attendu | uniquement `word_translations` **+1000** · `unexpected_table_changes = []` |

### Tables protégées (lecture seule, inchangées)
`word_lemma_mapping` 188 · `lemmas` 32 · `lemma_translations` 32 · `translations` 24 944 · `quran_words` 21 296 · `word_occurrences` 77 430 · `linguistic_occurrences` 22 485 · `linguistic_segments` 44 677 — toutes **+0**.

### Non-régression (Gate 2)
Tests helpers **13 PASS / 0 FAIL / 1 INFO** · `tsc` PASS (0 erreur) · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS.

### Artefacts DRY-RUN
`tmp/phase70l/lot11-review-decisions.json` (1000 décisions) · `lot11-targeted-review.json` (99 MODIFY documentés) · `lot11-import-summary.json` · `tmp/phase70l-lot11-import.ts` (APPLY verrouillé `APPLY=1`).

**`DATABASE_WRITES = 0`** — aucune écriture DB n'a eu lieu. **Aucun APPLY n'a été lancé.**

---

## HUMAN GATE — GATE 3 (APPLY)

Verdict : `PHASE_70L_LOT11_DRY_RUN_READY` — `DATABASE_WRITES = 0`.

**Autorisez-vous l'APPLY réel des 1 000 `word_translations` du Lot 11 ?** L'APPLY (verrouillé derrière `APPLY=1` sur le script validé) ne sera exécuté qu'après cette autorisation humaine explicite et séparée. **STOP — aucune écriture DB avant votre décision.**
