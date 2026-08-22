# PHASE 16N — AUDIT JURIDIQUE, PROVENANCE ET QUALITÉ DE LA SOURCE Tarteel/QUL (traduction mot-à-mot FR)

## STATUT

**READ_ONLY** — audit uniquement.

**DECISION: LICENSE_UNKNOWN** (indice secondaire : `NOT_A_LEXICAL_SOURCE` pour les mots grammaticaux).

---

## Résumé exécutif

La traduction mot-à-mot française du Coran téléchargée depuis **Tarteel / QUL** est techniquement **parfaite** (77 429 entrées, 114 sourates, 6 236 versets, mapping 1:1 avec les `word_occurrences` de Hikma). Mais **la licence des données n'est pas établie** : le dépôt QUL est **MIT** pour le **code**, les **données** sont sous licences **par-dataset** (FAQ QUL explicite), la **ressource « French wbw translation » (id 95) n'a AUCUNE licence/source/copyright déclarés**, et son **amont est QuranWBW.com**, un projet communautaire **sans licence** (repo GitHub `license=null`, aucun fichier LICENSE). Conclusion : **LICENSE_UNKNOWN** — rien n'autorise un usage commercial/SaaS/stockage/dérivés. Secondairement, pour les mots grammaticaux (فِي, لَا, كَان) la donnée est une **traduction contextuelle, pas une source lexicale**.

---

## A. Baseline (mesurée, identique début/fin)

quran_words **21 296** · word_occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (validated **8** / proposed **14** / rejected **0**) · lemma_id **135** · root **0** · sources **2** · migration **0020**. 8 gloses validées intactes.

## B. Identification de la source

| Élément | Valeur |
|---|---|
| Nom du dépôt | `TarteelAI/quranic-universal-library` (QUL — Quranic Universal Library) |
| Organisation | Tarteel, Inc |
| URL | https://github.com/TarteelAI/quranic-universal-library |
| Ressource | « French wbw translation » — id **95** — https://qul.tarteel.ai/resources/translation/95 |
| Fichier | `french-wbw-translation.json` |
| Format | objet JSON plat clé→valeur |
| Clé | `sourate:verset:position_mot` |
| Taille | 2 051 237 octets (~2,0 Mo) |
| SHA-256 | `c3848a99db082b7966b2ffcd3da7c747a173236dc8b576935fb75379e84dd554` |
| Entrées | 77 429 · 114 sourates · 6 236 versets |

## C. Dépôt / version / commit

Non relevé (commit exact du fichier exporté non traçable depuis le JSON plat ; l'export ne porte pas d'en-tête de version). **UNKNOWN** — à requérir si la licence est un jour résolue.

## D. Licence du code

**MIT** — `LICENSE` racine : « Copyright (c) 2024-present Tarteel, Inc ». **CONFIRMED**, mais ne couvre que le *software* (« this software and associated documentation files »).

## E. Licence des données (QUL général)

**PAR-DATASET** — la FAQ officielle répond littéralement :
> « **Can I use QUL data commercially?** Check repository license terms and **dataset-specific licensing details** before production use. »

Et les crédits : « **La majorité des ressources de QUL ont été créées ou curatées par la communauté, pas par Tarteel.** »

## F. Licence de la traduction française (la ressource elle-même)

**ABSENTE / UNKNOWN.** La page `/resources/translation/95` ne contient **aucun** champ `license`, `source`, `copyright` ni mention d'attribution. Contraste probant : les WBW **allemand** et **russe** de QUL sont marqués « **This resource is © copyrighted** », la ressource **française ne l'est pas** — ce qui signifie soit « ouverte mais non documentée », soit « non renseignée ». Strictement : **UNKNOWN**, jamais « libre ».

## G. Provenance de la traduction française

| Couche | Source | Statut |
|---|---|---|
| Code/plateforme | Tarteel (MIT) | CONFIRMED |
| Traductions WBW | **QuranWBW.com** (crédits QUL : « *QuranWBW.com — For providing word-by-word translations in multiple languages* ») | source amont identifiée |
| Auteur/licence de la glose FR | non documenté | **UNKNOWN** |
| Dérivation Quran.com/QF | non établie (QUL crédite Quran.com séparément comme « gathering place ») | NOT_CONFIRMED |

→ La traduction française **n'est pas une création documentée de Tarteel** ; son auteur et sa licence effectifs sont inconnus.

## H–L. Usage commercial / SaaS / stockage / dérivés / redistribution

