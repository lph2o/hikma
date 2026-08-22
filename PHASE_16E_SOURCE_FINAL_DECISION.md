# PHASE 16E — DÉCISION FINALE DU CANAL SOURCE LEXICAL FR

> **Phase d'audit/recherche/décision. Aucune écriture en base, aucune migration, aucune signification créée, aucun `proposed → validated`, aucune racine/POS/morphologie, aucun QuranMorph/Qabas.**

## A. Baseline

Mesurée (lecture seule, début et fin de phase identiques) :

| Champ | Valeur |
|---|---|
| lemmas | 22 (validated 8 · proposed 14 · rejected 0) |
| quran_words.lemma_id renseigné | 135 |
| quran_words.root renseigné | 0 |
| word_translations | 8 |
| sources | 2 |

## B. Objectif

Déterminer le canal lexical **arabe → français** juridiquement et techniquement exploitable pour les 14 unités `proposed`, puis ~250 unités, dans un SaaS potentiellement commercial.

## C. Méthodologie

Sources primaires/officielles (BnF/Gallica SRU + IIIF, Wikidata SPARQL + API, Wikimedia, archive.org) + **mesure réelle** de couverture (pas de couverture supposée).

## D. Sources recherchées

BnF/Gallica · Internet Archive · HathiTrust · Google Books · bibliothèques universitaires · dépôts institutionnels · Wikidata Lexemes · Wiktionnaire · dictionnaires AR→FR historiques (Belot, Blachère, Bocthor, Reig) · projets ouverts (OpenLexicon, FHILA).

## E. Sources rejetées

| Source | Motif |
|---|---|
| Quran.com glosses EN | LICENSE_INCOMPATIBLE (licence écrite QF requise pour usage commercial) |
| Hamidullah | traduction de verset ≠ définition lexicale |
| Internet Archive (16C) | LICENSE_UNKNOWN + OCR inutilisable |
| kazimirski.online | LICENSE_UNKNOWN + édition générée par modèles de langue (§2 hors autorité) |
| Belot/Blachère/Reig/Bocthor | sans transcription ouverte licenciée (ou modernes sous droits) |
| Hikma éditorial (8 gloses) | protégées — pas de fabrication de dérivés |

## F. Sources retenues pour analyse approfondie

1. **Kazimirski 1860** (œuvre PD) — canal commercial à sécuriser.
2. **Wikidata Lexemes** (CC0) — mesurée réellement.
3. **Wiktionnaire FR** (CC BY-SA) — mesurée partiellement.

## G. Audit juridique

| Couche | Statut |
|---|---|
| Kazimirski 1860 (œuvre) | domaine public (auteur décédé 1887) |
| Reproduction BnF/Gallica | « domaine public » (œuvre) mais **réutilisation commerciale = autorisation + redevance** (source bnf.fr) |
| Wikidata Lexemes | **CC0** (données/dumps/lexèmes — réutilisation y compris commerciale, sans attribution obligatoire) |
| Wiktionnaire FR | **CC BY-SA 4.0** (commercial autorisé, dérivés à partager sous la même licence) |

Classification : Wikidata = **LICENSE_CONFIRMED** · Wiktionnaire = **LICENSE_CONFIRMED (SA)** · Kazimirski/BnF = **LICENSE_REVIEW_REQUIRED** · Internet Archive = **LICENSE_UNKNOWN** · Quran.com = **LICENSE_INCOMPATIBLE**.

## H. Audit technique

| Source | Accès | Extraction |
|---|---|---|
| BnF/Gallica | IIIF HD (2096×3538) | OCR **absent** (`nqamoyen 0.0`) → OCR interne requis |
| Wikidata | API/SPARQL/dumps | structuré, exploitable |
| Wiktionnaire | API/dumps XML | structuré, exploitable |

## I. Audit linguistique

- **Kazimirski** : référence lexicographique arabe classique → français, couverture exhaustive (toutes les racines). Qualité excellente.
- **Wikidata** : lexèmes arabes présents mais **sans sens/glose** (voir J).
- **Wiktionnaire** : définitions communautaires, couverture du classique coranique partielle, qualité variable.

## J. Mesure de couverture (réelle, SPARQL + API)

**Wikidata Lexemes sur les 14 unités :**

| Mesure | Résultat |
|---|---|
| Lexème arabe exact présent | **13/14** |
| Lexème avec au moins 1 sens (glose) | **0/14** |
| Lexème avec une glose **française** | **0/14** |

Vérification directe : lexèmes `L1422430` (يَوْم), `L1498848` (رَسُول), `L2233` (كِتَاب) → **`senses` vide** (aucune définition dans aucune langue).

→ **Wikidata Lexemes (CC0) ne fournit AUCUNE glose FR pour les 14 unités.** Le fait que la licence soit parfaite est rendu **inopérant** par la couverture nulle.

