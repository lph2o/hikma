# PHASE 47 — DÉBLOCAGE ÉDITORIAL CIBLÉ : AT-TIN (95)

**Statut final : `PHASE_47_AT_TIN_READY`**

> Phase de données lexicales + seed curriculum uniquement (workflow 40C/41B/42B).
> Aucun moteur, resolver, SRS, mastery, Daily Plan, coach, exercice, onboarding,
> explication de sens, MASAQ, schéma ni migration modifié. Aucun commit, aucun push.

---

## 1. Statut initial

`PHASE_46_CONSOLIDATION_COMPLETE_ONBOARDING_READY` — la sourate 95 (At-Tin) était
**absente du catalogue** (0 parcours) et bloquée par **26 gloses FR manquantes** sur
34 formes distinctes.

## 2. État avant modification (audit READ-ONLY)

| Élément | Avant |
|---|---:|
| Ayahs | 8 |
| Occurrences | 34 |
| Formes distinctes | 34 (chaque forme 1 occurrence) |
| Gloses FR validées | 8 |
| Résolutions via lemme FR | 0 |
| **Formes manquantes** | **26** |
| Curriculum (path/unit/lessons/lesson_words) | 0 / 0 / 0 / 0 |

Sourate hors catalogue : les 18 parcours ancrés étaient 1, 93, 94, 97, 101–114
(`quran-vocabulary` + 17 `quran-surah-*`), **95 absent**.

## 3. Formes analysées

34 formes distinctes, toutes à 1 occurrence, sans lemme (sauf `ٱللَّهُ`). 8 déjà
prêtes, 26 manquantes (aucune `NEEDS_REVIEW`, aucune `BLOCKED`).

## 4. Gloses existantes (8, inchangées)

| Forme | Glose existante |
|---|---|
| ءَامَنُوا۟ | ils ont cru |
| إِلَّا | sauf |
| ثُمَّ | ensuite |
| وَعَمِلُوا۟ | et ont accompli |
| ٱلصَّـٰلِحَـٰتِ | les bonnes œuvres |
| ٱللَّهُ | Allah |
| ٱلَّذِينَ | ceux qui / ceux que |
| ٱلْإِنسَـٰنَ | l'homme |

## 5. Gloses ajoutées (26)

| Forme | Glose Hikma | Type | Note sensible |
|---|---|---|---|
| وَٱلتِّينِ | et le figuier | clitique (وَ + ٱلتِّين) | serment |
| وَٱلزَّيْتُونِ | et l'olivier | clitique (وَ + ٱلزَّيْتُون) | — |
| وَطُورِ | et le Mont | clitique (وَ + طُور) | — |
| سِينِينَ | Sinaï | nom propre | Hamidullah « Sînîn » / Kazimirski « Sinaï » |
| وَهَـٰذَا | et ceci | clitique (وَ + هَٰذَا) | — |
| ٱلْبَلَدِ | la cité / le pays | lexical | Mecque (Hamidullah « Cité », Kazimirski « territoire ») |
| ٱلْأَمِينِ | sûr | lexical | Hamidullah « sûre », Kazimirski « sacré » |
| لَقَدْ | certes | particule (لَ + قَدْ) | — |
| خَلَقْنَا | nous avons créé | verbe + ـنَا | — |
| فِىٓ | dans | préposition | — |
| أَحْسَنِ | la meilleure / la plus belle | élatif | — |
| تَقْوِيمٍۢ | forme / stature | lexical | — |
| رَدَدْنَـٰهُ | nous l'avons ramené | verbe + 2 clitiques | — |
| أَسْفَلَ | le plus bas | élatif | — |
| سَـٰفِلِينَ | les plus bas | lexical (pluriel) | — |
| فَلَهُمْ | pour eux | clitique (فَ + لَ + ـهُم) | — |
| أَجْرٌ | une récompense | lexical | — |
| غَيْرُ | autre que / sans | négation d'exception | — |
| مَمْنُونٍۢ | ininterrompue | lexical | — |
| فَمَا | qu'est-ce qui donc | clitique (فَ + مَا) | — |
| يُكَذِّبُكَ | te fait traiter de mensonge | verbe + ـكَ | **SENSIBLE** (كَذَّبَ) |
| بَعْدُ | après | adverbial | — |
| بِٱلدِّينِ | la rétribution / la religion | lexical | **SENSIBLE** — دِين polysémique |
| أَلَيْسَ | n'est-il pas | أَ + لَيْسَ (interrog. négative) | — |
| بِأَحْكَمِ | le plus juste | élatif | **SENSIBLE** — juste/sage |
| ٱلْحَـٰكِمِينَ | les juges | lexical (pluriel) | — |

## 6. Sources utilisées

- **Source d'écriture** : « Hikma — lexique éditorial » (`79e6412e-e349-4fe5-b29b-108237375a2d`).
- **Référence lexicale** : Kazimirski — Dictionnaire arabe-français (1860), domaine public
  (`567c8b5d-ff97-432c-9cb1-8fa88e41f0f4`) — référencée en `editorial_notes`, jamais source d'écriture.
- **Contrôle** : Hamidullah FR (resource 31), Kazimirski Le Koran (resource 9001),
  Sahih EN (resource 20), Piccardo IT (resource 153).
