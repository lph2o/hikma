# PHASE 16F — RECHERCHE ET DÉBLOCAGE DU CANAL LEXICAL FRANÇAIS

> **Phase STRICTEMENT READ-ONLY. Aucune écriture, aucune migration, aucune signification, aucun `proposed → validated`, aucune racine/POS/morphologie, aucun QuranMorph/Qabas, aucune donnée inventée.**

## A. Baseline

Mesurée (lecture seule) : lemmas **22** (validated 8 · proposed 14 · rejected 0) · lemma_id **135** · root **0** · word_translations **8** · sources **2**. Identique en début et fin de phase.

## B. Objectif

Répondre à une seule question : *« Avons-nous maintenant un canal lexical arabe → français suffisamment fiable, traçable et juridiquement exploitable pour continuer vers la préparation des 14 significations ? »* (Pas : « quelles significations valider ? ».)

## C. Méthodologie

Sources primaires/officielles (BnF SRU+IIIF, archive.org metadata, GitHub API, Wikidata SPARQL, Wiktionnaire API) + **mesure réelle** de couverture. Aucune licence déduite ; toute licence non vérifiable = `LICENSE_UNKNOWN`.

## D. Sources recherchées

Kazimirski · Belot · Bocthor · Beaussier · Cherbonneau · Marcel · Gallica/BnF · HathiTrust · Internet Archive · Google Books · Wiktionnaire · Wikidata · Wikimedia Commons · GitHub (transcriptions/OCR) · dépôts TEI/institutionnels.

## E. Sources trouvées (nouvelles vs phases précédentes)

| Source | Direction | Statut copie | Résultat |
|---|---|---|---|
| **Belot** (1890/1913) | français→arabe | scan, LICENSE_UNKNOWN | mauvais sens (il faut AR→FR) |
| **Bocthor** (1828) | français→arabe | Public Domain Mark (certains exemplaires) | mauvais sens |
| **Beaussier** (1871/1887) | arabe→français | scan, pas de transcription propre | arabe **maghrébin/dialectal** ≠ coranique classique |
| **francoisbruneau/kazimirski** (GitHub) | outil Rails | MIT (code) | **outil de transcription, aucune donnée** (seeds = 307 octets) |
| **JMG966/05_kazimirski_ocr** (GitHub) | OCR | NO_LICENSE | LICENSE_UNKNOWN |
| **fhamz13/le-mojam** (GitHub) | app Java | NO_LICENSE | LICENSE_UNKNOWN |

**Aucune transcription AR→FR du domaine public, clairement licenciée et exploitable, n'a été trouvée.**

## F. Audit juridique (œuvre ≠ fichier ≠ transcription)

| Couche | Kazimirski | Belot/Bocthor/Beaussier | Wikidata | Wiktionnaire |
|---|---|---|---|---|
| Œuvre | domaine public | domaine public | CC0 | CC BY-SA |
| Fichier numérique | BnF = redevance commerciale · archive.org = UNKNOWN | scan, licence non établie | CC0 | CC BY-SA |
| Transcription | aucune propre/licenciée | aucune | n/a (données) | CC BY-SA |

## G. Audit technique

- BnF/Gallica : IIIF HD mais **OCR absent** (`nqamoyen 0.0`).
- archive.org : OCR inutilisable (tesseract `-l ara`).
- GitHub : outil/OCR sans licence de données.
- Wikidata/Wiktionnaire : API/dumps exploitables mais contenu insuffisant (voir H).

## H. Mesure de couverture (réelle, pas supposée)

| Source | Lexème/entrée | Glose FR |
|---|---|---|
| Wikidata Lexemes | 13/14 lexèmes arabes | **0/14** glose FR (0 sens) |
| Wiktionnaire FR | partielle (يَوْم/عَبْد/قَوْم/نَبِيّ présents ; رَسُول/نَاس/رَحْمَة absents) | partielle |
| Kazimirski | œuvre complète (toutes racines) | **non extractible** (aucune copie machine propre) |

## I. Audit linguistique

- Kazimirski : référence classique AR→FR, qualité excellente — mais canal numérique non sécurisé.
- Beaussier/Belot/Bocthor : dialecte maghrébin ou sens inversé — hors périmètre coranique classique.
- Wikidata : lexèmes vides de sens. Wiktionnaire : qualité communautaire variable.

