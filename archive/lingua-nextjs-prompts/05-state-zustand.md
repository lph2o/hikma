# Étape 05 — State management (Zustand + persistance)

## 🎯 Objectif

Mettre en place le state global avec **Zustand** + persistance **localStorage** : XP du jour, objectif quotidien, streak (série), leçons terminées et langue sélectionnée. C'est le « moteur de progression » de l'app.

## 📋 Le prompt

```text
Finalise le state management de « Lingua » (Next.js) avec Zustand.

Contexte : les stores `store/use-language-store.ts` et `store/use-learning-store.ts` existent déjà en version basique. Améliore-les pour qu'ils soient complets et persistés.

1. Installe `zustand`.

2. `store/use-learning-store.ts` — state complet avec persistance localStorage via le middleware `persist` :
   - État : `xpToday: number`, `dailyGoal: number`, `streak: number`, `completedLessonIds: string[]`.
   - Actions :
     - `addXP(amount)` : ajoute de l'XP plafonné à `dailyGoal` (ne dépasse jamais l'objectif).
     - `completeLesson(lessonId)` : ajoute l'id à `completedLessonIds` sans doublon.
     - `setDailyGoal(goal)` : change l'objectif.
   - Persistance : clé de stockage `learning-storage`.

3. `store/use-language-store.ts` :
   - État : `selectedLanguage: LanguageCode | null`.
   - Actions : `setSelectedLanguage(code)`, `clearSelectedLanguage()`.
   - Persistance : clé `language-storage`.

4. Ajoute un petit hook de sélection pour éviter les re-rendus inutiles, par exemple `useCompletedLessonIds()` qui retourne seulement `completedLessonIds`.

5. (Optionnel mais utile) Ajoute un composant de test ou une page `/debug` (non protégée temporairement) qui affiche les valeurs des stores et permet d'appeler `addXP`, `completeLesson`, `setSelectedLanguage` pour vérifier la persistance.

Design : rien de visuel de particulier ici, c'est de la logique pure. Reste simple et lisible.
```

## 🔧 Étapes manuelles

- Aucune.

## 📁 Fichiers attendus

```
store/use-learning-store.ts
store/use-language-store.ts
```

## ✅ Validation

- Les valeurs XP/streak/langue survivent à un rechargement (localStorage).
- `addXP` plafonne bien à `dailyGoal`.
- `completeLesson` n'ajoute pas de doublons.
