# Phase 7D — Color palette refinement

## Statut

`UI_UX_7D_COLOR_PALETTE_REFINEMENT_COMPLETE_READY_FOR_APPROVAL`

## Décision appliquée

Le background global officiel est désormais `#F8F3E5`. La hiérarchie claire est :

`#F8F3E5` background global → `#F5F5EA` neutre secondaire → `#EEF3E9` sauge très pâle → `#E4EEE3` sauge claire → `#D6E6D8` état actif doux → `#C3DCCF` accent doux → `#0B5552` teal lisible → `#083838` teal primaire.

## Modifications

- Ajout des tokens `hikma-bg`, `hikma-bg-neutral`, `hikma-bg-warm` et `hikma-sage-50/100/200/300`.
- `--background` pointe vers le nouvel ivoire chaud officiel.
- `--surface` utilise le sauge très pâle.
- `--surface-subtle` utilise le neutre secondaire.
- `--surface-featured` utilise le sauge clair.
- `--surface-interactive` utilise le sauge actif doux.
- Le Design System Lab présente la hiérarchie mise à jour.
- Le dark mode, les couleurs fonctionnelles et la logique métier restent inchangés.

## Validation

| Contrôle | Résultat |
| --- | --- |
| Tests | PASS — 438 tests |
| TypeScript | PASS |
| ESLint | PASS |
| Build production | PASS |
| Landing 1440×900 | PASS — fond `rgb(248, 243, 229)`, aucun overflow |
| Landing 1280×720 | PASS — aucun overflow |
| Landing 390×844 | PASS — aucun overflow |
| Landing 375×812 | PASS — aucun overflow |
| Console navigateur | PASS — aucune erreur ni alerte |
| RTL / arabe | PASS — fil Quranic Arabic conservé |

## Changements hors périmètre

`NONE`
