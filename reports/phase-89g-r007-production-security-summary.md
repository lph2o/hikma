# PHASE 89G — PRODUCTION CONFIG & SECURITY HEADERS — RAPPORT DE PHASE

**VERDICT : `PHASE_89G_COMPLETE`** — R-007 = RESOLVED. **DATABASE_WRITES = 0.**

## R-007 — Cause racine & correctif

`next.config.ts` était vide : aucune protection HTTP. Correctif : builder pur et testé `lib/config/csp.ts` + application dans `next.config.ts` (`poweredByHeader: false` + headers globaux).

### Headers appliqués
| Header | Valeur |
|---|---|
| CSP | `default-src 'self'` ; `script-src 'self' 'unsafe-inline'` ; `style-src 'self' 'unsafe-inline'` ; `img-src 'self' data: blob:` ; `font-src 'self' data:` ; `connect-src 'self' <SUPABASE> wss://<SUPABASE>` ; `media-src 'self' https://cdn.islamic.network blob:` ; `frame-ancestors 'none'` ; `base-uri 'self'` ; `form-action 'self'` ; `object-src 'none'` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=()` |
| X-Frame-Options | `DENY` |
| HSTS | `max-age=63072000; includeSubDomains; preload` — **uniquement si** `NEXT_PUBLIC_SITE_URL` est `https://` |

### Origines autorisées (aucune inventée, auditées dans le code)
- **Supabase** : origine réelle dérivée de `NEXT_PUBLIC_SUPABASE_URL` (auth + REST + SSR) + `wss://` réservé Realtime.
- **Audio** : `cdn.islamic.network` **en `media-src` uniquement** (vérifié joignable : HTTP 206).
- **Fonts** : auto-hébergées par `next/font/google` au build → aucune origine Google nécessaire (`font-src 'self' data:`).
- **Images** : toutes locales → `img-src 'self' data: blob:`.
- Aucun wildcard, aucun `unsafe-eval` en production ; `unsafe-inline` documenté (bootstrap RSC Next.js / styles React-Tailwind), nonces = amélioration future.

## Sécurité
- Aucun secret exposé ; aucun service-role côté client ; aucune nouvelle route ouverte.
- Clickjacking (frame-ancestors + XFO), MIME sniffing, referrer, permissions : protégés.
- COOP/CORP volontairement non ajoutés (aucune ressource cross-origin ne les exige ; risque de casser Auth/audio sans bénéfice).

## Tests
```
BUILD      = PASS            TYPECHECK = PASS (0 erreur)     LINT = PASS (0 erreur)
VITEST     = 1018/1018 PASS  (1008 existants + 10 nouveaux tests CSP)
RUNTIME    = build prod port 3100 : CSP unique, script-src prod sans unsafe-eval,
             HSTS absent (non-HTTPS), /dashboard digest 89B intact, /admin 307,
             /robots.txt 200, /sitemap.xml 116 URLs, CDN audio joignable
```

## DATABASE
```
DATABASE_WRITES = 0
```

## NOT VERIFIED
- Comportement derrière le CDN/plateforme de production finale.
- TLS du domaine final (HSTS s'activera automatiquement avec l'URL https).
- Violations CSP dans un vrai navigateur (aucun E2E navigateur disponible).

## DISCOVERED (hors périmètre, non corrigé)
- **DISC-004** : en dev, Next peut logger des violations CSP liées aux source maps (sans incidence production).

## Prochaine étape
`PHASE_89H_OBSERVABILITY` — **R-008** (détection d'erreurs production + analytics basique). Rapports : `reports/phase-89g-r007-production-security.json`.
