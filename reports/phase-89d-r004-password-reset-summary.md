# PHASE 89D — R-004 Password Reset — Résumé

## VERDICT

```
PHASE_89D_COMPLETE
DATABASE_TABLE_WRITES = 0
```

## ROOT CAUSE

Aucun appel à `resetPasswordForEmail` / `updateUser` dans le projet (recherche globale) : un utilisateur qui oubliait son mot de passe était **définitivement bloqué**. Seule `/login` existait dans le groupe `(auth)`.

## IMPLEMENTATION

| Fichier | Rôle |
|---|---|
| `lib/auth/password-reset.ts` (nouveau) | Logique pure injectable : validations, `hasRecoverySession` (amr session **ou** JWT), noyaux `requestPasswordResetCore` / `updatePasswordCore`, message neutre anti-énumération |
| `lib/auth/site-url.ts` (nouveau) | URL de base pour les redirects : `NEXT_PUBLIC_SITE_URL` → hôte de la requête → localhost (aucune URL hardcodée) |
| `lib/learning/actions.ts` | Actions serveur `requestPasswordReset` (resetPasswordForEmail + redirectTo) et `updatePassword` (exige une session de récupération) |
| `components/app/forgot-password-form.tsx` | Formulaire client (useActionState), message neutre |
| `components/app/reset-password-form.tsx` | Échange du code PKCE, nettoyage de l'URL, vérification recovery, password + confirmation, états lien-invalide/succès |
| `app/(auth)/forgot-password/page.tsx` + `app/(auth)/reset-password/page.tsx` | Pages dédiées (layout auth existant) |
| `components/app/login-form.tsx` | Lien « Mot de passe oublié ? » |
| `.env.example` | `NEXT_PUBLIC_SITE_URL` documentée |

## AUTH FLOW

```
login → « Mot de passe oublié ? » → email → resetPasswordForEmail(redirectTo=<siteUrl>/reset-password)
→ lien email → /reset-password?code=… → exchangeCodeForSession (PKCE) + URL nettoyée
→ vérification session recovery (amr) → nouveau mot de passe + confirmation
→ updatePassword (action serveur, re-vérifie recovery) → updateUser({ password })
→ « Ton mot de passe a été modifié » → tableau de bord
```

## SECURITY

- **Account enumeration** : PASS — message neutre identique (existant/inexistant), erreur d'envoi générique.
- **Token handling** : PASS — code retiré de l'URL, jamais affiché/loggé ; aucun token dans les erreurs (testé).
- **Recovery session** : PASS — `updatePassword` refuse toute session sans `amr = recovery` ; `hasRecoverySession` lit `amr` sur la session puis dans le JWT (robuste aux versions supabase-js).
- **Redirect security** : PASS — `redirectTo` construit depuis l'env ou l'hôte de la requête, chemin fixe `/reset-password`.
- **Utilisateur déjà connecté** : `/forgot-password` → redirigé ; `/reset-password` en session normale → `/dashboard`.

## TESTS

```
BUILD      = PASS          TYPECHECK = PASS (0 erreur)
LINT       = PASS (0 erreur)
VITEST     = 1008/1008 PASS  (+25 tests unitaires password-reset)
RUNTIME    = /forgot-password 200 (formulaire) · /reset-password sans code 200 (lien invalide)
             /login contient le lien · /dashboard et /admin toujours protégés (régression 89B intacte)
```

## DATABASE

```
DATABASE_TABLE_WRITES = 0
```

## NOT VERIFIED

- Réception réelle de l'e-mail de récupération (boîte mail indisponible).
- Échange réel du code PKCE + `amr=recovery` sur le projet réel.
- **`PASSWORD_RESET_E2E = NOT_VERIFIED`** — à exécuter avant mise en ligne avec un compte de test dédié.
- Configuration Supabase Dashboard à faire manuellement : Redirect URLs += `<siteUrl>/reset-password` ; template « Reset password » vers `/reset-password`.

## DISCOVERED

- **DISC-002** : aucun parcours « changer mon mot de passe » depuis `/profile` (hors périmètre ; recommandé plus tard).

## NEXT PHASE

```
NEXT_PHASE = PHASE_89E_PUBLIC_WEB_SEO
NEXT_RISK  = R-005_SEO (metadata, robots, sitemap, OG) + R-011 / R-012
```
