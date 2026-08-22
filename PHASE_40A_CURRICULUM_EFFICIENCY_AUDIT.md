# PHASE 40A — CURRICULUM EFFICIENCY & VOCABULARY PROGRESSION

**Statut : `PHASE_40A_CURRICULUM_EFFICIENCY_AUDIT` (READ-ONLY)**

> Aucun code produit modifié, aucune migration, aucune écriture DB, aucun commit/push.
> Tous les chiffres ci-dessous ont été **recalculés** dans la base actuelle (scripts `tmp/phase40a-*.cjs`), jamais repris de la mémoire.

---

## A. Executive Summary

Le curriculum de Hikma est **pédagogiquement cohérent et sain** : il enseigne les sourates réellement récitées (Al-Fātiḥah + 14 sourates courtes de la fin du Coran), **98,1 %** de ses formes ont une traduction française validée, et l'ensemble touche les **114 sourates** et **77,8 % des versets**.

Mais il est **inefficace en couverture d'occurrences** : la forme médiane enseignée n'apparaît que **3 fois** dans le Coran ; les 270 formes enseignées couvrent **18,76 %** des occurrences, là où les **270 formes les plus fréquentes** couvriraient **≈ 40 %**. La première leçon (Al-Fātiḥah) n'apporte que **1,26 %** de couverture.

**Le goulot d'étranglement n'est PAS l'ordre, ce sont les données lexicales** : les formes fréquentes qui manquent (لَا, أَن, قَالَ, ذَٰلِكَ, أَوْ…) sont presque **toutes sans traduction française** (`EN_ONLY`). Toutes les formes manquantes disposant déjà d'une traduction FR ne représentent que **+1,45 %** de couverture. Optimiser l'ordre sans enrichir le lexique n'apporterait presque rien d'actionnable.

**Conclusion** : ne pas réordonner le curriculum (risqué, contraire à l'identité « j'apprends ce que je récite »). La prochaine étape logique est un **enrichissement lexical éditorial** ciblé sur les formes fréquentes manquantes — une phase de données, pas de moteur.

---

## B. Curriculum Architecture

