# PHASE 6I-B — EXERCISE INTERACTION & INFINITE RELOAD FORENSIC AUDIT

Status: `PHASE_6I_B_FORENSIC_AUDIT_INCONCLUSIVE`

## BEFORE_STATE

- Mode: strict read-only / forensic audit only.
- No application, test, data, backend, Supabase, migration or configuration files were modified.
- Baseline Git state was captured before inspection: 12 tracked paths modified, 147 untracked paths, 159 total entries. Existing user changes were preserved.
- The repository was already materially dirty; the audit artifacts are the only files added by this audit.
- Route tested: `http://127.0.0.1:3002/learn/basmala`.
- Browser validation viewport: `390×844`. The requested desktop comparison at `1280×720` was not executed in this audit.

## Executive verdict

The reported Ex5 symptom was not reproduced. Ex1 through Ex10 accepted one option selection each and advanced with `Continuer`; Ex5 was exercised as the fifth transition in the sequence. The URL remained `/learn/basmala`, no document reload or route change was observed, and the browser console had no warnings or errors. Therefore no P0/P1 root cause is confirmed.

The result is deliberately inconclusive for the original incident: the authenticated/session-specific state and the exact user environment that produced the report were not available. The evidence is sufficient to reject a deterministic failure in the public anonymous reproduction, not to prove that no environment-specific failure exists.

## Reproduction matrix

The machine-readable matrix is [forensic-matrix.json](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/tmp/phase6i-b/forensic-matrix.json).

| Scenario | Result | Evidence |
|---|---|---|
| Ex1–Ex4 click → feedback → Continue | PASS | Each option became checked/disabled after click and the next exercise rendered. |
| Ex5 clickability / reload | UNKNOWN incident, PASS reproduction | The fifth transition completed; no reload or route change observed. |
| Ex6–Ex10 click → feedback → Continue | PASS | Exercise counters 6–10 were observed and each transition completed. |
| Pointer target at 390×844 | PASS | Centers resolved to the option button’s descendant `SPAN`; event bubbling is expected. |
| Keyboard activation | UNKNOWN | The available locator `press("Space")` and `press("Enter")` path did not change `aria-checked`; native browser keyboard behavior remains unconfirmed by this control surface. |

## 1. Is the click really received?

Yes in the reproduced path. The live DOM exposed four visible `[role="radio"]` controls. Before selection they were enabled, had `pointer-events: auto`, and their centers were inside the viewport. `document.elementFromPoint` resolved to the nested text `SPAN`, a descendant of the button, not to an overlay or unrelated element. Clicking the unique role locator triggered the expected feedback state.

The nested span is not itself a defect: pointer events bubble to the button, and the component’s decorative `::before` layer explicitly has `pointer-events: none`.

## 2. Does disabled state, overlay or z-index block the click?

Not in the reproduction. Options had `disabled=false` before selection and became disabled only after the answer was recorded. Computed `pointer-events` was `auto`; `z-index` was `auto`; no overlay intercepted the center point. The Continue control was also inside the mobile viewport at the observed state.

The intended disabled lifecycle is visible in [options-exercise.tsx:96](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/exercises/options-exercise.tsx:96)–[options-exercise.tsx:106](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/exercises/options-exercise.tsx:106): `aria-checked` follows the selected answer and `disabled={answer != null}` prevents double submission only after the first answer.

## 3. Is the correct component rendered and does it receive the expected props?

Static trace and live behavior agree. `ExerciseCard` selects by the exercise’s actual type and remounts only on the stable exercise identity in [index.tsx:479](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/exercises/index.tsx:479)–[index.tsx:491](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/exercises/index.tsx:491). `OptionsExercise` receives the current exercise, answer, result and `onChoose`, then renders the expected radio group.

`LessonPlayer.choose` guards only already-answered, non-playing or missing-current states before setting the answer in [lesson-player.tsx:202](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/lesson-player.tsx:202)–[lesson-player.tsx:205](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/lesson-player.tsx:205). No guard incorrectly rejected the initial click in the reproduction.

## 4. Is there a hidden form submission or accidental navigation?

