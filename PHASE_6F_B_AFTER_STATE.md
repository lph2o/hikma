# PHASE 6F-B — After State

## Implemented experience

`/learn/[slug]` now renders as a presentation-only lesson focus mode:

```text
compact focus header
  → step and current position
  → visible exit to the parcours
discovery stage
  → current Arabic word
  → transliteration
  → audio
  → voluntary meaning reveal
  → guided pronunciation sequence for the first word
  → next action
secondary Quran context disclosure
exercise focus header
  → HikmaExerciseShell
  → interaction
  → separated semantic feedback
  → continuation CTA
```

## Confirmed changes

- Global `AppHeader` is not rendered on a lesson route; the lesson owns its compact focus header.
- Mobile global bottom navigation is hidden only during a lesson route; the exit remains in the focus header and the desktop sidebar remains available.
- Lesson context is preserved in `HikmaContextDisclosure`, closed by default, with separate Arabic text and French translation surfaces.
- Lesson discovery begins immediately with the learning step and current word instead of the full verse context.
- Pronunciation guided practice is integrated as a staged block and is rendered only for its actual first-word exercise.
- Word reveal, context disclosure and word audio remount/reset with the current word identity.
- Incorrect feedback now gives `Ta réponse` a soft error surface and `Réponse attendue` a soft success surface.
- Generated explanations that repeat the expected answer are suppressed when that answer already has its dedicated surface.
- Exercise shell and feedback spacing are increased without changing the state machine.
- Design-system laboratory includes Lesson Focus Mode and context disclosure examples.

## Invariants preserved

Generation, grading, scoring, mastery, SRS, curriculum, interleaving 6E-B, session persistence, Quran data, translations, audio backend, submit contracts and activity tracking are unchanged.
