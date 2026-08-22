# PHASE 70P — LOT 14 — PRÉPARATION READ-ONLY STRICTE (GATE 1)

Préparation du **Lot 14** (pool C+P1, 127 candidats) en **100 % READ-ONLY**. Aucune écriture DB,
aucun DRY-RUN, aucun APPLY, aucun commit, aucun push. Toutes les valeurs proviennent de lectures
live paginées (`selectAllPages` / `.range()` / `count head:true`).

---

## 1. Baseline live — 0 divergence

| # | Élément | Attendu | Live | Statut |
|---:|---|---:|---:|---|
| 1 | word_translations FR validées | 4294 | **4294** | PASS |
| 2 | word_lemma_mapping | 188 | **188** | PASS |
| 3 | lemmas | 32 | **32** | PASS |
| 4 | lemma_translations | 32 | **32** | PASS |
| 5 | lemma_translations FR validées | 28 | **28** | PASS |
| 6 | translations | 24944 | **24944** | PASS |
| 7 | quran_words | 21296 | **21296** | PASS |
| 8 | word_occurrences | 77430 | **77430** | PASS |
| 9 | MASAQ linguistic_occurrences | 22485 | **22485** | PASS |
| 10 | MASAQ linguistic_segments | 44677 | **44677** | PASS |

`GROUND_TRUTH_DIVERGENCE = false` — aucun STOP déclenché.

## 2. Pool C+P1 vérifié

| Pool | Attendu | Live | Statut |
|---|---:|---:|---|
| C+P1 restant | 127 | **127** | PASS |
| C+P2 restant | 0 (épuisé) | **0** | PASS |
| C+P3 restant | 4235 | **4235** | PASS |

Le Lot 14 utilise **C+P1 ONLY** : 127 formes éligibles, aucune C+P2, aucune C+P3, aucun HOLD,
aucun candidat déjà traité.

## 3. Candidats sélectionnés (127/127, déterministe)

- Sélection : catégorie C (MASAQ sans glose FR, sans résolution par lemme) ∩ P1 (impact
  `surahs×10 + occurrences ≥ 60`), sans FR validé, sans mapping safe, **hors Lots 1–13 (word_id)**
  et **3 HOLDs**, **hors zones protégées** (1, 64, 108, 112, 113, 114).
- Tri déterministe : occurrences décroissantes, puis sourates décroissantes, puis `word_id`.
- Identifiants d'autorité : **word_id** (jamais la forme arabe seule comme clé).
- Résultats : **127 candidats · 0 doublon · 0 collision · 0 HOLD · 0 zone protégée**.

Familles :

| Famille | Nombre |
|---|---:|
| GRAMMATICAL | 59 |
| COMPOSED_CLITIC | 45 |
| LEMMA_RESOLVABLE | 10 |
| VERBAL_LEXICAL | 10 |
| BARE_NOUN | 2 |
| ADJECTIVE | 1 |
| **Total** | **127** |

## 4. Exclusion Lots 1–13

Liste d'exclusion construite depuis les données réelles (`word_id` des candidats Lots 1–13 +
HOLDs) : **3763** word_id exclus.

| Contrôle | Attendu | Résultat |
|---|---:|---|
| already_treated | 0 | **0** (0 glose FR validée sur les candidats) |
| collision (Lots 1–13) | 0 | **0** |

## 5. HOLDs — protection absolue

| Forme | word_id | wt FR validée | mapping safe |
|---|---|---:|---:|
| أَعْلَمُ | 0803c6da-… | **0** | **0** |
| كُنَّا | b6d6520c-… | **0** | **0** |
| وَإِن | 52011330-… | **0** | **0** |

`holds_in_plan = 0` — les 3 HOLDs sont intacts et totalement hors périmètre.

## 6. Zones protégées

| Zone | Valeur | Statut |
|---|---:|---|
| Sourate 1 (Fātiḥah) MASAQ | 29 | PASS |
| Pilote 108 | 10 | PASS |
| Pilote 112 | 15 | PASS |
| Pilote 113 | 23 | PASS |
| Pilote 114 | 20 | PASS |
| Sourate 64 MASAQ | 0 | PASS |

`protected_surahs_hits = []` — aucun candidat du Lot 14 n'a d'occurrence en 1/108/112/113/114
(exclusion absolue). Sourate 64 : MASAQ = 0, aucun changement introduit.

## 7. Occurrences — pagination complète

- Toutes les occurrences des 127 candidats récupérées par `.range()` paginé jusqu'à épuisement
  (PostgREST plafonne à 1000/cap ; jamais un simple `.range(0,999)`).
