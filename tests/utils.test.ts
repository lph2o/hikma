import { describe, expect, it } from "vitest";
import { isPathActive } from "../lib/utils";

describe("isPathActive (navigation)", () => {
  it("accueil : actif uniquement sur /dashboard exactement", () => {
    expect(isPathActive("/dashboard", "/dashboard")).toBe(true);
    expect(isPathActive("/learn", "/dashboard")).toBe(false);
    expect(isPathActive("/dashboard/", "/dashboard")).toBe(false);
  });

  it("une route imbriquée active son entrée parente", () => {
    expect(isPathActive("/learn/basmala", "/learn")).toBe(true);
    expect(isPathActive("/learn/units/al-fatiha", "/learn")).toBe(true);
  });

  it("une route parente n'active pas une autre entrée", () => {
    expect(isPathActive("/dashboard", "/learn")).toBe(false);
    expect(isPathActive("/profile", "/learn")).toBe(false);
  });

  it("une route similaire sans séparateur n'est pas active", () => {
    // /learned ne doit pas activer /learn
    expect(isPathActive("/learned", "/learn")).toBe(false);
  });
});
