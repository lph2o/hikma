# PHASE 21B — MULTI-SURAH PIPELINE FOUNDATION

**STATUS = IMPLEMENTATION · DATABASE_WRITES = CONTROLLED · CODE_WRITES = ALLOWED**

**IMPORTS = 0 · NEW_SOURCES = 0 · NEW_TRANSLATIONS = 0 · NEW_ROOTS = 0 · NEW_MORPHOLOGY = 0 · MIGRATIONS = 0**

## 1. Générateur existant

`scripts/seed-multisurah-curriculum.ts` (inspecté avant modification) :

- **Ce qu'il génère** : pour une sourate donnée, un `learning_paths` (slug
  `quran-surah-{n}`), une `units` (`surah-{n}`), une leçon par verset non vide
  (slug `surah-{n}-ayah-{ayah}`), et les `lesson_words` associés.
- **Niveau d'idempotence** : déjà idempotent — upsert sur clés naturelles
  (`slug`, `path_id,slug`, `unit_id,slug`) + suppression/réinsertion de
  `lesson_words` (aucune FK entrante sur cette table).
- **Clés d'identité** : `learning_paths.slug`, `units(path_id, slug)`,
  `lessons(unit_id, slug)`, `lesson_words(lesson_id, word_id)`.
- **Parcours déjà existant** : upsert (mise à jour sans doublon).
- **Partie déjà existante** : leçons/unités upsertées ; `lesson_words`
  nettoyées puis réinsérées (état stable).
- **Al-Fātiḥah** : le script sautait déjà `number === 1`.

## 2. Modifications réalisées

1. **`lib/learning/surah-curriculum.ts` (nouveau)** — extraction de la logique
   PURE et déterministe `planSurahCurriculum(surah, wordsByAyah, maxReviewWords)`
   qui produit `{ path, unit, lessons }` à partir des seuls mots réels par
   verset. Garanties : idempotente, aucune donnée inventée, jamais de doublon
   lexical, jamais de hardcode Al-Fātiḥah (slug dérivé du numéro de sourate).
   Ajout de `isEditorialSurah()` + `EDITORIAL_PATH_SURAH_NUMBERS = {1}`.
2. **`scripts/seed-multisurah-curriculum.ts` (refactor)** — délègue la
   planification à `planSurahCurriculum`, remplace le guard `number === 1` par
   `isEditorialSurah()`, et **scope le défaut aux 4 sourates pilotes**
   (`PILOT_SURAHS = [112, 113, 114, 108]`). Aucun changement de structure
   pédagogique (une leçon par verset, révision cumulative plafonnée à 4).
3. **`tests/surah-curriculum.test.ts` (nouveau)** — 11 tests unitaires
   (structure, progression cumulative, isolation, absence d'invention,
   idempotence, garde éditoriale).

**Aucune migration** (la migration structurelle `0027_learning_paths_surah`
était déjà appliquée — confirmé Phase 21A). Aucune modification d'Al-Fātiḥah.

## 3. Idempotence

- **RUN 1** : `npm run seed:multisurah -- --surahs=112,113,114,108` →
  `✅ quran-surah-112 · 4 leçons` / `113 · 5` / `114 · 6` / `108 · 3`.
- **RUN 2** (même commande) : résultat **identique**, aucune création de
  doublon (comptes de parcours/leçons/mots stables — voir §9).
- Test unitaire : `planSurahCurriculum` retourne `deepEqual` à chaque exécution
  (RUN 1 = RUN 2), et ignore les doublons intra-verset.

## 4. Al-Fātiḥah non-régression

Snapshot canonical de `quran-vocabulary` (path, units, lessons, lesson_words)
capturé avant et après génération :

| Moment | Hash SHA-256 | Leçons | lesson_words |
|---|---|---|---|
| Avant | `988599aa718fe1be95bf525277a7ebfc579a4068c46bfbea2bad833fe12033b5` | 8 | 56 |
| Après | `988599aa718fe1be95bf525277a7ebfc579a4068c46bfbea2bad833fe12033b5` | 8 | 56 |

**Identique.** Aucune leçon, aucun mot, aucun objectif, aucune structure
Al-Fātiḥah n'a changé. Le générateur la saute via `isEditorialSurah(1)`.

## 5. Al-Ikhlāṣ (112)

