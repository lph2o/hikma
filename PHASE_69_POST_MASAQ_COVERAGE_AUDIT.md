# PHASE_69 — POST-MASAQ COVERAGE AUDIT

## STATUT
**READ_ONLY — AUDIT UNIQUEMENT — AUCUNE ÉCRITURE DB** (`DB_WRITES = 0`)

Méthode : fonctions runtime RÉELLES (`getValidatedFrenchMeanings`, `getValidatedFrenchLemmaMeaningsByWord`, `resolveWordMeanings`) sur des données préchargées en mémoire (aucun N+1) — même méthode que l'audit Phase 66. Aucune donnée métier produite, aucun correctif appliqué.

---

## A. ÉTAT MASAQ

| Métrique | Valeur |
|---|---|
| Occurrences MASAQ (`linguistic_occurrences`) | **22 485** |
| Segments MASAQ (`linguistic_segments`) | **44 677** |
| Rattachement 1:1 (word_occurrence_id distincts = total) | 22 485 = 22 485 → **aucun doublon** |
| Formes avec évidence MASAQ | **8 819 / 21 296 (41,4 %)** |
| Matrice par sourate vs registre B01–B11 + COMPLETE | **conforme** (`matrix_ok = true`, 0 violation) |
| Sourate 64 | **0 occurrence** (`MASAQ_BLOCKED`) |

- **Périmètre couvert** : IMPORT_DIRECT (B01–B11 = 54 sourates) + sourates MASAQ_COMPLETE antérieures (20 : 1, 87, 91, 93, 94, 96, 97, 101–114). B01–B11 sont strictement inchangés depuis leur état VERIFIED (matrice exacte).
- **Sourates volontairement hors MASAQ** : CLASSIFIER_REVIEW (24 sourates `MASAQ_BLOCKED` : 10, 14, 17, 18, 21, 24, 25, 30, 33, 35, 37, 38, 40, 41, 42, 43, 44, 48, 59, 60, 64, 72, 75, 81) et SOURCE_ALIGNMENT_REVIEW restantes (2–7, 11, 12, 15, 16, 19, 20, 23, 26, 27, 57).
- **Pourquoi la sourate 64 = 0** : elle est `MASAQ_BLOCKED` (AMBIGUOUS = 1 dans le registre Phase 67) ; le pipeline interdit d'importer une sourate bloquée, et `assertPlanScope` n'a jamais été contourné.
- Checksum MASAQ `777d0cc8…` : OK (vérifié aux étapes 0 de chaque batch).

## B. ÉTAT LEXICAL (couche éditoriale)

| Métrique | Valeur |
|---|---|
| Formes coraniques (`quran_words`) | **21 296** (toutes attestées : 21 296 avec occurrences) |
| Formes avec glose FR **directe** validée (`word_translations`) | **538** |
| Formes résolues **par lemme** (FR validé) | **278** |
| Formes résolues en FR au total | **816 (3,8 %)** |
| Formes **sans glose FR** (fallback EN) | **20 480 (96,2 %)** |
| Formes sans aucun sens (ni FR ni EN) | **0** |
| Formes ambiguës (multi-gloses FR validées / AMBIGUOUS) | **0** |

Catégories de couverture par forme :

| Catégorie | Définition | Nombre |
|---|---:|---|
| **A — Résolue directement** | glose FR validée au niveau `word_translations` | 538 |
| **B — Résolue par lemme** | pas de glose directe, mais `lemma_translation` FR validée via la chaîne lemme | 278 |
| **C — MASAQ dispo, glose absente** | évidence MASAQ, pas de glose FR validée | 8 127 |
| **D — Sans couverture MASAQ** | ni glose FR, ni évidence MASAQ | 12 353 |
| **E — Ambigus / revue requise** | ambiguïté de mapping ou de résolution | 0 |

`word_translations` : **538 lignes = 538 gloses FR validées** (0 proposé, 0 EN, 0 multi-validée).

## C. ÉTAT DES LEMMES

| Métrique | Valeur |
|---|---|
| Lemmes | **32** (8 validés, 24 proposés, 0 rejeté) |
| `lemma_translations` FR **validées** | **28 / 32** |
| Formes avec lemme effectif (direct `quran_words.lemma_id` ou `word_lemma_mapping` safe) | **319** |
| Formes couvertes par un lemme à traduction FR validée | **306** |
| Mappings `word_lemma_mapping` (tous `confidence=safe`) | **184** |

## D. ÉTAT PÉDAGOGIQUE

| Métrique | Valeur |
|---|---|
| Formes enseignées (`lesson_words` distincts) | **543** |
| Enseignables avec signification FR validée (forme ou lemme) | **543 / 543 (100 %)** |
| Enseignées avec fallback EN | 0 |
| Enseignées non résolues | 0 |
| Enseignées avec évidence MASAQ | 543 (100 %) |
| Avec explication pédagogique validée | 13 |

**Aucune forme du curriculum actuel n'est bloquée** : le runtime pédagogique est entièrement résolu en français pour ce qui est enseigné aujourd'hui (P0 = 0).

## E. ÉTAT RUNTIME

Hiérarchie documentée depuis le code (`lib/learning/language.ts` + `lib/learning/queries.ts`) :

