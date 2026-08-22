# PHASE 16J — AUDIT FINAL DU CANAL KAZIMIRSKI 1860

## STATUT

READ_ONLY

DECISION: **GO_TECHNICAL_LEGAL_REVIEW**

**Résumé exécutif** : le scan University of Toronto / Internet Archive de l'édition **originale 1860** de Kazimirski (Paris : Maisonneuve) est **confirmé bibliographiquement** (page de titre OCR), **distinct** de la réédition BnF 1960, marqué `NOT_IN_COPYRIGHT` par archive.org, et son OCR **bilingue (`fra+ara`) est lisible en français**. Techniquement, le canal est viable (images de pages téléchargeables + OCR exploitable). Juridiquement, `NOT_IN_COPYRIGHT` est un **indice fort de domaine public** mais pas une licence d'usage commercial (champs `licenseurl`/`rights` absents) → **confirmation juridique professionnelle requise**. Aucune donnée écrite, aucune glose créée.

---

## A. Baseline

Mesurée (lecture seule) : quran_words **21 296** · word_occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (8/14/0) · lemma_id **135** · root **0** · sources **2** · dernière migration **0020**. Aucune divergence.

## B. Identification bibliographique

| Champ | Valeur |
|---|---|
| Titre | *Dictionnaire arabe-français contenant toutes les racines de la langue arabe : leurs dérivés, tant dans l'idiome vulgaire que dans l'idiome littéral, ainsi que les dialectes d'Alger et de Maroc* |
| Auteur | Biberstein-Kazimirski, Albert de (1808-1887) |
| Année | **1860** |
| Éditeur | Paris : Maisonneuve |
| Page de titre (OCR) | « DICTIONNAIRE ARABE-FRANCAIS … PARIS, — IMPRIMERIE DE W. REMQUET ET Cie, RUE GARANCIÈRE, 5 » |

## C. Provenance University of Toronto

| Champ | Valeur |
|---|---|
| Contributeur | **Robarts - University of Toronto** |
| Collection | robarts; toronto; university_of_toronto |
| Scanner | scribe1/8.toronto.archive.org |
| Note de numérisation | « Digitized by the Internet Archive in 2025 with funding from Microsoft Corporation » |

## D. Métadonnées Internet Archive (les deux tomes identiques)

| Champ | Valeur |
|---|---|
| title / creator / date / publisher | conformes à l'édition 1860 |
| language | fre; ara |
| mediatype | texts |
| **possible-copyright-status** | **NOT_IN_COPYRIGHT** |
| licenseurl | *(absent)* |
| rights | *(absent)* |
| public-domain-status | *(absent)* |
| ocr | tesseract 5.3.0 `-l fra+ara` |

## E. Statut copyright / public domain

- **Fait observé** : `possible-copyright-status = NOT_IN_COPYRIGHT` (détermination archive.org).
- **Non transformé** en « garantie absolue d'usage commercial » (aucun `licenseurl`/`rights` formel).
- Classification : **`PUBLIC_DOMAIN_INDICATED`** → `LICENSE_REVIEW_REQUIRED` au niveau strict.

## F. Distinction œuvre / édition / scan / OCR

| Couche | Statut |
|---|---|
| Œuvre (1860, auteur décédé 1887) | domaine public |
| Édition | originale 1860 (pas la réédition 1960) |
| Scan | Univ. Toronto, archive.org `NOT_IN_COPYRIGHT` |
| OCR | tesseract `fra+ara` (couche technique, à corriger contre le scan) |
| Code/outillage | hors champ des données |

## G. Comparaison BnF vs University of Toronto

| | BnF/Gallica | Univ. Toronto |
|---|---|---|
| Édition | réédition **1960** | originale **1860** |
| Canal | reproduction BnF (redevance commerciale) | scan archive.org (NOT_IN_COPYRIGHT) |
| OCR | absent | bilingue lisible |

Les conditions BnF identifiées ne constituent pas, à elles seules, les conditions applicables à la copie U Toronto ; le statut propre de cette copie s'évalue à partir de ses métadonnées (`NOT_IN_COPYRIGHT`, `licenseurl` absent).

