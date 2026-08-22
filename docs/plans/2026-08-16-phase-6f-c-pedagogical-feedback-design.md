# Phase 6F-C — Pedagogical feedback design

## Decision

Use a presentation adapter between `AnswerResult` and the existing
`ExerciseFeedback` primitive. Add a reusable `HikmaExplanation` disclosure.
`AnswerResult`, grading, scoring, progression and persistence remain unchanged.

## Presentation contract

The adapter exposes only UI data:

- `availability`: `verified`, `partial` or `unavailable`;
- `kind`: meaning, phonetic, context or lemma;
- concise explanatory text;
- optional Arabic, transliteration and phonetic hints;
- a contextual feedback moment: ordinary, difficult success or milestone.

Meaning and expected-answer data are used only as meaning reminders. Phonetic
content comes only from `lib/learning/phonetics.ts`. Lemma data can describe a
verified family relation, but never supplies a fabricated root, form, person,
tense, case or grammatical role. Missing data remains unavailable.

## Interaction

Incorrect feedback is ordered as `À revoir`, `Ta réponse`, `Réponse attendue`,
short note, `Comprendre pourquoi`, optional explanation and `Continuer`.
The disclosure is closed by default and uses `aria-expanded` and
`aria-controls`. Its content is presentation-only and resets when the
feedback component remounts for another exercise.

Correct feedback is intentionally light. Ordinary successes use neutral copy;
`Mā shā’ Allāh` is reserved for a difficult success or a meaningful milestone.
`Bismillāh` and `Al-ḥamdulillāh` remain contextual lesson-entry and lesson-end
copy, not per-answer rewards.

## Constraints

Hikma tokens, semantic text colors, `ArabicText`, RTL isolation, keyboard
focus, 44px targets, transform/opacity-only motion and reduced motion are
required. No Quran data is normalized or changed. No backend, DB, generator,
grading, scoring, SRS, mastery, scheduler, curriculum, audio backend or
persistence contract is changed.

## Verification

Test correct, incorrect, ambiguous, empty, long answers, explanation open and
closed, unavailable data, duplicate suppression, moment copy, ARIA attributes,
and the existing full validation commands.
