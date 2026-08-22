# PHASE 17C-A — DÉCISION D'ARCHITECTURE LEXICALE KAZIMIRSKI

## STATUT

**PREPARATION_ONLY** · **DATABASE_WRITES : 0** · **MIGRATION APPLIQUÉE : NON**

**RECOMMANDATION : OPTION B — table dédiée `lemma_translations`** (migration préparée, non appliquée).

---

## A. Architecture actuelle (auditée, schéma + code réels)

| Table | Granularité | Rôle | Colonnes clés |
|---|---|---|---|
| `quran_words` (21 296) | **forme distincte** | unité lexicale forme-fléchie | `arabic unique`, `meaning` (gloss EN Quran.com), `lemma_id`, `root`, `source_id` |
| `lemmas` (22) | **lemme** | regroupement des formes | `arabic unique`, `meaning` (texte libre), `root`, `source_id`, `status`, `validated_at` |
| `word_occurrences` (77 430) | **occurrence** | position d'une forme dans un verset | `word_id`, `ayah_id`, `position`, `text` |
| `translations` (18 708) | **verset** | traduction de verset (Hamidullah) | `ayah_id`, `language`, `text` |
| `word_translations` (8) | **forme** (`word_id`) | lexique FR éditorial Hikma | `word_id` (NOT NULL), `language`, `text`, `source_id` (NOT NULL), `is_validated`, `validated_at`, `editorial_notes` |

**Consommation réelle du moteur pédagogique** (`lib/learning/queries.ts` + `lib/learning/language.ts`) :
- `getValidatedFrenchMeanings(client, wordIds)` lit `word_translations` **par `word_id`** (IN wordIds), filtre `is_validated = true`, joint `sources`.
- `resolveWordMeanings(word, french)` combine **gloss EN** (`quran_words.meaning`) + **gloss FR validée** (forme).
- Appelé depuis `getWordDetail` (fiche mot) et `getDueReviewItems` (révision).
- **Tout le moteur opère au niveau `word_id`** : `lesson_words.word_id`, `user_word_progress.word_id`, `review_items.word_id`, `word_occurrences.word_id`.

**Constats d'audit :**
1. `word_translations` représente une traduction **d'une forme** (`word_id` NOT NULL), pas d'un lemme.
2. Il **n'existe aucun concept de traduction au niveau lemme** exploitable : `lemmas.meaning` est un champ texte libre unique, **sans** langue, **sans** `is_validated`/`validated_at`, **sans** multi-source, **sans** `editorial_notes` — insuffisant pour une provenance Kazimirski stricte.
3. Kazimirski fournit une glose **de lemme** (ex. `يَوْم` = « jour », valable pour toutes les formes يَوْمٍ/يَوْمًا/الْيَوْمَ) — incompatible avec une table indexée sur la forme.

---

## B. Problème constaté

Le mapping 17B a montré : 14 lemmes → 12 mappings MULTIPLE + 2 UNIQUE non fiables → **0 `word_id` canonique**. Attacher artificiellement la glose Kazimirski à une forme (`word_id`) serait une **distorsion sémantique** (et une duplication : « jour » répété sur 10 formes de يَوْم).

---

## C. Option A — ajouter `lemma_id` à `word_translations`

