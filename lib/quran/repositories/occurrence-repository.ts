import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertWithStats, type UpsertStats } from "./shared";

export type OccurrenceUpsert = {
  ayah_id: string;
  word_id: string;
  position: number;
  text: string;
  normalized_text: string | null;
  source_id: string;
};

export class OccurrenceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertAll(rows: OccurrenceUpsert[]): Promise<UpsertStats> {
    return upsertWithStats(
      this.client,
      "word_occurrences",
      rows,
      "ayah_id,position",
    );
  }
}