- **983 occurrences** chargées, **aucune troncature silencieuse**.
- `occurrences_retrieved = occurrences_available` pour **127/127** (vérifié dans les tests).

Pour chaque occurrence conservées : word_id, forme arabe, sourate, ayah, position, texte
d'occurrence, ayah arabe, POS MASAQ, stem, gloss EN MASAQ, case_mood, syntactic_roles.

## 8. Sources documentaires

4 sources officielles Hikma, récupérées par ayah (aucune source créée, aucune traduction
modifiée) :

- FR Hamidullah — resource_id **31**
- FR Kazimirski — resource_id **9001**
- EN Sahih International — resource_id **20**
- IT Hamza Roberto Piccardo — resource_id **153**

| Couverture | Nombre |
|---|---:|
| 4/4 | **127/127** |
| 508/508 contextes analysés avec 4 sources | PASS |

Aucun manque documentaire réel ; aucun artefact de pagination.

## 9. Propositions de gloses (127/127)

Méthodologie : glossaire éditorial Hikma **70P** (formes exactes par `word_id[:8]`), formes
vérifiées occurrence-par-occurrence sur les 4 traductions. **FORM > LEMME** — aucune réduction
automatique au lemme, clitiques/préfixes/possessifs conservés.

| Contrôle | Résultat |
|---|---:|
| Gloses | **127/127** |
| Glose vide | **0** |
| Glose inventée sans justification | **0** |
| MOVE_TO_LEMMA | **0** |
| HOLD | **0** |
| REJECT | **0** |

Par candidat conservés : word_id, forme, glose proposée, POS, source evidence (contextes +
traductions), occurrences_count, risk, reasoning/note.

## 10. Classification des risques

| Risque | Nombre |
|---|---:|
| HIGH-RISK (revue ciblée requise) | **127** |

Justification : ce pool C+P1 est dominé par les formes **grammaticales** (59) et **clitiques
composés** (45) — particules, préfixes, pronoms suffixes, annulatives. Conformément aux règles
Hikma (ne jamais diminuer artificiellement un risque), toutes les formes de ce lot sont classées
HIGH-RISK et nécessitent une **revue ciblée humaine** avant toute décision. Aucun quota.

## 11. Contrôles éditoriaux préparatoires

| Contrôle | Résultat |
|---|---:|
| Verbes (formes verbales) | **31** |
| Passifs | **0** |
| Clitiques / suffixes pronominaux (objet / possessif) | **34** |
| Dont possessifs | **21** |
| Formes composées (préfixe + pronom/relatif/particule) | **52** |
| Noms traités comme verbes (POS cohérent) | 0 anomalie |
| Verbe traité comme nom | 0 anomalie |
| Participe mal interprété | 0 anomalie |
| Personnes/nombres/voix vérifiées occurrence-par-occurrence | 127/127 |

Exemples de gloses avec personne/clitique conservés :

- `وَءَاتَيْنَـٰهُ` → « et Nous lui donnâmes / Nous lui accordâmes » (1re pl. + objet 3e sg.)
- `فَأَخَذَتْهُمُ` → « le saisit / s'empara d'eux » (3e f. sg. + objet 3e pl.)
- `فَأَخَذَهُمُ` → « alors les saisit / le châtiment les atteignit » (3e m. sg. + objet 3e pl.)
- `فَإِنَّا` → « Nous avons certes / car Nous » (1re pl.)
- `سُبْحَـٰنَكَ` → « gloire à Toi » vs `سُبْحَـٰنَهُۥ` → « gloire à Lui » (possessif 2e sg. vs 3e sg.)

## 12. Unicode

| Contrôle | Résultat |
|---|---:|
| Formes non-NFC parmi les 127 | **49** (documentées, clé = word_id, aucune normalisation destructive) |
| Doublons visuels (clés word_id distinctes, forme Unicode équivalente) | 0 (chaque word_id unique) |
| Normalisation NFC | utilisée uniquement pour comparaison, jamais destructivement |

## 13. Tests

| Outil | Résultat |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| `npx eslint .` | **PASS** |
| `npx vitest run` | **PASS 775/775** |
| `npm run build` | **PASS** |

Tests du périmètre Lot 14 (`tmp/phase70p/tests.json`) : **15 PASS / 0 FAIL / 1 INFO** —
127 candidats, word_id réels 127/127, 0 doublon, 0 glose FR existante, 0 mapping safe,
HOLDs absents, 0 candidat Lots 1–13, 0 zone protégée, 6 familles, propositions 127/127,
gloses 127/127, MOVE_TO_LEMMA = 0, pagination complète, sources 4/4 (127/127), 0 glose vide.
INFO : 49 formes non-NFC documentées.

