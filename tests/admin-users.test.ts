import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin/auth";
import type {
  AdminUserListItem,
  AdminUsersListResponse,
  AdminUserDetail,
} from "@/lib/admin/metrics";

describe("Admin Users Management — Contracts & Logic", () => {
  it("identifies thiamabda@gmail.com as the sole admin in user list items", () => {
    const original = process.env.ADMIN_EMAILS;
    try {
      process.env.ADMIN_EMAILS = "thiamabda@gmail.com";
      const adminUser: AdminUserListItem = {
        id: "a96cfb28-15f4-4e04-a316-81e62077cbab",
        email: "thiamabda@gmail.com",
        displayName: "Alpha",
        isAdmin: isAdminEmail("thiamabda@gmail.com"),
        onboarded: true,
        learningGoal: "understand_surahs",
        createdAt: "2026-08-13T20:52:39.907798Z",
        lastSignInAt: "2026-09-05T22:09:37.065343Z",
        lastActiveAt: "2026-09-05",
        lessonsCompletedCount: 12,
        wordsStudiedCount: 83,
        wordsMasteredCount: 6,
      };

      const regularUser: AdminUserListItem = {
        id: "426a5439-0b00-43b5-9e0f-70d3d891e27c",
        email: "traorelassana91@gmail.com",
        displayName: "Lassana",
        isAdmin: isAdminEmail("traorelassana91@gmail.com"),
        onboarded: true,
        learningGoal: "start_gently",
        createdAt: "2026-09-05T09:44:27.775086Z",
        lastSignInAt: "2026-09-05T22:03:47.63666Z",
        lastActiveAt: "2026-09-05",
        lessonsCompletedCount: 0,
        wordsStudiedCount: 0,
        wordsMasteredCount: 0,
      };

      expect(adminUser.isAdmin).toBe(true);
      expect(regularUser.isAdmin).toBe(false);
    } finally {
      process.env.ADMIN_EMAILS = original;
    }
  });


  it("calculates pagination correctly in AdminUsersListResponse", () => {
    const totalUsers = 45;
    const perPage = 20;
    const totalPages = Math.ceil(totalUsers / perPage);

    const response: AdminUsersListResponse = {
      users: [],
      totalUsers,
      page: 2,
      perPage,
      totalPages,
    };

    expect(response.totalPages).toBe(3);
    expect(response.page).toBe(2);
  });

  it("conforms to AdminUserDetail structure with vocabulary progress and activity log", () => {
    const detail: AdminUserDetail = {
      id: "a96cfb28-15f4-4e04-a316-81e62077cbab",
      email: "thiamabda@gmail.com",
      displayName: "Alpha",
      isAdmin: true,
      onboarded: true,
      learningGoal: "understand_surahs",
      dailyGoalType: "lessons",
      dailyGoalValue: 5,
      arabicReadingLevel: "standard",
      quranFamiliarity: "intermediate",
      timezone: "Europe/Paris",
      createdAt: "2026-08-13T20:52:39.907798Z",
      lastSignInAt: "2026-09-05T22:09:37.065343Z",
      progress: {
        totalWords: 31,
        masteredWords: 6,
        familiarWords: 15,
        learningWords: 10,
      },
      words: [
        {
          wordId: "de4499d8-d723-4def-9b17-11eed7a1254e",
          arabic: "ٱلصِّرَٰطَ",
          transliteration: "l-ṣirāṭa",
          meaning: "le chemin / la voie",
          status: "familiar",
          mastery: 75,
          correctCount: 19,
          incorrectCount: 9,
          nextReviewAt: "2026-09-06T09:57:42.978+00:00",
        },
      ],
      recentActivities: [
        {
          activityDate: "2026-08-16",
          lessonId: "24bea0fc-bbde-455d-ad5e-56b17817aede",
          lessonTitle: "Le Souverain du Jour de la rétribution",
          unitTitle: "Al-Fatiha",
        },
      ],
    };

    expect(detail.words.length).toBe(1);
    expect(detail.words[0].arabic).toBe("ٱلصِّرَٰطَ");
    expect(detail.recentActivities[0].unitTitle).toBe("Al-Fatiha");
    expect(detail.progress.masteredWords).toBe(6);
  });
});
