# Étape 07 — Onglet Learn (leçons de l'unité)

## 🎯 Objectif

Créer l'onglet **Learn** : il affiche l'unité de la langue sélectionnée avec un **en-tête** (retour, titre, marque-page), une **image héro** (palais + mascotte), des onglets **Lessons / Practice**, et la liste des **leçons** avec leur état (terminée / en cours / verrouillée).

> ℹ️ Dans l'app d'origine, l'onglet Learn montre directement les leçons de **la première unité** de la langue choisie (pas d'écran « liste d'unités » séparé). On reste fidèle à ce comportement.

## 📋 Le prompt

```text
Crée l'onglet « Learn » de « Lingua » (Next.js + Tailwind).

Contexte : design system Lingua, stores Zustand (`use-language-store`, `use-learning-store`), données `data/units.ts` + `data/lessons.ts` et les helpers (`getLessonsByUnit`, `getLessonById`) déjà en place. La barre d'onglets existe.

### Écran `app/(main)/learn/page.tsx` (client component)
- Récupère `selectedLanguage` et `completedLessonIds`.
- Trouve l'unité : `UNITS.find(u => u.languageCode === selectedLanguage)`.
- S'il n'y a pas de langue/unité : état vide centré « No language selected — Go to the home screen and pick a language to start learning. ».

Sinon :
- **Header** : bouton retour (chevron → `/`), titre de l'unité centré (ex. « Greetings & Basics »), icône marque-page à droite.
- Sous le header : « Unit {order} · {completed}/{total} lessons » en `caption` centré.
- **Section héro** : conteneur 180px de haut, arrondi 20px, avec une image de fond (palais/paysage, `next/image` ou `<img>`) et une mascotte (image) positionnée en bas à droite (110px).
- **Onglets** : une barre avec deux onglets « Lessons » (actif, bordure basse violette #6c4ef5, texte violet) et « Practice » (gris). Pour l'instant « Practice » est inactif/placeholder.
- **Liste de leçons** : pour chaque leçon de l'unité (via `unit.lessonIds`), affiche une `LessonCard` (composant réutilisable `components/lesson-card.tsx`) :
  - `isCompleted` : id présent dans `completedLessonIds` (coche verte à droite).
  - `isInProgress` : première leçon non terminée (fond #EDE9FE, bordure #C4B5FD, badge violet « In progress », miniature `https://picsum.photos/seed/{lessonId}/160/100` à droite).
  - Sinon : état normal (blanc, cliquable si c'est la leçon en cours ou déjà terminée ; sinon verrouillée/grisée).
  - Chaque carte : « Lesson {index+1} », le titre (semibold), « {n} activités · {xp} XP » en caption.
- Cliquer navigue vers `/lesson/{lessonId}`.

### Composant `components/lesson-card.tsx`
Props : `lesson`, `index`, `isCompleted`, `isInProgress`, `onPress`. Carte blanche arrondie 16px, padding 16px, bordure #e5e7eb, ombre très légère. États visuels comme décrits ci-dessus.

Design fidèle : hiérarchie claire, coins arrondis, ombres douces, palette Lingua.
```

## 🔧 Étapes manuelles

- Place l'image héro et la mascotte dans `public/images/` (ou utilise des placeholders `https://picsum.photos/seed/{...}`).
- Aucune clé API requise.

## 📁 Fichiers attendus

```
app/(main)/learn/page.tsx
components/lesson-card.tsx
```

## ✅ Validation

- L'onglet Learn affiche l'unité de la langue sélectionnée (titre, compteur, héro, onglets).
- Les leçons ont le bon état (terminée / en cours / verrouillée).
- Cliquer sur une leçon accessible mène à `/lesson/{id}`.
