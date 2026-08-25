# Étape 06 — Écran d'accueil + Layout / Navigation

## 🎯 Objectif

Créer la structure de navigation de l'app (layout avec barre d'onglets en bas) et l'**écran d'accueil** : salutation personnalisée, compteur de streak 🔥, carte « objectif du jour » avec barre de progression XP, carte « Continue learning » et le plan du jour.

## 📋 Le prompt

```text
Crée l'écran d'accueil et la navigation principale de « Lingua » (Next.js App Router + Tailwind).

Contexte : design system Lingua (violet #6c4ef5, Poppins, classes h1/body-md...), auth Clerk, stores Zustand (`use-language-store`, `use-learning-store`) et données (`data/languages.ts`, `data/units.ts`) déjà en place.

### 1. Layout de l'app (après connexion)
Crée un groupe de routes `app/(main)/` avec un `layout.tsx` qui affiche :
- Une **barre d'onglets en bas** (5 onglets) : Home, Learn, AI Teacher, Chat, Profile.
- La barre d'onglets a un indicateur animé : un cercle violet (52px) qui se déplace avec une transition `spring` sous l'onglet actif. L'icône active est blanche sur le cercle violet ; les icônes inactives sont grises (#6b7280) avec un petit label dessous.
- Utilise `usePathname()` de `next/navigation` pour déterminer l'onglet actif et des liens `next/link`.
- Icônes : utilise `react-icons` (jeu `react-icons/io5` ou `react-icons/fi` pour retrouver home/book/sparkles/chatbubbles/person).
- La barre est fixe en bas (position sticky/fixed), fond blanc, bordure supérieure #e5e7eb, ombre douce vers le haut.
- Contenu principal avec padding latéral de 20px, max-width centré (ex. `max-w-md mx-auto`) pour un rendu mobile-first agréable sur desktop.

### 2. Écran d'accueil `app/(main)/page.tsx`
Utilise `useUser()` de Clerk et les stores. Affiche :
- **Header** : drapeau de la langue sélectionnée (image ronde 34px), texte « {Salutation}, {Prénom} ! 👋 » où la salutation dépend de la langue (es→Hola, fr→Bonjour, ja→こんにちは, de→Hallo, sinon Hello). À droite : icône flamme 🔥 + nombre de streak en orange #ff8a00, une icône cloche (notifications), et une icône de déconnexion (appelle `signOut` de `useAuth`).
- **Carte « Daily goal »** : fond #FFF5E8, arrondie 20px. Affiche « Daily goal », le gros nombre `xpToday` (bold 28px) suivi de ` / {dailyGoal} XP`, une barre de progression (fond #e5e7eb, remplissage orange #ff8a00, largeur = `xpToday/dailyGoal` plafonnée à 100%), et une illustration de trésor à droite (utilise un emoji 🎁 ou une image).
- **Carte « Continue learning »** : fond violet #6c4ef5, hauteur 160px, arrondie 20px. À gauche : label « Continue learning » (blanc 75%), le nom de la langue en bold 22px blanc, « A1 · Unit {n} ». Un bouton blanc « Continue » (texte violet) qui redirige vers la première leçon de l'unité courante (`/lesson/{lessonId}`). À droite une image d'illustration (palais/paysage).
- **Section « Today's plan »** : titre à gauche, lien « View all » (bleu #4d88ff) à droite. Une carte blanche avec 3 lignes séparées par des filets :
  1. « Lesson — At the café » (icône book, fond #EDE9FE, icône violette) → terminé (coche bleue).
  2. « AI Conversation — Talk about your day » (icône headset, fond #EDE9FE) → non terminé.
  3. « New words — 10 words » (icône chatbubble, fond #FEE2E2, icône rouge #EF4444) → non terminé.
  - Les lignes non terminées ont un cercle vide bordé #e5e7eb ; les terminées un cercle bleu avec coche blanche.

Reste fidèle au design mobile Duolingo : coins arrondis, ombres très légères, hiérarchie claire. Ne code que le layout + l'accueil ici (les autres onglets seront des pages placeholder).
```

## 🔧 Étapes manuelles

- Aucune clé supplémentaire.
- Place les illustrations (trésor, palais) comme assets locaux dans `public/images/` ou utilise des emojis/placeholders temporaires.

## 📁 Fichiers attendus

```
app/(main)/layout.tsx
app/(main)/page.tsx          (accueil)
app/(main)/learn/page.tsx    (placeholder)
app/(main)/ai-teacher/page.tsx (placeholder)
app/(main)/chat/page.tsx     (placeholder)
app/(main)/profile/page.tsx  (placeholder)
components/bottom-tab-bar.tsx
```

## ✅ Validation

- La navigation par onglets fonctionne, l'indicateur animé suit l'onglet actif.
- L'accueil affiche la salutation selon la langue, le streak, la barre XP et les cartes.
- Le bouton « Continue » mène à `/lesson/{premier-lesson-id}` (page placeholder pour l'instant).
