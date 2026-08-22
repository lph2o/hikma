# PHASE 16R — DOSSIER FINAL DE DÉCISION JURIDIQUE ET CHECKPOINT DE DÉBLOCAGE

## STATUT

**STRICTLY READ_ONLY** — aucun import, aucune écriture, aucune validation, aucune donnée inventée, aucune interprétation juridique par l'agent.

**DECISION: LEGAL_REVIEW_REQUIRED** · **STATUS: PREPARED_NOT_EXECUTED** · **DATABASE_WRITES: 0** · **IMPORTS: 0** · **VALIDATIONS: 0**

---

## A. Executive summary

Ce dossier ne **répond pas** à la question juridique — il la **rend précise, documentée, vérifiable et transmissible** à un décideur humain ou à un professionnel du droit.

La Phase 16P a retenu `GO_WITH_LEGAL_REVIEW` : source technique recommandée = **Kazimirski 1860 (scan University of Toronto / Internet Archive, `NOT_IN_COPYRIGHT`)**. La Phase 16Q a préparé le pipeline mais l'a laissé **INACTIF**. Ce dossier rassemble les preuves, distingue les couches de droits, identifie les inconnues et fixe les conditions d'un `LEGAL_GO` — sans jamais conclure juridiquement.

**Conclusion factuelle :** aucune confirmation juridique professionnelle n'est présente dans le projet. `NOT_IN_COPYRIGHT` est une **métadonnée observée** de la copie, **pas une licence commerciale explicite**. → `LEGAL_REVIEW_REQUIRED`.

---

## B. Question juridique centrale

> L'utilisation commerciale, dans un SaaS payant, d'une transcription produite indépendamment à partir du scan de l'édition originale 1860 de Kazimirski numérisée par University of Toronto et distribuée via Internet Archive, ainsi que l'utilisation de données dérivées produites par Hikma, est-elle juridiquement autorisée ?

Déclinaison opérationnelle :

1. stockage interne de la transcription/des données dérivées ;
2. extraction du texte lexicographique ;
3. transcription (copie du contenu dans une forme machine) ;
4. données dérivées (fiches lexicales structurées Hikma) ;
5. gloses éditoriales originales courtes ;
6. exploitation dans un SaaS **payant** ;
7. redistribution éventuelle.

> Peut-on utiliser commercialement, dans Hikma, une transcription et des données lexicales dérivées de l'édition originale 1860 de Kazimirski, lorsque la copie source est un scan University of Toronto diffusé par Internet Archive et marqué `NOT_IN_COPYRIGHT`, mais sans `licenseurl` ou `rights` explicites ?

---

## C. Bibliographie de la source 1860

| Champ | Valeur |
|---|---|
| Titre | *Dictionnaire arabe-français contenant toutes les racines de la langue arabe : leurs dérivés, tant dans l'idiome vulgaire que dans l'idiome littéral, ainsi que les dialectes d'Alger et de Maroc* |
| Auteur | Biberstein-Kazimirski, Albert de (1808–1887) |
| Année | 1860 |
| Éditeur / lieu | Paris : Maisonneuve |
| Édition | originale (1860) — **distincte** de la réédition BnF 1960 |

L'œuvre historique est ancienne et l'auteur est décédé en 1887 → **indication de domaine public de l'œuvre** (à confirmer selon les juridictions concernées). Ce point seul **ne libère pas automatiquement chaque reproduction numérique** (voir H).

---

## D. Identification du scan

| Champ | Valeur |
|---|---|
| Tome 1 | `dictionnairearab01bibeuoft` |
| Tome 2 | `dictionnairearab02bibeuoft` |
| Contributeur | Robarts — University of Toronto |
| Collection | robarts · toronto · university_of_toronto |
| Scanner | `scribe1.toronto.archive.org` / `scribe8.toronto.archive.org` |
| Langues | fre · ara |
| OCR | tesseract 5.3.0 `-l fra+ara` (bilingue) |
| Fichiers | PDF · EPUB · `_djvu.txt` · images pages (JP2 / IIIF) |

Hashes OCR `_djvu.txt` (constatés) :
- Tome 1 : `c6aa3269cbc2dbb5b8698bc021146b3d20f4d60e04d41201dc2659b725b4df73`
- Tome 2 : `1644d654b51f2f89ae7d334a223039165e501313d29a2d39848927f8bbfe02f3`

---

## E. Métadonnées observées (Internet Archive)

