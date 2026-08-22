# Phase 32 — Onboarding, découverte des sourates et personnalisation

Statut : `PHASE_32C_IMPLEMENTATION_COMPLETE_READY_FOR_APPROVAL`

## BEFORE_STATE

- L’onboarding demandait principalement un objectif quotidien.
- Les préférences de découverte, de niveau de lecture et de rythme n’étaient pas persistées.
- Le dashboard reposait sur le parcours réel existant, sans couche de recommandation personnalisée.
- Le catalogue des sourates exposables était déjà dérivé de l’état réel `REFERENCE` / `READY` / `IN_PREPARATION`.

## IMPLEMENTATION_REPORT

- Ajout additif des préférences `display_name`, `learning_goal`, `arabic_reading_level`, `quran_familiarity`, `daily_duration`, `learning_pace` et `preferred_surah_number` dans `user_settings` via la migration `0029_onboarding_personalization.sql`.
- Onboarding multi-étapes avec écran de confirmation final et choix de sourate dérivé dynamiquement du catalogue réel.
- `daily_duration=30` est présenté comme « Plus de 20 min » et ne modifie jamais silencieusement `daily_goal`.
- La priorité du dashboard reste la progression réelle, puis révision, puis recommandation personnalisée.
- La recommandation refuse les sourates `IN_PREPARATION`; Al-Māʿūn 107 ne reçoit donc aucun CTA de démarrage.
- L’Aha Moment et le contexte de la première leçon existante sont conservés; aucun nouveau moteur pédagogique n’a été introduit.
- Les actions serveur valident les enums et durées, en complément des contraintes SQL.

## AFTER_STATE

Les préférences sont persistées sans toucher au grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, données Quran, MASAQ, audio backend ou progression existante. La navigation de départ utilise uniquement les sourates réellement démarrables du catalogue.

## Validations

- `npm test` — 45 fichiers, 559 tests réussis.
- `npx tsc --noEmit` — réussi.
- `npm run lint` — réussi.
- `npm run build` — réussi avec Next.js 16.3.0.
- Validation navigateur réelle — serveur production local, navigateur neuf/in-app : 1280×720, 390×844 et 375×812; aucune erreur/warning console et aucun overflow horizontal observé sur les routes contrôlées.

Les routes authentifiées ont été chargées sans session active dans l’environnement de validation; leur rendu invité a été vérifié. Un parcours connecté avec sauvegarde effective des préférences reste à valider avec une session utilisateur de test.

## Roadmap suivante

- Phase 33 : validation onboarding connecté et mesure qualitative.
- Phase 34 : enrichissement contrôlé de la découverte et des états de progression.
- Phase 35 : révision des préférences et recommandations avec données utilisateur réelles.
- Phase 36 : hardening production, accessibilité et instrumentation non pédagogique.
