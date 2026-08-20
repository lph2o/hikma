# `hikma-learning-path`

## Objectif

Transformer le curriculum réel en chemin d’apprentissage lisible : l’utilisateur sait où il est, ce qu’il peut faire maintenant, ce qui est terminé et pourquoi la suite est verrouillée.

## Quand l’utiliser

Pour `/learn`, les unités, les cartes de leçons et toute représentation de progression du curriculum. La page `/learn/[slug]` reste une responsabilité distincte de la phase leçon.

## Données autorisées

- `curriculum.units[].lessons[]` pour la structure réelle ;
- `lessonStatuses` pour `LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `COMPLETED` ;
- `lessonWordMap` et `progressByWord` pour la progression réelle ;
- `nextLesson` et `activeSession` pour la leçon recommandée ;
- `lessonsCompleted` et `totalLessons` pour la progression globale ;
- `reviewDueCount` pour un lien vers la révision.

Ne jamais inventer niveaux, prérequis, maîtrise, dates ou leçons supplémentaires. Si un prérequis détaillé n’est pas exposé par le curriculum, utiliser une explication générique fidèle au calcul séquentiel et noter le `DATA_GAP`.

## Hiérarchie

1. Nom et intention du parcours.
2. Progression globale réelle.
3. Leçon active ou prochaine étape.
4. Unités comme repères.
5. Leçons terminées, actuelles, disponibles puis verrouillées.
6. Lien secondaire vers la révision.

Le parcours doit ressembler à une continuité, pas à une grille de cartes.

## Primitive `HikmaLessonCard`

La carte centralise les états :

- `AVAILABLE` : action « Commencer », surface neutre et repère discret ;
- `IN_PROGRESS` : « Tu es ici », surface featured, progression et « Reprendre » ;
- `COMPLETED` / `MASTERED` : coche, état secondaire, « Revoir » ;
- `LOCKED` : carte non interactive, cadenas sémantique et raison lisible.

`COMPLETED` n’est jamais présenté comme `MASTERED` : la maîtrise n’est affichée que si le statut réel le permet.

## États

- premier passage : un hero de premier pas et une continuité visuelle légère ;
- actif : priorité à `activeSession`, puis `nextLesson` ;
- parcours terminé : message de consolidation et accès aux leçons/révisions réelles ;
- curriculum absent : empty state pédagogique ;
- curriculum invalide : avertissement non technique, sans modifier les données.

## Responsive et accessibilité

- 360–430px : colonne unique, cartes respirantes et CTA dans la carte active ;
- 768px+ : timeline visible avec repères, sans imposer une grille ;
- chaque état combine icône, texte et surface ;
- cartes disponibles accessibles au clavier avec focus visible ;
- cartes verrouillées non focusables et `aria-disabled` ;
- progression annoncée par label humain ;
- un H1 et une hiérarchie d’unités/lessons continue.

## Anti-patterns

- grille uniforme de leçons ;
- verrou sans explication ;
- animation permanente ou glow ;
- terminé présenté comme maîtrisé ;
- données de maîtrise inventées ;
- copie Duolingo/gamifiée ;
- `/learn` transformé en écran de révision.

## Critères d’acceptation

- l’utilisateur comprend le prochain pas en quelques secondes ;
- `activeSession` et `nextLesson` sont prioritaires ;
- les statuts affichés correspondent à `lessonStatuses` ;
- la progression de chaque leçon vient de `progressByWord` ;
- les leçons verrouillées expliquent la condition connue ;
- la page fonctionne avec l’App Shell et ne modifie pas `/learn/[slug]`.
