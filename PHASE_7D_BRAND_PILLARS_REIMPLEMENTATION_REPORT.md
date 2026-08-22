# Phase 7D — Teal + gold brand pillars

## Statut

`UI_UX_7D_BRAND_PILLARS_COMPLETE_READY_FOR_APPROVAL`

## Décision

La dominance sauge est retirée. Hikma revient à son identité logo : teal profond pour la structure, doré pour la valeur et la distinction, ivoire et blanc chaud pour l’environnement.

## Palette appliquée

`#083838` primary, `#0B5552` readable/interactive, `#002828` deep, `#C8A058` gold principal, `#B89050` gold muted, `#F0D090` gold bright, `#F8F8F0` background, `#FFFDF8` surface, `#F1F6F3` soft teal surface, `#182028` charcoal et `#102020` dark background.

Le doré reste réservé à la progression, aux récompenses, niveaux, badges, highlights et accents premium. Les couleurs `success`, `error`, `warning` et `info` conservent leur sémantique fonctionnelle.

## Modifications

- Suppression des tokens sauge comme palette identitaire dominante.
- Restauration de l’ivoire officiel et du blanc chaud.
- Conservation du teal doux uniquement comme surface secondaire.
- Progression `HikmaProgress` accentuée en doré, sans remplacer les couleurs fonctionnelles.
- Mise à jour du Design System Lab et de la documentation couleur.
- Dark mode conservé dans la même famille teal/charcoal avec accents dorés disponibles.

## Validation

| Contrôle | Résultat |
| --- | --- |
| Tests | PASS — 439 tests |
| TypeScript | PASS |
| ESLint | PASS |
| Build production | PASS |
| Landing 1440×900 | PASS — background `rgb(248, 248, 240)`, progression dorée |
| Landing 1280×720 | PASS — aucun overflow |
| Landing 390×844 | PASS — aucun overflow |
| Landing 375×812 | PASS — aucun overflow |
| Console navigateur | PASS — aucune erreur ni alerte |
| RTL / arabe | PASS — `ٱلرَّحْمَـٰنِ` et blocs RTL conservés |

Le remplissage de `HikmaProgress` est rendu en `#C8A058`. Les états correct, incorrect, warning et info restent portés par leurs couleurs fonctionnelles dédiées.
