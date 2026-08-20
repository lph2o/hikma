import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Ayah,
  AyahAudio,
  QuranWord,
  Recitation,
  Surah,
  Translation,
} from "@/types/quran";

/** Un mot d'un verset, avec sa forme et sa position. */
export type AyahWord = {
  occurrenceId: string;
  position: number;
  text: string;
  normalizedText: string | null;
  word: QuranWord;
};

/** Audio d'un verset, enrichi du récitant. */
export type AyahAudioInfo = AyahAudio & {
  recitation: Recitation | null;
};

/**
 * Interface indépendante de la source. L'application lit TOUJOURS depuis
 * Supabase (jamais d'appel API externe dans les composants React).
 */
export interface QuranDataProvider {
  getSurahs(): Promise<Surah[]>;
  getSurah(number: number): Promise<Surah | null>;
  getAyah(surahNumber: number, ayahNumber: number): Promise<Ayah | null>;
  getAyahs(surahNumber: number): Promise<Ayah[]>;
  getWords(ayahId: string): Promise<AyahWord[]>;
  getWord(id: string): Promise<QuranWord | null>;
  getTranslations(ayahId: string): Promise<Translation[]>;
  getAudio(ayahId: string): Promise<AyahAudioInfo[]>;
}

export class SupabaseQuranDataProvider implements QuranDataProvider {
  constructor(private readonly client: SupabaseClient) {}

  async getSurahs(): Promise<Surah[]> {
    const { data, error } = await this.client
      .from("surahs")
      .select("*")
      .order("number", { ascending: true });
    if (error) throw new Error(`getSurahs: ${error.message}`);
    return (data ?? []) as Surah[];
  }

  async getSurah(number: number): Promise<Surah | null> {
    const { data, error } = await this.client
      .from("surahs")
      .select("*")
      .eq("number", number)
      .maybeSingle();
    if (error) throw new Error(`getSurah: ${error.message}`);
    return (data as Surah | null) ?? null;
  }

  async getAyah(
    surahNumber: number,
    ayahNumber: number,
  ): Promise<Ayah | null> {
    const surahId = await this.resolveSurahId(surahNumber);
    if (!surahId) return null;
    const { data, error } = await this.client
      .from("ayahs")
      .select("*")
      .eq("surah_id", surahId)
      .eq("ayah_number", ayahNumber)
      .maybeSingle();
    if (error) throw new Error(`getAyah: ${error.message}`);
    return (data as Ayah | null) ?? null;
  }

  async getAyahs(surahNumber: number): Promise<Ayah[]> {
    const surahId = await this.resolveSurahId(surahNumber);
    if (!surahId) return [];
    const { data, error } = await this.client
      .from("ayahs")
      .select("*")
      .eq("surah_id", surahId)
      .order("ayah_number", { ascending: true });
    if (error) throw new Error(`getAyahs: ${error.message}`);
    return (data ?? []) as Ayah[];
  }

  async getWords(ayahId: string): Promise<AyahWord[]> {
    const { data: occurrences, error } = await this.client
      .from("word_occurrences")
      .select("id, position, text, normalized_text, word_id")
      .eq("ayah_id", ayahId)
      .order("position", { ascending: true });
    if (error) throw new Error(`getWords: ${error.message}`);

    const rows = (occurrences ?? []) as Array<{
      id: string;
      position: number;
      text: string;
      normalized_text: string | null;
      word_id: string;
    }>;

    const wordIds = [...new Set(rows.map((r) => r.word_id))];
    const wordById = new Map<string, QuranWord>();
    if (wordIds.length > 0) {
      const { data: words, error: wordError } = await this.client
        .from("quran_words")
        .select("*")
        .in("id", wordIds);
      if (wordError) throw new Error(`getWords: ${wordError.message}`);
      for (const word of (words ?? []) as QuranWord[]) {
        wordById.set(word.id, word);
      }
    }

    return rows.map((row) => ({
      occurrenceId: row.id,
      position: row.position,
      text: row.text,
      normalizedText: row.normalized_text,
      word: wordById.get(row.word_id) as QuranWord,
    }));
  }

  async getWord(id: string): Promise<QuranWord | null> {
    const { data, error } = await this.client
      .from("quran_words")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`getWord: ${error.message}`);
    return (data as QuranWord | null) ?? null;
  }

  async getTranslations(ayahId: string): Promise<Translation[]> {
    const { data, error } = await this.client
      .from("translations")
      .select("*")
      .eq("ayah_id", ayahId)
      .order("language", { ascending: true });
    if (error) throw new Error(`getTranslations: ${error.message}`);
    return (data ?? []) as Translation[];
  }

  async getAudio(ayahId: string): Promise<AyahAudioInfo[]> {
    const { data, error } = await this.client
      .from("ayah_audio")
      .select("*, recitations(*)")
      .eq("ayah_id", ayahId);
    if (error) throw new Error(`getAudio: ${error.message}`);
    return ((data ?? []) as Array<AyahAudio & { recitations: Recitation | null }>).map(
      ({ recitations, ...audio }) => ({ ...audio, recitation: recitations }),
    );
  }

  private async resolveSurahId(number: number): Promise<string | null> {
    const { data, error } = await this.client
      .from("surahs")
      .select("id")
      .eq("number", number)
      .maybeSingle();
    if (error) throw new Error(`resolveSurahId: ${error.message}`);
    return (data as { id: string } | null)?.id ?? null;
  }
}
