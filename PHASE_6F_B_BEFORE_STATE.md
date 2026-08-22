# PHASE 6F-B — Before State

## Mode

`READ_ONLY` — cet état a été établi avant toute modification de composant, page, token, CSS métier, moteur pédagogique ou donnée.

## Flux réel confirmé

```text
/learn
  → /learn/[slug]
  → page serveur (données, contexte, audio, exercices)
  → LessonPlayer
  → LessonDiscovery
  → HikmaExerciseShell
  → ExerciseCard / interaction spécialisée
  → ExerciseFeedback
  → exercice suivant
  → LessonComplete
```

Le shell applicatif rend `AppNav` et `AppHeader` autour des routes. Sur mobile, `AppNav` reste fixe en bas, y compris pendant la leçon.

## Architecture actuelle

- `app/(app)/learn/[slug]/page.tsx` prépare la leçon, le contexte coranique, l’audio, la découverte, la prononciation guidée et la séquence d’exercices.
- La séquence 6E-B est intercalée côté présentation avant l’attachement des identités UI 6D-B.
- `LessonPlayer` orchestre découverte, exercice, feedback, sauvegarde, reprise, sortie et fin de leçon.
- `LessonDiscovery` affiche le mot, la translittération, l’audio, le sens révélé, la prononciation guidée et la navigation précédent/suivant.
- `HikmaExerciseShell` fournit le cadre commun de progression, compétence, contenu, feedback et CTA.
- `ExerciseCard` distribue les types ; `OptionsExercise` gère les options et leur ordre visuel stable.
- `ExerciseFeedback` distingue correct, incorrect et ambigu ; en cas d’erreur, la réponse brute précède la réponse attendue.
- `AudioPlayer` couvre idle, loading, playing, paused, ended et error/retry.
- `ArabicText` protège `dir=rtl`, `lang=ar`, Amiri, diacritiques, line-height et absence de letter-spacing.
- `LessonComplete` affiche statistiques réelles, leçon suivante, révision et retour au parcours.

## Problèmes confirmés par le code et le navigateur

1. À `1280×720`, la fiche leçon présente titre, métadonnées, objectif et contexte de verset avant que la découverte n’atteigne le premier viewport.
2. À `390×844`, la navigation globale fixe reste présente pendant la session de leçon et concurrence le focus pédagogique.
3. La découverte affiche le mot courant puis un bloc de prononciation guidée qui réaffiche un mot arabe séparé ; la fonction existe mais ne semble pas appartenir au même stage.
4. Le contexte coranique est toujours en flux principal avant la découverte ; il n’est pas secondaire/repliable.
5. Les états de feedback sont fonctionnellement corrects et séparés, mais leur rendu reste proche d’une alerte générique.
6. La couverture navigateur des états authentifiés, microphone, `NO_SIGNAL`, `REVIEW_REQUIRED`, réseau et fin de leçon reste incomplète.
7. Le clavier des groupes `role=radio` implémentés par boutons doit être vérifié explicitement.

## Composants à conserver

`HikmaExerciseShell`, `ExerciseFeedback`, `HikmaProgress`, `HikmaReveal`, `ArabicText`, `AudioPlayer`, `HikmaLessonCard`, les générateurs, le grading, la session, la persistance et l’interleaving.

## Composants à refactorer visuellement

- `app/(app)/layout.tsx` / `components/app/app-nav.tsx` : permettre une composition de focus sans supprimer la sortie.
- `app/(app)/learn/[slug]/page.tsx` : réordonner visuellement le contexte sans toucher aux données ni à la génération.
- `components/learn/lesson-player.tsx` : exposer le bon cadre de focus et conserver la machine d’état intacte.
- `components/learn/lesson-discovery.tsx` : composer un stage unique pour mot, audio, révélation et prononciation.
- `components/learn/exercises/hikma-exercise-shell.tsx` et `components/ui/exercise.tsx` : renforcer espace, hiérarchie et états visuels.
- `components/ui/audio-player.tsx` : clarifier les libellés d’état sans changer le backend.
- `components/learn/lesson-complete.tsx` : conserver les actions et alléger le ton célébratoire.

## Composants potentiels à créer

À confirmer avant implémentation : `HikmaLessonFocusHeader`, `HikmaLessonContext`, `HikmaDiscoveryWordStage`, `HikmaLessonActionBar`. Ils doivent rester des primitives de présentation, sans grading, score, SRS, mastery, audio backend ni persistance.

## Risques

- Réduire le contexte pourrait masquer une information utile : la solution doit être repliable, jamais supprimée.
- Masquer la navigation mobile pourrait rendre la sortie difficile : conserver une action “Quitter la leçon” visible et accessible.
- Intégrer la prononciation ne doit pas transformer l’auto-évaluation en exercice noté.
- Toute modification de l’ordre des composants doit préserver la révélation différée du sens et l’ordre pédagogique 6E-B.
- Le contexte arabe ne doit être ni tronqué, ni normalisé, ni recoloré hors tokens.

## Dépendances

- Validation navigateur avec les routes publiques disponible ; session authentifiée et microphone non garantis.
- Aucun changement requis côté backend ou base.
- Les nouveaux visuels doivent utiliser les tokens Hikma V2, `ArabicText`, `AudioPlayer` et les primitives existantes.

## Invariants de non-régression

```text
génération = inchangée
grading = inchangé
score = inchangé
mastery = inchangée
SRS = inchangé
curriculum = inchangé
persistance = inchangée
audio backend = inchangé
interleaving 6E-B = inchangé
```
