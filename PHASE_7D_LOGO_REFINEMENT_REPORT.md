# Phase 7D — Logo desktop refinement

## Statut

`UI_UX_7D_LOGO_REFINEMENT_COMPLETE_READY_FOR_APPROVAL`

## Ajustement

- Avant : `md = 84px` dans `HikmaLogo`.
- Après : source `md = 104px`, affichée à `88px` sur tablette et `104px` à partir de `lg` dans la navigation applicative.
- Le lien de marque passe de `py-4` à `py-3` afin de limiter l’augmentation de hauteur du header.
- Landing : inchangée à `sm = 64px`.
- Login et Design System Lab : inchangés.
- Fichier officiel `public/logo/logo_hikma.png` conservé, sans recadrage, recoloration ni déformation.

## Fichiers modifiés

- `components/ui/hikma-logo.tsx`
- `components/app/app-nav.tsx`
- `tests/brand-system-contract.test.ts`
- `PHASE_7D_BACKGROUND_REFINEMENT_REPORT.md` — complément de documentation

## Validation

| Contrôle | Résultat |
| --- | --- |
| `npm test` | PASS — 438 tests |
| TypeScript | PASS |
| ESLint | PASS |
| Build production | PASS |
| Navigation 1440×900 | PASS — logo 104×104, header link 128px |
| Navigation 1280×720 | PASS — logo 104×104, header link 128px |
| Mobile 390×844 | PASS — logo landing 64×64 |
| Mobile 375×812 | PASS — navigation latérale masquée, aucun overflow |
| Console | PASS — aucune erreur ni alerte |
| RTL / arabe | PASS — RTL local conservé |
| Overflow | PASS — aucun overflow horizontal |

## Changements hors périmètre

`NONE`
