# PHASE 16B — SOURCE AUDIT

**Phase de recherche, d'audit et de décision. Aucune donnée importée, aucune écriture en base, aucune migration, aucune source ajoutée.**

---

## A. Objectif

Répondre à : *« Quelle source de significations françaises pouvons-nous utiliser légalement, durablement et proprement pour construire le vocabulaire Hikma, d'abord pour les 14 unités actuelles puis pour ~250 unités, dans un produit commercial ? »*

## B. État actuel

lemmas **22** (validated 8 · proposed 14 · rejected 0) · lemma_id **135** · root **0** · word_translations **8** · sources **2**. Les 8 gloses validées restent inchangées.

## C. Méthodologie de recherche

- Recherche web (sources primaires/officielles) : pages officielles des licences, pages de licences des dépôts, conditions d'utilisation des API.
- Distinction systématique **licence du code ≠ licence des données** (§6).
- Vérification de la **date de consultation** et du caractère officiel de chaque source.

## D. Sources candidates (identifiées)

| # | Source | Type | AR→FR ? |
|---|---|---|---|
| 1 | **Kazimirski — Dictionnaire arabe-français (1860)** | dictionnaire classique | ✅ |
| 2 | **Wikidata Lexemes** | données lexicales structurées | ⚠️ (glosses FR présentes, couverture à vérifier) |
| 3 | **Wiktionnaire (fr)** | dictionnaire collaboratif | ✅ |
| 4 | **Quran.com / Quran Foundation — glosse mot-à-mot** | glosse lexicale (EN) | ❌ (anglais) |
| 5 | QuranMorph / Qabas | corpus morphologique | ❌ (exclu, Phases 11–12B) |
| 6 | Quranic Arabic Corpus (corpus.quran.com) | corpus annoté | ❌ (non-commercial) |
| 7 | Almaany / Lexilogos / Reverso | dictionnaires propriétaires | ❌ (licence non claire) |

## E. Analyse détaillée des licences

### 1. Kazimirski (1860) — ✅ PUBLIC DOMAIN
- Auteur : Albert de Biberstein-Kazimirski (1808–1887). Œuvre publiée **1860**.
- Domaine public **mondial** (auteur décédé depuis > 70 ans ; en France, domaine public depuis 1958 au plus tard).
- **Preuve** : « Public Domain Mark 1.0 » (opendata.uni-halle.de, réf. 1981185920/100210) ; copies sur archive.org / HathiTrust / Google Books.
- Copies téléchargeables (texte OCR) : archive.org « Le Kazimirski Dictionnaire Ar/Fr tome 1&2 » (djvu.txt, hocr, epub).
- Édition numérique structurée : kazimirski.online (J. Sypiański, ~40 000 entrées, recherche translittérée) — **licence de cette édition à vérifier séparément** (le texte source est PD, mais la couche de numérisation/correction peut comporter des droits propres).
- **Verdict licence** : `LICENSE_CONFIRMED` (texte) — avec vérification de la couche de numérisation avant import.

### 2. Wikidata Lexemes — ✅ CC0
- **Preuve officielle** : « All structured data from the main, Property, Lexeme, and EntitySchema namespaces is available under the Creative Commons CC0 License » (wikidata.org).
- CC0 = dédicace au domaine public : usage commercial, modification, redistribution **sans attribution obligatoire**.
- Limite : la **couverture** des lexèmes arabes avec **glosses françaises** (notamment vocabulaire coranique) n'est **pas vérifiée** ici.
- **Verdict licence** : `LICENSE_CONFIRMED` (CC0) — couverture à mesurer avant usage.

