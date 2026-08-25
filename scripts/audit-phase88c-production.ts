/**
 * Phase 88C — Audit lexical complet sur DB production (114 sourates, 21K+ mots).
 * READ-ONLY STRICT — 0 écriture DB.
 *
 * Usage : npx tsx scripts/audit-phase88c-production.ts
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

const SELECT_PAGE_SIZE = 1000;
const VERBOSE = process.argv.includes("--verbose");
const SOURCE_EDITORIAL = "Hikma — lexique éditorial";

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file); } catch {}
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += SELECT_PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < SELECT_PAGE_SIZE) break;
  }
  return rows;
}

function classifyStatus(surahNumber: number, pct: number): "REFERENCE" | "READY" | "IN_PREPARATION" {
  if (surahNumber === 1) return "REFERENCE";
  if (pct === 100) return "READY";
  return "IN_PREPARATION";
}

function crossSurahValue(
  distinctSurahs: number,
  distinctForms: number,
  totalOccurrences: number,
  fractionAlreadyCovered: number,
): number {
  if (distinctSurahs === 0) return 0;
  const uncovered = 1 - fractionAlreadyCovered;
  if (uncovered <= 0) return 0;
  return distinctSurahs * Math.log2(1 + distinctForms) * Math.log2(1 + totalOccurrences) * uncovered;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log("=== PHASE 88C — AUDIT LEXICAL PRODUCTION (READ-ONLY) ===\n");

  // ─── 0. Source ID ─────────────────────────────────────────────────
  const { data: srcRows } = await client.from("sources").select("id").eq("name", SOURCE_EDITORIAL).limit(1);
  const sourceId = (srcRows as Array<{ id: string }> | null)?.[0]?.id;
  if (!sourceId) throw new Error(`Source « ${SOURCE_EDITORIAL} » introuvable.`);
  console.log(`source éditoriale : ${sourceId.slice(0, 8)}…`);

  // ─── 1. Charger toutes les données (paginated) ─────────────────────
  console.log("\n→ Chargement paginé des données…");

  // Surahs (114 rows — no pagination needed)
  const { data: surahRows } = await client.from("surahs").select("id, number, name_transliteration, name_arabic, ayah_count").order("number");
  const surahs = (surahRows ?? []) as Array<{ id: string; number: number; name_transliteration: string | null; name_arabic: string; ayah_count: number }>;
  const surahById = new Map(surahs.map(s => [s.id, s]));
  const surahByNum = new Map(surahs.map(s => [s.number, s]));
  console.log(`  surahs : ${surahs.length}`);

  // Ayahs (6,236 rows)
  const ayahRows = await selectAll<{ id: string; surah_id: string; ayah_number: number; global_ayah_number: number }>(client, "ayahs", "id, surah_id, ayah_number, global_ayah_number");
  const ayahById = new Map(ayahRows.map(a => [a.id, a]));
  console.log(`  ayahs  : ${ayahRows.length}`);

  // quran_words (21,296 rows)
  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null }>(client, "quran_words", "id, arabic, lemma_id");
  const wordByIdPre = new Map(wordRows.map(w => [w.id, w]));
  void wordByIdPre; // reserved for future use
  console.log(`  quran_words : ${wordRows.length}`);

  // word_occurrences (77,430 rows)
  const occRows = await selectAll<{ word_id: string; ayah_id: string }>(client, "word_occurrences", "word_id, ayah_id");
  console.log(`  occurrences : ${occRows.length}`);

  // word_lemma_mapping (188 rows)
  const wlmRows = await selectAll<{ word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "word_id, lemma_id");
  console.log(`  wlm mappings : ${wlmRows.length}`);

  // word_translations FR validated (source éditoriale)
  const allWtRows = await selectAll<{ word_id: string; language: string; is_validated: boolean; source_id: string }>(client, "word_translations", "word_id, language, is_validated, source_id");
  const wtFR = allWtRows.filter(r => r.language === "fr" && r.is_validated && r.source_id === sourceId);
  const formFrSet = new Set(wtFR.map(r => r.word_id));
  console.log(`  word_translations FR val : ${formFrSet.size}`);

  // lemma_translations FR validated
  const allLtRows = await selectAll<{ lemma_id: string; text: string; language: string; is_validated: boolean; source_id: string }>(client, "lemma_translations", "lemma_id, text, language, is_validated, source_id");
  const ltFR_val = allLtRows.filter(r => r.language === "fr" && r.is_validated && r.source_id === sourceId);
  const lemmaFrSet = new Set(ltFR_val.map(r => r.lemma_id));
  const _lemmaGlossMap = new Map(ltFR_val.map(r => [r.lemma_id, r.text])); void _lemmaGlossMap;
  console.log(`  lemma_translations FR val: ${lemmaFrSet.size}`);

  // lemmas
  const { data: lemmaRows } = await client.from("lemmas").select("id, arabic");
  const lemmaById = new Map((lemmaRows ?? []).map((l: { id: string; arabic: string }) => [l.id, l]));

  // translations FR (Hamidullah)
  const trRows = await selectAll<{ ayah_id: string; text: string }>(client, "translations", "ayah_id, text");
  console.log(`  translations FR : ${trRows.length}`);

  // ─── 2. Résolution effective FR par forme ──────────────────────────
  console.log("\n→ Résolution effective FR par forme…");

  // Lemma mapping effectif : direct (quran_words.lemma_id) + word_lemma_mapping safe
  const wlmMap = new Map<string, string>(); // word_id → lemma_id
  for (const w of wordRows) {
    if (w.lemma_id) wlmMap.set(w.id, w.lemma_id);
  }
  for (const m of wlmRows) {
    if (!wlmMap.has(m.word_id)) wlmMap.set(m.word_id, m.lemma_id);
  }

  // Pour chaque forme : effectiveFr (via forme OU lemme)
  const effectiveFr = new Map<string, boolean>();
  let frCountForm = 0;
  let frCountLemma = 0;
  let frCountNone = 0;

  for (const w of wordRows) {
    if (formFrSet.has(w.id)) {
      effectiveFr.set(w.id, true);
      frCountForm++;
    } else {
      const lemmaId = wlmMap.get(w.id);
      if (lemmaId && lemmaFrSet.has(lemmaId)) {
        effectiveFr.set(w.id, true);
        frCountLemma++;
      } else {
        effectiveFr.set(w.id, false);
        frCountNone++;
      }
    }
  }

  const totalForms = wordRows.length;
  console.log(`  Formes totales       : ${totalForms}`);
  console.log(`  FR via forme         : ${frCountForm} (${Math.round(frCountForm / totalForms * 100)}%)`);
  console.log(`  FR via lemme         : ${frCountLemma} (${Math.round(frCountLemma / totalForms * 100)}%)`);
  console.log(`  Sans FR              : ${frCountNone} (${Math.round(frCountNone / totalForms * 100)}%)`);
  console.log(`  Couverture FR globale: ${Math.round((frCountForm + frCountLemma) / totalForms * 100)}%`);

  // ─── 3. Agrégation par sourate ─────────────────────────────────────
  console.log("\n→ Matrice de couverture par sourate…");

  // Construire : word_id → Set<surah_number>
  const wordSurahs = new Map<string, Set<number>>();
  for (const o of occRows) {
    const ayah = ayahById.get(o.ayah_id);
    if (!ayah) continue;
    const surah = surahById.get(ayah.surah_id);
    if (!surah) continue;
    let set = wordSurahs.get(o.word_id);
    if (!set) { set = new Set(); wordSurahs.set(o.word_id, set); }
    set.add(surah.number);
  }

  // Par sourate : calculer les formes distinctes + couverture
  const surahCoverage: Array<{
    number: number;
    name: string;
    nameArabic: string;
    ayahCount: number;
    totalForms: number;
    totalOccurrences: number;
    formsWithFR: number;
    formsWithoutFR: number;
    effectiveFrPct: number;
    status: string;
  }> = [];

  for (const surah of surahs) {
    // Formes présentes dans cette sourate
    const surahForms = new Set<string>();
    let surahOccs = 0;
    for (const o of occRows) {
      const ayah = ayahById.get(o.ayah_id);
      if (!ayah || ayah.surah_id !== surah.id) continue;
      surahForms.add(o.word_id);
      surahOccs++;
    }

    let frCount = 0;
    for (const fid of surahForms) {
      if (effectiveFr.get(fid)) frCount++;
    }
    const pct = surahForms.size > 0 ? Math.round(frCount / surahForms.size * 100) : 100;
    surahCoverage.push({
      number: surah.number,
      name: surah.name_transliteration ?? `Surah ${surah.number}`,
      nameArabic: surah.name_arabic,
      ayahCount: surah.ayah_count,
      totalForms: surahForms.size,
      totalOccurrences: surahOccs,
      formsWithFR: frCount,
      formsWithoutFR: surahForms.size - frCount,
      effectiveFrPct: pct,
      status: classifyStatus(surah.number, pct),
    });
  }

  const readyCount = surahCoverage.filter(s => s.status === "READY" || s.status === "REFERENCE").length;
  const nearReady = surahCoverage.filter(s => s.status === "IN_PREPARATION" && s.effectiveFrPct >= 90);
  const farAway = surahCoverage.filter(s => s.status === "IN_PREPARATION" && s.effectiveFrPct < 50);

  console.log(`  Sourates READY/REF  : ${readyCount}`);
  console.log(`  IN_PREP (≥90%)       : ${nearReady.length} (near ready)`);
  console.log(`  IN_PREP (<50%)       : ${farAway.length}`);
  console.log(`  IN_PREP total        : ${surahCoverage.filter(s => s.status === "IN_PREPARATION").length}`);

  if (VERBOSE) {
    console.log("\n─── TOP 20 NEAR-READY ───");
    const sorted = [...nearReady].sort((a, b) => b.effectiveFrPct - a.effectiveFrPct);
    for (const s of sorted.slice(0, 20)) {
      console.log(`  ${s.number.toString().padStart(3)} — ${s.name.padEnd(22)} ${s.effectiveFrPct}%  (${s.formsWithoutFR}/${s.totalForms} missing)`);
    }
  }

  // ─── 4. Formes manquantes sans FR ──────────────────────────────────
  console.log("\n→ Formes manquantes…");

  const missingWords = wordRows.filter(w => !effectiveFr.get(w.id));
  console.log(`  Total formes sans FR : ${missingWords.length}`);

  // Top 20 formes les plus cross-surah
  if (missingWords.length > 0) {
    const missingRanked = missingWords
      .map(w => {
        const surahNums = wordSurahs.get(w.id) ?? new Set();
        const occCount = occRows.filter(o => o.word_id === w.id).length;
        return { word_id: w.id, arabic: w.arabic, surahs: surahNums.size, occurrences: occCount };
      })
      .sort((a, b) => b.surahs - a.surahs || b.occurrences - a.occurrences);

    console.log(`\n  Top 20 formes manquantes (cross-surah) :`);
    for (const m of missingRanked.slice(0, 20)) {
      console.log(`    ${m.arabic.padEnd(25)} ${m.surahs} surahs, ${m.occurrences} occs`);
    }
  }

  // ─── 5. Analyse par lemme ──────────────────────────────────────────
  console.log("\n→ Analyse par lemme…");

  const lemmaStats = new Map<string, {
    lemmaId: string;
    arabic: string;
    formIds: Set<string>;
    surahNums: Set<number>;
    totalOccs: number;
    formsWithFr: number;
  }>();

  for (const w of wordRows) {
    const lemmaId = wlmMap.get(w.id);
    if (!lemmaId) continue;
    let ls = lemmaStats.get(lemmaId);
    if (!ls) {
      const lm = lemmaById.get(lemmaId);
      ls = {
        lemmaId,
        arabic: lm?.arabic ?? "?",
        formIds: new Set(),
        surahNums: new Set(),
        totalOccs: 0,
        formsWithFr: 0,
      };
      lemmaStats.set(lemmaId, ls);
    }
    ls.formIds.add(w.id);
    const surahSet = wordSurahs.get(w.id);
    if (surahSet) for (const sn of surahSet) ls.surahNums.add(sn);
    ls.totalOccs += occRows.filter(o => o.word_id === w.id).length;
    if (effectiveFr.get(w.id)) ls.formsWithFr++;
  }

  // CSV ranking (même pour les lemmes déjà couverts — utile pour diagnostic)
  const lemmaRanked = [...lemmaStats.values()]
    .map(ls => {
      const fractionCovered = ls.formIds.size > 0 ? ls.formsWithFr / ls.formIds.size : 0;
      const csv = crossSurahValue(ls.surahNums.size, ls.formIds.size, ls.totalOccs, fractionCovered);
      return { ...ls, fractionCovered, csv };
    })
    .sort((a, b) => b.csv - a.csv);

  const top50 = lemmaRanked.slice(0, 50);

  console.log(`\n─── TOP 50 LEMMES (production) ───\n`);
  console.log(` Rang │ Lemme                 │ Surahs │ Forms │  Occs │ Missing │   CSV │ Class`);
  console.log(`──────┼───────────────────────┼────────┼───────┼───────┼─────────┼───────┼───────`);
  for (let i = 0; i < top50.length; i++) {
    const d = top50[i];
    const missing = d.formIds.size - d.formsWithFr;
    const ar = d.arabic.padEnd(21).slice(0, 21);
    const cls = missing === 0 ? "COVERED" : d.formIds.size <= 5 ? "SAFE" : "REVIEW";
    console.log(` ${String(i + 1).padStart(3)} │ ${ar} │ ${String(d.surahNums.size).padStart(5)}  │ ${String(d.formIds.size).padStart(4)}  │ ${String(d.totalOccs).padStart(4)}  │ ${String(missing).padStart(6)}  │ ${d.csv.toFixed(1).padStart(5)} │ ${cls}`);
  }

  // ─── 6. Simulation : si on importe les gloses du top 50 ────────────
  console.log("\n→ Simulation couverture (top 50 lemmas)…");

  const top50Ids = new Set(top50.map(d => d.lemmaId));
  let newlyReady = 0;
  const newlyReadyList: string[] = [];

  for (const sc of surahCoverage) {
    const surahId = surahByNum.get(sc.number)?.id;
    if (!surahId) continue;

    // Recalcul simplifié
    const surahFormsAfter = new Set<string>();
    for (const o of occRows) {
      const ayah = ayahById.get(o.ayah_id);
      if (!ayah || ayah.surah_id !== surahId) continue;
      surahFormsAfter.add(o.word_id);
    }

    let afterFr = 0;
    for (const fid of surahFormsAfter) {
      if (effectiveFr.get(fid)) afterFr++;
      else {
        const lemmaId = wlmMap.get(fid);
        if (lemmaId && top50Ids.has(lemmaId)) afterFr++;
      }
    }

    const pctAfter = surahFormsAfter.size > 0 ? Math.round(afterFr / surahFormsAfter.size * 100) : 100;
    const wasReady = sc.status === "READY" || sc.status === "REFERENCE";
    const isReady = classifyStatus(sc.number, pctAfter) === "READY" || classifyStatus(sc.number, pctAfter) === "REFERENCE";

    if (!wasReady && isReady) {
      newlyReady++;
      newlyReadyList.push(`${sc.number} — ${sc.name} (${sc.effectiveFrPct}% → ${pctAfter}%)`);
    }
  }

  const simulatedReady = readyCount + newlyReady;
  console.log(`  READY avant  : ${readyCount}`);
  console.log(`  READY après  : ${simulatedReady}`);
  console.log(`  Nouvellement : ${newlyReady}`);

  if (newlyReadyList.length > 0) {
    console.log(`\n  Sourates débloquées :`);
    for (const s of newlyReadyList) console.log(`    ${s}`);
  }

  // ─── 7. Formes sans lemme ──────────────────────────────────────────
  console.log("\n→ Formes sans lemma…");
  const noLemma = wordRows.filter(w => !wlmMap.has(w.id));
  const noLemmaFr = noLemma.filter(w => !effectiveFr.get(w.id));
  console.log(`  Total sans lemme        : ${noLemma.length} (${Math.round(noLemma.length / totalForms * 100)}%)`);
  console.log(`  Dont sans FR            : ${noLemmaFr.length}`);

  if (noLemmaFr.length > 0 && VERBOSE) {
    const noLemmaRanked = noLemmaFr
      .map(w => ({ arabic: w.arabic, surahs: (wordSurahs.get(w.id) ?? new Set()).size, occs: occRows.filter(o => o.word_id === w.id).length }))
      .sort((a, b) => b.surahs - a.surahs || b.occs - a.occs);
    console.log(`\n  Top 20 formes sans lemme + sans FR :`);
    for (const r of noLemmaRanked.slice(0, 20)) {
      console.log(`    ${r.arabic.padEnd(25)} ${r.surahs} surahs, ${r.occs} occs`);
    }
  }

  // ─── 8. Rapport JSON ───────────────────────────────────────────────
  const report = {
    phase: "88C",
    mode: "PRODUCTION_AUDIT_READ_ONLY",
    timestamp: new Date().toISOString(),
    dbSnapshot: {
      surahs: surahs.length,
      ayahs: ayahRows.length,
      quranWords: wordRows.length,
      occurrences: occRows.length,
      wordTranslationsFr: formFrSet.size,
      lemmaTranslationsFr: lemmaFrSet.size,
      lemmas: lemmaById.size,
      wlmMappings: wlmRows.length,
      sources: 6,
    },
    coverage: {
      totalForms,
      frViaForm: frCountForm,
      frViaLemma: frCountLemma,
      frNone: frCountNone,
      coveragePct: Math.round((frCountForm + frCountLemma) / totalForms * 100),
      readySurahs: readyCount,
      inPrepSurahs: surahCoverage.filter(s => s.status === "IN_PREPARATION").length,
      nearReadySurahs: nearReady.length,
      farAwaySurahs: farAway.length,
      formsWithoutLemma: noLemma.length,
      formsWithoutLemmaAndFr: noLemmaFr.length,
    },
    surahCoverage: surahCoverage.map(s => ({
      ...s,
      nameArabic: undefined, // trop lourd pour le JSON
    })),
    top50Lemmas: top50.map(d => ({
      lemmaId: d.lemmaId,
      arabic: d.arabic,
      distinctSurahs: d.surahNums.size,
      distinctForms: d.formIds.size,
      totalOccurrences: d.totalOccs,
      formsWithFr: d.formsWithFr,
      formsMissing: d.formIds.size - d.formsWithFr,
      crossSurahValue: Math.round(d.csv * 100) / 100,
      fractionCovered: Math.round(d.fractionCovered * 100) / 100,
    })),
    simulation: {
      readyBefore: readyCount,
      readyAfter: simulatedReady,
      newlyReady,
      newlyReadySurahs: newlyReadyList,
    },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/phase-88c-production-lexical-audit.json", JSON.stringify(report, null, 2) + "\n");
  console.log(`\n  Rapport → reports/phase-88c-production-lexical-audit.json`);

  // ─── 9. Sourates near-ready (Quick Wins) ───────────────────────────
  if (nearReady.length > 0) {
    console.log(`\n─── QUICK WIN SOURATES (≥90% FR, presque READY) ───`);
    const quickWins = [...nearReady].sort((a, b) => b.effectiveFrPct - a.effectiveFrPct);
    for (const s of quickWins) {
      console.log(`  ${s.number.toString().padStart(3)} — ${s.name.padEnd(22)} ${s.effectiveFrPct}%  (manque ${s.formsWithoutFR}/${s.totalForms} formes)`);
    }
  }

  console.log(`\n=== PHASE 88C — AUDIT TERMINÉ (0 écriture DB) ===`);
}

main().catch(err => {
  console.error("Phase 88C échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});