| Droit | Statut |
|---|---|
| Usage commercial | **NOT_CONFIRMED** |
| SaaS | NOT_CONFIRMED |
| Stockage permanent | NOT_CONFIRMED |
| Modification / transformation | NOT_CONFIRMED |
| Données dérivées | NOT_CONFIRMED |
| Redistribution / affichage | NOT_CONFIRMED |
| Attribution requise | UNKNOWN |

Aucune permission explicite trouvée. Le guide QUL « Downloading and Using Data » encourage techniquement l'import en production (« Import into your database for production workloads »), mais **ce n'est pas une licence** et la FAQ renvoie explicitement aux conditions par-dataset.

## M. Nature linguistique

**MIXED.**

| Type | Exemple | Verdict |
|---|---|---|
| Nom à sens stable | أَرْض → « la terre » (291 occ.), رَسُول → « Messager » (52), عَذَاب → « châtiment » (150), رَحْمَة → « miséricorde » (34), نَاس → « les gens » (182), نَبِيّ → « Prophète » (30), يَوْم → « Jour » (217) | **LEXICAL (cœur stable)** mais surface contextualisée (articles, parenthèses, casse, ponctuation) |
| Nom polysémique | عَبْد → « esclave » (5), كِتَاب → « Livre/écrit/prescription » (47), كَفَر → « mécru/ingrat » (18) | MIXED — nécessite revue |
| Mot grammatical | فِي → « dans/vers/en/sur… » (1098 occ., **55 gloses distinctes**), لَا → « ne/ne pas… » (749 occ., **66 gloses**), كَان → « est/était/a été/fabriquaient… » (323 occ., **58 gloses**) | **CONTEXTUAL_WBW — PAS lexical** |

## N. Analyse des 20 exemples (synthèse)

Les exemples couvrent noms, verbes, particules, formes fléchies et mots polysémiques. Constat : la valeur FR est une **traduction dépendante du verset**, avec désambiguïsation contextuelle et ajouts grammaticalux entre parenthèses. Une valeur comme `1:1:1 → "(Je lis) avec (Le) Nom"` **n'est pas une définition lexicale** de `بِسْمِ` ; elle est la glose contextuelle du mot **dans ce verset**. Une glose courte stable n'est extractible **que pour les noms à sens stable**, et même alors via une **adaptation éditoriale** (pas une citation).

## O. Analyse des 14 lemmas (READ-ONLY)

| Lemma | Occurrences liées | Gloses FR distinctes | Cœur observé | Nature |
|---|---|---|---|---|
| يَوْم | 217 | 29 | Jour/jour | nom stable |
| عَبْد | 5 | 4 | esclave | polysémique (esclave/serviteur) |
| رَسُول | 52 | 14 | Messager | nom stable |
| نَاس | 182 | 23 | les gens | nom stable |
| قَوْم | 79 | 12 | peuple / gens | nom stable (2 sens proches) |
| عَذَاب | 150 | 12 | châtiment | nom stable |
| رَحْمَة | 34 | 16 | miséricorde | nom stable |
| نَبِيّ | 30 | 8 | Prophète | nom stable |
| فِي | 1098 | 55 | — | préposition contextuelle |
| لَا | 749 | 66 | — | particule contextuelle |
| أَرْض | 291 | 27 | terre | nom stable |
| كِتَاب | 47 | 21 | — | polysémique (Livre/écrit/prescription) |
| كَان | 323 | 58 | — | verbe copule contextuel |
| كَفَر | 18 | 9 | — | polysémique (mécroire/ingratitude) |

→ Les **8 noms stables** (يَوْم, رَسُول, نَاس, قَوْم, عَذَاب, رَحْمَة, نَبِيّ, أَرْض) pourraient alimenter des **propositions** de gloses (jamais validées). **عَبْد, كِتَاب, كَفَر** nécessitent une revue spécialisée. **فِي, لَا, كَان** sont inexploitables comme source lexicale (traduction contextuelle).

## P. Mapping 77 429 / 77 430 — écart identifié EXACTEMENT

| Mesure | Valeur |
|---|---|
| Clés Hikma (mappées) | **77 430** |
| Clés Tarteel | **77 429** |
| Présent dans Hikma, absent de Tarteel | **1 → `2:181:14`** |
| Présent dans Tarteel, absent de Hikma | **0** |

**Origine exacte** : Hikma tokenise, comme 14ᵉ « mot » du verset 2:181, le **numéro de verset imprimé « ١٨١ »** (le jeton arabe du chiffre 181), alors que Tarteel/QUL exclut ce marqueur. Le verset 2:181 se termine en Hikma par : `… سَمِيعٌ (12) عَلِيمٌ (13) ١٨١ (14)`. **L'écart est donc un jeton non lexical, pas une traduction française manquante.** Les **77 429 autres positions se mappent 1:1**.

