# PHASE 16H — CADRE DE DÉCISION ET PLAN DE DÉBLOCAGE DU CANAL LEXICAL FR

> **Phase STRICTEMENT READ-ONLY. Aucune écriture, aucune migration, aucune signification, aucun `proposed → validated`, aucune racine/POS/morphologie, aucun QuranMorph/Qabas, aucune donnée inventée. Aucun achat, aucun contact fournisseur, aucune acceptation de licence.**

## A. Baseline

Mesurée (lecture seule) : lemmas **22** (validated 8 · proposed 14 · rejected 0) · `quran_words.lemma_id` **135** · `root` **0** · word_translations **8** · sources **2** · dernière migration **0020**.

## B. Problème actuel

Aucun canal lexical AR→FR ne combine simultanément : licence commercialement exploitable + provenance claire + couverture suffisante + qualité lexicographique + extraction fiable. Les 14 unités restent `proposed`, sans signification FR.

## C. Sources déjà éliminées (rappel synthétique)

| Source | Statut |
|---|---|
| Quran.com glosses EN | `LICENSE_INCOMPATIBLE` (licence écrite requise) |
| Internet Archive (Kazimirski) | `REJECTED` (licence copie non établie + OCR inutilisable) |
| kazimirski.online | `REJECTED` (édition nouvelle, licence inconnue, IA) |
| Wikidata Lexemes | `COVERAGE_INSUFFICIENT` (0/14 glose FR, mesuré) |
| Belot / Bocthor | `REJECTED` (sens FR→AR) |
| Beaussier | `REJECTED` (dialecte maghrébin) |
| Oxford / Collins / Cambridge / Brill | `REJECTED` (AR↔EN, pas AR→FR) |
| Glosbe | `REJECTED` (CC BY-SA + provenance communautaire) |
| IATE / ELRA / LDC / OLAC / CLARIN | `REJECTED` (terminologie/membres) |

## D. Scénarios de déblocage (6 fiches)

### Scénario A — Kazimirski + licence commerciale BnF
- **Source** : Kazimirski 1860 (domaine public), scans BnF/Gallica.
- **Qualité** : excellente. **Couverture** : complète (toutes racines). **Extraction** : OCR interne requis (IIIF HD).
- **Licence** : `LICENSE_REVIEW_REQUIRED` (reproduction BnF commerciale = autorisation + redevance).
- **Stockage/dérivés/SaaS** : à clarifier contractuellement avec BnF.
- **Coût** : redevance (tarif BnF, par image/projet).
- **Risque** : juridique (redevance), technique (OCR bilingue).
- **Verdict** : `GO_WITH_LEGAL_REVIEW`.

### Scénario B — Kazimirski + transcription indépendante (recommandé)
- **Source** : texte 1860 (domaine public), transcrit depuis un exemplaire physique ou une copie PD **non-BnF**.
- **Qualité** : excellente. **Couverture** : complète. **Extraction** : transcription (manuelle ou assistée + relecture).
- **Licence** : œuvre PD ; la transcription INDÉPENDANTE du texte (pas la reproduction BnF) vise à éviter la redevance BnF → `LICENSE_REVIEW_REQUIRED` (à confirmer par un juriste).
- **Stockage/dérivés/SaaS** : autorisés si l'indépendance vis-à-vis de BnF est confirmée.
- **Coût** : effort de transcription (pas de redevance récurrente).
- **Risque** : juridique (à confirmer), technique (effort de transcription).
- **Verdict** : `GO_WITH_LEGAL_REVIEW` — **piste préférée**.

