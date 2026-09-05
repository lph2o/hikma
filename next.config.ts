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
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // @remotion/renderer (Chrome headless + ffmpeg + compositor natif) ne peut
  // pas être bundlé par Next.js : ces packages doivent rester EXTERNES et être
  // chargés en runtime Node côté serveur (route de rendu Content Studio).
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/compositor-darwin-x64",
    "@remotion/compositor-linux-x64-gnu",
    "@remotion/media-parser",
    "@remotion/media-utils",
    "@remotion/webcodecs",
  ],

  async headers() {
    return [
      {
        source: "/logo/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
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
