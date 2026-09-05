import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin/auth";
import type {
  AdminOverviewMetrics,
  AdminAttentionMetrics,
  AdminDailyActivity,
} from "@/lib/admin/metrics";

describe("Admin Foundation & Contracts", () => {
  it("isAdminEmail behaves identically when imported from @/lib/admin/auth", () => {
    const original = process.env.ADMIN_EMAILS;
    try {
      process.env.ADMIN_EMAILS = "superadmin@hikma.top, team@hikma.top ";

      expect(isAdminEmail("superadmin@hikma.top")).toBe(true);
      expect(isAdminEmail("team@hikma.top")).toBe(true);
      expect(isAdminEmail("SUPERADMIN@HIKMA.TOP")).toBe(true);
      expect(isAdminEmail("TEAM@HIKMA.TOP")).toBe(true);

      expect(isAdminEmail("other@hikma.top")).toBe(false);
      expect(isAdminEmail("")).toBe(false);
      expect(isAdminEmail(null)).toBe(false);
      expect(isAdminEmail(undefined)).toBe(false);
    } finally {
      process.env.ADMIN_EMAILS = original;
    }
  });

  it("handles empty or missing ADMIN_EMAILS environment variable safely", () => {
    const original = process.env.ADMIN_EMAILS;
    try {
      delete process.env.ADMIN_EMAILS;
      expect(isAdminEmail("any@example.com")).toBe(false);

      process.env.ADMIN_EMAILS = "";
      expect(isAdminEmail("any@example.com")).toBe(false);

      process.env.ADMIN_EMAILS = "   ";
      expect(isAdminEmail("any@example.com")).toBe(false);
    } finally {
      process.env.ADMIN_EMAILS = original;
    }
  });

  it("verifies the AdminOverviewMetrics contract structure", () => {
    const sample: AdminOverviewMetrics = {
      totalUsers: 42,
      activeUsers7d: 15,
      newUsers7d: 5,
      sessions7d: 38,
      lessonsPublished: 547,
      coveragePercent: 28.6,
      totalQuranWords: 21296,
      validatedQuranWords: 6095,
    };

    expect(sample.totalUsers).toBe(42);
    expect(sample.activeUsers7d).toBe(15);
    expect(sample.coveragePercent).toBe(28.6);
  });

  it("verifies the AdminAttentionMetrics contract structure", () => {
    const sample: AdminAttentionMetrics = {
      rendersFailed: 0,
      rendersPending: 2,
      contentReview: 1,
      lessonsDraft: 0,
    };

    expect(sample.rendersFailed).toBe(0);
    expect(sample.rendersPending).toBe(2);
  });

  it("verifies the AdminDailyActivity contract structure", () => {
    const sample: AdminDailyActivity = {
      date: "2026-09-01",
      dayLabel: "01/09",
      lessonsCompleted: 12,
      wordsStudied: 45,
      activeUsers: 8,
      newUsers: 2,
    };

    expect(sample.date).toBe("2026-09-01");
    expect(sample.lessonsCompleted).toBe(12);
  });
});
