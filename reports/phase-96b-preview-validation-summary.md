# PHASE 96B — VERCEL PREVIEW VALIDATION

## VERDICT

```
PHASE_96B_PREVIEW_COMPLETE
VERCEL_PREVIEW_URL = https://hikma-bdltg6wo4-lph2os-projects.vercel.app
PRODUCTION_DEPLOYED = NO
PRODUCTION_DOMAIN_CHANGED = NO

TYPECHECK = PASS · LINT = PASS (0 erreur, 20 warnings préexistants)
BUILD = PASS · TESTS = 1084/1084

BOTTOM_NAV = PASS · UI_LINK_UNDERLINE = PASS · MOBILE_RESPONSIVE = PASS
SAFE_AREA = PASS · LEARNING_FLOW = PASS · DESKTOP = PASS

DATABASE_WRITES = 0 · MIGRATIONS = 0 · REGRESSIONS = 0
P0 = 0 · P1 = 0 · P2 = 0
```

## 1. Audit avant déploiement

- Branche `main`, projet Vercel déjà lié (`.vercel/project.json` → `hikma`, team `lph2os-projects`) — **aucun nouveau projet créé**.
- Env requises : 3 (SITE_URL, SUPABASE_URL, ANON_KEY) — **3/3 disponibles en Preview**, `MISSING = 0`. Service-role key absente du runtime (scripts CLI uniquement). Aucune valeur secrète affichée.
- Le CLI `vercel` lisait mal `~/.vercel/auth.json` ("Logged out") alors que le token est valide (API → `lph2o`, 200) — contournement : `VERCEL_TOKEN` lu depuis le fichier, jamais affiché.

## 2. Déploiement Preview (jamais --prod)

`vercel --yes` → **https://hikma-bdltg6wo4-lph2os-projects.vercel.app** (Ready en 52s). Le CLI confirme lui-même que la production (`hikma.top`) n'est pas concernée. **Aucun `vercel --prod` exécuté, aucune variable/domaine production modifié.**

## 3. Tests réels sur le preview

### Routes
`/`, `/login`, `/surahs`, `/surahs/1`, `/dashboard` (guard auth), `/robots.txt` (Disallow privées), `/sitemap.xml` (116 URLs) → 200 · `/random-invalid` → 404.

### Bottom nav mobile (session authentifiée réelle, mesures Chrome headless)

| Largeur | Pill (marges 12px) | 5 items | Actif | Overflow |
|---|---|---|---|---|
| 360 | 12→348, radius 28px, cream 95%, blur 12px, shadow | 61×52px | Accueil (teal 10%) | 0 |
| 390 | 12→378, idem | 67×52px | Accueil | 0 |
| 430 | 12→418, idem | 75×52px | Accueil | 0 |

Analyse pixel du screenshot : marges confirmées (fond ivoire des deux côtés de la pill), coins arrondis. Safe-area : `pb-[max(env(safe-area-inset-bottom),0.75rem)]`. Zones tactiles ≥ 52px.

### Soulignements (hover réel)
Nav → `none` · carte leçon → `none` · liens éditoriaux → `hover:underline` explicite **préservé** (login, forgot/reset, cookie-notice, landing).

### Page leçon (`/learn/basmala`, authentifié)
Nav masquée (`display: none`) · **barre sticky présente au bas du viewport** (Phase 95 intacte) · 0 overflow.

### Desktop (1440, /dashboard)
Sidebar visible · bottom nav absente · `main` pb 40px (`md:pb-10`, pas de `pb-28` desktop) · 0 overflow.

### Note d'architecture
La coquille (nav + sidebar) n'apparaît que pour les **connectés** (layout `(app)`) — un anonyme sur `/surahs`/`/learn` n'a pas de nav : design existant, inchangé par la phase.

## 4. Production

Vérifié : aucun `vercel --prod`, `hikma.top` intact, aucun alias/domaine/variable Production modifié. Le preview est strictement séparé.

## 5. Limites

Validation visuelle humaine sur téléphone réel non effectuée (environnement headless) — recommandée avant la décision de production. Le preview partage la même base Supabase que la production : aucun accès en écriture effectué (`DATABASE_WRITES = 0`), login de mesure uniquement.
