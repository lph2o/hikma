/**
 * Data Contracts et types pour l'espace d'administration Hikma Control Center.
 */

export interface AdminOverviewMetrics {
  totalUsers: number;
  activeUsers7d: number;
  newUsers7d: number;
  sessions7d: number;
  lessonsPublished: number;
  coveragePercent: number;
  totalQuranWords: number;
  validatedQuranWords: number;
}

export interface AdminAttentionMetrics {
  rendersFailed: number;
  rendersPending: number;
  contentReview: number;
  lessonsDraft: number;
}

export interface AdminDailyActivity {
  date: string; // Format YYYY-MM-DD
  dayLabel: string; // ex: '01/09'
  lessonsCompleted: number;
  wordsStudied: number;
  activeUsers: number;
  newUsers: number;
}

export interface QuranLegacyCount {
  key: string;
  label: string;
  count: number | null;
}

export interface AdminUserListItem {
  id: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  onboarded: boolean;
  learningGoal: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  lastActiveAt: string | null;
  lessonsCompletedCount: number;
  wordsStudiedCount: number;
  wordsMasteredCount: number;
}

export interface AdminUsersListResponse {
  users: AdminUserListItem[];
  totalUsers: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface AdminUserWordItem {
  wordId: string;
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  status: string;
  mastery: number;
  correctCount: number;
  incorrectCount: number;
  nextReviewAt: string | null;
}

export interface AdminUserActivityItem {
  activityDate: string;
  lessonId: string;
  lessonTitle: string;
  unitTitle: string | null;
}

export interface AdminUserDetail {
  id: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  onboarded: boolean;
  learningGoal: string | null;
  dailyGoalType: string | null;
  dailyGoalValue: number | null;
  arabicReadingLevel: string | null;
  quranFamiliarity: string | null;
  timezone: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  progress: {
    totalWords: number;
    masteredWords: number;
    familiarWords: number;
    learningWords: number;
  };
  words: AdminUserWordItem[];
  recentActivities: AdminUserActivityItem[];
}

// ─── Phase D — Learning Analytics ────────────────────────────────────────────

export interface AdminLearningKpis {
  period: "7d" | "30d";
  lessonsCompleted: number;
  /** Variation % vs la période précédente équivalente (null si pas de données prev) */
  lessonsCompletedDelta: number | null;
  wordsStudied: number;
  wordsStudiedDelta: number | null;
  reviewsDue: number;
  sessionsActive: number;
  vocabMastered: number;
  vocabFamiliar: number;
  vocabLearning: number;
}

export interface AdminLearningDailyActivity {
  date: string; // YYYY-MM-DD
  dayLabel: string; // DD/MM
  lessonsCompleted: number;
  wordsStudied: number;
  activeUsers: number;
}

export interface AdminLearningVocabBreakdown {
  mastered: number;
  familiar: number;
  learning: number;
  reviewDue: number;
  totalInProgress: number;
}

export interface AdminLearningInsight {
  type: "warning" | "info" | "success";
  key: string;
  title: string;
  description: string;
  value: number;
}

export interface AdminLearningTopLesson {
  lessonId: string;
  lessonTitle: string;
  unitTitle: string | null;
  completionCount: number;
}

// ─── Phase E — Curriculum & Corpus Health ─────────────────────────────────────

export interface AdminCurriculumKpis {
  pathsCount: number;
  unitsCount: number;
  lessonsPublishedCount: number;
  lessonsDraftCount: number;
  wordsTaughtCount: number;
  quranWordsCount: number;
  frValidatedWordsCount: number;
  frCoveragePct: number;
  occurrencesCount: number;
  ayahsCount: number;
  surahsCount: number;
  lemmasCount: number;
  lemmaTranslationsCount: number;
}

export interface AdminCurriculumPathItem {
  id: string;
  slug: string;
  title: string;
  surahNumber: number;
  surahName: string;
  surahArabic: string;
  ayahCount: number;
  lessonCount: number;
  wordsCount: number;
}

export interface AdminCorpusSurahItem {
  number: number;
  name: string;
  arabic: string;
  translation: string;
  ayahCount: number;
  hasCurriculum: boolean;
  lessonCount: number;
}

export interface AdminCurriculumInsight {
  type: "warning" | "info" | "success";
  key: string;
  title: string;
  description: string;
  value: number;
}

export interface AdminCurriculumSurahDetail {
  surah: {
    id: string;
    number: number;
    nameArabic: string;
    nameTransliteration: string;
    nameTranslation: string;
    revelationPlace: string;
    ayahCount: number;
  };
  corpus: {
    occurrencesCount: number;
    uniqueWordsCount: number;
    translatedWordsCount: number;
    coveragePct: number;
  };
  path: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    unitTitle: string;
  } | null;
  lessons: Array<{
    id: string;
    slug: string;
    title: string;
    sortOrder: number;
    difficulty: number;
    objective: string | null;
    status: string;
    wordsCount: number;
  }>;
}
