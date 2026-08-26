# PHASE 91 — POST-DEPLOYMENT + PRODUCTION DOMAIN AUDIT — FINDINGS

**Mode** : AUDIT-ONLY · **Zéro modification** · `DATABASE_WRITES = 0`

## VERDICT

```
CONDITIONAL_GO (audit only)
CODE_PRODUCTION_READY       = YES
DEPLOYMENT_PRODUCTION_READY = NO

P0 = 0 · P1 = 3 · P2 = 2 · NOTE = 3 · MANUAL = 2 · NOT_VERIFIED = 3
```

Les 3 P1 sont **tous externes ou configuration** (aucun bug de code) :
1. Alias de production → premier déploiement cassé (404 partout)
2. `NEXT_PUBLIC_SITE_URL` absente sur Vercel → canonical/OG/sitemap en `localhost`
3. Domaine `hikma.top` acheté mais **parké** (non relié à Vercel, DNS Spaceship, pas de HTTPS)

## FINDINGS

| ID | Finding | Sévérité | Preuve | Statut |
|---|---|---|---|---|
| 91-A01 | Alias prod `hikma-delta.vercel.app` + `hikma-lph2os-projects.vercel.app` → 1er déploiement (framework non défini) → **404 sur toutes les routes** | **P1** | curl : `/ /surahs /surahs/1` → 404 « The page could not be found » ; API : alias → `hikma-hwoo0qu1w` | VERIFIED |
| 91-A02 | `NEXT_PUBLIC_SITE_URL` ABSENTE sur Vercel (2 vars seulement) → canonical/og:url/og:title = `http://localhost:3000` | **P1** | Vercel env ; curl canonical ; **preuve inverse** : build avec `https://hikma.top` → canonical/OG/sitemap/robots parfaits, 0 localhost | VERIFIED |
| 91-A03 | `hikma.top` acheté (Spaceship, NS confirmés) mais **parké** : A records → parking Spaceship, pas de www/CNAME, HTTPS status 000, non lié à Vercel (`domains: []`) | **P1** | `dig` A = 34.216.117.25 / 54.149.79.189 ; page « Parking Page » ; Vercel domains = [] | VERIFIED |
| 91-A04 | Déploiement de référence (`4113eqkxq`) : CSP `media-src` **sans** Supabase → bug audio des mots présent | P2 | header CSP constaté | VERIFIED |
| 91-A05 | Déploiement récent (`mxv075zta`) : fix audio CSP **actif** (Supabase en media-src) | PASS | header CSP constaté | VERIFIED |
| 91-A06 | Password reset E2E réel — aucun email envoyé/testé | MANUAL | — | NOT_VERIFIED |
| 91-A07 | Redirect URLs Supabase (devront inclure `https://hikma.top/reset-password`) | MANUAL | — | NOT_VERIFIED |
| 91-A08 | Projet Supabase `akgblkwddjslbgoaxdfh` — statut dev/prod à confirmer | NOTE | RLS vérifiée live (0 ligne anon sur 5 tables user) | PARTIAL |
| 91-A09 | OG image 838 Ko (P2 connu) | P2 | content-length 838813 | VERIFIED |
| 91-A10 | 12 fichiers non commités (masquage `/sources` + fix audio/UI + rapports 91) | NOTE | git status | VERIFIED |

## SECTIONS

