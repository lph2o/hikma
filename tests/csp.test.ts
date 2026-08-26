import { describe, expect, it } from "vitest";
import { buildCsp, buildSecurityHeaders, AUDIO_CDN_ORIGIN } from "../lib/config/csp";

const SUPABASE = "https://xyzcompany.supabase.co";

describe("buildCsp", () => {
  it("ne contient aucun wildcard global", () => {
    const csp = buildCsp(SUPABASE);
    expect(csp).not.toMatch(/\s\*\s/);
    expect(csp).not.toContain("'*'");
  });

  it("contient object-src 'none', frame-ancestors 'none', base-uri et form-action 'self'", () => {
    const csp = buildCsp(SUPABASE);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("autorise l'origine Supabase dans connect-src (avec wss réservé)", () => {
    const csp = buildCsp(SUPABASE);
    expect(csp).toContain(`connect-src 'self' ${SUPABASE} wss://xyzcompany.supabase.co`);
  });

  it("autorise le CDN audio (versets) ET l'origine Supabase (audio des mots) dans media-src uniquement", () => {
    const csp = buildCsp(SUPABASE);
    // Versets : CDN public. Mots : URLs signées Storage Supabase.
    expect(csp).toContain(`media-src 'self' ${AUDIO_CDN_ORIGIN} ${SUPABASE} blob:`);
    expect(csp).not.toContain(`connect-src 'self' ${AUDIO_CDN_ORIGIN}`);
    // Le CDN audio ne doit jamais apparaître dans connect-src.
    expect(csp).not.toContain(`connect-src 'self' ${AUDIO_CDN_ORIGIN}`);
  });

  it("reste robuste sans Supabase configuré (dev sans env)", () => {
    const csp = buildCsp("");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("wss://");
  });

  it("n'ajoute unsafe-eval qu'en dev, jamais en production", () => {
    expect(buildCsp(SUPABASE)).not.toContain("unsafe-eval");
    expect(buildCsp(SUPABASE, { dev: true })).toContain("unsafe-eval");
  });
});

describe("buildSecurityHeaders", () => {
  it("applique les headers de base sur toute route", () => {
    const headers = buildSecurityHeaders({ siteUrl: "https://hikma.app", supabaseUrl: SUPABASE });
    const keys = headers.map((h) => h.key);
    expect(keys).toEqual([
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "X-Frame-Options",
      "Strict-Transport-Security",
    ]);
    expect(headers.find((h) => h.key === "X-Content-Type-Options")?.value).toBe("nosniff");
    expect(headers.find((h) => h.key === "X-Frame-Options")?.value).toBe("DENY");
  });

  it("active HSTS uniquement en HTTPS", () => {
    const https = buildSecurityHeaders({ siteUrl: "https://hikma.app", supabaseUrl: SUPABASE });
    expect(https.some((h) => h.key === "Strict-Transport-Security")).toBe(true);

    const http = buildSecurityHeaders({ siteUrl: "http://localhost:3000", supabaseUrl: SUPABASE });
    expect(http.some((h) => h.key === "Strict-Transport-Security")).toBe(false);
  });

  it("ne produit aucun header dupliqué", () => {
    const headers = buildSecurityHeaders({ siteUrl: "https://hikma.app", supabaseUrl: SUPABASE });
    const keys = headers.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("ne propage unsafe-eval en dev qu'au travers de la CSP", () => {
    const prod = buildSecurityHeaders({ siteUrl: "https://hikma.app", supabaseUrl: SUPABASE });
    const dev = buildSecurityHeaders({ siteUrl: "https://hikma.app", supabaseUrl: SUPABASE, dev: true });
    expect(prod.find((h) => h.key === "Content-Security-Policy")?.value).not.toContain("unsafe-eval");
    expect(dev.find((h) => h.key === "Content-Security-Policy")?.value).toContain("unsafe-eval");
  });
});
