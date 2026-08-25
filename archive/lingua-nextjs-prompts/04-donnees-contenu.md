# Étape 04 — Couche de données (types, langues, unités, leçons)

## 🎯 Objectif

Créer la couche de données typée : langues, unités et **leçons** (avec vocabulaire, phrases, activités et le prompt du prof IA). C'est le contenu pédagogique qui alimente tout le reste.

## 📋 Le prompt

```text
Ajoute à « Lingua » (Next.js + TypeScript) la couche de données pédagogiques.

Crée d'abord `types/learning.ts` avec ces types :

- `LanguageCode = "es" | "fr" | "ja" | "ko" | "de" | "zh"`
- `Language { code, name, nativeName, flag, color, learners }`
- `ActivityType = "vocabulary" | "translate" | "multiple-choice" | "listen"`
- `VocabularyItem { word, translation, pronunciation, emoji? }`
- `Phrase { text, translation, pronunciation }`
- `Activity { id, type, question, correctAnswer, options?, hint? }`
- `LessonGoal { description, xpReward }`
- `AITeacherPrompt { systemPrompt, introMessage, topics }`
- `Lesson { id, unitId, title, description, icon, xpReward, goals, vocabulary, phrases, activities, aiTeacherPrompt }`
- `Unit { id, languageCode, title, description, order, lessonIds }`

Ensuite crée `data/languages.ts`, `data/units.ts` et `data/lessons.ts` avec du contenu réel.

### `data/languages.ts`
4 langues : Espagnol (es, #FF9500), Français (fr, #4D88FF), Japonais (ja, #FF3B30), Allemand (de, #FFCC00). Chacune avec `name`, `nativeName`, `flag` (URL flagcdn), `color`, `learners`.

### `data/units.ts`
Une unité par langue. Exemples :
- es : "Greetings & Basics", leçons es-lesson-1/2/3
- fr : "Bonjour! Greetings", leçons fr-lesson-1 à 5
- ja : "はじめまして — First Steps", leçons ja-lesson-1 à 5
- de : "Hallo! German Basics", leçons de-lesson-1 à 5

### `data/lessons.ts`
Pour chaque langue, crée plusieurs leçons complètes. Chaque leçon doit contenir :
- `vocabulary` : 5 à 10 mots avec traduction, prononciation phonétique, emoji.
- `phrases` : 2 à 4 phrases exemples.
- `activities` : mélange de `multiple-choice` (avec `options`) et `translate` (avec `hint`), 2 à 4 activités.
- `aiTeacherPrompt` : un `systemPrompt` détaillé qui décrit un prof de langue IA (prénom et personnalité par langue : Luna pour espagnol, Claire pour français, Yuki pour japonais, Max pour allemand) qui enseigne UN mot à la fois, donne le sens, un conseil de prononciation, puis s'arrête à un point d'interrogation et attend la réponse de l'élève. Plus un `introMessage` accueillant et un tableau `topics`.

Contenu à couvrir (au minimum) :
- Espagnol : salutations (Hola, Adiós, Buenos días...), présentations (Me llamo...), nombres 1–10.
- Français : salutations (Bonjour, Bonsoir, Au revoir, Merci), présentations, nombres 1–10, couleurs, au café (commander).
- Japonais : salutations (こんにちは, ありがとう...), auto-présentation, nombres 1–10, verbes du quotidien, nourriture & boissons.
- Allemand : salutations (Hallo, Guten Morgen...), présentations, nombres 1–10, couleurs, au café.

Ajoute aussi des fonctions utilitaires dans `data/index.ts` (ou lib) :
- `getLessonsByUnit(unitId)` → Lesson[]
- `getUnitById(unitId)` → Unit | undefined
- `getUnitsByLanguage(languageCode)` → Unit[]
- `getLessonById(lessonId)` → Lesson | undefined
- `getLanguageByCode(code)` → Language | undefined

Écris du contenu réaliste et pédagogiquement correct (prononciations phonétiques lisibles). Reste en TypeScript strict (pas de `any`).
```

## 🔧 Étapes manuelles

- Aucune.

## 📁 Fichiers attendus

```
types/learning.ts
data/languages.ts
data/units.ts
data/lessons.ts
data/index.ts
```

## ✅ Validation

- `npm run build` passe (types corrects).
- Les fonctions utilitaires retournent les bonnes données (tu peux les tester dans une page temporaire ou un test).