- Aucun contenu protégé copié, aucune glose dérivée de l'anglais/l'italien seuls,
  aucune utilisation de MASAQ comme autorité sémantique.

## 7. Décisions éditoriales

- **26/26 `VALIDATED`**, **0 `NEEDS_REVIEW`**, **0 `REJECT`**.
- Cas sensibles arbitrées et documentés :
  - `بِٱلدِّينِ` : « la rétribution / la religion » (Hamidullah « la rétribution »,
    Kazimirski « la vraie religion ») — polysémie conservée.
  - `يُكَذِّبُكَ` : « te fait traiter de mensonge » (كَذَّبَ, factitif), sur la
    formulation Hamidullah.
  - `بِأَحْكَمِ` : « le plus juste » (convergence Sahih « most just » / Hamidullah
    « le plus sage » / Kazimirski « le meilleur »).
  - `سِينِينَ` : « Sinaï » (nom propre), variantes Sînîn/Sinaï documentées.
- Aucun rapprochement de formes, aucun regroupement par lemme (modèle FORME ≠ LEMME respecté).

## 8. Écritures DB effectuées

- **26 INSERT** dans `word_translations` : `language='fr'`, `source_id=79e6412e…`,
  `is_validated=true`, `validated_at=now()`, `editorial_notes` (workflow + décision).
- **0 UPDATE / 0 DELETE** ; aucune traduction existante modifiée ; aucune source créée ;
  aucune `lemma_translation`, `word_explanation` ni `word_explanation_context` touchée.
- Idempotence vérifiée par ré-exécution : `0 insérée(s), 26 déjà présente(s)`.

## 9. Seed curriculum effectué

- `npm run seed:multisurah -- --surahs=95` (après `--dry-run` : 8 leçons).
- Créé : **1 learning_path** `quran-surah-95`, **1 unit**, **8 leçons publiées**
  (1/verset : `surah-95-ayah-1` … `-8`), **60 lesson_words**.
- 0 doublon de position, 0 mot étranger à la sourate (34/34), 0 leçon hors verset.

## 10. État final

- **34/34 formes résolvent en FR** (0 EN-only, 0 via lemme).
- Curriculum 95 présent et complet.

## 11. Vérification READY

- Exercice du résolveur réel `resolveWordMeanings` (code non modifié) : **34/34 FR validé
  (`isValidated=true`)**, 0 non-FR.
- `classifySurahReadiness(95, 100 %)` → **`READY`** (sourate ≠ 1, couverture 100 %).

## 12. Compteurs DB avant/après

| Compteur | Avant | Après | Delta |
|---|---:|---:|---:|
| word_translations FR validées | 335 | 361 | **+26** |
| learning_paths | 18 | 19 | +1 |
| units | 18 | 19 | +1 |
| lessons | 111 | 119 | +8 |
| lesson_words | 742 | 802 | +60 |

Tables verrouillées **inchangées** : `word_explanations=13`, `word_explanation_contexts=1`,
`linguistic_occurrences=413`, `linguistic_segments=796`, `lemma_translations=32`,
`lemmas=32`, `word_lemma_mapping=184`.

## 13. Tests

- `npx tsc --noEmit` ✅ (0 erreur)
- `npx eslint .` ✅ (0 erreur)
- `npx vitest run` → **733/733** (55 fichiers) ✅ — baseline Phase 46 identique, aucun test modifié
- `npm run build` ✅ (Next.js 16.3.0, routes complètes)

## 14. Régressions éventuelles

**Aucune.** Phase 100 % données + seed ; `0` fichier moteur/produit modifié, 0 test modifié.

## 15. Éléments explicitement non touchés

- Onboarding V2 (`CURRENT_ONBOARDING_VERSION=2`), aucune V3.
- Explications de sens 44B (`word_explanations` / `word_explanation_contexts` / `HikmaExplanation`).
- MASAQ (passif, inchangé, jamais autorité sémantique).
- SRS / mastery / Daily Plan / coach (45C reste DEFERRED).
- Resolver, exercices, grading, schéma, migrations.
- Aucune autre sourate modifiée (97/101/111/107… intactes).

## 16. Risques résiduels

- 3 cas sensibles (`بِٱلدِّينِ`, `يُكَذِّبُكَ`, `بِأَحْكَمِ`) : polysémie arbitrée et
  documentée en `editorial_notes`, risque résiduel faible (même précédent que 41B/42B).
- Clitiques « وَ + nom » figés hors contexte (précédent Al-Fātiḥah assumé).

## 17. Recommandation pour la sourate suivante

**Az-Zalzalah (99, ≈ 26 gloses)** puis Ad-Diyat (100) / Ash-Shams (91), même workflow
40C/41B/42B (gloses FR + `seed:multisurah`). Sourate 107 : compléter la **1 forme EN-only**
pour la faire passer de `IN_PREPARATION` à `READY`. Données uniquement, aucun moteur.

---

## Verdict final

**`PHASE_47_AT_TIN_READY`**

26/26 gloses validées et écrites (idempotent), 34/34 FR (100 %), `READY`, seed 95 OK
(8 leçons, 60 lesson_words), catalogue 18 → 19, Al-Fātiḥah REFERENCE et 97/101/111/107
intacts, tsc/eslint/vitest 733/build verts, aucun moteur ni schéma modifié, aucun commit/push.