- **Arbre** : `learning_paths` → `units` → `lessons` → `lesson_words` (`position`, `is_new`, `importance`), ordonné par `sort_order`.
- **`getCurriculum`** (queries.ts) assemble un parcours ordonné (`orderCurriculum`, tri par `sort_order`).
- **`getSurahCatalog`** (queries.ts) : catalogue par sourate (état `REFERENCE`/`READY`/`IN_PREPARATION`, leçons, slugs).
- **Générateur `planSurahCurriculum`** (surah-curriculum.ts) : **une leçon par verset**, mots du verset (nouveaux d'abord, puis ≤ 4 mots de révision « plus récents d'abord »). Al-Fātiḥah est `EDITORIAL` (verrouillée, jamais régénérée).
- **`lesson_words.is_new`** : seul critère de **complétion** d'une leçon (les mots `is_new = false` sont de la révision réintroduite).
- **`lesson_words.importance`** : colonne présente mais **non utilisée** par le code (aucun tri/priorité ne s'en sert).
- **Sélection de la prochaine leçon** : `selectActiveLearningPath` (session active → sourate en cours la plus avancée → recommandation → fallback), par `sort_order`.
- **Ordre d'enseignement réel** : `path.sort_order` (= `100 + numéro de sourate`, Al-Fātiḥah = `1`) → `unit.sort_order` → `lesson.sort_order` (= numéro de verset) → `position`.

**⇒ L'ordre est l'ordre coranique (sourate → verset), pas l'ordre de fréquence.**

---

## C. Current Curriculum Inventory

- **15 parcours** : Al-Fātiḥah (`quran-vocabulary`) + 14 sourates courtes — `93, 94, 102, 103, 104, 105, 106, 107, 108, 109, 110, 112, 113, 114`.
- **270 formes distinctes** enseignées (valeur DB actuelle, confirmée).
- **14 522 occurrences** couvertes → **18,76 %** du texte.
- **Fréquence des formes enseignées** : min **1**, max **1 098**, **médiane 3**, moyenne **53,79**.
  - La médiane à 3 confirme une forte présence de formes rares (rangs 7 000+ et même 20 900+).

---

## D. Current Coverage

- Occurrences couvertes / totales : **14 522 / 77 430 = 18,76 %**.
- **Ayahs touchées** : **4 854 / 6 236 = 77,8 %** (au moins une forme enseignée présente dans le verset).
- **Sourates touchées** : **114 / 114**.
  - → Le curriculum « touche » presque tout le texte grâce aux mots-outils très fréquents (فِى, مِن, مَا, الله…), mais ne « couvre » qu'un cinquième des occurrences.

---

## E. Frequency Distribution

Seuils cumulatifs (formes triées par fréquence décroissante) :

| Couverture | Formes nécessaires | Occurrences |
|---|---:|---:|
| 10 % | **12** | 8 125 |
| 25 % | **67** | 19 399 |
| 50 % | **618** | 38 722 |
| 75 % | **4 559** | 58 074 |

Distribution très concentrée (Zipf) : 12 formes = 10 %, 618 formes = 50 %.

---

## F. Coverage Curve

Couverture si l'on enseignait les N formes les plus fréquentes :

| N formes | Occurrences | Couverture |
|---:|---:|---:|
| 10 | 7 054 | 9,11 % |
| 25 | 12 354 | 15,96 % |
| 50 | 17 104 | 22,09 % |
| 100 | 22 549 | 29,12 % |
| 200 | 28 317 | 36,57 % |
| 250 | 30 403 | 39,27 % |
| 300 | 32 135 | 41,50 % |
| 500 | 36 829 | 47,56 % |
| 1 000 | 43 134 | 55,71 % |

**⇒ 270 formes fréquentielles ≈ 40 %** contre **18,76 %** pour les 270 formes actuelles (ordre coranique).

---

## G. Marginal Yield

### G1. Ordre de fréquence (théorique optimal)

| Tranche | Δ couverture | Occurrences/forme |
|---|---:|---:|
| 0–10 | 9,11 % | ~705 |
| 10–25 | 6,85 % | ~353 |
| 25–50 | 6,13 % | ~190 |
| 50–100 | 7,03 % | ~109 |
| 100–200 | 7,45 % | ~57 |
| 200–250 | 2,70 % | ~42 |

### G2. Ordre d'enseignement actuel (mesuré)

| Tranche | Δ couverture | Occurrences/forme |
|---|---:|---:|
| 0–10 | 1,26 % | ~98 |
| 10–25 | 2,05 % | ~106 |
| 25–50 | 2,61 % | ~81 |
| 50–100 | 2,31 % | ~36 |
| 100–150 | 4,04 % | ~63 |
| 150–200 | 1,75 % | ~27 |
| 200–250 | 3,53 % | ~55 |

**⇒ L'ordre actuel a un rendement marginal très inférieur (médiane ~50 occ/forme) à l'ordre fréquentiel (705 occ/forme sur les 10 premières).** L'écart provient de la priorité donnée aux sourates récitées, pas d'un défaut technique.

---

## H. Current Order vs Frequency

- La **première leçon** (Al-Fātiḥah) introduit des formes majoritairement rares : بِسْمِ (3 occ, rang 3 688), مَـٰلِكِ (1 occ, rang 7 232), نَعْبُدُ (3 occ)… à l'exception de ٱللَّهِ (665 occ, rang 5).
- Les formes les plus fréquentes (فِى rang 1, ٱلَّذِينَ rang 2, مِن rang 3, مَا rang 4) sont enseignées **plus tard**, au fil des sourates.
- Aucune « anomalie » bloquante : c'est un **choix de conception** (récitation d'abord), pas une erreur.

---

## I. Missing High-Yield Forms

Top des formes **non enseignées** par fréquence (extrait) :

| Forme | Occ. | Rang | FR ? |
|---|---:|---:|---|
| لَا | 616 | 7 | ❌ EN_ONLY |
| ٱللَّهَ | 567 | 10 | ❌ |
| أَن | 461 | 13 | ❌ |
| قَالَ | 407 | 15 | ❌ |
| مّنَ | 281 | 20 | ❌ |
| ذَٰلِكَ | 267 | 21 | ❌ |
| أَوْ | 263 | 22 | ❌ |
| بِمَا | 253 | 23 | ❌ |
| إِن | 253 | 24 | ❌ |
| كَانُوا۟ | 209 | 33 | ❌ |
| لَهُمْ | 204 | 36 | ❌ |
| فِيهَا | 181 | 38 | ❌ |
| ٱلْأَرْضِ | 178 | 39 | ❌ |
| ٱلسَّمَـٰوَٰتِ | 174 | 41 | ❌ |
| قَالُوا۟ | 171 | 42 | ❌ |

