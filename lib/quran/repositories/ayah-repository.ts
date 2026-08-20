import type { SupabaseClient } from "@supabase/supabase-js";
import { selectAll, upsertWithStats, type UpsertStats } from "./shared";

export type AyahUpsert = {
  surah_id: string;
  ayah_number: number;
  global_ayah_number: number | null;
  text_uthmani: string;
  text_simple: string | null;
  source_id: string;
};

export class AyahRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertAll(rows: AyahUpsert[]): Promise<{
    stats: UpsertStats;
    idByKey: Map<string, string>;
  }> {
    const stats = await upsertWithStats(
      this.client,
      "ayahs",
      rows,
      "surah_id,ayah_number",
    );

    const all = await selectAll(this.client, "ayahs", "id, surah_id, ayah_number");
    const idByKey = new Map<string, string>();
    for (const row of all as {
      id: string;
      surah_id: string;
      ayah_number: number;
    }[]) {
      idByKey.set(`${row.surah_id}:${row.ayah_number}`, row.id);
    }
    return { stats, idByKey };
  }
}
