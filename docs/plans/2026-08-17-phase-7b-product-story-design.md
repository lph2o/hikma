# Phase 7B — Product Storytelling Design

## Intention

Faire comprendre Hikma par une démonstration visuelle continue : un mot passe de la forme arabe au sens, au contexte, à l’écoute, au rappel et au feedback, puis rejoint un parcours d’apprentissage.

## Décision

Approche A — fil rouge statique autour de `ٱلرَّحْمَـٰنِ`.

- La landing reste un composant serveur déterministe.
- Les previews sont des états de démonstration explicites, sans progression personnelle.
- Les primitives existantes sont réutilisées : `ArabicText`, `HikmaProgress`, `HikmaExerciseShell`, `ExerciseFeedback`, `HikmaExplanation`, `Card` et `Button`.
- L’audio est présenté honnêtement comme disponible dans la leçon réelle ; aucune URL audio signée n’est inventée pour la page publique.
- Les textes coraniques, la traduction et la référence sont séparés visuellement et sémantiquement.

## Architecture narrative

1. Hero — promesse et aperçu du mot.
2. Problème — reconnaître ou réciter sans toujours comprendre chaque mot.
3. Mot au centre — forme, translittération, sens.
4. Méthode — VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → FEEDBACK, montrée par fragments.
5. Contexte — texte coranique, traduction, référence.
6. Écouter et s’entraîner — audio réel dans la leçon, exercice de rappel démonstratif.
7. Erreur utile — réponse, réponse attendue, explication indisponible honnêtement.
8. Parcours — états de démonstration clairement signalés.
9. Moment Hikma et CTA — commencer par la route existante `/learn/basmala`.

## Garde-fous

- Un seul H1 et une seule action primaire par hiérarchie.
- Aucune réponse révélée dans la scène d’exercice avant l’effort ; la scène de feedback est étiquetée comme état après réponse.
- Aucune métrique utilisateur, placement automatique, audio simulé ou explication morphologique inventée.
- Aucun changement dans grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, persistance, Supabase, migrations ou données Quran/audio backend.
- Tokens Hikma, `ArabicText` RTL local, contrastes AA et cibles tactiles conservés.
