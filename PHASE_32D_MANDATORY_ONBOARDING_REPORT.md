# PHASE 32D — Mandatory Onboarding Implementation Report

## Statut

`PHASE_32D_MANDATORY_ONBOARDING_COMPLETE`

## BEFORE_STATE

- `/onboarding` était accessible sans garde d’authentification.
- Le layout applicatif vérifiait seulement l’existence de `user_settings`.
- Les actions signup/signin redirigeaient directement vers `/dashboard`.
- Un utilisateur historique avec `onboarded=true` mais sans préférences Phase 32 pouvait contourner le nouveau parcours.
- Un bouton global « Passer l’onboarding » était présent.

## IMPLEMENTATION_REPORT

- Ajout de `CURRENT_ONBOARDING_VERSION = 2` et d’un prédicat partagé `isOnboardingComplete`.
- Migration additive `0030_mandatory_onboarding_version.sql` appliquée : les données historiques reçoivent la version 1 et doivent donc compléter la version 2.
- Garde serveur ajoutée à `/onboarding`, au layout authentifié et à la page login.
- Signup et signin redirigent vers `/onboarding` tant que la version courante n’est pas terminée.
- Le skip global a été supprimé ; les skips individuels de questions sont conservés.
- La recommandation et le catalogue dynamique de Phase 32B sont conservés.
- La confirmation finale reste dynamique et mène à la première leçon existante après une célébration courte, avec respect de `prefers-reduced-motion`.
- Aucun changement apporté au grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, progression, données Quran, traductions, audio, MASAQ ou LessonPlayer.

## AFTER_STATE

- Un utilisateur historique authentifié est effectivement forcé vers `/onboarding`.
- Après validation, `onboarding_version=2` permet l’accès aux routes applicatives.
- La séquence réelle a atteint `/learn/surah-103-ayah-1` après confirmation et célébration.
- À 390×844, 375×812 et 1280×720, les routes contrôlées n’ont pas d’overflow horizontal.
- Le texte arabe de la première leçon est visible sur le petit mobile.
- La console navigateur ne contient aucune erreur ni avertissement durant la validation.
- Après déconnexion réelle, `/onboarding` redirige vers `/login`.

## VALIDATIONS

| Validation | Résultat |
|---|---|
| `npm test` | PASS — 45 fichiers, 561 tests |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — Next.js 16.3.0 |
| Migration 0030 | PASS — appliquée |
| Browser 390×844 | PASS |
| Browser 375×812 | PASS |
| Browser 1280×720 | PASS |
| Console / hydratation | PASS — 0 erreur, 0 avertissement |
| Nettoyage utilisateur temporaire | PASS — suppression HTTP 200, vérification HTTP 404 |

Les matrices détaillées sont dans `tmp/phase32d/`. Les JSON ont été validés avec `jq`.

## Limite explicitement documentée

L’environnement navigateur disponible ne permettait pas de créer un contexte isolé sans session. Le contrôle visiteur a donc été réalisé après une vraie déconnexion dans le même contexte navigateur, puis vérifié sur `/onboarding → /login`. Aucun test n’est déclaré pour un contexte privé séparé.

## Invariants protégés

Les contrats métier existants et les moteurs pédagogiques hors onboarding n’ont pas été modifiés. La migration est additive et la confirmation déclenche uniquement la route de première leçon déjà existante.
