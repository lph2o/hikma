# PHASE 16G — AUDIT DES SOURCES LEXICALES COMMERCIALES ARABE → FRANÇAIS

> **Phase STRICTEMENT READ-ONLY. Aucune écriture, aucune migration, aucune signification, aucun `proposed → validated`, aucune racine/POS/morphologie, aucun QuranMorph/Qabas, aucune donnée inventée.**

## A. Baseline

Mesurée (lecture seule) : lemmas **22** (validated 8 · proposed 14 · rejected 0) · lemma_id **135** · root **0** · word_translations **8** · sources **2**. Identique en début et fin de phase.

## B. Objectif

Déterminer s'il existe une source **commerciale ou sous licence écrite** AR→FR permettant de débloquer le référentiel, après le `STOP_SOURCE` de Phase 16F. Direction exigée : **arabe → français**.

## C. Méthodologie

Sources primaires (pages produits/conditions des fournisseurs). Aucun achat, aucune souscription, aucun contact. Toute licence non publiée = `PRICE_UNKNOWN` / `LEGAL_REVIEW_REQUIRED`. Aucune licence déduite.

## D. Fournisseurs recherchés

Oxford Languages · Collins · Cambridge · Brill · Lexicala · Glosbe · Reverso · Babylon · Lingea · SYSTRAN · IATE · ELRA · LDC · OLAC · CLARIN.

## E. Sources trouvées (résultat clé)

**Le marché des dictionnaires numériques est massivement arabe↔anglais.** L'arabe→français est sous-représenté :

| Fournisseur | AR→FR ? | Nature |
|---|---|---|
| **Lexicala (K Dictionaries)** | **OUI** (« To French : Arabic ») | données vendues, licence négociée |
| Oxford Languages | NON (AR↔EN) | API commerciale |
| Collins / Cambridge / Brill | NON (AR↔EN) | édition |
| Glosbe | OUI (communautaire) | CC BY-SA |
| Reverso / SYSTRAN / Babylon / Lingea | MT, pas de dataset | — |
| IATE | terminologie UE | non-commercial |
| ELRA / LDC / OLAC / CLARIN | catalogues | adhésion |

## F. Couverture mesurée

- Lexicala : **non mesurable** (entrées vendues, pas d'accès gratuit) — présence AR→FR attestée par la page produit.
- Aucun autre fournisseur n'offre AR→FR licenciable → couverture n/a.

## G. Audit des licences

| Fournisseur | Licence | Statut |
|---|---|---|
| Lexicala | commerciale **négociée** (aucune licence publique) | `COMMERCIAL_LICENSE_REQUIRED` |
| Oxford | Enterprise (dès ~£5 000/an/langue) — mais **pas d'AR→FR** | `REJECTED` |
| Glosbe | CC BY-SA (communautaire) | `REJECTED` (SA + provenance) |
| IATE | téléchargement « non-commercial » | `REJECTED` |

## H. Conditions SaaS / I. Données dérivées / J. Stockage / K. Redistribution (Lexicala)

Toutes **à négocier** (aucune condition publique) : SaaS, stockage, création de gloses courtes dérivées, non-redistribution de la base. → `LEGAL_REVIEW_REQUIRED`.

## L. Coûts

- Lexicala : `PRICE_UNKNOWN` (« Purchase full dataset » / « Book a call »).
- Oxford : Enterprise dès ~£5 000/an/langue (mais sans AR→FR).
- Aucun prix inventé.

## M. Risques

1. **Couche AR→FR auto-générée** : Lexicala décrit le « Multigloss French Dictionary » comme « based on a human-edited bilingual index … to English **semi-automatically generated** to translations in 45 more languages ». → la couche AR→FR est **générée semi-automatiquement depuis l'anglais**, ce qui contredit la règle projet « pas de glose générée par IA/MT comme autorité ».
2. **Licence opaque** : conditions de données dérivées/SaaS non publiées.
3. **Sous-représentation structurelle** de l'arabe→français dans l'offre commerciale.

## N. Matrice comparative

| Fournisseur | AR→FR | Licence | Commercial | Dérivés/SaaS | Verdict |
|---|---|---|---|---|---|
| Lexicala | ✅ | négociée | `COMMERCIAL_LICENSE_REQUIRED` | à négocier | **COMMERCIAL_LICENSE_REQUIRED** (+ QUALITY_INSUFFICIENT couche FR) |
| Oxford | ❌ | commerciale | ✅ | n/a | REJECTED |
| Collins/Cambridge/Brill | ❌ | édition | ✅ | n/a | REJECTED |
| Glosbe | ✅ | CC BY-SA | SA | SA | REJECTED |
| Reverso/SYSTRAN/… | MT | — | — | — | REJECTED |
| IATE | terminologie | non-commercial | ❌ | — | REJECTED |
| ELRA/LDC/OLAC/CLARIN | catalogues | adhésion | — | — | REJECTED |

## O. Recommandation

Aucune source commerciale n'est **immédiatement** exploitable. Lexicala est la seule piste AR→FR, mais elle cumule deux blocages : (a) licence commerciale à négocier (dérivés/SaaS/storage inconnus), (b) couche AR→FR semi-automatique (provenance machine, contre la règle « pas d'IA/MT comme autorité »). Son index AR→EN est, lui, édité humainement — mais ne produit pas de FR.

## P. Questions juridiques restantes (à poser plus tard, pas maintenant)

1. *« Does the commercial license permit a SaaS to store short editorial definitions derived from the Arabic-French layer, without redistributing the original database? »*
2. *« Is the Arabic→French layer machine-generated? Can the underlying human-edited Arabic→English index be licensed instead? »*

## Q. Décision finale

**STOP_SOURCE — NO_SAFE_COMMERCIAL_LEXICAL_CHANNEL_FOUND**

Aucune source commerciale ne combine licence claire + couverture AR→FR + qualité éditoriale + conditions de données dérivées/SaaS vérifiées. Lexicala est documentée comme piste `COMMERCIAL_LICENSE_REQUIRED` à instruire par l'humain (devis + avis juridique + vérification de la couche FR auto-générée).

## R. Vérification de non-écriture

Baseline fin = baseline début (22/8/14/0 · 135 · 0 · 8 · 2). Aucune migration (dernière = 0020), aucun script résiduel, aucun code produit modifié, 8 gloses strictement inchangées. Aucun achat, aucune souscription, aucun contact fournisseur.

## S. Plan Phase 16H

Après décision humaine : soit instruire Lexicala (devis + licence + vérif. couche FR), soit revenir aux voies ouvertes de 16F (transcription indépendante de Kazimirski / autorisation BnF / acceptation CC BY-SA), soit obtenir une licence écrite d'un fournisseur AR→FR. Puis, seulement, extraction + fiches **PROPOSED** (jamais auto-validées).

---

**STOP_SOURCE — NO_SAFE_COMMERCIAL_LEXICAL_CHANNEL_FOUND**

**PHASE 16G — ARRÊT OBLIGATOIRE.**