**Wiktionnaire FR sur les 14 unités** (partiel, rate-limited) : certaines entrées présentes avec section arabe (يَوْم, عَبْد, قَوْم, نَبِيّ), d'autres **absentes** (رَسُول, نَاس, رَحْمَة). Couverture **incomplète** pour le vocabulaire coranique ciblé.

## K. Matrice comparative /35

| Source | A. Licence | B. Commercial | C. Qualité lexico | D. Couverture AR→FR | E. Extraction | F. Pérennité | G. Compat. Hikma | Total | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| Kazimirski (BnF) | 2 | 2 | 5 | 5 | 2 | 5 | 5 | **26** | LICENSE_REVIEW_REQUIRED |
| Wikidata Lexemes | 5 | 5 | 1 | 1 | 4 | 4 | 3 | **23** | couverture nulle (inutilisable) |
| Wiktionnaire FR | 3 | 3 | 3 | 2 | 4 | 4 | 3 | **22** | REVIEW_REQUIRED (SA + couverture) |
| Internet Archive (16C) | 1 | 1 | 3 | 5 | 1 | 3 | 2 | **16** | REJECTED |
| kazimirski.online | 1 | 1 | 3 | 5 | 1 | 2 | 2 | **15** | REJECTED |

Règle appliquée : **licence incompatible → rejetée même avec une bonne note linguistique.** Aucune source n'obtient simultanément licence confirmée + couverture suffisante + extraction fiable.

## L. Risques

1. **Juridique** : utiliser les reproductions BnF dans un SaaS payant sans redevance = non conforme aux CGU BnF.
2. **Couverture** : la source CC0 parfaite (Wikidata) est vide ; la source SA (Wiktionnaire) est incomplète.
3. **Share-Alike** : dériver les gloses de Wiktionnaire imposerait de licencier les gloses Hikma sous CC BY-SA (à trancher juridiquement).

## M. Recommandation

Aucun canal n'est **simultanément** sécurisé et couvrant. Trois chemins de déblocage, à décider par l'humain :

1. **Chemin Kazimirski (qualité maximale)** : payer l'autorisation commerciale BnF **ou** établir qu'une transcription indépendante du texte 1860 (exemplaire physique / copie PD non-BnF) est libre de redevance, puis OCR bilingue + relecture entrée par entrée.
2. **Chemin Wiktionnaire (CC BY-SA)** : accepter l'obligation Share-Alike sur les gloses dérivées (après avis juridique), en complétant les trous de couverture par d'autres sources.
3. **Chemin mixte** : Kazimirski comme contrôle éditorial + une source d'appoint pour les gloses courtes, chaque signification portant sa provenance.

## N. Architecture de provenance (retenue quelle que soit la source)

`quran_word → lemma → word_translations (fr)` avec pour chaque glose : `source_name` / `source_type` / `source_reference` / `source_license_status` / `retrieved_at` / `editorial_note`. Réutiliser `lemmas` + `word_translations`. Aucune nouvelle table.

## O. Plan Phase 16F

1. Décision humaine sur le chemin (Kazimirski-licence / Wiktionnaire-SA / mixte).
2. Obtention du texte/canal juridiquement propre.
3. Extraction + fiches **PROPOSED** (jamais auto-validées).
4. Validation éditoriale humaine → `validated`.

## P. Décision finale

**REVIEW_REQUIRED** — une question de licence/canal reste non résolue : (a) la source de meilleure qualité (Kazimirski) est bloquée par la redevance BnF sur les reproductions commerciales, (b) la seule source CC0 (Wikidata) a une couverture **mesurée nulle** (0/14 gloses), (c) la source SA (Wiktionnaire) est incomplète et impose le partage à l'identique. Aucune source ne peut être déclarée `GO` sans décision humaine.

---

## CE QUI N'A PAS ÉTÉ FAIT

- ❌ aucune écriture DB (lemmas, word_translations, quran_words, sources inchangés)
- ❌ aucune migration créée ni appliquée (dernière = 0020)
- ❌ aucune nouvelle signification
- ❌ aucun changement de statut (`proposed → validated` interdit)
- ❌ aucun import
- ❌ aucun root / POS / morphologie
- ❌ aucun QuranMorph / Qabas
- ❌ aucune donnée inventée, aucune licence/source/citation inventée

## Preuve de non-régression

Baseline fin de phase identique à la baseline initiale : lemmas **22** (8/14/0) · lemma_id **135** · root **0** · word_translations **8** · sources **2**. Aucun script résiduel, aucun fichier produit modifié, aucun code modifié.

---

**REVIEW_REQUIRED**

**PHASE 16E — ARRÊT OBLIGATOIRE.**