### 1. VERCEL
Projet `hikma` · framework `nextjs` · build par défaut (`next build`) · Node **24.x** (compatible `engines >=20.9.0`) · GitHub connecté (`lph2o/hikma`, branche main) · SSO protection désactivée · **3 déploiements** : `hwoo0qu1w` (cassé, porte l'alias prod), `4113eqkxq` (référence, sans fix audio), `mxv075zta` (récent, fix audio + UI).

### 2. ENVIRONMENT
Variables Vercel : `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (preview + production, chiffrées). **`NEXT_PUBLIC_SITE_URL` = ABSENTE** → tout le SEO retombe sur `http://localhost:3000`. Aucun secret exposé.

### 3. DOMAIN
`hikma.top` : acheté chez Spaceship (3 ans, NS `launch1/launch2.spaceship.net`) ✓ — mais **parké** : A records vers IPs de parking Spaceship, pas de www, pas de CNAME, pas de TLS, pas de liaison Vercel.

### 4. DNS
`DOMAIN_PURCHASED = VERIFIED` · `DNS = PARKED` · `VERCEL_LINK = NOT_LINKED` · `HTTPS = NOT_WORKING` · `PRODUCTION_DOMAIN = NOT_CONFIGURED`.

### 5. SUPABASE
Projet `akgblkwddjslbgoaxdfh.supabase.co` · RLS **active** (anonyme → 0 ligne sur user_settings, user_word_progress, lesson_sessions, review_items, user_activity_words) · word_audio : 21 295 objets = 21 295 références, signature OK (HEAD 200 `audio/opus`) · service-role absente du client.

### 6. AUTH
Guards privés vérifiés en live : `/dashboard /profile /review /activity` → `NEXT_REDIRECT;/login;307` (streamé, quirk Next 16) · `/admin` → 307 dur · open redirect = 0 (`/login?next=https://attacker.example` → aucune redirection). Password reset réel = NOT_VERIFIED.

### 7. SECURITY
CSP intacte (`unsafe-eval` = 0 en prod) ; le déploiement récent ajoute l'origine Supabase à `media-src` (fix audio). Headers complets : HSTS preload, nosniff, DENY, referrer-policy, permissions-policy. Cookies : aucun Set-Cookie sur les pages publiques (session Supabase uniquement). Patterns dangereux = 0 · service-role client = 0 · secrets = 0.

### 8. SEO
Sur les déploiements actuels : canonical/OG = `localhost:3000` (SITE_URL absente). **Preuve du correctif** : build local avec `NEXT_PUBLIC_SITE_URL=https://hikma.top` → canonical `https://hikma.top`, og:url correct, canonical insensible aux query params (`/surahs/1?utm_source=x` → `https://hikma.top/surahs/1`), sitemap 116 URLs en https, robots → `https://hikma.top/sitemap.xml`, **0 localhost**.

### 9. SITEMAP
116 URLs (0 privée, 0 duplicata) — domaine actuel localhost, deviendra `hikma.top` dès la variable au build.

### 10. ASSETS
`/logo/logo_hikma.png` 200 (838 Ko, P2 connu) · `/favicon.ico` 200 · `/icon.png` et `/apple-icon.png` 404 mais **non référencés** par les metadata (sans impact).

### 11. CRAWLER
Pages publiques → 200 avec canonical · routes privées → aucun contenu (guard) + noindex + Disallow robots · sitemap sans URL privée. Une fois SITE_URL + domaine posés, discovery propre.

### 12. FUNCTIONALITY
`/surahs/999` → 200 + contenu 404 streamé (quirk Next 16 documenté, non vulnérable) · `/random-invalid` → 404 · `GET /observability` → 405 (attendu) · `POST /observability` payload invalide → 400 (validation OK).

### 13. BUILD
`BUILD = PASS` (exit 0) avec `NEXT_PUBLIC_SITE_URL=https://hikma.top`.

### 14. TESTS
`1058/1058 PASS` (68 fichiers) · `TYPECHECK = PASS` · `LINT = PASS` (0 erreur, 20 warnings pré-existants).

### 15. NPM AUDIT
`0 vulnérabilité`.

### 16. GIT SCOPE
12 fichiers dirty **hérités** (masquage `/sources` + fix audio/UI + rapports 91) — **0 modification pendant cette phase d'audit**.

## RÈGLE FINALE

```
AUDIT_ONLY_COMPLETE = YES
PRODUCTION_CHANGES = 0
DATABASE_WRITES = 0
```

**Aucune correction appliquée.** Pour passer de `DEPLOYMENT_PRODUCTION_READY = NO` à `YES`, la séquence manuelle exacte (après votre autorisation) :

1. Ajouter `hikma.top` (+ `www`) dans Vercel → fournir les enregistrements DNS exacts à créer chez Spaceship
2. Configurer les DNS Spaceship (A/CNAME vers Vercel) et attendre la propagation
3. Ajouter `NEXT_PUBLIC_SITE_URL=https://hikma.top` sur Vercel (production, au build)
4. Redéployer la production (`vercel --prod`) — corrige aussi l'alias cassé
5. Vérifier HTTPS/canonical/OG/sitemap sur `https://hikma.top`
6. Configurer les Redirect URLs Supabase (dont `/reset-password`) + tester le reset E2E réel
7. (Post-lancement) Search Console, monitoring, licence audio commerciale
