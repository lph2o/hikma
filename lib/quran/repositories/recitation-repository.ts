import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertWithStats, type UpsertStats } from "./shared";

export type RecitationUpsert = {
  quran_com_id: number | null;
  reciter_id: number | null;
  name: string;
  style: string | null;
  qirat: string | null;
  source_id: string;
};

export class RecitationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertAll(rows: RecitationUpsert[]): Promise<UpsertStats> {
    return upsertWithStats(this.client, "recitations", rows, "quran_com_id");
  }
}