Sur les **80 formes manquantes les plus fréquentes**, **78 sont `EN_ONLY`** (aucune traduction française directe ni par lemme). Seules وَٱللَّهُ (239) et بِٱللَّهِ (128) disposent d'un sens FR (via lemme).

---

## J. Lexical Validation Availability

- **Formes enseignées** : **265 / 270 (98,1 %)** ont un sens FR (direct ou lemme) ; **5** reposent sur le fallback EN (ex. كَانَ, 323 occ, enseigné sans FR).
- **Formes manquantes avec FR disponible** : **165 formes au total**, dont la couverture cumulée ne représente que **+1,45 %**.
  - Ce sont majoritairement des **flexions de رَبّ** (رَبِّى 61, رَبَّكَ 52, رَبَّنَا 40, رَبَّهِمْ 47…) et de **الله** (وَٱللَّهُ 239, بِٱللَّهِ 128, فَٱللَّهُ 6…).
- **Formes manquantes sans FR** : **21 026** (couverture cumulée +81,24 %).

**⇒ Le plafond de couverture est entièrement borné par le lexique français, pas par le curriculum.** Enrichir les 165 formes déjà-FR n'ajoute que 1,45 % ; tout le reste exige un travail lexical éditorial.

---

## K. Forms vs Lemmas

- Modèle **A — formes strictes** (Phase 37) conservé. `لِلَّه ≠ الله`, et les flexions رَبِّى/رَبَّكَ/رَبَّنَا restent **distinctes**.
- Le lemme sert **uniquement** de canal de sens (fallback via `word_lemma_mapping`), jamais de fusion de couverture.
- Risque de fusion : **aucun** dans la métrique. L'effet de bord est seulement que beaucoup de flexions « couvertes par un lemme » sont éparpillées sans contribution agrégée.

---

## L. Functional / Lexical Forms

- Les formes fonctionnelles dominent le haut de la fréquence : فِى, مِن, مَا, لَا, أَن, إِنَّ, إِلَّا, وَمَا, أَوْ, ثُمَّ…
- Le curriculum **enseigne déjà** les principales (فِى, مِن, مَا, إِنَّ, إِلَّا, وَمَا, ثُمَّ, عَلَىٰ…), mais **pas** لَا, أَن, أَوْ, إِنْ (les plus « grammaticales »).
- Leur rendement est **élevé en occurrences** mais **fragile en pédagogie isolée** (voir N).

---

## M. Pedagogical vs Frequency Analysis

La fréquence ne peut pas être le seul critère. Grille appliquée :

| Critère | Disponible ? | Source |
|---|---|---|
| Fréquence / occurrences | OUI | `word_occurrences` |
| Utilité (versets/sourates touchés) | OUI | `word_occurrences` × `ayahs` |
| Traduction FR fiable | OUI | `word_translations` / `lemma_translations` |
| Difficulté réelle | **NOT_AVAILABLE** | aucun signal mesuré |
| Polysémie / ambiguïté | **PARTIAL** | inférable manuellement, non structuré |
| Rétention par mot | **PARTIAL** | `user_word_skill_progress` (agrégé, non temporel) |

---

## N. Polysemy Risks

- Formes fonctionnelles à fort risque d'ambiguïté isolée : **لَا** (négation, mais aussi « non/ne…pas/il n'y a »), **أَن** (« que/de », complétive), **إِنْ** (« si »), **مِنْ/mّنَ** (variantes orthographiques de « de/parmi »).
- Le corpus présente des **variantes orthographiques d'une même préposition** (مِن n=728 / مِنَ n=412 / مّن n=372 / مّنَ n=281 / مِنْ n=253 / مِنۢ n=131) — un apprenant les voit comme 6 « mots » différents alors que c'est le même outil. Le modèle formes-strictes les sépare (correct pour la couverture), mais une pédagogie naïve « une forme = un sens » risque de les présenter de façon redondante.
- **Recommandation** : enseigner prioritairement les **formes lexicales sémantiquement stables** (قَالَ, ذَٰلِكَ, أَوْ, الأَرْض, السَّمَاء, يَوْم, كُلّ, الدُّنْيَا, يُؤْمِنُونَ…) avant les particules purement grammaticales.

