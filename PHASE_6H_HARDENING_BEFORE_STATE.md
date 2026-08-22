# Phase 6H — Hardening · BEFORE_STATE

Date : 2026-08-16

## Référence

Audit source : [`PHASE_6H_REAL_LESSON_UX_AUDIT.md`](./PHASE_6H_REAL_LESSON_UX_AUDIT.md)

## État observé avant implémentation

- Score UX observable : **3,5/5 — PARTIAL**.
- 427 tests passés, TypeScript, lint et build valides.
- P1 confirmé : `PronunciationGuided` évaluait la disponibilité du microphone pendant le rendu initial via `navigator`, produisant un arbre SSR/CSR divergent.
- P1 confirmé : l’expansion de la prononciation guidée poussait `Mot suivant` sous la ligne de flottaison à `390×844`.
- P2 : empilement feedback / comparaison / explication trop vertical sur mobile.
- P2 : ton de fin de leçon encore trop gamifié avec l’emoji `🎉`.

## Contrats protégés

Grading, scoring, SRS, mastery, scheduler, interleaving, curriculum, persistance, Supabase, migrations, données Quran et backend audio : **inchangés**.

