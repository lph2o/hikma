# PHASE 91 — CONNECT HIKMA.TOP TO VERCEL — AUDIT

**Mode** : AUDIT-ONLY · `DATABASE_WRITES = 0` · aucune modification appliquée

## ÉTAT ACTUEL (vérifié en direct)

| Élément | État observé |
|---|---|
| Projet Vercel | `hikma` · framework `nextjs` · Node 24.x · branche prod `main` · GitHub `lph2o/hikma` |
| Domaines associés | **aucun** (`domains: []` — `hikma.top` non lié, inconnu de l'API Vercel : 404) |
| Variables Vercel | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (preview+prod) · **`NEXT_PUBLIC_SITE_URL` ABSENTE** |
| Déploiement production | `hikma-hwoo0qu1w` (1er build, avant fix framework) → **alias cassés** : `hikma-delta.vercel.app` / `hikma-lph2os-projects.vercel.app` → 404 partout |
| DNS `hikma.top` | NS Spaceship (`launch1/launch2`) · A records → **parking Spaceship** (`54.149.79.189`, `34.216.117.25`) · pas de www · pas de CNAME · HTTPS inactif (status 000) |
| Repo | `NEXT_PUBLIC_SITE_URL` est env-driven (inlinée au build) — **aucune modification de code requise** |

## VALEURS DNS EXACTES (doc Vercel officielle, à jour)

```
SPACESHIP DNS

Record 1
Type: A
Host: @ (racine)
Value: 76.76.21.21
TTL: 3600 (ou Auto)

Record 2
Type: CNAME
Host: www
Value: cname.vercel-dns-0.com
TTL: 3600 (ou Auto)
```

> Note : ce sont les valeurs générales actuelles de Vercel. Après l'ajout du domaine au projet, `vercel domains inspect hikma.top` affichera les valeurs exactes recommandées pour ce domaine — je les confirmerai avant que vous touchiez au DNS.

**Où le saisir** (Spaceship) : *Dashboard Spaceship → hikma.top → DNS avancé → Gérer les enregistrements DNS* → « Ajouter un enregistrement ».
- Pour le A : Type `A`, Host `@` (ou laisser vide si l'interface utilise le champ « Name »), Value `76.76.21.21`, TTL `3600` ou Auto.
- Pour le CNAME : Type `CNAME`, Host `www`, Value `cname.vercel-dns-0.com`, TTL `3600` ou Auto.

**À SUPPRIMER** : les 2 A records existants (`54.149.79.189` et `34.216.117.25`) — prouvés inutiles (ils servent la page de parking Spaceship, pas Hikma). Le remplacer par le A Vercel.
**À NE PAS SUPPRIMER** : les nameservers `launch1/launch2.spaceship.net` — aucune modification NS nécessaire.

## SÉQUENCE PRÉVUE (après votre autorisation)

1. **Moi** : ajouter `hikma.top` + `www.hikma.top` au projet Vercel (API), configurer la redirection www → apex
2. **Vous** : créer les 2 enregistrements ci-dessus chez Spaceship (remplacer les A de parking)
3. **Moi** : vérifier la propagation + `domains inspect` (Vercel détecte les records)
4. **Moi** : `NEXT_PUBLIC_SITE_URL=https://hikma.top` en production → `vercel --prod` (corrige aussi l'alias cassé)
5. **Moi** : validation complète sur `https://hikma.top` : HTTPS, canonical (insensible aux query params), OG, robots, sitemap, guards privés, CSP
6. **Manuel** : Redirect URLs Supabase (dont `https://hikma.top/reset-password`) + password reset E2E réel
7. **Manuel (post-lancement)** : Google Search Console + Bing Webmaster → ajouter `hikma.top`, vérifier la propriété, soumettre `https://hikma.top/sitemap.xml`

## NOT_VERIFIED

Propagation DNS réelle · certificat TLS (provisionné par Vercel après DNS) · redirection www réelle · Redirect URLs Supabase · password reset E2E · indexation Google/Bing.

## RÈGLE FINALE

```
AUDIT_COMPLETE = YES
PRODUCTION_CHANGES = 0
DATABASE_WRITES = 0
```

Rapport : `reports/phase-91-domain-vercel.json` (validé) + ce résumé. **J'attends votre autorisation** pour l'étape 1 (ajout du domaine côté Vercel), après quoi je vous donnerai le bloc DNS exact confirmé.