| Métadonnée | Valeur observée |
|---|---|
| `possible-copyright-status` | **`NOT_IN_COPYRIGHT`** |
| `rights` | **absent** (`null`/undefined) |
| `licenseurl` | **absent** (`null`/undefined) |

Ces trois constats sont des **faits observés** dans les métadonnées des deux items, **rien de plus**.

---

## F. `NOT_IN_COPYRIGHT` — ce qui est réellement établi

- **Établi (EVIDENCE ONLY)** : la métadonnée `possible-copyright-status` de la copie Internet Archive vaut `NOT_IN_COPYRIGHT`.
- **Ce que cela prouve** : l'archive considère qu'il n'y a *a priori* pas de droits d'auteur attachés à cette copie.
- **Ce que cela NE prouve PAS** : une licence commerciale explicite, une autorisation d'usage commercial, une autorisation de produire/stocker des données dérivées, ni une exonération de toute condition contractuelle ou droit voisin.
- **Statut** : **NOT CONFIRMED** en tant que licence commerciale → **REQUIRES LEGAL REVIEW**.

---

## G. Absence de `licenseurl` / `rights` — ce qui est réellement établi

- **Établi** : les champs `licenseurl` et `rights` sont **absents** des métadonnées.
- **Ce que cela NE prouve PAS** : que l'utilisation soit **interdite**. L'absence de licence n'est ni une permission ni une interdiction.
- **Ce que cela NE prouve PAS non plus** : que l'utilisation commerciale soit **autorisée**. Aucune permission ne peut être déduite d'une absence.
- **Statut** : **UNKNOWN** / **NOT CONFIRMED** — aucune déduction dans un sens ni dans l'autre.

---

## H. Distinction œuvre / édition / reproduction / scan / OCR / transcription / données dérivées

| Couche | Objet | Statut factuel | Ce qui est établi | Ce qui n'est PAS établi |
|---|---|---|---|---|
| A | Œuvre originale 1860 | PD indiqué (auteur décédé 1887) | œuvre ancienne, auteur décédé 1887 | cela seul ne libère pas automatiquement chaque reproduction numérique |
| B | Édition / exemplaire numérisé | édition originale 1860 confirmée (page de titre OCR) | 1860, Paris : Maisonneuve | aucun droit spécifique attaché à cette édition identifié |
| C | Scan University of Toronto | `NOT_IN_COPYRIGHT` (métadonnée) | métadonnée observée | pas une licence commerciale explicite |
| D | Fichiers OCR distribués | `licenseurl`/`rights` absents | aucune licence/mention de droits sur les fichiers | l'absence ne prouve ni interdiction ni autorisation |
| E | Transcription indépendante Hikma | pas encore produite | n/a | régime de la transcription produite par Hikma à confirmer |
| F | Données lexicales structurées Hikma | données dérivées (à confirmer) | n/a | droit de produire/stocker des dérivés à confirmer |
| G | Gloses pédagogiques courtes Hikma | création éditoriale (jamais citation) | protocole : glose courte originale, revue humaine | frontière juridique « glose dérivée vs citation » à confirmer |
| H | Usage SaaS commercial | REQUIRES LEGAL REVIEW | n/a | aucune autorisation commerciale trouvée |
| I | Redistribution publique éventuelle | REQUIRES LEGAL REVIEW | n/a | aucune autorisation trouvée |

**Ces couches ne sont jamais fusionnées.** La liberté éventuelle de l'œuvre (A) n'implique pas automatiquement la liberté de chaque couche ultérieure (C–I).

---

## I. Usage commercial envisagé par Hikma

1. **Stockage interne** : transcription du bloc lexicographique + fiches lexicales structurées dans la base Supabase.
2. **Extraction / transcription** : copie fidèle du texte source dans une forme machine, entrée par entrée.
3. **Données dérivées** : fiches `lemma` / `word_translations` structurées, traçables.
4. **Gloses éditoriales** : formulations françaises courtes créées par des humains (jamais citation directe, jamais IA/MT comme autorité).
5. **Exploitation** : affichage de ces gloses aux utilisateurs d'un SaaS **payant**.
6. **Redistribution éventuelle** : à déterminer (non prévue à court terme).

---

## J. Matrice des droits à confirmer

| Droit | Statut |
|---|---|
| usage commercial | **PENDING** |
| SaaS payant | **PENDING** |
| stockage interne | **PENDING** |
| extraction | **PENDING** |
| transcription | **PENDING** |
| données dérivées | **PENDING** |
| gloses éditoriales | **PENDING** |
| redistribution éventuelle | **PENDING** |
| attribution requise | **UNKNOWN** |

