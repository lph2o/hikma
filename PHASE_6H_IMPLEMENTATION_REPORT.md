# Phase 6H — REAL LESSON UX HARDENING · IMPLEMENTATION_REPORT

Date : 2026-08-16

## Périmètre réalisé

Cette phase reste limitée au hardening UX/UI, responsive, accessibilité et hydratation. Les composants existants ont été conservés.

## Corrections

### Hydratation microphone

- `PronunciationGuided` démarre avec `MicState = "unknown"`, identique en SSR et au premier rendu client.
- `navigator`, `MediaDevices` et `MediaRecorder` ne sont consultés qu’après montage, dans une tâche post-montage.
- La permission reste déclenchée uniquement par le clic explicite sur `Enregistrer`.
- Les états `unknown`, `available`, `unavailable` et `denied` ont des copies UI distinctes.
- Aucun `suppressHydrationWarning`, désactivation SSR ou changement du moteur de prononciation.

### Découverte mobile

- Le stage du mot reste prioritaire.
- Les espaces non essentiels ont été resserrés sans réduire la lisibilité de l’arabe.
- Le CTA de découverte devient un footer sticky mobile avec fond opaque, cible tactile conservée et safe-area ; il redevient statique à partir de `sm`.
- Un espace bas est réservé pour éviter que le contenu soit masqué par le footer.

### Feedback et explication

- Le feedback conserve toutes les informations et place `Ta réponse` / `Réponse attendue` dans une comparaison compacte, en deux colonnes lorsque l’espace le permet.
- Les textes arabes longs restent enveloppés et lisibles.
- La disclosure `Comprendre pourquoi` reste fermée par défaut et conserve `aria-expanded` / `aria-controls`.
- Les espacements du shell et du feedback ont été réduits avec les tokens existants, sans nouvelle couleur, ombre, typographie ou radius.

### Complétion

- Suppression de l’emoji décoratif `🎉`.
- Ton remplacé par une formulation sobre : `Leçon terminée` puis `Al-ḥamdulillāh, tu as franchi cette étape.`
- Les statistiques et les contrats de fin de session restent inchangés.

## Tests ajoutés

- Test SSR ciblé garantissant que l’état initial microphone est neutre et n’affiche pas le bouton d’enregistrement avant l’initialisation client.
- Les tests existants de séparation des réponses, explication, arabe et langage islamique restent actifs.

## Fichiers applicatifs concernés

- `components/learn/exercises/pronunciation-exercise.tsx`
- `components/learn/lesson-discovery.tsx`
- `components/learn/exercises/hikma-exercise-shell.tsx`
- `components/ui/exercise.tsx`
- `components/learn/lesson-complete.tsx`
- `tests/lesson-polish.test.ts`

## Fichiers métier non touchés

AnswerResult, validation/grading, scoring, générateurs, SRS, mastery, scheduler, interleaving, curriculum, actions de persistance, Supabase, migrations, données Quran et audio backend.

