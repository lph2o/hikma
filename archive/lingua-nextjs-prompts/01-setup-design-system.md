# Étape 01 — Init Next.js + Design System

## 🎯 Objectif

Créer un projet Next.js (App Router) avec TypeScript et Tailwind CSS v4, puis installer le **design system « Lingua »** : police **Poppins**, palette de couleurs et classes typographiques utilitaires. C'est la fondation visuelle de toute l'app.

## 📋 Le prompt

```text
Crée une application Next.js 15 (App Router) avec TypeScript et Tailwind CSS v4, qui va devenir un clone web de Duolingo appelé « Lingua » (apprentissage de langues avec prof IA).

À cette étape, uniquement la fondation visuelle :

1. Initialise un projet Next.js avec TypeScript, App Router, et Tailwind CSS (déjà configuré par create-next-app).
2. Configure Tailwind pour exposer un design system "Lingua" dans globals.css en utilisant la directive `@theme` (Tailwind v4) :
   - Couleurs primaires : `lingua-purple: #6c4ef5`, `lingua-deep-purple: #5b3bf6`, `lingua-blue: #4d88ff`, `lingua-green: #21c16b`
   - Couleurs sémantiques : `success: #21c16b`, `warning: #ffcb00`, `streak: #ff8a00`, `error: #ff4d4f`, `info: #4d88ff`
   - Neutres : `text-primary: #001328`, `text-secondary: #6b7280`, `border: #e5e7eb`, `surface: #f6f7fb`, `background: #ffffff`
   - Police : `Poppins` (Regular 400, Medium 500, SemiBold 600, Bold 700)
3. Charge la police Poppins via `next/font/google` dans le layout racine et expose-la comme variable CSS `--font-poppins`.
4. Ajoute des classes utilitaires typographiques réutilisables (en pur CSS dans globals.css, méthode BEM) : `h1` (32px bold), `h2` (24px semibold), `h3` (20px semibold), `h4` (16px medium), `body-lg` (16px), `body-md` (14px), `body-sm` (13px), `caption` (11px, gris #6b7280).
5. Crée une page d'accueil temporaire simple qui affiche le titre « Lingua » en `h1`, un sous-titre en `body-md`, et un petit échantillon de chaque couleur primaire (carrés colorés) pour vérifier le design system.
6. Ajoute un fichier `lib/cn.ts` avec une petite fonction `cn()` (utilitaire clsx + tailwind-merge) pour composer des classes conditionnellement, et installe `clsx` et `tailwind-merge`.

Respecte ce style de design :
- Couleurs vives et ludiques, dominante violet #6c4ef5.
- Coins arrondis généreux (rounded-2xl / rounded-3xl).
- Ombres douces.
- Interface claire, aérée, mobile-first mais responsive.

Ne construis AUCUNE autre fonctionnalité pour l'instant. Juste le squelette + le design system + la page de vérification.
```

## 🔧 Étapes manuelles

- Aucune clé API requise à cette étape.
- Vérifie que la police **Poppins** est bien importée (pas de fallback système).

## 📁 Fichiers attendus

```
lib/cn.ts
app/globals.css          (design system @theme + utilitaires typographiques)
app/layout.tsx           (font Poppins, metadata)
app/page.tsx             (page temporaire de vérification)
```

## ✅ Validation

```bash
npm run dev
```

- La page affiche « Lingua » en Poppins bold 32px.
- Les couleurs (violet, bleu, vert, orange, etc.) s'affichent correctement.
- `npm run build` passe sans erreur.
