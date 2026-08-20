// Adapteur « Quran.com API v4 ».
// Récupère les données brutes depuis https://api.qurancdn.com/api/qdc.
// Aucun appel HTTP fournisseur ne doit vivre ailleurs que dans un adapteur.

const API_BASE = "https://api.qurancdn.com/api/qdc";
const PER_PAGE = 50;

/**
 * Ressources de traduction importées (langues demandées : fr, en, it).
 * resource_id est l'identifiant stable côté Quran.com.
 */
export const TRANSLATION_RESOURCES = [
  { resource_id: 31, language: "fr", translator: "Muhammad Hamidullah" },
  { resource_id: 20, language: "en", translator: "Sahih International" },
  { resource_id: 153, language: "it", translator: "Hamza Roberto Piccardo" },
] as const;

export type QuranComChapter = {
  id: number;
  revelation_place: "makkah" | "madinah" | null;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  translated_name?: { language_name: string; name: string } | null;
};

export type QuranComWord = {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  text: string;
  translation?: { text: string; language_name: string } | null;
  transliteration?: { text: string | null; language_name: string } | null;
};

export type QuranComTranslation = {
  id: number;
  resource_id: number;
  text: string;
};

export type QuranComVerse = {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  text_imlaei?: string | null;
  words?: QuranComWord[];
  translations?: QuranComTranslation[];
};

export type QuranComReciter = {
  id: number;
  reciter_id: number;
  name: string;
  style?: { name: string } | null;
  qirat?: { name: string } | null;
};

/** Données brutes produites par un adapteur. */
export type RawQuranData = {
  chapters: QuranComChapter[];
  versesByChapter: Map<number, QuranComVerse[]>;
  reciters: QuranComReciter[];
};

export type QuranComAdapterOptions = {
  /** Limite le nombre de sourates traitées (tests / dry-run rapide). */
  chapterLimit?: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`Quran.com API ${res.status} sur ${url}`);
  }
  return (await res.json()) as T;
}

export class QuranComAdapter {
  constructor(private readonly options: QuranComAdapterOptions = {}) {}

  async fetch(): Promise<RawQuranData> {
    const chaptersResponse = await fetchJson<{ chapters: QuranComChapter[] }>(
      `${API_BASE}/chapters?language=fr`,
    );
    const chapters = chaptersResponse.chapters
      .sort((a, b) => a.id - b.id)
      .slice(0, this.options.chapterLimit);

    const versesByChapter = new Map<number, QuranComVerse[]>();
    for (const chapter of chapters) {
      versesByChapter.set(chapter.id, await this.fetchChapterVerses(chapter.id));
    }

    const recitersResponse = await fetchJson<{ reciters: QuranComReciter[] }>(
      `${API_BASE}/audio/reciters`,
    );

    return {
      chapters,
      versesByChapter,
      reciters: recitersResponse.reciters ?? [],
    };
  }

  private async fetchChapterVerses(chapterId: number): Promise<QuranComVerse[]> {
    const verses: QuranComVerse[] = [];
    const translationIds = TRANSLATION_RESOURCES.map((t) => t.resource_id).join(",");
    let page = 1;

    // Boucle de pagination : s'arrête après la dernière page.
    while (true) {
      const url =
        `${API_BASE}/verses/by_chapter/${chapterId}` +
        `?words=true&translations=${translationIds}` +
        `&fields=text_uthmani,text_imlaei&per_page=${PER_PAGE}&page=${page}`;
      const data = await fetchJson<{
        verses: QuranComVerse[];
        pagination?: { total_pages: number };
      }>(url);
      verses.push(...(data.verses ?? []));
      const totalPages = data.pagination?.total_pages ?? 1;
      if (page >= totalPages) break;
      page += 1;
    }

    return verses;
  }
}
