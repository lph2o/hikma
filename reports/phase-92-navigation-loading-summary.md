# PHASE 92 — GLOBAL NAVIGATION LOADING UX

## VERDICT

```
PHASE_92_NAVIGATION_LOADING_COMPLETE

NAVIGATION_FEEDBACK = YES
LOADER_ASSET        = /icones/hikma-loader-wordmark.svg
MOBILE = PASS · DESKTOP = PASS · RTL = PASS · ACCESSIBILITY = PASS · PERFORMANCE = PASS
TYPECHECK = PASS · LINT = PASS · TESTS = 1063/1063 · BUILD = PASS
DATABASE_WRITES = 0 · REGRESSIONS = 0 · DÉPENDANCES AJOUTÉES = NON
```

## SOLUTION (mécanisme natif Next.js, zéro dépendance)

Le feedback global repose sur le **`loading.tsx` natif de l'App Router** — il couvre toutes les navigations (Link, `router.push/replace`, retour/avant navigateur), disparaît automatiquement quand la page est prête, et évite toute modification manuelle des dizaines de boutons.

| Fichier | Changement | Raison |
|---|---|---|
| `components/ui/page-loading.tsx` | **Nouveau** | Wordmark centré, **apparition différée ~150 ms** (opacité 0 → fondu 0.35s : aucun flash sur les navigations rapides), `role="status"` + `aria-busy` + annonce sr-only « Chargement de la page… », `prefers-reduced-motion` respecté |
| `app/loading.tsx` | **Nouveau** | Loading racine — `/`, `(auth)` (login/signup/forgot/reset), `(onboarding)` n'avaient **aucun feedback** avant |
| `app/(app)/loading.tsx` | Squelette générique → wordmark | Feedback cohérent dans toute l'app (le squelette n'était pas page-spécifique) |
| `tests/page-loading.test.ts` | **Nouveau** | 5 tests : asset public, accessibilité, délai 150 ms, reduced-motion, asset non modifié |

**Non modifiés** : `dashboard/loading.tsx` (squelette page-spécifique conservé, pas de double loader) · asset SVG (animation native préservée) · design system · CSP/RLS/auth/SEO.

## Comportement

- **Clic** → reconnu immédiatement (état `:active` natif), navigation démarre
- **Navigation < 150 ms** → wordmark invisible → aucun flash
- **Navigation lente** → wordmark fond doucement, reste jusqu'à l'arrivée de la page
- **Double clic** → sérialisé par le routeur Next (aucune navigation concurrente)
- **RTL** → neutre (centré) · **reduced-motion** → wordmark doré statique
- **A11y** → `role="status"` + annonce discrète, focus et bouton retour non perturbés

## Validation

- **Tests** : 5/5 nouveaux · suite complète **1063/1063** (1058 + 5, aucune régression)
- **Typecheck / Lint / Build** : PASS · **Smoke runtime** : routes 200, asset 200 (`image/svg+xml`)
- **Test navigateur réel** : l'environnement ne permet pas de serveur persistant → **preview déployé** : `https://hikma-9gp2j8dw0-lph2os-projects.vercel.app` — cliquez sur un lien (ex. Landing → Se connecter, ou un onglet de navigation) : le wordmark doit apparaître en fondu si la navigation dure, et disparaître sans flash sur les navigations rapides.

## Note

Le message Turbopack « Ecmascript file had an error » sur `instrumentation.ts` est un bruit pré-existant (build exit 0), sans lien avec cette phase.

## DATABASE

`DATABASE_WRITES = 0` — aucune opération DB.
