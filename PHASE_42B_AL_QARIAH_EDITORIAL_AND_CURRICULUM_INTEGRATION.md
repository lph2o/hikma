# PHASE 42B — AL-QĀRIʿAH (101) — VALIDATION ÉDITORIALE + INTÉGRATION AU CURRICULUM

## A. Executive Summary

Phase 42B terminée avec succès : **21/21 gloses françaises validées et écrites**,
**0 doublon**, **0 NEEDS_REVIEW**, **0 REJECT**, puis intégration de la sourate
Al-Qāriʿah (101) au curriculum via le mécanisme idempotent existant
(`seed-multisurah-curriculum`).

- Couverture FR sourate 101 : **8/29 → 29/29 = 100 %**.
- `classifySurahReadiness(101)` → **READY** (vérifié via `getSurahCatalog`).
- Curriculum : **1 parcours · 1 unité · 11 leçons** (une par verset).
- Catalogue : **17 → 18 sourates**.
- Tests : tsc ✅ · eslint ✅ · **725/725** ✅ · build ✅.
- **Aucun moteur, resolver, SRS, mastery, coverage, Daily Plan, onboarding,
  exercice, schéma ni migration modifié.** Aucun commit, aucun push.

## B. Scope

Phase d'écriture de données lexicales + seed curriculum, conformément au brief.
Aucune logique produit touchée. La seule source d'écriture utilisée est la
source éditoriale existante « Hikma — lexique éditorial »
(`79e6412e-e349-4fe5-b29b-108237375a2d`). Référence lexicale : Kazimirski —
Dictionnaire arabe-français (1860), domaine public (déjà audité/autorise).

## C. Editorial Workflow Used

Workflow Al-Fātiḥah reproduit pour chaque forme :

```
FORME ARABE → OCCURRENCES → AYAHS → Hamidullah FR + Kazimirski FR
→ comparaison FR → Sahih International EN + Piccardo IT (contrôle interlinguistique)
→ référence Kazimirski 1860 → noyau sémantique → glose Hikma → validation
```

Chaque glose est une formulation éditoriale courte, jamais une copie de
traduction protégée, jamais une génération depuis l'anglais/l'italien seuls.

## D. Al-Qāriʿah — 21 Forms (tableau éditorial)

| # | Forme | word_id (8) | Glose Hikma | Type | Sensible |
|---|---|---|---|---|---|
| 1 | ٱلْقَارِعَةُ | 9ea34d67 | le fracas / la calamité (foudroyante) | lexical | OUI |
| 2 | يَكُونُ | a1457ac6 | sera | grammatical (copule) | OUI |
| 3 | كَٱلْفَرَاشِ | 6e9b1e75 | comme les papillons | clitique (كَ+) | OUI |
| 4 | ٱلْمَبْثُوثِ | c69095a0 | éparpillés / dispersés | lexical | — |
| 5 | وَتَكُونُ | 8ece7887 | et seront | clitique (وَ+) | OUI |
| 6 | ٱلْجِبَالُ | d69eb5c9 | les montagnes | lexical | — |
| 7 | كَٱلْعِهْنِ | 543ec844 | comme la laine (cardée) | clitique (كَ+) | OUI |
| 8 | ٱلْمَنفُوشِ | 39018928 | cardée / ébouriffée | lexical | — |
| 9 | مَن | b3b75627 | celui qui / quiconque | grammatical (relatif) | OUI |
| 10 | ثَقُلَتْ | c33dac67 | seront lourdes / pèseront | lexical (verbe) | — |
| 11 | مَوَٰزِينُهُۥ | 879c78bf | ses balances | clitique (+ـهُ) | — |
| 12 | فَهُوَ | 865c436a | et lui / il sera donc | clitique (فَ+) | — |
| 13 | عِيشَةٍۢ | 1d8e9c55 | une vie | lexical | — |
| 14 | رَّاضِيَةٍۢ | 29aef10f | agréable / satisfaisante | lexical | — |
| 15 | مَنْ | e7bb82d1 | celui qui / quiconque | grammatical (relatif) | OUI |
| 16 | خَفَّتْ | 1fd42f04 | seront légères | lexical (verbe) | — |
| 17 | فَأُمُّهُۥ | dc46833f | sa mère (= sa demeure) | clitique + idiome | TRÈS SENSIBLE |
| 18 | هَاوِيَةٌۭ | 58285ff3 | l'abîme / le gouffre | lexical (nom propre) | OUI |
| 19 | هِيَهْ | 7fb56ed2 | c'est / elle | grammatical (pronom) | OUI |
| 20 | نَارٌ | 7b13e37b | un feu | lexical | — |
| 21 | حَامِيَةٌۢ | c9bd6b9e | ardente / brûlante | lexical | — |

## E. Validation Decisions

- **21/21 VALIDATED**, **0 NEEDS_REVIEW**, **0 REJECT**.
- Les 8 groupes sensibles (`ٱلْقَارِعَةُ`, `يَكُونُ/وَتَكُونُ`, `مَن/مَنْ`,
  `فَأُمُّهُۥ`, `هَاوِيَةٌۭ`, `هِيَهْ`, `كَٱلْفَرَاشِ`, `كَٱلْعِهْنِ`) ont reçu
  une note éditoriale explicite.