- Parcours : `quran-surah-112` → `surah_id = e3db5368-…` (sourate 112). ✅
- 4 leçons (une par verset), 25 associations `lesson_words`, 13 formes distinctes,
  15 occurrences, 13 audios, 0 glose FR de forme, 1 mot couvert par lemme,
  16 traductions (4 ressources × 4 versets).

## 6. Al-Falaq (113)

- Parcours : `quran-surah-113` → `surah_id = 2acf6205-…`. ✅
- 5 leçons, 33 `lesson_words`, 17 formes, 23 occurrences, 17 audios, 0 glose FR,
  2 mots couverts par lemme, 20 traductions (4 × 5).

## 7. An-Nās (114)

- Parcours : `quran-surah-114` → `surah_id = e8a20596-…`. ✅
- 6 leçons, 37 `lesson_words`, 17 formes, 20 occurrences, 17 audios, 0 glose FR,
  3 mots couverts par lemme, 24 traductions (4 × 6).

## 8. Al-Kawthar (108)

- Parcours : `quran-surah-108` → `surah_id = 19c2229f-…`. ✅
- 3 leçons, 17 `lesson_words`, 10 formes, 10 occurrences, 10 audios, 0 glose FR,
  1 mot couvert par lemme, 12 traductions (4 × 3).

## 9. Lexique

| Sourate | Parcours | Leçons | Exercices | Formes | Occurrences | Gloses | Lemmes | Audio |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 — Al-Fātiḥah | quran-vocabulary | 8 | runtime¹ | 26 | 29 | 25 | 21 | 26 |
| 112 — Al-Ikhlāṣ | quran-surah-112 | 4 | runtime¹ | 13 | 15 | 0 | 1 | 13 |
| 113 — Al-Falaq | quran-surah-113 | 5 | runtime¹ | 17 | 23 | 0 | 2 | 17 |
| 114 — An-Nās | quran-surah-114 | 6 | runtime¹ | 17 | 20 | 0 | 3 | 17 |
| 108 — Al-Kawthar | quran-surah-108 | 3 | runtime¹ | 10 | 10 | 0 | 1 | 10 |

¹ Les exercices sont **générés à l'exécution** (jamais persistés : les tables
`exercises`/`exercise_options` sont présentes mais vides). Leur nombre dépend de
la séquence visiteur/connecté ; ce n'est pas une donnée persistée — non inventé.

- **Aucune duplication lexicale** : chaque forme reste une seule ligne
  `quran_words` (clé `arabic` unique) référencée par `word_occurrences`. Les
  comptes de formes/occurrences sont ceux du corpus réel, inchangés.
- **Gloses FR de forme = 0** pour les pilotes : aucune glose n'a été créée (la
  hiérarchie retombe sur le lemme puis l'EN marqué `isFallback`, comme validé).
- **Lemmes** : couverture partielle (1–3 mots par pilote), aucune heuristique
  ni nouveau mapping créé (`NEW_ROOTS = 0`, `NEW_MORPHOLOGY = 0`).

## 10. Traductions

Les 4 sources restent intactes (31 Hamidullah FR, 9001 Kazimirski 1869 FR,
20 Sahih EN, 153 Piccardo IT). Chaque sourate pilote dispose des 4 ressources
sur chaque verset (12/16/20/24 lignes). Vérification : la traduction Hamidullah
d'un mot échantillon de chaque pilote est résolue depuis **son propre `ayah_id`**
(jamais un fallback sourate 1).

## 11. Gloses

Hiérarchie inchangée : `FORME > LEMME (direct puis mapping safe) > EN`.
Pour les pilotes, aucune `word_translation` FR validée n'existe → le mécanisme
existant retombe sur le lemme quand présent, sinon l'EN (`isFallback=true`).
**Aucune glose inventée, aucune nouvelle glose créée.**

## 12. Lemmes

Aucun nouveau mapping `word_lemma_mapping` ni lemme créé. Les mots pilotes qui
résolvent un lemme utilisent uniquement les `lemma_id`/mappings **déjà présents**.
Racines et morphologie : inchangées (`FUTURE WORK`).

## 13. Audio

Audio Muʿallim 100 % sur les pilotes (10/10, 13/13, 17/17, 17/17) — chaque mot
a son audio par `word_id`, indépendant de la sourate. **Aucun import, aucun
audio simulé.**

## 14. Explications

