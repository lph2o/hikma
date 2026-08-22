# PHASE 64 — MASAQ 87 CLASSIFIER AMBIGUITY AUDIT

STATUT : **READ-ONLY** — aucune écriture DB, aucune modification de production,
aucun commit, aucun push. Les deux cas de la sourate 87 ont été analysés au
niveau codepoint, avec simulation globale des règles candidates et test de
collision sur l'intégralité du corpus.

---

## A. Baseline

Vérifiée depuis la DB réelle (`tmp/phase64-db-verify.json`), identique à la
Phase 63 (aucune écriture entre les phases) :

| Compteur | Valeur |
|---|---:|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| translations | 24 944 |
| word_translations FR validées | **538** |
| linguistic_occurrences (MASAQ) | **539** |
| linguistic_segments (MASAQ) | **1 051** |
| MASAQ 91 / 87 / 96 | **54 / 0 / 72** |
| word_explanations validées | 13 |
| learning_paths / lessons / lesson_words | 24 / 191 / 1 307 |
| Catalogue | **24 parcours — 1 REFERENCE + 23 READY + 0 IN_PREPARATION** |
| Readiness 91 / 87 / 96 | READY / READY / READY |

Le statut READY est la **readiness lexicale** (gloses FR) : MASAQ est une
couche passive, son absence ne modifie pas le catalogue.

## B. Code audité

