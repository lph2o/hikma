# Feedback pédagogique et langage islamique

## Intention

Le feedback suit : **RÉPONDRE → RECEVOIR LE FEEDBACK → COMPRENDRE → RETENIR**.
La réponse attendue n’est visible qu’après l’effort. L’explication détaillée
est une divulgation volontaire, fermée par défaut.

## Hiérarchie

Pour une erreur :

1. `À revoir` ou `À vérifier` ;
2. `Ta réponse`, dans une surface erreur douce ;
3. `Réponse attendue`, dans une surface succès douce ;
4. une note courte si elle apporte une information distincte ;
5. `Comprendre pourquoi` ;
6. l’explication source-backed ;
7. `Continuer`.

`HikmaExplanation` est une primitive de présentation. Elle ne connaît pas le
grading et reçoit uniquement une charge UI avec `verified`, `partial` ou
`unavailable`.

## Sources autorisées

- sens, réponse révélée et forme arabe réellement fournis par l’exercice ;
- translittération comme aide secondaire ;
- `phoneticMarks`, `phoneticHints` et `phoneticTrait` issus de la phonétique
  déterministe du projet ;
- relation de famille lexicale uniquement lorsque le lemme est fourni et
  vérifié.

Le contexte de verset est un contexte réel, pas une analyse exégétique. Les
racines, schèmes, préfixes, suffixes, personne, temps, cas et fonctions
grammaticales restent indisponibles tant qu’une donnée fiable ne les porte pas.
Il vaut mieux afficher l’absence d’explication que remplir l’espace avec une
analyse inventée.

## Langage islamique

Le langage islamique est naturel, rare et contextuel :

- `Très bien.` ou `Réponse juste.` pour une réussite ordinaire ;
- `Mā shā’ Allāh` pour une réussite difficile ou un jalon significatif ;
- `Bismillāh` à l’entrée réelle d’une leçon ;
- `Al-ḥamdulillāh` à la fin réelle d’une leçon ou d’une étape importante.

Ces expressions ne sont jamais des points, badges, scores ou récompenses
automatiques. Elles ne sont pas ajoutées après chaque réponse correcte.

## Accessibilité et responsive

La disclosure est utilisable au clavier et expose `aria-expanded` /
`aria-controls`. Les informations d’état sont toujours doublées par du texte
ou une icône. Les couleurs utilisent les tokens sémantiques et les variantes
`*_text` pour le contenu. Le contenu arabe utilise `ArabicText`, conserve tous
ses signes et reste RTL local.

À 390 px, l’ordre reste résultat → réponses → explication → CTA, sans overflow
horizontal. À 1280 px, l’explication reste dans la colonne de focus et ne
réintroduit pas le contexte secondaire dans la tâche principale. Les effets de
disclosure utilisent uniquement opacity/transform et respectent reduced motion.
