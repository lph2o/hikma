# États

Les composants doivent rendre explicitement `loading`, `ready`, `selected`, `correct`, `incorrect`, `disabled`, `retry`, `audio-loading`, `audio-playing`, `audio-error`, `micro-idle`, `micro-requesting`, `micro-recording`, `micro-recorded`, `micro-denied`, `saving`, `saved`, `partial` et `failed`.

La découverte ajoute une hiérarchie `Écouter → Observer → Répéter → Comparer` sans créer de verdict acoustique. Le contexte coranique est `collapsed` par défaut et `expanded` sur action explicite ; sa fermeture ne supprime jamais ses données.

Un état transitoire ne doit pas déplacer brutalement le contenu principal. Un état d’erreur indique l’action de récupération. `partial` distingue une progression partiellement enregistrée d’une perte de données.

Le state local appartient à une identité d’exercice : changer d’exercice réinitialise la saisie, les aides ouvertes, la sélection temporaire, le feedback local et les états audio propres à l’interaction. La réponse brute et la réponse attendue restent deux valeurs distinctes dans le feedback.

Le feedback incorrect suit l’ordre `Ta réponse → Réponse attendue → explication`. En cas de succès, il ne répète pas la même chaîne comme correction.
