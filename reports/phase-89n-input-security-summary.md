# PHASE 89N — ADVERSARIAL INPUT / APPLICATION SECURITY — RAPPORT

## VERDICT

```
PHASE_89N_AUDIT_COMPLETE
DATABASE_WRITES = 0
CRITICAL = 0 · HIGH = 0 · MEDIUM = 0 · LOW = 0 · NOTE = 2
```

Phase **audit + tests ciblés uniquement** : aucun correctif production nécessaire — le code était déjà sécurisé sur les 8 classes d'attaques auditées. Seul ajout de code : **5 tests de régression DoS/abus** (accroissement durable de l'invariant). Aucun fichier de production modifié.

## 1. Injection Supabase / PostgREST — SAFE

- Tous les `.select()` utilisent des **chaînes de colonnes statiques** ; **aucun** `.rpc()`, `.or()`, `.and()`, `.ilike()`, `.like()`, `.filter()` dynamique, aucun nom de table/colonne piloté par l'input (vérifié dans `queries.ts`, `actions.ts`, `lesson-submit.ts`, `persistSkillAttempt`).
- Les valeurs utilisateur (ex. `wordId`) n'entrent que comme valeurs `.eq()`/`.in()` **encodées par PostgREST** — aucune concaténation, aucun backtick SQL.

## 2. Open redirect / URL — SAFE

- **Tous les `redirect()` sont des chemins internes littéraux** (`/login`, `/dashboard`, `/onboarding`, `/`). Aucun `redirectTo`/`callbackUrl`/`?next=` utilisateur.
- `getSiteUrl` dérive de `NEXT_PUBLIC_SITE_URL` ou du header host **serveur** ; ne redirige jamais le client vers une URL d'attaque.
- `/reset-password?code=` : le code va uniquement dans `exchangeCodeForSession` (validé Supabase) puis `replaceState` ; jamais reflété dans un `href`/redirect.

## 3. IDOR / authorization — SAFE

- **Chaque Server Action data-mutating dérive `user.id` de `auth.getUser()` côté serveur** — aucun endpoint n'accepte un `userId` client (à l'exception des documents read-only publics).
- **RLS vérifié en DB réelle** (SELECT anon) : client anonyme reçoit **0 ligne** (sans erreur) sur `user_settings`, `user_word_progress`, `lesson_sessions`, `review_items` → RLS `auth.uid() = user_id` effective. Cross-user lecture/écriture impossible sans la clé de session de la victime.

## 4. Payload exhaustion / ReDoS — SAFE (validé empiriquement)

- Toutes les regex de normalisation (grading, normalize-text) sont **linéaires** (classes de caractères + `g`, pas de quantificateurs imbriqués/alternations chevauchantes).
- Test local sur la chaîne de notation réelle : **100K FR = 3 ms, 80K AR = 2 ms, Unicode combinantes/zero-width = 4 ms, `validateAnswer` 200K = 3 ms, `isArabicRewriteExact` 50K = 0 ms**. Aucun hang.

## 5. Log injection — SAFE

- `serializeEvent` = `JSON.stringify` → échappe `\n`/`\r`/ANSI → **impossible de forger une seconde ligne de log**.
- Messages tronqués (2000) et stacks (4000) ; erreurs serveur → **strings fixes** au client (`classifyLessonSubmitError`, `authErrorMessage`). Aucun cookie/JWT/token/password loggé.

## 6. Rate limiting / abuse — SAFE (contrôle externe noté)

- `/observability` : limiter en route (30/min/IP, 16 KB). Auth (login/signup/reset) → **rate-limiting natif GoTrue** (NOTÉ, à confirmer sur le projet prod).

## 7. Path / param dynamique — SAFE

- `/surahs/[number]`, `/learn/[slug]`, `/mots/[id]` : `notFound()` sur valeurs invalides (quirk Next 16 streamé déjà documenté) ; aucun 500, aucune requête coûteuse, aucune donnée utilisateur dans ces chemins.

## 8. XSS — 2ᵉ revue indépendante — SAFE

- Traçage de bout en bout confirmé (89M) : **aucune réponse libre n'est persistée** (seul `correct:boolean`), `display_name ≤60` réaffiché en React text, aucun sink HTML (`dangerouslySetInnerHTML`/`innerHTML`/`eval`/`window.open`), aucune valeur utilisateur en `href`/`src`.

## Tests

```
UNIT  = tests/input-security.test.ts +5 (régression DoS/abus ; 12 au total dans le fichier)
BUILD = PASS (exit 0) · TYPECHECK = PASS · LINT = PASS (0 erreur sur le fichier ajouté)
VITEST= 1058/1058 PASS (1053 existants + 5 nouveaux) · 68 files
CSP   = INCHANGÉE (lib/config/csp.ts, next.config.ts non touchés — aucun unsafe-eval prod)
DB    = 0 écriture · RLS re-vérifiée (0 ligne pour un client anonyme)
```

## NOT VERIFIED

- Config GoTrue du projet Supabase de production (rate-limit, emails) — externe, hors repo (M-07 89L).
- Rendu navigateur réel (Mutation/DOMPurify-level) — pas d'E2E navigateur dans cette phase ; invariants couverts par tests de la chaîne pure + React text-encoding.

## RECOMMENDED NEXT PHASE

`PRODUCTION_DEPLOYMENT_PILOT` — rapports : `reports/phase-89n-input-security.json` + présent summary.