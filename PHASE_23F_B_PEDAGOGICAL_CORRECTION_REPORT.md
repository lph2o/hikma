# PHASE 23F-B — CORRECTION PÉDAGOGIQUE DU MOTEUR DE MAÎTRISE

**STATUS : `PEDAGOGICAL_CORRECTION_COMPLETE`**

Phase d'implémentation (migrations + code) strictement limitée aux problèmes
démontrés par l'audit 23F-A. Les données lexicales, le resolver, l'audio et
`quran_words` restent **intacts**.

---

## A. État avant (rappel 23F-A)

- 5/8 compétences réellement alimentées ; `context_recognition`, `lemma_relation`,
  `retention` déclarées mais jamais nourries.
- Rappel `FORM_TO_MEANING` / `MEANING_TO_FORM` **auto-évalué** (non machine-noté).
- Maîtrise « coarse » : `skillMasteryLevel` = corrects nets → **100 corrects + 96
  erreurs = 100**.
- Charge cognitive : leçon 7 = **15 mots** (~75 exercices).
- `selectNextStep` greedy, non câblé en production (la séquence par rondes l'est).

## B. Problèmes 23F-A traités

| # | Priorité | Problème | Traitement |
|---|---|---|---|
| 1 | P1 | `context_recognition` non alimenté | Exercice `CONTEXT_RECOGNITION` |
| 2 | P1 | `lemma_relation` non alimenté | Exercice `LEMMA_RELATION` (si données) |
| 3 | P1 | `retention` non alimenté | Mesure temporelle dérivée + persistance |
| 4 | P1 | Rappel auto-évalué | Notation machine tri-state |
| 5 | P2 | Charge cognitive leçons 4–7 | Ayah 7 scindée + révision plafonnée |
| 6 | P2 | Score trop coarse | Précision + volume + récence |
| 7 | P3 | `selectNextStep` greedy | Hors périmètre (non requis) |

## C. Modifications réalisées

- **Logique pure** : `skill-progress.ts` (formule + `retentionLevel`), `sequencing.ts`
  (rondes contexte/lemme + porte de rétention), `skills.ts`, `types.ts`,
  `exercises/grading.ts` (normalisation + tri-state).
- **Générateurs** : `recall.ts` (saisie libre), `context.ts`, `lemma.ts`, registre,
  `engine.ts` (notation machine), `validator.ts` (types free-text).
- **Données** : `queries.ts` (`getWordAyahContexts`, `getWordLemmaRelations`,
  `getUserSkillProgress` étendu).
- **Persistance** : `actions.ts` (`persistSkillAttempt` + colonnes, `persistRetention`).
- **UI** : carte de rappel libre, cartes contexte/lemme, feedback `AMBIGUOUS`.
- **Curriculum** : `seed-curriculum.ts` (8 leçons, révision plafonnée).

## D. Migration

`supabase/migrations/0024_user_word_skill_progress_recall.sql` — additive, sur
`user_word_skill_progress` :

- `current_streak int` (réussites consécutives),
- `last_correct_at timestamptz`,
- `last_incorrect_at timestamptz`.

Aucune table existante modifiée, aucune politique RLS nouvelle nécessaire
(`auth.uid() = user_id` couvre déjà les colonnes).

## E. `context_recognition`

`CONTEXT_RECOGNITION` : la forme ciblée est présentée **dans son verset réel**
(texte arabe `text_uthmani` + traduction FR Hamidullah du verset), question
« Dans ce verset, que signifie « X » ? », correction QCM de sens. Sans contexte
réel → exercice non généré (aucun texte coranique inventé).

## F. `lemma_relation`

`LEMMA_RELATION` : « quel mot appartient au même lemme que « X » ? » — la bonne
réponse est une **autre forme** du même lemme (source : `quran_words.lemma_id`
direct puis `word_lemma_mapping` safe). Aucune relation fabriquée par similarité
de texte ; sans lemme ou sans « frère », exercice non généré (**DATA_UNAVAILABLE**).
Les formes ne sont jamais fusionnées.

## G. `retention`

`retentionLevel` dérive le niveau du **temps écoulé depuis le dernier rappel
réussi sans échec intercurrent** :

| Situation | Niveau |
|---|---|
| Jamais rappelé correctement | 0 |
| Échec après le dernier succès (perte) | 25 |
| Succès < 1 jour | 25 |
| Survécu ≥ 1 jour | 50 |
| Survécu ≥ 3 jours | 75 |
| Survécu ≥ 7 jours | 100 |

Persistée dans la ligne `skill='retention'` à chaque essai de rappel (agrégat
`form_to_meaning + meaning_to_form`). **Utilisée pour la sélection** : une
compétence de rappel « maîtrisée » est ré-activée tant que la rétention < 75
(< 3 jours) — les compétences faibles reviennent sans tout recommencer.

## H. Rappel actif — notation machine

`FORM_TO_MEANING` / `MEANING_TO_FORM` passent de l'auto-évaluation à la **saisie
libre machine-notée**, avec issue tri-state **CORRECT / INCORRECT / AMBIGUOUS** :

- **Arabe** (`MEANING_TO_FORM`) : forme exacte → CORRECT ; forme clavier sans
  diacritiques → CORRECT ; même forme non vocalisée mais vocalisation différente →
  **AMBIGUOUS** ; consonne différente → INCORRECT.
- **Français** (`FORM_TO_MEANING`) : normalisation (casse, accents, apostrophes,
  ponctuation) puis comparaison aux variantes éditoriales explicites de la glose
  (découpage sur `/`, `·`, `|`) ; pas de fuzzy matching.

`AMBIGUOUS` n'est **jamais** transformé en INCORRECT (neutralité : réponse révélée,
compétence non modifiée).

