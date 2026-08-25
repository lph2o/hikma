import type { MetadataRoute } from "next";

/**
 * sitemap.xml (Phase 89E, R-005) : surface publique indexable — landing,
 * catalogue des sourates, et les 114 pages publiques de sourate. Les routes
 * privées sont exclues (elles sont de toute façon protégées par l'auth).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/surahs`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  for (let n = 1; n <= 114; n += 1) {
    entries.push({
      url: `${base}/surahs/${n}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
