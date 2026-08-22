# PHASE 16I — AUDIT CIBLÉ DU SCÉNARIO B : TRANSCRIPTION INDÉPENDANTE DE KAZIMIRSKI 1860

> **Phase STRICTEMENT READ-ONLY. Aucune écriture, aucune migration, aucune signification, aucun `proposed → validated`, aucune racine/POS/morphologie, aucun QuranMorph/Qabas, aucune donnée inventée. Aucun achat, aucun contact fournisseur, aucune conclusion juridique au-delà des textes consultés.**

## Question unique

*« Peut-on construire un canal légalement et techniquement propre à partir de Kazimirski 1860 en transcription indépendante, sans dépendre d'une reproduction numérique BnF commercialement restreinte ? »*

## Résultat — OUI, techniquement (avancée décisive vs 16F–16H)

Une copie **indépendante de BnF** a été identifiée et qualifiée :

| Élément | Valeur |
|---|---|
| Source | Kazimirski 1860 — édition **originale** (Paris : Maisonneuve) |
| Numérisation | **University of Toronto** (archive.org) |
| Tome 1 | `dictionnairearab01bibeuoft` |
| Tome 2 | `dictionnairearab02bibeuoft` |
| Statut archive.org | `possible-copyright-status: NOT_IN_COPYRIGHT` |
| OCR | **tesseract 5.3.0 `-l fra+ara`** (détecté français) |
| Fichiers | PDF, EPUB, `_djvu.txt`, `_jp2.zip` (images pages) |
| SHA-256 T1 `_djvu.txt` | `c6aa3269cbc2dbb5b8698bc021146b3d20f4d60e04d41201dc2659b725b4df73` |

### Preuve de qualité OCR (mesurée)

Contrairement à la copie 16C (OCR `-l ara` inutilisable), cette copie a été OCRisée en **bilingue** :

- **Français lisible** : « jour » ×676 (tome 1), « livre » ×272 (tome 2) — exemples : *« depuis le jour », « Pour toujours », « Être brûlant (se dit d'un jour) »*.
- **Arabe partiellement lisible** : `يوم` retrouvé (ex. *« De là, يوم … Jour éga[l]… »*) — les vedettes arabes restent à **vérifier contre le scan** (jamais fiables aveuglément).

## Distinction juridique (obligatoire, sans interprétation)

| Couche | Statut |
|---|---|
| Œuvre originale 1860 (auteur décédé 1887) | domaine public |
| Édition numérisée | édition **originale** 1860, pas la réédition BnF 1960 |
| Reproduction numérique | scan Univ. Toronto ; archive.org marque `NOT_IN_COPYRIGHT` |
| `licenseurl` / `rights` | **absents** (seul le flag `possible-copyright-status` est présent) |
| Conditions BnF | **non applicables** (ce n'est pas la reproduction BnF) |
| Confirmation finale | `LEGAL_REVIEW_REQUIRED` (ne pas auto-interpréter) |

## Pipeline transcription indépendante (documenté, non exécuté)

```
EXEMPLAIRE PD (U Toronto, NOT_IN_COPYRIGHT)
  ↓ SCAN (images _jp2.zip / PDF)
  ↓ OCR ARABE + FRANÇAIS (fra+ara déjà lisible, à affiner)
  ↓ CORRECTION OCR (contre l'image de page)
  ↓ IDENTIFICATION DE L'ENTRÉE (par racine, vérifiée visuellement)
  ↓ EXTRACTION DE LA DÉFINITION
  ↓ ADAPTATION ÉDITORIALE COURTE (marquée EDITORIAL_ADAPTATION)
  ↓ FICHE PROPOSED
  ↓ REVUE LINGUISTIQUE (REVIEWER / LINGUISTE QUALIFIÉ)
  ↓ VALIDATION (seulement alors validated)
```

## Pilote technique futur (hors base, 5 entrées)

يَوْم · رَسُول · رَحْمَة · كِتَاب · كَفَر — mesurer : taux de récupération, qualité OCR arabe/fr, segmentation, temps de correction, traçabilité de page, reproductibilité. **Ne pas produire les gloses finales.**

## Provenance (schéma existant suffisant — aucune migration)

| Champ requis | Emplacement |
|---|---|
| source_name / type / reference / license_status / retrieved_at | `sources` (name/type/url/license/retrieved_at) |
| edition | `sources.version` (« 1860 ») |
| page_reference | `sources.metadata` (jsonb) |
| editorial_note | `word_translations.editorial_notes` |

`word_translations.source_id` est déjà `NOT NULL` → provenance obligatoire déjà garantie.

## Adaptation FR ancien → moderne (§13)

Distinction stricte : **SOURCE** (texte lexicographique Kazimirski) ≠ **SORTIE ÉDITORIALE** (glose courte Hikma). Toute glose adaptée = `EDITORIAL_ADAPTATION`, traçable vers la page/édition source.

## Validation humaine (§14)

- Propriétaire : valide provenance, conformité au processus, décision produit (pas l'arabe).
- `REVIEWER / LINGUISTE QUALIFIÉ` : valide exactitude lexicale, sens, homonymes, contexte, adaptation.

## Matrice des sources

| Source | Œuvre PD | Copie PD/licenciée | Commercial | Dérivés | Extraction | Qualité | Risque | Verdict |
|---|---|---|---|---|---|---|---|---|
| **Univ. Toronto 1860 (archive.org)** | ✅ | NOT_IN_COPYRIGHT (licenseurl absent) | à confirmer | à confirmer | OCR bilingue lisible + images | excellente | juridique (confirmation) | **GO_WITH_LEGAL_REVIEW** |
| BnF/Gallica 1960 | ✅ (œuvre) | redevance commerciale | payant | à clarifier | IIIF, OCR absent | excellente | redevance | GO_WITH_LEGAL_REVIEW (coûteux) |
| Internet Archive (16C) | ✅ | LICENSE_UNKNOWN | UNKNOWN | UNKNOWN | OCR inutilisable | — | licence+OCR | REJECTED |

## Décision finale

**B-GO_WITH_LEGAL_REVIEW**

La voie technique est **désormais démontrée** (copie 1860 originale, indépendante de BnF, marquée `NOT_IN_COPYRIGHT`, OCR bilingue lisible, images téléchargeables). La seule condition restante est une **confirmation juridique unique** : l'utilisation commerciale d'une transcription produite à partir de ce scan Univ. Toronto est-elle libre ? (Le champ `licenseurl` étant absent, je ne le conclus pas moi-même.)

## Recommandation projet

1. Faire confirmer juridiquement le point ci-dessus (une question, un professionnel).
2. Si confirmé : « Kazimirski (édition 1860, scan Univ. Toronto) comme source lexicographique de référence, transcription indépendante, provenance stricte, revue linguistique humaine ».
3. En attendant : maintenir **14 `proposed` + 8 `validated`** (aucun import).

## Non-régression (lecture seule)

Baseline identique début/fin : lemmas **22** (8/14/0) · lemma_id **135** · root **0** · word_translations **8** · sources **2** · dernière migration **0020**. Les 8 gloses existantes strictement inchangées. Aucun script d'import, aucune migration, aucun seed.

---

**B-GO_WITH_LEGAL_REVIEW**

**PHASE 16I — ARRÊT OBLIGATOIRE.**