### 3. Wiktionnaire (fr) — ⚠️ CC BY-SA 4.0
- Contenu textuel sous **CC BY-SA 4.0** (copyleft, partage à l'identique).
- Pour une base propriétaire : extraire et afficher des définitions → œuvre dérivée soumise au **Share-Alike** (obligation de repartager les adaptations sous la même licence). **Incompatible** avec une base SaaS fermée sans analyse juridique approfondie.
- **Verdict licence** : `LICENSE_PARTIALLY_CONFIRMED` — **risque Share-Alike** pour Hikma.

### 4. Quran.com / Quran Foundation — ❌ (licence commerciale requise)
- **Source primaire** : « Quran Foundation Developer Terms of Service » (api-docs.quran.foundation/legal/developer-terms/, mise à jour 2026-08-10).
- §2.2 : « QF Content is not resold, sublicensed, or redistributed except as integral to the end-user experience of the Application. **Any other form of commercial redistribution or use of QF Content or raw API data requires a separate written commercial license agreement with QF.** »
- §3.1 : « **Cache or store QF Content longer than 1 week** » interdit (sauf API Content Sync autorisées).
- **Verdict licence** : `LICENSE_INCOMPATIBLE` (sans licence commerciale écrite de QF) pour un usage commercial / redistribution des gloses.

### 5. QuranMorph / Qabas — ❌ (audit Phases 11–12B)
QuranMorph CC BY 4.0 (lemme+POS, pas de racine) ; Qabas **CC-BY-ND-4.0** + provenance SAMA/LDC incertaine → exclus.

### 6. Quranic Arabic Corpus — ❌ GPL + usage non-commercial (FAQ officielle).

## F. Compatibilité commerciale

| Source | Commercial | Stockage | Redistribution | Attribution | Verdict |
|---|---|---|---|---|---|
| Kazimirski (PD) | ✅ | ✅ | ✅ | conseillée (pas obligatoire) | ✅ utilisable |
| Wikidata (CC0) | ✅ | ✅ | ✅ | non obligatoire | ✅ utilisable |
| Wiktionnaire (BY-SA) | ⚠️ SA | ✅ | ⚠️ SA sur dérivés | obligatoire | ⚠️ risqué |
| Quran.com glosses | ❌ (licence écrite requise) | ❌ (> 1 semaine interdit) | ❌ | — | ❌ incompatible |

## G. Qualité lexicale

- **Kazimirski** : référence du lexique **arabe classique → français**, conçu pour les textes classiques/coraniques. Très adapté aux mots coraniques.
- **Wikidata** : structuré mais qualité/couverture variables (communautaire).
- **Wiktionnaire** : définitions françaises natives de bonne qualité, mais format long (moins adapté aux gloses courtes V1).

## H. Couverture

| Source | 14 unités actuelles | ~250 unités | 500–1000 unités |
|---|---|---|---|
| Kazimirski | ✅ certaine | ✅ certaine | ✅ certaine (racines exhaustives) |
| Wikidata | ⚠️ à vérifier | ⚠️ | ⚠️ |
| Wiktionnaire | ✅ | ⚠️ | ⚠️ |

## I. Facilité technique d'intégration

- **Wikidata** : excellente (SPARQL API, JSON structuré, champs lemme/glosse par langue).
- **Wiktionnaire** : correcte (dumps XML, parsing nécessaire).
- **Kazimirski** : moyenne (texte OCR à structurer/nettoyer ; la langue française est du XIXᵉ siècle).

## J. Audit Quran.com (glosse mot-à-mot)

- Origine : glosse mot-à-mot anglophone du site/API Quran.com (Quran Foundation).
- Droits : **aucune licence libre** — les Developer Terms imposent une **licence commerciale écrite** pour la redistribution/usage commercial, et interdisent le **stockage > 1 semaine**.
- Conséquence : `quran_words.meaning` (glosses EN) ne peut pas servir de source lexicale pour un produit commercial **sans accord écrit de QF**. Statut : `LICENSE_INCOMPATIBLE` (en l'état).

## K. Tableau comparatif (scores /35)

| Source | AR→FR | Qualité lex. | Qualité FR | Couverture coranique | Licence | Commercial | Facilité import | Provenance | Score | Décision |
|---|---|---|---|---|---|---|---|---|---|---|
| **Kazimirski (1860, PD)** | ✅ | 5 | 4 | 5 | 5 | 4 | 2 | 5 | **30** | 🥇 recommandée |
| **Wikidata Lexemes (CC0)** | ⚠️ | 3 | 3 | 2 | 5 | 5 | 4 | 4 | **26** | 🥈 complément |
| **Wiktionnaire FR (BY-SA)** | ✅ | 4 | 5 | 3 | 2 | 2 | 3 | 4 | **23** | 🥉 référence |
| Quran.com glosses (EN) | ❌ | 4 | 1 | 5 | 1 | 1 | 5 | 3 | 20 | ❌ licence écrite requise |
| QuranMorph / Qabas | ❌ | — | — | — | — | — | — | — | — | ❌ exclu |
| Quranic Arabic Corpus | ❌ | — | — | — | — | — | — | — | — | ❌ non-commercial |

## L. Risques juridiques

1. **Couche de numérisation Kazimirski** : le texte 1860 est PD, mais une édition numérique corrigée/structurée peut porter des droits propres (droit sui generis des bases de données, compilation). → utiliser une copie `Public Domain Mark 1.0` + refaire/vérifier notre propre extraction OCR, ou vérifier la licence de l'édition structurée.
2. **Français du XIXᵉ siècle** : formulations archaïques à adapter éditorialement (l'adaptation rédactionnelle est une activité éditoriale, pas un problème de licence).
3. **Share-Alike** du Wiktionnaire : ne pas l'utiliser comme source d'import sans avis juridique.
4. **Quran.com** : ne pas réutiliser commercialement les glosses EN sans licence écrite de QF.

## M. Risques techniques

1. **OCR Kazimirski** : qualité variable (arabe + français mélangés), nécessite structuration + vérification humaine par entrée.
2. **Couverture Wikidata** : à mesurer (nombre de lexèmes arabes avec glosse FR pertinente).
3. Pas de risque technique pour l'état actuel de la base (aucune écriture).

## N. Recommandation

- **Source principale recommandée : Kazimirski (1860, domaine public)** — seule source AR→FR à la fois lexicalement profonde, couvrant le vocabulaire coranique, et juridiquement compatible (PD) avec un SaaS commercial.
- **Complément : Wikidata Lexemes (CC0)** pour les mots courants modernes si les glosses FR sont présentes.
- **À éviter pour l'import** : Wiktionnaire (BY-SA), Quran.com glosses (licence écrite requise), QuranMorph/Qabas (exclus).

## O. Source recommandée

**Kazimirski, A. de Biberstein — *Dictionnaire arabe-français* (1860)** — domaine public.

## P. Conditions avant import (à respecter en Phase 16C)

1. Choisir une copie **Public Domain Mark 1.0** (ex. opendata.uni-halle.de / archive.org) — **pas** une édition moderne dont la licence n'est pas claire.
2. **Vérifier la licence de l'édition numérique** utilisée ; sinon, faire notre propre extraction OCR à partir du scan PD.
3. **Vérifier la qualité OCR** entrée par entrée avant toute proposition (revue humaine).
4. Adapter le français du XIXᵉ siècle en glose **courte et moderne** — uniquement en **PROPOSITION** éditoriale, jamais auto-validée.
5. Respecter le workflow : `proposed → validated` par **action humaine** uniquement ; les 8 gloses existantes restent intactes.
6. Provenance à consigner : `Kazimirski, Dictionnaire arabe-français (1860), domaine public — glose adaptée éditorialement`.

## Q. Décision

**`GO_SOURCE_FOUND`** — une source commercialement compatible et qualitativement suffisante existe : **Kazimirski (1860), domaine public**. L'import reste conditionné à la vérification de la couche de numérisation (§P) et à une validation humaine par unité.

## R. ARRÊT

⏸️ **PHASE 16B — ARRÊT.** Aucune donnée importée, aucune signification créée, aucun `proposed → validated`, aucune écriture `lemmas`/`word_translations`/`quran_words`/`sources`, aucune migration, aucune racine/POS/morphologie, aucun QuranMorph/Qabas. Attente de la décision explicite suivante.
