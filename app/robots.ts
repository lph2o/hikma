import type { MetadataRoute } from "next";

/**
 * robots.txt (Phase 89E, R-005) : les pages publiques (landing, sourates,
 * leçons, mots) sont indexables ; les espaces privés/authentification sont
 * exclus de l'indexation.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/profile",
        "/review",
        "/activity",
        "/admin",
        "/onboarding",
        "/login",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