```
FORME   (word_translations FR is_validated=true)          → prioritaire
  ↓ sinon
LEMME   (lemma_translations FR is_validated=true,
         via quran_words.lemma_id DIRECT puis
         word_lemma_mapping confidence=safe)              → repli
  ↓ sinon
EN      (quran_words.meaning — Quran.com word-by-word)    → fallback marqué isFallback
  ↓ sinon
null    (aucune donnée)
```
- Le FR **proposé** (`is_validated=false`) n'est JAMAIS utilisé (filtré en amont).
- Règle multi-sources : la glose la plus récente (`updated_at DESC`) est retenue — règle technique documentée.

| Résolution | Nombre | % |
|---|---:|---:|
| Par FORME (FR) | 538 | 2,5 % |
| Par LEMME (FR) | 278 | 1,3 % |
| Fallback EN | 20 480 | 96,2 % |
| Non résolu | 0 | 0 % |

- **0 forme non résolue**, **0 cas de fallback problématique** (aucune forme sans aucune donnée).
- MASAQ n'entre pas dans la résolution (couche d'explication passive) — vérifié dans le code.

## F. PRIORISATION (définition réelle Phase 66, documentée)

`impact = sourates × 10 + occurrences` ; P1 (HIGH) ≥ 60, P2 (MEDIUM) ≥ 20, P3 (LOW) < 20. P0 = catégorie opérationnelle nouvelle (formes enseignées sans FR validé).

| Priorité | Définition | Candidats (formes sans FR validé) |
|---|---:|---:|
| **P0** | curriculum (lesson_words) sans FR validé | **0** |
| **P1** | impact ≥ 60 (fréquentes, multi-sourates) | **1 170** |
| **P2** | impact ≥ 20 | **4 907** |
| **P3** | impact < 20 (rares) | **14 403** |

Parmi les candidats : **8 127 formes de catégorie C** (évidence MASAQ disponible → support linguistique pour le workflow éditorial, jamais substitut à la validation).

## ISSUES_FOUND

**Aucune.** (matrice MASAQ conforme, 1:1 sans doublon, sourate 64 = 0, aucun orphelin `linguistic_occurrences`/`linguistic_segments`, 0 forme ambiguë, 0 forme non résolue, tables métier inchangées — voir `tmp/phase69/issues-found.json`).

## NON-RÉGRESSION (exécutée, aucune correction)

- `npx tsc --noEmit` : **PASS**
- `npx eslint .` : **PASS**
- `npx vitest run` : **775/775 PASS** (59 fichiers — baseline identique)
- `npm run build` : **PASS**

## DÉCISION FINALE

```
PHASE_69_POST_MASAQ_COVERAGE_AUDIT_COMPLETE

STATUS: READY_FOR_EDITORIAL_WORKFLOW

DB_WRITES: 0

MASAQ_OCCURRENCES: 22485
MASAQ_SEGMENTS: 44677

IMPORT_DIRECT:
B01–B11 = VERIFIED

SURAH_64:
MASAQ_BLOCKED / 0 occurrence

WORD_TRANSLATIONS:
538 (toutes FR validées ; 0 proposé ; 0 EN)

LEMMA_TRANSLATIONS:
32 (28 FR validées)

UNRESOLVED_FORMS:
0

AMBIGUOUS_FORMS:
0

P1_CANDIDATES:
1170

RECOMMENDED_NEXT_STEP:
Commencer le workflow éditorial Al-Fātiḥah sur les candidats P1 (1 170 formes
sans FR validé), en commençant par les formes de catégorie C (évidence MASAQ
disponible) ; MASAQ = support linguistique, jamais substitut à la validation
éditoriale ; validation humaine obligatoire avant toute insertion dans
word_translations. Chaque étape éditoriale fera l'objet d'un human gate
distinct.
```

## Justification de la décision (fondée uniquement sur l'audit)

1. Aucun blocage runtime : **0 forme non résolue**, 0 ambiguïté, curriculum 100 % FR.
2. Aucune anomalie de données : matrice MASAQ conforme, aucun doublon, aucun orphelin, sourate 64 = 0.
3. Couche MASAQ IMPORT_DIRECT **complète** (B01–B11 VERIFIED, 22 485 occurrences / 44 677 segments).
4. Couche éditoriale **incomplète mais identifiée** : 20 480 formes sans glose FR, priorisées (P1 = 1 170), dont 8 127 avec évidence MASAQ exploitable.
5. Le workflow éditorial (FORME/LEMME → occurrences → ayahs → 4 traductions → noyau sémantique → glose Hikma → revue → `word_translations`) peut démarrer sur ces candidats sans prérequis manquant.

## Garde-fous respectés

- **Zéro écriture DB** ; aucun import, seed, migration, ni modification de schéma, de moteur MASAQ, de `word_translations`, de `lemma_translations` ni de table métier.
- Aucun commit / push.
- Aucune correction automatique de quoi que ce soit.
- Le workflow éditorial des gloses **n'a pas été lancé** (identification des candidats uniquement).
- Artefacts d'audit uniquement : `tmp/phase69/audit.json`, `tmp/phase69/masaq-per-surah.json`, `tmp/phase69/issues-found.json`, `tmp/phase69/forms-coverage.csv`, et le script read-only `tmp/phase69-audit.ts`.
