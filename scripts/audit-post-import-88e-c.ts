/**
 * Phase 88E-C — Post-import Lemma Integrity & Coverage Audit
 * READ-ONLY STRICT — 0 DB writes.
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
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

  console.log("=== PHASE 88E-C — POST-IMPORT LEMMA AUDIT (READ-ONLY) ===\n");

  // ─── Load everything ──────────────────────────────────────────────────────
  console.log("→ Loading data (paginated)…");

  const lemmas = await selectAll<{ id: string; arabic: string; source_id: string | null }>(client, "lemmas", "id, arabic, source_id");
  const lemmaById = new Map(lemmas.map(l => [l.id, l]));

  const wlmRows = await selectAll<{ word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "word_id, lemma_id");

  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null }>(client, "quran_words", "id, arabic, lemma_id");

  const occRows = await selectAll<{ id: string; word_id: string; ayah_id: string }>(client, "word_occurrences", "id, word_id, ayah_id");

  const ayahRows = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");
  const ayahToSurah = new Map(ayahRows.map(a => [a.id, a.surah_id]));

  const surahRows = await selectAll<{ id: string; number: number; name_transliteration: string | null }>(client, "surahs", "id, number, name_transliteration");
  const surahNumById = new Map(surahRows.map(s => [s.id, s.number]));
  const surahById = new Map(surahRows.map(s => [s.id, s]));

  const wtRows = await selectAll<{ word_id: string; language: string; is_validated: boolean; source_id: string }>(client, "word_translations", "word_id, language, is_validated, source_id");
  const ltRows = await selectAll<{ lemma_id: string; language: string; is_validated: boolean; source_id: string }>(client, "lemma_translations", "lemma_id, language, is_validated, source_id");

  const masaqRows = await selectAll<{ word_occurrence_id: string; hikma_lemma_id: string | null }>(client, "linguistic_occurrences", "word_occurrence_id, hikma_lemma_id");

  console.log(`  lemmas: ${lemmas.length} | wlm: ${wlmRows.length} | words: ${wordRows.length} | occs: ${occRows.length}`);
  console.log(`  ayahs: ${ayahRows.length} | surahs: ${surahRows.length} | wt: ${wtRows.length} | lt: ${ltRows.length} | masaq: ${masaqRows.length}`);

  // Hikma source
  const srcRows = await client.from("sources").select("id").eq("name", "Hikma — lexique éditorial").limit(1);
  const hikmaId = (srcRows.data?.[0] as any)?.id ?? "";

  // Validated FR maps
  const wtFrSet = new Set(wtRows.filter(r => r.language === "fr" && r.is_validated).map(r => r.word_id));
  const ltFrSet = new Set(ltRows.filter(r => r.language === "fr" && r.is_validated).map(r => r.lemma_id));

  // ─── 1. Resolution path per word ──────────────────────────────────────────
  console.log("\n━━━ 1. RESOLUTION PATH (quran_word → lemma) ━━━");

  const directLemmaMap = new Map<string, string>(); // A: quran_words.lemma_id
  for (const w of wordRows) { if (w.lemma_id) directLemmaMap.set(w.id, w.lemma_id); }

  const wlmMap = new Map<string, string>(); // B: word_lemma_mapping
  for (const m of wlmRows) { if (!wlmMap.has(m.word_id)) wlmMap.set(m.word_id, m.lemma_id); }

  // C: MASAQ indirect (occurrence → hikma_lemma_id)
  const masaqWordToLemma = new Map<string, Set<string>>();
  const occToWord = new Map(occRows.map(o => [o.id, o.word_id]));
  for (const m of masaqRows) {
    if (!m.hikma_lemma_id) continue;
    const wid = occToWord.get(m.word_occurrence_id);
    if (!wid) continue;
    let set = masaqWordToLemma.get(wid);
    if (!set) { set = new Set(); masaqWordToLemma.set(wid, set); }
    set.add(m.hikma_lemma_id);
  }

  // Final resolution (dedup, no double counting)
  const finalLemma = new Map<string, string>(); // word_id → lemma_id (unique)
  let pathA = 0, pathB = 0, pathC = 0, pathNone = 0, pathConflict = 0;
  const conflictWords: string[] = [];

  for (const w of wordRows) {
    const direct = directLemmaMap.get(w.id);
    if (direct) {
      finalLemma.set(w.id, direct);
      pathA++;
      continue;
    }
    const wlm = wlmMap.get(w.id);
    if (wlm) {
      finalLemma.set(w.id, wlm);
      pathB++;
      continue;
    }
    const masaqLemmas = masaqWordToLemma.get(w.id);
    if (masaqLemmas && masaqLemmas.size === 1) {
      finalLemma.set(w.id, [...masaqLemmas][0]);
      pathC++;
      continue;
    }
    if (masaqLemmas && masaqLemmas.size > 1) {
      pathConflict++;
      conflictWords.push(w.id);
      continue;
    }
    pathNone++;
  }

  const total = wordRows.length;
  console.log(`  A (direct lemma_id)    : ${pathA} (${(pathA / total * 100).toFixed(1)}%)`);
  console.log(`  B (word_lemma_mapping) : ${pathB} (${(pathB / total * 100).toFixed(1)}%)`);
  console.log(`  C (MASAQ indirect)     : ${pathC} (${(pathC / total * 100).toFixed(1)}%)`);
  console.log(`  None                   : ${pathNone} (${(pathNone / total * 100).toFixed(1)}%)`);
  console.log(`  Conflict (multi-lemma) : ${pathConflict}`);
  console.log(`  Total resolved         : ${pathA + pathB + pathC} (${((pathA + pathB + pathC) / total * 100).toFixed(1)}%)`);

  // ─── 2. Lemma usage ──────────────────────────────────────────────────────
  console.log("\n━━━ 2. LEMMA USAGE ━━━");

  const lemmaFormCount = new Map<string, number>();
  const lemmaOccCount = new Map<string, number>();
  const lemmaSurahSet = new Map<string, Set<number>>();

  // count forms per lemma (from final resolution)
  for (const [, lemmaId] of finalLemma) {
    lemmaFormCount.set(lemmaId, (lemmaFormCount.get(lemmaId) ?? 0) + 1);
  }

  // occurrences per lemma
  for (const o of occRows) {
    const lid = finalLemma.get(o.word_id);
    if (!lid) continue;
    lemmaOccCount.set(lid, (lemmaOccCount.get(lid) ?? 0) + 1);
    const surahId = ayahToSurah.get(o.ayah_id);
    const sn = surahId ? surahNumById.get(surahId) : undefined;
    if (sn !== undefined) {
      let set = lemmaSurahSet.get(lid);
      if (!set) { set = new Set(); lemmaSurahSet.set(lid, set); }
      set.add(sn);
    }
  }

  const usedLemmas = new Set(finalLemma.values());
  const orphanLemmas = lemmas.filter(l => !usedLemmas.has(l.id));
  console.log(`  Total lemmas      : ${lemmas.length}`);
  console.log(`  Used lemmas       : ${usedLemmas.size}`);
  console.log(`  Orphan lemmas     : ${orphanLemmas.length}`);

  if (orphanLemmas.length > 0) {
    console.log(`\n  Orphan lemma samples (${Math.min(10, orphanLemmas.length)}):`);
    for (const l of orphanLemmas.slice(0, 10)) console.log(`    ${l.arabic.padEnd(20)} ${l.id.slice(0, 8)}…`);
  }

  // ─── 3. Surah lemma coverage ─────────────────────────────────────────────
  console.log("\n━━━ 3. SURAH LEMMA COVERAGE ━━━");

  const surahForms = new Map<number, Set<string>>();
  for (const o of occRows) {
    const surahId = ayahToSurah.get(o.ayah_id);
    const sn = surahId ? surahNumById.get(surahId) : undefined;
    if (sn === undefined) continue;
    let set = surahForms.get(sn);
    if (!set) { set = new Set(); surahForms.set(sn, set); }
    set.add(o.word_id);
  }

  const surahCoverage: Array<{ number: number; name: string; totalForms: number; withLemma: number; pct: number }> = [];
  for (const [sn, forms] of surahForms) {
    let withLemma = 0;
    for (const wid of forms) {
      if (finalLemma.has(wid)) withLemma++;
    }
    const pct = forms.size > 0 ? Math.round(withLemma / forms.size * 100) : 100;
    const surah = surahById.get([...surahNumById].find(([, n]) => n === sn)?.[0] ?? "");
    surahCoverage.push({ number: sn, name: surah?.name_transliteration ?? `Surah ${sn}`, totalForms: forms.size, withLemma, pct });
  }
  surahCoverage.sort((a, b) => a.number - b.number);

  const ge90 = surahCoverage.filter(s => s.pct >= 90).length;
  const ge95 = surahCoverage.filter(s => s.pct >= 95).length;
  const ge99 = surahCoverage.filter(s => s.pct >= 99).length;
  const full = surahCoverage.filter(s => s.pct === 100).length;

  console.log(`  Surahs with ≥90% lemma coverage : ${ge90}`);
  console.log(`  Surahs with ≥95% lemma coverage : ${ge95}`);
  console.log(`  Surahs with ≥99% lemma coverage : ${ge99}`);
  console.log(`  Surahs with 100% lemma coverage : ${full}`);

  // ─── 4. FR coverage simulation ───────────────────────────────────────────
  console.log("\n━━━ 4. FR COVERAGE SIMULATION ━━━");

  let frViaWord = 0, frViaLemma = 0, frNone = 0;
  const frUnion = new Set<string>();

  for (const w of wordRows) {
    const hasWordFr = wtFrSet.has(w.id);
    const lemmaId = finalLemma.get(w.id);
    const hasLemmaFr = lemmaId ? ltFrSet.has(lemmaId) : false;

    if (hasWordFr) frViaWord++;
    else if (hasLemmaFr) frViaLemma++;
    else frNone++;

    if (hasWordFr || hasLemmaFr) frUnion.add(w.id);
  }

  console.log(`  FR via word_translation  : ${frViaWord}`);
  console.log(`  FR via lemma_translation  : ${frViaLemma}`);
  console.log(`  Sans FR                   : ${frNone}`);
  console.log(`  Union FR                  : ${frUnion.size} (${(frUnion.size / total * 100).toFixed(1)}%)`);

  // Max theoretical (all mapped lemmas get a FR gloss)
  let maxFr = frUnion.size;
  const mappedNoFr = new Set<string>();
  for (const w of wordRows) {
    const lemmaId = finalLemma.get(w.id);
    if (!lemmaId) continue;
    if (!wtFrSet.has(w.id) && !ltFrSet.has(lemmaId)) {
      maxFr++;
      mappedNoFr.add(w.id);
    }
  }
  console.log(`\n  Potentiel max théorique  : ${maxFr} (${(maxFr / total * 100).toFixed(1)}%)`);
  console.log(`  Formes mappées sans FR   : ${mappedNoFr.size}`);

  // ─── 5. Top 100 lemmas for Phase 88F ─────────────────────────────────────
  console.log("\n━━━ 5. TOP 100 LEMMAS (Phase 88F priority) ━━━");

  const ranked = lemmas.map(l => {
    const forms = lemmaFormCount.get(l.id) ?? 0;
    const occs = lemmaOccCount.get(l.id) ?? 0;
    const surahs = lemmaSurahSet.get(l.id)?.size ?? 0;
    const hasGloss = ltFrSet.has(l.id);

    // forms without FR (need to trace forms per lemma)
    let formsWithFr = 0;
    for (const [wid, lid] of finalLemma) {
      if (lid !== l.id) continue;
      if (wtFrSet.has(wid) || (finalLemma.has(wid) && ltFrSet.has(lid))) formsWithFr++;
    }
    const formsWithoutFr = Math.max(0, forms - formsWithFr);

    const score = surahs * Math.log2(1 + formsWithoutFr) * Math.log2(1 + occs) * (hasGloss ? 0.01 : 1);

    return {
      id: l.id,
      arabic: l.arabic,
      forms,
      occs,
      surahs,
      formsWithFr,
      formsWithoutFr,
      hasGloss,
      score: Math.round(score * 100) / 100,
    };
  }).sort((a, b) => b.score - a.score);

  const top100 = ranked.slice(0, 100);

  console.log(`  Top 100 (highest score, no existing gloss prioritized):`);
  console.log(`\n  Rank │ Lemma                │ Surahs │ Forms │ Occs │ w/o FR │ Score`);
  console.log(`  ─────┼──────────────────────┼────────┼───────┼──────┼────────┼────────`);
  for (let i = 0; i < Math.min(30, top100.length); i++) {
    const r = top100[i];
    console.log(`  ${String(i + 1).padStart(4)} │ ${r.arabic.padEnd(20).slice(0, 20)} │ ${String(r.surahs).padStart(5)}  │ ${String(r.forms).padStart(4)}  │ ${String(r.occs).padStart(4)} │ ${String(r.formsWithoutFr).padStart(5)}  │ ${r.score}`);
  }

  // ─── 6. Integrity checks ─────────────────────────────────────────────────
  console.log("\n━━━ 6. INTEGRITY CHECKS ━━━");

  // 6a. lemma_id referenced but absent
  const missingLemmaRefs = new Set<string>();
  for (const [, lid] of finalLemma) {
    if (!lemmaById.has(lid)) missingLemmaRefs.add(lid);
  }
  for (const m of wlmRows) {
    if (!lemmaById.has(m.lemma_id)) missingLemmaRefs.add(m.lemma_id);
  }
  console.log(`  lemma_id référencés mais absents : ${missingLemmaRefs.size}`);

  // 6b. duplicated word_lemma_mapping
  const wlmWordCount = new Map<string, number>();
  for (const m of wlmRows) wlmWordCount.set(m.word_id, (wlmWordCount.get(m.word_id) ?? 0) + 1);
  const dupWlm = [...wlmWordCount].filter(([, c]) => c > 1);
  console.log(`  word_lemma_mapping dupliqués    : ${dupWlm.length}`);

  // 6c. contradiction between quran_words.lemma_id and wlm
  let contradictions = 0;
  for (const [wid, directLid] of directLemmaMap) {
    const wlmLid = wlmMap.get(wid);
    if (wlmLid && wlmLid !== directLid) contradictions++;
  }
  console.log(`  Contradictions direct vs wlm     : ${contradictions}`);

  // 6d. lemmas with no forms (orphans)
  console.log(`  Lemmas orphelins (0 forme)       : ${orphanLemmas.length}`);

  // ─── 7. Write reports ────────────────────────────────────────────────────
  const report = {
    phase: "88E-C",
    mode: "READ_ONLY_POST_IMPORT_AUDIT",
    timestamp: new Date().toISOString(),
    resolution: {
      pathA_directLemmaId: pathA,
      pathB_wordLemmaMapping: pathB,
      pathC_masaqIndirect: pathC,
      pathNone: pathNone,
      pathConflict: pathConflict,
      totalResolved: pathA + pathB + pathC,
      total: total,
    },
    lemmas: {
      total: lemmas.length,
      used: usedLemmas.size,
      orphan: orphanLemmas.length,
    },
    surahCoverage: surahCoverage,
    surahCoverageSummary: { ge90, ge95, ge99, full100: full },
    frCoverage: {
      viaWord: frViaWord,
      viaLemma: frViaLemma,
      none: frNone,
      union: frUnion.size,
      unionPct: Math.round(frUnion.size / total * 100),
      maxTheoretical: maxFr,
      maxTheoreticalPct: Math.round(maxFr / total * 100),
    },
    top100Lemmas: top100,
    integrity: {
      missingLemmaRefs: missingLemmaRefs.size,
      duplicatedWlm: dupWlm.length,
      directWlmContradictions: contradictions,
      orphanLemmas: orphanLemmas.length,
    },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/phase-88e-c-post-import-audit.json", JSON.stringify(report, null, 2) + "\n");
  writeFileSync("reports/phase-88e-c-top-100-lemma-priority.json", JSON.stringify(top100, null, 2) + "\n");

  console.log(`\n  Reports written:`);
  console.log(`    reports/phase-88e-c-post-import-audit.json`);
  console.log(`    reports/phase-88e-c-top-100-lemma-priority.json`);

  console.log(`\n=== PHASE 88E-C — AUDIT TERMINÉ (0 écriture DB) ===`);
}

main().catch(err => { console.error(err); process.exit(1); });