import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APP_HOME_HREF, NAV_ITEMS } from "@/lib/navigation";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

describe("navigation — source unique des routes", () => {
  it("le logo Hikma renvoie vers l'accueil applicatif /dashboard", () => {
    expect(APP_HOME_HREF).toBe("/dashboard");
  });

  it("l'item « Accueil » pointe vers /dashboard", () => {
    const accueil = NAV_ITEMS.find((i) => i.label === "Accueil");
    expect(accueil?.href).toBe("/dashboard");
  });

  it("l'item « Sourates » pointe vers /surahs (catalogue Phase 30)", () => {
    const sourates = NAV_ITEMS.find((i) => i.label === "Sourates");
    expect(sourates?.href).toBe("/surahs");
  });

  it("les 5 routes principales sont présentes et uniques", () => {
    expect(NAV_ITEMS.map((i) => i.href)).toEqual([
      "/dashboard",
      "/learn",
      "/surahs",
      "/review",
      "/profile",
    ]);
    expect(new Set(NAV_ITEMS.map((i) => i.href)).size).toBe(NAV_ITEMS.length);
  });
});

describe("PHASE 96 — bottom nav flottante + typographie des liens", () => {
  const nav = read("components/app/app-nav.tsx");
  const globals = read("app/globals.css");

  it("barre flottante : pilule arrondie, marges, safe-area, élévation L3/L4", () => {
    expect(nav).toContain("rounded-[1.75rem]");
    expect(nav).toContain("border-border-subtle");
    expect(nav).toContain("bg-popover/95");
    expect(nav).toContain("shadow-elevated");
    expect(nav).toContain("backdrop-blur-md");
    expect(nav).toContain("env(safe-area-inset-bottom)");
    expect(nav).toContain("max-w-md");
  });

  it("les 5 items conservent aria-current et des zones tactiles ≥ 44px", () => {
    expect(NAV_ITEMS).toHaveLength(5);
    expect(nav).toContain("aria-current={active ? \"page\" : undefined}");
    expect(nav).toContain("min-h-11");
    expect(nav).toContain("min-w-11");
  });

  it("état actif mobile en pilule teal, état actif desktop (sidebar) inchangé", () => {
    expect(nav).toContain("bg-primary/10 text-primary-strong");
    expect(nav).toContain("bg-surface-interactive text-primary-strong");
  });

  it("plus AUCUN soulignement automatique des liens UI (règle globale retirée)", () => {
    expect(globals).toContain("text-decoration: none;");
    expect(globals).not.toContain(":not([data-no-hover-underline])");
  });
});
