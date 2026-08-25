import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./lib/config/csp";

/**
 * Hikma — configuration de production (Phase 89G, R-007).
 *
 * Security headers appliqués globalement, construits par le module pur
 * `lib/config/csp.ts` (testé unitairement). Voir ce module pour la
 * justification de chaque directive CSP.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
          // Source maps / outils de dev Next.js exigent unsafe-eval ; prod reste stricte.
          dev: process.env.NODE_ENV === "development",
        }),
      },
    ];
  },
};

export default nextConfig;
