/**
 * Phase 88E-B repair — Insert word_lemma_mappings + MASAQ updates
 * for the 1,561 lemmas created in Phase 88E-B (lemmas already exist).
 */
import { createClient } from "@supabase/supabase-js";
import { normalizeWordText } from "../lib/quran/normalize-text";

function skeleton(s: string): string {
  return normalizeWordText(s)
    .replace(/\u0649/g, "\u064A").replace(/\u0622/g, "\u0627").replace(/\u0653/g, "").replace(/\u0670/g, "\u0627");
}

const SELECT_PAGE_SIZE = 1000;

function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch {}
  }
}

async function selectAll<T>(client: ReturnType<typeof createClient>, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += SELECT_PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < SELECT_PAGE_SIZE) break;
  }
  return rows;
}

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log("=== PHASE 88E-B REPAIR — WLM + MASAQ UPDATES ===\n");

  // Load existing state
  const lemmaRows = await selectAll<{ id: string; arabic: string }>(client, "lemmas", "id, arabic");
  const lemmaBySkel = new Map(lemmaRows.map(l => [skeleton(l.arabic), l]));
  console.log(`lemmas: ${lemmaRows.length}`);

  const wlmRows = await selectAll<{ word_id: string }>(client, "word_lemma_mapping", "word_id");
  const wlmSet = new Set(wlmRows.map(m => m.word_id));
  const wordRows = await selectAll<{ id: string; lemma_id: string | null }>(client, "quran_words", "id, lemma_id");
  const hasMapping = new Set<string>();
  for (const w of wordRows) { if (w.lemma_id) hasMapping.add(w.id); }
  for (const m of wlmRows) hasMapping.add(m.word_id);
  console.log(`wlm: ${wlmRows.length}, existing mappings: ${hasMapping.size}`);

  const masaqRows = await selectAll<any>(client, "linguistic_occurrences",
    "id, source_id, word_occurrence_id, masaq_stem, hikma_lemma_id");
  const masaqSourceId = masaqRows.find((r: any) => r.source_id)?.source_id as string;
  console.log(`MASAQ rows: ${masaqRows.length}, source_id: ${masaqSourceId.slice(0, 8)}…`);

  const occToWordMap = new Map<string, string>();
  const { data: occFull } = await client.from("word_occurrences").select("id, word_id");
  for (const o of (occFull ?? []) as Array<{ id: string; word_id: string }>) occToWordMap.set(o.id, o.word_id);

  // Group MASAQ by stem, find stems with new lemmas
  const stemGroups = new Map<string, { rows: any[]; wordIds: Set<string> }>();
  for (const r of masaqRows) {
    let g = stemGroups.get(r.masaq_stem);
    if (!g) { g = { rows: [], wordIds: new Set() }; stemGroups.set(r.masaq_stem, g); }
    g.rows.push(r);
    const wid = occToWordMap.get(r.word_occurrence_id);
    if (wid) g.wordIds.add(wid);
  }

  // For each stem that has a lemma, insert WLM + update MASAQ
  const newMappings: { word_id: string; lemma_id: string }[] = [];
  const masaqUpdates: { masaq_id: string; lemma_id: string }[] = [];

  for (const [stem, g] of stemGroups) {
    const skel = skeleton(stem);
    const lemma = lemmaBySkel.get(skel);
    if (!lemma) continue; // no lemma for this stem

    for (const wid of g.wordIds) {
      if (hasMapping.has(wid)) continue;
      if (newMappings.some(m => m.word_id === wid)) continue;
      newMappings.push({ word_id: wid, lemma_id: lemma.id });
    }
    for (const r of g.rows) {
      if (r.hikma_lemma_id) continue;
      masaqUpdates.push({ masaq_id: r.id, lemma_id: lemma.id });
    }
  }

  console.log(`\nNew WLM mappings   : ${newMappings.length}`);
  console.log(`MASAQ updates       : ${masaqUpdates.length}`);

  if (newMappings.length === 0 && masaqUpdates.length === 0) {
    console.log("\nNothing to do.");
    return;
  }

  // Insert WLM
  if (newMappings.length > 0) {
    console.log(`\n→ Inserting ${newMappings.length} word_lemma_mappings…`);
    let done = 0;
    for (let i = 0; i < newMappings.length; i += 500) {
      const chunk = newMappings.slice(i, i + 500).map(m => ({
        word_id: m.word_id, lemma_id: m.lemma_id,
        source_id: masaqSourceId, mapping_method: "exact_surface", confidence: "safe",
      }));
      const { error } = await client.from("word_lemma_mapping").upsert(chunk, { onConflict: "word_id", ignoreDuplicates: true });
      if (error) throw new Error(`wlm: ${error.message}`);
      done += chunk.length;
    }
    console.log(`  Inserted: ${done}`);
  }

  // Update MASAQ
  if (masaqUpdates.length > 0) {
    console.log(`\n→ Updating ${masaqUpdates.length} linguistic_occurrences…`);
    let updated = 0;
    for (let i = 0; i < masaqUpdates.length; i += 500) {
      const chunk = masaqUpdates.slice(i, i + 500);
      for (const u of chunk) {
        const { error } = await client.from("linguistic_occurrences")
          .update({ hikma_lemma_id: u.lemma_id, lemma_mapping_status: "EXACT" })
          .eq("id", u.masaq_id);
        if (error) { console.error(`  err on ${u.masaq_id}: ${error.message}`); continue; }
        updated++;
      }
    }
    console.log(`  Updated: ${updated}`);
  }

  // Post audit
  const { count: wc } = await client.from("word_lemma_mapping").select("*", { count: "exact", head: true });
  const { count: loM } = await client.from("linguistic_occurrences").select("*", { count: "exact", head: true }).not("hikma_lemma_id", "is", null);
  console.log(`\n  wlm: ${wc} (was ${wlmRows.length})`);
  console.log(`  linguistic_occurrences mapped: ${loM} / ${masaqRows.length}`);

  console.log(`\n=== REPAIR TERMINÉ ===`);
}

main().catch(err => { console.error(err); process.exit(1); });