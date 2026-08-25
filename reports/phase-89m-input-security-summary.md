# PHASE 89M — INPUT SECURITY / XSS HARDENING — RAPPORT

## VERDICT

```
PHASE_89M_COMPLETE
DATABASE_WRITES = 0
```

## Résultat des critères de succès

```
XSS_REFLECTED             = 0
XSS_STORED                = 0
DOM_XSS                   = 0
HTML_INJECTION            = 0
UNSAFE_URL_INJECTION      = 0
SERVER_VALIDATION_GAPS    = 0
DANGEROUS_DOM_SINKS       = 0
SECRET_EXPOSURE           = 0
CSP_REGRESSION            = 0
PEDAGOGICAL_REGRESSION    = 0
```

## AUDIT (7 inputs)

1. **Réponse libre pédagogique** (`FORM_TO_MEANING` / `MEANING_TO_FORM`) : `RecallExercise` `<input>` → memory state → `validateAnswer`/`gradeFreeResponse` (**string pur**) → rendu dans `ExerciseFeedback` via `userAnswer`/`correctContent` en **React text** (auto-échappé). **Jamais persistée** : seule la correction booléenne (`wordId` + `correct`) va dans `user_word_progress`/`review_items`.
2. **Retry d'écriture arabe** (mini-review) : `<input lang=ar>` → `isArabicRewriteExact` (comparaison de chaînes pures, non persistante) → réaffichée `Ta réponse : {value}` en React text.
3. **displayName** (onboarding + préférences) : validé serveur ≤ 60 chars + trim, persisté `user_settings.display_name`, réaffiché en React text.
4. **Auth** (email/password, reset, recovery) : valeurs envoyées uniquement à Supabase Auth ; erreurs mappées par `authErrorMessage` (chaînes fixes) — jamais réaffichées.
5. **Goal / reminder / timezone** : validés serveur (`Number.isInteger`>0, regex HH:MM, timezone IANA).
6. **Observabilité** (`/observability`) : POST-only, liste blanche, redaction cookies/query/tokens, 16 KB cap, rate-limit.
7. **URLs internes** (slugs lesson/surah/mot) : proviennent de la DB, jamais d'input utilisateur, dans des `href` statiques.

## THREAT MODEL (sources → transformations → sinks)

| Vecteur | Chemin trouvé |
|---|---|
| Réfléchi | Aucun : aucune réponse réinjectée dans un sink HTML ; encodage React text seul. |
| Stocké | Aucun : **aucune réponse libre ne quitte jamais le client** ; seul `displayName ≤60` est persisté et réaffiché échappé. |
| DOM | Aucun sink DOM (`innerHTML`/`textContent` affectés : 0 occurrence), aucune URL utilisateur en `href`/`src`/`router.push`. |
| URL | Aucune valeur utilisateur n'atteint un `href`/`src`. |
| Bypass client | Aucun : préférences/objectifs/reminders validées **côté serveur** ; les réponses libres ne sont pas persistées → pas de surface de bypass pertinent. |

## Recherche des sinks dangereux (exhaustive)

`dangerouslySetInnerHTML` · `innerHTML` · `outerHTML` · `insertAdjacentHTML` · `document.write` · `eval` · `new Function` · `setTimeout(string)` · `window.open` · affectation `textContent` · `javascript:` · `data:` · React-Markdown · DOMPurify → **aucun résultat honnête** (seul hit : lecture `window.location.pathname` en observabilité, non-sink).

## Principe appliqué (OWASP)

**Encodage au rendu** (React text) + **validation serveur** + **sinks sûrs** — **PAS** de filtrage des caractères spéciaux. Une réponse `maître / souverain` reste valide ; `a < b` reste une chaîne ; `<script>alert(1)</script>` est traité comme **texte** et noté INCORRECT, jamais exécuté. La qualité pédagogique n'est pas dégradée (testé : apostrophes, accents, chevrons dans un sens réel, arabe vocalisé intact).

## TESTS

```
UNIT      = tests/input-security.test.ts (7 tests) : injections inertes FR/AR,
            validateAnswer conserve la réponse brute, isArabicRewriteExact littéral,
            apostrophe/chevrons/arabe légitimes — PERTINENTS et durables
BUILD     = PASS (exit 0) · TYPECHECK = PASS · LINT = PASS (0 erreur)
VITEST    = 1053/1053 PASS (1046 existants + 7 nouveaux)   (68 files)
BROWSER   = NOT_VERIFIED (assertion par invariants de la chaîne pure de notation ;
            React garantit l'encodage text par construction)
CSP       = PASS — lib/config/csp.ts NON modifié ; aucun unsafe-eval prod
```

## DATABASE / RÉGRESSIONS

```
DATABASE_WRITES = 0      PEDAGOGICAL_REGRESSIONS = 0      SECURITY_REGRESSIONS = 0
```

## SÉCURITÉ / REVUE

- **Aucun secret** ; aucun service-role côté client ; aucun nouveau tracker/cookie/origine externe.
- **CSP 89G intacte** (aucun `unsafe-eval` prod, aucun wildcard, frame-ancestors 'none').
- Le correctif = **test d'invariant** uniquement : aucun code de production modifié (le code était déjà sûr par construction).

## NOT VERIFIED

- Rendu navigateur réel (DOM) — pas d'E2E navigateur ; l'invariant « réponse = texte » est couvert par test de la chaîne pure + l'encodage React.
- Épuisement par variantes illimitées dans `gradeFreeResponse` (non testé ; aucune persistance → risque négligeable, NOTÉ RISK-89M-001).

## DISCOVERED (hors scope, non corrigé)

- **DISC-89M-001 (NOTE)** : `display_name` stocké en clair dans `user_settings` (identité nominale) — conforme /privacy, hors périmètre d'input-security.

## NEXT PHASE

`PRODUCTION_DEPLOYMENT_PILOT` — rapport : `reports/phase-89m-input-security.json` + présent summary.