## J. Collisions (jamais fusionnées)

كَفَر≠كَفَّر≠كُفِر · عَبْد≠عِبَاد · رَسُول≠رُسُل · كِتَاب≠كَتَبَ≠كُتُب · كَان≠كَانُوا≠كُنْتُم · فِي≠فِّى · دِين≠دَيْن · مَلِك≠مَالِك≠مُلْك≠مَلَك · خَلَقَ≠خَلْق · حَقّ≠حَقَّ · عَلِمَ≠عَلَّمَ≠عِلْم · مَثَل≠مِثْل · جَنَّة≠جِنَّة≠جُنَّة.

## K. Matrice comparative (classification par source)

| Source | Licence | Commercial | Couverture | Extraction | Classification |
|---|---|---|---|---|---|
| Kazimirski (BnF) | domaine public (œuvre) | redevance | complète | OCR requis | **REVIEW_REQUIRED** |
| Kazimirski (archive.org) | UNKNOWN | UNKNOWN | complète | OCR inutilisable | **REJECTED** |
| kazimirski.online | UNKNOWN | UNKNOWN | 40k entrées | non ouverte | **REJECTED** |
| francoisbruneau GitHub | MIT (code) | — | 0 donnée | n/a | **REJECTED** |
| Belot | UNKNOWN | UNKNOWN | FR→AR | n/a | **REJECTED** |
| Bocthor | PD (œuvre) | PD | FR→AR | n/a | **REJECTED** |
| Beaussier | UNKNOWN | UNKNOWN | dialecte | n/a | **REJECTED** |
| Wikidata Lexemes | CC0 | ✅ | **0/14** | API | **COVERAGE_INSUFFICIENT** |
| Wiktionnaire FR | CC BY-SA | SA | partielle | dumps | **REVIEW_REQUIRED** |
| Quran.com | écrit requis | ❌ | EN | n/a | **LICENSE_INCOMPATIBLE** |

## L. Provenance

Architecture de provenance retenue (pour toute future glose) : `source_name` / `source_type` / `source_reference` / `source_license_status` / `retrieved_at` / `editorial_note`. Toute glose adaptée = `EDITORIAL_ADAPTATION` (jamais citation directe implicite).

## M. Risques

1. **Aucune source n'est prête** : qualité (Kazimirski) ≠ canal légal sécurisé ; licence parfaite (CC0) ≠ contenu (0/14).
2. **Contamination Share-Alike** de Wiktionnaire sur un référentiel commercial.
3. **Coût/redevance BnF** à arbitrer.

## N. Recommandation

Aucun canal ne satisfait simultanément les cinq critères (licence commerciale + provenance + couverture + qualité + extraction fiable). Les voies de déblocage relèvent de **décisions projet** (licence/coût/fournisseur), pas de compétence linguistique de l'utilisateur :

1. Autorisation commerciale BnF (Kazimirski) → OCR bilingue + relecture.
2. Transcription **indépendante** du texte 1860 (exemplaire physique / copie PD non-BnF).
3. Acceptation de la licence CC BY-SA de Wiktionnaire (avis juridique Share-Alike).
4. Licence écrite d'un fournisseur lexical moderne AR→FR.

## O. Décision finale

**STOP_SOURCE — NO_SAFE_LEXICAL_CHANNEL_FOUND**

Aucune source ne combine licence commercialement exploitable + provenance claire + couverture suffisante + qualité acceptable + extraction fiable. Rien n'est importé.

## P. Vérification de non-écriture

Baseline fin = baseline début (22/8/14/0 · 135 · 0 · 8 · 2). Aucune migration créée/appliquée (dernière = 0020). Aucun script résiduel. Aucun code produit modifié. Les 8 gloses existantes strictement inchangées.

## Q. Proposition de Phase 16G

Après une décision humaine sur le canal (N.1→N.4) : obtention du texte licencié → extraction des 14 entrées → fiches **PROPOSED** (source + définition originale + adaptation + provenance + confiance + éventuel `SPECIALIST_REVIEW_REQUIRED`) — sans jamais auto-valider.

---

**STOP_SOURCE — NO_SAFE_LEXICAL_CHANNEL_FOUND**

**PHASE 16F — ARRÊT OBLIGATOIRE.**
