# PHASE 21G — POST-IMPORT LEXICAL INTEGRITY & RUNTIME CONSUMPTION AUDIT

STATUS = READ_ONLY
DATABASE_WRITES = 0
IMPORTS = 0
VALIDATIONS = 0
MIGRATIONS = 0
SEEDS = 0

## 1. Executive Summary

La Phase 21F (import contrôlé) est **techniquement intégrée au runtime
multi-sourates**. Le moteur résout désormais les significations dans l'ordre
attendu — **FORME validée → LEMME validé → EN fallback** — et n'utilise
**jamais** une traduction d'ayah (Hamidullah 31, Kazimirski 9001, Sahih 20,
Piccardo 153) comme glose lexicale.

Les 4 sourates pilotes (112, 113, 114, 108) résolvent désormais **100 % de
leurs formes en français** (0 fallback EN restant), avec audio complet et
relations de lemme opérationnelles. Al-Fātiḥah reste strictement inchangée.

## 2. État actuel

| Table | Valeur (21G) | 21F (réf) | Statut |
|---|---|---|---|
| `word_translations` FR validées | **70** | 70 | inchangé ✅ |
| `word_translations` FR validées (source Hikma) | 70 | — | ✅ |
| `lemma_translations` FR validées | **28** | 28 | inchangé ✅ |
| `word_lemma_mapping` safe | **184** | 184 | inchangé ✅ |
| `quran_words` | **21 296** | 21 296 | inchangé ✅ |
| `word_occurrences` | **77 430** | 77 430 | inchangé ✅ |
| `translations` | **24 944** | 24 944 | inchangé ✅ |
| `lemmas` | **32** | 32 | inchangé ✅ (aucun nouveau lemme) |

## 3. Fātiḥah comme référence

`FATIHAH_REFERENCE_LOCKED = PRESERVED`.

| Invariant | Attendu | Mesuré |
|---|---|---|
| Leçons | 8 | **8** ✅ |
| Formes | 26 | **26** ✅ |
| Occurrences (sourate 1) | 29 | **29** ✅ |
| Audio | 26/26 | **26** ✅ |
| Gloses de forme | 25 | **25** ✅ |
| Couverture via lemme | 1 | **1** ✅ |
| Résolution FR totale | 26 | **26** ✅ |

Aucune donnée Fātiḥah n'a été modifiée ni recalculée.

## 4. Règle de résolution à auditer

Fichier : `lib/learning/language.ts` — `resolveWordMeanings(word, french, lemmaFrench)`.

Ordre de priorité (vérifié dans le code, non modifié) :

1. **FORME** — `getValidatedFrenchMeanings` → `word_translations`
   (langue `fr`, `is_validated = true`, plus récente par `updated_at DESC`) ;
2. **LEMME** — `getValidatedFrenchLemmaMeaningsByWord` → `quran_words.lemma_id`
   DIRECT prioritaire, sinon `word_lemma_mapping` (confidence `safe`) → `lemma_translations` ;
3. **EN fallback** — `quran_words.meaning` (source Quran.com), marqué `isFallback = true`.

Comportements vérifiés :
- glose absente → la couche retourne `undefined`, le fallback EN prend le relais ;
- glose non validée (`is_validated = false`) → **invisible** (filtrée en amont) ;
- mapping vers un lemme → consommé par `getValidatedFrenchLemmaMeaningsByWord`
  (précédence lemme direct > mapping), puis par `resolveWordMeanings`.

## 5. Test critique — ne pas revenir à Hamidullah

**Aucun leak détecté (`translation_source_leak = false`).**

La table `translations` (qui porte Hamidullah 31, Kazimirski 9001, Sahih 20,
Piccardo 153) n'est lue que par des fonctions de **contexte de verset** :

