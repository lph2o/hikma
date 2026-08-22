# PHASE 17C — IMPLÉMENTATION DE L'ARCHITECTURE LEXICALE KAZIMIRSKI

## STATUT

**IMPLEMENTED_PENDING_HUMAN_GLOSSES** — Hikma est techniquement prêt à recevoir les 14 gloses Kazimirski au niveau **lemme** ; aucune glose n'a été inventée ni importée.

**DATABASE_WRITES : 1 source + 1 table vide (migration)** · **GLOSES IMPORTÉES : 0**

---

## A. Migration 0021

`supabase/migrations/0021_lemma_translations.sql` — auditée avant application : FK → `lemmas` et `sources`, NOT NULL, UNIQUE `(lemma_id, language, source_id)`, CHECK invariant `proposed→validated`, 3 indexes, RLS lecture seule. **Conforme au schéma réel** (aucune correction nécessaire).

## B. Application réelle

`npm run db:migrate` → **`0021_lemma_translations` appliquée** (1 appliquée, 20 déjà en place). Vérifié : `hikma_migrations` contient désormais 0021 ; la table `lemma_translations` existe en base (**count = 0**).

## C. Table lemma_translations

Colonnes vérifiées via `information_schema` : `id`, `lemma_id` (NOT NULL), `language` (NOT NULL), `text` (NOT NULL), `source_id` (NOT NULL), `is_validated` (NOT NULL), `validated_at`, `editorial_notes`, `created_at`, `updated_at`. **Vide** — aucune glose inventée.

## D. RLS

- Lecture publique : **200** (anon read OK).
- Écriture applicative : **401 bloqué** (anon insert refusé — aucune policy d'écriture, service role seul).
- Modèle identique à `word_translations`. RLS **non affaiblie**.

## E. Types

`types/database.ts` **régénéré** (`supabase gen types typescript --project-id …`). `lemma_translations` présent (3 occurrences) avec FK `lemma_translations_lemma_id_fkey` / `lemma_translations_source_id_fkey`. `tsc --noEmit` **0 erreur**.

## F. Source Kazimirski

Enregistrée **sans doublon** (idempotent) : `Kazimirski — Dictionnaire arabe-français (1860)`, `type=historical_dictionary`, `version=édition originale 1860`. Champ `license` = texte **honnête** (domaine public 1860 · scan U Toronto `NOT_IN_COPYRIGHT`, `licenseurl/rights` absents · `LEGAL_GO` = décision opérationnelle du propriétaire, **non un avis juridique**). `metadata` porte auteur/éditeur/scan/OCR. **`sources` : 2 → 3.**

## G. Resolver (forme → lemme → glose)

- `lib/learning/language.ts` : `resolveWordMeanings(word, french, lemmaFrench?)` — **précédence** glose FORME (`word_translations`) > glose LEMME (`lemma_translations`) > fallback EN. Backward-compatible (3ᵉ paramètre optionnel).
- `lib/learning/queries.ts` : ajout de `getValidatedFrenchLemmaMeanings` (niveau lemme) et `getValidatedFrenchLemmaMeaningsByWord` (forme → `quran_words.lemma_id` → glose lemme), filtrées `is_validated = true` (les PENDING sont invisibles).
- `getWordDetail` et `getDueReviewItems` passent désormais le repli lemme. **Les 8 gloses FORME existantes conservent la priorité.**

## H. Seed/import

- `scripts/seed-lemma-translations.ts` créé (+ `npm run seed:lemma-translations`) : **idempotent** (`ON CONFLICT (lemma_id, language, source_id) DO NOTHING`), **dry-run** (`DRY_RUN=1`), **source-aware** (résout la source Kazimirski), **lemma-aware** (résout `lemmas.arabic` → `lemma_id`), **validation-aware** (`is_validated = false` toujours).
- `PROPOSALS = []` — **aucune glose inventée**. Le dry-run confirme `0 insérée`.

## I. Tests

`tests/lemma-translations.test.ts` ajouté (12 tests) : précédence A–G (forme > lemme > EN ; PENDING ignorée ; fallback ; même glose de lemme pour 2 formes) + contrat de schéma 0021 (colonnes, UNIQUE, invariant, indexes, RLS).

## J. Non-régression

| Compteur | Avant | Après |
|---|---|---|
| quran_words | 21 296 | 21 296 |
| word_occurrences | 77 430 | 77 430 |
| ayahs | 6 236 | 6 236 |
| translations | 18 708 | 18 708 |
| word_translations | 8 | 8 (8/8 validées, intactes) |
| lemmas | 22 (8/14/0) | 22 (8/14/0) |
| sources | 2 | **3** (Kazimirski ajoutée) |
| lemma_translations | — | **0** (vide) |

Les **8 word_translations existantes** sont strictement inchangées (`is_validated = true`).

## K. Nombre de gloses réellement importées

**0** — attendu : les 14 gloses françaises humaines ne sont pas encore fournies (règle d'interdiction d'invention respectée).

## L. Données humaines encore manquantes

1. Les **14 gloses françaises** (formulées + revues linguistiquement + vérifiées contre le scan).
2. La **confirmation du `word_id`/`lemma_id`** par unité (dossier `tmp/phase17b-kazimirski-human-review.md`).

## M. Prochaine étape

Une fois les 14 gloses humaines fournies : compléter `PROPOSALS` dans `scripts/seed-lemma-translations.ts`, dry-run, puis import réel (idempotent), toujours `is_validated = false` — la validation restera une étape humaine séparée.

---

## Tests finaux

`npm test` **184/184** (12 nouveaux) · `tsc` **0** · `lint` **0** · `build` **0** · `verify:persistence` **13/13** · `verify:rls` **27/27**.

## Livrables

- 📄 `PHASE_17C_LEMMA_TRANSLATIONS_IMPLEMENTATION.md` (ce rapport)
- 📄 `supabase/migrations/0021_lemma_translations.sql` (appliquée)
- 📄 `scripts/seed-lemma-translations.ts` (+ script npm `seed:lemma-translations`)
- 📄 `tests/lemma-translations.test.ts`
- 🔧 `lib/learning/language.ts` + `lib/learning/queries.ts` (resolver forme→lemme→glose)
- 🔧 `types/database.ts` (régénéré)
- 🔧 `package.json` (script seed)

---

**PHASE 17C — IMPLEMENTED_PENDING_HUMAN_GLOSSES** · **GLOSES IMPORTÉES : 0** · **8 word_translations intactes** · **ARRÊT OBLIGATOIRE.**
