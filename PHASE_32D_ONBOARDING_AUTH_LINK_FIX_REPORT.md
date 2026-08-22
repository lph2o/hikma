# Phase 32D — Onboarding auth-link fix

## Statut

`PHASE_32D_ONBOARDING_AUTH_LINK_FIX_COMPLETE`

## Correction

- Suppression du footer « Déjà un compte ? Se connecter » de `/onboarding`.
- Suppression de l’import `Link` devenu inutile.
- Réduction de la redondance entre l’introduction de la page et l’étape « Bienvenue sur Hikma 👋 ».
- La garde serveur `/onboarding → /login` pour les visiteurs reste active.

## Validation navigateur

- Session authentifiée : `/login → /onboarding`.
- Onboarding authentifié : aucun lien « Se connecter » détecté.
- `/dashboard`, `/surahs`, `/learn/...` et `/profile` avant completion : redirection vers `/onboarding`.
- Le texte d’introduction et le bouton « Commencer » sont présents.
- Validation effectuée en production à `1280×720`, sans overflow horizontal.
- Console : aucune erreur constatée pendant le parcours.

## Validations techniques

- `npm test` : PASS — 561 tests.
- `npx tsc --noEmit` : PASS.
- `npm run lint` : PASS.
- `npm run build` : PASS.
- Utilisateur temporaire de QA supprimé et vérifié : HTTP 200 puis HTTP 404.

Le grading, scoring, SRS, mastery, scheduler, curriculum, données Quran et backend n’ont pas été modifiés.
