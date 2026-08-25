import { headers } from "next/headers";

/**
 * URL de base du site (serveur uniquement), utilisée pour construire les
 * redirects Auth (ex. lien de réinitialisation de mot de passe).
 *
 * Priorité :
 * 1. `NEXT_PUBLIC_SITE_URL` (domaine de production, cf. .env.example) ;
 * 2. hôte de la requête (`x-forwarded-host` puis `host`) avec le schéma
 *    `x-forwarded-proto` (dev local inclus) ;
 * 3. repli localhost:3000.
 *
 * Aucune URL locale n'est hardcodée dans les actions : l'URL dérive de la
 * requête réelle, donc fonctionne en dev ET en production.
 */
export async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}
