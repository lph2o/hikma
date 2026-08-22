# Phase 7A — Landing Page Premium Hero & Product-First Visual Direction

## Statut

`UI_UX_7A_LANDING_HERO_COMPLETE_READY_FOR_APPROVAL`

## BEFORE_STATE

L’audit Phase 7 identifiait une landing publique trop centrée et générique pour présenter le produit, avec une preuve d’interface limitée, une hiérarchie d’action peu éditorialisée et une incohérence entre le libellé Al-Fatiha et la route réellement disponible (`/learn/basmala`). La composition ne rendait pas suffisamment visible la boucle pédagogique Hikma ni la continuité vers le produit.

## IMPLEMENTATION_REPORT

### Landing et hero

- Recomposition de `/` selon la direction A, « The Quranic Editorial Studio ».
- Hero asymétrique : promesse et CTA à gauche, aperçu produit à droite sur desktop ; empilement lisible sur mobile.
- H1 unique et sémantique : « Chaque mot compris ouvre un peu plus le verset. »
- CTA principal réel vers `/learn/basmala`, sans route inventée.
- CTA secondaire vers la boucle d’expérience.
- Header simplifié, sans duplication visuelle de mascotte.

### Preuve produit et architecture de page

- Ajout d’un aperçu statique de leçon dans `LandingProductPreview`, avec progression, arabe vocalisé, translittération, sens, audio contextuel, exercice et feedback Hikma.
- Ajout des sections VOIR → COMPRENDRE → SE RAPPELER → PRODUIRE → FEEDBACK.
- Ajout des sections mot/contexte, parcours, capacités produit, audiences, CTA final et footer.
- Aucun chiffre, témoignage ou résultat inventé.
- Les associations `aria-labelledby` des sections sont maintenant reliées à leurs titres visibles.

### Design system et documentation

- Ajout de la section Design System Lab `Landing Page / Editorial Studio`.
- Documentation ajoutée dans `docs/ui-ux-skills/hikma-landing-page/README.md` et référencée depuis l’index des skills UI/UX.
- Réutilisation des primitives Hikma existantes, de la palette warm, de Poppins/Amiri, de `ArabicText`, `HikmaProgress`, `HikmaFeedback`, `Button` et `Card`.
- Aucun gradient, blob décoratif ou texte coranique utilisé comme fond.

## Contraintes de non-régression

La Phase 7A n’a modifié ni grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, générateurs, persistance, Supabase, migrations, données Quran, audio backend ni logique métier d’authentification. L’aperçu produit est une composition statique de présentation et ne duplique pas le moteur d’apprentissage.

La landing reste un composant serveur déterministe : aucun accès à `window`, `navigator`, `MediaDevices` ou autre état dépendant du navigateur n’est effectué pendant le rendu.

## AFTER_STATE

La landing présente désormais Hikma comme une expérience d’apprentissage concrète, calme et éditorialisée. Le premier pas est explicite, la route est réelle, la preuve produit est visible immédiatement et la structure pédagogique est compréhensible avant l’entrée dans l’application. Le CTA principal reste visible dans les quatre formats testés.

## VALIDATIONS

| Validation | Résultat |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS — 34 fichiers, 428 tests |
| `npm run build` | PASS — Next.js 16.3.0, génération statique réussie |
| Runtime production `next start --port 3010` | PASS |
| Browser 1440×900 | PASS — CTA dans le viewport, pas d’overflow, arabe présent, footer présent |
| Browser 1280×720 | PASS — CTA dans le viewport, pas d’overflow, arabe présent, footer présent |
| Browser 390×844 | PASS — CTA dans le viewport, pas d’overflow, arabe présent, footer présent |
| Browser 375×812 | PASS — CTA dans le viewport, pas d’overflow, arabe présent, footer présent |
| Console browser | PASS — aucune erreur ni warning relevé |
| Reset/finalisation navigateur | PASS — viewport réinitialisé, onglet fermé |

Mesures navigateur finales : largeur de document identique à la largeur du viewport sur les quatre formats ; CTA `/learn/basmala` rendu entre `top 523–613px` et `bottom 571–661px` selon le format ; trois éléments arabes rendus (`lang="ar"`).

## Éléments non validés

Aucun élément requis de cette phase ne reste en attente. La validation a été effectuée sur un runtime de production local propre avec navigateur neuf. Les parcours authentifiés et les comportements métier internes restent hors périmètre de cette landing et n’ont pas été modifiés par cette phase.
