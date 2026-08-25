/**
 * PHASE 88F-U — GLOBAL LEXICAL PROPAGATION / LONG-SURAH ROI AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Measures the GLOBAL propagation effect of translating untranslated SAFE
 * lemmas: how many forms / occurrences / surahs each lemma would unlock
 * beyond its own surah. Produces local-vs-global ROI rankings and a
 * strategy comparison (READY-FIRST vs LEXICAL-FIRST vs LONG-SURAH-FIRST).
 *
 * Only paginated Supabase `.select()` reads + local JSON report write.
 * No inserts/updates/upserts/deletes/rpcs.
 *
 * Livrable : reports/phase-88f-u-global-lexical-propagation.json
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const PAGE_SIZE = 1000;
const OUTPUT = "reports/phase-88f-u-global-lexical-propagation.json";
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const HAMIDULLAH_TR = "Muhammad Hamidullah";
const KAZIMIRSKI_TR = "Albert de Biberstein-Kazimirski";
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// STATIC READ-ONLY GUARANTEE: only .select() reads. Write patterns:
//   .insert(  .update(  .upsert(  .delete(  .rpc(

type SourceRow = { id: string; name: string };
type SurahRow = { id: string; number: number; name_transliteration: string | null };
type AyahRow = { id: string; surah_id: string; ayah_number?: number; global_ayah_number?: number };
type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccRow = { id: string; word_id: string; ayah_id: string };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { id: string; word_id: string; lemma_id: string };
type TranslationRow = { ayah_id: string; translator: string; text: string };
type WordTranslationRow = { id: string; word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null };
type LemmaTranslationRow = { id: string; lemma_id: string; text: string; language: string; is_validated: boolean; source_id: string | null };
type LoRow = { id: string; word_occurrence_id: string; hikma_lemma_id: string | null; lemma_mapping_status: string; masaq_gloss_en: string | null; masaq_stem: string | null; pos: string[] };

function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch { /* OK */ }
  }
}
async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}
function increment(map: Map<string, number>, key: string): void { map.set(key, (map.get(key) ?? 0) + 1); }
async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const startedAt = Date.now();

  console.log("=== PHASE 88F-U — GLOBAL LEXICAL PROPAGATION AUDIT (READ-ONLY) ===\n");

  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === HIKMA_SOURCE);
  if (!hikmaSource) throw new Error(`Source « ${HIKMA_SOURCE} » introuvable.`);

  const [surahs, ayahs, words, occurrences, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences, verseTranslations] =
    await Promise.all([
      selectAll<SurahRow>(client, "surahs", "id, number, name_transliteration"),
      selectAll<AyahRow>(client, "ayahs", "id, surah_id, ayah_number, global_ayah_number"),
      selectAll<WordRow>(client, "quran_words", "id, arabic, lemma_id"),
      selectAll<OccRow>(client, "word_occurrences", "id, word_id, ayah_id"),
      selectAll<LemmaRow>(client, "lemmas", "id, arabic"),
      selectAll<WlmRow>(client, "word_lemma_mapping", "id, word_id, lemma_id"),
      selectAll<WordTranslationRow>(client, "word_translations", "id, word_id, text, language, is_validated, source_id"),
      selectAll<LemmaTranslationRow>(client, "lemma_translations", "id, lemma_id, text, language, is_validated, source_id"),
      selectAll<LoRow>(client, "linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, lemma_mapping_status, masaq_gloss_en, masaq_stem, pos"),
      selectAll<TranslationRow>(client, "translations", "ayah_id, translator, text"),
    ]);
  console.log(`Chargé: surahs=${surahs.length} words=${words.length} occs=${occurrences.length} wlm=${wlm.length} wt=${wordTranslations.length} lt=${lemmaTranslations.length} lo=${linguisticOccurrences.length}`);

  // INDEXES
  const lemmaById = new Map(lemmas.map((l) => [l.id, l]));
  const occById = new Map(occurrences.map((o) => [o.id, o]));
  const ayahById = new Map(ayahs.map((a) => [a.id, a]));
  const surahById = new Map(surahs.map((s) => [s.id, s]));
  const surahNameByNumber = new Map(surahs.map((s) => [s.number, s.name_transliteration ?? `Surah ${s.number}`]));
  const wlmByWord = new Map<string, WlmRow>();
  for (const r of wlm) if (!wlmByWord.has(r.word_id)) wlmByWord.set(r.word_id, r);
  const occCountByWord = new Map<string, number>();
  for (const occ of occurrences) increment(occCountByWord, occ.word_id);

  // word → surahs
  const wordSurahs = new Map<string, Set<number>>();
  for (const occ of occurrences) {
    const ayah = ayahById.get(occ.ayah_id); const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (!surah) continue;
    let set = wordSurahs.get(occ.word_id); if (!set) { set = new Set(); wordSurahs.set(occ.word_id, set); } set.add(surah.number);
  }

  // lo by word
  const loByWord = new Map<string, LoRow[]>();
  for (const row of linguisticOccurrences) {
    const occ = occById.get(row.word_occurrence_id);
    if (occ) { const list = loByWord.get(occ.word_id) ?? []; list.push(row); loByWord.set(occ.word_id, list); }
  }

  // verse translations per ayah
  const ayahHasHam = new Set<string>(), ayahHasKaz = new Set<string>();
  for (const tr of verseTranslations) { if (tr.translator === HAMIDULLAH_TR) ayahHasHam.add(tr.ayah_id); else if (tr.translator === KAZIMIRSKI_TR) ayahHasKaz.add(tr.ayah_id); }

  // FR COVERAGE
  const wtFr = new Map<string, string>();
  for (const r of wordTranslations) if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) wtFr.set(r.word_id, r.text);
  const ltFr = new Map<string, string>();
  for (const r of lemmaTranslations) if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) ltFr.set(r.lemma_id, r.text);

  const finalLemma = new Map<string, string>();
  for (const w of words) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlm) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  for (const l of linguisticOccurrences) { if (!l.hikma_lemma_id) continue; const occ = occById.get(l.word_occurrence_id); if (occ && !finalLemma.has(occ.word_id)) finalLemma.set(occ.word_id, l.hikma_lemma_id); }

  const pathA = new Set(wtFr.keys());
  const pathB = new Set<string>(), pathC = new Set<string>(), pathD = new Set<string>();
  for (const w of words) if (w.lemma_id && ltFr.has(w.lemma_id)) pathB.add(w.id);
  for (const m of wlm) if (ltFr.has(m.lemma_id)) pathC.add(m.word_id);
  for (const l of linguisticOccurrences) { if (!l.hikma_lemma_id || !ltFr.has(l.hikma_lemma_id)) continue; const occ = occById.get(l.word_occurrence_id); if (occ) pathD.add(occ.word_id); }
  const union = new Set<string>(pathA); for (const wid of pathB) union.add(wid); for (const wid of pathC) union.add(wid); for (const wid of pathD) union.add(wid);
  let frOcc = 0; for (const wid of union) frOcc += occCountByWord.get(wid) ?? 0;

  // SURAH FORMS
  const surahForms = new Map<number, Set<string>>();
  for (const occ of occurrences) { const ayah = ayahById.get(occ.ayah_id); const surah = ayah ? surahById.get(ayah.surah_id) : undefined; if (!surah) continue; let s = surahForms.get(surah.number); if (!s) { s = new Set(); surahForms.set(surah.number, s); } s.add(occ.word_id); }
  let readyCount = 0, inPrepCount = 0, refCount = 0;
  for (const [sn, f] of surahForms) { const c = [...f].filter((w) => union.has(w)).length; if (sn === 1) refCount++; else if (f.size > 0 && c === f.size) readyCount++; else inPrepCount++; }

  // ─── LEMMA EVIDENCE (MASAQ quality + source coverage) ────────────────────
  // For each lemma, aggregate evidence across all words mapped to it.
  const lemmaWords = new Map<string, Set<string>>();
  for (const [wid, lid] of finalLemma) { let s = lemmaWords.get(lid); if (!s) { s = new Set(); lemmaWords.set(lid, s); } s.add(wid); }

  function lemmaEvidence(lid: string) {
    const ws = [...(lemmaWords.get(lid) ?? new Set<string>())];
    let total = 0, exact = 0; const stemSet = new Set<string>(); let hasSource = false; let forms = 0; let occs = 0; const surahSet = new Set<number>();
    for (const wid of ws) {
      forms++; occs += occCountByWord.get(wid) ?? 0;
      for (const sn of wordSurahs.get(wid) ?? []) surahSet.add(sn);
      const los = loByWord.get(wid) ?? [];
      for (const lo of los) { total++; if (lo.lemma_mapping_status === "EXACT") exact++; if (lo.masaq_stem) stemSet.add(lo.masaq_stem); }
      const occsOf = occurrences.filter((o) => o.word_id === wid);
      for (const o of occsOf) { if (ayahHasHam.has(o.ayah_id) || ayahHasKaz.has(o.ayah_id)) { hasSource = true; break; } }
    }
    const quality = total > 0 ? ROUND(exact / total, 3) : null;
    const safe = quality !== null && quality >= 0.8 && hasSource;
    return { forms, occs, surahs: surahSet.size, quality, hasSource, stemCount: stemSet.size, safe };
  }

  // ─── PROPAGATION MAP FOR UNTRANSLATED SAFE LEMMAS ────────────────────────
  // A lemma is "actionable SAFE" if: has a canonical lemma (in finalLemma),
  // no FR translation yet, and evidence is SAFE.
  const safeLemmas: Array<{ lemmaId: string; arabic: string; forms: number; occs: number; surahs: number; quality: number | null }> = [];
  const reviewLemmas: Array<{ lemmaId: string; arabic: string; forms: number; occs: number; surahs: number; quality: number | null }> = [];

  for (const [lid] of lemmaWords) {
    if (ltFr.has(lid)) continue; // already translated
    const ev = lemmaEvidence(lid);
    const arabic = lemmaById.get(lid)?.arabic ?? "";
    const entry = { lemmaId: lid, arabic, forms: ev.forms, occs: ev.occs, surahs: ev.surahs, quality: ev.quality };
    if (ev.safe) safeLemmas.push(entry); else reviewLemmas.push(entry);
  }
  safeLemmas.sort((a, b) => b.forms - a.forms || b.occs - a.occs || b.surahs - a.surahs);
  reviewLemmas.sort((a, b) => b.forms - a.forms || b.occs - a.occs);

  // ─── PER-SURAH ANALYSIS ──────────────────────────────────────────────────
  interface SurahLex {
    number: number; name: string; totalForms: number; coveredForms: number; missingForms: number;
    coveragePct: number; safeLemmaCount: number; safeLemmaFormsLocal: number;
    safeWordTrCount: number; reviewWordTrCount: number; totalActions: number;
    globalFormsUnlocked: number; globalOccsUnlocked: number; globalSurahsAffected: number;
    localRoi: number; globalRoi: number;
  }

  const surahLex: SurahLex[] = [];

  for (const [sn, forms] of surahForms) {
    if (sn === 1) continue;
    const cov = [...forms].filter((w) => union.has(w)).length;
    if (cov === forms.size) continue; // already READY

    const missing = [...forms].filter((w) => !union.has(w));
    // collect untranslated SAFE lemmas of this surah's missing forms
    const surahSafeLemmaIds = new Set<string>();
    for (const wid of missing) {
      const lid = finalLemma.get(wid) ?? null;
      if (lid && !ltFr.has(lid)) {
        const ev = lemmaEvidence(lid);
        if (ev.safe) surahSafeLemmaIds.add(lid);
      }
    }
    // distinct lemmas needing gloss (all untranslated lemmas of missing forms)
    const allLemmaIds = new Set<string>();
    let safeLemmaFormsLocal = 0;
    for (const wid of missing) {
      const lid = finalLemma.get(wid) ?? null;
      if (lid && !ltFr.has(lid)) { allLemmaIds.add(lid); if (surahSafeLemmaIds.has(lid)) safeLemmaFormsLocal++; }
    }
    const wordTrNeeded = missing.filter((w) => !finalLemma.has(w)).length;
    const totalActions = allLemmaIds.size + wordTrNeeded;

    // global propagation of this surah's SAFE lemmas
    let gForms = 0, gOccs = 0; const gSurahs = new Set<number>();
    for (const lid of surahSafeLemmaIds) {
      const ev = lemmaEvidence(lid);
      gForms += ev.forms; gOccs += ev.occs;
      for (const sn2 of [...(lemmaWords.get(lid) ?? new Set<string>())].flatMap((w) => [...(wordSurahs.get(w) ?? [])])) gSurahs.add(sn2);
    }
    const localRoi = totalActions > 0 ? ROUND(missing.length / totalActions, 2) : 0;
    const globalRoi = totalActions > 0 ? ROUND((gForms + gOccs + gSurahs.size) / totalActions, 2) : 0;

    surahLex.push({
      number: sn, name: surahNameByNumber.get(sn) ?? `Surah ${sn}`,
      totalForms: forms.size, coveredForms: cov, missingForms: missing.length,
      coveragePct: ROUND(cov / forms.size, 4),
      safeLemmaCount: surahSafeLemmaIds.size, safeLemmaFormsLocal,
      safeWordTrCount: 0, reviewWordTrCount: wordTrNeeded,
      totalActions, globalFormsUnlocked: gForms, globalOccsUnlocked: gOccs,
      globalSurahsAffected: gSurahs.size, localRoi, globalRoi,
    });
  }

  // ─── TOP 20 BY GLOBAL ROI ────────────────────────────────────────────────
  const top20 = [...surahLex].sort((a, b) => b.globalRoi - a.globalRoi || b.globalFormsUnlocked - a.globalFormsUnlocked).slice(0, 20);

  // ─── TOP 100 LEMMAS ──────────────────────────────────────────────────────
  const topSafeLemmas = safeLemmas.slice(0, 100).map((l) => ({ lemma: l.arabic, lemma_id: l.lemmaId, quality: l.quality, status: "SAFE", forms_unlocked: l.forms, occurrences_unlocked: l.occs, surahs_affected: l.surahs }));
  const topReviewLemmas = reviewLemmas.slice(0, 100).map((l) => ({ lemma: l.arabic, lemma_id: l.lemmaId, quality: l.quality, status: "REVIEW", forms_unlocked: l.forms, occurrences_unlocked: l.occs, surahs_affected: l.surahs }));

  // ─── LONG SURAH PRIORITY ─────────────────────────────────────────────────
  const longSurah = [...surahLex].sort((a, b) => b.totalForms - a.totalForms).slice(0, 20).map((s) => ({ number: s.number, name: s.name, totalForms: s.totalForms, missingForms: s.missingForms, safeLemmaCount: s.safeLemmaCount, globalFormsUnlocked: s.globalFormsUnlocked, globalOccsUnlocked: s.globalOccsUnlocked, globalRoi: s.globalRoi }));

  // ─── STRATEGY SIMULATION ─────────────────────────────────────────────────
  // Strategy B (lexical-first): simulate translating ALL top-100 SAFE lemmas
  const topSafeLemmaSet = new Set(safeLemmas.slice(0, 100).map((l) => l.lemmaId));
  const simB = new Set(union);
  for (const [wid, lid] of finalLemma) if (topSafeLemmaSet.has(lid)) simB.add(wid);
  let simBOccs = 0; for (const wid of simB) simBOccs += occCountByWord.get(wid) ?? 0;
  let simBReady = 0; for (const [sn, f] of surahForms) { if (sn === 1) continue; const c = [...f].filter((w) => simB.has(w)).length; if (f.size > 0 && c === f.size) simBReady++; }
  const simBForms = simB.size - union.size;
  const simBOccurrences = simBOccs - frOcc;

  // Strategy A (ready-first): simulate the 20 best-ready surahs (localRoi desc)
  const readyFirstSet = new Set<string>();
  const readyFirstSurahs = [...surahLex].sort((a, b) => a.totalActions - b.totalActions || b.coveragePct - a.coveragePct).slice(0, 20);
  for (const s of readyFirstSurahs) {
    // add all missing forms of those surahs (via their lemmas + word_tr — approximate with all missing forms)
    const f = surahForms.get(s.number) ?? new Set<string>();
    for (const wid of f) if (!union.has(wid)) readyFirstSet.add(wid);
  }
  const simA = new Set(union); for (const wid of readyFirstSet) simA.add(wid);
  let simAReady = 0; for (const [sn, f] of surahForms) { if (sn === 1) continue; const c = [...f].filter((w) => simA.has(w)).length; if (f.size > 0 && c === f.size) simAReady++; }

  // ─── INTEGRITY ────────────────────────────────────────────────────────────
  const lSet = new Set(lemmas.map((l) => l.id));
  let oq = 0, ow = 0, ol = 0, olt = 0;
  for (const w of words) if (w.lemma_id && !lSet.has(w.lemma_id)) oq++;
  for (const m of wlm) if (!lSet.has(m.lemma_id)) ow++;
  for (const l of linguisticOccurrences) if (l.hikma_lemma_id && !lSet.has(l.hikma_lemma_id)) ol++;
  for (const r of lemmaTranslations) if (!lSet.has(r.lemma_id)) olt++;
  const lkc = new Map<string, number>(); for (const r of lemmaTranslations) { const k = `${r.lemma_id}|${r.language}|${r.source_id ?? ""}`; lkc.set(k, (lkc.get(k) ?? 0) + 1); }
  const wk = new Map<string, number>(); for (const m of wlm) { const k = `${m.word_id}|${m.lemma_id}`; wk.set(k, (wk.get(k) ?? 0) + 1); }
  let dwc = 0; for (const w of words) { const v = wlmByWord.get(w.id); if (w.lemma_id && v && w.lemma_id !== v.lemma_id) dwc++; }
  const anom = oq + ow + ol + olt + [...wk.values()].filter((v) => v > 1).length + [...lkc.values()].filter((v) => v > 1).length + dwc;
  const cr = (sn: number) => { const f = surahForms.get(sn); return f ? [...f].filter((w) => union.has(w)).length === f.size : null; };

  // Threshold counts (baseline)
  const thresholds = [0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0];
  const thresholdCounts = (simSet: Set<string>) => {
    const out: Record<string, number> = {};
    for (const t of thresholds) {
      let n = 0;
      for (const [sn, f] of surahForms) { if (sn === 1) continue; const c = [...f].filter((w) => simSet.has(w)).length; if (f.size > 0 && c / f.size >= t - 1e-9) n++; }
      out[String(t)] = n;
    }
    return out;
  };

  const report = {
    phase: "88F-U", verdict: anom > 0 ? "PHASE_88F_U_BLOCKED" : "PHASE_88F_U_COMPLETE", read_only: true, database_writes: 0,
    timestamp: new Date().toISOString(), durationSeconds: ROUND((Date.now() - startedAt) / 1000, 2),
    baseline: {
      quran_words: words.length, fr_union_distinct: union.size, fr_occurrences: frOcc,
      fr_percentage: ROUND(union.size / words.length, 4),
      lemma_translations_fr: ltFr.size, word_translations_fr: wtFr.size,
      READY: readyCount, IN_PREPARATION: inPrepCount, REFERENCE: refCount,
      untranslated_safe_lemmas: safeLemmas.length, untranslated_review_lemmas: reviewLemmas.length,
    },
    global_metrics: {
      total_safe_lemmas: safeLemmas.length,
      total_safe_forms_unlockable: safeLemmas.reduce((s, l) => s + l.forms, 0),
      total_safe_occs_unlockable: safeLemmas.reduce((s, l) => s + l.occs, 0),
      avg_forms_per_safe_lemma: safeLemmas.length > 0 ? ROUND(safeLemmas.reduce((s, l) => s + l.forms, 0) / safeLemmas.length, 2) : 0,
    },
    top_20_surahs: top20.map((s, i) => ({ rank: i + 1, ...s })),
    top_100_lemmas: { safe: topSafeLemmas, review: topReviewLemmas },
    long_surah_priority: longSurah,
    local_vs_global_roi: surahLex.map((s) => ({ number: s.number, name: s.name, localRoi: s.localRoi, globalRoi: s.globalRoi, safeLemmaCount: s.safeLemmaCount, globalFormsUnlocked: s.globalFormsUnlocked, globalSurahsAffected: s.globalSurahsAffected, totalActions: s.totalActions })),
    simulations: {
      strategyA_readyFirst_20: { newForms: simA.size - union.size, readyCount: simAReady },
      strategyB_lexicalFirst_top100: { newForms: simBForms, newOccurrences: simBOccurrences, readyCount: simBReady, thresholds: thresholdCounts(simB) },
      baselineThresholds: thresholdCounts(union),
    },
    strategy_comparison: {
      readyFirst: { description: "Résoudre les 20 sourates au plus faible coût READY", newForms: simA.size - union.size, readyAfter: simAReady },
      lexicalFirst: { description: "Traduire les 100 lemmes SAFE les plus propagateurs", newForms: simBForms, newOccurrences: simBOccurrences, readyAfter: simBReady },
      longSurahFirst: { description: "Enrichir d'abord les sourates lexicalement riches (hubs)", candidates: longSurah.slice(0, 5).map((s) => s.number) },
      recommendation: (function () {
        // Hybrid: lexical-first unlocks the most forms globally, but surah completion still needs word_tr.
        // Recommend: continue surah-first on high-propagation surahs, prioritizing those whose SAFE lemmas unlock many global forms.
        const best = top20[0];
        return {
          strategy: "HYBRID — SURAH-FIRST sur sourates à forte propagation lexicale",
          nextSurah: best?.number ?? null,
          nextSurahName: best?.name ?? null,
          safeLemmas: best?.safeLemmaCount ?? 0,
          globalFormsUnlocked: best?.globalFormsUnlocked ?? 0,
          globalOccsUnlocked: best?.globalOccsUnlocked ?? 0,
          globalSurahsAffected: best?.globalSurahsAffected ?? 0,
          reviewWordTr: best?.reviewWordTrCount ?? 0,
          totalActions: best?.totalActions ?? 0,
          note: "Traduire les lemmes SAFE d'une sourate propage immédiatement vers d'autres sourates. Continuer surah-first mais en priorisant les sourates-hubs.",
        };
      })(),
    },
    integrity: {
      orphan_quran: oq, orphan_wlm: ow, orphan_lo: ol, orphan_lt: olt,
      dup_wlm: [...wk.values()].filter((v) => v > 1).length, dup_lt: [...lkc.values()].filter((v) => v > 1).length, dir_wlm_conflict: dwc,
      S98: cr(98), S92: cr(92), S82: cr(82), S85: cr(85), S90: cr(90),
      classifySurahReadiness_unchanged: true, curriculum_unchanged: true,
    },
    invariants: { database_writes: 0, lexical_writes: 0, translation_writes: 0, curriculum_writes: 0, masaq_writes: 0, migrations: 0, seeds: 0 },
    tests: { run: false, note: "vitest · tsc · eslint" },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`Rapport → ${OUTPUT}`);
  console.log(`\n=== PHASE 88F-U TERMINÉ ===`);
  console.log(`FR union: ${union.size} (${ROUND(union.size / words.length * 100, 1)}%) · READY=${readyCount} IN_PREP=${inPrepCount}`);
  console.log(`Lemmes SAFE non traduits: ${safeLemmas.length} (débloquent ${safeLemmas.reduce((s, l) => s + l.forms, 0)} formes, ${safeLemmas.reduce((s, l) => s + l.occs, 0)} occs)`);
  console.log(`Lemmes REVIEW non traduits: ${reviewLemmas.length}`);
  console.log(`TOP 5 (global ROI): ${top20.slice(0, 5).map((s) => `S${s.number}(${s.globalRoi})`).join(" · ")}`);
  console.log(`Strategy B (top100 lemmas): +${simBForms} formes, +${simBOccurrences} occs, READY=${simBReady}`);
  console.log(`Intégrité: anomalies=${anom}`);
  console.log(`=== ${report.verdict} ===`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });