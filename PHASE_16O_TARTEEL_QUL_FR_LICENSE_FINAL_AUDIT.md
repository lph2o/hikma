# PHASE 16O — AUDIT FINAL DE LICENCE — Tarteel/QUL « French wbw translation »

## A. Statut de phase

**READ_ONLY** — audit de licence uniquement.

**DECISION: LICENSE_UNKNOWN → STOP_SOURCE**

---

## Résumé exécutif

Après recherche dans les **sources primaires** (dépôt QUL, page de la ressource, FAQ QUL, crédits QUL, dépôt GitHub de QuranWBW.com, README et historique du projet), **aucune licence effective n'a été trouvée pour la traduction mot-à-mot française**, à aucune couche de la chaîne de provenance :

> **QUL/Tarteel (dataset FR, id 95)** — aucune licence/source/copyright déclarés →
> **QuranWBW.com** (projet individuel « qazasaz », GitHub `license=null`, aucun fichier LICENSE) →
> **seventysixnine.com / quran.com / tanzil.net** (sources créditées, sans licence attachée à la traduction FR).

Le fait que le dépôt QUL soit **MIT** concerne uniquement le **code** (texte MIT : « this **software** … ») et la FAQ QUL renvoie explicitement à des **licences par dataset**. L'absence de la mention « © copyrighted » sur la ressource française (contrairement aux WBW allemand/russe) **ne constitue pas une autorisation**. **Techniquement excellent, juridiquement inutilisable en l'état.**

---

## B. Baseline (mesurée, identique début/fin)

quran_words **21 296** · word_occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (validated **8** / proposed **14** / rejected **0**) · lemma_id **135** · root **0** · sources **2** · migration **0020**. 8 gloses validées intactes.

## C. Source auditée

- Dépôt : `TarteelAI/quranic-universal-library` (QUL).
- Ressource : **French wbw translation**, id **95** — `https://qul.tarteel.ai/resources/translation/95`.
- Fichier : `french-wbw-translation.json` (2 051 237 octets).
- SHA-256 : `c3848a99db082b7966b2ffcd3da7c747a173236dc8b576935fb75379e84dd554`.

## D. Identité du dataset

77 429 entrées · 114 sourates · 6 236 versets · clé `sourate:verset:position_mot` · valeurs = gloses françaises contextualisées.

## E. Licence du code QUL

**MIT** — `LICENSE` : « Copyright (c) 2024-present Tarteel, Inc … this software and associated documentation files ». **CONFIRMED**, mais limité au software.

## F. Licence du dataset FR

**ABSENTE.** La page `/resources/translation/95` ne contient aucun champ `license`, `source`, `copyright`, `attribution`. Contraste : les WBW **allemand** et **russe** de QUL portent « **This resource is © copyrighted** » ; le français non. Strictement : **UNKNOWN** (jamais « libre »).

## G. Provenance QuranWBW.com

Crédits QUL : « **QuranWBW.com — For providing word-by-word translations in multiple languages.** » → les WBW de QUL proviennent de QuranWBW.com.

## H. Auteur / détenteur des droits

| Couche | Identité | Statut |
|---|---|---|
| Plateforme quranwbw.com | utilisateur GitHub **qazasaz** (contact `quranwbw@gmail.com`) | IDENTIFIÉ |
| Auteur de la **traduction FR** | — | **NON IDENTIFIÉ** |
| Base de mots WBW | **seventysixnine.com** (crédité) | tiers non audité |
| API / audio WBW | **quran.com** (crédité) | tiers |
| Texte arabe | **tanzil.net** (crédité) | tiers |

→ Le détenteur des droits sur la **traduction française** n'est pas identifié, et aucune licence n'est publiée.

## I. Conditions commerciales

**Aucune** condition trouvée autorisant un usage commercial. FAQ QUL : « *Can I use QUL data commercially? Check repository license terms and dataset-specific licensing details before production use.* »

## J. SaaS / stockage / dérivés

| Droit | Statut |
|---|---|
| Utilisation interne | NOT_CONFIRMED |
| Stockage permanent | NOT_CONFIRMED |
| Transformation | NOT_CONFIRMED |
| Données dérivées | NOT_CONFIRMED |
| Affichage aux utilisateurs | NOT_CONFIRMED |
| Redistribution | NOT_CONFIRMED |
| SaaS payant | NOT_CONFIRMED |

## K. Redistribution / affichage

Aucune autorisation trouvée. « Téléchargeable publiquement » ≠ « redistribuable commercialement ».

## L. Historique Git / provenance

- `qazasaz/quranwbw` : **license = null**, aucun fichier `LICENSE`/`COPYING`.
- README : projet **individuel** (« made with the desire to help others and myself »), version statique générée depuis une base backend.
- Org GitHub `quranwbw` (qpc-fonts, word-highlighter, tracker) : tous **no-license**.
- Compte `qazasaz` : majorité des repos **no-license**.

## M. Recherche de copies secondaires

Aucune copie secondaire n'ajoute de droit. Le principe reste : **une copie sans licence n'accorde rien**. (La provenance remonte à QuranWBW.com, lui-même sans licence.)

## N. Recherche de licence explicite

**Aucune licence explicite trouvée** (ni CC0, ni CC BY, ni CC BY-SA, ni ODbL, ni permission écrite) pour la donnée FR, ni chez QUL, ni chez QuranWBW.com.

## O. Résultats linguistiques déjà établis (Phase 16N, rappel)

