# Phase 6G — Before State

**Statut :** état figé avant implémentation de l’intégrité pédagogique.

## Fichiers responsables

- `lib/exercises/generators/context.ts` : génère `CONTEXT_RECOGNITION` avec le contexte réel.
- `components/learn/exercises/index.tsx` : affiche actuellement l’arabe et la traduction française du contexte avant les options.
- `lib/exercises/generators/recall.ts` : force `FORM_TO_MEANING` en français et transmet les variantes acceptées.
- `lib/exercises/engine.ts` : choisit aujourd’hui la langue de grading du rappel libre ; ce contrat est gelé dans cette phase.
- `lib/learning/types.ts` et `lib/learning/lesson.ts` : exposent la langue réelle, le fallback et la validation du sens.
- `lib/exercises/generators/shared.ts` : sélectionne les distracteurs dans l’ordre de la banque, sans relation sémantique déclarée.
- `components/learn/exercises/pedagogical-feedback.ts` et `components/ui/hikma-explanation.tsx` : préparent et affichent les niveaux d’explication.
- `components/ui/exercise.tsx` et `components/learn/exercises/options-exercise.tsx` : séparent la réponse utilisateur, la réponse attendue et le feedback.
- `app/design-system/page.tsx` : laboratoire visuel existant des exercices et du feedback.

## Comportement observé

1. `CONTEXT_RECOGNITION` rend la traduction française du verset avant le QCM, même lorsqu’elle contient le gloss cible.
2. Le word bank porte déjà `meaningLanguage`, `meaningFallback` et `isValidated`, mais le générateur de rappel ne les projette pas dans le contrat de l’exercice.
3. Le prompt `FORM_TO_MEANING` annonce toujours une réponse française ; le grading métier reste séparé et ne sera pas modifié.
4. Les distracteurs sont déterministes et structurellement valides, mais leur relation pédagogique n’est pas prouvée par les données.
5. Les explications phonétiques peuvent être `verified`, les explications de lemme et de sens sont `partial`, et aucune analyse morphologique fiable n’est disponible par défaut.
6. La réponse utilisateur et la réponse attendue sont déjà rendues dans des surfaces distinctes ; l’explication est déjà progressive et fermée par défaut.
7. La normalisation de grading arabe est destinée au grading uniquement ; le rendu utilisateur doit continuer à conserver les caractères Quranic Arabic.

## Risques avant correction

- **P0** : fuite directe du sens via `context.french`.
- **P1** : contradiction entre langue annoncée et langue du sens attendu.
- **P1** : distracteurs arbitraires pouvant rendre un QCM trivial, sans autoriser l’invention de relations.
- **P1** : explication générique présentée comme compréhension pédagogique.
- **P2** : absence de démonstration dédiée des états `SAFE_CONTEXT`, `REVEAL_RISK`, `UNKNOWN`, des langues et des données manquantes.

## Données disponibles

- Texte arabe de verset réel et traduction française réelle lorsqu’elles existent.
- Sens lexical, translittération, provenance, langue réelle, statut fallback/validation.
- Indices et traits phonétiques lorsqu’ils sont réellement fournis.
- Relations de lemme vérifiées lorsqu’elles existent.
- Réponse brute et réponse attendue disponibles dans le feedback post-soumission.

## Données absentes ou insuffisantes

- Pas de graphe sémantique validé pour classer chaque distracteur.
- Pas d’analyse morphologique complète utilisable pour chaque mot.
- Pas de traduction française validée pour tous les mots.
- Pas de télémétrie de difficulté ou de réponses de production.
- Pas de nouvelle source externe autorisée dans cette phase.

## Stratégie corrective approuvée

- Ajouter une détection prudente et explicite de l’exposition de traduction, fondée uniquement sur le sens attendu et ses variantes connues ; en cas de doute, replier la traduction.
- Conserver l’arabe du verset visible et rendre la traduction accessible par disclosure.
- Projeter la langue réelle du sens dans le rappel ; ne jamais annoncer le français pour un fallback anglais, sans modifier le grading métier.
- Conserver le fallback déterministe des distracteurs et exposer honnêtement son niveau de confiance ; aucune relation sémantique ne sera inventée.
- Rendre `unavailable` explicite lorsqu’une explication fiable n’existe pas.
- Ajouter les états au laboratoire, la documentation et les tests ciblés.

## Contrats gelés

`AnswerResult`, grading, scoring, SRS, mastery, scheduler, interleaving 6E-B, curriculum, persistance, Supabase, migrations, données Quran et audio backend restent inchangés.
