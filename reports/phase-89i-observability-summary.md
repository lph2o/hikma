# PHASE 89I — OBSERVABILITY / ERROR TRACKING — RAPPORT DE PHASE

**VERDICT : `PHASE_89I_COMPLETE`** — R-008 = RESOLVED. **DATABASE_WRITES = 0.**

## Choix du fournisseur

| Solution | Verdict |
|---|---|
| **NATIVE Next.js 16 (retenue)** | Zéro dépendance, zéro donnée hors serveur, CSP inchangée, aucune dépendance consentement (cohérent 89H scénario A) |
| Sentry | Excellent (dashboard/alertes/source maps) mais SDK + DSN + origine CSP + transfert tiers — documenté comme drop-in futur |
| PostHog / Plausible / OTel | Analytics hors périmètre ou sur-dimensionné |

**`RECOMMENDED_ERROR_TRACKING = NATIVE_NEXT16` · `RECOMMENDED_ANALYTICS = NONE`**

## Architecture implémentée (API officielle Next 16.3 vérifiée dans les docs installées)

1. **`instrumentation.ts`** — `register()` (boot) + `onRequestError(error, {path, method}, ctx)` → événement JSON structuré sur stdout (logs plateforme).
2. **`instrumentation-client.ts`** — écouteurs `window.onerror` + `unhandledrejection` avant hydratation.
3. **`app/observability/route.ts`** — POST-only : validation, re-sanitisation serveur, 16 KB max, rate-limit 30/min/IP, journal JSON ; GET → 405.
4. **`app/error.tsx`** — error boundary → `reportClientError` (remplace le console.error local).
5. **`lib/observability/`** — sanitize (pur, testé) + client reporter.

## Données

- **Collectées** : pathname (jamais la query), method/routeType, message/stack tronqués, ts, env, release (commit SHA serveur).
- **Exclues à jamais** : cookies, headers, tokens/JWT, query string, corps de requête, email, userId, progression, réponses pédagogiques, session replay.

## Validation

```
BUILD      = PASS            TYPECHECK = PASS (0 erreur)     LINT = PASS (0 erreur)
VITEST     = 1030/1030 PASS  (1018 existants + 12 tests sanitisation/rate-limit)
RUNTIME    = boot loggé · POST valide 200 (token=[REDACTED], query supprimée, champ inconnu ignoré)
             POST invalide 400 · GET 405 · 31e requête 429 · CSP connect-src inchangée
SECRETS    = aucun (scan des nouveaux fichiers)
```

## Alerting

P0 (indisponibilité) / P1 (explosion d'erreurs, auth cassée) / P2 (récurrente) — à configurer sur les logs de la plateforme de déploiement (hors périmètre, dépend du fournisseur).

## NOT VERIFIED / DISCOVERED / RISQUES

- **NOT_VERIFIED** : comportement navigateur réel (pas d'E2E) ; configuration des alertes plateforme.
- **DISC-005** : `global-error.tsx` absent (boundary du layout racine) — recommandé en phase UX.
- **RISK-89I-001 (LOW)** : rate-limit mémoire par process (multi-instance = compteurs séparés).
- **RISK-89I-002 (NOTE)** : visibilité = logs plateforme — activer l'ingestion avant lancement.

## Prochaine phase

`PHASE_89J_DEPLOY_DRY_RUN` (alerting plateforme, config déploiement) — R-009 (licence audio) reste NOT_VERIFIED. Rapports : `reports/phase-89i-observability.json` + `-summary.md`.
