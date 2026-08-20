export {
  generateExercise,
  generateLessonExercises,
  validateAnswer,
  scoreAnswer,
} from "./engine";
export { GENERATORS } from "./generators";
export {
  generatePhoneticDiscriminationSet,
  PHONETIC_DISCRIMINATION_MAX_PER_LESSON,
  PHONETIC_DISCRIMINATION_TRAIT_ORDER,
  PHONETIC_DISCRIMINATION_OPTION_COUNT,
} from "./generators/phonetic-discrimination";
export { validateGeneratedExercise } from "./validators";
export {
  normalizeArabicPresentation,
  normalizeArabicGrading,
  stripTashkeel,
  hasTashkeel,
  normalizeFrench,
  gradeArabicInput,
  gradeFrenchInput,
  gradeFreeResponse,
} from "./grading";
export type { RecallGrade, GradeLanguage, GradeResult } from "./grading";
export type {
  ExerciseType,
  GeneratedExercise,
  GeneratedOption,
  GeneratorContext,
  ExerciseGenerator,
  ExerciseAnswer,
  AnswerResult,
  ExerciseValidationReport,
  ExerciseValidationIssue,
} from "./types";
