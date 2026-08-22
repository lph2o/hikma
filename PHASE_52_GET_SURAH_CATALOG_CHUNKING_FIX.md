# PHASE 52 — CORRECTION CIBLÉE : CHUNKING DES `.in()` DU CATALOGUE

**Verdict final : `PHASE_52_GET_SURAH_CATALOG_CHUNKING_FIX_COMPLETE`**

> Phase de correction technique ciblée UNIQUEMENT : rendre les requêtes `.in()`
> du catalogue robustes face à la croissance des `word_ids`. Aucune refonte, aucune
> migration, aucune écriture DB, aucun changement de moteur pédagogique. Aucun
> commit, aucun push.

---

## A. Cause racine (rappel Phase 51)

Une URL GET trop longue est construite par les `.in()` pleine-catalogue : **411
`word_ids` distincts → URL ≈ 16 Ko**, au-dessus du plafond du client HTTP/1.1 de
Node (undici/`https`) — `Header overflow` / `TypeError: fetch failed`. Seuil mesuré :
**395 IDs OK / 397 IDs FAIL**. Le serveur Supabase/Cloudflare accepte la même URL
(curl HTTP/1.1 et HTTP/2 → 200) : la limite est donc **côté client Node**, pas DB ni
readiness. La croissance éditoriale (18 parcours/~270 formes → 21 parcours/411 formes)
a franchi le seuil, rendant `getSurahCatalog` (et `getSurahProgressByUser`)
systématiquement défaillant.

## B. Fichiers modifiés

- **`lib/learning/queries.ts`** (modifié) — chunking des `.in()` + helper + constante.
- **`tests/in-chunking.test.ts`** (créé) — 10 tests dédiés au chunking.
- `tmp/phase52-verify.ts` (artefact d'audit, hors production).

## C. Solution

### Helper interne

- Réutilisation de `chunk<T>` existant (`lib/quran/repositories/shared.ts`) — aucun
  doublon de code.
- Nouveau helper interne `selectInChunks<T>(ids, label, run)` dans `queries.ts` :
  - déduplique les identifiants (`[...new Set(ids)]`) ;
  - découpe par lots et exécute en parallèle (`Promise.all`) ;
  - concatène les lignes et propage la première erreur avec son `label` ;
  - tableau vide → aucun appel.

### Taille de chunk : `IN_FILTER_CHUNK_SIZE = 250` (exportée)

- Seuil mesuré ≈ 397 IDs → **250 laisse une marge de sécurité ~1,6×** (URL ≈ 10 Ko).
- 411 IDs → **2 requêtes** (aucun N+1 par mot).
- Choix volontairement conservateur : la robustesse future prime sur l'utilisation
  maximale de la limite.

### Fonctions corrigées (5 requêtes `.in()` sur `word_id`)

| Fonction | Table / filtre `.in()` |
|---|---|
| `getValidatedFrenchMeanings` | `word_translations` `.in("word_id", …)` |
| `getWordLemmaMappingsByWordIds` | `word_lemma_mapping` `.in("word_id", …)` |
| `getValidatedFrenchLemmaMeaningsByWord` | `quran_words` `.in("id", …)` (lecture `id, lemma_id`) |
| `getSurahCatalog` (étape 6) | `quran_words` `.in("id", …)` (lecture `id, meaning`) |
| `getUserWordProgress` | `user_word_progress` `.in("word_id", …)` |

`getSurahProgressByUser` est couvert via `getUserWordProgress` (son `.in("word_id",
allNewWordIds)` = 411 `is_new` distincts). Les `.in()` structurels (`path_id`=21,
`unit_id`=21, `lesson_id`=138, `lemma_id`=32) ne sont **pas** concernés (cardinalité
faible, croissance lente) — évalués et laissés inchangés.

### Sémantique préservée

- Chaque fonction retourne le même `Map` clé→valeur qu'avant (filtres, sources,
  fallbacks, précédence FORME > LEMME direct > LEMME mapping > EN inchangés).
- `ORDER BY updated_at DESC` conservé **dans chaque lot** : la règle « première ligne
  validée = la plus récente » reste exacte (un `word_id` n'appartient qu'à un lot).
- Déduplication en entrée = équivalent à la sémantique ensembliste de SQL `IN`.
- `resolveWordMeanings` et `classifySurahReadiness` : **aucun changement**.

