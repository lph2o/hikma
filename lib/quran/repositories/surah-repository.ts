import type { SupabaseClient } from "@supabase/supabase-js";
import type { Surah } from "@/types/quran";
import { selectAll, upsertWithStats, type UpsertStats } from "./shared";

export type SurahUpsert = {
  number: number;
  name_arabic: string;
  name_transliteration: string | null;
  name_translation: string | null;
  revelation_place: Surah["revelation_place"];
  ayah_count: number;
  source_id: string;
};

export class SurahRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertAll(rows: SurahUpsert[]): Promise<{
    stats: UpsertStats;
    idByNumber: Map<number, string>;
  }> {
    const stats = await upsertWithStats(this.client, "surahs", rows, "number");

    const all = await selectAll(this.client, "surahs", "id, number");
    const idByNumber = new Map<number, string>();
    for (const row of all as { id: string; number: number }[]) {
      idByNumber.set(row.number, row.id);
    }
    return { stats, idByNumber };
  }
}
