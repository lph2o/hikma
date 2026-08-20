# Patterns d’exercice

Chaque exercice suit la même hiérarchie : compétence visée, consigne, contenu arabe/audio, interaction, action de validation, puis feedback. La mécanique spécifique reste dans les exercices existants.

## Interleaving pédagogique

La séquence finale conserve les prérequis : la reconnaissance précède le rappel, l’écoute et les relations. Dans une même phase, Hikma alterne les types compatibles et évite de revoir immédiatement le même mot lorsque cela reste possible. Cette variété est déterministe, sans `Math.random()`, et ne force pas une alternance artificielle lorsqu’un seul type est disponible. Elle change l’ordre de présentation, jamais les exercices générés ni leur notation.

`HikmaExerciseShell` porte cette grammaire commune : `Exercice X sur Y`, compétence formulée avec un verbe humain, zone d’interaction, feedback séparé et CTA unique. `ExerciseCard` reste le dispatcher des interactions spécialisées.

- choix : options larges, état sélectionné distinct du résultat ;
- rappel libre : effort de rappel avant la correction ;
- audio : écouter avant de répondre, absence d’audio explicitement neutre ;
- prononciation : guider l’écoute, l’observation, la répétition et la comparaison locale sans score automatique.
