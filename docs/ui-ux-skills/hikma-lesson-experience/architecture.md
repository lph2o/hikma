# Architecture

Le serveur prépare les données réelles et les exercices déterministes. `LessonPlayer` orchestre les phases et conserve les actions métier existantes. Les composants de présentation composent les états sans recalculer la note, le SRS ou la maîtrise.

Structure cible :

```text
LessonPlayer
├── HikmaLessonFocusHeader / progression de session
├── LessonDiscovery
├── HikmaExerciseShell
│   └── ExerciseCard → interaction spécialisée
├── feedback existant (surface séparée)
└── LessonComplete
```

Sur une route de leçon, le header global est remplacé visuellement par `HikmaLessonFocusHeader`. La navigation desktop reste disponible comme repère discret ; la navigation mobile globale devient secondaire afin de laisser la sortie de session dans le header de focus.

Le contexte verset passe par `HikmaContextDisclosure`, fermé par défaut. Il conserve le texte arabe et la traduction réels, mais n’occupe plus la hiérarchie primaire avant le mot courant.

`HikmaExerciseShell` est une primitive de présentation. Elle reçoit la progression, le verbe d’apprentissage, le contenu, le feedback et l’action principale ; elle ne connaît ni la réponse, ni le grading, ni la persistance.

Chaque exercice final peut porter une identité UI déterministe. Cette identité sert uniquement à remonter le composant d’interaction local ou à réinitialiser ses states ; elle n’est jamais envoyée au moteur de grading ni utilisée comme source de vérité pédagogique.

Après génération, `buildInterleavedSequence` réordonne uniquement la présentation de la session. Les phases restent dans l’ordre reconnaissance → rappel → écoute → relation ; à l’intérieur d’une phase, les files par type alternent de façon déterministe et privilégient un mot différent. Si aucune alternative valide n’existe, la séquence d’origine est conservée. Le contenu, le comptage, le grading, la maîtrise, le SRS et la persistance ne dépendent pas de cet ordre visuel.

Une refonte peut ajouter des props visuelles ou des composants de composition, mais ne doit pas déplacer les Server Actions ni dupliquer `validateAnswer`, `appendAttempt` ou les générateurs d’exercices.
