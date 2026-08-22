# PHASE 21A — MULTI-SURAH ARCHITECTURE AUDIT

**MODE : STRICTEMENT READ_ONLY**

**STATUS = READ_ONLY · DATABASE_WRITES = 0 · CODE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0 · SEEDS = 0 · COMMITS = 0**

## 1. Executive Summary

Le moteur pédagogique Hikma est **déjà architecturalement multi-sourates au
niveau des données**. L'unité lexicale est la **forme globale** (`quran_words`
clé par `arabic`), indépendante de la sourate ; la chaîne
`word → occurrence → ayah → surah` est entièrement dénormalisée via
`word_occurrences.ayah_id`. La progression, le SRS et la maîtrise sont clés par
`user_id + word_id` (aucun `surah_id` dans le chemin d'écriture).

La relation `learning_paths.surah_id` **existe déjà** (migration 0027 : FK,
index, backfill idempotent). `listLearningPaths`, `getCurriculum({surahNumber})`
et `getLearningPathBySurah()` existent déjà. Le générateur multi-sourates
(`seed-multisurah-curriculum.ts`) est déjà idempotent et produit 14 parcours.

Ce qui reste à généraliser est la **couche de sélection/catalogue UI** : le
parcours par défaut (`quran-vocabulary`), le CTA dashboard anonyme, et le
redirect d'onboarding sont encore ancrés sur Al-Fātiḥah. La maîtrise par
sourate (`aggregateSurahMastery`) existe comme projection dérivée mais n'est
pas encore reliée à un écran.

**Décision : `A — READY_FOR_MULTI_SURAH_IMPLEMENTATION`** (aucun blocker
structurel ; les dépendances restantes sont des ancrages UI/SLUG, pas des
défauts du modèle de données).

## 2. État actuel

### 2.1 Modèle de données (migrations 0001–0027)

| Table | Clé naturelle | Relation sourate | Relation mot | Relation utilisateur |
|---|---|---|---|---|
| `surahs` | `number` (1..114 unique) | — | — | — |
| `ayahs` | `(surah_id, ayah_number)` | `surah_id` FK | — | — |
| `quran_words` | `arabic` (unique) | **aucune** (forme globale) | — | — |
| `lemmas` | `arabic` | aucune | — | — |
| `word_occurrences` | `(ayah_id, position)` | via `ayah_id` FK | `word_id` FK | — |
| `word_lemma_mapping` | `word_id` (unique) | via mot | `word_id`/`lemma_id` FK | — |
| `translations` | `(ayah_id, resource_id)` | via `ayah_id` FK | — | — |
| `word_translations` | `(word_id, language, source)` | via mot | `word_id` FK | — |
| `lemma_translations` | `(lemma_id, language, source)` | via lemme | — | — |
| `word_audio` | `(word_id, recitation_id)` | **aucune** (niveau mot) | `word_id` FK | — |
| `ayah_audio` | `(ayah_id, recitation_id)` | via `ayah_id` | — | — |
| `learning_paths` | `slug` (unique) | **`surah_id` FK nullable** (0027) | — | — |
| `units` | `(path_id, slug)` | via `path_id` | — | — |
| `lessons` | `(unit_id, slug)` | via unit → path | — | — |
| `lesson_words` | `(lesson_id, word_id)` | via lesson | `word_id` FK | — |
| `user_word_progress` | `(user_id, word_id)` | **dérivée** via mot | `word_id` FK | `user_id` FK (RLS) |
| `review_items` | `(user_id, word_id)` | **dérivée** | `word_id` FK | `user_id` FK (RLS) |
| `user_word_skill_progress` | `(user_id, word_id, skill)` | **dérivée** | `word_id` FK | `user_id` FK (RLS) |
| `lesson_sessions` | `(user_id, lesson_id)` | via lesson → unit → path | via lesson | `user_id` FK (RLS) |
| `user_activity_lessons` | `(user_id, date, lesson_id)` | via lesson | — | `user_id` FK |
| `user_activity_words` | `(user_id, date, word_id)` | dérivée | `word_id` FK | `user_id` FK |

**Point clé :** `quran_words`, `lemmas`, `word_translations`, `word_audio`
sont **sourate-agnostiques**. Aucune nouvelle sourate ne doit créer de doublon
lexical. La granularité `forme / lemma / occurrence` est déjà respectée.

### 2.2 Couche requêtes (lib/learning/queries.ts)

| Fonction | Généricité | Verdict |
|---|---|---|
| `listLearningPaths()` | retourne TOUS les parcours | ✅ déjà générique |
| `getCurriculum({pathId, surahId, surahNumber})` | filtres présents, **défaut slug `quran-vocabulary`** | ⚠️ défaut Al-Fātiḥah |
| `getLearningPathBySurah(n)` | délègue à `getCurriculum({surahNumber})` | ✅ déjà présent |
| `getLessonWithWords(slug)` | remonte lesson → unit → path → surah (aucun hardcode) | ✅ générique |
| `getWordAyahContexts(wordIds, surahNumber)` | paramètre explicite, map vide si null | ✅ déjà généralisé |
| `getLessonAyahContext(…, surahNumber)` | paramètre explicite | ✅ générique |
| `getWordDetail` / `getWordOccurrencesPage` | occurrences globales (toutes sourates) | ✅ générique |
| `getReviewItems` / `getReviewOverview` | clés `user_id + word_id`, global | ✅ générique |

### 2.3 État live documenté (phase20a-hikma-master-context.json)

- 114 sourates · 6 236 ayahs · 21 296 formes · 77 430 occurrences ;
- 15 learning_paths (dont `quran-vocabulary` + 14 `quran-surah-*`), tous rattachés à `surah_id` ;
- 90 leçons publiées.

## 3. Fātiḥah comme référence

Al-Fātiḥah est **`FATIHAH_REFERENCE_LOCKED`** (Phase 20D). Elle reste :

- le parcours éditorial canonique (`quran-vocabulary`, 8 leçons, objectifs
  manuels, difficulté 1→3) ;
- la référence fonctionnelle : grading, feedback, explication, audio, glosses,
  progression, SRS, mastery — aucun comportement ne doit changer ;
- la source de vérité pour les tests de non-régression (445 tests PASS).

Toute généralisation doit être **additive** et préserver la verticale
Al-Fātiḥah bit-pour-bit.

## 4. Dépendances à Al-Fātiḥah

Recherche exhaustive des occurrences `surahNumber = 1`, `surah_id = 1`,
`Al-Fātiḥah hardcodé`, `limit(1)`, « premier parcours », « default surah »,
ainsi que les équivalents indirects (requête sans filtre sourate, sélection du
premier parcours, fallback).

| # | Localisation | Occurrence | Nature | Classification |
|---|---|---|---|---|
| 1 | `lib/learning/queries.ts` `getCurriculum()` l.102–108 | défaut `eq("slug","quran-vocabulary")` puis `.limit(1)` | ancrage du parcours par défaut | **IMPORTANT** |
| 2 | `app/(app)/dashboard/page.tsx` l.54–55 | CTA anonyme `/learn/basmala` « Commencer avec Al-Fatiha » | hardcode UX | **IMPORTANT** |
| 3 | `app/(onboarding)/onboarding/page.tsx` l.30–34 | `redirectTo="/learn/basmala"` + copie Al-Fatiha | hardcode UX | **IMPORTANT** |
| 4 | `scripts/seed-curriculum.ts` `SURAH_NUMBER = 1` | seed éditorial Al-Fātiḥah (objectifs manuels) | seed de référence | **SAFE** |
| 5 | `scripts/seed-multisurah-curriculum.ts` (skip sourate 1, `DEFAULT_SURAHS`) | préserve le parcours éditorial, génère les 14 autres | générateur déjà multi | **SAFE** |
| 6 | `supabase/migrations/0027_learning_paths_surah.sql` | backfill `quran-vocabulary` → `surahs.number = 1` | migration one-shot idempotente | **SAFE** |
| 7 | `getWordAyahContexts` (historique) | `surahNumber = 1` fallback silencieux | **déjà supprimé** (paramètre nullable) | **SAFE** |
| 8 | `components/app/landing.tsx`, `app/design-system/page.tsx` | liens `/learn/basmala`, copie Al-Fātiḥah | copie marketing/démo | **DOCUMENTATION_ONLY** |
| 9 | `app/admin/page.tsx` `.limit(1)` (latestImport) | diagnostic admin | hors moteur | **DOCUMENTATION_ONLY** |

**Équivalents indirects vérifiés :**

- **Requête sans filtre sourate** : aucune — `getWordAyahContexts` et
  `getLessonAyahContext` exigent `surahNumber` (map vide / [] si null).
- **Sélection arbitraire du premier parcours** : le seul cas est le défaut
  `getCurriculum()` (#1), explicite et documenté.
- **Fallback vers le premier parcours** : `getLessonWithWords` résout la sourate
  par la hiérarchie réelle, sans défaut.
- **Contexte calculé depuis une seule sourate** : non — paramètre explicite.
- **Seed supposant une sourate unique** : `seed-curriculum` est le seed
  éditorial dédié à la sourate 1 ; le générateur multi-sourates est séparé.

**Aucune dépendance CRITICAL.** Trois ancrages IMPORTANT (UI/slug), le reste
SAFE ou DOCUMENTATION_ONLY.

## 5. learning_paths

- **Identification** : `id` (UUID) + `slug` (clé naturelle stable, seed idempotent).
- **Relation au contenu** : `units.path_id → lessons.unit_id → lesson_words`.
- **Relation à la sourate** : `learning_paths.surah_id` (FK `surahs(id)`,
  `ON DELETE SET NULL`, index `learning_paths_surah_id_idx`).
- **Explicite vs implicite** : explicite depuis la migration 0027 ; nullable
  uniquement pour l'historique (0 parcours sans rattachement en live).
- **Coexistence** : 15 parcours coexistent déjà (1 éditorial + 14 générés).
- **Unicité** : `slug` unique ; un parcours = une sourate (1:1 en pratique,
  mais le schéma n'impose pas l'unicité `surah_id` — à documenter, pas bloquant).

**Évaluation de la proposition `learning_paths.surah_id` :**

| Critère | Statut |
|---|---|
| nullable initialement si nécessaire | ✅ (`on delete set null`, nullable) |
| FK vers la table des sourates | ✅ (`references surahs(id)`) |
| index | ✅ (`learning_paths_surah_id_idx`) |
| backfill | ✅ idempotent (slug `quran-vocabulary` → number 1) |
| compatibilité Al-Fātiḥah | ✅ (aucun changement de slug/ordre) |

**La proposition est DÉJÀ implémentée.** Aucune migration supplémentaire requise
pour ce point.

## 6. Curriculum

### Pourquoi `limit(1)` existe

`getCurriculum` retourne **un seul arbre** `path → units → lessons`. Le
`.limit(1)` intervient APRÈS la sélection explicite du parcours. Le défaut
`quran-vocabulary` est un ancrage de compatibilité pour les écrans historiques
(dashboard, learn, lesson) qui affichent un parcours unique.

### API/requêtes déjà présentes

| Fonction | Rôle | Statut |
|---|---|---|
| `listLearningPaths(client)` | catalogue complet (aucun filtre) | ✅ présent |
| `getCurriculum(client, { pathId })` | parcours ciblé par id | ✅ présent |
| `getCurriculum(client, { surahId })` | parcours ciblé par sourate (id) | ✅ présent |
| `getCurriculum(client, { surahNumber })` | parcours ciblé par sourate (numéro) | ✅ présent |
| `getLearningPathBySurah(client, n)` | sucre syntaxique `{ surahNumber }` | ✅ présent |

### Ce qui manque

- Un **écran catalogue** exposant `listLearningPaths` + la progression/mastery
  par sourate (`aggregateSurahMastery`).
- Le **choix du parcours actif** par l'utilisateur (aujourd'hui implicite =
  défaut `quran-vocabulary`).

## 7. Word Context

`getWordAyahContexts(client, wordIds, surahNumber: number | null)` :

- la dépendance historique `surahNumber = 1` est **déjà supprimée** (Phase 6I) ;
- `surahNumber == null → map vide` (aucun fallback silencieux) ;
- résolution `word → occurrence → ayah → surah` (pas `word → Al-Fātiḥah`) ;
- premier verset canonique où la forme apparaît + traduction FR réelle (Hamidullah).

**Déjà conforme à l'objectif conceptuel `getWordAyahContexts(wordId, surahId?)`.
Aucune modification requise.**

## 8. Lexique

- `quran_words` : clé `arabic` unique → **une forme = une ligne globale**.
- `lemmas` : clé `arabic` → global.
- `word_occurrences` : joint forme ↔ verset (position) → pas de doublon de forme.
- `word_translations` : clé `word_id + language + source` → global.
- `word_lemma_mapping` : `word_id` unique → surcouche additive.

Une forme apparaissant dans plusieurs sourates (ex. basmala, `وَلَا`, `غَيْرِ`)
reste **une seule ligne** `quran_words` référencée par plusieurs occurrences.
Aucune duplication lexicale nécessaire lors de l'ajout d'une sourate. La
granularité `forme / lemma / occurrence` est déjà respectée.

## 9. Traductions

Sources (aucune à ajouter) :

| Source | resource_id | Langue |
|---|---:|---|
| Muhammad Hamidullah | 31 | FR |
| Kazimirski 1869 | 9001 | FR |
| Sahih International | 20 | EN |
| Piccardo | 153 | IT |

Récupération : `translations` est joint par `ayah_id` (`IN(ayahIds)`) et
filtré par `language`. Aucun code ne suppose un corpus limité à Al-Fātiḥah :
les requêtes partent des `ayah_id` résolus depuis les occurrences du mot.
`stripHtml` retire les notes de bas de page Hamidullah sans altérer le texte.

## 10. Gloses

Hiérarchie de résolution (référence, inchangée) :

```
FORME (word_translations validé FR)
  → LEMME (quran_words.lemma_id DIRECT, puis word_lemma_mapping safe)
  → EN (quran_words.meaning, fallback marqué)
```

Pour les nouvelles sourates, la chaîne est **identique** : elle est alimentée
par les mêmes tables globales. Une forme déjà glosée (ex. `بِسْمِ`) réutilise
automatiquement sa glose dans une nouvelle sourate. Aucune nouvelle glose créée
pendant cette phase.

## 11. Audio

- `word_audio.word_id` → `quran_words` : **relation indépendante de la sourate**.
- Un mot présent dans plusieurs sourates partage le même audio (clé `word_id`).
- `ayah_audio` est au niveau verset (0 aujourd'hui) et n'est pas requis.

Aucune duplication incorrecte possible au niveau mot. Aucun import dans cette phase.

## 12. Exercices

- Les exercices sont **générés à l'exécution** (jamais persistés : les tables
  `exercises`/`exercise_options` sont présentes mais non utilisées par le moteur).
- Chaîne de génération : `lesson_words → word bank résolu → générateurs
  déterministes → séquence (cumulative/interleaved) → identités de leçon`.
- Relation `exercise → quran_word` : via `WordBankEntry.wordId`.
- Relation `exercise → ayah` : via `metadata.context` (contexte réel).
- Relation `lesson → learning_path → surah` : via `unit_id`/`path_id`.

**Aucune dépendance implicite à Al-Fātiḥah** dans les générateurs (un mot sans
contexte/lemme/audio produit simplement `null` pour l'exercice concerné).

## 13. Progression

Modèle actuel : `user → user_word_progress (user_id, word_id) → lesson_words →
lesson → unit → learning_path → surah`.

- Progression = niveau **mot** (clé `user_id + word_id`).
- Plusieurs parcours peuvent coexister pour le même utilisateur : la progression
  est par mot, et les mots sont référencés par plusieurs leçons/parcours sans
  duplication.

Exemple voulu (Utilisateur A : Fātiḥah 100 %, Ikhlāṣ 60 %, Falaq 20 %) : déjà
représentable — la progression par mot est partagée, le **pourcentage par
sourate est dérivé** des `word_id` liés aux leçons du parcours
(`aggregateSurahMastery`). Aucun schéma supplémentaire requis pour représenter
la situation.

## 14. SRS

`review_items` clé `user_id + word_id` : déjà isolé par utilisateur et par mot.
Vues possibles **sans duplication du système** :

- **SRS global** : `getReviewDueCount(user_id)` (existant).
- **SRS par sourate** : `review_items` filtré par les `word_id` de la sourate
  (dérivé via `lesson_words` du parcours).
- **SRS par parcours** : idem, restreint aux `word_id` du parcours.

Le scheduler (Leitner) reste unique. La séparation par sourate est une
**projection de lecture**, pas une nouvelle vérité persistée.

## 15. Mastery

8 compétences (`user_word_skill_progress`, clé `user_id + word_id + skill`) :

`form_recognition`, `meaning_recognition`, `form_to_meaning`,
`meaning_to_form`, `audio_recognition`, `context_recognition`,
`lemma_relation`, `retention`.

**Agrégation `user_id + surah_id` sans casser `user_id + word_id` :**

- conserver la granularité fine `user_id + word_id + skill` (source de vérité) ;
- agréger **en lecture seule** par sourate : `aggregateSurahMastery(surahNumber,
  wordIds, progress, skillsByWord)` (déjà implémenté, pur, testé) ;
- ne **PAS** persister une table `user_surah_mastery` (redondance, risque de
  désynchronisation) — la projection dérivée suffit.

## 16. Isolation utilisateur + sourate

**Invariants :**

1. `USER A + AL-FĀTIḤAH` ne modifie jamais `USER A + AL-IKHLĀṢ` —
   garantie par l'absence de `surah_id` dans le chemin d'écriture ;
2. `USER B` ne modifie jamais `USER A` — garanti par RLS `auth.uid() = user_id`
   sur `user_word_progress`, `review_items`, `user_word_skill_progress`,
   `lesson_sessions`.

**Sémantique des mots partagés (à documenter, pas un bug) :** une forme commune
à deux sourates (ex. basmala) partage **volontairement** sa progression/SRS/
mastery (clé `word_id` global). Si un futur besoin exigeait une maîtrise
par sourate strictement indépendante pour un mot partagé, il faudrait
introduire `user_id + word_id + surah_id` — décision explicite différée,
**non requise** pour la généralisation.

Le test conceptuel `user_id + word_id + surah_id` n'est nécessaire que pour ce
besoin d'isolation stricte par sourate ; la généralisation actuelle ne le
requiert pas.

## 17. Génération de parcours

Le générateur idempotent **existe déjà** : `scripts/seed-multisurah-curriculum.ts`.

- Résout mots/versets depuis les tables Quran existantes (aucun texte inventé) ;
- n'invente ni mots, ni traductions, ni lemmes, ni racines, ni morphologie, ni audios ;
- idempotent : upsert sur `slug` / `(path_id,slug)` / `(unit_id,slug)` +
  `delete+insert` idempotent de `lesson_words` ;
- préserve le parcours éditorial sourate 1 (`skip si number === 1`) ;
- `--dry-run` et `--surahs=` disponibles.

Contrat futur souhaité : `generateLearningPath(surahId)` extrait en fonction
pure/réutilisable (aujourd'hui logique en script). Non implémenté ici.

## 18. Catalogue

Exposition future cible (déjà largement préparée) :

```
Toutes les sourates disponibles (listLearningPaths + surahs)
  → Parcours disponibles (learning_paths)
  → Progression utilisateur (user_word_progress, dérivée par sourate)
  → Mastery utilisateur (aggregateSurahMastery)
```

Exemple conceptuel :

```
Al-Fātiḥah  ██████████ 100 %
Al-Ikhlāṣ    ██████░░░░  60 %
Al-Falaq     ████░░░░░░  40 %
```

Manque uniquement l'**écran** qui assemble ces trois sources. Non implémenté ici.

## 19. Migrations nécessaires

**Aucune migration strictement requise.** La seule migration structurelle
(`learning_paths.surah_id`) est déjà appliquée (0027).

Rappel des critères d'évaluation demandés, pour la migration déjà en place :

| Champ | Contenu |
|---|---|
| nom proposé | `0027_learning_paths_surah.sql` (déjà appliqué) |
| objectif | rattacher explicitement un parcours à une sourate |
| tables | `learning_paths` |
| colonnes | `surah_id uuid` |
| index | `learning_paths_surah_id_idx` |
| FK | `references surahs(id) on delete set null` |
| contraintes | nullable (historique) |
| compatibilité | backfill idempotent slug `quran-vocabulary` |
| rollback | `alter table learning_paths drop column surah_id` |

**Migrations optionnelles (NON recommandées, documentées pour mémoire) :**

- Table `user_surah_mastery` persistée — **refusée** (projection dérivée suffit) ;
- Colonne `learning_paths.is_default` — **refusée** (le défaut peut rester
  applicatif, à condition d'être explicite).

## 20. Tests nécessaires

Numérotation alignée sur la spec §24. État : ✅ déjà couvert / 🔶 partiel / ⬜ à ajouter.

| # | Test requis | État | Où |
|---|---:|---|---|
| 1 | Al-Fātiḥah reste inchangée | 🔶 | non-régression 445 tests + golden reference |
| 2 | Deux sourates → deux parcours | 🔶 | schema + seed multi existent, test de contrat à ajouter |
| 3 | Un utilisateur peut avoir plusieurs parcours | 🔶 | dérivé de la progression par mot ; test à ajouter |
| 4 | Les parcours sont isolés | ⬜ | test catalogue/parcours à ajouter |
| 5 | Mots communs entre sourates non dupliqués | ✅ | `lesson_words` UNIQUE(lesson_id, word_id), `quran_words.arabic` unique |
| 6 | Contextes utilisent le bon ayah | ✅ | `getWordAyahContexts` (testé via pedagogical-integrity/exercises) |
| 7 | Traductions utilisent le bon ayah | ✅ | `translations` par `ayah_id` |
| 8 | Gloses utilisent le bon mot/lemme | ✅ | resolver-mapping.test.ts, lemma-translations.test.ts |
| 9 | Audios correspondent au bon mot | ✅ | word_audio par `word_id` |
| 10 | SRS reste isolé | ✅ | review_items UNIQUE(user_id, word_id) + RLS |
| 11 | Mastery reste isolée | ✅ | user_word_skill_progress UNIQUE(user_id, word_id, skill) + RLS |
| 12 | Progression reste isolée | ✅ | user_word_progress UNIQUE(user_id, word_id) + RLS |
| 13 | Génération idempotente | 🔶 | script idempotent (upsert), test unitaire de contrat à extraire |
| 14 | Aucun fallback implicite vers Al-Fātiḥah | ✅ | `getWordAyahContexts(null) → map vide` ; `getLessonWithWords` sans défaut |

**Ajouts recommandés (avant implémentation UI) :** tests #2, #3, #4 (contrats
catalogue) et #13 (extraction de `generateLearningPath` pure testable).

## 21. Architecture cible

Architecture minimale (majoritairement déjà en place) :

```text
catalogue (surahs ↔ learning_paths)
  → sélection du parcours (slug / surahNumber / surahId)
  → curriculum (path → units → lessons)
      → lesson_words (word_id)
          → word bank résolu (FORME > LEMME > EN)
          → contexte (word → occurrence → ayah → surah)
          → audio (word_id, indépendant de la sourate)
          → exercices déterministes (générés à l'exécution)
          → grading / feedback / explication (inchangés)
      → écriture : user_word_progress / review_items / user_word_skill_progress
        (clés user_id + word_id, RLS)
  → agrégats sourate (projections dérivées : progression %, mastery, SRS)
```

Réponses aux 10 questions :

1. **relation learning_path ↔ surah** — `surah_id` (fait) ;
2. **catalogue** — `listLearningPaths` (fait) + écran à construire ;
3. **requêtes par sourate** — `getCurriculum({surahNumber})` (fait) ;
4. **contexte lexical** — `getWordAyahContexts(wordIds, surahNumber)` (fait) ;
5. **génération idempotente** — `seed-multisurah-curriculum.ts` (fait) ;
6. **progression** — par mot, agrégat sourate dérivé (fait) ;
7. **mastery** — par mot+skill, agrégat sourate dérivé (fait) ;
8. **SRS** — par mot, vues par sourate dérivées (fait) ;
9. **isolation utilisateur** — RLS + clés `user_id` (fait) ;
10. **tests** — compléter la liste §20.

## 22. Risques

1. **Confondre catalogue et parcours actif** : le catalogue ne doit pas devenir
   un ordre séquentiel obligatoire (risque déjà documenté Phase 20A/20B).
2. **Persister une maîtrise par sourate** : créerait une vérité redondante
   désynchronisable ; rester en projection dérivée.
3. **Mots partagés entre sourates** : la progression partagée est un choix ;
   documenter explicitement pour éviter une fausse attente d'isolation stricte.
4. **Seed éditorial Al-Fātiḥah vs générateur** : ne jamais régénérer la sourate 1
   (le générateur skip déjà `number === 1`).
5. **Défaut `quran-vocabulary` silencieux** : conserver un défaut explicite et
   documenté tant que la sélection utilisateur n'est pas construite.
6. **`limit(1)` de `getCurriculum`** : compatible avec un parcours unique par
   écran ; ne pas le confondre avec un filtre « un seul parcours en base ».

## 23. Ordre d'implémentation recommandé

1. Écran catalogue (sourates + parcours + progression/mastery dérivée).
2. Sélection explicite du parcours (supprimer les ancrages dashboard/onboarding).
3. Extraction de `generateLearningPath(surahId)` en fonction pure testable.
4. Tests de contrat catalogue + idempotence (§20).
5. Rétrocompat Al-Fātiḥah : vérifier `/learn/basmala`, `/dashboard`, `/learn`
   inchangés après chaque étape (445 tests + golden reference).

Onboarding, test de niveau, recommandation, personnalisation : **après** cette
généralisation (hors périmètre, spec §19).

## 24. Décision

```
A — READY_FOR_MULTI_SURAH_IMPLEMENTATION

STATUS = READ_ONLY
DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
COMMITS = 0
```

L'architecture est suffisamment claire et majoritairement généralisée au niveau
des données. Les dépendances restantes sont des ancrages UI/slug (IMPORTANT,
non CRITICAL) et la maîtrise par sourate est déjà une projection dérivée prête
à l'emploi. Aucune migration supplémentaire n'est requise pour démarrer
l'implémentation.

---

**Livrables**

- 📄 `PHASE_21A_MULTI_SURAH_ARCHITECTURE_AUDIT.md`
- 📄 `tmp/phase21a-multi-surah-architecture-audit.json`
