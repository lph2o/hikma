# PHASE 91 — VERCEL PRODUCTION DEPLOYMENT SETUP

## VERDICT

```
PREVIEW_DEPLOYED

CODE_STATUS      = CODE_READY
VERCEL_STATUS    = PROJECT_CREATED_AND_LINKED (hikma, lph2os-projects)
GITHUB_STATUS    = CONNECTED (lph2o/hikma, branche main)
ENV_STATUS       = PARTIAL (2 variables configurées preview+production)
DOMAIN_STATUS    = NOT_CONFIGURED
PREVIEW_STATUS   = DEPLOYED_AND_VALIDATED
PRODUCTION_STATUS = NOT_DEPLOYED (en attente domaine + confirmation)

DATABASE_WRITES = 0 · SECRETS_EXPOSED = 0
```

## PREVIEW VALIDÉ

**URL : `https://hikma-4113eqkxq-lph2os-projects.vercel.app`**

| Vérification | Résultat |
|---|---|
| Routes publiques (/, /surahs, /surahs/1, /surahs/114, /privacy, /terms, /sources, /learn, /login, /forgot-password, /reset-password, /robots.txt, /sitemap.xml) | **200** |
| Route invalide /random-invalid | **404** |
| Routes privées (dashboard/profile/review/activity) | noindex,nofollow + guard |
| /admin | **307** (guard dur) |
| /sources (masquage) | noindex,nofollow ✓ |
| robots.txt | 10 règles Disallow (dont /sources) |
| sitemap.xml | **116 URLs** |
| Headers sécurité | CSP sans unsafe-eval, HSTS preload, nosniff, DENY, referrer-policy |
| Connexion Supabase (anon) | **200 avec données** (ayahs) |
| Contenu | /surahs = catalogue 114 · /surahs/1 = page rendue |
| Canonical | fallback localhost (attendu — domaine non fourni) |

## DÉROULÉ & FINDINGS

1. **Projet créé** (`vercel project add hikma`), **lié** (`.vercel/project.json`, gitignoré), **GitHub connecté** (`vercel git connect` → lph2o/hikma).
2. **Variables configurées** (API, jamais affichées) : `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` → cibles preview + production, chiffrées.
3. **Premier déploiement → ÉCHEC FONCTIONNEL (91-F1)** : projet créé sans preset framework → le build `next build` s'exécute, les statiques répondent (logo 200) mais **aucune route dynamique n'est routée** (404 edge partout). **Fix : `framework=nextjs` (PATCH projet) + redéploiement** → toutes les routes 200.
4. **Deployment Protection Vercel désactivée** : elle redirigeait tout le trafic vers l'auth SSO Vercel (302), y compris les pages publiques et crawlers — incompatible avec une app publique à auth applicative.
5. **Smoke test complet validé** (tableau ci-dessus). Les occurrences « error » sur /surahs/1 étaient des faux positifs (références error boundary dans le payload RSC).

## EN ATTENTE POUR LA PRODUCTION

```
[MANUAL]  Domaine de production + DNS (ex. hikma.app)
[MANUAL]  NEXT_PUBLIC_SITE_URL configurée sur Vercel AVANT le build prod
[MANUAL]  ADMIN_EMAILS (décision — sinon /admin désactivé)
[MANUAL]  Projet Supabase de production + Redirect URLs (dont /reset-password)
[NOT_VERIFIED]  Password reset E2E réel (email)
[NOT_VERIFIED]  Backups / PITR
[MANUAL]  Monitoring / alertes
[NOT_VERIFIED]  Licence audio commerciale (R-009) avant monétisation
[CONFIRMATION]  Votre accord explicite pour la bascule production (vercel --prod)
```

⚠️ L'alias production actuel (`hikma-delta.vercel.app`) pointe encore sur le **premier déploiement cassé** — il ne sera corrigé qu'au déploiement production final.

## VALIDATION

```
TYPECHECK = PASS · LINT = PASS (0 erreur) · VITEST = 1058/1058 · BUILD = PASS
RUNTIME PREVIEW = PASS · DATABASE_WRITES = 0 · SECRETS = 0 exposé
```

## NEXT ACTION

Fournir le **domaine de production** → je configure `NEXT_PUBLIC_SITE_URL` (+ `ADMIN_EMAILS` si souhaité) → **confirmation explicite** → `vercel --prod` → audit post-déploiement sur le vrai domaine (canonical/OG/sitemap/robots en https réel, reset E2E, monitoring).