## 14. Sécurité — aucune écriture

- Scripts : uniquement `.select()`, `.eq()`, `.in()`, `.order()`, `.range()`, `count`, `head:true`,
  `selectAllPages`, lectures de fichiers, génération d'artefacts locaux.
- **Aucun** `insert` / `upsert` / `update` / `delete` / `rpc` à effet d'écriture / migration.
- `APPLY` non utilisé ; aucun script d'import exécutable créé.
- Aucun commit, aucun push.

## 15. Contrôle final

```text
C+P1 attendu = 127
C+P1 sélectionné = 127

déjà traité = 0
collision = 0
HOLD dans plan = 0
zones protégées = 0

gloses = 127/127
glose vide = 0

MOVE_TO_LEMMA = 0
REJECT = 0
HOLD = 0

sources = 4/4 (127/127)
pagination = complète

word_translations avant = 4294
word_translations après théorique = 4421   (4294 + 127 — AUCUNE écriture effectuée)

mapping = 188
lemmas = 32
lemma_translations = 32
translations = 24944
quran_words = 21296
word_occurrences = 77430
MASAQ occurrences = 22485
MASAQ segments = 44677
sourate 64 = 0
```

## 16. Conditions de STOP — non déclenchées

Baseline conforme (4294), pool C+P1 conforme (127), 0 collision, 0 HOLD, 0 zone protégée,
pagination complète, 4/4 sources, 0 glose vide, aucune tentative d'écriture.

## 17. Verdict

```text
PHASE_70P_LOT14_READY_FOR_HUMAN_REVIEW

DATABASE_WRITES = 0
LOT_14_STARTED = false
DRY_RUN_STARTED = false
APPLY_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN GATE 1 REQUIRED
```

### Résumé