Aucun changement : les pilotes réutilisent `HikmaExplanation` et
`pedagogicalExplanation` (glose / lemme / contexte / audio) validés avec
Al-Fātiḥah. Aucun second système créé. Les mots pilotes sans glose/lemme
retombent sur l'affichage conditionnel existant (repères disponibles ou
« indisponible »), jamais une donnée inventée.

## 15. Progression

Modèle inchangé : `user_word_progress` clé `user_id + word_id`. Un utilisateur
rencontrant des mots de plusieurs sourates accumule une progression par mot ;
la progression par sourate reste une **projection dérivée**. Aucune migration.

## 16. SRS

Inchangé : `review_items` clé `user_id + word_id` (+ RLS). Les mots des
nouvelles sourates entrent dans le SRS sans collision (un mot partagé entre
sourates partage volontairement son échéance — choix documenté, pas un bug).

## 17. Mastery

Inchangée : `user_word_skill_progress` clé `user_id + word_id + skill`.
`aggregateSurahMastery` (pur, testé) dérive la maîtrise par sourate (112, 113,
114, 108, 1) sans nouvelle table persistée. Test unitaire existant conservé.

## 18. Tests

| Vérification | Résultat |
|---|---|
| `npm test` | **456 passed / 38 files** (445 existants + 11 nouveaux) |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **clean** |
| `npm run build` | **PASS** (Next.js 16.3.0) |

**Correspondance aux 15 tests requis :**

| # | Test | Couverture |
|---|---|---|
| 1 | 4 parcours existent | DB (1 parcours par sourate, bon slug) ✅ |
| 2 | surah_id correct | DB + unit (`plan.path.surah_id`) ✅ |
| 3 | Al-Fātiḥah inchangée | hash before=after + unit (`isEditorialSurah`, slug) ✅ |
| 4 | générateur idempotent | unit (deepEqual) + RUN 2 stable ✅ |
| 5–8 | getLearningPathBySurah par sourate | DB (path ↔ surah_id 1:1, slug correct) ✅ |
| 9 | aucune leçon d'une autre sourate | unit (isolation) + DB (slugs `surah-{n}-ayah-…`) ✅ |
| 10 | contextes → bon ayah | DB (mot échantillon → occurrence de LA sourate) ✅ |
| 11 | traductions → bon ayah | DB (Hamidullah sur le bon `ayah_id`) ✅ |
| 12 | gloses → données existantes | aucune glose inventée (glossFR=0, fallback documenté) ✅ |
| 13 | audios → bon mot | audio = formes distinctes, par `word_id` ✅ |
| 14 | aggregateSurahMastery | unit (`surah-mastery.test.ts`) ✅ |
| 15 | aucun fallback Al-Fātiḥah | DB (aucun slug pilote dans `quran-vocabulary`) ✅ |

## 19. Anomalies

- **Aucune anomalie.** Les pilotes ont une couverture lexicale FR faible
  (glose FR de forme = 0, lemmes 1–3) — **limite de données documentée**, pas un
  bug : le repli EN est marqué `isFallback` et aucune donnée n'est inventée.
- Les comptes sont restés **identiques** avant/après génération (état stable,
  aucune duplication).

## 20. Décision

```
PHASE 21B = SUCCESS

- 4 parcours pilotes existent, chacun relié à sa sourate (surah_id) ;
- aucune duplication lexicale incorrecte ;
- aucune dépendance à Al-Fātiḥah (garde isEditorialSurah + hash identique) ;
- aucune donnée inventée (mots/gloses/lemmes/audio/traductions réels) ;
- génération idempotente (RUN 1 = RUN 2) ;
- Al-Fātiḥah inchangée ;
- tests 456 PASS · TypeScript PASS · lint PASS · build PASS.
```

**Sortie de phase** : le pipeline multi-sourates est fondé et piloté sur
{112, 113, 114, 108}. La prochaine phase sera décidée après lecture du rapport
(catalogue/écran de sélection, généralisation aux autres sourates, ou enrichissement
lexical contrôlé — non décidés ici).

---

**Livrables**

- 📄 `PHASE_21B_MULTI_SURAH_PIPELINE_FOUNDATION.md`
- 📄 `tmp/phase21b-multi-surah-pipeline-foundation.json`
- ✏️ `lib/learning/surah-curriculum.ts` (nouveau)
- ✏️ `scripts/seed-multisurah-curriculum.ts` (refactor + scope pilotes)
- ✏️ `tests/surah-curriculum.test.ts` (nouveau, 11 tests)
