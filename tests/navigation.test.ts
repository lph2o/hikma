import { describe, expect, it } from "vitest";
import { APP_HOME_HREF, NAV_ITEMS } from "@/lib/navigation";

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
