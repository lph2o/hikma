import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuranImport } from "@/types/quran";

export class ImportRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(sourceId: string, version: string | null): Promise<string> {
    const { data, error } = await this.client
      .from("imports")
      .insert({
        source_id: sourceId,
        version,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(`create import: ${error.message}`);
    return (data as { id: string }).id;
  }

  async complete(
    id: string,
    counts: { imported: number; updated: number; failed: number },
  ): Promise<void> {
    const { error } = await this.client
      .from("imports")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        records_imported: counts.imported,
        records_updated: counts.updated,
        records_failed: counts.failed,
      })
      .eq("id", id);
    if (error) throw new Error(`complete import: ${error.message}`);
  }

  async fail(id: string, errorLog: unknown): Promise<void> {
    const { error } = await this.client
      .from("imports")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_log: errorLog,
      })
      .eq("id", id);
    if (error) throw new Error(`fail import: ${error.message}`);
  }

  async latest(): Promise<QuranImport | null> {
    const { data, error } = await this.client
      .from("imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`latest import: ${error.message}`);
    return (data as QuranImport | null) ?? null;
  }
}
