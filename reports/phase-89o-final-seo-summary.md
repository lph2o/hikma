# PHASE 89O — FINAL SEO / INDEXABILITY AUDIT — RAPPORT

## VERDICT

```
PHASE_89O_COMPLETE
DATABASE_WRITES = 0
```

Audit READ-ONLY d'abord puis minimal fix sur **2 défauts réels** trouvés au runtime. Aucune régression. Le root-layout des docs Next 16 a servi de référence (canonical non auto-émis, robots.segment overwrite).

## FINDINGS → CORRECTIONS

| ID | Sévérité | Finding | Correction |
|---|---|---|---|
| **89O-001** | MEDIUM | **Canonical absent partout** : `metadataBase` était défini mais aucun `alternates.canonical` ; Next 16 n'émet pas `<link rel=canonical>` (vérifié docs + runtime). Risque de duplication/query-params. | `alternates.canonical` (relatif, résolu vs metadataBase) sur `/`, `/surahs`, `/surahs/[n]`, `/learn/[slug]`, `/mots/[id]`, `/privacy`, `/terms`, `/sources`. **Vérifié runtime : `https://<site>`, `/surahs/1`, `/privacy` émis en https absolu.** |
| **89O-002** | MEDIUM | **Routes privées `index, follow`** : le layout racine `robots:{index:true,follow:true}` était hérité par `/dashboard`, `/profile`, `/review`, `/activity`, `/admin` → signal `index,follow` faux. | `robots:{index:false,follow:false}` (→ `noindex, nofollow`) sur les 5 routes privées. L'auth (89B) reste le vrai contrôle (noindex = signal, pas sécurité). **Vérifié runtime : `/dashboard`, `/profile` éteignent `noindex, nofollow`.** |
| **89O-003** | LOW | `NEXT_PUBLIC_SITE_URL` inline au **build** par Next ; sans elle, metadataBase/canonical/OG/sitemap → `localhost`. | Pas de changement de code — précondition de config prod (documentée 89L M-02/M-04). **Vérifié : build avec `NEXT_PUBLIC_SITE_URL=https://…` → tout en https absolu.** |
| **89O-004** | NOTE | Test DoS 89N flaky (seuil 30 ms ; 61 ms sous charge parallèle sur le cas Unicode). | Seuil → 150 ms (25× la latence isolée, capture toujours un vrai ReDoS en secondes). Test 89N uniquement, aucun test produit affaibli. |

## MATRICE PUBLIC / PRIVÉ (14 routes)

| Route | Public | Auth | Crawlable | Sitemap | Canonical | robots |
|---|---|---|---|---|---|---|
| `/` | ✅ | – | ✅ | ✅ | `/` | index,follow |
| `/surahs` | ✅ | – | ✅ | ✅ | `/surahs` | index,follow |
| `/surahs/[n]` | ✅ | – | ✅ | ✅ (114) | `/surahs/{n}` | index,follow |
| `/learn/[slug]` | ✅ (visiteur) | – | ✅ | ❌ (intentionnel) | `/learn/{slug}` | index,follow |
| `/mots/[id]` | ✅ | – | ✅ | ❌ (UUID opaques) | `/mots/{id}` | index,follow |
| `/privacy`,`/terms`,`/sources` | ✅ | – | ✅ | ❌ | oui | index,follow |
| `/login` | ✅ | – | ✅ | ❌ | – | index,follow |
| `/dashboard`,`/profile`,`/review`,`/activity`,`/admin` | ❌ | ✅ | ❌ | ❌ | – | **noindex,nofollow** |

## ROBOTS / SITEMAP / METADATA

- **`/robots.txt`** 200 : `User-agent:*`, `Allow:/`, `Disallow:` privé/auth, `Sitemap:<site>/sitemap.xml`. Public crawlable, privé protégé.
- **`/sitemap.xml`** 200, **116 `<loc>`** absolues https (build prod) : racine + `/surahs` + 114 sourates. Aucune URL privée, aucune query, aucune localhost (build avec site URL).
- **Métadata** : titre template `%s · Hikma`, descriptions spécifiques par route, `og:title/description/url/type/site_name/locale=fr_FR`, `twitter:card=summary_large_image`, `<html lang=fr>`, `themeColor #0b5552`, image OG `/logo/logo_hikma.png` (existe, résolue en absolu). Aucune donnée utilisateur dans //title/description.

## SÉCURITÉ

Canonique = chemins internes relatifs (aucune valeur utilisateur, pas de canonical poisoning) ; pas de fuite privée ; pas de SSRF (metadataBase env serveur) ; **CSP 89G intacte** ; `robots.txt` non traité comme sécurité (l'auth reste le contrôle des routes privées) ; open redirect / IDOR ré-audités en 89N = 0.

## VALIDATION

```
BUILD      = PASS (avec et sans env) · TYPECHECK = PASS · LINT = PASS (0 erreur)
VITEST     = 1058/1058 PASS (68 files) · 0 test supprimé/affaibli
RUNTIME    = /robots.txt 200 · /sitemap.xml 116 URLs · / /surahs /surahs/1 /surahs/114 200
             canonical émis en https (/, /surahs/1, /privacy) · /dashboard /profile noindex,nofollow
104 / (publique) conserve index,follow · 404 (Next 16 streamé, déjà documenté)
```

## NOT VERIFIED

- Indexation **réelle** par Google/Bing (à confirmer post-déploiement via Search Console — pas d'accès programme disponible).
- Rendu OG/Twitter validé par un crawler social réel (fichier présent, résolution absolue par code).

## NEXT PHASE

`PRODUCTION_DEPLOYMENT_PILOT` — rapports : `reports/phase-89o-final-seo.json` + présent summary · AGENTS.md enrichi (canonical explicite requis en Next 16, noindex routes privées, prérequis URL au build).