## H. Audit OCR

- **Français : lisible** — « jour » ×676, « livre » ×272, définitions françaises exploitables.
- **Arabe : imparfait** — vedettes OCRisées avec erreurs ; la **recherche par sous-chaîne produit des faux positifs**.
- `_jp2.zip` (images pages) + PDF disponibles pour vérification contre le scan.

## I. Échantillon des 14 entrées (audit de qualité OCR, pas de glose)

| Unité | Localisation | Constat |
|---|---|---|
| يَوْم | localisable | définition FR lisible |
| عَبْد | à vérifier | confusion OCR عين/عبد |
| رَسُول | fiable | « رسول الله = l'envoyé de Dieu » |
| نَاس | **faux positif** | « ناسيس » = تأسيس |
| قَوْم | fiable | « القوم = la tribu » |
| عَذَاب | reconnaissable | contexte lisible |
| رَحْمَة | à vérifier | localisation par racine ر-ح-م |
| نَبِيّ | **faux positif** | « لكنبية » = الكتيبة |
| فِي / لَا | fréquents | sous-chaîne très fréquente — localisation précise requise |
| أَرْض | fiable | « الأرض = terre » |
| كِتَاب | fiable (t1 « أم الكتاب ») | entrée ك-ت-ب par racine |
| كَان | **faux positif** | sous-chaîne de أصل |
| كَفَر | **faux positif** | « مكفر » = forme différente |

**Conclusion technique** : la localisation des entrées doit se faire **par racine puis vérification contre l'image de page**, jamais par recherche de sous-chaîne seule.

## J. Risques

1. **Juridique** : `NOT_IN_COPYRIGHT` ≠ licence d'usage commercial ; confirmation professionnelle requise.
2. **OCR** : vedettes arabes imparfaites → vérification visuelle obligatoire.
3. **Qualité** : français du XIXᵉ s. → glose courte moderne = adaptation éditoriale traçable.

## K. Provenance future (modèle documentaire — non écrit)

`source_name=Kazimirski · source_type=historical_dictionary · source_reference=Kazimirski 1860 — Univ. Toronto / Internet Archive · source_version=1860/tome · source_license_status=PUBLIC_DOMAIN_INDICATED (à confirmer) · retrieved_at · editorial_note`

(Le schéma actuel — `sources` + `word_translations.source_id` + `editorial_notes` — le supporte déjà, aucune migration.)

## L. Pipeline futur (non exécuté)

SCAN → OCR bilingue → repérage entrée (par racine) → extraction bloc lexical → vérification contre scan → normalisation documentaire minimale → fiche PROPOSED → REVIEWER/LINGUISTE QUALIFIÉ → validation humaine → IMPORT → non-régression.

## M. Décision juridique

**LEGAL_REVIEW_REQUIRED** — le statut commercial reste à confirmer professionnellement (les champs `licenseurl`/`rights` sont absents ; `NOT_IN_COPYRIGHT` est un indice, pas une garantie d'usage commercial).

## N. Décision technique

**GO_TECHNICAL** — édition 1860 confirmée, OCR français lisible, images de pages téléchargeables, pipeline réalisable.

## O. Conditions de Phase 16K

1. Confirmation juridique professionnelle de l'usage commercial de la transcription du scan U Toronto.
2. Aucune validation linguistique par le propriétaire (REVIEWER/LINGUISTE QUALIFIÉ requis ; revue spécialisée obligatoire pour عَبْد, كِتَاب, كَان, كَفَر).
3. Localisation des entrées par racine + vérification contre le scan.

## P. Preuve de non-écriture

Aucune écriture DB, aucune migration, aucun seed, aucun changement de statut, aucune glose créée, aucune racine/POS/morphologie, aucun QuranMorph/Qabas. Baseline identique début/fin. Les 8 gloses validées et les 14 unités `proposed` strictement inchangées.

---

**DECISION: GO_TECHNICAL_LEGAL_REVIEW**

**PHASE 16J — ARRÊT OBLIGATOIRE.**