No for multiple-choice options. The option group has no parent form in the live DOM. `Button` defaults to `type="button"` in [button.tsx:67](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/ui/button.tsx:67)–[button.tsx:89](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/ui/button.tsx:89). The only form found in the exercise source is the deliberate free-text Recall form, whose submit handler calls `preventDefault()` in [index.tsx:171](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/exercises/index.tsx:171)–[index.tsx:176](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/exercises/index.tsx:171).

`router.push("/learn")` is only in the explicit quit handler at [lesson-player.tsx:185](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/lesson-player.tsx:185)–[lesson-player.tsx:200](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/lesson-player.tsx:200). No click-to-option path invoked it.

## 5. Is there a state/effect/render loop?

No deterministic loop was found in the inspected path. `continueNext` clears the answer, increments the index and persists the session without `router.refresh()` in [lesson-player.tsx:213](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/lesson-player.tsx:213)–[lesson-player.tsx:253](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/lesson-player.tsx:253). The exercise key is derived from `exerciseIdentity`, whose identity is deterministic by lesson, type, target word, prompt and occurrence in [exercise-identity.ts:4](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/exercises/exercise-identity.ts:4)–[exercise-identity.ts:18](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/exercises/exercise-identity.ts:18).

The inspected lesson path contains no `Math.random`, `Date.now`, `window.location.reload`, or render-time navigation. Browser observation showed a stable URL, `document.readyState="complete"`, no console errors/warnings and no visible route reset while advancing through Ex1–Ex10.

## 6. Is the problem isolated to Ex5 or shared by a component family?

The reproduction indicates a shared component family works across Ex1–Ex10, including Ex5. Ex5 therefore cannot be isolated as a deterministic options-component defect from the available evidence. A content-specific or session-specific trigger remains possible because the reproduction used the public local route and did not reproduce the reported authenticated context.

## 7. Is the reload a real document reload, an RSC refresh, a remount or only a visual reset?

No reload, route transition or RSC refresh was observed during the tested sequence. The route stayed constant and the next exercise counter advanced monotonically from 1 to 11. The source trace contains no automatic refresh call in the interaction path. The component remount in `ExerciseCard` is intentional and keyed by a stable exercise identity; it is a local exercise-component lifecycle reset, not evidence of a document reload.

The browser tool did not expose document-level network request events, so exact request counts are recorded as unavailable rather than inferred. Authenticated server-action behavior, middleware redirects and any RSC loop tied to a real signed-in session remain unvalidated.

## Root-cause classification

- Hypothesis A — pointer interception / disabled option: rejected for the reproduced state.
- Hypothesis B — accidental form navigation: rejected for multiple-choice options by DOM and source inspection.
- Hypothesis C — remount/state reset: no loop found; stable identity remount is intentional.
- Hypothesis D — auth/session/RSC/environment-specific reload: not reproduced and not determinable without the original session/context.

## Minimal recommended patch (not implemented)

No patch is justified from this audit alone. Before changing application code, capture the failing authenticated session with a browser trace containing: current URL, document/RSC request timeline, response status, console errors, DOM snapshot immediately before and after the failed click, `disabled`/`aria-disabled`, `elementFromPoint`, and whether the counter returns to Ex1. If the incident reproduces only with authenticated persistence, isolate the server action or auth redirect before touching the interaction component.

## Validation status

- `390×844` real browser validation: executed.
- `1280×720` real browser validation: `BROWSER_VALIDATION_PENDING`.
- Authenticated reproduction: `BROWSER_VALIDATION_PENDING`.
- Exact network/document request timeline: `BROWSER_VALIDATION_PENDING` because the available browser surface did not expose network events.
- Keyboard activation: `BROWSER_VALIDATION_PENDING`; locator keypress did not produce a state change, but the control surface did not provide a conclusive native focus/keypress trace.
- Automated test, TypeScript, lint and build commands: not run; this was a strict forensic audit and no validation command was required to establish the observed browser result.

## AFTER_STATE

- Application behavior and all business contracts are unchanged.
- No source, test, data, backend, Supabase, migration or configuration file was modified.
- Only the permitted audit artifacts were added.
- No P0/P1 issue is confirmed.
- Final status: `PHASE_6I_B_FORENSIC_AUDIT_INCONCLUSIVE`.
