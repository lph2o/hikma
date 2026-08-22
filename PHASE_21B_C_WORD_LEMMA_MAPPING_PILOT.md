# PHASE 21B-C — WORD → LEMMA MAPPING PILOT

**STATUS FINAL : `PILOT_COMPLETE`**
**STATUS INITIAL : `AUDIT_COMPLETE` (21B-B)**

> Migration appliquée : **OUI** (`0022_word_lemma_mapping.sql`)
> Mappings importés : **171** (uniquement `SAFE`)
> `database_writes = 171` · `migration_applied = true` · `RESOLVER = NON MODIFIÉ`

---

## 0. RÉSUMÉ EXÉCUTIF

La recommandation 21B-B (**Option B** — table additive `word_lemma_mapping`) a été
implémentée sous forme de **pilote limité et réversible** :

- **1 migration additive** (jamais de modification de `quran_words.lemma_id`) ;
- **1 classifieur déterministe** (`lib/quran/lemma-mapping.ts`) fondé sur la
  **décomposition structurelle exacte** (proclitique fermé + cœur + enclitique
  fermé), jamais sur `normalized_text`, jamais sur du fuzzy matching ;
- **171 mappings SAFE** importés (idempotent), couvrant **1 270 occurrences** ;
- **11 REVIEW_REQUIRED** et **11 REJECTED** identifiés et **NON importés** ;
- **Resolver NON modifié** (décision 21B-C §12 respectée).

Le modèle fonctionne. **DECISION GATE : le pilote est VALIDÉ** — extension en 21B-D.

---

## 1. FACTS OBSERVED

### 1.1 Baseline (avant écriture) — identique à 21B-A / 21B-B

| table | count |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 |
| lemmas | 22 |
| lemma_translations | 18 (14 validées + 4 historiques Kazimirski 1860 non validées) |
| sources | 4 |
| word_translations | 8 |
| quran_words avec `lemma_id` renseigné | 135 |
| quran_words avec `lemma_id` NULL | 21 161 |

Les 14 gloses FR validées et les 4 entrées historiques (`is_validated = false`)
sont restées **strictement identiques** (vérifié après import).

### 1.2 Architecture implémentée

```
quran_words ──(lemma_id natif, NON modifié)──▶ lemmas ──▶ lemma_translations
      │
      └──▶ word_lemma_mapping (surcouche additive) ──▶ lemmas
```

`word_lemma_mapping` :
- `word_id` → `quran_words.id` (FK, `on delete cascade`) ;
- `lemma_id` → `lemmas.id` (FK, `on delete cascade`) ;
- `source_id` → `sources.id` (FK, provenance **obligatoire**, sans `ON DELETE SET NULL`) ;
- `mapping_method ∈ {exact_surface, editorial}` ;
- `confidence ∈ {safe, review_required, rejected}` ;
- `evidence`, `editorial_notes` ;
- **`UNIQUE(word_id)`** → un mot n'a qu'un seul lemme mappé ;
- index sur `lemma_id`, `source_id`, `confidence`.

RLS : **lecture publique** (`for select using (true)`), **aucune policy d'écriture**
(INSERT/UPDATE/DELETE refusés pour tous les rôles applicatifs — seul le service role
écrit, via `scripts/seed-word-lemma-mapping.ts`).

### 1.3 Provenance (réelle, non fictive)

- `source_id = 79e6412e-e349-4fe5-b29b-108237375a2d`
- `name = "Hikma — lexique éditorial"`
- Chaque ligne répond à « quel word_id → quel lemma_id, pourquoi, comment, confiance,
  preuve » via `mapping_method` + `confidence` + `evidence` + `editorial_notes`.

### 1.4 Méthode de mapping (21B-C §6 respectée)

Un mapping n'est créé **que si** la décomposition structurelle exacte est possible :

1. proclitique ∈ ensemble fermé documenté `{و، ب، ل، ف}` (الله : étendu à `ت، أ، ء`) ;
2. cœur lexical **dérivé des lignes `lemmas` réelles** (jamais saisi à la main) ;
3. enclitique pronominal ∈ ensemble fermé documenté
   `{كما، هما، كم، كن، هم، ها، هن، نا، ك، ه، ي}` ;
