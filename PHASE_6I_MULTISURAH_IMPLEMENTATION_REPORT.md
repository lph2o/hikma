# Phase 6I — Rapport d’implémentation multi-sourates

## A. Bug 6I

Bug 6I non reproductible après clean rebuild et runtime production ; cause
racine non déterminée ; aucune correction spéculative appliquée. Les
vérifications de persistance et RLS ont été rejouées.

## B. Architecture

Ajouts ciblés : `learning_paths.surah_id`, sélection explicite du curriculum,
contexte de leçon rattaché à sa sourate et agrégation dérivée de maîtrise.
Le fallback implicite vers Al-Fātiḥah a été supprimé. Les mécanismes de
grading, scoring, SRS, sessions et persistance n'ont pas été réécrits.

## C. Multi-sourates

Le générateur idempotent `npm run seed:multisurah` accepte le corpus recommandé
de 15 sourates. Le dry-run a trouvé des données pour les 15 ; Al-Fātiḥah reste
le parcours éditorial existant et les 14 autres sont générables à partir des
tables Quran. Aucune écriture de ces 14 parcours n'a été effectuée.

## D. Base de données

Une seule migration a été créée et appliquée :
`supabase/migrations/0027_learning_paths_surah.sql`. Elle ajoute une FK
nullable, un index et le backfill idempotent du parcours historique.
RLS : aucune nouvelle policy nécessaire sur une table publique existante.

## E. Tests

- Vitest : **442 tests passés**, 37 fichiers.
- TypeScript : **PASS** (`npx tsc --noEmit`).
- ESLint : **PASS** (`npm run lint`).
- Build production : **PASS** (`npm run build`).
- Vérification RLS distante : **44/44 PASS**.
- Vérification persistance distante : **13/13 PASS**.
- Dry-run corpus multi-sourates : **PASS**, 15 sourates détectées.

## F. Audit pédagogique

La boucle existante et les huit compétences existantes sont conservées. La
maîtrise par sourate est une projection read-only ; les états dérivés sont
`NON_EVALUATED`, `STUDIED`, `IN_PROGRESS`, `DUE`, `MASTERED`. Une validation
humaine reste nécessaire après publication réelle des 14 parcours pour vérifier
les objectifs et la qualité pédagogique de chaque séquence.

## G. État final

`PARTIALLY_COMPLETE`

Le socle technique, la migration et les validations sont terminés. Le corpus
multi-sourates n'est pas encore publié en base : le générateur est prêt et son
dry-run est validé, mais son exécution d'écriture et l'audit pédagogique humain
du contenu généré restent à faire.

## H. Prochaine phase

Après publication et validation humaine du corpus : onboarding, évaluation
initiale, profil de compétences et première logique de recommandation.