- Rend la table **hybride** (deux granularités, `word_id` nullable + `lemma_id` nullable + CHECK « l'un des deux »).
- L'UNIQUE existant `(word_id, language, source_id)` devient ambigu (NULLs).
- Le moteur devrait **de toute façon** être modifié pour résoudre lemme→glose.
- **Dette** : une table à deux sémantiques, contraintes complexes.
- **Verdict : rejeté.**

## D. Option B — table dédiée `lemma_translations`

- Granularité unique : `lemma_id` → glose. Miroir exact de `word_translations` (forme) au niveau lemme.
- `word_translations` **intacte** (les 8 gloses validées protégées, zéro migration sur elle).
- Extensible : multi-sources par lemme (`UNIQUE (lemma_id, language, source_id)`) — Kazimirski, futur dictionnaire AR→FR, dictionnaire AR→AR, ressource morphologique.
- Provenance complète : `source_id` (édition/référence/scan → `sources`), `editorial_notes` (page, statut de vérification), invariant `proposed→validated`.
- **Verdict : retenu.**

## E. Option C — réutiliser `lemmas.meaning`

- `lemmas.meaning` = un seul texte libre, sans langue, sans workflow de validation, sans multi-source, sans note éditoriale.
- Ne peut pas exprimer : 2 sources pour un même lemme, statut PROPOSED vs VALIDATED, page/scan.
- **Verdict : rejeté** comme support principal (peut rester champ « référence rapide » non pédagogique).

## F. Option D — autre

Aucune architecture alternative justifiée : une table générique `lexical_entries` serait de la sur-ingénierie pour ce besoin. `lemma_translations` est la forme minimale et suffisante.

---

## G. Comparaison

| Critère | A (hybride) | B (dédiée) | C (lemmas.meaning) |
|---|---|---|---|
| Sémantique correcte (lemme) | partielle | ✅ | partielle (1 texte) |
| `word_translations` intacte (8 gloses) | ❌ (modifiée) | ✅ | ✅ |
| Multi-source par lemme | complexe | ✅ UNIQUE | ❌ |
| Workflow proposed→validated | complexe | ✅ invariant | ❌ |
| Provenance page/scan | notes | ✅ editorial_notes | ❌ |
| Extensibilité dictionnaires | faible | ✅ | ❌ |
| Moteur pédagogique | modif + dette | modif **additive** | modif + limite |
| Dette technique | haute | basse | moyenne (schéma éclaté) |

---

## H. Recommandation

**OPTION B — `lemma_translations`.**

## I. Justification

1. **Sémantique** : la glose Kazimirski est une donnée de **lemme** ; une table dédiée l'exprime sans distorsion ni duplication.
2. **Non-régression** : `word_translations` et ses 8 gloses validées restent strictement intactes.
3. **Extensibilité** : toute ressource lexicale future (AR→FR, AR→AR, morphologie) s'attache naturellement au lemme, sans toucher la table des formes.
4. **Provenance** : `source_id` NOT NULL + `editorial_notes` + invariant de validation, identiques aux conventions 0019.
5. **Moteur** : changement **additif** (résolution forme→lemme→glose), avec règle de précédence claire (voir K).

---

## J. Impact sur les 8 word_translations existantes

**Aucun.** Aucune migration ne les transforme ni ne les déplace. `is_validated = true` pour les 8, inchangé.

## K. Impact sur le moteur pédagogique

**Additif** (phase d'implémentation future, pas ici) :
- Nouvelle résolution : pour un mot (forme) **sans** glose FR forme-level, remonter `quran_words.lemma_id → lemma_translations` (fr, `is_validated = true`).
- **Précédence** : glose **forme** (`word_translations`) > glose **lemme** (`lemma_translations`) > gloss EN (`quran_words.meaning`).
- `resolveWordMeanings` reste le point unique de résolution (principe préservé de `lib/learning/language.ts`).

## L. Impact RLS

Nouvelle table : `enable row level security` + unique policy `for select using (true)`. **Aucune** policy d'écriture (service role seul, comme `word_translations`).

## M. Impact types

`types/database.ts` est généré (`supabase gen types`) : à **régénérer au moment de l'application** de la migration, pas maintenant (aucune modification de code produit dans cette phase).

## N. Impact seed/import

- Le futur import Kazimirski sera **plus simple** que le seed forme-level : résolution directe par `lemma_id` (déjà connu), **sans** passer par `lesson_words`.
- Idempotence : `ON CONFLICT (lemma_id, language, source_id) DO NOTHING` (miroir du seed 0019).

## O. Migration proposée

`supabase/migrations/0021_lemma_translations.sql` — **préparée** (additive, idempotente `if not exists`, RLS read-only, invariant de validation, UNIQUE `(lemma_id, language, source_id)`, 3 indexes).

## P. Migration appliquée

**NON.** Aucune écriture. La ligne `sources` Kazimirski sera créée en phase d'import (17C), avec statut de licence documenté.

## Q. Database writes

**0.**

## R. Décision finale

**OPTION B** — créer `lemma_translations` (migration 0021 préparée, non appliquée). `word_translations` reste le lexique **forme-level** (8 gloses intactes) ; `lemma_translations` devient le lexique **lemme-level** pour Kazimirski et les futurs dictionnaires. Application reportée à la phase d'import 17C, après fourniture des gloses et du `word_id`/`lemma_id` humainement validés.

---

## Livrables

- 📄 `PHASE_17C_A_LEMMA_ARCHITECTURE_DECISION.md` (ce rapport)
- 📄 `supabase/migrations/0021_lemma_translations.sql` (préparée — **NON appliquée**)

---

**PHASE 17C-A — COMPLETE** · **DATABASE_WRITES: 0** · **MIGRATION APPLIQUÉE: NON** · **ARRÊT OBLIGATOIRE.**
