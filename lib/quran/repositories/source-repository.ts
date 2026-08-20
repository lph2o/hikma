import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuranSource } from "@/types/quran";

export type SourceInput = Omit<QuranSource, "id" | "created_at">;

export class SourceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsert(source: SourceInput): Promise<string> {
    const { data, error } = await this.client
      .from("sources")
      .upsert(source, { onConflict: "name,version", ignoreDuplicates: false })
      .select("id")
      .single();
    if (error) throw new Error(`upsert source: ${error.message}`);
    return (data as { id: string }).id;
  }
}