- **Noms stables** (potentiellement exploitables en PROPOSITIONS si licence résolue) : يَوْم · رَسُول · نَاس · قَوْم · عَذَاب · رَحْمَة · نَبِيّ · أَرْض.
- **Polysémiques** (spécialiste obligatoire) : عَبْد · كِتَاب · كَفَر.
- **Grammaticaux** (non lexicaux) : فِي (55 gloses) · لَا (66) · كَان (58).

## P. Mapping technique (rappel)

Tarteel **77 429** vs Hikma **77 430** ; écart exact = Hikma tokenise le numéro de verset « **١٨١** » en **2:181:14** ; les 77 429 autres positions mappent 1:1.

## Q. Matrice des preuves

| Claim | Source | Evidence | Date | Status |
|---|---|---|---|---|
| Code QUL = MIT | LICENSE QUL | « this software … MIT » | 2026-08-14 | CONFIRMED |
| MIT ≠ données | FAQ QUL | « dataset-specific licensing details » | 2026-08-14 | CONFIRMED |
| Données = communauté | Crédits QUL | « created or curated by the community, not Tarteel » | 2026-08-14 | CONFIRMED |
| WBW ← QuranWBW.com | Crédits QUL | « QuranWBW.com — … word-by-word translations » | 2026-08-14 | CONFIRMED |
| Ressource FR sans licence | page id 95 | aucun champ license/copyright/source | 2026-08-14 | CONFIRMED (absence) |
| quranwbw.com sans licence | GitHub qazasaz/quranwbw | license=null, pas de LICENSE | 2026-08-14 | CONFIRMED |
| Mots DB = seventysixnine.com | README quranwbw | section Credits | 2026-08-14 | CONFIRMED |
| quran.com = API/audio (pas les trad. FR) | README quranwbw | « API and word-by-word audio files » | 2026-08-14 | CONFIRMED |
| Auteur/licence de la traduction FR | toutes sources | rien trouvé | 2026-08-14 | NOT_CONFIRMED |
| Dépendance Quran.com/QF de la FR | sources primaires | non démontrée | 2026-08-14 | NOT_CONFIRMED |
| Autorisation commerciale | toutes sources | rien trouvé | 2026-08-14 | NOT_CONFIRMED |

## R. Analyse des contradictions éventuelles

- Le guide QUL « Downloading and Using Data » invite techniquement à « *Import into your database for production workloads* » — **mais ce n'est pas une licence** ; la FAQ renvoie aux conditions par-dataset. **CONTRADICTION APPARENTE** entre l'usage technique encouragé et l'absence de licence → **REVIEW_REQUIRED** (à trancher par un humain/juriste, pas interprété ici).

## S. Classification finale

**LICENSE_UNKNOWN**
- Secondaire : `SOURCE_PROVENANCE_UNRESOLVED` (auteur de la traduction FR non identifié).
- Secondaire : `RIGHTS_HOLDER_NOT_CLEARLY_IDENTIFIED`.

## T. Recommandation

1. **STOP_SOURCE** — ne pas utiliser cette donnée comme source lexicale tant que sa licence n'est pas établie.
2. **Ne pas importer**, ne pas créer de glose, ne pas enregistrer de source.
3. Pour débloquer un jour : obtenir une **licence écrite** du détenteur effectif (à identifier : auteur des gloses FR via QuranWBW.com `quranwbw@gmail.com`, ou Tarteel/QUL si elle le redistribue sous licence) couvrant explicitement **usage commercial + stockage + dérivés + redistribution + SaaS**.
4. En attendant : la piste **Kazimirski 1860** reste la référence lexicale (statut `LEGAL_REVIEW_REQUIRED` sur la reproduction BnF).

## U. Ce qui reste humain

- Décision de licence/projet (contacter le détenteur, ou renoncer) — décision **propriétaire**, pas linguistique.
- Revue linguistique (jamais par le propriétaire seul) pour les 14 unités le moment venu.

## V. Preuve de non-écriture

Aucune écriture, aucune migration (dernière = 0020), aucun seed, aucune modification de `lemmas` / `word_translations` / `quran_words` / `sources`. Source Tarteel/QUL **non enregistrée en base**.

## W. Tests

| Commande | Résultat |
|---|---|
| npm test | 172/172 ✅ |
| npx tsc --noEmit | 0 erreur ✅ |
| npm run lint | 0 erreur ✅ |
| npm run build | 0 erreur ✅ |
| npm run verify:persistence | 13/13 ✅ |
| npm run verify:rls | 27/27 ✅ |

## X. Décision finale

**LICENSE_UNKNOWN → STOP_SOURCE**

La source est **techniquement excellente** (couverture totale, mapping 1:1, extraction triviale) mais **juridiquement inutilisable en l'état** : la licence effective de la traduction française n'existe pas dans les sources primaires consultées, l'auteur des gloses FR n'est pas identifié, et aucune permission commerciale n'est documentée. Le MIT du code QUL ne couvre pas les données ; l'absence de mention « copyrighted » n'est pas une autorisation ; « open source » n'est pas synonyme de « commercialement réutilisable ».

---

## Livrables

- 📄 `PHASE_16O_TARTEEL_QUL_FR_LICENSE_FINAL_AUDIT.md` (ce rapport)
- 📄 `tmp/phase16o-tarteel-qul-license-evidence.json` (marqué « DOCUMENTARY ONLY · NOT VALIDATED · NOT IMPORTED · NO DATABASE WRITES »)

---

**LICENSE_UNKNOWN → STOP_SOURCE** · **PHASE 16O — ARRÊT OBLIGATOIRE.** Aucune écriture, aucun import, aucune glose créée, aucun statut modifié, aucune donnée inventée.