*Aucun droit n'est coché `CONFIRMED` en l'absence de preuve explicite.*

---

## K. Conditions d'un LEGAL_GO

Checklist — ne cocher une case que si une **preuve explicite** existe :

- [ ] statut juridique confirmé par une source suffisamment autoritative — **PENDING**
- [ ] usage commercial confirmé — **PENDING**
- [ ] extraction / transcription autorisée — **PENDING**
- [ ] production de données dérivées autorisée — **PENDING**
- [ ] stockage dans une base autorisé — **PENDING**
- [ ] utilisation dans un SaaS payant autorisée — **PENDING**
- [ ] absence d'obligation incompatible avec l'architecture Hikma — **PENDING**
- [ ] provenance documentée — **PENDING**
- [ ] obligations d'attribution identifiées — **PENDING**

---

## L. Points encore inconnus

1. Le régime juridique exact du **scan** (couche C) et des **fichiers OCR** (couche D) distribués par Internet Archive.
2. Le régime de la **transcription indépendante** (couche E) produite par Hikma.
3. Le régime des **données dérivées** (couche F) et **gloses éditoriales** (couche G).
4. L'existence d'éventuelles **obligations d'attribution**.
5. L'application territoriale des règles de domaine public (juridictions concernées).

Aucun de ces points n'est tranché par l'agent.

---

## M. Recommandation au décideur humain

- **Ne pas** transformer `NOT_IN_COPYRIGHT` en `LICENSE_CONFIRMED`.
- **Ne pas** transformer la disponibilité technique du scan en autorisation commerciale.
- **Faire trancher** la question centrale (B) par un **professionnel du droit**, à partir de ce dossier et des références exactes ci-dessus.
- **En attendant** : maintenir strictement **8 `validated` + 14 `proposed`**, `root = 0`, `sources = 2`, aucune migration, aucun import.

---

## N. Baseline

| Compteur | Valeur |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 18 708 |
| word_translations | 8 |
| lemmas | 22 (validated 8 / proposed 14 / rejected 0) |
| quran_words.lemma_id renseigné | 135 |
| quran_words.root renseigné | 0 |
| sources | 2 |
| dernière migration | 0020 |

**8 gloses validées intactes** (`is_validated = true`), 14 unités `proposed` inchangées.

---

## O. Tests

| Commande | Résultat attendu |
|---|---|
| npm test | 172/172 |
| npx tsc --noEmit | 0 erreur |
| npm run lint | 0 erreur |
| npm run build | 0 erreur |
| npm run verify:persistence | 13/13 |
| npm run verify:rls | 27/27 |

*(Résultats réels reportés en §P après exécution.)*

---

## P. Non-régression

- Baseline **identique** début/fin (section N).
- Aucune migration nouvelle (dernière = **0020**).
- Aucun seed, aucun script d'import résiduel.
- Aucun changement de code produit (seuls des rapports `PHASE_16*.md` et fichiers `tmp/` documentaires).
- Aucune modification des 8 gloses, aucun changement de statut, aucun ajout de source.
- `schema_ready = TRUE` : `sources.name/type/url/version/license/retrieved_at/metadata` + `word_translations.source_id/editorial_notes/is_validated/validated_at` suffisent — **aucune migration requise**.

---

## Q. Décision finale

**DECISION = LEGAL_REVIEW_REQUIRED**

**STATUS = PREPARED_NOT_EXECUTED**

**DATABASE_WRITES = 0** · **IMPORTS = 0** · **VALIDATIONS = 0**

Aucune confirmation juridique professionnelle n'est présente. Aucun `GO` n'est déclaré. Le dossier rend le blocage **précis, documenté, vérifiable et limité à une question claire**, prêt à être transmis à un professionnel du droit.

---

## Livrables

- 📄 `PHASE_16R_LEGAL_DECISION_DOSSIER.md` (ce rapport)
- 📄 `tmp/phase16r-legal-decision-evidence.json` (marqué « DOCUMENTARY ONLY · NO DATABASE WRITES · NO VALIDATION · NO IMPORT · LEGAL REVIEW REQUIRED »)

---

**DECISION: LEGAL_REVIEW_REQUIRED** · **STATUS: PREPARED_NOT_EXECUTED** · **DATABASE_WRITES: 0** · **IMPORTS: 0** · **VALIDATIONS: 0** · **PHASE 16R — ARRÊT OBLIGATOIRE.**
