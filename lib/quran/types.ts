// Types du pipeline d'import coranique (indépendants de la source et de la base).
// Clés naturelles uniquement : les UUID sont résolus au moment de l'upsert.

export type NormalizedSurah = {
  number: number;
  name_arabic: string;
  name_transliteration: string | null;
  name_translation: string | null;
  revelation_place: "makkah" | "madinah" | null;
  ayah_count: number;
};

export type NormalizedAyah = {
  surah_number: number;
  ayah_number: number;
  global_ayah_number: number | null;
  text_uthmani: string;
  text_simple: string | null;
};

/** Forme lexicale distincte. root/lemme absents de la source → null. */
export type NormalizedWord = {
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  root: string | null;
};

export type NormalizedOccurrence = {
  surah_number: number;
  ayah_number: number;
  position: number;
  word_arabic: string;
  text: string;
  normalized_text: string | null;
};

export type NormalizedTranslation = {
  surah_number: number;
  ayah_number: number;
  language: string;
  translator: string;
  resource_id: number;
  text: string;
};

export type NormalizedRecitation = {
  quran_com_id: number | null;
  reciter_id: number | null;
  name: string;
  style: string | null;
  qirat: string | null;
};

export type NormalizedQuranData = {
  surahs: NormalizedSurah[];
  ayahs: NormalizedAyah[];
  words: NormalizedWord[];
  occurrences: NormalizedOccurrence[];
  translations: NormalizedTranslation[];
  recitations: NormalizedRecitation[];
};

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: ValidationSeverity;
  code: string;
  message: string;
};

export type ValidationReport = {
  /** true si aucune erreur bloquante (les warnings n'invalident pas). */
  valid: boolean;
  issues: ValidationIssue[];
};

export type ImportStats = {
  surahs: number;
  ayahs: number;
  words: number;
  occurrences: number;
  translations: number;
  recitations: number;
};