---

## O. Surah Coverage

- **114 / 114** sourates touchées (grâce aux mots-outils).
- **15 sourates** ont un parcours dédié : Al-Fātiḥah + `93, 94, 102–110, 112, 113, 114`.
- Les sourates longues (2, 3, 4, 5…) **n'ont pas de parcours** : elles ne sont « touchées » que par les mots fréquents, pas enseignées sourate par sourate.
- Aucun biais problématique, mais la couverture **concentrée par sourate** est faible hors des 15 sourates courtes.

---

## P. Ayah Coverage

- **4 854 / 6 236 (77,8 %)** des versets contiennent ≥ 1 forme enseignée.
- ⚠️ Rappel (métrique lexicale) : « un verset contient un mot connu » **≠** « l'utilisateur comprend le verset ». Ne pas présenter 77,8 % comme une compréhension.

---

## Q. Occurrence Coverage

- Métrique principale (Phase 37) conservée : **14 522 / 77 430 = 18,76 %**.
- Compléments (non substitués) : formes couvertes **270/21 296**, ayahs **77,8 %**, sourates **100 %**.

---

## R. Teaching Order

Ordre réel (extrait, 15 premières formes) : بِسْمِ, ٱللَّهِ, ٱلرَّحْمَـٰنِ, ٱلرَّحِيمِ, ٱلْحَمْدُ, لِلَّهِ, رَبِّ, ٱلْعَـٰلَمِينَ, مَـٰلِكِ, يَوْمِ, ٱلدِّينِ, إِيَّاكَ, نَعْبُدُ, وَإِيَّاكَ, نَسْتَعِينُ…

= **Al-Fātiḥah verset par verset**, puis Ad-Duha (93), etc. **Aucun réordonnancement par fréquence.**

---

## S. 270-Form Progression