- **Candidats** : 127 (pool C+P1 exclusif, épuisé à l'issue de ce lot)
- **Familles** : GRAMMATICAL 59 · COMPOSED_CLITIC 45 · LEMMA_RESOLVABLE 10 · VERBAL_LEXICAL 10 ·
  BARE_NOUN 2 · ADJECTIVE 1
- **Risques** : 127 HIGH-RISK (revue ciblée requise — aucune glose auto-acceptée)
- **Gloses** : 127/127, 0 vide
- **Formes nouvelles** (sans glossaire antérieur) : **127/127** — toutes les gloses sont de
  nouvelles gloses éditoriales 70P (auteur du lot), vérifiées par word_id ; aucune forme n'a
  été résolue par réutilisation d'une glose existante (pool C+P1 = formes jamais glossées)
- **Verbes** : 31
- **Clitiques / possessifs** : 34 (dont 21 possessifs)
- **Passifs** : 0
- **Formes non-NFC** : 49 (documentées, clé = word_id)
- **Couverture documentaire** : 4/4 sources sur 127/127
- **Tests** : tsc PASS · eslint PASS · vitest 775/775 PASS · build PASS · périmètre 15 PASS
- **Points de revue humaine** : les 127 formes (HIGH-RISK) — en particulier les 45 clitiques
  composés et les 31 formes verbales, ainsi que les 3 verbes à suffixe objet
  (وَءَاتَيْنَـٰهُ, فَأَخَذَتْهُمُ, فَأَخَذَهُمُ) et les 2 gloses « gloire à Toi / gloire à Lui ».

---

**INTERDICTIONS respectées** : aucune revue ciblée lancée, aucun DRY-RUN, aucun script APPLY,
aucun `APPLY=1`, aucun HOLD traité, Lot 15 non commencé, aucun commit, aucun push.

Artefacts : `tmp/phase70p/` (ground-truth.json · pool.json · lot14-candidates.json ·
lot14-evidence.json · lot14-proposals.json · analyst-view.json · tests.json · summary.json)
+ scripts READ-ONLY `tmp/phase70p-*.ts`.

---

# PHASE 70P — LOT 14 — REVUE CIBLÉE (GATE 1 → GATE 2)

## 1. Verdict

```text
PHASE_70P_LOT14_TARGETED_REVIEW_COMPLETE

DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_15_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN GATE 2 REQUIRED
```

## 2. Décisions (127/127 dossiers examinés)

| Décision | Nombre |
|---|---:|
| ACCEPT | **115** |
| MODIFY | **12** |
| HOLD | **0** |
| REJECT | **0** |
| MOVE_TO_LEMMA | **0** |
| **Total** | **127** |

`ACCEPT + MODIFY + HOLD + REJECT = 127` — aucun candidat perdu ni compté deux fois
(127 word_id uniques, vérifié par script).

## 3. Revue occurrence-par-occurrence

- **983 occurrences** examinées pour les 127 candidats (pagination complète, `occurrences_retrieved
  = occurrences_available` 127/127).
- Méthodologie : FORM > LEMME ; personne / nombre / genre / temps-aspect / voix / clitiques /
  possessifs vérifiés par occurrence sur les 4 sources (31 Hamidullah, 9001 Kazimirski,
  20 Sahih International, 153 Piccardo).
- **0 forme passive** dans le lot (vérifié) — aucun contrôle passif→actif nécessaire.
- 31 formes verbales contrôlées : personne/nombre/voix corrects, suffixes objets présents
  (ex. `وَءَاتَيْنَـٰهُ` 1re pl. + objet 3e sg. ; `فَأَخَذَتْهُمُ` f. sg. + objet 3e pl. — corrigé
  en MODIFY) ; aucun « nous → ils », « vous → ils », singulier→pluriel ni actif→passif non
  justifié.
- Clitiques/possessifs contrôlés (34 dont 21 possessifs) : distinction « à Toi ≠ à Lui »,
  « son ≠ leur », « le ≠ les », « nous ≠ vous ≠ ils » — 1 perte de nombre corrigée (WRONG_NUMBER).
- Contrôle sémantique : aucun faux ami conservé (faux ami « moniteur » → corrigé ;
  « quiconque » → « quelqu'un » ; anthropomorphisme « et elle est/il est » → « et cela est »).
- Contrôle POS/familles : 0 nom→verbe, 0 verbe→nom, 0 particule→nom.

## 4. MODIFY détaillés (12)

| word_id[:8] | Forme | Ancienne glose | Nouvelle glose | Type | Raison |
|---|---|---|---|---|---|
| 7b7ddd37 | وَإِنَّهُمْ | et certes ils / car eux | et certes ils / et en vérité ils | STYLE | « car eux » faux contraste ; = وَ + إِنَّ + هُمْ (26:55) |
| 7d74c3d9 | بِٱلْحَقِّ ۖ | en toute équité / en vérité | avec la vérité / en toute équité | SEMANTIC_ERROR | « en vérité » traduirait un autre lexème ; بِالْحَقِّ = « avec la vérité » (40:20) |
| ab2b0fc4 | فَإِنَّهُمْ | car ce sont eux / alors en vérité ils | car ils sont certes / alors en vérité ils | STYLE | clivée « ce sont eux » accentue à tort ; فَ + إِنَّ + هُمْ (26:77) |
| 88904e1b | بِهَآ | à elle / en elle | avec elle / en elle | SEMANTIC_ERROR | بِ = accompagnement, pas destination (2:132) |
| 2b230190 | وَلَعَلَّكُمْ | afin que vous / et peut-être serez-vous | afin que vous / peut-être | STYLE | alternatif trop lourd/inexact ; لَعَلَّ (7:63) |
| 45df4650 | أَحَدٌۭ | quiconque / un seul | quelqu'un / un seul | SEMANTIC_ERROR | « quiconque » = whoever ; أَحَدٌ = « un/quelqu'un » (9:6) |
| 3f0d6287 | فَأَصْبَحُوا۟ | puis ils eurent à regretter / ils s'en repentirent | et ils devinrent / et ils se retrouvèrent (regrettant) | SEMANTIC_ERROR | أَصْبَحَ = « devenir » ; le regret est porté par نَادِمِينَ, pas le verbe (26:157) |
| 4a0d0525 | أَءِنَّا | serons-nous donc / quoi ! nous | serons-nous donc / est-ce vraiment nous | STYLE | « quoi ! nous » fragmentaire ; أَ + إِنَّا (79:10) |
| 96ee7a35 | فَأَخَذَتْهُمُ | le saisit / s'empara d'eux | elle les saisit / s'empara d'eux | WRONG_NUMBER | objet 3e pl. (هُم) rendu au singulier ; sujet الصَّيْحَةُ f. sg. (23:41) |
| d1a88464 | إِنَّهُم | en vérité ils / ils seront | en vérité ils / certes ils | STYLE | « ils seront » inexact : إِنَّ n'est pas un futur (37:24) |
| dda3eccb | فَيَكُونُ | et elle est / et il est | et cela est / et il en est ainsi | SEMANTIC_ERROR | anthropomorphisme ; كُن فَيَكُونُ impersonnel (36:82) |
| ef71c90f | وَنَذِيرًۭا | et un avertisseur / et un moniteur | et un avertisseur / et celui qui avertit | SEMANTIC_ERROR | « moniteur » faux ami ; نَذِير = avertisseur (41:4) |

## 5. Sources

| Contrôle | Résultat |
|---|---:|
| 4/4 sources (31 / 9001 / 20 / 153) | **127/127** |
| Contextes alignés analysés | 508/508 |
| Source manquante | 0 |
| Occurrence manquante / pagination incomplète | 0 |

## 6. Contrôles Unicode

| Contrôle | Résultat |
|---|---:|
| Formes non-NFC parmi les 127 | **49** (documentées, clé = word_id, aucune normalisation destructive) |
| Différence Unicode seule comme raison de MODIFY | **0** (aucune) |
| Clé d'identité | word_id (jamais la forme seule) |
| Corrections keyed | forme exacte comparée en NFC (REVIEW_OVERRIDES_70P) |

## 7. Collisions / doublons

| Contrôle | Résultat |
|---|---:|
| Collision Lots 1–13 | **0** |
| Candidat déjà traité (glose FR validée) | **0** |
| Mapping safe existant | **0** |
| Doublon de word_id | **0** (127 uniques) |
| Aucun écrasement possible | PASS |

## 8. HOLDs historiques

| Forme | word_id | wt FR validée | mapping | Dans le plan ? |
|---|---|---:|---:|---|
| أَعْلَمُ | 0803c6da-… | 0 | 0 | NON |
| كُنَّا | b6d6520c-… | 0 | 0 | NON |
| وَإِن | 52011330-… | 0 | 0 | NON |

`holds_in_plan = 0` — intacts, non traités (aucun HOLD de revue créé non plus).

## 9. Zones protégées

| Zone | Valeur | Statut |
|---|---:|---|
| Sourate 1 (Fātiḥah) MASAQ | 29 | intacte |
| Pilote 108 | 10 | intact |
| Pilote 112 | 15 | intact |
| Pilote 113 | 23 | intact |
| Pilote 114 | 20 | intact |
| Sourate 64 MASAQ | 0 | intacte |

`protected_surahs_hits = []` — aucun candidat dans une zone protégée.

## 10. Ground truth live

| Élément | Attendu | Live | Statut |
|---|---:|---:|---|
| word_translations FR validées | 4294 | **4294** | PASS |
| word_lemma_mapping | 188 | **188** | PASS |
| lemmas | 32 | **32** | PASS |
| lemma_translations | 32 | **32** | PASS |
| lemma_translations FR | 28 | **28** | PASS |
| translations | 24944 | **24944** | PASS |
| quran_words | 21296 | **21296** | PASS |
| word_occurrences | 77430 | **77430** | PASS |
| MASAQ occurrences | 22485 | **22485** | PASS |
| MASAQ segments | 44677 | **44677** | PASS |

`GROUND_TRUTH_DIVERGENCE = false` — baseline revalidée avant la revue (script
`tmp/phase70p-ground-truth.ts` relancé : PASS).

## 11. Non-régression

| Outil | Résultat |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| `npx eslint .` | **PASS** |
| `npx vitest run` | **PASS 775/775** |
| `npm run build` | **PASS** |

## 12. Sécurité

- **DATABASE_WRITES = 0** — aucun INSERT/UPDATE/DELETE, aucune migration, aucun `rpc` à effet
  d'écriture, aucun `APPLY=1`, aucun script d'APPLY, aucun DRY-RUN d'import.
- Lectures uniquement : `.select()`, `.eq()`, `.in()`, `.order()`, `.range()`, `count`,
  `head:true`, helpers de pagination validés, lectures de fichiers locaux.
- Aucun commit, aucun push.

## 13. Artefacts de la revue

- `tmp/phase70p/lot14-targeted-review.json` — décisions 127, MODIFY détaillés (12),
  updated_proposals (127, gloses finales), db_writes = 0.
- `tmp/phase70p/lot14-corrections.ts` — `REVIEW_OVERRIDES_70P` (12 corrections, clé = forme
  exacte NFC) prêt pour un futur DRY-RUN/APPLY (non exécuté).
- `PHASE_70P_REPORT.md` (ce document).

## 14. Matrice d'audit final

| Contrôle | Attendu | Réel |
|---|---:|---:|
| candidats | 127 | **127** |
| dossiers examinés | 127 | **127** |
| occurrences récupérées | toutes | **983/983** |
| sources 4/4 | 127/127 | **127/127** |
| ACCEPT + MODIFY + HOLD + REJECT | 127 | **127** (115+12+0+0) |
| MOVE_TO_LEMMA | 0 | **0** |
| collision Lots 1–13 | 0 | **0** |
| candidat déjà traité | 0 | **0** |
| HOLD historique dans le plan | 0 | **0** |
| zone protégée touchée | 0 | **0** |
| glose vide | 0 | **0** |
| divergence live | 0 | **0** |
| DATABASE_WRITES | 0 | **0** |

## 15. Conclusion Gate 2

La revue ciblée du Lot 14 est **complète** : 127/127 dossiers examinés, 983 occurrences,
4/4 sources, **115 ACCEPT / 12 MODIFY / 0 HOLD / 0 REJECT / 0 MOVE_TO_LEMMA**, aucune
collision, aucune zone protégée touchée, aucun HOLD historique impliqué, baseline intacte,
tests non-régression PASS. Les 12 corrections (`lot14-corrections.ts`) seront appliquées
uniquement lors d'un futur DRY-RUN/APPLY, après **autorisation humaine explicite**.

**Aucun DRY-RUN lancé. Aucun APPLY. Aucun Lot 15. Aucun HOLD traité. Aucun commit/push.**

---

# PHASE 70P — LOT 14 — DRY-RUN (GATE 2 → GATE 3)

## 1. Verdict

```text
PHASE_70P_LOT14_DRY_RUN_READY

DATABASE_WRITES = 0
DRY_RUN_STARTED = true
APPLY_STARTED = false
LOT_15_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN GATE 3 REQUIRED
```

## 2. Baseline live (revalidée avant DRY-RUN)

| Élément | Attendu | Live | Statut |
|---|---:|---:|---|
| word_translations FR validées | 4294 | **4294** | PASS |
| word_lemma_mapping | 188 | **188** | PASS |
| lemmas | 32 | **32** | PASS |
| lemma_translations | 32 | **32** | PASS |
| lemma_translations FR | 28 | **28** | PASS |
| translations | 24944 | **24944** | PASS |
| quran_words | 21296 | **21296** | PASS |
| word_occurrences | 77430 | **77430** | PASS |
| MASAQ occurrences | 22485 | **22485** | PASS |
| MASAQ segments | 44677 | **44677** | PASS |

Sourate 64 MASAQ = 0 · Fātiḥah intacte (29) · Pilotes 108/112/113/114 intacts ·
HOLDs toujours 0 wt FR / 0 mapping.

## 3. Plan final (source d'autorité : lot14-targeted-review.json)

- 127 candidats · 115 ACCEPT · 12 MODIFY intégrés · 0 HOLD · 0 REJECT · 0 MOVE_TO_LEMMA
- 127 word_id uniques · 0 collision interne · 0 candidat déjà traité · 0 HOLD dans le plan
- Aucune zone protégée touchée (0 hit en 1/108/112/113/114)

## 4. Résultat DRY-RUN

| Contrôle | Résultat |
|---|---:|
| INSERT attendus | **127/127** |
| ALREADY_EXISTS | **0** |
| Collisions (doublons internes) | **0** |
| Divergences de glose | **0** |
| Écrasements | **0** |
| Idempotence : 1er APPLY → +127 INSERT | PASS |
| Idempotence : 2e APPLY → 0 insertion (127 doublons reconnus, {word_id, language, source_id}) | PASS |
| 2e APPLY divergences | **0** |

## 5. Unicode

- **49** formes non-NFC documentées (clé = word_id, NFC documentaire uniquement, aucune
  normalisation destructive).
- Les 12 corrections de `lot14-corrections.ts` sont keyed par forme exacte (comparée NFC).

## 6. Diff DB théorique

| Table | Avant | Après théorique | Delta |
|---|---:|---:|---|
| **word_translations** | 4294 | **4421** | **+127** |
| word_lemma_mapping | 188 | 188 | +0 |
| lemmas | 32 | 32 | +0 |
| lemma_translations | 32 | 32 | +0 |
| translations | 24944 | 24944 | +0 |
| quran_words | 21296 | 21296 | +0 |
| word_occurrences | 77430 | 77430 | +0 |
| MASAQ linguistic_occurrences | 22485 | 22485 | +0 |
| MASAQ linguistic_segments | 44677 | 44677 | +0 |

`unexpected_table_changes = []` — seule `word_translations` serait modifiée.

## 7. Provenance des futures lignes

- `language = "fr"` · `is_validated = true` · `source = "Hikma — lexique éditorial"`
- `source_id = 79e6412e-e349-4fe5-b29b-108237375a2d` (identique Lots 1–13)
- `validated_at` conforme aux invariants (now ISO 8601)
- Contrainte d'unicité : `UNIQUE(word_id, language, source_id)` — respectée par construction.

## 8. HOLDs — absents du plan

| Forme | word_id[:8] | wt FR | mapping | Dans le plan ? |
|---|---|---:|---:|---|
| أَعْلَمُ | 0803c6da | 0 | 0 | NON |
| كُنَّا | b6d6520c | 0 | 0 | NON |
| وَإِن | 52011330 | 0 | 0 | NON |

## 9. Zones protégées — intactes

| Zone | Valeur | Statut |
|---|---:|---|
| Sourate 1 (Fātiḥah) | 29 occurrences | intacte |
| Pilote 108 | 10 | intact |
| Pilote 112 | 15 | intact |
| Pilote 113 | 23 | intact |
| Pilote 114 | 20 | intact |
| Sourate 64 MASAQ | 0 | intacte |

## 10. Non-régression (post-DRY-RUN)

| Outil | Résultat |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| `npx eslint .` | **PASS** |
| `npx vitest run` | **PASS 775/775** |
| `npm run build` | **PASS** |

## 11. Sécurité

```text
DATABASE_WRITES = 0
DRY_RUN_STARTED = true
APPLY_STARTED = false
LOT_15_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

- Aucun INSERT/UPDATE/DELETE — le DRY-RUN est une pure simulation en mémoire.
- Script `tmp/phase70p-lot14-import.ts` verrouillé derrière `APPLY=1` (jamais exécuté,
  bloque explicitement avec un message d'erreur si tenté).
- Aucun commit, aucun push.

## 12. Artefacts du DRY-RUN

- `tmp/phase70p/lot14-dry-run.json` — simulation complète : 127 lignes simulées (toutes
  valides : language=fr, is_validated=true, 0 bad row), MODIFY intégrés, provenance, diff
  théorique, idempotence, zones protégées, HOLDs.
- `tmp/phase70p/lot14-import-summary.json` — résumé standardisé (format identique aux Lots
  1–13) : INSERT=127, ALREADY_EXISTS=0, divergences=0, collisions=0, MODIFY=12, ACCEPT=115,
  wt_before=4294, wt_after_theoretical=4421.
- `tmp/phase70p-lot14-import.ts` — script APPLY-locked (DRY-RUN uniquement, `APPLY=1` bloque).
- `PHASE_70P_REPORT.md` (ce document, mis à jour avec la section DRY-RUN).

## 13. Conclusion Gate 3

Le DRY-RUN du Lot 14 est **complet et propre** : 127 INSERT simulés sans collision ni
écrasement ni divergence, idempotence vérifiée (0 insertion au rerun, 127 doublons reconnus),
diff théorique limité à `word_translations +127`, aucune autre table modifiée, 0 HOLD,
0 zone protégée, baseline intacte (4294 → 4421 théorique), non-régression 775/775 PASS.
Les 12 MODIFY (5 STYLE, 6 SEMANTIC_ERROR, 1 WRONG_NUMBER) sont bien intégrés dans les
127 lignes simulées.

**Le script d'APPLY est verrouillé. Prochaine étape : autorisation humaine explicite (Gate 3)**
pour exécuter l'APPLY réel (`APPLY=1 npx tsx tmp/phase70p-lot14-import.ts`).

---

# PHASE 70P — LOT 14 — APPLY RÉEL (GATE 3 → VERIFIED)

## 1. Verdict

```text
PHASE_70P_LOT14_APPLIED_AND_VERIFIED

DATABASE_WRITES = 127
LOT_15_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — aucune écriture supplémentaire.
```

## 2. Baseline avant APPLY (pré-vérification)

| Élément | Attendu | Live | Statut |
|---|---:|---:|---|
| word_translations FR validées | 4294 | **4294** | PASS |
| word_lemma_mapping | 188 | **188** | PASS |
| lemmas | 32 | **32** | PASS |
| lemma_translations | 32 | **32** | PASS |
| lemma_translations FR | 28 | **28** | PASS |
| translations | 24944 | **24944** | PASS |
| quran_words | 21296 | **21296** | PASS |
| word_occurrences | 77430 | **77430** | PASS |
| MASAQ occurrences | 22485 | **22485** | PASS |
| MASAQ segments | 44677 | **44677** | PASS |

Pré-vérification `tmp/phase70p-pre-verify.ts` : 0 ALREADY_EXISTS, 127 word_id valides, GO.

## 3. APPLY — exécution

```bash
APPLY=1 npx tsx tmp/phase70p-lot14-import.ts
```

| Contrôle | Résultat |
|---|---:|
| INSERT réels | **127/127** |
| Erreurs | **0** |
| ALREADY_EXISTS | **0** |
| Collisions | **0** |
| Divergences | **0** |

Le script a inséré 127 lignes en une seule transaction chunkée (250/cap).

## 4. Post-APPLY — vérification indépendante (127/127)

Script `tmp/phase70p-post-verify.ts` — vérification individuelle live :

| Contrôle | Attendu | Résultat |
|---|---:|---:|
| 127/127 présentes | 127 | **127** PASS |
| 127/127 texte exact | 127 | **127** PASS |
| 127/127 language=fr | 127 | **127** PASS |
| 127/127 is_validated=true | 127 | **127** PASS |
| 127/127 provenance correcte | 127 | **127** PASS |
| 12/12 MODIFY exacts | 12 | **12** PASS |

## 5. Compteurs avant/après

| Élément | Avant | Après | Delta | Attendu | Statut |
|---|---:|---:|---:|---:|---|
| **word_translations FR** | 4294 | **4421** | **+127** | +127 | PASS |
| word_lemma_mapping | 188 | **188** | +0 | +0 | PASS |
| lemmas | 32 | **32** | +0 | +0 | PASS |
| lemma_translations | 32 | **32** | +0 | +0 | PASS |
| lemma_translations FR | 28 | **28** | +0 | +0 | PASS |
| translations | 24944 | **24944** | +0 | +0 | PASS |
| quran_words | 21296 | **21296** | +0 | +0 | PASS |
| word_occurrences | 77430 | **77430** | +0 | +0 | PASS |
| MASAQ occurrences | 22485 | **22485** | +0 | +0 | PASS |
| MASAQ segments | 44677 | **44677** | +0 | +0 | PASS |

`4294 + 127 = 4421` confirmé. `unexpected_table_changes = []`.

## 6. Zones protégées (intactes)

| Zone | Attendu | Après APPLY | Statut |
|---|---:|---:|---|
| Sourate 1 (Fātiḥah) MASAQ | 29 | **29** | PASS |
| Pilote 108 | 10 | **10** | PASS |
| Pilote 112 | 15 | **15** | PASS |
| Pilote 113 | 23 | **23** | PASS |
| Pilote 114 | 20 | **20** | PASS |
| Sourate 64 MASAQ | 0 | **0** | PASS |

## 7. HOLDs (intacts)

| Forme | word_id[:8] | wt FR | mapping | Statut |
|---|---|---:|---:|---|
| أَعْلَمُ | 0803c6da | 0 | 0 | PASS |
| كُنَّا | b6d6520c | 0 | 0 | PASS |
| وَإِن | 52011330 | 0 | 0 | PASS |

`holds_wt_fr=0, holds_mapping=0`.

## 8. Idempotence

Le rerun théorique (non exécuté réellement) donnerait :
- 0 insertion (toutes les 127 lignes déjà présentes, contrainte UNIQUE)
- 127 doublons reconnus
- 0 divergence

## 9. Non-régression (post-APPLY)

| Outil | Résultat |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| `npx eslint .` | **PASS** |
| `npx vitest run` | **PASS 775/775** |
| `npm run build` | **PASS** |

## 10. Sécurité

```text
DATABASE_WRITES = 127  (127 INSERT word_translations uniquement)
LOT_15_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

- Seule table modifiée : `word_translations` (+127 lignes).
- Aucun INSERT/UPDATE/DELETE sur : word_lemma_mapping, lemmas, lemma_translations, translations,
  quran_words, word_occurrences, linguistic_occurrences, linguistic_segments.
- Aucun commit, aucun push.

## 11. Artefacts post-APPLY

- `tmp/phase70p/lot14-import-summary.json` — résumé APPLY : INSERT=127, post-verify=127/127 OK,
  wt 4294→4421, unexpected_table_changes=[]
- `tmp/phase70p/lot14-post-verify.json` — audit post-APPLY : 22/22 checks PASS (all_pass=true),
  zones protégées intactes, HOLDs 0/0, MODIFY 12/12, 0 erreur
- `PHASE_70P_REPORT.md` (ce document, mis à jour avec la section APPLY)

## 12. État Git (inchangé)

- Aucun fichier tracké modifié par l'APPLY (scripts produisent uniquement des artefacts `tmp/`).
- Aucun commit, aucun push.

## 13. Conclusion finale

Le Lot 14 est **appliqué et vérifié** : 127 word_translations FR insérées (115 ACCEPT + 12 MODIFY),
post-verification 127/127 text exact + 127/127 language=fr + 127/127 validated=true + 127/127
provenance correcte, 12/12 MODIFY exacts, compteurs conformes (4294 → **4421**), 0 divergence,
0 zone protégée touchée, 3 HOLDs intacts, non-régression 775/775 PASS, 0 unexpected_table_changes.

**Aucun Lot 15 lancé. Aucun HOLD traité. Aucun commit/push.**

Prochaine étape : décision humaine pour le Lot 15 ou autre suite.
