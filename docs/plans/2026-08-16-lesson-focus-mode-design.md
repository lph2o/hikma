# Lesson Focus Mode — Phase 6F-B

## Intent

Make `/learn/[slug]` feel like a focused learning session rather than a page containing several unrelated blocks. The UI should foreground the current learning action while preserving Quran context, exit access, and every existing pedagogical contract.

## Chosen approach

Use a presentation-only focus shell at the lesson route:

1. the app layout receives an opt-in lesson-focus presentation flag;
2. mobile global navigation becomes secondary while the lesson exit remains in the compact lesson header;
3. lesson context moves into a closed-by-default disclosure;
4. discovery composes the current word, audio, reveal and guided pronunciation in one stage;
5. exercise shell spacing and feedback separation are refined without changing the state machine;
6. audio/microphone labels are clarified using existing components and local-only behavior.

## Invariants

No change to generation, grading, scoring, mastery, SRS, curriculum, interleaving, persistence, Quran data, audio backend, or submit contracts. The 6D-B exercise identity and 6E-B ordering remain untouched.

## Component boundary

Reuse `HikmaExerciseShell`, `ExerciseFeedback`, `HikmaProgress`, `HikmaReveal`, `ArabicText`, `AudioPlayer`, and `HikmaLessonCard`. Add only small presentation primitives where they prevent duplication: a focus header and a context disclosure. Keep guided pronunciation local and auto-evaluated; never turn it into a scored exercise.

## Responsive and accessibility contract

At 390px and 375px, no horizontal overflow, all actions remain at least 44px, the current Arabic word remains readable with Amiri/RTL, the lesson exit is reachable, and the global nav does not compete with the action footer. The focus shell must retain visible focus, accessible names, polite state announcements, reduced motion, and a safe fallback when audio or microphone is unavailable.

## Validation

Run the existing full suite, TypeScript, lint and build. Use the real browser at 390×844 and 1280×720 for first visit, discovery, reveal, audio, exercise selection, incorrect/correct feedback and route exit. Authenticated, microphone and full completion states are reported as partial if unavailable.
