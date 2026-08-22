# Phase 32E — Rapport diagnostic et clôture post-onboarding

## Statut

`PHASE_32E_POST_ONBOARDING_BUG_FIXED`

## BEFORE_STATE

Le cas de reproduction était un utilisateur historique avec `onboarded=true`, `onboarding_version=1` et des préférences Phase 32 nulles. Une fixture dédiée a été utilisée uniquement pour reproduire le parcours, puis vérifiée absente après le test. Aucun changement de schéma, de données métier ou de moteur pédagogique n'a été effectué.

## Diagnostic établi

Le parcours complet a été exécuté en runtime production contrôlé : connexion, onboarding v2, choix d'Al-'Asr, confirmation et navigation vers `/learn/surah-103-ayah-1`. La leçon « Verset 1 » et le texte `وَٱلْعَصْرِ` se rendent correctement. La route directe `/learn/basmala` a également été validée dans la reproduction.

La chaîne vérifiée est cohérente : `firstLessonSlug` produit `surah-103-ayah-1`, le chemin est `quran-surah-103`, et la ligne de leçon correspondante existe avec le statut `published`. Aucune exception serveur, erreur React, erreur d'hydratation ou erreur console n'a été observée.

La cause exacte de l'incident historique initial reste inconnue : le message « Oups » ne se reproduit pas et aucune stack trace exploitable n'est disponible. Il serait incorrect d'attribuer une causalité non démontrée.

## IMPLEMENTATION_REPORT

Il n'y a eu **aucune modification de code source dans Phase 32E**. La correction déjà présente dans l'état courant est conservée ; une nouvelle modification aurait risqué de masquer ou de déplacer le problème sans preuve.

La fixture historique a été supprimée ou, au contrôle final, n'existait plus : recherche admin `404` et requête `user_settings` vide. Les comptes de référence restent inchangés.

## AFTER_STATE

Le cas historique contrôlé atteint désormais sa première leçon sans erreur. La résolution `/learn/basmala` et `/learn/surah-103-ayah-1` reste fonctionnelle. Aucun changement n'a touché grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, Quran, audio, MASAQ, Supabase ou migrations.

## Invariants live

| Élément | Valeur | Résultat |
|---|---:|---|
| quran_words | 21 296 | PASS |
| word_occurrences | 77 430 | PASS |
| ayahs | 6 236 | PASS |
| translations | 24 944 | PASS |
| word_translations | 263 | PASS |
| lemma_translations | 32 | PASS |
| linguistic_occurrences | 97 | PASS |
| linguistic_segments | 170 | PASS |
| leçons publiées | 90 | PASS |
| sourates READY | 14 | PASS |
| Al-Māʿūn 107 | IN_PREPARATION | PASS |
| MASAQ | 97 / 170 | PASS |
| Al-Fātiḥah | FATIHAH_REFERENCE_LOCKED | PASS |

## Validations

- `npm test` — PASS, 45 fichiers, 561 tests.
- `npx tsc --noEmit` — PASS.
- `npm run lint` — PASS, 0 erreur et 1 warning non bloquant (`Caption` inutilisé dans `app/(onboarding)/onboarding/page.tsx:3`).
- `npm run build` — PASS, build Next.js production terminé.
- Navigateur réel — PASS sur `/learn/surah-103-ayah-1` à `1280×720`, `390×844` et `375×812` ; leçon et arabe visibles, `scrollWidth` égal à la largeur viewport, aucune erreur console/warning.
- Redirection visiteur `/onboarding` — couverte par la validation Phase 32D existante ; non rejouée dans le profil authentifié de cette fixture afin de ne pas modifier la session utilisateur de reproduction.

## Artifacts

- [validation-matrix.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase32e/validation-matrix.json)
- [exercise-interaction-matrix.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase32e/exercise-interaction-matrix.json)
- [runtime-status.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase32e/runtime-status.json)
- [diagnosis.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase32e/diagnosis.json)

Les quatre JSON sont validés avec `jq`.
