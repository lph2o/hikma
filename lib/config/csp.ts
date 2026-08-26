/**
 * Hikma — Security headers (Phase 89G, R-007).
 *
 * Construction PURE des headers de sécurité à partir des origines réellement
 * utilisées par l'application au runtime. Fonctions sans effets de bord,
 * testables unitairement.
 */

/** CDN de récitations audio des versets (Al Quran Cloud). */
export const AUDIO_CDN_ORIGIN = "https://cdn.islamic.network";

/**
 * Construit la valeur CSP.
 *
 * Exceptions documentées :
 * - `script-src 'unsafe-inline'` — requis par le App Router Next.js (scripts
 *   inline de bootstrap du flux RSC). Durcissement par nonces = amélioration
 *   future (middleware + injection de nonce).
 * - `style-src 'unsafe-inline'` — styles inline émis par React/Tailwind.
 * - `wss://<supabaseHost>` — Realtime (réservé, non utilisé aujourd'hui).
 * - `unsafe-eval` en DEV uniquement — exigé par les source maps / outils de
 *   développement Next.js. Jamais en production.
 */
export function buildCsp(supabaseUrl: string, opts: { dev?: boolean } = {}): string {
  let supabaseHost = "";
  try {
    supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "";
  } catch {
    supabaseHost = "";
  }

  const connectSrc = ["'self'", supabaseUrl, supabaseHost ? `wss://${supabaseHost}` : ""].filter(Boolean);

  // media-src couvre DEUX sources audio distinctes :
  //  - cdn.islamic.network → récitations des versets (URLs publiques fixes) ;
  //  - <supabaseUrl>       → audio des MOTS (URLs signées Storage `word-audio`,
  //    `https://<host>/storage/v1/object/sign/...`) — Phase 24F/24H.
  // Sans cette origine, le navigateur bloque la lecture des mots (erreur
  // « Impossible de lire l'audio »), comme constaté au runtime PHASE 91/92.
  const mediaSrc = ["'self'", AUDIO_CDN_ORIGIN, supabaseUrl, "blob:"].filter(Boolean);

  const scriptSrc = opts.dev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    `media-src ${mediaSrc.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export type SecurityHeader = { key: string; value: string };

/**
 * Construit la liste complète des headers de sécurité.
 *
 * @param siteUrl     URL publique du site (NEXT_PUBLIC_SITE_URL) — détermine
 *                    si HSTS s'applique (HTTPS uniquement, jamais en local).
 * @param supabaseUrl URL du projet Supabase (NEXT_PUBLIC_SUPABASE_URL).
 */
export function buildSecurityHeaders({
  siteUrl,
  supabaseUrl,
  dev = false,
}: {
  siteUrl: string;
  supabaseUrl: string;
  dev?: boolean;
}): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: buildCsp(supabaseUrl, { dev }) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    { key: "X-Frame-Options", value: "DENY" },
  ];

  // HSTS uniquement en HTTPS (jamais sur localhost/HTTP).
  if (siteUrl.startsWith("https://")) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
