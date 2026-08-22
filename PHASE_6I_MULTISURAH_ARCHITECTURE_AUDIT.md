# Phase 6I — Audit architecture multi-sourates

## 6I

Le bug historique 6I n'est plus reproductible après clean rebuild et runtime
production contrôlé. Sa cause racine exacte n'a pas été déterminée. Aucune
correction spéculative n'a été appliquée ; les tests de non-régression et les
vérifications RLS/persistance existants ont été conservés.

## Dépendances Al-Fātiḥah trouvées

- `getWordAyahContexts` avait `surahNumber = 1` comme fallback silencieux.
- `getCurriculum` chargeait arbitrairement un seul parcours via `limit(1)`.
- `seed-curriculum.ts` est volontairement le seed éditorial de référence
  Al-Fātiḥah et ne doit pas être dupliqué.
- Les exercices, le grading, le SRS et les tables de progression utilisent des
  identifiants de mots et `user_id + word_id`; aucune constante structurelle de
  taille de sourate n'a été trouvée dans leur moteur.

## Modèle retenu

Une migration ciblée ajoute `learning_paths.surah_id`, avec une FK vers
`surahs(id)`, un index et un backfill idempotent du parcours historique.
Les données existantes restent compatibles et les politiques RLS existantes de
`learning_paths` couvrent cette colonne publique.

## Extension

Le catalogue est listable sans ordre obligatoire. Le générateur
`seed:multisurah` couvre le corpus de validation recommandé à partir des
occurrences Quran existantes, sans créer de texte, traduction ou sens.

## Limites connues

Le générateur multi-sourates doit être exécuté explicitement pour publier les
14 parcours supplémentaires ; le dry-run a été validé, mais aucune écriture de
ces parcours n'a été effectuée dans cette phase. L'onboarding et la
recommandation restent hors périmètre.
