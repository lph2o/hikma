# Étape 03 — Onboarding & Sélection de langue

## 🎯 Objectif

Créer le flux d'onboarding : une page de sélection de **langue à apprendre** (cartes avec drapeaux), qui enregistre le choix dans le store et redirige vers l'écran d'accueil. C'est aussi l'écran où on définit l'**objectif quotidien** (XP).

## 📋 Le prompt

```text
Ajoute à mon app Next.js « Lingua » le flux d'onboarding.

Contexte : Next.js 15 App Router, Tailwind v4, design system Lingua (Poppins, violet #6c4ef5), auth Clerk déjà en place. La variable `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` est configurée.

Crée :
1. La page `app/onboarding/page.tsx` (route protégée) qui est le point d'entrée après l'inscription.
2. L'écran d'onboarding contient :
   - Un titre engageant (« Quelle langue veux-tu apprendre ? »).
   - Une grille de cartes de langues (Espagnol, Français, Japonais, Allemand). Chaque carte affiche le drapeau, le nom en français et le nom natif, le nombre d'apprenants, et une couleur d'accent par langue (Espagnol #FF9500, Français #4D88FF, Japonais #FF3B30, Allemand #FFCC00).
   - Au clic sur une langue : enregistre le choix et avance vers un second écran/section « Objectif quotidien » avec des options (5, 10, 15, 20 XP par jour) sous forme de boutons sélectionnables.
   - Un bouton « Continuer » qui valide et redirige vers `/home`.
3. Utilise un store global (voir structure) pour stocker `selectedLanguage` et `dailyGoal`. Pour l'instant, crée un store Zustand simple avec persistance localStorage (fichier `store/use-language-store.ts` + `store/use-learning-store.ts`).
   - `use-language-store` : `{ selectedLanguage: string | null, setSelectedLanguage }`.
   - `use-learning-store` : `{ xpToday, dailyGoal, streak, addXP, completeLesson }` (valeurs initiales : xpToday 0, dailyGoal 20, streak 0).
4. Les drapeaux : utilise des images distantes `https://flagcdn.com/w320/{code}.png` dans un composant `next/image` (autorise le domaine flagcdn.com dans next.config).
5. Design : cartes arrondies (rounded-2xl), ombres douces, état sélectionné avec bordure violette épaisse et fond légèrement teinté.

Ne construis que l'onboarding + les deux stores à cette étape (les données de leçons viendront plus tard).
```

## 🔧 Étapes manuelles

- Aucune clé supplémentaire.
- Dans `next.config.ts`, autorise le domaine `flagcdn.com` pour `next/image` si tu l'utilises (ou utilise simplement `<img>`).

## 📁 Fichiers attendus

```
app/onboarding/page.tsx
store/use-language-store.ts
store/use-learning-store.ts
components/language-card.tsx
```

## ✅ Validation

- Après connexion, l'utilisateur est redirigé vers `/onboarding`.
- Sélectionner une langue puis un objectif fonctionne, et le bouton redirige vers `/home` (qui peut être une page vide temporaire).
- Le choix persiste après rechargement (localStorage).