## D. Avant / après

**Avant :**
```
getSurahCatalog → allWordIds (411) → .in() unique → URL ≈ 16 Ko
→ Node/undici → HeadersOverflowError → TypeError: fetch failed (3/3)
```

**Après :**
```
getSurahCatalog → allWordIds (411) → chunk(411, 250) → 2 lots
→ 2 requêtes (≈ 10 Ko chacune) → fusion déterministe → catalogue complet OK
```

## E. Preuves

- **Catalogue complet** : `getSurahCatalog()` → **OK en 2,5 s**, **21 parcours**
  (1 REFERENCE + 20 READY).
- **Aucun doublon / aucun mot perdu** : tests unitaires avec faux client qui filtre
  réellement les `.in()` (411 → map de taille exactement 411, chaque id demandé une
  fois).
- **`getSurahProgressByUser`** : exécuté sans erreur (21 sourates, 0 progression pour
  un utilisateur factice).
- **Readiness ciblée** : 107 ✅ READY · 95 ✅ READY · 99 ✅ READY · 100 ✅ READY ·
  1 ✅ REFERENCE.
- **Tests** : `npx tsc --noEmit` ✅ · `npx eslint .` ✅ · `npx vitest run`
  → **743/743** (56 fichiers, +10 tests) · `npm run build` ✅.
- **Compteurs DB inchangés** (lecture seule) : `word_translations FR=415` ·
  `quran_words=21296` · `word_occurrences=77430` · `ayahs=6236` · `translations=24944` ·
  `lemma_translations=32` · `lemmas=32` · `word_lemma_mapping=184` · `sources=6` ·
  `linguistic_occurrences=413` · `linguistic_segments=796` · `word_explanations=13` ·
  `word_explanation_contexts=1` · `learning_paths=21` · `units=21` · `lessons=138` ·
  `lesson_words=933` — **tous identiques à la baseline Phase 50**.

## F. Non-régression

Confirmé explicitement :

- **Onboarding V2 inchangé** : `CURRENT_ONBOARDING_VERSION = 2` (vérifié),
  `isOnboardingComplete`, migrations 0029/0030, progression, sélection de sourate,
  redirection — aucun fichier touché.
- **Curriculum inchangé** : aucune table `learning_paths`/`units`/`lessons`/
  `lesson_words` modifiée.
- **Resolver inchangé** : `resolveWordMeanings` / `resolveQuranWordMeaning` non modifiés.
- **SRS / mastery / Daily Plan / coach inchangés** : aucun fichier modifié.
- **Explications / MASAQ inchangés** : aucun fichier modifié.
- **DB inchangée** : 0 écriture (compteurs identiques).

> **Note de transparence (hors périmètre du correctif)** : une fois le catalogue à
> nouveau calculable, 93/94/105/110 apparaissent `READY` (100 %) et plus
> `IN_PREPARATION`. Ceci **n'est pas** un changement introduit par le chunking : les
> formes `رَبِّكَ`/`رَبُّكَ` de ces sourates résolvent en FR **via `word_lemma_mapping`**
> (surcouche additive Phase 21B-D, inchangée), ce que l'audit de Phase 50 ne comptait
> pas (il ne lisait que `quran_words.lemma_id` direct). C'est le comportement réel du
> résolveur, rendu visible pour la première fois depuis que le catalogue a franchi le
> seuil de taille. Aucune donnée, aucune glose, aucun statut modifié.

## G. Verdict

**`PHASE_52_GET_SURAH_CATALOG_CHUNKING_FIX_COMPLETE`**

- `getSurahCatalog()` fonctionne avec les 411 IDs actuels (21 parcours, 0 erreur).
- Plus aucune `Header overflow` / `fetch failed`.
- Les 5 requêtes `.in()` sur `word_id` du chemin catalogue sont sécurisées (chunk 250).
- Aucun N+1 (411 → 2 requêtes par table).
- Résultat fonctionnel identique (aucun doublon, aucune omission, même sémantique).
- `getSurahProgressByUser` corrigé via `getUserWordProgress` chunké.
- Onboarding V2, readiness, curriculum, SRS, mastery, Daily Plan, explications, MASAQ,
  DB : **inchangés**.
- tsc 0 erreur · eslint 0 erreur · vitest 743/743 · build OK.

**STOP.** Aucun travail supplémentaire lancé automatiquement.
