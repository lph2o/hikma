import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertWithStats, type UpsertStats } from "./shared";

export type TranslationUpsert = {
  ayah_id: string;
  language: string;
  translator: string;
  resource_id: number;
  text: string;
  source_id: string;
};

export class TranslationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertAll(rows: TranslationUpsert[]): Promise<UpsertStats> {
    return upsertWithStats(
      this.client,
      "translations",
      rows,
      "ayah_id,resource_id",
    );
  }
}
