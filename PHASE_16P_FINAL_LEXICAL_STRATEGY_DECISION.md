# PHASE 16P — DÉCISION FINALE DE STRATÉGIE LEXICALE FRANÇAISE

## STATUT

**READ_ONLY — DECISION ONLY**

**DECISION: GO_WITH_LEGAL_REVIEW**

---

## A. Executive Summary

Après 16 phases d'audit (16A → 16O), **aucune source ne combine licence confirmée + usage commercial + SaaS + stockage + dérivés + provenance + couverture + qualité**. La seule voie viable et propre est :

> **Kazimirski 1860 (scan University of Toronto / Internet Archive, `NOT_IN_COPYRIGHT`) comme SOURCE HISTORIQUE de référence + ÉDITION HUMAINE PROPRIÉTAIRE** : les gloses finales Hikma sont des formulations éditoriales courtes, créées et validées par des humains (jamais auto-validées, jamais IA/MT comme autorité).

Cette stratégie est **techniquement prête** (édition 1860 confirmée, OCR bilingue lisible, images téléchargeables, localisation par racine documentée) mais conserve **une condition juridique unique** à confirmer : l'usage commercial d'une transcription issue de ce scan. D'où **`GO_WITH_LEGAL_REVIEW`**, et non `GO`.

## B. Baseline (mesurée, identique début/fin)

quran_words **21 296** · word_occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (validated **8** / proposed **14** / rejected **0**) · lemma_id **135** · root **0** · sources **2** · migration **0020**. 8 gloses intactes.

## C. État des sources

