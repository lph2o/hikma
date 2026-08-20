# Focus mode de leçon

## Objectif

Faire de `/learn/[slug]` un espace de concentration distinct du shell applicatif. L’apprenant voit d’abord l’étape, le mot courant, l’audio, l’action pédagogique et la progression ; le contexte coranique reste disponible comme aide secondaire.

## Anatomie

```text
HikmaLessonFocusHeader
├── sortie vers le parcours
├── titre de la leçon
└── étape / mot ou exercice courant
Découverte ou HikmaExerciseShell
└── contenu spécialisé
Contexte coranique (fermé par défaut)
```

## Composition premium du mot courant

Le mot actuel est la scène principale de la découverte :

1. label d’étape et progression discrète ;
2. arabe dominant, rendu par `ArabicText` avec diacritiques intactes ;
3. translittération secondaire ;
4. sens tertiaire et volontairement révélé lorsque le rappel doit être
   protégé ;
5. audio compact et immédiatement identifiable ;
6. prononciation guidée intégrée à la même composition, avec les étapes
   `Écoute → Répète → Compare`.

Le premier mot ne doit pas afficher deux lecteurs pour la même source audio.
Lorsque la prononciation guidée est présente, elle porte l’écoute du modèle ;
les mots suivants utilisent le lecteur compact associé au mot courant.

Le contexte coranique reste secondaire et replié. Une fois ouvert, il sépare
toujours :

- le texte arabe dans sa propre surface RTL ;
- la traduction française dans une surface distincte ;
- la référence dans un niveau de méta discret.

## Règles

- Sur mobile, la navigation globale ne concurrence pas la session ; la sortie reste dans le header de focus.
- Le contexte ne disparaît jamais, mais ne doit pas précéder l’action principale ni révéler une réponse par défaut.
- Un mot arabe reste dominant : `ArabicText`, Amiri, RTL local, diacritiques intactes, line-height généreux.
- L’audio utilise exclusivement `AudioPlayer` et ses états existants.
- La prononciation suit `Écouter → Observer → Répéter → Comparer`, sans STT, score ou modification de maîtrise.
- La révélation du sens reste volontaire.
- Les exercices conservent la même structure de shell ; seule la zone spécialisée varie.

## Responsive

- `390px` / `375px` : header compact, action de sortie tactile, aucun overflow horizontal, contexte fermé.
- `768px` : colonne lisible, shell sans grille décorative.
- `1280px+` : sidebar discrète, colonne pédagogique limitée, contexte secondaire.

## Accessibilité

- Sortie, disclosure et audio portent des noms accessibles.
- Les états ne dépendent jamais uniquement de la couleur.
- La disclosure native reste utilisable au clavier.
- Les états audio et micro sont annoncés avec du texte ; `prefers-reduced-motion` reste respecté.

## À faire / à éviter

| À faire | À éviter |
|---|---|
| Une action dominante par état | Bottom nav concurrente pendant un exercice |
| Contexte repliable et intact | Supprimer ou réécrire le texte coranique |
| Audio associé au mot courant | Lecteur audio parallèle ou natif |
| Feedback séparé par espace et surface | Feedback collé aux options |
| Motion courte de compréhension | Confettis, bounce, animation permanente |
