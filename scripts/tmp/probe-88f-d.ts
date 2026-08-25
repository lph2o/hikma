/**
 * PROBE (READ-ONLY) — PHASE 88F-D preparatory evidence gathering.
 * No DB write. Outputs evidence available for the top-100 lemma candidates.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch {}
  }
}

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const PAGE = 1000;

  async function selectAll<T>(table: string, cols: string): Promise<T[]> {
    const out: T[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await client.from(table).select(cols).range(from, from + PAGE - 1);
      if (error) throw new Error(`${table}: ${error.message}`);
      const batch = (data ?? []) as T[];
      out.push(...batch);
      if (batch.length < PAGE) break;
    }
    return out;
  }

  const report = JSON.parse(readFileSync("reports/phase-88f-c-post-import-audit.json", "utf-8"));
  const top100 = report.batch2.top100 as Array<{ lemmaId: string; arabic: string }>;
  const idToArabic = new Map(top100.map(c => [c.lemmaId, c.arabic]));
  const ids = top100.map(c => c.lemmaId);

  const [sources, lemmaRows, wtRows, ltRows, loRows, occRows, trRows] = await Promise.all([
    selectAll<{ id: string; name: string; type: string | null }>("sources", "id, name, type"),
    selectAll<{ id: string; arabic: string; meaning: string | null; transliteration: string | null; root: string | null; source_id: string | null }>("lemmas", "id, arabic, meaning, transliteration, root, source_id"),
    selectAll<{ id: string; word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null }>("word_translations", "id, word_id, text, language, is_validated, source_id"),
    selectAll<{ id: string; lemma_id: string; language: string; text: string; is_validated: boolean; source_id: string | null }>("lemma_translations", "id, lemma_id, language, text, is_validated, source_id"),
    selectAll<{ id: string; word_occurrence_id: string; hikma_lemma_id: string | null; masaq_gloss_en: string | null; masaq_stem: string | null; lemma_mapping_status: string; pos: string[] }>("linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, masaq_gloss_en, masaq_stem, lemma_mapping_status, pos"),
    selectAll<{ id: string; word_id: string; ayah_id: string }>("word_occurrences", "id, word_id, ayah_id"),
    selectAll<{ id: string; language: string; translator: string }>("translations", "id, language, translator"),
  ]);

  console.log("=== SOURCES ===");
  for (const s of sources) console.log(`  ${s.name}  (type=${s.type ?? "-"})`);

  console.log("\n=== TRANSLATORS (translations) ===");
  const trCount = new Map<string, number>();
  for (const t of trRows) trCount.set(`${t.language}/${t.translator}`, (trCount.get(`${t.language}/${t.translator}`) ?? 0) + 1);
  for (const [k, v] of [...trCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${k}: ${v}`);

  console.log("\n=== LEMMA ROWS (top100) ===");
  const lemmaById = new Map(lemmaRows.map(l => [l.id, l]));
  let meaningFilled = 0, rootFilled = 0, translitFilled = 0;
  for (const c of top100) {
    const l = lemmaById.get(c.lemmaId);
    if (!l) { console.log(`  MISSING LEMMA ROW: ${c.arabic} (${c.lemmaId})`); continue; }
    if (l.meaning) meaningFilled++;
    if (l.root) rootFilled++;
    if (l.transliteration) translitFilled++;
  }
  console.log(`  meaning filled: ${meaningFilled}/100 | root: ${rootFilled}/100 | transliteration: ${translitFilled}/100`);

  console.log("\n=== LEMMA_TRANSLATIONS for top100 (existing rows — evidence only) ===");
  const ltFor = ltRows.filter(r => ids.includes(r.lemma_id));
  console.log(`  total rows for top100 lemmas: ${ltFor.length}`);
  for (const r of ltFor.slice(0, 40)) {
    const ar = idToArabic.get(r.lemma_id) ?? "?";
    console.log(`  ${ar} [${r.language} src=${r.source_id ? "set" : "null"} v=${r.is_validated}] ${r.text.slice(0, 60)}`);
  }

  console.log("\n=== MASAQ evidence per lemma ===");
  const occToWord = new Map(occRows.map(o => [o.id, o.word_id]));
  const glossByLemma = new Map<string, Map<string, number>>();
  const statusByLemma = new Map<string, Map<string, number>>();
  const posByLemma = new Map<string, Set<string>>();
  const occCountByLemma = new Map<string, number>();
  const stemByLemma = new Map<string, Set<string>>();
  // resolve words → lemma via lo.hikma_lemma_id
  for (const lo of loRows) {
    if (!lo.hikma_lemma_id || !idToArabic.has(lo.hikma_lemma_id)) continue;
    const lid = lo.hikma_lemma_id;
    occCountByLemma.set(lid, (occCountByLemma.get(lid) ?? 0) + 1);
    if (lo.masaq_gloss_en) {
      let m = glossByLemma.get(lid);
      if (!m) { m = new Map(); glossByLemma.set(lid, m); }
      m.set(lo.masaq_gloss_en, (m.get(lo.masaq_gloss_en) ?? 0) + 1);
    }
    let sm = statusByLemma.get(lid);
    if (!sm) { sm = new Map(); statusByLemma.set(lid, sm); }
    sm.set(lo.lemma_mapping_status, (sm.get(lo.lemma_mapping_status) ?? 0) + 1);
    if (lo.masaq_stem) {
      let st = stemByLemma.get(lid);
      if (!st) { st = new Set(); stemByLemma.set(lid, st); }
      st.add(lo.masaq_stem);
    }
    for (const p of lo.pos) {
      let ps = posByLemma.get(lid);
      if (!ps) { ps = new Set(); posByLemma.set(lid, ps); }
      ps.add(p);
    }
  }
  for (const c of top100) {
    const glosses = glossByLemma.get(c.lemmaId);
    const total = occCountByLemma.get(c.lemmaId) ?? 0;
    const topGlosses = glosses ? [...glosses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4) : [];
    const topShare = topGlosses.length ? Math.round((topGlosses[0][1] / total) * 100) : 0;
    const stems = stemByLemma.get(c.lemmaId);
    const poses = posByLemma.get(c.lemmaId);
    const statuses = statusByLemma.get(c.lemmaId);
    const statusStr = statuses ? [...statuses.entries()].map(([k, v]) => `${k}:${v}`).join(",") : "-";
    console.log(`${c.arabic.padEnd(8)} occs=${String(total).padStart(4)} topGloss=${topGlosses[0] ? topGlosses[0][0] : "-"} (${topGlosses[0] ? topGlosses[0][1] : 0}/${total} = ${topShare}%) distinct=${glosses?.size ?? 0} stems=${stems ? stems.size : 0} pos=${poses ? [...poses].join("|") : "-"} status=${statusStr}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });