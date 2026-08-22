# PHASE 16D — RAPPORT DE DÉCISION DE SOURCE

> **Phase de recherche/audit/décision. Aucune écriture en base, aucune migration, aucune signification créée, aucun `proposed → validated`.**

## A. Baseline initiale (mesurée, lecture seule)

| Champ | Valeur |
|---|---|
| lemmas | 22 (validated 8 · proposed 14 · rejected 0) |
| quran_words.lemma_id renseigné | 135 |
| quran_words.root renseigné | 0 |
| word_translations | 8 |
| sources | 2 |

Identique en début et en fin de phase. Aucune écriture détectée.

## B. Problème de Phase 16C (rappel)

1. Copie Internet Archive : pas de métadonnées juridiques explicites → LICENSE_UNKNOWN.
2. OCR (tesseract `-l ara`) inutilisable → 0/14 entrée extraite.

## C. Sources recherchées

Gallica/BnF · Internet Archive · HathiTrust · Google Books · bibliothèques universitaires · OpenData institutionnel · transcriptions structurées (TEI/ALTO/EPUB) · alternatives licenciées (Wikidata CC0, Wiktionnaire CC BY-SA).

## D. Source candidate par candidate

### D1. Gallica / BnF — ⭐ découverte décisive

| Élément | Valeur |
|---|---|
| Tome 1 | `ark:/12148/bpt6k3413091k` |
| Tome 2 | `ark:/12148/bpt6k3413099w` |
| Titre | *Dictionnaire arabe-français contenant toutes les racines de la langue arabe* |
| Auteur | A. de Biberstein Kazimirski (1808-1887) |
| Édition cataloguée | 1960 (réédition G.-P. Maisonneuve), 2 vol. (1392, 1638 p.) |
| `dc:rights` | **« domaine public » / « public domain »** (explicite BnF) |
| Source | BnF, département Littérature et art, 8-X-24477 |
| OCR | **aucun** (`nqamoyen = 0.0`, `texteBrut` vide, pas d'ALTO/seeAlso) |
| IIIF | Image API v1.1 niveau 2, pages ~2096×3538 px téléchargeables |

### D2. Internet Archive (16C) — rejeté
LICENSE_UNKNOWN + OCR inutilisable (déjà documenté).

### D3. kazimirski.online (Sypiański) — rejeté
Édition numérique **nouvelle** d'un auteur vivant, extraite « au moyen de modèles de langue », aucune licence ouverte publiée → LICENSE_UNKNOWN + hors autorité (§2).

### D4. HathiTrust — non audité
Existence de copies probable, mais licence/OCR non vérifiés → REVIEW_REQUIRED (non audité).

### D5. Wikidata Lexemes — alternative CC0
Données CC0 (réutilisation commerciale libre, sans attribution). Couverture AR→FR des gloses d'arabe classique à mesurer → complément possible.

### D6. Wiktionnaire (FR) — CC BY-SA
Licence claire mais **Share-Alike** (dérivés à redistribuer sous CC BY-SA) → analyse d'impact requise.

## E. Audit juridique (distinction œuvre ≠ fichier)

| Couche | Statut |
|---|---|
| Œuvre originale 1860 | **domaine public** (auteur décédé 1887) |
| Mention BnF | « domaine public » / « public domain » (explicite) |
| Reproduction BnF (scan) | réutilisation **commerciale = autorisation + redevance payante** |
| Réutilisation non commerciale / académique | libre et gratuite (mention de source : BnF) |

**Source primaire** : bnf.fr « Faire une utilisation commerciale d'une reproduction » — *« …un service ou un produit payant, une prestation facturée à un tiers… Ces utilisations commerciales sont soumises à autorisation et au paiement d'une redevance »* ; *« L'utilisation non commerciale… est libre et gratuite sous réserve de la mention de source : BnF »*.

→ La mention « domaine public » concerne l'**œuvre** ; l'**utilisation commerciale de la reproduction BnF** reste soumise à redevance. Hikma étant un produit potentiellement payant, ce point est **bloquant sans décision juridique**.

## F. Audit technique

| Source | OCR | Images | Extraction fiable |
|---|---|---|---|
| Gallica/BnF | ❌ absent | ✅ IIIF HD | nécessite **notre propre OCR bilingue** |
| Internet Archive | ❌ inutilisable | ✅ | non |
| kazimirski.online | n/a | ❌ | non ouverte |

Notre OCR interne est **techniquement faisable** (images 2096×3538), mais doit traiter **arabe + français** (§7) avec relecture entrée par entrée (§8). Il porterait sur des **scans BnF** → retombe sur la question de redevance commerciale.

## G. OCR / transcription

- Gallica : pas d'ALTO ni d'OCR (« Avec mode texte » absent).
- Aucune transcription TEI/XML institutionnelle ouverte identifiée.
- IIIF manifest Tome 1 : 1404 vues ; image service fonctionnel (HTTP 200).

## H. Résultats des tests

- `nqamoyen` Gallica Tome 1 & 2 = **0.0** → OCR Gallica inexistant.
- `texteBrut` f104 = vide → confirmé.
- IIIF `info.json` + tuile image = OK → OCR interne possible techniquement.

## I. Matrice comparative

| Source | Œuvre PD | Licence copie claire | Commercial | Extraction | Qualité | Verdict |
|---|---|---|---|---|---|---|
| Gallica/BnF T1&T2 | ✅ | « domaine public » (œuvre) ; reproduction commerciale payante | COMMERCIAL_LICENSE_REQUIRED | IIIF OK, OCR absent | excellente | **REVIEW_REQUIRED** |
| Internet Archive (16C) | ✅ | ❌ LICENSE_UNKNOWN | LICENSE_UNKNOWN | OCR inutilisable | insuffisante | **REJECTED** |
| kazimirski.online | ✅ (œuvre) | ❌ LICENSE_UNKNOWN (édition nouvelle IA) | LICENSE_UNKNOWN | non ouverte | hors autorité | **REJECTED** |
| HathiTrust | probable | non vérifié | non vérifié | non vérifié | — | **REVIEW_REQUIRED** |
| Wikidata Lexemes | CC0 | ✅ CC0 | LICENSE_CONFIRMED | API/SPARQL | gloses AR→FR partielles | **GO_ALTERNATIVE_SOURCE** (complément) |
| Wiktionnaire FR | CC BY-SA | ✅ CC BY-SA | share-alike | dumps/API | classique partiel | **REVIEW_REQUIRED** |

## J. Risques

1. **Juridique** : utiliser les reproductions BnF dans un SaaS payant sans redevance → non conforme aux CGU BnF.
2. **Technique** : OCR bilingue arabe-français d'un dictionnaire 1860 = effort réel, erreurs à contrôler entrée par entrée.
3. **Licence** : kazimirski.online / Internet Archive ne lèvent pas le risque.

## K. Recommandation

1. **Décision juridique prioritaire** (l'utilisateur n'a pas à trancher seul la linguistique, mais la question de licence/redevance BnF est une décision projet) :
   - Option A : payer l'autorisation commerciale BnF (redevance documentée) ;
   - Option B : établir qu'une transcription **indépendante** du texte 1860 (exemplaire physique ou copie PD non-BnF) évite la redevance ;
   - Option C : basculer sur une source **CC0** (Wikidata) comme source primaire, Kazimirski servant de contrôle éditorial.
2. **En parallèle**, monter le pipeline OCR bilingue + relecture humaine si l'Option A/B est retenue.

## L. Décision finale

**REVIEW_REQUIRED** (LEGAL_REVIEW_REQUIRED) — la mention BnF « domaine public » concerne l'œuvre, mais l'utilisation **commerciale** des reproductions BnF est soumise à redevance. Je ne tranche pas cette question (§17 : ne pas interpréter). Une décision humaine (licence BnF payante, ou transcription indépendante, ou source CC0 alternative) est requise avant toute extraction.

## M. Plan Phase 16E (après décision)

1. Choisir le canal juridiquement propre (A/B/C).
2. Si BnF retenu : OCR bilingue sur les pages pertinentes + relecture entrée par entrée (§7-§8).
3. Retrouver les 14 entrées → fiches PROPOSED (toujours sans validation automatique).

---

⏸️ **PHASE 16D — ARRÊT OBLIGATOIRE.** Aucune signification, aucune validation, aucune écriture, aucune migration, aucun changement de statut.
