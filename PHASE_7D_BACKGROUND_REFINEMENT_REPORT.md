# Phase 7D — Background refinement de la landing

## Statut

`UI_UX_7D_BACKGROUND_REFINEMENT_COMPLETE_READY_FOR_APPROVAL`

## Avant

La landing reposait principalement sur l’ivoire uniforme de `--background`. La carte pédagogique utilisait déjà une surface élevée, mais la différence avec l’environnement restait trop douce et l’ensemble manquait de profondeur éditoriale.

## Après

- Le fond de la landing conserve `--hikma-ivory` comme base.
- Deux atmosphères radiales très faibles, dérivées de `--hikma-teal-800` et `--hikma-gold`, créent une variation presque imperceptible.
- Les gradients sont portés par un pseudo-élément pleine largeur du shell landing uniquement ; ils ne modifient ni la composition ni les autres pages.
- La carte de démonstration utilise une bordure teal très discrète et une ombre large/diffuse dérivée du charbon.
- Les éléments décoratifs existants n’ont pas été multipliés ni supprimés.
- Aucun changement de contenu, typographie, positionnement, CTA, navigation ou logique métier.

## Tokens utilisés

`--hikma-ivory`, `--hikma-teal-800`, `--hikma-teal-700`, `--hikma-gold`, `--hikma-charcoal`, `--border-subtle`.

## Composants modifiés

- `components/app/landing.tsx` — ajout du hook de style `landing-shell`.
- `components/app/landing-product-preview.tsx` — ajout du hook de style de la carte principale.
- `app/globals.css` — atmosphère et profondeur landing, sans nouveau token de marque.
- `tests/landing-contract.test.ts` — contrat de non-régression du background.

## Validation

| Contrôle | Résultat |
| --- | --- |
| Tests | PASS — 437 tests |
| TypeScript | PASS |
| ESLint | PASS |
| Build production | PASS |
| Desktop 1440×900 | PASS |
| Desktop 1280×720 | PASS |
| Mobile 390×844 | PASS |
| Mobile 375×812 | PASS |
| RTL / arabe | PASS — fil Quranic Arabic conservé |
| Console | PASS — aucune erreur relevée |
| Overflow horizontal | PASS — aucun constaté |

## Changements hors périmètre

`NONE`

## Logo refinement — complément

La navigation applicative utilise désormais le logo à `88px` entre `md` et `lg`, puis `104px` à partir de `lg` (contre `84px` auparavant). Le padding vertical du lien de marque passe de `py-4` à `py-3` pour limiter l’augmentation de hauteur du header. Les tailles de la landing (`sm`), du login et du laboratoire (`lg`) restent inchangées.