| Source | Statut |
|---|---|
| Quran.com / Quran Foundation | **LICENSE_INCOMPATIBLE** |
| Kazimirski — BnF/Gallica | **LEGAL_REVIEW_REQUIRED** (redevance commerciale) |
| Kazimirski — Univ. Toronto / IA | **GO_TECHNICAL_LEGAL_REVIEW** |
| Wikidata Lexemes | **COVERAGE_INSUFFICIENT** (0/14 glose FR) |
| Wiktionnaire FR | **REVIEW_REQUIRED** (CC BY-SA, couverture partielle) |
| Lexicala / K Dictionaries | **COMMERCIAL_LICENSE_REQUIRED** (FR semi-auto depuis l'anglais) |
| Tarteel/QUL French WBW | **LICENSE_UNKNOWN → STOP_SOURCE** |

## D. Matrice des scénarios

| Scénario | Licence | Commercial | SaaS | Stockage | Dérivés | Redistribution | Couverture | Qualité | Extraction | Provenance | Risque | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A. Kazimirski + BnF | redevance | payant | à clarifier | à clarifier | à clarifier | à clarifier | complète | excellente | IIIF | claire | juridique | **LEGAL_REVIEW_REQUIRED** |
| **B. Kazimirski indépendant (U Toronto)** | `NOT_IN_COPYRIGHT` (à confirmer) | à confirmer | à confirmer | à confirmer | à confirmer | à confirmer | complète | excellente | OCR bilingue | claire | **1 question juridique** | **GO_WITH_LEGAL_REVIEW** |
| C. Wiktionnaire CC BY-SA | CC BY-SA | oui (SA) | oui | oui | SA | SA | partielle | variable | dumps/API | moyenne | SA contaminant | **GO_WITH_LINGUIST_REVIEW** |
| D. Lexicala | négociée | à négocier | à négocier | à négocier | à négocier | à négocier | AR→FR oui | mixte (FR auto) | API | claire | FR auto + coût | **REVIEW_REQUIRED** |
| E. Multi-sources | par source | par source | par source | par source | par source | par source | bonne | bonne | par source | par glose | complexité | **REVIEW_REQUIRED** |
| F. Éditorial propriétaire | n/a (méthode) | dépend source | — | — | oui | oui | dépend source | haute (humaine) | n/a | stricte | dépend source | **GO_WITH_LEGAL_REVIEW** |
| G. Maintien du blocage | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | aucun | **STOP_SOURCE** |

## E. Analyse juridique

- Aucune source n'est `LICENSE_CONFIRMED` pour un SaaS commercial.
- `NOT_IN_COPYRIGHT` (métadonnée IA) est un **indice**, pas une licence. `LEGAL_REVIEW_REQUIRED` reste le statut exact du canal Kazimirski.
- MIT(QUL) ≠ données ; absence de « copyrighted » ≠ libre ; open-source ≠ réutilisable commercialement (résultats 16N/16O).
- La distinction œuvre PD / scan / OCR / transcription / édition est maintenue à chaque couche.

## F. Analyse technique

Kazimirski U Toronto est **le seul canal techniquement prêt** : édition originale 1860 (page de titre OCR confirmée), OCR bilingue `fra+ara` lisible en français, images JP2/IIIF téléchargeables, mapping feuillet→page imprimée disponible, localisation par racine réalisée (5 entrées OCR_ONLY + 4 PARTIAL + 5 à localiser).

## G. Analyse linguistique

- **8 noms stables** exploitables en propositions : يَوْم · رَسُول · نَاس · قَوْم · عَذَاب · رَحْمَة · نَبِيّ · أَرْض.
- **4 spécialistes** : عَبْد · كِتَاب · كَان · كَفَر.
- **Mots grammaticaux** (فِي · لَا · كَان) : traduction contextuelle, jamais « glose canonique » ; à traiter comme unités fonctionnelles ou à écarter d'un premier corpus lexical.
- Aucune glose IA/MT comme autorité.

## H. Analyse de provenance

Le schéma actuel suffit (aucune migration) : `quran_word → lemma → word_translations → sources`, avec `sources.name/type/url/version/license/retrieved_at` + `word_translations.source_id` + `editorial_notes`. Toute glose future portera : `Kazimirski, 1860 — University of Toronto / Internet Archive` + `editorial_note` de revue.

## I. Analyse spécifique Kazimirski

- **K-BLOCKED** : si la question juridique reste ouverte (aucune confirmation obtenue).
- **K-GO-WITH-LEGAL-CONFIRMATION** : techniquement prêt, confirmation juridique toujours requise.
- La phase 16P n'invente **pas** cette confirmation.

## J. Analyse spécifique Tarteel/QUL

`LICENSE_UNKNOWN`. Les 77 429 gloses peuvent servir de **référence comparative / contrôle technique** (documentaire), mais **interdiction** d'import/seed/stockage/dérivation tant que la licence des données FR n'est pas établie. Aucune des 14 gloses ne doit en être fabriquée.

## K. Analyse des 14 unités

| Lemma | Source candidate | Juridique | Technique | Linguistique | Décision |
|---|---|---|---|---|---|
| يَوْم | Kazimirski | LEGAL_REVIEW_REQUIRED | PARTIAL | revue humaine | PENDING |
| عَبْد | Kazimirski | LEGAL_REVIEW_REQUIRED | OCR_ONLY (t2 p.150-151) | **SPECIALIST** | PENDING |
| رَسُول | Kazimirski | LEGAL_REVIEW_REQUIRED | OCR_ONLY (t1 p.861) | revue humaine | PENDING |
| نَاس | Kazimirski | LEGAL_REVIEW_REQUIRED | NOT_LOCATED | revue humaine | PENDING |
| قَوْم | Kazimirski | LEGAL_REVIEW_REQUIRED | OCR_ONLY (t2 p.121) | revue humaine | PENDING |
| عَذَاب | Kazimirski | LEGAL_REVIEW_REQUIRED | PARTIAL (t2 p.198/768/1593) | revue humaine | PENDING |
| رَحْمَة | Kazimirski | LEGAL_REVIEW_REQUIRED | OCR_ONLY (t1 p.838) | revue humaine | PENDING |
| نَبِيّ | Kazimirski | LEGAL_REVIEW_REQUIRED | PARTIAL (t2 p.104) | revue humaine (ى vs ي) | PENDING |
| فِي | Kazimirski | LEGAL_REVIEW_REQUIRED | NOT_LOCATED | **SPECIALIST** (grammatical) | PENDING |
| لَا | Kazimirski | LEGAL_REVIEW_REQUIRED | NOT_LOCATED | **SPECIALIST** (grammatical) | PENDING |
| أَرْض | Kazimirski | LEGAL_REVIEW_REQUIRED | OCR_ONLY (t1 p.25) | revue humaine | PENDING |
| كِتَاب | Kazimirski | LEGAL_REVIEW_REQUIRED | PARTIAL (t2 p.858-860) | **SPECIALIST** | PENDING |
| كَان | Kazimirski | LEGAL_REVIEW_REQUIRED | NOT_LOCATED | **SPECIALIST** (copule) | PENDING |
| كَفَر | Kazimirski | LEGAL_REVIEW_REQUIRED | PARTIAL (t2 p.914) | **SPECIALIST** | PENDING |

## L. Stratégie recommandée

**« SOURCE HISTORIQUE + ÉDITION HUMAINE PROPRIÉTAIRE »** (scénario B + F) :

```
Kazimirski 1860 (U Toronto)            ← source historique de référence (PD œuvre, scan NOT_IN_COPYRIGHT)
  → transcription / extraction brute   ← OCR bilingue + relecture entrée par entrée
  → sélection du sens pertinent        ← par un REVIEWER/LINGUISTE QUALIFIÉ
  → formulation éditoriale courte      ← création Hikma (jamais citation directe, jamais IA/MT)
  → fiche PROPOSED                     ← provenance stricte, source_id + editorial_notes
  → revue humaine / spécialiste        ← jamais auto-validée
  → VALIDATED                          ← seulement après validation humaine autorisée
```

Ce qui vient de la source (entrée lexicographique) est **distinct** de ce qui est **création éditoriale** (la glose courte). La glose finale Hikma est une **donnée dérivée propre**, traçable, jamais présentée comme citation de Kazimirski.

## M. Risques résiduels

1. **Juridique** : usage commercial de la transcription du scan U Toronto — **UNIQUE blocage**, à confirmer par un professionnel.
2. **Linguistique** : 4 unités spécialistes + 3 mots grammaticaux ; OCR arabe imparfait (5 vedettes à localiser visuellement).
3. **Process** : aucune validation automatique ; dépendance à un REVIEWER qualifié.

## N. Conditions de déblocage

1. Confirmation juridique (professionnelle) : « une transcription produite à partir du scan Kazimirski 1860 (Univ. Toronto / IA, `NOT_IN_COPYRIGHT`) peut-elle être utilisée commercialement dans un SaaS, et produire des données dérivées ? »
2. Si oui → passer en écriture contrôlée (Phase 16Q) sous protocole strict.
3. Si non/incertain → rester en `STOP_SOURCE` ou basculer sur BnF (payant) / Wiktionnaire (SA) / Lexicala (négocié) — décisions projet.

## O. Préconditions de Phase 16Q (avant TOUTE écriture DB)

1. Décision juridique humaine rendue et documentée.
2. Localisation visuelle (humaine) des 5 vedettes non isolées.
3. Revue linguistique (REVIEWER qualifié) définie — le propriétaire ne certifie **pas** l'arabe.
4. Protocole d'import transactionnel + vérification de non-régression préparé.

## P. Décision finale

**GO_WITH_LEGAL_REVIEW** — stratégie **Kazimirski 1860 (U Toronto) + édition humaine propriétaire**. Aucune écriture autorisée par cette phase.

## Q. Preuve de non-régression

Baseline identique début/fin (section B). Aucune migration (dernière = 0020), aucun seed, aucun script d'import résiduel, aucun changement de code produit, 8 gloses intactes, 14 lemmas `proposed`, root 0, sources 2.

Tests : `npm test` **172/172** · `tsc` **0** · `lint` **0** · `build` **0** · `verify:persistence` **13/13** · `verify:rls` **27/27**.

---

## Livrables

- 📄 `PHASE_16P_FINAL_LEXICAL_STRATEGY_DECISION.md` (ce rapport)
- 📄 `tmp/phase16p-lexical-strategy-decision.json` (marqué « DOCUMENTARY ONLY · NOT VALIDATED · NOT IMPORTED · NO DATABASE WRITES »)

---

**PHASE 16P — TERMINÉE** · **DECISION: GO_WITH_LEGAL_REVIEW** · **ARRÊT OBLIGATOIRE** (ne pas commencer 16Q).