| Tranche (ordre d'enseignement) | Δ occ. | Couverture cumulée | Fréq. médiane de la tranche |
|---|---:|---:|---:|
| 1–10 | 976 | 1,26 % | faible (surtout hapax + الله) |
| 11–25 | 1 586 | 3,31 % | faible |
| 26–50 | 2 023 | 5,92 % | faible |
| 51–100 | 1 788 | 8,23 % | faible |
| 101–150 | 3 129 | 12,27 % | moyenne |
| 151–200 | 1 356 | 14,02 % | faible |
| 201–250 | 2 733 | 17,55 % | moyenne |
| 251–270 | (reste) | **18,76 %** | — |

Le palier à ~100–150 formes marque l'arrivée des sourates contenant plus de mots-outils (103, 104, 105…), mais le rendement reste bien en deçà de l'optimal fréquentiel.

---

## T. User Progress vs Curriculum Potential

- **Potentiel théorique** (plafond curriculum) : 18,76 % de couverture si l'utilisateur maîtrise les 270 formes.
- **Progression réelle** : mesurée par `user_word_progress.status` (la métrique de couverture de Phase 37 l'utilise). Le dashboard affiche la couverture **réelle** de l'utilisateur, pas le plafond.
- Données d'abandon / de mots souvent renforcés / rarement maîtrisés : **non analysées** dans cette phase (lecture possible via `user_word_skill_progress`, mais sans causalité — laissé en `PARTIAL`).

---

## U. SRS Interaction

- Nouveaux mots → apprentissage → mastery → review (`review_items` + Leitner) → nouvelle sélection par `sort_order`.
- **Aucune interaction corrective** : le curriculum n'introduit pas « trop » de nouveaux mots en fonction du SRS, et `selectActiveLearningPath` ne tient **pas** compte des révisions dues (elles sont composées par le Daily Plan sans priorité contradictoire — décision 38A validée).
- Risque documenté (non bloquant) : une nouvelle leçon peut être proposée alors que des révisions sont dues ; le Daily Plan présente les deux sans imposer une priorité artificielle.

---

## V. Daily Plan Interaction

- `composeDailyPlan` reçoit la décision de `selectActiveLearningPath` et la présente. Aucun recalcul.
- **Cohérent** : la « prochaine action » est bien la leçon suivante du curriculum, jamais une sur-optimisation.
- Pas d'incohérence détectée.

---

## W. First-Lesson Efficiency

- Al-Fātiḥah : **26 formes distinctes**, **1,26 %** de couverture cumulée après 10 formes.
- **Couverture faible** (sourate de formules rares), **valeur de récitation maximale** (la sourate la plus récitée). Trade-off **assumé et défendable**.
- Le premier mot de la basmala (ٱللَّهِ, 665 occ) atténue le coût : la première leçon contient quand même une forme du top 5.

---

## X. Coverage Thresholds

| Seuil | Formes nécessaires (fréquentiel) | Atteignable par le curriculum actuel ? |
|---|---:|---|
| 1 % | ~1–2 | OUI (plafond 18,76 %) |
| 5 % | ~30 | OUI |
| 10 % | ~12 | OUI |
| 25 % | ~67 | NON (plafond 18,76 %) |
| 50 % | ~618 | NON — `NOT_CURRENTLY_REACHABLE` |
| 75 % | ~4 559 | NON — `NOT_CURRENTLY_REACHABLE` |

Aucune date d'atteinte promise. Aucun nouvel objectif utilisateur.

---

## Y. Candidate Ranking

### P1 — actionnable immédiatement (FR déjà disponible, aucun moteur à changer)

Formes manquantes disposant déjà d'un sens FR (par lemme) : **165 formes**, surtout des flexions de الله et رَبّ — ex. وَٱللَّهُ (239), بِٱللَّهِ (128), رَبِّى (61), رَبَّكَ (52), رَبَّنَا (40), رَبَّهِمْ (47). Gain cumulé faible (**+1,45 %**) mais **zéro blocage lexical**.

### P2 — fort rendement, nécessite un enrichissement lexical FR

Formes lexicales fréquentes, sémantiquement stables, aujourd'hui `EN_ONLY` :

| Forme | Occ. | Statut |
|---|---:|---|
| قَالَ | 407 | EN_ONLY → à traduire |
| ذَٰلِكَ | 267 | EN_ONLY |
| أَوْ | 263 | EN_ONLY |
| ٱلْأَرْضِ | 178 | EN_ONLY |
| ٱلسَّمَـٰوَٰتِ | 174 | EN_ONLY |
| كَفَرُوا۟ | 156 | EN_ONLY |
| يَوْمَ | 131 | EN_ONLY |
| كُلِّ | 123 | EN_ONLY |
| شَىْءٍۢ | 99 | EN_ONLY |
| ٱلدُّنْيَا | 87 | EN_ONLY |
| يُؤْمِنُونَ | 86 | EN_ONLY |
| كِتَـٰبَ/كِتَـٰبِ | 74+73 | EN_ONLY |
| سَبِيلِ | 72 | EN_ONLY |
| بَيْنَ | 70 | EN_ONLY |

### BLOCKED_LEXICAL_DATA / P3 — particules grammaticales polysémiques

لَا, أَن, إِنْ, مِنْ/mّنَ (variantes), بِمَا, فَمَا, إِنَّمَا, لَّمْ, قَدْ — fréquents mais **ambiguës hors contexte** ; enseignement isolé fragile. À traiter **après** le P2, avec une stratégie de sens contextuel.

---

## Z. Removal Candidates

Aucun retrait recommandé en bloc. Signaux à **`REVIEW_REQUIRED`** (ne pas appliquer) :

- Les ~5 formes enseignées reposant sur le **fallback EN** (ex. كَانَ) : vérifier si un sens FR est ajoutable, sinon les conserver avec `isFallback` (déjà géré).
- Les formes **hapax** (1 occurrence, rang > 7 000) : pédagogiquement légitimes dans leurs sourates récitées, mais à ne pas multiplier sans contrôle de rendement.

---

## AA. Missing Data

| Donnée | Statut |
|---|---|
| Fréquence / occurrences | AVAILABLE |
| Traduction FR validée | AVAILABLE (mais partielle : 263 formes directes) |
| Difficulté réelle | NOT_AVAILABLE |
| Taux de rétention par mot (temporel) | PARTIAL |
| Compréhension contextuelle | NOT_AVAILABLE |
| Historique de couverture | REQUIRES_NEW_DATA |
| Erreurs sémantiques normalisées | NOT_AVAILABLE |

---

## AB. Product Alignment

- L'objectif Hikma est **« comprendre ce que l'on récite »**, pas « maximiser le % du texte ». L'ordre coranique sert **directement** cet objectif.
- Une optimisation purement fréquentielle **dégraderait** la proposition de valeur (on apprendrait des particules avant les mots des sourates récitées).
- **Risque de sur-optimisation documenté** : trop de particules, manque de vocabulaire sémantique, polysémie, perte du contexte de récitation.

---

## AC. Recommendations

| P | Action | Type | Migration |
|---|---|---|---|
| **P0** | Aucune correction bloquante. | — | — |
| **P1** | **Enrichissement lexical FR** des ~15–25 formes lexicales fréquentes du P2 (قَالَ, ذَٰلِكَ, أَوْ, الأَرْض, السَّمَاء, يَوْم, كُلّ, الدُّنْيَا, يُؤْمِنُونَ, كَفَرُوا۟, كِتَاب, سَبِيل, بَيْنَ…) — **phase de données éditoriales**, jamais de moteur. | données | **0** (insert `word_translations`) |
| **P2** | Intégrer les 165 formes déjà-FR (الله/رَبّ flexions) si une leçon/sourate les contient naturellement. | données | 0 |
| **P3** | Stratégie de sens **contextuel** pour les particules grammaticales (لَا, أَن, إِنْ…). | recherche | 0 |
| **REVIEW_REQUIRED** | Remplacer les 5 fallbacks EN par du FR. | données | 0 |
| **REJECT** | Réordonner le curriculum par fréquence ; fusion des lemmes ; XP/badges/streak ; nouveau moteur SRS/priorité ; IA ; langues supplémentaires. | — | — |

---

## AD. Proposed Phase 40B

**Une seule phase logique : « enrichissement lexical éditorial des formes fréquentes manquantes »** (P1, **0 migration**, aucun changement de moteur).

1. Sélectionner les ~20 formes lexicales fréquentes du P2 (priorité : occurrences + stabilité sémantique + absence d'ambiguïté).
2. Produire les traductions FR validées (workflow `proposed → validated`, `is_validated = true` + `validated_at`), comme les phases lexicales précédentes.
3. Les intégrer au curriculum **uniquement** là où elles apparaissent naturellement (pas de leçon artificielle), ou les laisser disponibles pour les futures sourates.
4. Recalculer la couverture et le plafond curriculum ; ne **rien** promettre à l'utilisateur avant mesure.

**Stop** — aucune implémentation avant validation explicite du rapport 40A et du périmètre exact des traductions.

---

## Verdict

| Élément | État | Justification |
|---|---|---|
| Curriculum actuel | HEALTHY | sourates récitées, 98,1 % FR, structure valide |
| Ordre des mots | HEALTHY | ordre coranique assumé (identité produit) |
| Fréquence | OPTIMIZABLE | médiane 3 occ ; rendement << optimal fréquentiel |
| Couverture | PARTIAL | 18,76 % occurrences ; 77,8 % ayahs ; 100 % sourates |
| Rendement marginal | OPTIMIZABLE | ~50 occ/forme vs ~700 en début fréquentiel |
| Formes prioritaires manquantes | BLOCKED_LEXICAL_DATA | 78/80 top manquantes = EN_ONLY |
| Traductions FR | PARTIAL | 98,1 % des enseignées ; 165 formes FR non enseignées (+1,45 %) |
| Lemmatisation | HEALTHY | canal de sens uniquement, jamais fusion |
| Mots fonctionnels | PARTIAL | principaux enseignés ; لَا/أَن/أَوْ/إِنْ absents |
| Polysémie | REVIEW_REQUIRED | particules à stratégie contextuelle |
| Interaction SRS | HEALTHY | une seule source, pas de conflit bloquant |
| Interaction Daily Plan | HEALTHY | compose sans recalculer |
| Première leçon | HEALTHY | faible couverture, forte valeur de récitation |
| Historique couverture | REQUIRES_NEW_DATA | (rappel Phase 39A) |
| Difficulté | NOT_AVAILABLE | aucun signal |
| Rétention | PARTIAL | agrégée, non temporelle |

**Décision : `PHASE_40A_AUDIT_COMPLETE`** — le curriculum est sain mais son plafond de couverture est borné par les données lexicales, pas par sa structure. **STOP — aucune implémentation de Phase 40B sans validation explicite.**
