import type { ISODateString, UUID } from "@/types";

// Types de domaine coranique — reflètent exactement le schéma PostgreSQL
// (supabase/migrations/*.sql). Les colonnes sont en snake_case.

export type RevelationPlace = "makkah" | "madinah";

export type ImportStatus = "pending" | "running" | "completed" | "failed";

/** Provenance d'une donnée importée (table `sources`). */
export type QuranSource = {
  id: UUID;
  name: string;
  type: string;
  url: string | null;
  version: string | null;
  license: string | null;
  retrieved_at: ISODateString | null;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
};

/** Suivi d'une exécution du pipeline (table `imports`). */
export type QuranImport = {
  id: UUID;
  source_id: UUID;
  version: string | null;
  status: ImportStatus;
  started_at: ISODateString | null;
  completed_at: ISODateString | null;
  records_imported: number;
  records_updated: number;
  records_failed: number;
  error_log: unknown | null;
  created_at: ISODateString;
};

/** Sourate (table `surahs`). */
export type Surah = {
  id: UUID;
  number: number;
  name_arabic: string;
  name_transliteration: string | null;
  name_translation: string | null;
  revelation_place: RevelationPlace | null;
  ayah_count: number;
  source_id: UUID | null;
  created_at: ISODateString;
};

/** Verset (table `ayahs`). */
export type Ayah = {
  id: UUID;
  surah_id: UUID;
  ayah_number: number;
  global_ayah_number: number | null;
  text_uthmani: string;
  text_simple: string | null;
  source_id: UUID | null;
  created_at: ISODateString;
};

/** Lemme (table `lemmas`). */
export type Lemma = {
  id: UUID;
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  root: string | null;
  source_id: UUID | null;
  created_at: ISODateString;
};

/** Forme lexicale distincte (table `quran_words`). */
export type QuranWord = {
  id: UUID;
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  root: string | null;
  lemma_id: UUID | null;
  source_id: UUID | null;
  created_at: ISODateString;
};

/** Occurrence d'un mot dans un verset (table `word_occurrences`). */
export type WordOccurrence = {
  id: UUID;
  ayah_id: UUID;
  word_id: UUID;
  position: number;
  text: string;
  normalized_text: string | null;
  source_id: UUID | null;
  created_at: ISODateString;
};

/** Traduction d'un verset (table `translations`). */
export type Translation = {
  id: UUID;
  ayah_id: UUID;
  language: string;
  translator: string;
  resource_id: number;
  text: string;
  source_id: UUID | null;
  created_at: ISODateString;
};

/** Récitant (table `recitations`). */
export type Recitation = {
  id: UUID;
  quran_com_id: number | null;
  reciter_id: number | null;
  name: string;
  style: string | null;
  qirat: string | null;
  audio_url: string | null;
  duration: number | null;
  source_id: UUID | null;
  created_at: ISODateString;
};

/** Audio d'un verset (table `ayah_audio`). */
export type AyahAudio = {
  id: UUID;
  ayah_id: UUID;
  recitation_id: UUID;
  audio_url: string;
  duration: number | null;
  source_id: UUID | null;
  created_at: ISODateString;
};

/** Audio d'un mot (table `word_audio`). */
export type WordAudio = {
  id: UUID;
  word_id: UUID;
  recitation_id: UUID | null;
  audio_url: string;
  duration: number | null;
  source_id: UUID | null;
  created_at: ISODateString;
};
