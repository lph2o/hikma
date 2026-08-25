export {
  buildWordBank,
  buildLessonPlan,
  hasUsableWords,
  DEFAULT_LESSON_EXERCISE_TYPES,
} from "./lesson";
export {
  applyAnswer,
  nextStatus,
  accuracy,
  PROGRESS_RULES,
} from "./progress";
export { defaultMasteryCalculator } from "./mastery";
export {
  SKILLS,
  SKILL_ORDER,
  SKILL_LABELS,
  RECOGNITION_SKILLS,
  RECALL_SKILLS,
  skillForExerciseType,
} from "./skills";
export type { Skill } from "./skills";
export {
  skillMasteryLevel,
  skillAccuracy,
  applySkillAttempt,
  aggregateSkillMastery,
  weakestSkills,
  retentionLevel,
  daysSince,
  MASTERY_STEP,
} from "./skill-progress";
export type {
  SkillProgressState,
  SkillCounters,
  RetentionInput,
} from "./skill-progress";
export {
  buildCumulativeSequence,
  buildInterleavedSequence,
  selectNextStep,
  isSequenceComplete,
  defaultSkillToType,
  skillLevel,
} from "./sequencing";
export type { SequencedStep, SkillProgressByWord } from "./sequencing";
export {
  PEDAGOGICAL_LANGUAGE,
  resolveWordMeaning,
  resolveQuranWordMeaning,
} from "./language";
export type { WordMeaning } from "./language";
export { validateCurriculum, orderCurriculum } from "./curriculum";
export { aggregateSurahMastery } from "./surah-mastery";
export type {
  SurahMastery,
  SurahProgressStatus,
  SurahWordProgress,
  SurahSkillMastery,
} from "./surah-mastery";
export {
  computeSessionStats,
  appendAttempt,
  replayWordResults,
  computeLessonStatuses,
} from "./session";
export {
  getActivityDate,
  getLocalDateKey,
  getUserSettings,
  insertUserSettings,
  updateUserSettings,
  getDailyActivity,
  getDailyGoalProgress,
  getUpcomingReviewCounts,
  getActivityHistory,
  getDistinctLearningDays,
  DEFAULT_DAILY_GOAL_TYPE,
  DEFAULT_DAILY_GOAL_VALUE,
} from "./activity";
export type {
  DailyActivity,
  DailyGoalProgress,
} from "./activity";
export type {
  WordAttempts,
  SessionStats,
  ReplayedWord,
  LessonForStatus,
} from "./session";
export type { MasteryCalculator, MasteryInput } from "./mastery";
export type { ProgressState, ApplyAnswerResult } from "./progress";
export type { Curriculum, CurriculumReport, CurriculumIssue } from "./curriculum";
export type {
  MasteryLevel,
  WordBankEntry,
  WordContextData,
  WordLemmaData,
  LessonWordWithWord,
  LessonPlan,
  LessonProgressStatus,
} from "./types";
export {
  computeLearningDays,
  computeCurrentStreak,
  computeLongestStreak,
  computeWeeklyConsistency,
  computeRegularityMetrics,
  computeMonthlyActivity,
  computeMonthGrid,
  WEEKDAYS,
} from "./regularity";
export type {
  RegularityMetrics,
  MonthlyActivity,
  CalendarDay,
  MonthGrid,
} from "./regularity";
export {
  computeCoverageBySurah,
  computeAyahCoverages,
} from "./coverage";
export type {
  SurahCoverage,
  AyahCoverage,
  AyahCoverageOccurrence,
} from "./coverage";
export {
  shouldShowReminder,
  getReminderContent,
  isPastReminderTime,
  daysSinceLastActivity,
} from "./reminders";
export type {
  ReminderDecision,
  ReminderContent,
  ReminderReason,
  ShouldShowReminderInput,
} from "./reminders";