- `lib/linguistic/masaq.ts` — `normalizeOrthographic()`, `classifyAlignment()`,
  `alignKey()`. Règles actuellement implémentées (pertinentes ici) :
  - `\u06e6 → \u064a` (petit yeh exposant → yā' plein) — ajout Phase 43B ;
  - `\u0670 → \u0627` (dagger-alif → alif) ;
  - `\u0649\u0670 → \u0627` (alif maqṣūra + dagger → alif) ;
  - suppression des diacritiques + tatweel, signes coraniques U+06D6–06ED,
    wasla → alif, hamza → lettres pleines, alif maqṣūra → yā'.
- `lib/linguistic/masaq-plan.ts` — `buildImportPlan()` (alignement par
  `(surah, ayah, position)`, jamais par chaîne seule), `assertPlanScope()`
  (refuse MISSING / EXTRA / AMBIGUOUS).
- `scripts/import-masaq-multi-surah.ts` — orchestration, non modifié.

**Aucun de ces fichiers n'a été modifié.**

## C. Reproduction des 2 ambiguïtés (codepoints réels)

| Ayah | Hikma (DB) | Codepoints Hikma | MASAQ (CSV) | Codepoints MASAQ | Normalisation actuelle | Classification |
|---|---|---|---|---|---|---|
| 87:15:3 | `رَبِّهِۦ` | 0631 064E 0628 0650 0651 0647 0650 **06E6** | `رَبِّهِ` | 0631 064E 0628 0651 0650 0647 0650 | Hikma→`ربهي` ≠ MASAQ→`ربه` | **AMBIGUOUS** |
| 87:16:3 | `ٱلْحَيَوٰةَ` | 0671 0644 0652 062D 064E 064A 064E 0648 **0670** 0629 064E | `ٱلْحَيَاةَ` | 0627 0644 0652 062D 064E 064A 064E **0627** 0629 064E | Hikma→`الحيواة` ≠ MASAQ→`الحياة` | **AMBIGUOUS** |

Reproduction conforme au comportement du pipeline réel (`classifyAlignment`
importé depuis `lib/linguistic/masaq.ts`). word_ids : 87:15:3 →
`b4c15a85-…`, 87:16:3 → `69f0dbed-…`.

## D. Analyse de رَبِّهِۦ (87:15:3) — U+06E6

**Fait linguistique.** Le petit yeh exposant U+06E6 (ARABIC SMALL HIGH YEH) a
deux fonctions dans le texte Uthmani :

1. **Marqueur du suffixe pronominal** هِۦ (« lui / sa ») après kasra — c'est le
   cas de 87:15:3. Le ۦ note la voyelle -i du pronom : `رَبِّهِۦ` = rabbi-**hi**.
2. **Marqueur de voyelle -i** au sein d'une forme (إِۦلَاف, يُحْىِۦ, ءَاتَىٰنِۦَ) —
   c'est le cas où MASAQ écrit le yā' **plein**.

**Ce que fait MASAQ (empirique, CSV complet, 114 sourates).** Sur les **957
paires** où la forme Hikma contient U+06E6 (319 formes distinctes) :
- **668** paires : MASAQ rend la forme **sans le ۦ** (omission) — convention du
  suffixe pronominal ;
- **0** paire : MASAQ écrit un yā' plein là où Hikma a le ۦ du suffixe ;
- le ۦ→ي ne s'observe que pour les formes de type 2 (voyelle -i) : 106:2:1
  `إِۦلَـٰفِهِمْ` → `إِيلَافِهِمْ`, les يُحْىِۦ → يُحْيِي, etc.

**La règle actuelle (06E6→ي) est donc correcte pour les formes de type 2 mais
incorrecte pour le suffixe pronominal** — c'est précisément la cause du blocage.

**Règle candidate A (omission brute 06E6→suppression).** Simulée sur le corpus
entier : 957 changements, dont **2 régressions** : 27:36:8
(`ءَاتَىٰنِۦَ` → `آتَانِيَ`, VARIANT→AMBIGUOUS) et 106:2:1
(`إِۦلَـٰفِهِمْ` → `إِيلَافِهِمْ`, EXACT_ORTHO→AMBIGUOUS), + 20 dégradations
EXACT_ORTHO→VARIANT. **L'omission brute est UNSAFE.**

**Règle candidate A′ (contextuelle).** « 06E6 précédé de ه (+diacritiques) →
omission ; 06E6 ailleurs → ي ». Simulée : **935 corrections, 0 régression**,
dont 87:15:3 → **EXACT**. 668 EXACT + 231 EXACT_ORTHOGRAPHIC + 36 VARIANT.
C'est la règle exactement alignée sur le comportement observé de MASAQ.

## E. Analyse de ٱلْحَيَوٰةَ (87:16:3) — و+U+0670

**Fait linguistique.** حياة est écrit avec un **wāw silencieux** (وصل) + dagger-
alif dans la tradition Uthmani (héritage de la graphie de l'alif long ā) : la
voyelle se lit « hayāt », sans le wāw. MASAQ normalise vers l'orthographe
moderne : `حَيَاة` (alif plein, wāw supprimé).

**Ce que fait MASAQ (empirique, CSV complet).** Sur les **184 paires** où la
forme Hikma contient la séquence و+U+0670 (39 formes distinctes — حَيَوٰة،
صَلَوٰة، زَكَوٰة، غَدَوٰة، نَجَوٰة، مَنَوٰة، مِشْكَوٰة، رِبَوٰا…) :
- **176** paires : MASAQ écrit **ا** (alif plein) à la place de و+0670
  (wāw silencieux supprimé) ;
- **8** paires : la forme MASAQ contient و **et** ا — mais il s'agit dans tous
  les cas d'un **و de coordination préfixé** (وَصَلَاة، وَحَيَاة…) : le و+0670
  interne est là aussi rendu par un simple ا ;
- **0** paire où MASAQ conserverait le wāw interne + alif.

**Règle candidate B2 (و+0670 → ا).** Simulée sur le corpus entier :
**184 corrections, 0 régression**, 87:16:3 → **EXACT_ORTHOGRAPHIC**
(170 EXACT_ORTHO + 7 VARIANT + 7 EXACT). Aucun impact sur أُولَٰئِكَ (séquence
و+ل+0670, non concernée) ni sur les autres mots à dagger-alif.

**Règle candidate B1 (و+0670 → وا).** Simulée : **0 changement** — inutile,
MASAQ n'écrit jamais le wāw interne + alif.

## F. Test de collision (global)

L'alignement MASAQ est **par clé (surah, ayah, position)**, jamais par égalité
de chaîne : une fusion de normalisation ne peut donc jamais rattacher une forme
au mauvais mot au sein d'une sourate. Mesures de l'audit (`collisions`) :
- groupes de normalisation fusionnant ≥2 formes distinctes : **6 183 actuels** ;
- règle A′ : **6 158** (−25, fusion bénigne des variantes بِهِۦ/بِهِ — même
  word_id, seule la présence du ۦ diffère entre occurrences Quran.com) ;
- règle B2 : **6 183** (aucune nouvelle collision).

Aucune collision nouvelle mettant en jeu les formes de 87 ou un word_id
différent. Vérification ciblée supplémentaire : dans 87, les formes
normalisées sous A′/B2 restent **uniques** (0 collision avec les autres formes
de la sourate).

## G. Règles candidates (proposées, NON implémentées)

- **RÈGLE A′ (documentée) :** dans `normalizeOrthographic`,
  remplacer `\u06e6 → \u064a` par :
  1. `ه` + diacritiques* + `06E6` → suppression du 06E6 (suffixe pronominal) ;
  2. `06E6` restant → `ي` (voyelle -i). — corrige 935 paires / 0 régression.
- **RÈGLE B2 (documentée) :** ajouter, avant la règle générique `\u0670 → \u0627`,
  la transformation de séquence `\u0648\u0670 → \u0627` (wāw silencieux +
  dagger-alif → alif plein). — corrige 184 paires / 0 régression.

Ces règles reproduisent exactement la convention d'écriture réelle du dataset
MASAQ v2 (vérifiée sur 100 % de ses occurrences) et respectent le principe
`AVAILABLE ≠ INFERABLE` : il ne s'agit pas d'une déduction, mais d'une variante
orthographique **observée de façon déterministe** dans la source.

## H. Impact global (simulation, READ-ONLY)

| Règle | Corrections | Dégradations | Régression | 87 |
|---|---:|---:|---:|---|
| A (06E6 → omission brute) | 935 | 21 | **2** (27:36:8, 106:2:1) | 87:15:3 EXACT |
| **A′ (contextuelle suffixe)** | **935** | **0** | **0** | **87:15:3 → EXACT** |
| B1 (و+0670 → وا) | 0 | 0 | 0 | inchangé |
| **B2 (و+0670 → ا)** | **184** | **0** | **0** | **87:16:3 → EXACT_ORTHO** |

Sourates MASAQ déjà importées : 106:2:1 (`إِۦلَـٰفِهِمْ`) est l'unique cas 06E6
de la couverture actuelle ; la règle A′ **préserve son alignement**
(EXACT_ORTHOGRAPHIC), contrairement à l'omission brute qui le casserait. Aucun
cas و+0670 dans la couverture actuelle → B2 n'affecte aucune ligne existante.

## I. Décision pour chaque variante

| Variante | Décision | Justification |
|---|---|---|
| رَبِّهِۦ → رَبِّهِ (omission du ۦ suffixal) | **SAFE_DOCUMENTED_VARIANT** | 100 % des occurrences MASAQ de ce schéma omettent le ۦ ; la règle contextuelle A′ corrige 935 paires sans régression ni collision ; elle préserve l'unique cas importé (106:2:1). |
| ٱلْحَيَوٰةَ → ٱلْحَيَاةَ (و+0670 → ا) | **SAFE_DOCUMENTED_VARIANT** | 100 % des occurrences MASAQ de ce schéma rendent ا ; la règle B2 corrige 184 paires sans régression ni collision ; aucun impact sur la couverture existante. |

Aucune des deux n'est une inference : les deux conventions sont **observées de
façon déterministe dans le dataset source** (analyse des 157 676 lignes CSV).

## J. Ce qui n'a PAS été fait (READ-ONLY strict)

- ❌ aucun INSERT/UPDATE/DELETE (compteurs identiques avant/après, vérifiés) ;
- ❌ `normalizeOrthographic` / `classifyAlignment` / `assertPlanScope` non
  modifiés — les règles candidates ne sont que **proposées** (section G) ;
- ❌ `scripts/import-masaq-multi-surah.ts` non modifié ;
- ❌ 87 non importée (0 occurrence MASAQ), 91 et 96 inchangées (54/72) ;
- ❌ aucune des 17 sourates MASAQ existantes modifiée ;
- ❌ aucune écriture dans linguistic_occurrences / linguistic_segments ;
- ❌ aucun commit, aucun push.

## K. Non-régression

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **748/748** (baseline 63A) |
| `npm run build` | ✅ Compilé |
| DB (avant = après audit) | ✅ identique (voir A) |

## L. État DB après audit

Aucune modification : 539 linguistic_occurrences / 1 051 linguistic_segments,
24 parcours (1 REFERENCE + 23 READY), readiness 91/87/96 = READY, catalogue
inchangé. `getSurahCatalog()` fonctionne.

## M. Verdict

**`PHASE_64_MASAQ_87_CLASSIFIER_AUDIT_DOCUMENTED_VARIANTS`**

Les deux occurrences classées AMBIGUOUS de la sourate 87 correspondent à des
**variantes orthographiques documentées et déterministes** du dataset MASAQ v2,
et non à de véritables ambiguïtés d'alignement :

1. **87:15:3 رَبِّهِۦ** → le ۦ suffixal est omis par MASAQ : règle contextuelle
   A′ (ه+diacritiques*+06E6 → suppression ; 06E6 → ي sinon) — 935 corrections,
   0 régression, 0 collision ;
2. **87:16:3 ٱلْحَيَوٰةَ** → le wāw silencieux + dagger-alif devient alif plein
   chez MASAQ : règle B2 (`\u0648\u0670 → \u0627`) — 184 corrections,
   0 régression, 0 collision.

**Recommandation (phase ultérieure, NON exécutée ici)** : implémenter A′ et B2
dans `normalizeOrthographic()` (avec les tests unitaires associés), rejouer le
DRY-RUN `SURAH=87`, puis appliquer l'import MASAQ 87 via le mécanisme existant
si `assertPlanScope` passe — conformément au précédent des Phases 43A→43B.

**STOP.** Aucune Phase 65 lancée automatiquement. Aucun commit. Aucun push.

---

### Artefacts
- `tmp/phase64-audit.ts` (script reproductible, READ-ONLY)
- `tmp/phase64-audit.json` (reproduction, cartographie, simulations, collisions)
- `tmp/phase64-db-verify.ts` / `tmp/phase64-db-verify.json` (état DB avant/après)
