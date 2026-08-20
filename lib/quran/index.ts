export { QuranComAdapter } from "./adapters/quran-com-adapter";
export { normalizeQuranData } from "./normalize";
export { normalizeWordText } from "./normalize-text";
export { validateQuranData } from "./validation/validator";
export { SupabaseQuranDataProvider } from "./provider";
export type { QuranDataProvider, AyahWord, AyahAudioInfo } from "./provider";
export type {
  NormalizedQuranData,
  ImportStats,
  ValidationReport,
  ValidationIssue,
} from "./types";
