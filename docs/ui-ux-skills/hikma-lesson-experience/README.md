# Skill — Hikma Lesson Experience

Cette skill décrit la composition UI de l’expérience de leçon Hikma. Elle protège la boucle `VOIR → ÉCOUTER → COMPRENDRE → SE RAPPELER → PRODUIRE → FEEDBACK → CONSOLIDER` sans modifier le moteur pédagogique, les contrats de données, la notation ou la persistance.

## Quand l’utiliser

- toute refonte de `/learn/[slug]` ou de ses états ;
- toute évolution de la découverte, des exercices, de l’audio, du feedback ou de la fin de leçon ;
- toute revue responsive ou accessibilité d’une session d’apprentissage.

## Garde-fous

1. Une intention pédagogique par étape et une action primaire lisible.
2. Le sens ou la réponse ne sont jamais révélés avant l’effort attendu.
3. Les données absentes sont expliquées avec neutralité ; aucun audio, score ou statut n’est simulé.
4. Les composants réutilisent les tokens Hikma, des cibles tactiles d’au moins 44 px et un focus visible.
5. Toute animation reste limitée à `transform` et `opacity` et respecte `prefers-reduced-motion`.

## Références

- [Principes](./principles.md)
- [Architecture](./architecture.md)
- [États](./states.md)
- [Patterns d’exercice](./exercise-patterns.md)
- [Patterns audio](./audio-patterns.md)
- [Patterns de feedback](./feedback-patterns.md)
- [Feedback pédagogique et langage islamique](./pedagogical-feedback.md)
- [Responsive](./responsive.md)
- [Accessibilité](./accessibility.md)
- [Exemples](./examples.md)
- [Focus mode](./focus-mode.md)
