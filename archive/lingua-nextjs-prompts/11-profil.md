# Étape 11 — Écran Profil

## 🎯 Objectif

Créer l'onglet **Profil** : avatar, nom, statistiques d'apprentissage (XP, streak, leçons terminées, langue), et déconnexion.

> ℹ️ Dans l'app d'origine, l'onglet Profil est un placeholder (« Profile »). Cette étape le complète pour une version « parité complète ».

## 📋 Le prompt

```text
Crée l'onglet « Profil » de « Lingua » (Next.js + Tailwind).

Contexte : design system Lingua, auth Clerk (`useUser`, `useAuth`), stores `use-learning-store` (xpToday, dailyGoal, streak, completedLessonIds) et `use-language-store` (selectedLanguage), données `data/languages.ts`. La barre d'onglets existe, route `/profile`.

### Page `app/(main)/profile/page.tsx` (client component)
- **En-tête de profil** : avatar de l'utilisateur (image ronde, `user.imageUrl`), nom complet (`user.fullName`) et email.
- **Statistiques** : une rangée de 3 cartes ou chiffres :
  - XP du jour : `xpToday` / `dailyGoal` XP (avec mini barre de progression).
  - Streak : 🔥 `streak` jours (orange #ff8a00).
  - Leçons terminées : `completedLessonIds.length`.
- **Langue** : affiche la langue sélectionnée (drapeau + nom natif) ou un bouton « Choisir une langue » qui mène à `/onboarding`.
- **Objectif quotidien** : rappelle `dailyGoal` XP/jour.
- **Bouton Déconnexion** : appelle `signOut()` de `useAuth` et redirige vers `/sign-in`.
- Design : fond #f6f7fb, cartes blanches arrondies 20px, ombres douces, hiérarchie claire.
```

## 🔧 Étapes manuelles

- Aucune clé supplémentaire.

## 📁 Fichiers attendus

```
app/(main)/profile/page.tsx
components/profile/stat-card.tsx
```

## ✅ Validation

- Le profil affiche les infos Clerk (avatar, nom, email).
- Les stats (XP, streak, leçons) reflètent les stores.
- La déconnexion fonctionne et redirige vers `/sign-in`.
