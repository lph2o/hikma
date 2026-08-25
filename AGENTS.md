<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Hikma (project-specific)

## DB / Supabase quirks

- The Supabase REST API caps every GET at 1000 rows: naive `select()` reads return exactly 1000 rows and fake "orphan" findings. For totals use `select("*", { count: "exact", head: true })`; for cross-table reads paginate with `.range(from, to)`.
- `learning_paths` has NO `status` column (unlike `lessons.status`) — don't select it.
- Production code uses only the anon key (client/server); the service-role secret lives exclusively in `scripts/` CLI tools. Word audio = private bucket + 60-min signed URLs; ayah audio = CDN (islamic.network).
- RLS is `auth.uid() = user_id` on every user table; all server actions guard `!user`. There is NO password-reset flow in the app (known gap).

## Build / typing

- `npm run build` FAILS at the typecheck pass on ~309 legacy TS errors in `scripts/` (supabase-js generics drift, TS2345). Production code (app/lib/components) is 0-error. Don't add to the debt: new audit scripts must be 0 TS errors / 0 ESLint.
- When writing supabase-js audit scripts, define query helpers as closures over the `client` value — naming `ReturnType<typeof createClient>` breaks overload resolution and reproduces the TS2345 drift.

## Next 16 quirks

- A server-component `redirect()` thrown after the layout flushed its shell is STREAMED: the response stays HTTP 200 with a `<meta http-equiv=refresh url=...>` + `NEXT_REDIRECT` digest in the RSC payload instead of a 307. Real browsers land correctly; curl-only checks must grep for `NEXT_REDIRECT`, not expect 307. Pages with no intermediate layout shell (e.g. /admin) still emit a hard 307. Same for `notFound()` (e.g. /surahs/9999: HTTP 200 with the 404 page streamed in the body).
- A background `npm run start -p 3100` process is killed when its shell command block ends — every runtime curl check must run inside ONE command block (start, sleep, curl, pkill) or the next block finds the server dead.
- `lib/supabase/server.ts` `createClient` calls `cookies()` and throws outside a request scope: standalone tsx audit scripts must build their own supabase client with `createClient(url, anonKey)` and manually load `.env.local` into `process.env` (env vars are NOT in the shell).

## Observability (89I)

- Zero-dependency observability layer: `instrumentation.ts` (register + onRequestError, Next 16 API — verify signatures in `node_modules/next/dist/server/instrumentation/types.d.ts`), `instrumentation-client.ts` (window error listeners), and POST-only `/observability` route handler (16 KB cap, in-memory rate limiter 30/min/IP, logs JSON to stdout). No new CSP origins; events never contain headers/cookies/query strings (sanitization in `lib/observability/sanitize.ts`, pure and unit-tested).
- Next 16 instrumentation docs live in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/` (instrumentation.md, instrumentation-client.md) — the API differs from older Next versions; read them before touching observability code.

## Security config (89G)

- `next.config.ts` headers() delegates to the pure builder `lib/config/csp.ts` (unit-tested): CSP uses `script-src 'unsafe-inline'` (required by App Router RSC bootstrap) and `style-src 'unsafe-inline'`; `unsafe-eval` is added ONLY when `NODE_ENV === "development"` (Next source maps). `next/font/google` self-hosts at build, so no Google origin is needed in font-src. Ayah audio lives in `media-src` (cdn.islamic.network), never connect-src.

## Data truth (verified by audits)

- DB baseline: 34 learning paths / 547 published lessons / 4503 lesson_words / 6095 validated FR word_translations (the "559 glosses" narrative is a subset; docs underestimate real coverage). The 10 editorial surahs (51, 64, 66, 67, 71, 75, 77, 79, 80, 89) resolve 100% FR.
- Audit scripts write raw JSON facts to `reports/`; a hand-authored consolidated report then supersedes that file — keep raw DB facts embedded in the final report. When hand-authoring report JSON, keep every value a proper JSON string/boolean: parenthetical notes after a bare value (`"x": true (note)`) are a recurring parse-breaking mistake — always validate with `node -e "require('./reports/X.json')"` before finishing.
- The `sources` DB table is the legal provenance ledger: each source row carries full license/legal_status metadata (e.g. Kazimirski PD, MASAQ CC BY 4.0, HF word-audio Apache-2.0 declared but provenance REVIEW_REQUIRED). Ayah audio (Al Quran Cloud) commercial use is NOT_VERIFIED — never claim it as cleared.
- Ayah audio (Al Quran Cloud / cdn.islamic.network) license, per the OFFICIAL terms page https://alquran.cloud/terms-and-conditions (updated 2026-06-14): streaming/embedding for personal & educational use is explicitly VERIFIED; commercial use is NOT_VERIFIED — recitations are licensed to the platform for free NON-commercial redistribution, and while bundling into a commercial product is "allowed", reciters retain copyright and may request removal. A free educational launch is fine; monetization requires resolving this first.
- `getQuranCoverage` (lib/learning/queries.ts ~line 2056, dashboard coverage) was fixed in 89K (R-89J-01): it now counts exact per 250-batch with `head:true` (chunk + Promise.all), because the 1000-row GET cap makes row-counting via `selectInChunks` silently TRUNCATE (proven on real data: 250 words/1376 occurrences → exactly 1000 rows). Never count with a rows-based select; use per-batch `{count:"exact", head:true}` sums. Related latent risk (DISC-89K-001): `getCoverageBySurah` (89C) still row-counts — a batch over 1000 occurrences would truncate (marginal today).
- Legal/attribution pages exist at /privacy, /terms, /sources (public, linked from the landing footer); contact channel = GitHub issues (lph2o/hikma) — no email exists in the project.
- Cookie footprint is exactly ONE first-party session cookie `sb-<project-ref>-auth-token` (@supabase/ssr defaults: path=/, sameSite=lax, httpOnly=false, maxAge 400d) — strictly necessary, exempt from consent (Art. 82). Zero localStorage/analytics/pixels in app code; cdn.islamic.network audio sets NO cookies (verified). Scenario A: no CMP needed, only an informative notice (89H audit). If analytics is ever added, keep it inside the CNIL audience-measurement exemption (anonymous, ≤13-month cookie) or it requires a consent system.
- The premium informative notice is `components/app/cookie-notice.tsx` (mounted in root layout) backed by `lib/privacy/cookie-notice-storage.ts` (localStorage key `hikma:consent:v1`, versioned, structure `{version, acknowledgedAt, categories:{necessary:true}}` — no analytics/marketing keys). It uses `useSyncExternalStore` with `getServerSnapshot=()=>true` so acknowledged users never see a flash and hydration never mismatches; SSR HTML contains no notice markup (localStorage is client-only). Clicking only sets localStorage — zero network.

## Deployment (89L audit)

- No deployment platform is configured or assumed (no vercel.json/netlify.toml/Dockerfile): platform, domain, HTTPS, Supabase prod project, Redirect URLs, backups and alerts are all EXTERNAL manual actions — never claim them verified.
- Runtime env vars are exactly 7: 3 NEXT_PUBLIC (SUPABASE_URL, SUPABASE_ANON_KEY, SITE_URL) + server-only SUPABASE_SERVICE_ROLE_KEY + 3 CLI-only flags for import scripts. `ADMIN_EMAILS` is optional and server-only; when absent the /admin guard is disabled (safe default). No secret ever lives in a NEXT_PUBLIC_ var.

## Input security (89M)

- XSS safety is by construction, not sanitizing: every user value (free-text lesson answers, mini-review Arabic rewrite, displayName, auth fields) renders only as React text children — no `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`window.open`/`textContent` assignment anywhere in app/components/lib, and no user value reaches an `href`/`src`. Never introduce an HTML sink; React text encoding is the control.
- Free-text lesson answers (FORM_TO_MEANING/MEANING_TO_FORM) are NEVER persisted — only `wordId` + `correct:boolean` go into user_word_progress/review_items; the raw string lives only in client memory and the ephemeral feedback. The only free string persisted is `display_name` (≤60, server-validated). Server-side validation exists for every preference/enum; validation never relies on the client.
- `normalizeFrench` in grading strips `(`/`)` as punctuation (payloads become `alert1`), but preserves `<`/`>` — security tests must assert inert-text invariants on the pure pipeline, not exact normalized strings.

