# PHASE 89H — COOKIE CONSENT / PRIVACY UX & COMPLIANCE — RAPPORT

**VERDICT : `PHASE_89H_AUDIT_COMPLETE_IMPLEMENTATION_RECOMMENDED`** — audit + conception uniquement. **DATABASE_WRITES = 0.** Aucun fichier de production modifié.

## 1. Résumé exécutif

Hikma n'utilise **qu'un seul cookie**, le cookie de session d'authentification `sb-<ref>-auth-token` (Supabase Auth via `@supabase/ssr`), **strictement nécessaire** à la fourniture du service. **Aucun traceur, aucune analytics, aucun stockage local, aucun script tiers.** Le CDN audio (cdn.islamic.network) ne dépose **aucun cookie** (vérifié au runtime : pas de Set-Cookie).

→ **SCÉNARIO A** : un gros CMP marketing serait **inutile et trompeur**. La solution correcte est une **notice informative minimale premium** (+ mention du cookie dans /privacy), avec un store de consentement **versionné et future-proof** pour les évolutions V2 (analytics exempté) / V3 (monétisation) / V4 (marketing).

## 2. Inventaire technique réel

| Élément | Constat | Preuve |
|---|---|---|
| Cookies | 1 : `sb-<ref>-auth-token` (session, first-party, path=/, sameSite=lax, maxAge 400 j) | lib/supabase/* + constants.js @supabase/ssr |
| localStorage/sessionStorage/indexedDB | Aucun usage | grep exhaustif |
| Analytics/tracking/pixels | Aucun (code + dépendances) | grep + package.json |
| Scripts tiers / iframes | Aucun | audit 89G |
| Fonts | Auto-hébergées (next/font/google) | app/layout.tsx |
| CDN audio | Lecture média, **zéro cookie** | curl : pas de Set-Cookie |
| Supabase | API fetch + cookie de session first-party | lib/supabase/* |

## 3. Classification juridique (sources officielles)

- **Cookie de session = exempté de consentement** : strictement nécessaire à la fourniture du service demandé — Art. 82 Loi Informatique et Libertés / Art. 5(3) ePrivacy. *(CNIL « que dit la loi » ; EDPB Guidelines 2/2023, final 10/2024)*
- **Mais information préalable obligatoire** même pour les cookies nécessaires → d'où la notice + mention dans /privacy.
- **Règle d'équivalence** si un jour consentement requis : refuser aussi simple qu'accepter, pas de « poursuite de navigation = consentement » (CJUE Planet49). *(CNIL lignes directrices 2020 ; CNIL « refuser aussi simplement qu'accepter », 12/2021)*
- **Exemption mesure d'audience** (pour un futur analytics) : finalité limitée, données anonymes, pas de recoupement/cross-site, durée ≤ 13 mois, conservation ≤ 25 mois. *(CNIL « Cookies : solutions pour les outils de mesure d'audience », 04/07/2025)*
- ⚠️ Analyse documentaire — **validation juridique professionnelle requise** avant mise en ligne.

## 4. Ce qui nécessite réellement un consentement

**Rien aujourd'hui.** (Ce qui n'en nécessite pas : cookie de session, CDN audio, fonts, Supabase.)

## 5. Concept Hikma recommandé

**Notice informative premium à 1 niveau** (pas de CMP) :

- Desktop : carte flottante discrète en coin · Mobile : bottom sheet (safe-areas) · RTL : miroir complet.
- Texte : « Hikma n'utilise pas de traceurs — un seul cookie, celui de ta connexion. » + boutons **« Comprendre »** (→ /privacy) / **« Fermer »** — aucune acceptation à hiérarchiser, donc aucun dark pattern possible.
- **Gold réservé à la décoration** (jamais pour « accepter ») ; teal pour les actions.
- Animation 200–300 ms, fade + translate, `prefers-reduced-motion`.
- **Store de consentement versionné** `hikma:consent:v1` (localStorage) + catégories prêtes (necessary / audience / external content) → V2/V3/V4 sans réécriture.
- **Retrait** : lien footer + /privacy, modification possible à tout moment.

## 6. Microcopy (variantes proposées)

- Titres : « Ta vie privée, simplement » · « Un seul cookie, pour ton compte » · « Hikma n'utilise pas de traceurs »
- Descriptions : version transparente sur le cookie de session unique et l'absence de publicité/tracking.
- Boutons explicites : « Comprendre » · « Voir la politique » · « Fermer » — jamais « OK », « Continuer » ou « Je comprends ».

## 7. Dark-pattern review

**PASS** — aucune asymétrie (il n'y a ni accepter ni refuser), gold non manipulatoire, wording explicite. Obligations futures documentées si un CMP devenait nécessaire.

## 8. Risques

- **RISK-89H-001 (LOW)** : cookie de session `httpOnly=false` (défaut @supabase/ssr) — atténué par la CSP `script-src 'self'` et l'absence de contenu non échappé. À surveiller.
- **RISK-89H-002 (NOTE)** : maxAge 400 j du cookie (défaut) — acceptable pour un cookie nécessaire.

## 9. NOT VERIFIED

- Comportement navigateur réel (BROWSER_RUNTIME = NOT_AVAILABLE — inventaire par code + vérifications réseau).
- Avis juridique professionnel.
- Page « politique cookie » dédiée — inutile en scénario A, à réévaluer si traceur ajouté.

## 10. Checklist d'implémentation future (phase 89H-I, séparée)

- [ ] Composant client `ConsentNotice` (notice 1 niveau, desktop/mobile/RTL, a11y, reduced-motion)
- [ ] Store `hikma:consent:v1` versionné + catégories prêtes (sans les utiliser)
- [ ] Mention du cookie de session dans /privacy (info préalable)
- [ ] Tests : rendu, fermeture, RTL, a11y, aucune requête tierce au chargement
- [ ] E2E navigateur (89I) : landing → login → session intacte, aucune requête interdisable

## 11. Prochaine phase

**PHASE_89H_I — IMPLEMENTATION** (notice + store versionné), puis **PHASE_89I_BROWSER_E2E**. Rapports : `reports/phase-89h-cookie-consent-audit.json` (+ inventaire inclus, fichier séparé non nécessaire).
