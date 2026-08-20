import type { SupabaseClient } from "@supabase/supabase-js";
import { selectAll, upsertWithStats, type UpsertStats } from "./shared";

export type WordUpsert = {
  arabic: string;
  transliteration: string | null;
  meaning: string | null;
  root: string | null;
  source_id: string;
};

export class WordRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertAll(rows: WordUpsert[]): Promise<{
    stats: UpsertStats;
    idByArabic: Map<string, string>;
  }> {
    const stats = await upsertWithStats(
      this.client,
      "quran_words",
      rows,
      "arabic",
    );

    const all = await selectAll(this.client, "quran_words", "id, arabic");
    const idByArabic = new Map<string, string>();
    for (const row of all as { id: string; arabic: string }[]) {
      idByArabic.set(row.arabic, row.id);
    }
    return { stats, idByArabic };
  }
}
