# PHASE 41A — AUDIT READ-ONLY — PRÉPARATION DU DÉBLOCAGE D'AL-QADR + AL-MASAD

**Statut : `PHASE_41A_READY_FOR_EDITORIAL` (READ-ONLY — aucune écriture)**

> Aucun code produit modifié, aucune migration, aucun seed, aucune écriture DB
> (lectures seules), aucun commit/push. Les gloses listées sont des **propositions**,
> pas des validations.

---

## A. Executive Summary

L'audit reconstruit intégralement **Al-Qadr (97)** et **Al-Masad (111)** depuis la DB
actuelle. Les chiffres 18 + 18 de la Phase 40D sont **confirmés**, mais précisés :

| Sourate | Formes | Déjà FR | À éditer | Bloquées | % actuel |
|---|---:|---:|---:|---:|---:|
| 97 Al-Qadr | 27 | 9 | **18** | 0 | 33 % |
| 111 Al-Masad | 22 | 4 | **18** | 0 | 18 % |

**Coût éditorial réel : 36 nouvelles gloses** (18 + 18), dont **23 lexicales pures** et
**13 clitiques/grammaticales** (qui suivent le précédent d'Al-Fātiḥah : `إِيَّاكَ → « Toi
seul »`, `عَلَيْهِمْ → « sur eux »`). **Aucune forme n'est réellement bloquée** : le
précédent éditorial d'Al-Fātiḥah (Phase 23F-D) établit que les clitiques sont **glosées
dans le contexte de la sourate**, pas rejetées.

**Décision stratégique recommandée** : débloquer **Al-Qadr d'abord** (18 gloses, meilleure
réutilisation : `nuit`, `mille`, `mois`, `anges`, `aube`, `paix`), puis **Al-Masad**
(18 gloses), ou les deux dans un seul batch de 36.

---

## B. Source Reports

Rapports de référence relus : `PHASE_40A_CURRICULUM_EFFICIENCY_AUDIT.md`,
`PHASE_40B_LEXICAL_FR_ENRICHMENT.md`, `PHASE_40C_LEXICAL_FR_VALIDATION.md`,
`PHASE_40D_CURRICULUM_INTEGRATION_AUDIT.md`.

---

## C. Current Curriculum Architecture

Vérifié dans le code réel :

| Mécanisme | Source | Rôle |
|---|---|---|
| `planSurahCurriculum` | `lib/learning/surah-curriculum.ts` | sourate → 1 leçon/verset, mots cumulés + revue ≤4, `is_new` |
| `classifySurahReadiness` | `lib/learning/queries.ts:155` | `READY` **ssi 100 % des formes résolvent en FR** ; sourate 1 = `REFERENCE` |
| `getSurahCatalog` | `lib/learning/queries.ts` | itère **uniquement sur les `learning_paths` existants** (`not surah_id is null`) |
| `seed-multisurah-curriculum.ts` | `scripts/` | `--surahs=97,111`, upsert idempotent path/unit/lessons/lesson_words ; `--dry-run` |

**Conséquence importante** : une sourate devient `READY` en **deux temps** — (1) toutes ses
formes ont un FR validé ; (2) le seed crée son `learning_paths` (sinon elle n'apparaît pas
dans le catalogue). Les deux étapes sont des **écritures** (Phase 41B), pas des calculs.

---

## D. Al-Qadr Reconstruction (27 formes, 5 versets)

| Forme | Occ. | Lemma | FR forme | FR lemme | EN fallback | État |
|---|---:|---|---|---|---|---|
| إِنَّآ | 1 | — | — | — | Indeed We | ❌ À éditer (clitique) |
| أَنزَلْنَـٰهُ | 1 | — | — | — | We have revealed it | ❌ À éditer (verbe + 2 clitiques) |
| فِى | 1 | فِي | « dans » | « dans / en / sur » | In | ✅ FR |
| لَيْلَةِ | 1 | — | — | — | (the) Night | ❌ À éditer |
| ٱلْقَدْرِ | 3 | — | — | — | (of) Power | ❌ À éditer |
| وَمَآ | 1 | — | « et ce que » | — | and what | ✅ FR |
| أَدْرَىٰكَ | 1 | — | « t'a fait connaître » | — | will make you know | ✅ FR |
| مَا | 1 | — | « ce que / ce qui » | — | what | ✅ FR |
| لَيْلَةُ | 2 | — | — | — | (the) Night | ❌ À éditer |
| خَيْرٌۭ | 1 | — | « meilleur » | — | (is) better | ✅ FR |
| مّنْ | 1 | — | « de » | — | from | ✅ FR |
| أَلْفِ | 1 | — | — | — | a thousand | ❌ À éditer |
| شَهْرٍۢ | 1 | — | — | — | month(s) | ❌ À éditer |
| تَنَزَّلُ | 1 | — | — | — | descend | ❌ À éditer |
| ٱلْمَلَـٰٓئِكَةُ | 1 | — | — | — | the Angels | ❌ À éditer |
| وَٱلرُّوحُ | 1 | — | — | — | and the Spirit | ❌ À éditer (و + nom) |
| فِيهَا | 1 | — | — | — | therein | ❌ À éditer (فِي + ـهَا) |
| بِإِذْنِ | 1 | — | — | — | by permission | ❌ À éditer (بِ + إِذْن) |
| رَبِّهِم | 1 | — | — | — | their Lord | ❌ À éditer (رَبّ + ـهِم) |
| مّنِ | 1 | — | « de » | — | from | ✅ FR |
| كُلِّ | 1 | — | « tout / chaque » | — | every | ✅ FR (glose 40C) |
| أَمْرٍۢ | 1 | — | — | — | a decision | ❌ À éditer |
| سَلَـٰمٌ | 1 | — | — | — | Peace | ❌ À éditer |
| هِىَ | 1 | — | — | — | it (is) | ❌ À éditer (pronom) |
| حَتَّىٰ | 1 | — | « jusqu'à » | — | until | ✅ FR |
| مَطْلَعِ | 1 | — | — | — | emergence | ❌ À éditer |
| ٱلْفَجْرِ | 1 | — | — | — | the dawn | ❌ À éditer |

**Totaux : 27 formes — 9 FR direct, 0 FR lemme, 18 à éditer.**

---

## E. Al-Masad Reconstruction (22 formes, 5 versets)

| Forme | Occ. | Lemma | FR forme | FR lemme | EN fallback | État |
|---|---:|---|---|---|---|---|
| تَبَّتْ | 1 | — | — | — | Perish | ❌ À éditer |
| يَدَآ | 1 | — | — | — | (the) hands | ❌ À éditer |
| أَبِى | 1 | — | — | — | (of) father | ❌ À éditer |
| لَهَبٍۢ | 2 | — | — | — | Lahab | ❌ À éditer (nom propre) |
| وَتَبَّ | 1 | — | — | — | and perish | ❌ À éditer (و + verbe) |
| مَآ | 1 | — | « ce que » | — | what | ✅ FR |
| أَغْنَىٰ | 1 | — | — | — | (has) availed | ❌ À éditer |
| عَنْهُ | 1 | — | — | — | from [it] | ❌ À éditer (عَنْ + ـهُ) |
| مَالُهُۥ | 1 | — | — | — | his wealth | ❌ À éditer (مَال + ـهُ) |
| وَمَا | 1 | — | « et ne... pas » | — | but not | ✅ FR |
| كَسَبَ | 1 | — | — | — | earned | ❌ À éditer |
| سَيَصْلَىٰ | 1 | — | — | — | will be burnt | ❌ À éditer |
| نَارًۭا | 1 | — | — | — | a fire | ❌ À éditer |
| ذَاتَ | 1 | — | — | — | that (fém.) | ❌ À éditer (nom fonctionnel) |
| وَٱمْرَأَتُهُۥ | 1 | — | — | — | and his wife | ❌ À éditer (و + nom + ـهُ) |
| حَمَّالَةَ | 1 | — | — | — | carrier | ❌ À éditer |
| ٱلْحَطَبِ | 1 | — | — | — | firewood | ❌ À éditer |
| فِى | 1 | فِي | « dans » | « dans / en / sur » | In | ✅ FR |
| جِيدِهَا | 1 | — | — | — | her neck | ❌ À éditer (جِيد + ـهَا) |
| حَبْلٌۭ | 1 | — | — | — | a rope | ❌ À éditer |
| مّنِ | 1 | — | « de » | — | from | ✅ FR |
| مَّسَدٍۢ | 1 | — | — | — | palm-fiber | ❌ À éditer |

**Totaux : 22 formes — 4 FR direct, 0 FR lemme, 18 à éditer.**

---

## F. Exact Form Inventory

- **Al-Qadr** : 27 formes distinctes, 5 versets, 27 occurrences.
- **Al-Masad** : 22 formes distinctes, 5 versets, 22 occurrences.
- **Total** : 49 formes, dont **36 à éditer** et **13 déjà FR**.

---

## G. Existing FR Coverage

Déjà couvertes (glose FORME validée) :

- **Al-Qadr (9)** : فِى « dans » · وَمَآ « et ce que » · أَدْرَىٰكَ « t'a fait connaître » ·
  مَا « ce que / ce qui » · خَيْرٌۭ « meilleur » · مّنْ/مّنِ « de » · كُلِّ « tout / chaque »
  (glose écrite en **Phase 40C**) · حَتَّىٰ « jusqu'à ».
- **Al-Masad (4)** : مَآ « ce que » · وَمَا « et ne... pas » · فِى « dans » · مّنِ « de ».

**0 forme couverte par lemme** dans ces deux sourates (aucune des formes restantes ne porte
de `lemma_id` résolu en FR).

---

## H. Safe Lemma Coverage

**Aucune.** Les 36 formes à éditer ont `lemma_id = NULL` ou un lemme sans glose FR validée.
→ Aucune économie par mapping lemme. Le « 18 + 18 » est bien un coût **forme par forme**.

---

## I. 40C Reuse Audit

| Élément | Réutilisation dans 97 / 111 |
|---|---|
| 15 gloses P1 de 40C | **1 seule** : `كُلِّ` (Al-Qadr) — déjà comptée « FR » |
| 15 candidats P2 de 40B | aucun présent dans 97/111 |
| Formes BLOCKED de 40B | aucune des 36 (les clitiques de 97/111 ne sont pas dans la liste 40B) |

→ Le travail 40B/40C est **presque sans effet** sur ces deux sourates (cohérent avec 40D :
les mots fréquents vivent dans les sourates longues, pas les courtes). **Aucun travail
éditorial à refaire, mais aucun à réutiliser non plus.**

---

## J. Shared Forms

Formes communes entre les deux sourates et le curriculum existant :

| Forme | 97 | 111 | Déjà FR | Source | Action |
|---|---|---|---|---|---|
| فِى | ✅ | ✅ | « dans » | Al-Fātiḥah | réutilisée |
| مَا / مَآ | ✅ | ✅ | « ce que / ce qui » | Al-Fātiḥah | réutilisée |
| مّنْ / مّنِ | ✅ | ✅ | « de » | Al-Fātiḥah | réutilisée |
| وَمَا / وَمَآ | ✅ | ✅ | « et ce que / et ne... pas » | Al-Fātiḥah | réutilisée |
| كُلِّ | ✅ | — | « tout / chaque » | **40C** | réutilisée |

---

## K. Category A — Already Covered

13 formes (9 + 4) — voir section G. Aucune nouvelle édition nécessaire.

---

## L. Category B — Editorially Required (36 formes)

**Al-Qadr (18)** — noyau sémantique croisé (Hamidullah FR ↔ Kazimirski FR, puis Sahih EN +
Piccardo IT) → glose Hikma **proposée** (non écrite) :

| Forme | Noyau | Glose proposée | Type |
|---|---|---|---|
| إِنَّآ | particule إِنَّ + « nous » (H « certes », E « Indeed We », I « Invero ») | certes, nous | clitique |
| أَنزَلْنَـٰهُ | faire descendre/révéler (H « fait descendre », E « sent down », I « fatto scendere ») | nous l'avons fait descendre | verbe + 2 clitiques |
| لَيْلَةِ / لَيْلَةُ | nuit (H/K « nuit », E « Night », I « Notte ») | nuit | lexical |
| ٱلْقَدْرِ | destin/décret (H « Destin », K « Alkadr », E « Decree », I « Destino ») | le destin / la destinée | lexical (sec. : pouvoir/valeur) |
| أَلْفِ | mille (H/K « mille », E « thousand », I « mille ») | mille | lexical |
| شَهْرٍۢ | mois (H/K « mois », E « months », I « mesi ») | mois | lexical |
| تَنَزَّلُ | descendre (H « descendent », E « descend », I « discendono ») | descendent | lexical (verbe) |
| ٱلْمَلَـٰٓئِكَةُ | les anges (H/K « anges », E « angels », I « angeli ») | les anges | lexical |
| وَٱلرُّوحُ | و + l'Esprit/Gabriel (H « l'Esprit », E « the Spirit », I « lo Spirito ») | et l'Esprit | و + nom |
| فِيهَا | فِي + ـهَا (H « celle-ci », E « therein », I « In essa ») | y / en elle | clitique |
| بِإِذْنِ | بِ + permission (H « par permission », E « by permission », I « col permesso ») | avec la permission | clitique |
| رَبِّهِم | رَبّ + ـهِم (H « leur Seigneur », E « their Lord », I « loro Signore ») | leur Seigneur | clitique |
| أَمْرٍۢ | ordre/affaire (H « ordre », E « matter », I « decreto ») | ordre / affaire | lexical (polysémique léger) |
| سَلَـٰمٌ | paix/salut (H « paix et salut », K « paix », E « Peace », I « pace ») | paix / salut | lexical |
| هِىَ | elle (H « Elle », E « it », I « È ») | elle | pronom |
| مَطْلَعِ | lever/apparition (H « apparition », K « lever », E « emergence », I « levarsi ») | le lever / l'apparition | lexical |
| ٱلْفَجْرِ | aube (H « aube », K « aurore », E « dawn », I « alba ») | l'aube | lexical |

**Al-Masad (18)** :

| Forme | Noyau | Glose proposée | Type |
|---|---|---|---|
| تَبَّتْ | périr (H « que périssent », E « be ruined », I « periscano ») | que périssent | lexical (verbe) |
| يَدَآ | les deux mains (H/K « deux mains », E « hands », I « mani ») | les deux mains | lexical (duel) |
| أَبِى | père (H « Abû », E « Abū », I « Abû ») | père | lexical |
| لَهَبٍۢ | Lahab, nom propre (= flamme) | Lahab | nom propre |
| وَتَبَّ | و + périr (H « et ... périsse », E « and ruined », I « e perisca ») | et il a péri | و + verbe |
| أَغْنَىٰ | profiter/servir (H « sert à rien », E « avail », I « gioveranno ») | a profité / servi | lexical (verbe) |
| عَنْهُ | عَنْ + ـهُ (H « lui », E « him », I « gli ») | de lui | clitique |
| مَالُهُۥ | مَال + ـهُ (H « sa fortune », E « his wealth », I « ricchezze ») | sa fortune / son bien | clitique |
| كَسَبَ | acquérir/gagner (H « acquis », E « gained », I « guadagni ») | a acquis / gagné | lexical (verbe) |
| سَيَصْلَىٰ | être brûlé (H « sera brûlé », E « burn », I « bruciato ») | il sera brûlé | lexical (verbe) |
| نَارًۭا | feu (H « Feu », E « Fire », I « Fuoco ») | un feu | lexical |
| ذَاتَ | ذَات = pourvu de (H « plein de », E « of », I « ardente ») | ayant / pourvue de | nom fonctionnel |
| وَٱمْرَأَتُهُۥ | و + femme + ـهُ (H « sa femme », E « his wife », I « sua moglie ») | et sa femme | و + nom + clitique |
| حَمَّالَةَ | porteuse (H/K « porteuse », E « carrier », I « portatrice ») | la porteuse | lexical |
| ٱلْحَطَبِ | bois à brûler (H/K « bois », E « firewood », I « legna ») | le bois (à brûler) | lexical |
| جِيدِهَا | جِيد + ـهَا (H « son cou », E « her neck », I « collo ») | son cou | clitique |
| حَبْلٌۭ | corde (H/K « corde », E « rope », I « corda ») | une corde | lexical |
| مَّسَدٍۢ | fibres de palmier (H « fibres », K « filaments », E « fiber », I « fibre ») | fibres (de palmier) | lexical |

**Répartition : 23 lexicales + 13 clitiques/grammaticales.**

---

## M. Category C — Blocked

**Aucune.** Justification : le précédent d'Al-Fātiḥah (Phase 23F-D) glose les clitiques
**dans le contexte de la sourate** (`إِيَّاكَ → « Toi seul »`, `عَلَيْهِمْ → « sur eux »`,
`وَلَا → « et non / ni »`). Les 13 clitiques de 97/111 suivent ce même pattern
(« glose contextuelle », jamais un sens isolé trompeur). Aucune forme n'est juridiquement ou
morphologiquement inexploitable.

> ⚠️ Nuance : `لَهَبٍۢ` est un **nom propre** (Abu Lahab) — glose « Lahab » (nom propre),
> avec note lexicale « = flamme ». `ذَاتَ` (fém. de ذُو « possesseur de ») est un **nom
> fonctionnel** — glose « ayant / pourvue de », à valider éditorialement.

---

## N. Editorial Cost

| Catégorie | 97 | 111 | Total |
|---|---:|---:|---:|
| Formes totales | 27 | 22 | 49 |
| Déjà FR direct | 9 | 4 | 13 |
| Couvertes via lemme | 0 | 0 | 0 |
| **À éditer (B)** | **18** | **18** | **36** |
| Bloquées (C) | 0 | 0 | 0 |

- **36 nouvelles gloses**, dont 23 lexicales pures et 13 clitiques/grammaticales.
- Comparaison : Phase 40C a produit **15** gloses. Ce batch en représente **2,4×** (36).

---

## O. Ayah / Occurrence Cost

- **Ayahs à analyser** : 5 (97) + 5 (111) = **10 versets** (les 4 traductions sont déjà
  alignées sur `ayah_id` — ressources 31 / 9001 / 20 / 153).
- **Occurrences concernées** : 27 (97) + 22 (111) = 49.
- **Échantillonnage** : inutile ici (5 versets chacun) — l'analyse 4 traductions porte sur
  l'intégralité des 10 versets (déjà extraite en section L).

---

## P. READY Threshold Simulation

`classifySurahReadiness(number, effectiveFrPct)` retourne `READY` ssi `effectiveFrPct === 100`.

| Sourate | Avant | Après +18 gloses | Résultat simulé |
|---|---:|---:|---|
| 97 | 9/27 = 33 % | 27/27 = 100 % | **READY** |
| 111 | 4/22 = 18 % | 22/22 = 100 % | **READY** |

**Rappel** : `READY` n'apparaît dans le catalogue qu'après le seed du parcours
(`seed-multisurah-curriculum --surahs=…`). La glose seule ne suffit pas.

---

## Q. Al-Qadr Readiness

- **Possible aujourd'hui ?** Non (33 % FR).
- **Gloses supplémentaires nécessaires** : 18.
- **Formes bloquantes** : aucune insurmontable (détail section L).
- **Après édition** : 100 % → `READY` (une fois le parcours seedé).

---

## R. Al-Masad Readiness

- **Possible aujourd'hui ?** Non (18 % FR).
- **Gloses supplémentaires nécessaires** : 18.
- **Formes bloquantes** : aucune insurmontable.
- **Après édition** : 100 % → `READY` (une fois le parcours seedé).

---

## S. Cross-Surah Reuse

Nouvelles gloses réutilisables dans les prochaines sourates courtes (101, 95, 99, 100, 89, 91…)

| Nouvelle glose | 97 | 111 | 101 | 95 | 99 | 100 | 89 | Réutilisation |
|---|---|---|---|---|---|---|---|---|
| feu (نَار) | — | ✅ | ✅ | — | — | — | — | forte (s. 101, 92, …) |
| anges (مَلَائِكَة) | ✅ | — | — | — | — | — | — | forte |
| aube (فَجْر) | ✅ | — | — | — | — | — | ✅ | moyenne (s. 89) |
| nuit (لَيْلَة) | ✅ | — | — | — | — | — | — | moyenne (s. 44, 91) |
| mois (شَهْر) | ✅ | — | — | — | — | — | — | moyenne |
| paix (سَلَام) | ✅ | — | — | — | — | — | — | moyenne |
| Seigneur + suffixe (رَبّ + ـ) | ✅ | — | — | — | — | — | — | forte (pattern) |
| corde (حَبْل) | — | ✅ | — | — | — | — | — | moyenne |
| fortune (مَال) | — | ✅ | — | — | — | — | — | moyenne |

→ **~8–10 des 36 gloses** ont une réutilisation directe dans les sourates courtes suivantes.
Les clitiques (و + mot, préposition + pronom, رَبّ + suffixe) établissent des **patterns**
réutilisables au-delà des formes isolées.

---

## T. Pedagogical Priority

- **Al-Qadr** : sourate majeure (Nuit du Destin), très récité ; vocabulaire réutilisable
  (nuit, mois, anges, aube, paix) ; 1 seule vraie difficulté lexicale (`ٱلْقَدْرِ` polysémique).
- **Al-Masad** : très courte, très récité ; vocabulaire plus spécifique (`مَسَد`, `حَطَب`,
  `لَهَب`), donc **réutilisation moindre**.
- **Verdict priorité** : **Al-Qadr d'abord** (coût identique 18, mais meilleure réutilisation
  et plus grande centralité pédagogique), **Al-Masad immédiatement après** (ou en même temps).

---

## U. Recommended Implementation Order

1. **Al-Qadr (97)** — 18 gloses → seed `--surahs=97`.
2. **Al-Masad (111)** — 18 gloses → seed `--surahs=111`.
3. Puis itérer : Al-Qari'ah (101, 21 gloses), At-Tin (95, 26), Az-Zalzalah (99, 26).

Alternative : **batch unique de 36** (les deux sourates en une seule phase éditoriale), si le
rythme de validation le permet.

---

## V. No-Write Guarantee

Aucune écriture effectuée : `0 INSERT/UPDATE/DELETE/UPSERT`, `0` migration, `0` seed, `0`
`word_translations`/`lemma_translations` modifiée, `0` `learning_paths`/`units`/`lessons`/
`lesson_words` modifiée. Scripts `tmp/phase41a-*.cjs` en lecture seule (service role, `select`).

---

## W. Risks

1. **Clitiques** : 13 gloses « contextuelles » — risque de figer un sens hors contexte si la
   note éditoriale est omise (le précédent Al-Fātiḥah montre la parade : note explicite).
2. **`ٱلْقَدْرِ`** : polysémique (destin / pouvoir / valeur / décret) — glose « le destin / la
   destinée » à valider soigneusement.
3. **`لَهَبٍۢ`** : nom propre — décision éditoriale « garder le nom propre » vs « gloser flamme ».
4. **`ذَاتَ`** : nom fonctionnel (fém. de ذُو) — glose « ayant / pourvue de » inhabituelle pour
   un apprenant, à formuler pédagogiquement.
5. **Volume** : 36 gloses = batch 2,4× plus gros que 40C (15) — risque de dilution de la
   qualité si fait trop vite ; découper en 2 sous-batchs si nécessaire.

---

## X. Recommended Phase 41B

**« Validation éditoriale + écriture des 36 gloses (Al-Qadr puis Al-Masad) + seed des 2
parcours »** — reproduction stricte du workflow 40C (4 traductions alignées + Kazimirski 1860),
puis `seed-multisurah-curriculum --surahs=97,111` idempotent. Aucun moteur modifié. À valider
explicitement avant exécution.

---

## Y. Final Verdict

| Question stratégique | Réponse |
|---|---|
| A. Al-Qadr première ? | **Oui** (18 gloses, meilleure réutilisation, centralité pédagogique) |
| B. Al-Masad en même temps ? | **Optionnel** — recommandé juste après, ou dans un batch unique de 36 |
| C. Nombre exact de nouvelles gloses | **36** (18 + 18), 0 bloquée |
| D. Gloses réutilisables ensuite | **~8–10 directes** + patterns clitiques réutilisables |
| E. Prochain batch optimal | **Al-Qadr (18)** puis **Al-Masad (18)** |

| Sourate | Formes | FR direct | FR lemme | À éditer | Bloquées | % actuel | % après | READY ? |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 97 Al-Qadr | 27 | 9 | 0 | 18 | 0 | 33 % | 100 % | après seed |
| 111 Al-Masad | 22 | 4 | 0 | 18 | 0 | 18 % | 100 % | après seed |

**Décision : `PHASE_41A_READY_FOR_EDITORIAL`** — les deux sourates sont entièrement
cartographiées ; le coût réel est **36 gloses** (aucune bloquée), reproductible par le workflow
40C + seed idempotent. **STOP** — aucune écriture avant validation explicite de la Phase 41B.