4. la glose anglaise (`quran_words.meaning`) sert de **CONTRÔLE** (jamais de preuve
   unique d'identité morphologique).

**Interdits respectés** : pas de `LIKE`, pas de `contains`, pas de `startsWith` naïf,
pas de distance de chaîne, pas de règle « contient الله », pas de mapping fondé
uniquement sur `normalized_text` ou sur une traduction.

### 1.5 Résultats du classifieur (dry-run, aucune écriture)

| catégorie | formes | occurrences |
|---|---|---|
| **SAFE** (importés) | **171** | **1 270** |
| REVIEW_REQUIRED (NON importés) | 11 | ~14 |
| REJECTED (NON importés) | 11 | ~11 |

**Lemmes couverts par le pilote :**

| lemme | formes mappées |
|---|---|
| رَبّ | 154 |
| الله | 12 |
| الرَّحْمَـٰن | 2 |
| لِلَّه | 2 |
| الْحَمْد | 1 |

### 1.6 Cas exclus (garde-fous anti-réduction)

**REVIEW_REQUIRED (11)** — jamais importés :
- `ٱللَّهُمَّ` (vocatif, الله + مّ) — **NON assimilé automatiquement** à الله ;
- formes en tanwīn `رَبًّا` (« a Lord », normalise en « ربا »), `رَبَّـٰنِيِّـۧنَ` ;
- `رِبِّيُّونَ`, `رَبَّيَانِى`, `رَبْوَةٍ`, `رُبَمَا`, `وَرَبَتْ` (homographes non confirmés) ;
- `يُضْلِلْهُ` (contient لله mais n'est pas لِ + الله).

**REJECTED (11)** — faux positifs démontrés :
- `ٱللَّهَبِ` (Abu Lahab, racine ل-ه-ب), `ٱللَّهْوِ` (divertissement, ل-ه-و) ;
- `لَلْهُدَىٰ` (ل + الهُدَى, pas لِ + الله) ;
- `رِّبًۭا` (usure), `رِّبَاطِ`, `رَبِحَت`, `رَّبَطْنَا`, `وَرُبَـٰعَ`, `وَرَبَـٰٓئِبُكُمُ` (racines homographes).

**Grammaticaux exclus du pilote** (21B-C §5.D) : `مِن` / `مَا` / `إِنَّ` — stratégie
dédiée requise (voir PHASE 21B-B, Partie D).

### 1.7 Vérifications post-import (intégrité / unicité)

| vérification | résultat |
|---|---|
| mappings en table | 171 |
| `word_id` distincts (unicité) | 171 / 171 ✅ |
| FK `word_id` valides | 171 / 171 ✅ |
| FK `lemma_id` valides | 5 / 5 ✅ |
| FK `source_id` valides | 1 / 1 ✅ |
| `confidence = safe` (100 %) | ✅ (aucun REVIEW/REJECTED importé) |
| `quran_words.lemma_id` natif modifié | **NON** (135 formes inchangées) |

---

## 2. SIMULATIONS / MESURES DU PILOTE

### 2.1 Distinction MAPPING_COVERAGE vs RESOLVER_COVERAGE

| métrique | avant | après | gain |
|---|---|---|---|
| **MAPPING_COVERAGE** (formes → lemme) | 135 | 135 + 171 = **306** | **+171 formes · +1 270 occurrences** |
| **RESOLVER_COVERAGE** (glose FR atteignable) | 91 | 91 | **+0** |

**Pourquoi RESOLVER_COVERAGE reste inchangé** (et c'est voulu) :
1. `resolveWordMeanings` ne lit **pas encore** `word_lemma_mapping` (21B-C §12) ;
2. aucun des 5 lemmes pilote (الله، رَبّ، الرَّحْمَـٰن، لِلَّه، الْحَمْد) ne possède
   encore de glose FR validée.

Le gain du pilote est donc **purement un gain de résolution FORME → LEMME** — pas encore
un gain de couverture pédagogique FR. Ce gain sera réalisé en 21B-D (intégration resolver)
puis lors de l'import des gloses FR (الله، رَبّ…).

### 2.2 Rappel du potentiel total (21B-B, simulation)

`≈1 045 formes (≈10 454 occurrences, 13,5 %)` si les 8 gloses FORM_ONLY + mapping
الله/رَبّ + 15 candidats sont réalisés. Le pilote en réalise la **première tranche**
(171 formes) sur les 5 lemmes les plus fréquents.

---

## 3. RECOMMANDATIONS

1. **PILOTE VALIDÉ** — le modèle `word_lemma_mapping` (Option B) fonctionne : additif,
   réversible, traçable, sans faux rattachement (0 faux positif importé).
2. **21B-D** : intégrer `COALESCE(word_lemma_mapping.lemma_id, quran_words.lemma_id)`
   dans `resolveWordMeanings` — **après** ajout des tests d'intégration, sans toucher
   `buildWordBank` ni l'UI tant que le contrat n'est pas prouvé.
3. **Étendre le mapping** aux 15 candidats 21B-A (قَالَ، ءَامَنَ، سَمَاء، …) en réutilisant
   le même classifieur exact (jamais d'extension automatique ni de fuzzy matching).
4. **NON traité ici** : cas grammaticaux مِن/مَا/إِنَّ (stratégie dédiée) ; les 11
   REVIEW_REQUIRED (décision linguistique humaine) ; les 11 REJECTED (définitivement exclus).
5. **Gloses FR** : الله، رَبّ… n'ont pas encore de glose FR — l'import des 23 gloses 21B-A
   reste une phase séparée (aucune glose importée/validée ici).

---

## 4. DECISIONS REQUIRED

| # | décision | recommandation |
|---|---|---|
| D1 | Valider le pilote et étendre le mapping ? | **OUI** (21B-D) |
| D2 | Intégrer `word_lemma_mapping` dans le resolver ? | **OUI**, en 21B-D, avec tests |
| D3 | Stratégie pour مِن/مَا/إِنَّ (grammaticaux) ? | phase dédiée (morphologique/éditoriale) |
| D4 | Traiter les 11 REVIEW_REQUIRED (humain) ? | hors périmètre pilote |
| D5 | Importer les 23 gloses FR 21B-A ? | phase séparée (aucune ici) |

---

## 5. FUTURE AUDIO COMPATIBILITY (non implémentée)

`word_lemma_mapping` n'empêche rien et facilite le canal audio lexical :

- **audio du mot isolé** → attaché à `quran_words` (forme exacte), inchangé ;
- **audio du lemme** → attaché à `lemmas` ; le mapping rend toutes les formes fléchies /
  proclitiques joignables au même audio lemme (رَبِّي، رَبِّكَ، وَرَبُّنَا → même رَبّ) ;
- **audio contextuel (récitation)** → reste au niveau verset (`word_occurrences`/`ayahs`),
  indépendant du mapping ;
- **exercices d'écoute** → la résolution FORME→LEMME permet de grouper les variantes d'un
  même lemme (cible idéale pour la répétition espacée, `review_items` référence déjà `word_id`).

---

## 6. NON-RÉGRESSION

| commande | résultat |
|---|---|
| `npm test` | **208/208** ✅ (190 → +18 tests contrat `word_lemma_mapping`) |
| `npx tsc --noEmit` | 0 ✅ |
| `npm run lint` | 0 ✅ |
| `npm run build` | 0 ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | **33/33** ✅ (27 → +6 contrôles `word_lemma_mapping`) |

**Compteurs DB après import** : quran_words 21 296 · word_occurrences 77 430 · ayahs 6 236 ·
translations 24 944 · lemmas 22 · lemma_translations 18 · sources 4 · word_translations 8
(**tous identiques à la baseline**) · word_lemma_mapping **171** (nouveau).

---

## 7. LIVRABLES

- 📄 `PHASE_21B_C_WORD_LEMMA_MAPPING_PILOT.md` (ce rapport)
- 📄 `tmp/phase21b-c-word-lemma-mapping-pilot.json` (`PILOT_COMPLETE`, `database_writes = 171`, `migration_applied = true`)
- 📄 `supabase/migrations/0022_word_lemma_mapping.sql`
- 📄 `lib/quran/lemma-mapping.ts` (classifieur pur, aucune écriture)
- 📄 `scripts/seed-word-lemma-mapping.ts` (dry-run `DRY_RUN=1` + import idempotent SAFE)
- 📄 `tests/word-lemma-mapping.test.ts` (18 tests)
- 📄 `scripts/verify-rls.ts` (étendu à `word_lemma_mapping`)

---

## 8. ARRÊT OBLIGATOIRE

- ✅ Aucun mapping REVIEW_REQUIRED importé ;
- ✅ Aucun mapping REJECTED importé ;
- ✅ `quran_words.lemma_id` **non modifié** ;
- ✅ Resolver / buildWordBank / lesson / UI **non modifiés** ;
- ✅ Les 23 gloses **non importées**, aucune nouvelle glose validée ;
- ✅ Cas grammaticaux **non résolus** ;
- ✅ Audio **non commencé**.

**PROCHAINE PHASE (21B-D) :** intégration du mapping dans le resolver +
tests d'intégration — décidée après lecture de ce rapport.