## Adversarial-secure by design (89N audit)

- The app is adversarial-clean by construction, verified end-to-end in 89N: no Supabase `.or()/.and()/.ilike()/.rpc()/filter()` on user input (every `.select()` is a static column string, user values enter only as `.eq()/.in()` PostgREST-encoded), no open redirect (all `redirect()` calls are internal literal paths; the sole dynamic URL `getSiteUrl` comes from env/host and never redirects the client to an attacker URL), no IDOR (every server action derives `user.id` from `auth.getUser()` server-side — never client-supplied — and RLS `auth.uid()=user_id` is enforced, verified: an anonymous client reads 0 rows on user_settings/user_word_progress/lesson_sessions/review_items), and no log injection (`serializeEvent` JSON-escapes control chars; error messages map to fixed client strings).
- Grading regexes are all linear (character classes + `g` flag) — empirically no ReDoS: gradeFreeResponse runs 200K-char / Unicode-mixing inputs in ≤4ms. Free-text answers are NOT persisted and never cross the server boundary (only `wordId` + `correct:boolean[]` in `submitLessonResults`), so there's intentionally no length cap. Auth rate-limiting is delegated to GoTrue native limits (external Supabase config), not implemented in-app.

## SEO / metadata (89O)

- In this Next 16, `metadataBase` does NOT auto-emit `<link rel="canonical">`; you must set `alternates: { canonical: <relative-path> }` per indexable page (resolved against metadataBase). Public pages (/, /surahs, /surahs/[n], /learn/[slug], /mots/[id], privacy/terms/sources) now carry it; private routes do not.
- Root layout sets `robots: {index:true,follow:true}`; each auth-gated page (/dashboard, /profile, /review, /activity, /admin) must set its own `robots: {index:false,follow:false}` to emit noindex — per-route robots fully overwrites (not merges) the segment above.
- `NEXT_PUBLIC_SITE_URL` is inlined at BUILD time by Next; robots/sitemap/canonical/metadataBase fall back to http://localhost:3000 if it's unset at build. Production MUST build with it set (a manual action, not a code fix). sitemap = 116 URLs (root + /surahs + 114 /surahs/[n]); /learn/[slug] and /mots/[id] are crawlable-with-canonical but intentionally excluded from the sitemap.
- og:image `public/logo/logo_hikma.png` is 1254x1254 RGBA, 838 KB, ~989 core colors (gradient calligraphy, 63% transparent pixels): lossless re-encode (optimal filters + zlib 9) gains only ~5%, and palette quantization would visibly band the gradients — leave it as-is; compress post-launch only with human visual QA.
- Env-leak greps must exclude namespace URIs: every page embeds `http://www.w3.org/2000/svg` (inline SVG) and sitemap.xml declares `http://www.sitemaps.org/schemas/sitemap/0.9` — both are schema identifiers, not URLs; also `grep http://` matches inside `https://` (use `grep -vE '^https://'`).
