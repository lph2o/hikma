# PHASE 32A — AUDIT READ_ONLY

Statut : `READ_ONLY / DESIGN_READY`

Date : 2026-08-18

## Périmètre et garanties

Audit réalisé sans écriture de code, sans migration et sans écriture Supabase.
Les changements non commités présents dans le dépôt ont été conservés.

Les invariants pédagogiques restent hors périmètre : grading, scoring, SRS,
mastery, scheduler, interleaving, curriculum éditorial, données Quran, audio,
MASAQ et persistance de progression.

## État produit constaté

### Onboarding

- Route : `/onboarding` dans un groupe de layout séparé.
- Accès : utilisateur non connecté redirigé vers `/login`.
- Utilisateur connecté avec `user_settings.onboarded = true` redirigé vers
  `/dashboard`.
- Formulaire actuel : un écran, objectif quotidien optionnel, puis redirection
  vers `/learn/basmala`.
- Aucun nom d'affichage, objectif pédagogique, niveau de lecture arabe,
  familiarité Quran, durée, rythme ou sourate préférée n'est actuellement
  persisté.

### Stockage

`public.user_settings` contient actuellement :

```text
user_id
daily_goal_type
daily_goal_value
onboarded
created_at
updated_at
```

Le RLS existant autorise uniquement l'utilisateur courant à lire, insérer et
mettre à jour sa ligne. Une extension additive et nullable est techniquement
possible sans changer le contrat des objectifs quotidiens.

### Authentification et redirections

- Supabase Auth est utilisé côté serveur via `createClient()` et les cookies SSR.
- L'inscription et la connexion redirigent vers `/dashboard`.
- Le layout applicatif redirige uniquement les utilisateurs sans ligne
  `user_settings` vers `/onboarding`.
- La présence d'une ligne existante reste compatible avec les utilisateurs
  historiques backfillés.

### Dashboard

- Le prochain pas pédagogique reste l'action principale.
- Le dashboard utilise actuellement le contexte curriculum par défaut
  `quran-vocabulary` (Al-Fātiḥah).
- Le nom affiché n'est pas encore utilisé.
- Le catalogue `/surahs` est déjà accessible via une action secondaire.
- Les statistiques et la progression sont calculées par les couches existantes.

### Parcours d'apprentissage

- `getCurriculum()` sans filtre conserve volontairement le parcours legacy
  Al-Fātiḥah.
- `getCurriculum({ surahNumber })` et `getLearningPathBySurah()` existent.
- `/learn/[slug]` résout la leçon, ses mots, le contexte, les explications et
  les exercices à partir du slug ; aucune modification du moteur n'est requise
  pour démarrer une sourate déjà publiée.
- Les fonctions de grading, session, feedback et progression ne sont pas
  appelées par la recommandation elle-même.

### Catalogue et données réelles

Lecture Supabase contrôlée avec la clé de service, sans mutation :

| Élément | Valeur constatée |
|---|---:|
| Sourates | 114 |
| Parcours | 15 |
| Leçons publiées | 90 |
| Parcours de référence | Al-Fātiḥah |
| Parcours READY | 13 |
| Parcours exposables avec la référence | 14 |
| Al-Māʿūn | IN_PREPARATION |
| `quran_words` | 21 296 |
| `word_occurrences` | 77 430 |
| `ayahs` | 6 236 |
| `translations` | 24 944 |
| `lemmas` | 32 |
| `word_translations` | 263 |
| `lemma_translations` | 32 |
| `word_lemma_mapping` | 184 |
| `linguistic_occurrences` | 97 |
| `linguistic_segments` | 170 |

La recommandation peut donc utiliser l'état du catalogue lexical existant.
MASAQ ne doit pas entrer dans ce calcul.

## Points de branchement retenus

1. Étendre les types `UserSettings` et `types/database.ts` après validation de
   la migration.
2. Étendre `getUserSettings`, `insertUserSettings` et `updateUserSettings` avec
   une validation serveur stricte des enums et de la sourate sélectionnée.
3. Faire porter la recommandation par une fonction pure, alimentée par le
   catalogue `READY`/`REFERENCE`, avec exclusion explicite de
   `IN_PREPARATION`.
4. Faire persister le profil via l'action d'onboarding existante, sans toucher
   aux actions de grading ou de progression.
5. Alimenter le dashboard avec des textes et une suggestion de prochaine
   sourate, sans remplacer le calcul réel de progression.
6. Ajouter une édition des préférences depuis le profil.

## Risques et garde-fous

- Ne pas faire dépendre le rendu serveur de `navigator`, audio ou microphone.
- Ne pas confondre préférence de lecture arabe et difficulté d'exercice.
- Ne jamais créer de CTA pour Al-Māʿūn tant que son état reste
  `IN_PREPARATION`.
- Ne pas afficher MASAQ comme fonctionnalité ou critère utilisateur.
- Ne pas charger globalement les mots, les exercices ou les données lexicales
  pour construire une recommandation.
- Conserver la compatibilité avec les utilisateurs historiques dont les champs
  de profil seront `NULL`.

## Conclusion

L'Approche A enrichie est compatible avec l'architecture actuelle, sous réserve
d'une migration additive minimale et d'une validation humaine du design final.
La Phase 32A est prête pour la phase de conception détaillée. Aucune
implémentation ne doit commencer avant cette validation.

Statut : `PHASE_32A_AUDIT_COMPLETE_READY_FOR_DESIGN_APPROVAL`