- `getWordAyahContexts` (contexte de verset par mot) ;
- `getLessonAyahContext` (verset étudié) ;
- `getWordOccurrencesPage` (fiche mot, contexte d'occurrence).

Aucune de ces fonctions n'alimente `resolveWordMeanings` / `buildWordBank`.
Le sens lexical résolu provient exclusivement de `word_translations` /
`lemma_translations` / `quran_words.meaning`.

## 6. Séparation contexte / glose

Confirmée par construction : le `WordMeaning` (glose) et le
`LessonAyahContext`/`WordContextData` (contexte) sont des types distincts,
produits par des requêtes distinctes. Exemple vérifié :

- `قُلْ` → glose **« dis »** (word_translations) ;
- contexte = traduction complète de l'ayah (jamais utilisée comme glose).

## 7. Audit des 45 gloses de forme

**45/45 vérifiées** : `is_validated = true`, `validated_at` horodaté,
source = « Hikma — lexique éditorial », texte identique à la décision
éditoriale 21E/21E-B. **0 divergence.**

Répartition : 40 ACCEPT + 4 MODIFY (21E) + يَكُن « être » (21E-B).

## 8. Cas يَكُن

| Champ | Valeur |
|---|---|
| Glose résolue | **« être »** ✅ |
| Résolue depuis | `word_translations` ✅ |
| `lemma_id` | `null` ✅ |
| Lemme كَانَ inventé ? | **Non** ✅ |
| Mapping créé ? | **Non** ✅ |

Aucune traduction d'ayah (Hamidullah/Kazimirski/Sahih/Piccardo) n'intervient.

## 9. Cas وَٱلنَّاسِ

| Champ | Valeur |
|---|---|
| Résolue depuis | `lemma_translations` ✅ |
| Lemme | نَاس ✅ |
| Glose finale | **« gens / hommes »** ✅ |
| Mapping safe → نَاس | Oui ✅ |
| word_translation redondante ? | **Non** ✅ |

Le `word_lemma_mapping` est réellement consommé par
`getValidatedFrenchLemmaMeaningsByWord` puis par `resolveWordMeanings`.

## 10. Formes partagées

Une glose de forme est **globale** (liée au `quran_words`), jamais dupliquée
par sourate. Vérifié sur les formes partagées :

| Forme | Gloses FR validées (attendu 1) |
|---|---|
| قُلْ | 1 ✅ |
| هُوَ | 1 ✅ |
| أَعُوذُ | 1 ✅ |
| بِرَبِّ | 1 ✅ |
| مِن | 1 ✅ |
| شَرِّ | 1 ✅ |

## 11. Audit des 4 sourates pilotes

| Sourate | Leçons | Formes | FR résolu | EN fallback | Audio | Relations lemme |
|---|---|---|---|---|---|---|
| 112 — Al-Ikhlāṣ | 4 | 13 | **13** | 0 | 13 | 1 |
| 113 — Al-Falaq | 5 | 17 | **17** | 0 | 17 | 1 |
| 114 — An-Nās | 6 | 17 | **17** | 0 | 17 | 3 |
| 108 — Al-Kawthar | 3 | 10 | **10** | 0 | 10 | 1 |

Chaque parcours charge ses leçons, résout ses gloses (100 % FR), son contexte
de verset, son audio et ses relations de lemme — sans aucune dépendance à
Al-Fātiḥah.

## 12. Anomalies différées (préservées)

| Anomalie | État 21G |
|---|---|
| `أَحَدٌ` — `meaning_en = « anyone of you »` | **inchangé** (DEFERRED) ✅ |
| `فِي` / `نَاس` — `editorial_notes` « NON validée » vs `is_validated = true` | **inchangé** (DEFERRED) ✅ |

Aucune correction n'a été appliquée (hors périmètre, comme requis).

## 13. Sources de traduction

Les 4 sources restent présentes et intactes dans `translations` :
resource_id **20** (Sahih), **31** (Hamidullah), **153** (Piccardo),
**9001** (Kazimirski 1869).

## 14. Root / Morphology

`ROOT = FUTURE WORK` · `MORPHOLOGY = FUTURE WORK`.
La présence d'une glose ne crée aucune racine ni analyse morphologique
(confirmé : aucun lemme كَانَ, aucun mapping supplémentaire).

## 15. Audio Muʿallim

Audio inchangé et accessible : 13/13 (112), 17/17 (113), 17/17 (114),
10/10 (108) — aucun import, aucune modification.

## 16. Tests

| Check | Résultat |
|---|---|
| `npm test` | **456 passed / 38 files** ✅ |
| `npx tsc --noEmit` | **0 erreur** ✅ |
| `npm run lint` | **clean** ✅ |
| `npm run build` | **PASS** ✅ |

`verify:persistence` / `verify:rls` : **NOT_EXECUTED** (écrivent des
utilisateurs temporaires — hors READ_ONLY).

## 17. Critères de succès

| # | Critère | Résultat |
|---|---|---|
| 1 | 45 gloses de forme correctement stockées | ✅ |
| 2 | يَكُن → « être » | ✅ |
| 3 | وَٱلنَّاسِ → نَاس → « gens / hommes » | ✅ |
| 4 | Traductions d'ayah jamais utilisées comme glose | ✅ |
| 5 | 4 sources = contexte uniquement | ✅ |
| 6 | 4 sourates résolvent leurs gloses | ✅ (100 % FR) |
| 7 | Al-Fātiḥah inchangée | ✅ |
| 8 | Aucun doublon lexical | ✅ |
| 9 | Aucun nouveau lemme | ✅ |
| 10 | ROOT/MORPHOLOGY = FUTURE WORK | ✅ |
| 11 | Tests passent | ✅ |
| 12 | Aucune écriture DB | ✅ |

## 18. Décision

**A — LEXICAL_RUNTIME_INTEGRITY_CONFIRMED**

La Phase 21F est techniquement intégrée au runtime multi-sourates. La phase
suivante peut traiter l'enrichissement lexical d'autres sourates avec le même
workflow éditorial (analyse multi-traductions → revue humaine → import contrôlé).

---

DATABASE_WRITES = 0
IMPORTS = 0
VALIDATIONS = 0
MIGRATIONS = 0
SEEDS = 0

FATIHAH_REFERENCE_LOCKED = PRESERVED
PHASE_21F_IMPORT = PRESERVED

FIN PHASE 21G
