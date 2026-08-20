# Patterns de feedback

Le feedback est distinct de la zone de réponse et annoncé avec `aria-live`. Il nomme le résultat, explique brièvement pourquoi si la donnée existe, puis donne une seule action de continuation. `HikmaFeedback` est la primitive de référence pour les états correct, incorrect et ambigu.

La hiérarchie recommandée est : verdict (`Excellent !`, `À revoir`, `À vérifier`) → message secondaire → correction et explication existantes → CTA `Continuer` dans le shell. La séparation est structurelle : une bordure supérieure et un espace dédié distinguent le feedback des options.

Pour une réponse non correcte, les deux valeurs ont aussi leur propre surface sémantique : `Ta réponse` en surface erreur douce et `Réponse attendue` en surface succès douce. Les couleurs sont doublées par les labels, les icônes et l’ordre vertical ; aucune réponse attendue n’est répétée dans une seconde phrase.

Les options à choix sont permutées uniquement à l’affichage par une permutation déterministe. Les objets `GeneratedOption`, leur `position` et `isCorrect` restent inchangés pour la validation.

Dans la leçon, `ExerciseFeedback` reste alimenté par le résultat du moteur. Le shell ne fabrique jamais une explication et ne transforme jamais un état métier ; il ne fait que réserver une surface visuelle stable sous l’interaction.

## Divulgation pédagogique

Après une réponse incorrecte, l’ordre est : `À revoir` → `Ta réponse` →
`Réponse attendue` → note courte → `Comprendre pourquoi` → explication
optionnelle → `Continuer`. `HikmaExplanation` est fermé par défaut et expose
`aria-expanded` ainsi que `aria-controls`. L’explication est une aide volontaire
après l’effort de rappel ; elle ne doit pas surcharger le premier feedback.

Une explication peut être `verified`, `partial` ou `unavailable`. Une donnée
indisponible reste indisponible : aucun root, schème, personne, temps, cas,
préfixe, suffixe ou fonction grammaticale ne doit être déduit visuellement.

Les textes qui répètent déjà `Réponse attendue` sont supprimés de la note
secondaire. La réponse brute reste affichée comme donnée de l’apprenant et ne
doit jamais être remplacée par sa version normalisée.
