/**
 * Phase 88E-B repair — Batch MASAQ updates via SQL function.
 * Faster than 7,585 individual UPDATE calls.
 */
import { createClient } from "@supabase/supabase-js";
import { normalizeWordText } from "../lib/quran/normalize-text";

function skeleton(s: string): string {
  return normalizeWordText(s)
    .replace(/\u0649/g, "\u064A").replace(/\u0622/g, "\u0627").replace(/\u0653/g, "").replace(/\u0670/g, "\u0627");
}

const BATCH = 50;

function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch {}
  }
}

async function selectAll<T>(client: ReturnType<typeof createClient>, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await client.from(table).select(cols).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return rows;
}

async function selectAllFiltered<T>(client: ReturnType<typeof createClient>, table: string, cols: string, filter: (q: any) => any): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const q = client.from(table).select(cols).range(from, from + 999);
    const fq = filter(q);
    const { data, error } = await fq;
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return rows;
}

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log("=== PHASE 88E-B REPAIR — MASAQ BATCH UPDATES ===\n");

  // Load ALL lemmas (paginated)
  const lemmas = await selectAll<{id:string;arabic:string}>(client, "lemmas", "id, arabic");
  const lemmaBySkel = new Map(lemmas.map((l: any) => [skeleton(l.arabic), l.id]));
  console.log(`lemmas: ${lemmaBySkel.size}`);

  // Find UNMAPPED MASAQ rows (paginated)
  const unmapped = await selectAllFiltered<any>(client, "linguistic_occurrences", "id, masaq_stem",
    (q: any) => q.is("hikma_lemma_id", null).not("masaq_stem", "is", null));
  console.log(`UNMAPPED rows: ${unmapped.length}`);

  // Group by (stem skeleton → lemma_id)
  const updates: { ids: string[]; lemma_id: string }[] = [];
  const pending = new Map<string, string[]>();

  for (const r of (unmapped ?? []) as any[]) {
    const skel = skeleton(r.masaq_stem);
    const lid = lemmaBySkel.get(skel);
    if (!lid) continue;
    const arr = pending.get(lid) ?? [];
    arr.push(r.id);
    pending.set(lid, arr);
  }

  for (const [lid, ids] of pending) {
    updates.push({ ids, lemma_id: lid });
  }

  const totalRows = updates.reduce((s, u) => s + u.ids.length, 0);
  console.log(`Rows to update: ${totalRows} across ${updates.length} lemma batches`);

  if (totalRows === 0) {
    console.log("\nNothing to do.");
    return;
  }

  let updated = 0;
  for (const u of updates) {
    // Batch by 100 IDs at a time (Supabase IN() limit)
    for (let i = 0; i < u.ids.length; i += 100) {
      const idChunk = u.ids.slice(i, i + 100);
      const { error } = await client.from("linguistic_occurrences")
        .update({ hikma_lemma_id: u.lemma_id, lemma_mapping_status: "EXACT" })
        .in("id", idChunk);
      if (error) { console.error(`  err on lemma ${u.lemma_id.slice(0,8)}… : ${error.message}`); continue; }
      updated += idChunk.length;
    }
    if (updated % 1000 < u.ids.length) console.log(`  ${updated} / ${totalRows}…`);
  }

  console.log(`\n  Updated: ${updated}`);

  const { count: loM } = await client.from("linguistic_occurrences").select("*", { count: "exact", head: true }).not("hikma_lemma_id", "is", null);
  const { count: loT } = await client.from("linguistic_occurrences").select("*", { count: "exact", head: true });
  console.log(`  linguistic_occurrences mapped: ${loM} / ${loT}`);

  console.log(`\n=== REPAIR TERMINÉ ===`);
}

main().catch(err => { console.error(err); process.exit(1); });