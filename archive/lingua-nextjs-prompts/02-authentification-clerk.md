# Étape 02 — Authentification Clerk

## 🎯 Objectif

Ajouter l'authentification complète avec **Clerk** : inscription et connexion par **email** et par **SSO** (Google, Facebook, Apple), avec des pages de sign-in/sign-up personnalisées aux couleurs de Lingua, un middleware de protection, et une redirection selon l'état de session.

## 📋 Le prompt

```text
Ajoute l'authentification Clerk à mon application Next.js « Lingua » (clone Duolingo).

Prérequis déjà en place : Next.js 15 App Router + Tailwind v4 + design system Lingua (couleurs : lingua-purple #6c4ef5, lingua-blue #4d88ff, etc., police Poppins, classes h1/body-md...).

1. Installe `@clerk/nextjs`.
2. Configure le provider Clerk dans le layout racine (`<ClerkProvider>`), et ajoute un fichier `middleware.ts` qui protège toutes les routes sauf les routes publiques (`/`, `/sign-in`, `/sign-up`, et les assets statiques).
3. Crée deux pages personnalisées (pas les composants préfabriqués de Clerk, mais un vrai design Lingua) :
   - `app/(auth)/sign-in/page.tsx` — écran de connexion
   - `app/(auth)/sign-up/page.tsx` — écran d'inscription
4. Chaque écran auth contient :
   - Un en-tête avec le logo/titre « Lingua » et un sous-titre.
   - Un formulaire email + mot de passe (utilise les composants Clerk comme `<SignIn />`/`<SignUp />` est interdit ; utilise les hooks `useSignIn` / `useSignUp` et construit ton propre formulaire stylisé).
   - Un séparateur « ou ».
   - Un bouton « Continuer avec Google », un « Continuer avec Facebook » et un « Continuer avec Apple » qui utilisent le flux SSO de Clerk (`useSSO` avec la stratégie `oauth_google`, `oauth_facebook`, `oauth_apple`).
   - Gestion des erreurs et état de chargement.
5. Style : boutons pleine largeur, arrondis (rounded-2xl), bouton principal violet #6c4ef5, boutons sociaux blancs avec bordure #e5e7eb et icônes de marque (utilise des SVG inline simples pour Google/Facebook/Apple, ou `react-icons`).
6. Après connexion réussie, redirige vers `/onboarding` si l'utilisateur n'a pas encore choisi de langue (pour l'instant, redirige simplement vers `/home`).
7. Ajoute une route `/sign-out` ou un bouton de déconnexion de test.

N'implémente que l'auth à cette étape. Utilise la variable d'environnement `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (elle est déjà définie dans `.env.local`).
```

## 🔧 Étapes manuelles

1. Crée un compte **Clerk** (https://clerk.com) et une application.
2. Copie ta **Publishable Key** dans `.env.local` :
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
3. Dans le dashboard Clerk → **User & Authentication → Social connections**, active **Google**, **Facebook** et **Apple** (Apple nécessite un Apple Developer account pour la config complète ; si tu ne l'as pas, désactive Apple côté dashboard et retire le bouton Apple).
4. Ajoute `http://localhost:3000` dans les **Allowed redirect origins** (ou laisse le défaut localhost).

> ⚠️ Sur Next.js, contrairement à Expo, la **Secret Key** n'est pas requise côté client : le middleware utilise automatiquement `CLERK_SECRET_KEY` fournie par Clerk. Assure-toi que ton `.env.local` contient aussi `CLERK_SECRET_KEY` (fournie par Clerk) si tu utilises le middleware en mode "authentification uniquement".

## 📁 Fichiers attendus

```
middleware.ts
app/(auth)/layout.tsx
app/(auth)/sign-in/page.tsx
app/(auth)/sign-up/page.tsx
components/auth/social-button.tsx   (bouton social réutilisable)
```

## ✅ Validation

- `/sign-in` et `/sign-up` s'affichent avec le design Lingua.
- L'inscription par email fonctionne, la connexion aussi.
- Google OAuth fonctionne (ouverture du popup/redirect puis retour connecté).
- Une route protégée redirige vers `/sign-in` quand on est déconnecté.
