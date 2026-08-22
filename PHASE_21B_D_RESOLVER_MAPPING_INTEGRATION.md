# PHASE 21B-D — INTÉGRATION CONTRÔLÉE DE `word_lemma_mapping` DANS LE RESOLVER

**STATUS FINAL : `P1/PILOT INTEGRATION COMPLETE`**
**STATUS INITIAL : `PILOT_COMPLETE` (21B-C)**

> Migration appliquée : **NON** (aucune nouvelle migration — 0022 suffit)
> Données écrites : **0** (aucun mapping créé, aucune glose importée/validée)
> Code modifié : **`lib/learning/queries.ts` uniquement** + tests

---

## 0. RÉSUMÉ

La surcouche `word_lemma_mapping` (171 mappings SAFE, Phase 21B-C) est désormais
lue par le moteur de résolution, avec la précédence exacte requise :

```
FORME (word_translations)
  ↓
LEMME DIRECT (quran_words.lemma_id)
  ↓
LEMME VIA word_lemma_mapping   ← NOUVEAU (surcouche additive, jamais un remplacement)
  ↓
EN fallback (quran_words.meaning)
```

**Gain FR réel : 0** (honnête) — l'intégration est la **plomberie** ; elle ne
fabrique aucune glose. Les 5 lemmes pilote (رَبّ، الله، الرَّحْمَـٰن، لِلَّه،
الْحَمْد) n'ont **pas encore** de glose FR validée, donc les 171 mappings ne
produisent encore aucune glose FR. Le gain apparaîtra **automatiquement** dès
l'import+validation des gloses FR de ces lemmes, sans autre modification du resolver.

---

## 1. FACTS OBSERVED

### 1.1 Audit BEFORE (photographie)

| métrique | valeur |
|---|---|
| lemmes avec glose FR validée | 14 |
| `word_translations` FR validées (forme) | 8 |
| formes avec `lemma_id` natif | 135 |
| … dont lemme à glose FR validée | 91 |
| mappings SAFE (`word_lemma_mapping`) | 171 |
| lemmes ciblés par le mapping | 5 (رَبّ، الله، الرَّحْمَـٰن، لِلَّه، الْحَمْد) |
| lemmes ciblés **avec** glose FR validée | **0** |

**`RESOLVER_COVERAGE_BEFORE = 8 (forme) + 91 (lemme direct) = 99 formes`**

### 1.2 Lecture du code réel

- `resolveWordMeanings(word, french, lemmaFrench?)` — `lib/learning/language.ts` :
  précédence **FORME > LEMME > EN**, point unique de résolution (inchangé).
- `getValidatedFrenchLemmaMeaningsByWord` — `lib/learning/queries.ts` : résolvait
  `quran_words.lemma_id` uniquement (chemin LEMME DIRECT). **C'est le point
  d'extension** (recommandé en 21B-B).
- `buildWordBank` — `lib/learning/lesson.ts` : consomme `resolveWordMeanings`
  avec les maps forme/lemme. **Inchangé** (le changement est transparent en amont).
- `getWordDetail` / `getDueReviewItems` / page leçon : appellent déjà
  `getValidatedFrenchLemmaMeaningsByWord` — **aucune surface UI à modifier** : la
  fiche mot, la review, la leçon et le word bank héritent du comportement par le
  même chemin de résolution.

### 1.3 Schéma réel vérifié

- `word_lemma_mapping` : `word_id` (UNIQUE), `lemma_id`, `confidence` (check
  `safe|review_required|rejected`), `mapping_method`, `evidence`, RLS lecture seule.
- Seuls les mappings `confidence='safe'` sont en base (REVIEW_REQUIRED/REJECTED
  jamais importés) — le resolver filtre quand même `.eq("confidence","safe")`.

---

## 2. CE QUI A ÉTÉ MODIFIÉ

### 2.1 `lib/learning/queries.ts` (seul fichier produit modifié)

1. **Nouvelle fonction** `getWordLemmaMappingsByWordIds(client, wordIds)`
   → `Map<word_id, lemma_id>`, batch `.in()`, filtre `confidence='safe'`,
   aucun fuzzy matching (le `word_id` exact uniquement).

2. **`getValidatedFrenchLemmaMeaningsByWord` étendu** :
   - lit `quran_words` (lemma direct) **et** `word_lemma_mapping` (surcouche) en
     `Promise.all` (2 requêtes batch) ;
   - regroupe **tous** les `lemma_id` candidats (directs ∪ mappés) en **une**
     requête `.in()` sur `lemma_translations` ;
   - pour chaque mot : **direct d'abord** (jamais écrasé), **mapping ensuite**
     (complément).

Aucun changement à `resolveWordMeanings` (3ᵉ paramètre lemme inchangé), à
`buildWordBank`, ni à l'UI : la précédence globale est préservée par construction.

### 2.2 Ce qui n'a PAS été modifié

- `quran_words.lemma_id` (non modifié) ;
- les 14 gloses validées et les 4 historiques Kazimirski 1860 (`is_validated=false`) ;
- les 8 `word_translations` (forme) ;
- les 171 mappings (ni créés ni modifiés) ;
- aucune migration, aucune policy RLS, aucun index supplémentaire.