## Q. Comparaison Kazimirski vs Tarteel/QUL WBW FR

| Critère | Kazimirski 1860 | Tarteel/QUL WBW FR |
|---|---|---|
| Nature | dictionnaire lexical (définitions) | traduction WBW contextuelle |
| Licence | œuvre PD, mais reproduction BnF = LEGAL_REVIEW_REQUIRED | données = **UNKNOWN** |
| Provenance | éd. 1860 (auteur 1808–1887) | QuranWBW.com (communautaire, sans licence) |
| Qualité lexicographique | excellente (lexicale) | bonne pour les noms, contextuelle pour le reste |
| Couverture | complète (dictionnaire) | 100 % du Coran (77 429 mots) |
| Stabilité des gloses | stable | stable (noms) / instable (mots grammaticaux) |
| Extraction | OCR difficile | triviale (JSON) |
| Usage commercial | LEGAL_REVIEW_REQUIRED | NOT_CONFIRMED |

**Ni l'une ni l'autre n'est aujourd'hui un canal `GO`.** Kazimirski bloque sur la reproduction BnF ; Tarteel/QUL bloque sur la licence des données.

## R. Risques

1. **Juridique** : licence des données FR non établie → usage commercial à risque.
2. **Provenance** : amont communautaire (QuranWBW.com) sans licence → contamination possible du référentiel.
3. **Linguistique** : mots grammaticaux non lexicaux ; noms contextualisés ; 3 mots polysémiques.
4. **Technique** : mapping parfait sauf 1 jeton (2:181:14) — sans conséquence pour une source lexicale.

## S. Classification finale

**LICENSE_UNKNOWN**
- Secondaire : `NOT_A_LEXICAL_SOURCE` pour فِي / لَا / كَان.
- Secondaire : `DERIVATION_RESTRICTED` (provenance communautaire sans licence).

## T. Recommandations

1. **Ne pas importer** tant que la licence des données n'est pas résolue.
2. Demander la **licence effective** de la traduction française (QUL → QuranWBW.com) : usage commercial + stockage + dérivés + redistribution.
3. Si licence confirmée compatible : la source peut servir de **propositions** de gloses pour les **noms stables** (jamais de validation automatique, revue humaine + spécialiste pour عَبْد/كِتَاب/كَفَر).
4. **Exclure** فِي / لَا / كَان de toute extraction lexicale (contexte seulement).

## U. Preuve de non-écriture

Aucune écriture, aucune migration (dernière = 0020), aucun seed, aucune modification de `lemmas` / `word_translations` / `quran_words` / `sources`. La source Tarteel/QUL **n'est pas enregistrée en base**.

## V. Tests

| Commande | Résultat |
|---|---|
| npm test | 172/172 ✅ |
| npx tsc --noEmit | 0 erreur ✅ |
| npm run lint | 0 erreur ✅ |
| npm run build | 0 erreur ✅ |
| npm run verify:persistence | 13/13 ✅ |
| npm run verify:rls | 27/27 ✅ |

## W. Non-régression

Baseline identique début/fin (section A) · 8 gloses intactes · 14 lemmas `proposed` · root 0 · sources 2 · migration 0020.

---

## Réponses aux 5 questions (§20)

1. **Licence des données QUL utilisées (FR) ?** → **UNKNOWN**. MIT = code seul ; la ressource FR WBW n'a aucune licence déclarée ; l'amont QuranWBW.com est sans licence.
2. **D'où provient la traduction FR ?** → **QuranWBW.com** (projet communautaire), relayé par QUL/Tarteel. Auteur et licence effectifs non documentés.
3. **Usage commercial/SaaS/stockage/gloses dérivées autorisés ?** → **NOT_CONFIRMED** (aucune permission trouvée).
4. **77 429 entrées exploitables comme source lexicale ?** → **MIXED** : oui (sous réserve de licence) pour les noms stables ; **non** pour les mots grammaticaux.
5. **Origine de l'écart 77 429 vs 77 430 ?** → Hikma possède **1 jeton de plus** : le numéro de verset « **١٨١** » en **2:181:14** (marqueur non lexical absent de Tarteel).

---

## Livrables

- 📄 `PHASE_16N_TARTEEL_QUL_FR_SOURCE_AUDIT.md` (ce rapport)
- 📄 `tmp/phase16n-tarteel-qul-fr-audit.json` (marqué « DOCUMENTARY ONLY · NOT VALIDATED · NOT IMPORTED · NO DATABASE WRITES »)

---

**LICENSE_UNKNOWN** · **PHASE 16N — ARRÊT OBLIGATOIRE.** Aucune écriture, aucun import, aucune glose créée, aucun statut modifié, aucune donnée inventée.
