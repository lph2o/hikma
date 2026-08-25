export { QuranComAdapter } from "./adapters/quran-com-adapter";
export { normalizeQuranData } from "./normalize";
export { normalizeWordText } from "./normalize-text";
export { validateQuranData } from "./validation/validator";
export { SupabaseQuranDataProvider } from "./provider";
export type { QuranDataProvider, AyahWord, AyahAudioInfo } from "./provider";
export {
  getAyahAudioCdnUrl,
  getAyahAudioUrl,
  isValidGlobalAyahNumber,
  DEFAULT_AYAH_RECITER,
  DEFAULT_AYAH_BITRATE,
} from "./ayah-audio";
export type { AyahReciter, AyahBitrate } from "./ayah-audio";
export type {
  NormalizedQuranData,
  ImportStats,
  ValidationReport,
  ValidationIssue,
} from "./types";
