# Design — architecture multi-sourates Hikma

## Périmètre

Généraliser le curriculum et l'observabilité de maîtrise sans refondre le
grading, le scoring, le SRS, la persistance, l'UI ou l'onboarding.

## Décisions

- `learning_paths.surah_id` est ajouté en nullable pour préserver les parcours
  historiques ; le parcours `quran-vocabulary` est rattaché à Al-Fātiḥah par
  backfill idempotent.
- Le catalogue est exposé par `listLearningPaths`; un curriculum peut être
  chargé par `pathId`, `surahId` ou numéro de sourate. Les écrans historiques
  gardent explicitement leur parcours Al-Fātiḥah par défaut.
- Le contexte d'une leçon n'utilise plus de fallback silencieux vers la sourate
  1. Sans rattachement explicite, le contexte coranique reste vide.
- La maîtrise par sourate est une vue dérivée des lignes existantes de
  `user_word_progress` et des huit compétences déjà supportées.
- Le corpus multi-sourates est généré de façon idempotente depuis les tables
  Quran importées ; Al-Fātiḥah conserve son seed éditorial canonique.

## Validation

Tests unitaires d'isolation et d'agrégation, dry-run du corpus, migration
Supabase, vérifications RLS/persistance, TypeScript, ESLint et build.