## I. Maîtrise — nouveau calcul

```
niveau = min(niveau_net, plafond_précision)
niveau = min(niveau, 75) si un échec est RÉCENT
```

| Cas | Avant | Après |
|---|---|---|
| 4 corrects / 0 erreur | 100 | 100 |
| 4 corrects / 1 erreur | 75 | 75 |
| **100 corrects / 96 erreurs** | **100** | **50** |
| 6 corrects / 1 erreur (85,7 %) | 100 | 100 |
| 5 corrects / 1 erreur (83,3 %) | 100 | 75 |
| erreur récente après maîtrise | 100 | 75 (1 cran, symétrique) |

Plafond de précision : ≥ 85 % → 100 ; ≥ 70 % → 75 ; ≥ 50 % → 50 ; sinon 25.
Une seule erreur ne provoque pas de chute disproportionnée (100 → 75, récupérable).

## J. Charge cognitive

- **Ayah 7 scindée** en deux leçons (`sirat-alladhina` = 4 formes ;
  `wa-la-d-dallin` = 4 formes).
- **Révision plafonnée** à 4 mots par leçon (des plus récents d'abord).

| Leçon | Avant (mots) | Après (mots) |
|---|---|---|
| basmala | 4 | 4 |
| al-hamd | 8 | 8 |
| ar-rahman | 8 | 6 |
| malik-yawm-ad-din | 11 | 7 |
| iyyaka-nabudu | 11 | 8 |
| ihdina-sirat | 10 | 7 |
| sirat-alladhina | **15** | 8 |
| wa-la-d-dallin | — | 8 |

Maximum **15 → 8 mots** par leçon, sans casser la progressivité cumulative.

## K. Séquenceur

Les rondes incluent désormais `context_recognition` et `lemma_relation` (ordre
pédagogique) ; `retention` agit comme **porte de ré-activation** du rappel.
`selectNextStep` reste greedy (non câblé) — hors périmètre 23F-B.

## L. Audio

**Aucune modification.** 21 295 `word_audio` Muallim inchangés, `ayah_audio = 0`,
`Mujawwad = 0`. `AUDIO_TO_WORD` / `WORD_TO_AUDIO` intacts ; les nouvelles
compétences ne les interrompent pas.

## M. Al-Fatiha

26 formes, **20/26 FR** (aucune glose ajoutée), **26/26 audio**, 9 lemmes directs
+ 11 mappings safe. Curriculum = **8 leçons cumulatives** couvrant 1:1 → 1:7.

## N. Tests

Ajoutés : notation arabe/français (homographes `عَبَدَ`≠`عَبْد`, `دِين`≠`دَيْن`,
`ضَالّ`≠`ظِلّ`), rappel libre tri-state, `CONTEXT_RECOGNITION`,
`LEMMA_RELATION`, rétention (fake clock J0/J1/J3/J7), maîtrise (précision +
récence), ré-activation par rétention, matrice des 8 compétences. Aucun test
supprimé ni affaibli.

## O. RLS

38/38 — les politiques existantes de `user_word_skill_progress` (select/insert/
update `auth.uid() = user_id`) couvrent les nouvelles colonnes ; User B ne peut
ni lire ni modifier les compétences de User A.

## P. Non-régression

| Vérification | Résultat |
|---|---|
| `npm test` | **278/278** |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | clean |
| `npm run build` | OK |
| `npm run verify:persistence` | **13/13** |
| `npm run verify:rls` | **38/38** |

## Q. Limites restantes

- `retention` est un proxy temporel (dernier succès sans échec) — pas un SRS
  complet avec intervalles par compétence (phase ultérieure).
- `LEMMA_RELATION` n'a de matière que pour les lemmes à ≥ 2 formes (un seul groupe
  dans Al-Fatiha : `صراط`).