- `مَن` et `مَنْ` sont deux `word_id` distincts, traités séparément (modèle par
  formes, aucune fusion).
- `نَارٌ` (101) est distinct de `نَارًۭا` (111) — aucune réutilisation abusive,
  aucune fusion.

## F. Sensitive Cases (décisions arbitrées)

1. **ٱلْقَارِعَةُ** — épithète/nom du Jour de la Résurrection (قَرَع =
   frapper/cogner). Noyau conservé : fracas/coup/calamité. Note en
   `editorial_notes`.
2. **يَكُونُ / وَتَكُونُ** — copule كَانَ, glose contextuelle « sera » / « et
   seront ».
3. **فَأُمُّهُۥ** — idiome `فَأُمُّهُ هَاوِيَةٌ` : glose double
   « sa mère (= sa demeure) » pour éviter le contresens littéral.
4. **هَاوِيَةٌۭ** — al-Hâwiya, désignation de l'Enfer ; glose courte
   « l'abîme / le gouffre », note explicative ajoutée.
5. **هِيَهْ** — pronom + ه de pause, glose contextuelle « c'est / elle ».
6. **كَٱلْفَرَاشِ / كَٱلْعِهْنِ** — préfixe comparatif ك conservé.

## G. DB Writes

- 21 INSERT dans `word_translations` :
  - `language = 'fr'`
  - `source_id = 79e6412e-e349-4fe5-b29b-108237375a2d` (Hikma — lexique éditorial)
  - `is_validated = true`, `validated_at = now()`
  - `editorial_notes` : provenance Phase 42B + décision éditoriale
- **0 UPDATE / 0 DELETE**, aucune traduction existante modifiée, aucune
  `lemma_translation` modifiée, aucune source créée.

## H. Before / After Metrics

| Métrique | Avant | Après | Delta |
|---|---:|---:|---:|
| word_translations FR validées | 314 | 335 | +21 |
| Formes FR sourate 101 | 8/29 | 29/29 | +21 |
| Doublons | 0 | 0 | 0 |
| Entrées invalides | 0 | 0 | 0 |

## I. FR Coverage & Readiness

- Sourate 101 : **29/29 = 100 %** (28 FR forme + 1 FR lemme, 0 EN only).
- `getSurahCatalog` réel :
  - **101 Al-Qāriʿah** → `state=READY`, frPct=100 %, 11 leçons, 29 formes.
  - **1 Al-Fātiḥah** → `state=REFERENCE`, frPct=100 %, 8 leçons.
  - **97 Al-Qadr** → `state=READY`, frPct=100 %, 5 leçons.
  - **111 Al-Masad** → `state=READY`, frPct=100 %, 5 leçons.

## J. Curriculum Seed

- Dry-run puis seed réel via `npm run seed:multisurah -- --surahs=101`.
- **1 learning_path** `quran-surah-101` · **1 unit** · **11 lessons publiées**
  (une par verset), `lesson_words` générés par le mécanisme existant.
- Aucune duplication, aucune leçon hors verset.

## K. Catalogue

- Avant : **17** sourates ancrées → Après : **18**.
- 101 présente ; 97 intacte ; 111 intacte ; Al-Fātiḥah `REFERENCE` intacte.

## L. Idempotency Audit

- Réécriture éditoriale : `toInsert=0 skipped=21` (aucun doublon).
- Réexécution du seed : état stable (`✅ quran-surah-101 · 11 leçons (11 versets)`),
  aucune nouvelle leçon.

## M. Tests

- `npx tsc --noEmit` ✅
- `npx eslint .` ✅
- `npx vitest run` → **725/725** ✅ (aucun test modifié)
- `npm run build` ✅

## N. Non-Regression

Confirmé explicitement :
- Aucun moteur pédagogique, resolver, `planSurahCurriculum`,
  `classifySurahReadiness`, SRS, mastery, coverage, Daily Plan, onboarding,
  retry, exercice modifié.
- Aucune migration, aucun schéma modifié, aucune donnée existante supprimée.
- Al-Fātiḥah reste REFERENCE ; parcours 97 et 111 restent READY.

## O. Remaining Issues / Risks

- `WEB_RESEARCH_LIMITED` persiste : aucun accès web frais ; toutes les gloses
  reposent sur les données DB existantes + workflow éditorial établi.
- Les 15 P1 de Phase 40C restent dans le lexique, non intégrées au curriculum
  (conforme — cette phase ne crée aucun axe fréquentiel).
- 29 formes de la sourate = 28 FR forme + 1 FR lemme ; le résidu par lemme est
  une résolution légitime du modèle, pas un doublon.

## P. Verdict

**PHASE_42B_EDITORIAL_AND_CURRICULUM_COMPLETE**

Condition de succès remplie : 21/21 validées, 21/21 écrites, 0 doublon,
0 NEEDS_REVIEW, 0 REJECT, 29/29 FR, 100 %, READY, seed 101 OK (11 leçons),
catalogue 17→18, Al-Fātiḥah REFERENCE, 97/111 READY, tsc/eslint/vitest/build OK,
idempotence OK, aucun moteur modifié, aucun commit, aucun push.
