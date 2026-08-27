import { describe, expect, it } from "vitest";
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/lib/navigation";
import { isAdminEmail } from "@/lib/content-studio/admin";

describe("Admin Navigation & Authorization", () => {
  it("defines standard NAV_ITEMS for all users and ADMIN_NAV_ITEMS exclusively for admins", () => {
    expect(NAV_ITEMS.length).toBe(5);
    const navHrefs = NAV_ITEMS.map((n) => n.href);
    expect(navHrefs).toContain("/dashboard");
    expect(navHrefs).toContain("/learn");
    expect(navHrefs).toContain("/surahs");
    expect(navHrefs).toContain("/review");
    expect(navHrefs).toContain("/profile");

    // Standard NAV_ITEMS never contain admin routes
    expect(navHrefs).not.toContain("/admin");
    expect(navHrefs).not.toContain("/admin/content-studio");

    // ADMIN_NAV_ITEMS contain the 2 admin routes
    expect(ADMIN_NAV_ITEMS.length).toBe(2);
    const adminHrefs = ADMIN_NAV_ITEMS.map((n) => n.href);
    expect(adminHrefs).toContain("/admin/content-studio");
    expect(adminHrefs).toContain("/admin");
  });

  it("isAdminEmail strictly checks against ADMIN_EMAILS environment variable", () => {
    const original = process.env.ADMIN_EMAILS;
    try {
      process.env.ADMIN_EMAILS = "admin@hikma.top, creator@hikma.top";

      expect(isAdminEmail("admin@hikma.top")).toBe(true);
      expect(isAdminEmail("creator@hikma.top")).toBe(true);
      expect(isAdminEmail("ADMIN@HIKMA.TOP")).toBe(true); // Case-insensitive

      // Non-admin emails
      expect(isAdminEmail("user@example.com")).toBe(false);
      expect(isAdminEmail("")).toBe(false);
      expect(isAdminEmail(null)).toBe(false);
      expect(isAdminEmail(undefined)).toBe(false);
    } finally {
      process.env.ADMIN_EMAILS = original;
    }
  });
});