---

## 3. PRÉCÉDENCE VÉRIFIÉE (tests A–I)

| # | cas | résultat |
|---|---|---|
| A | FORME prioritaire sur mapping | ✅ |
| B | LEMME DIRECT prioritaire sur mapping | ✅ |
| C | mapping utilisé quand `lemma_id` NULL | ✅ (unitaire + live) |
| D | mapping sans glose validée → fallback EN | ✅ |
| E | aucun mapping → comportement inchangé | ✅ |
| F | multi-formes → même lemme → même glose | ✅ |
| G | aucun N+1 (3 requêtes constantes pour N mots) | ✅ |
| H | régression des 14 gloses (chemin direct) | ✅ |
| I | régression des 8 `word_translations` (forme) | ✅ |

---

## 4. MESURE LIVE (sur la base réelle, aucune écriture)

| métrique | valeur |
|---|---|
| `MAPPINGS_AVAILABLE` | 171 |
| `MAPPINGS_WITH_VALIDATED_FRENCH_GLOSS` | **0** |
| `MAPPINGS_WITHOUT_VALIDATED_GLOSS` | **171** |
| formes avec `lemma_id` natif | 135 |
| résolues FR par le chemin direct | 91 |
| résolues FR par la forme | 8 |
| **`RESOLVER_COVERAGE_BEFORE`** | **99** |
| **`RESOLVER_COVERAGE_AFTER`** | **99** |
| **`GAIN_RÉEL`** | **0** |

**Preuve que le mapping est bien lu** (live, sans glose) :
`رَّبِّهِمْ` / `لِرَبِّ` / `لِرَبِّكُم` → `lemma_id` natif NULL → mapping → **رَبّ**
→ glose FR **absente** (رَبّ n'a pas de glose FR validée). Le mot est correctement
résolu jusqu'au lemme ; seul le dernier maillon (glose FR) manque.

> **Honnêteté requise par la phase** : les 171 mappings **n'ajoutent PAS 171 gloses**.
> Ils rendent 171 formes *joignables* à leur lemme ; tant que رَبّ/الله… n'ont pas de
> glose FR validée, la couverture FR réelle reste 99.

---

## 5. NON-RÉGRESSION

| commande | résultat |
|---|---|
| `npm test` | **221/221** ✅ (208 → +13 tests `resolver-mapping.test.ts`) |
| `npx tsc --noEmit` | 0 ✅ |
| `npm run lint` | 0 ✅ |
| `npm run build` | 0 ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 33/33 ✅ |

**Contrôle des données (aucune écriture métier)** :
quran_words 21 296 · word_occurrences 77 430 · ayahs 6 236 · translations 24 944 ·
lemmas 22 · lemma_translations 18 (14 validées + 4 historiques non validées) ·
word_translations 8 · word_lemma_mapping **171** (inchangé). ✅

---

## 6. PERFORMANCE & RLS

- **Aucun N+1** : résolution en 3 requêtes batch constantes (quran_words +
  word_lemma_mapping + lemma_translations) quel que soit N (vérifié par comptage
  d'appels `from()` dans le test G).
- **Index** : `UNIQUE(word_id)` de 0022 fournit le B-tree nécessaire à la lecture
  par `word_id` — aucun index/migration supplémentaire requis.
- **RLS** : lecture publique OK, INSERT/UPDATE/DELETE anon bloqués (33/33 live).
  Aucune politique modifiée.

---

## 7. CE QUI RESTE SANS GLOSE

Les **171 mappings** restent sans glose FR (0/171 résolubles). Lemmes concernés :

| lemme | formes mappées |
|---|---|
| رَبّ | 154 |
| الله | 12 |
| الرَّحْمَـٰن | 2 |
| لِلَّه | 2 |
| الْحَمْد | 1 |

**Dès qu'une glose FR validée existera pour l'un de ces lemmes**, les formes
mappées correspondantes la recevront **automatiquement** (aucune autre modification
nécessaire) — la précédence est déjà en place.

---

## 8. PROCHAINE ÉTAPE RECOMMANDÉE

**Importer + valider les gloses FR des lemmes pilote** (الله، رَبّ، الرَّحْمَـٰن،
لِلَّه، الْحَمْد) — c'est la seule action qui transformera le gain de résolution
(171 formes joignables) en gain de couverture FR réel. L'import des 23 gloses 21B-A
reste une phase séparée, sans extension automatique du corpus.

**ARRÊT OBLIGATOIRE** : ne pas poursuivre automatiquement vers 21B-E. La phase
s'arrête ici, après lecture de ce rapport.

---

## 9. LIVRABLES

- 📄 `PHASE_21B_D_RESOLVER_MAPPING_INTEGRATION.md` (ce rapport)
- 📄 `tmp/phase21b-d-resolver-mapping-integration.json` (`P1/PILOT INTEGRATION COMPLETE`)
- 📄 `lib/learning/queries.ts` (modifié : `getWordLemmaMappingsByWordIds` + extension de `getValidatedFrenchLemmaMeaningsByWord`)
- 📄 `tests/resolver-mapping.test.ts` (13 tests A–I)