### Scénario C — Wiktionnaire CC BY-SA
- **Source** : fr.wiktionary (définitions communautaires).
- **Qualité** : variable. **Couverture** : partielle (رَسُول/نَاس/رَحْمَة absents).
- **Licence** : `CC BY-SA 4.0` (commercial autorisé, dérivés à partager à l'identique).
- **Risque** : contamination Share-Alike du référentiel + qualité.
- **Verdict** : `GO_WITH_LINGUIST_REVIEW` (après avis juridique SA) — qualité insuffisante seule.

### Scénario D — Fournisseur commercial AR→FR (Lexicala)
- **Source** : Lexicala / K Dictionaries.
- **Qualité** : index AR→EN humain, mais couche AR→FR **semi-automatique** (contredit « pas d'IA/MT comme autorité »).
- **Licence** : `COMMERCIAL_LICENSE_REQUIRED` (négociée, prix inconnu).
- **Stockage/dérivés/SaaS** : à négocier.
- **Verdict** : `REVIEW_REQUIRED`.

### Scénario E — Combinaison multi-sources
- **Principe** : chaque glose a sa propre provenance (source A → glose X, source B → glose Y), jamais de fusion synthétique non traçable.
- **Licence** : dépend de chaque source.
- **Verdict** : architecture valide (`GO` architectural) mais chaque source doit être individuellement débloquée.

### Scénario F — Maintien du référentiel actuel (fallback)
- **Principe** : 14 unités restent `proposed`, aucune nouvelle signification ; le produit fonctionne avec les 8 gloses existantes.
- **Verdict** : `GO` (sûr, zéro risque juridique/linguistique).

## E. Analyse juridique (synthèse)

Distinction constante **œuvre ≠ fichier numérique ≠ transcription** :
- Œuvre 1860 = domaine public.
- Reproduction BnF = redevance commerciale.
- Transcription indépendante = à confirmer juridiquement (ne pas interpréter soi-même).

## F. Analyse linguistique

Le propriétaire n'est pas présumé expert en arabe classique. Quatre unités nécessitent une revue spécialisée (déjà identifiées en 16A) : عَبْد (serviteur/esclave), كِتَاب (livre/écrit/prescription), كَان (copule), كَفَر (mécroire/renier). Toute glose finale doit être reliée à une source lexicale identifiable.

## G. Analyse technique

- BnF : OCR absent → OCR bilingue interne (arabe + français) + relecture entrée par entrée.
- Transcription indépendante : effort manuel/assisté, contrôle qualité.
- API commerciales : accès programmatique mais conditions de stockage à négocier.

## H. Analyse commerciale

- A : redevance BnF (coût projet, récurrent possible).
- B : coût de transcription (une fois).
- C : gratuit (contrepartie Share-Alike).
- D : prix inconnu (`PRICE_UNKNOWN`).
- F : gratuit.

## I. Matrice comparative

| Scénario | Licence | AR→FR | Qualité | SaaS | Dérivés | Coût | Risque | Verdict |
|---|---|---|---|---|---|---|---|---|
| A (BnF) | REVIEW_REQUIRED | ✅ | excellente | payant | à clarifier | redevance | juridique | GO_WITH_LEGAL_REVIEW |
| **B (transcription indépendante)** | PD (à confirmer) | ✅ | excellente | ✅ | ✅ | effort | juridique (à confirmer) | **GO_WITH_LEGAL_REVIEW (recommandé)** |
| C (Wiktionnaire) | CC BY-SA | partiel | variable | SA | SA | 0 | SA+qualité | GO_WITH_LINGUIST_REVIEW |
| D (Lexicala) | négociée | ✅ | mixte (FR auto) | à négocier | à négocier | inconnu | juridique+qualité | REVIEW_REQUIRED |
| E (multi-source) | mixte | mixte | mixte | mixte | par source | mixte | traçabilité | GO (archi) |
| F (maintien) | n/a | n/a | n/a | n/a | n/a | 0 | aucun | GO (fallback) |

## J. Architecture multi-sources

Hikma doit être **multi-sources par conception** : chaque `word_translation` porte sa propre `source_id`. Aucune glose synthétique issue de la fusion implicite de plusieurs sources. Une glose adaptée est marquée `EDITORIAL_ADAPTATION`.

## K. Protocole de provenance (compatible avec le modèle existant — aucune migration requise)

Le schéma actuel couvre déjà la provenance demandée :

| Champ requis (16H §6) | Emplacement existant |
|---|---|
| source_name | `sources.name` |
| source_type | `sources.type` |
| source_reference | `sources.url` (+ `sources.version`) |
| source_license_status | `sources.license` (texte libre, ex. « CC BY-SA 4.0 » ou « LICENSE_REVIEW_REQUIRED ») |
| retrieved_at | `sources.retrieved_at` |
| editorial_note | `word_translations.editorial_notes` |

`word_translations.source_id` est déjà `NOT NULL` (FK → sources). **Aucune nouvelle colonne/table n'est nécessaire.** Seule remarque : `sources.license` est du texte libre (pas une enum) — acceptable pour V1, à structurer plus tard si besoin.

## L. Protocole de validation humaine

```
SOURCE → EXTRACTION → TRANSCRIPTION → ADAPTATION ÉDITORIALE FR → FICHE PROPOSED
  → REVUE HUMAINE → ACCEPTATION/REFUS → (seulement alors) validated
```

- **Rôles** : le propriétaire valide la **provenance**, la **conformité au processus** et la **décision produit** (pas l'arabe).
- Un **REVIEWER / LINGUISTE QUALIFIÉ** valide la **correction linguistique** (`SPECIALIST_REVIEW_REQUIRED` pour عَبْد, كِتَاب, كَان, كَفَر et tout polysème/homographe).
- Aucune étape automatique ne fait `proposed → validated`.

## M. Pipeline futur (~250 unités)

Avant tout import massif : (1) valider la source, (2) sa licence, (3) le droit commercial, (4) le stockage, (5) le droit dérivé, (6) mesurer la couverture, (7) tester l'extraction, (8) fiches pilotes, (9) revue linguistique, (10) seulement alors importer.

## N. Stratégie pour les 14 unités

**Maintenir `proposed`** (règle par défaut). Aucun retrait, aucune validation, aucun enrichissement dans cette phase. Les 4 unités à revue spécialisée restent signalées.

## O. Stratégie pour les ~250 unités

Ne pas reproduire les blocages 16A→16G : la **source est validée avant** tout travail d'import, jamais après. Pipeline en §M.

## P. Risques

1. Juridique (redevance BnF, Share-Alike, licence négociée).
2. Linguistique (couche FR auto-générée, homographes, polysémie).
3. Technique (OCR bilingue, effort de transcription).

## Q. Recommandation

1. **Scénario F immédiat** : garder le référentiel stable (8 gloses, 14 proposed) — zéro risque.
2. **Scénario B comme cible** : obtenir une **confirmation juridique unique** — « une transcription indépendante du texte 1860 (à partir d'un exemplaire physique / copie PD non-BnF) est-elle libre de toute redevance BnF ? » — puis transcrire + relecture.
3. **Scénario D en parallèle (optionnel)** : demander à Lexicala un devis précisant storage + dérivés + SaaS + non-redistribution, et la nature exacte de la couche AR→FR.

## R. Décision finale

**STOP_SOURCE — NO_SAFE_LEXICAL_CHANNEL_FOUND**

Aucun scénario ne peut être déclaré `GO` immédiatement sans décision humaine. **La décision manquante est unique et identifiée** : confirmer juridiquement le scénario B (transcription indépendante du domaine public), à défaut payer A (BnF), accepter C (SA) ou négocier D (Lexicala). Le cadre ci-dessus permet de trancher méthodiquement sans forcer un faux `GO`.

## S. Preuve de non-régression

Baseline fin = baseline début : lemmas **22** (8/14/0) · lemma_id **135** · root **0** · word_translations **8** · sources **2** · dernière migration **0020**. Les 8 gloses existantes strictement inchangées. Aucun script d'import, aucune migration, aucun seed, aucune écriture.

---

**STOP_SOURCE — NO_SAFE_LEXICAL_CHANNEL_FOUND**

**PHASE 16H — ARRÊT OBLIGATOIRE.**
