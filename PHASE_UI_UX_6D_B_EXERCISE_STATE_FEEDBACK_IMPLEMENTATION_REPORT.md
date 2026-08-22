# PHASE UI/UX 6D-B — EXERCISE STATE & FEEDBACK INTEGRITY

**Statut : `UI_UX_6D_B_EXERCISE_STATE_FEEDBACK_COMPLETE_READY_FOR_APPROVAL`**

## 1. State lifecycle avant/après

Avant, `LessonPlayer` réinitialisait `answer`, mais `RecallExercise.value` restait local au composant lorsque deux exercices successifs utilisaient le même composant.

Après, chaque exercice final reçoit une identité UI stable. `ExerciseCard` utilise cette identité uniquement sur le composant d’interaction : le champ, le clavier, l’aide phonétique, les états audio locaux et les autres states spécifiques repartent de leur état initial au changement d’exercice. `LessonPlayer`, `HikmaExerciseShell`, la progression et la persistance ne sont pas remontés.

Détail : [state-lifecycle.md](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6d-state-feedback/state-lifecycle.md).

## 2. Feedback data flow

```text
LessonPlayer.answer.content ──┐
                              ├─ FeedbackPanel → ExerciseFeedback
AnswerResult                  ┘
```

La réponse utilisateur brute est maintenant transmise séparément de `correctContent` et de `result.explanation`.

## 3. Answer contract

- `answer.content` : réponse brute choisie ou saisie, conservée pour l’affichage ;
- `correctContent` : réponse attendue issue du moteur ;
- `AnswerResult` : verdict et explication issus de `validateAnswer` ;
- normalisation : inchangée et confinée au grading ;
- succès : aucune répétition inutile de la réponse attendue ;
- erreur/ambiguïté : `Ta réponse` puis `Réponse attendue`, séparément.

## 4. Exercise identity

Ajout de `GeneratedExercise.id?` comme identité de présentation optionnelle. La page de leçon attache des identités déterministes avec `lessonId`, type, mot cible, prompt et occurrence de signature. Cette identité n’est pas une source de vérité métier, n’est pas persistée et ne participe ni au grading ni au scoring.

Les usages hors page de leçon disposent d’un fallback stable basé sur le type, le mot cible et le prompt.

## 5. Reset matrix

| Zone | Avant | Après |
|---|---|---|
| rappel libre | valeur précédente conservée | reset par identité UI |
| clavier arabe | pouvait rester ouvert | reset avec le composant |
| aide phonétique | `showWord` pouvait fuiter | reset par identité UI |
| options | contrôlées par `LessonPlayer` | inchangé, reset déjà correct |
| audio par source | `key={audioUrl}` existant | conservé |
| prononciation locale | composant local | frontière d’interaction conservée |
| feedback | dérivé de `answer` | disparaît avec l’exercice précédent |

## 6. Feedback matrix

| Résultat | Affichage |
|---|---|
| correct | verdict + message secondaire, sans correction redondante |
| incorrect | `Ta réponse` brute → `Réponse attendue` → explication existante |
| ambiguous | même séparation, verdict distinct et neutre |
| vide | `Aucune réponse` si aucun contenu n’est transmis |

Détail : [feedback-contract.md](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6d-state-feedback/feedback-contract.md).

## 7. Composants modifiés

- `components/learn/exercises/exercise-identity.ts`
- `components/learn/exercises/index.tsx`
- `components/learn/exercises/options-exercise.tsx`
- `components/learn/lesson-player.tsx`
- `components/learn/review-player.tsx`
- `components/ui/exercise.tsx`
- `app/(app)/learn/[slug]/page.tsx`
- `lib/exercises/types.ts`

## 8. Composants créés

- `components/learn/exercises/exercise-identity.ts`
- `tests/exercise-state-feedback.test.ts`

## 9. Variété des exercices

Aucun scheduler n’a été modifié. L’analyse 6D-A reste valide : la leçon de référence contient une diversité de compétences et de types, mais des blocs consécutifs issus du séquenceur cumulatif par rondes. La correction de state ne change ni l’ordre, ni le nombre, ni les types d’exercices.

## 10. Tests

Baseline 6D-B : 401 tests. Résultat final : **405 tests passés dans 31 fichiers**.

Tests ajoutés :

- identité stable et distinction A → B → A ;
- réponse utilisateur brute séparée de l’attendu ;
- absence de duplication après succès ;
- réponse vide compréhensible.

Commandes validées :

- `npm test` : succès ;
- `npx tsc --noEmit` : succès ;
- `npm run lint` : succès ;
- `npm run build` : succès.

## 11. Non-régression

Inchangés : grading, normalisations, scoring, réponses correctes, distracteurs, skills, mastery, SRS, curriculum, persistance, audio backend, Supabase, migrations, données Quran et traductions.

Aucune réponse utilisateur n’est envoyée ailleurs et aucune nouvelle donnée personnelle n’est stockée.

## 12. Browser validation

`BROWSER_VALIDATION_PENDING` — aucune validation navigateur réelle n’a été exécutée. Il reste à vérifier le scénario rappel A → rappel B, le focus, le clavier arabe et l’affichage mobile aux largeurs 320–430 px.

## 13. Limites

- Le retour interactif vers un exercice déjà terminé n’existe pas dans le parcours actuel ; aucun comportement de retour n’a été inventé.
- L’identité UI est déterministe mais n’est pas un identifiant DB et ne doit pas être utilisée pour des décisions pédagogiques.
- La variété du scheduler reste volontairement inchangée et devra faire l’objet d’une décision séparée si une observation navigateur confirme une fatigue pédagogique.

## 14. Décision finale

`UI_UX_6D_B_EXERCISE_STATE_FEEDBACK_COMPLETE_READY_FOR_APPROVAL`

Aucune phase suivante n’a été démarrée.
