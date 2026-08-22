# PHASE UI/UX 6C — FEEDBACK IMPLEMENTATION REPORT

**Statut : `UI_UX_6C_FEEDBACK_COMPLETE_READY_FOR_APPROVAL`**

## 1. Problème identifié

Les options étaient rendues dans l’ordre fourni par les générateurs. Plusieurs générateurs construisent la bonne réponse en dernier, ce qui pouvait créer un indice spatial répétitif. Le feedback était également trop proche visuellement de la zone des options.

## 2. Cause racine

`OptionsExercise` et plusieurs variantes spécialisées parcouraient directement `exercise.options`. La validation, elle, utilise les objets d’options et leurs propriétés métier ; l’ordre d’affichage n’était pas séparé de cette représentation.

## 3. Solution

- ajout de `stableOptionOrder`, helper pur et déterministe ;
- permutation appliquée uniquement dans les vues d’options ;
- seed stable dérivé du type, du mot cible et du prompt ;
- conservation complète des objets, `position`, `isCorrect`, `wordId` et du nombre d’options ;
- renforcement d’`ExerciseFeedback` avec verdict, message secondaire, icône et hiérarchie plus respirante ;
- séparation structurelle du feedback dans `HikmaExerciseShell` via bordure supérieure, espace dédié et région nommée ;
- ajout des références `Exercise Feedback` et `Option Ordering` au laboratoire.

## 4. Fichiers modifiés

- `components/learn/exercises/option-order.ts`
- `components/learn/exercises/options-exercise.tsx`
- `components/learn/exercises/index.tsx`
- `components/learn/exercises/hikma-exercise-shell.tsx`
- `components/ui/exercise.tsx`
- `app/design-system/page.tsx`
- `tests/option-order.test.ts`
- `docs/ui-ux-skills/hikma-lesson-experience/feedback-patterns.md`
- `docs/ui-ux-skills/hikma-lesson-experience/accessibility.md`
- `docs/ui-ux-skills/hikma-lesson-experience/examples.md`

## 5. Architecture

```text
LessonPlayer
  → ExerciseCard
  → HikmaExerciseShell
      → interaction spécialisée
      → FeedbackPanel
      → ExerciseFeedback
      → CTA Continuer
```

`LessonPlayer` reste propriétaire de la validation et de la progression. `FeedbackPanel` reste l’adaptateur unique entre `AnswerResult` et le rendu. `ExerciseFeedback` reste une primitive de présentation.

## 6. Randomisation des réponses

La permutation est déterministe, reproductible, sans `Math.random()` et sans mutation de l’entrée. Elle couvre les options des QCM, les exercices audio, la discrimination phonétique et l’auto-évaluation lorsque l’ordre visuel peut varier sans changer le contrat.

Les réponses attendues restent exactement les mêmes ; seule leur position visuelle peut changer.

## 7. Feedback UX

- correct : `Excellent !` puis `Bien joué.` ;
- incorrect : `À revoir` puis correction/explanation existantes ;
- ambiguous : `À vérifier` avec message neutre ;
- icônes et texte complètent la couleur ;
- correction arabe conservée via `ArabicText` ;
- CTA conservé dans le shell, séparé du feedback.

Les états `NO_SIGNAL` et `REVIEW_REQUIRED` ne sont pas mélangés à `ExerciseFeedback` et restent confinés à la production vocale locale.

## 8. Accessibilité

Le feedback conserve `role="status"` et `aria-live="polite"`. La zone est nommée `Feedback`, les icônes sont décoratives, les boutons existants gardent leurs focus states et les cibles tactiles du shell restent en `min-h-12`.

## 9. Responsive

La séparation verticale fonctionne sur 320–430 px sans grille horizontale supplémentaire. Les options gardent leur largeur disponible, le feedback est empilé et le CTA reste distinct et atteignable.

## 10. Audio / prononciation

Aucun changement à `AudioPlayer`, au coordinator audio, à MediaRecorder, aux mesures acoustiques, aux états `NO_SIGNAL`/`REVIEW_REQUIRED`, à l’upload ou au stockage. Les lecteurs et la prononciation continuent d’utiliser leurs contrats existants.

## 11. Design System

Utilisation des tokens V2 et primitives existantes : surfaces warm, `success-text`, `error-text`, `warning-text`, border hairline, `animate-feedback-in`, `ArabicText`, `Button` et `HikmaExerciseShell`. Aucun nouveau token ni style inline ajouté.

## 12. Design Laboratory

`/design-system` contient désormais :

- correct ;
- incorrect ;
- ambiguous ;
- correction arabe ;
- états techniques loading/no-signal représentés visuellement ;
- CTA ;
- deux exercices avec permutation d’options stable et positions différentes.

## 13. Skill créée ou mise à jour

Mise à jour de `docs/ui-ux-skills/hikma-lesson-experience/` pour documenter la hiérarchie verdict → correction → CTA, la séparation réponse/feedback, la permutation déterministe, l’accessibilité et les règles responsive.

## 14. Invariants métier

Confirmé inchangé :

- grading inchangé ;
- scoring inchangé ;
- mastery inchangé ;
- SRS inchangé ;
- données Quran inchangées ;
- persistance inchangée ;
- aucun upload audio ;
- aucune migration ;
- aucun nouveau type d’exercice ou compétence.

## 15. Tests

- baseline avant 6C : 397 tests ;
- tests ajoutés : 4 tests ciblés de permutation ;
- résultat final : **401 tests passés dans 30 fichiers** ;
- `npx tsc --noEmit` : succès ;
- `npm run lint` : succès ;
- `npm run build` : succès.

## 16. Browser Validation

`BROWSER_VALIDATION_PENDING` — aucune validation navigateur réelle n’a été exécutée dans cette session. Il reste à vérifier visuellement les largeurs 320, 375, 390, 430 et desktop, ainsi que le scénario options → feedback → continuer.

## 17. Risques / limitations

- Le focus automatique vers le feedback ou le CTA n’a pas été ajouté : cela nécessiterait une décision dédiée de gestion du focus pour éviter une surprise clavier.
- La permutation ne garantit pas que chaque seed produise une permutation différente ; elle garantit une permutation stable et permet des positions différentes entre exercices, ce qui est le comportement recherché.
- Les états acoustiques restent dans `PronunciationGuided` et ne sont pas visibles dans les feedbacks notés génériques.

## 18. Décision finale

`UI_UX_6C_FEEDBACK_COMPLETE_READY_FOR_APPROVAL`

Aucune phase suivante n’a été démarrée.
