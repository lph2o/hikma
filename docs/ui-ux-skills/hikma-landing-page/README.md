# Hikma landing page

## Direction

La landing publique suit la direction **The Quranic Editorial Studio** : une entrée éditoriale chaleureuse qui montre le produit avant de le décrire.

## Principes appliqués

- Un hero produit-first : promesse courte à gauche, aperçu de leçon à droite sur desktop, puis empilé dans l'ordre mobile `titre → texte → CTA → aperçu`.
- Une boucle explicite `VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → FEEDBACK`.
- L'arabe est rendu par `ArabicText`, localement en RTL, avec ses diacritiques préservées.
- Les surfaces utilisent les tokens warm Hikma existants ; aucun gradient, chiffre de preuve ou témoignage inventé.
- Les CTA utilisent les routes existantes, notamment `/learn/basmala` et `/login`.
- L'aperçu de leçon reste statique : il illustre les primitives et ne duplique pas le moteur d'exercices.

## Product storytelling — Phase 7B

La landing utilise un fil rouge statique autour de `ٱلرَّحْمَـٰنِ`. Le visiteur suit le même mot de la forme arabe au sens, au contexte coranique, à l’écoute disponible dans la leçon, à l’effort de rappel et au feedback post-réponse.

- Le problème est présenté brièvement : reconnaître ou réciter n’implique pas toujours comprendre chaque mot.
- La boucle `VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → FEEDBACK` est montrée par fragments d’interface, pas seulement par cinq cartes génériques.
- Le contexte sépare toujours `Texte coranique`, `Traduction` et `Référence`.
- L’exercice de landing est une scène de démonstration, étiquetée comme telle ; il ne déclenche aucune logique de grading.
- L’erreur utile réutilise `ExerciseFeedback` et `HikmaExplanation` avec une explication indisponible explicitement annoncée plutôt qu’inventée.
- Le parcours expose les états `terminée`, `en cours`, `prochaine` et `verrouillée` comme démonstration, sans métrique personnelle ni placement automatique.
- L’audio est présenté comme disponible dans la leçon réelle ; aucune URL audio signée n’est inventée sur la landing publique.

## Composants de storytelling

- `components/app/landing.tsx` : composition publique, hero, CTA, footer.
- `components/app/landing-product-preview.tsx` : scène produit initiale.
- `components/app/landing-product-story.tsx` : sections problème, mot, méthode, contexte, audio, exercice, feedback, parcours et audiences.
- Primitives réutilisées : `ArabicText`, `HikmaProgress`, `HikmaExerciseShell`, `ExerciseFeedback`, `HikmaExplanation`, `AnswerOption`, `Card` et `Button`.

Les scènes sont indépendantes des données utilisateur réelles. Elles ne modifient pas le curriculum, les générateurs, le grading, le scoring, le SRS, la maîtrise, la persistance, Supabase ou l’audio backend.

## Composition

La page est composée par `components/app/landing.tsx`. L’aperçu produit isolé vit dans `components/app/landing-product-preview.tsx`. Les scènes de storytelling vivent dans `components/app/landing-product-story.tsx`. Le laboratoire correspondant est documenté dans `app/design-system/page.tsx` sous `Landing / Product Storytelling`.

## Vérification

Valider la hiérarchie, l’absence d’overflow, le fil rouge du mot, la séparation arabe/traduction, les scènes feedback et la visibilité du CTA aux largeurs 1440×900, 1280×720, 390×844 et 375×812. Les validations de Phase 7A sont consignées dans `PHASE_7A_LANDING_HERO_IMPLEMENTATION_REPORT.md`; celles de Phase 7B dans `PHASE_7B_LANDING_PRODUCT_STORY_IMPLEMENTATION_REPORT.md`.