- La saisie libre arabe tolère l'absence de diacritiques mais signale `AMBIGUOUS`
  en cas de vocalisation divergente (pas d'analyse morphologique).
- `selectNextStep` greedy reste non utilisé en production (séquence par rondes).

## R. Recommandations futures

1. SRS additif par compétence (intervalles réels, non proxy temporel) — 23G.
2. Étendre `word_lemma_mapping` safe pour nourrir davantage de `LEMMA_RELATION`.
3. Feedback contextuel enrichi (rappeler le lemme + rejouer l'audio après erreur).

---

## MATRICE DES 8 COMPÉTENCES

| compétence | avant 23F-B | après 23F-B | réellement alimentée | persistée | utilisée pour la sélection |
|---|---|---|---|---|---|
| form_recognition | ✓ | ✓ | TRANSLATION_TO_WORD / REVERSE_TRANSLATION / MULTIPLE_CHOICE | ✓ | ✓ |
| meaning_recognition | ✓ | ✓ | WORD_TO_TRANSLATION / COMPLETE_WORD | ✓ | ✓ |
| form_to_meaning | auto-évalué | **machine** | FORM_TO_MEANING (saisie libre) | ✓ | ✓ + porte de rétention |
| meaning_to_form | auto-évalué | **machine** | MEANING_TO_FORM (saisie libre) | ✓ | ✓ + porte de rétention |
| audio_recognition | ✓ | ✓ | AUDIO_TO_WORD / WORD_TO_AUDIO | ✓ | ✓ |
| context_recognition | ✗ | **✓** | CONTEXT_RECOGNITION | ✓ | ✓ |
| lemma_relation | ✗ | **✓ (si données)** | LEMMA_RELATION | ✓ | ✓ |
| retention | ✗ | **✓** | mesure dérivée (rappel + délai) | ✓ | ✓ (porte de ré-activation) |

---

## TEST FINAL DE MAÎTRISE (USER_NEW → Al-Fatiha 1:1 … 1:7)

| Objectif | Verdict | Preuve |
|---|---|---|
| Reconnaître les formes | **YES** | QCM forme (WORD_TO_TRANSLATION / TRANSLATION_TO_WORD) |
| Retrouver leur signification | **YES** | FORM_TO_MEANING machine-noté (FR validé) |
| Retrouver la forme arabe | **PARTIAL** | MEANING_TO_FORM machine ; AMBIGUOUS géré |
| Reconnaître le mot à l'audio | **YES** | AUDIO_TO_WORD, 26/26 URL signées |
| Comprendre le mot en contexte | **YES** | CONTEXT_RECOGNITION (ayah réelle) |
| Relation forme → lemme | **PARTIAL** | LEMMA_RELATION (1 groupe صراط ; DATA_UNAVAILABLE sinon) |
| Conserver après un délai | **PARTIAL** | rétention mesurée + ré-activée ; SRS avancé = phase ultérieure |
| Compétences faibles reviennent | **YES** | porte de rétention + rondes (skip des maîtrisées) |

---

## ARRÊT OBLIGATOIRE

Aucune extension vers 23G / SRS avancé / gamification / 114 sourates / nouvelles
données lexicales / audio. En attente de l'approbation explicite du propriétaire.
