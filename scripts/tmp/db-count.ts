/* eslint-disable @typescript-eslint/no-explicit-any -- script CLI one-shot legacy : types Supabase pragmatiques */
import { createClient } from "@supabase/supabase-js";

async function main() {
  for (const file of [".env.local", ".env"]) {
    try { (process as any).loadEnvFile?.(file); } catch {}
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("Missing env vars — skipping");
    return;
  }
  const c = createClient(url, key, { auth: { persistSession: false } });

  // DB snapshot
  const tables = [
    "quran_words", "word_occurrences", "ayahs", "surahs",
    "lemmas", "word_lemma_mapping", "word_translations", "lemma_translations",
    "sources", "translations"
  ];
  console.log("\n=== DB SNAPSHOT ===\n");
  for (const t of tables) {
    const { count, error } = await c.from(t).select("*", { count: "exact", head: true });
    console.log(t.padEnd(22), (count?.toLocaleString() ?? "ERR: " + (error?.message ?? "?")).padStart(8));
  }

  // Surahs: how many?
  const { data: surahs } = await c.from("surahs").select("number").order("number");
  const surahNums = (surahs ?? []).map((s: any) => s.number);
  console.log(`\nsurahs in DB: ${surahNums.length}`);
  console.log(`range: ${surahNums[0] ?? "?"} → ${surahNums[surahNums.length - 1] ?? "?"}`);

  // word_translations breakdown
  const { count: wtFR } = await c.from("word_translations")
    .select("*", { count: "exact", head: true })
    .eq("language", "fr")
    .eq("is_validated", true);
  const { count: wtFR_unv } = await c.from("word_translations")
    .select("*", { count: "exact", head: true })
    .eq("language", "fr")
    .eq("is_validated", false);
  console.log(`\nword_translations FR validated   : ${wtFR?.toLocaleString() ?? "?"}`);
  console.log(`word_translations FR unvalidated : ${wtFR_unv?.toLocaleString() ?? "?"}`);

  // lemma_translations breakdown
  const { count: ltFR } = await c.from("lemma_translations")
    .select("*", { count: "exact", head: true })
    .eq("language", "fr")
    .eq("is_validated", true);
  const { count: ltFR_unv } = await c.from("lemma_translations")
    .select("*", { count: "exact", head: true })
    .eq("language", "fr")
    .eq("is_validated", false);
  console.log(`\nlemma_translations FR validated   : ${ltFR?.toLocaleString() ?? "?"}`);
  console.log(`lemma_translations FR unvalidated : ${ltFR_unv?.toLocaleString() ?? "?"}`);

  // sources
  const { data: sources } = await c.from("sources").select("id, name, type");
  console.log("\nsources:");
  for (const s of (sources ?? []) as any[]) {
    console.log(`  ${s.id.slice(0,10)}…  ${s.name.padEnd(40)} ${s.type}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});