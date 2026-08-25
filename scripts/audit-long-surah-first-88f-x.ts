/**
 * PHASE 88F-X — LONG-SURAH-FIRST GLOBAL ROI AUDIT (POST-S70)
 * STRICT READ-ONLY. ZERO database writes.
 *
 * After S70 resolution (88F-W) confirmed +75 forms/action propagation effect,
 * this audit re-ranks every IN_PREPARATION surah by a LONG-SURAH-FIRST metric
 * that favours lexical richness, global propagation, and surah size over
 * mere proximity to READY.
 *
 * Only paginated Supabase `.select()` reads + local JSON report write.
 * No inserts/updates/upserts/deletes/rpcs.
 *
 * Livrable : reports/phase-88f-x-long-surah-first-roi.json
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const PAGE_SIZE = 1000;
const OUTPUT = "reports/phase-88f-x-long-surah-first-roi.json";
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

  console.log("=== PHASE 88F-X — LONG-SURAH-FIRST ROI AUDIT (READ-ONLY) ===\n");

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

  const wordSurahs = new Map<string, Set<number>>();
  for (const occ of occurrences) { const ayah = ayahById.get(occ.ayah_id); const surah = ayah ? surahById.get(ayah.surah_id) : undefined; if (!surah) continue; let s = wordSurahs.get(occ.word_id); if (!s) { s = new Set(); wordSurahs.set(occ.word_id, s); } s.add(surah.number); }

  const loByWord = new Map<string, LoRow[]>();
  for (const row of linguisticOccurrences) { const occ = occById.get(row.word_occurrence_id); if (occ) { const l = loByWord.get(occ.word_id) ?? []; l.push(row); loByWord.set(occ.word_id, l); } }
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

  // LEMMA EVIDENCE
  const lemmaWords = new Map<string, Set<string>>();
  for (const [wid, lid] of finalLemma) { let s = lemmaWords.get(lid); if (!s) { s = new Set(); lemmaWords.set(lid, s); } s.add(wid); }
  function lemmaEvidence(lid: string) {
    const ws = [...(lemmaWords.get(lid) ?? new Set<string>())];
    let total = 0, exact = 0; let hasSource = false; let forms = 0, occs = 0; const surahSet = new Set<number>();
    for (const wid of ws) {
      forms++; occs += occCountByWord.get(wid) ?? 0;
      for (const sn of wordSurahs.get(wid) ?? []) surahSet.add(sn);
      for (const lo of loByWord.get(wid) ?? []) { total++; if (lo.lemma_mapping_status === "EXACT") exact++; }
      for (const o of occurrences) { if (o.word_id !== wid) continue; if (ayahHasHam.has(o.ayah_id) || ayahHasKaz.has(o.ayah_id)) { hasSource = true; break; } }
    }
    return { forms, occs, surahs: surahSet.size, quality: total > 0 ? ROUND(exact / total, 3) : null, hasSource, safe: total > 0 && exact / total >= 0.8 && hasSource };
  }

  // ─── PER-SURAH LONG-ROI ──────────────────────────────────────────────────
  interface SurahLongRoi {
    number: number; name: string; totalForms: number; totalOccurrences: number;
    distinctLemmas: number; coveragePct: number; missingForms: number; readiness: string;
    safeLemmaCount: number; reviewWordTrCount: number; totalActions: number;
    globalFormsUnlocked: number; globalOccsUnlocked: number; globalSurahsAffected: number;
    formsPerAction: number; occsPerAction: number; globalFormsPerAction: number;
    longSurahRoi: number;
    safeLemmaDetails: Array<{ lemma: string; lemmaId: string; forms: number; occs: number; surahs: number }>;
  }

  const longRoi: SurahLongRoi[] = [];

  for (const [sn, forms] of surahForms) {
    if (sn === 1) continue;
    const cov = [...forms].filter((w) => union.has(w)).length;
    if (cov === forms.size) continue; // already READY

    const missing = [...forms].filter((w) => !union.has(w));

    // Distinct lemmas in this surah (any lemma, translated or not)
    const allSurahLemmas = new Set<string>();
    for (const wid of forms) { const lid = finalLemma.get(wid); if (lid) allSurahLemmas.add(lid); }

    // SAFE untranslated lemmas among missing forms
    const safeLemmaIds = new Set<string>();
    const safeLemmaInfos: Array<{ lemma: string; lemmaId: string; forms: number; occs: number; surahs: number }> = [];
    let wordTrNeeded = 0;
    for (const wid of missing) {
      const lid = finalLemma.get(wid) ?? null;
      if (lid && !ltFr.has(lid)) {
        const ev = lemmaEvidence(lid);
        if (ev.safe && !safeLemmaIds.has(lid)) {
          safeLemmaIds.add(lid);
          const l = lemmaById.get(lid);
          safeLemmaInfos.push({ lemma: l?.arabic ?? "", lemmaId: lid, forms: ev.forms, occs: ev.occs, surahs: ev.surahs });
        }
      } else if (!lid) {
        wordTrNeeded++;
      }
    }
    // Also count forms with lemma but lemma is not SAFE — they need glosses too
    const allUntranslatedLemmaIds = new Set<string>();
    for (const wid of missing) {
      const lid = finalLemma.get(wid) ?? null;
      if (lid && !ltFr.has(lid)) allUntranslatedLemmaIds.add(lid);
    }
    const totalActions = allUntranslatedLemmaIds.size + wordTrNeeded;

    // Global propagation of this surah's SAFE lemmas
    let gForms = 0, gOccs = 0; const gSurahs = new Set<number>();
    for (const si of safeLemmaInfos) {
      gForms += si.forms; gOccs += si.occs;
      for (const ws of [...(lemmaWords.get(si.lemmaId) ?? new Set<string>())]) {
        for (const sn2 of wordSurahs.get(ws) ?? []) if (sn2 !== 1) gSurahs.add(sn2);
      }
    }

    const totalOccurrences = [...forms].reduce((s, w) => s + (occCountByWord.get(w) ?? 0), 0);
    const fpa = totalActions > 0 ? ROUND(missing.length / totalActions, 2) : 0;
    const opa = totalActions > 0 ? ROUND(gOccs / totalActions, 2) : 0;
    const gfpa = totalActions > 0 ? ROUND(gForms / totalActions, 2) : 0;

    // LONG-SURAH-ROI composite score:
    // globalForms * 2 + globalOccs * 0.5 + globalSurahs * 3 + totalForms * 0.5  /  totalActions
    // Heavily weights propagation breadth and forms unlocked, divided by effort.
    const score = totalActions > 0
      ? ROUND((gForms * 2 + gOccs * 0.5 + gSurahs.size * 3 + forms.size * 0.5) / totalActions, 2)
      : 0;

    longRoi.push({
      number: sn, name: surahNameByNumber.get(sn) ?? `Surah ${sn}`,
      totalForms: forms.size, totalOccurrences,
      distinctLemmas: allSurahLemmas.size, coveragePct: ROUND(cov / forms.size, 4),
      missingForms: missing.length,
      readiness: cov === forms.size ? "READY" : "IN_PREPARATION",
      safeLemmaCount: safeLemmaIds.size, reviewWordTrCount: wordTrNeeded,
      totalActions,
      globalFormsUnlocked: gForms, globalOccsUnlocked: gOccs,
      globalSurahsAffected: gSurahs.size,
      formsPerAction: fpa, occsPerAction: opa, globalFormsPerAction: gfpa,
      longSurahRoi: score,
      safeLemmaDetails: safeLemmaInfos.map((si) => ({ lemma: si.lemma, lemmaId: si.lemmaId, forms: si.forms, occs: si.occs, surahs: si.surahs })).sort((a, b) => b.forms - a.forms),
    });
  }

  // Sort by LONG-SURAH-ROI descending
  longRoi.sort((a, b) => b.longSurahRoi - a.longSurahRoi || b.totalForms - a.totalForms);

  // ─── SEPARATE LONG vs SHORT ──────────────────────────────────────────────
  // "Long" = top 40 by totalForms. "Short" = the rest.
  const bySize = [...longRoi].sort((a, b) => b.totalForms - a.totalForms);
  const longThreshold = Math.max(bySize[Math.min(39, bySize.length - 1)]?.totalForms ?? 50, 50);
  const longSurahs = longRoi.filter((s) => s.totalForms >= longThreshold);
  const shortSurahs = longRoi.filter((s) => s.totalForms < longThreshold);

  // ─── TOP 20 LONG ─────────────────────────────────────────────────────────
  const top20Long = longSurahs.slice(0, 20).map((s, i) => ({ rank: i + 1, ...s }));
  // TOP 20 short (info only)
  const top20Short = shortSurahs.slice(0, 20).map((s, i) => ({ rank: i + 1, ...s }));
  const altS = longSurahs.slice(1, 6);

  // ─── TOP 30 LEMMAS (global, from long surahs) ────────────────────────────
  const allSafeLemmaIds = new Map<string, string>();
  for (const s of longSurahs) {
    for (const si of s.safeLemmaDetails) {
      allSafeLemmaIds.set(si.lemmaId, si.lemma);
    }
  }
  const topLemmas = [...allSafeLemmaIds.entries()]
    .map(([lid, arabic]) => {
      const ev = lemmaEvidence(lid);
      return { lemma: arabic, lemmaId: lid, forms: ev.forms, occs: ev.occs, surahs: ev.surahs, quality: ev.quality };
    })
    .sort((a, b) => b.forms - a.forms || b.occs - a.occs || b.surahs - a.surahs)
    .slice(0, 30);

  // ─── SCENARIOS ───────────────────────────────────────────────────────────
  const bestLong = longSurahs[0];
  const bestLongLemmaIds = bestLong ? new Set(bestLong.safeLemmaDetails.map((l) => l.lemmaId)) : new Set<string>();
  const simLongSet = new Set(union);
  if (bestLong) {
    for (const [wid, lid] of finalLemma) if (bestLongLemmaIds.has(lid)) simLongSet.add(wid);
    // Also cover all its word_tr forms
    const f = surahForms.get(bestLong.number) ?? new Set<string>();
    for (const wid of f) if (!union.has(wid)) simLongSet.add(wid);
  }

  // Top 30 lemmas globally
  const top30LemmaIds = new Set(topLemmas.map((l) => l.lemmaId));
  const simLex = new Set(union);
  for (const [wid, lid] of finalLemma) if (top30LemmaIds.has(lid)) simLex.add(wid);

  const countSurahs = (s: Set<string>) => { let n = 0; for (const [sn, f] of surahForms) { if (sn === 1) continue; if ([...f].filter((w) => s.has(w)).length === f.size) n++; } return n; };
  const thrCount = (s: Set<string>) => {
    const t = [0.8, 0.9, 0.95, 1.0]; const o: Record<string, number> = {};
    for (const tt of t) { let n = 0; for (const [sn, f] of surahForms) { if (sn === 1) continue; const c = [...f].filter((w) => s.has(w)).length; if (f.size > 0 && c / f.size >= tt - 1e-9) n++; } o[String(tt)] = n; }
    return o;
  };

  // ─── INTEGRITY ───────────────────────────────────────────────────────────
  const lSet = new Set(lemmas.map((l) => l.id));
  let oq = 0, ow = 0, ol = 0, olt = 0;
  for (const w of words) if (w.lemma_id && !lSet.has(w.lemma_id)) oq++;
  for (const m of wlm) if (!lSet.has(m.lemma_id)) ow++;
  for (const l of linguisticOccurrences) if (l.hikma_lemma_id && !lSet.has(l.hikma_lemma_id)) ol++;
  for (const r of lemmaTranslations) if (!lSet.has(r.lemma_id)) olt++;
  let dwc = 0; for (const w of words) { const v = wlmByWord.get(w.id); if (w.lemma_id && v && w.lemma_id !== v.lemma_id) dwc++; }
  const anom = oq + ow + ol + olt + dwc;
  const cr = (sn: number) => { const f = surahForms.get(sn); return f ? [...f].filter((w) => union.has(w)).length === f.size : null; };

  const report = {
    phase: "88F-X", verdict: anom > 0 ? "PHASE_88F_X_BLOCKED" : "PHASE_88F_X_COMPLETE",
    read_only: true, database_writes: 0,
    timestamp: new Date().toISOString(), durationSeconds: ROUND((Date.now() - startedAt) / 1000, 2),
    baseline: {
      quran_words: words.length, fr_union: union.size, fr_occurrences: frOcc,
      fr_percentage: ROUND(union.size / words.length, 4),
      lemma_tr_fr: ltFr.size, word_tr_fr: wtFr.size,
      READY: readyCount, IN_PREPARATION: inPrepCount, REFERENCE: refCount,
      total_untranslated_safe_lemmas: longRoi.reduce((s, r) => s + r.safeLemmaCount, 0),
    },
    longSurahThreshold: longThreshold,
    top20_long: top20Long.map((s) => ({
      rank: s.rank, number: s.number, name: s.name,
      totalForms: s.totalForms, totalOccurrences: s.totalOccurrences,
      distinctLemmas: s.distinctLemmas, coveragePct: s.coveragePct,
      missingForms: s.missingForms,
      safeLemmas: s.safeLemmaCount, reviewWordTr: s.reviewWordTrCount,
      totalActions: s.totalActions,
      globalForms: s.globalFormsUnlocked, globalOccs: s.globalOccsUnlocked,
      surahsAffected: s.globalSurahsAffected,
      formsPerAction: s.formsPerAction, globalFormsPerAction: s.globalFormsPerAction,
      longSurahRoi: s.longSurahRoi,
      topLemmas: s.safeLemmaDetails.slice(0, 5).map((l) => ({ lemma: l.lemma, globalForms: l.forms, globalOccs: l.occs, surahs: l.surahs })),
    })),
    top20_short_info: top20Short.map((s) => ({
      rank: s.rank, number: s.number, name: s.name,
      totalForms: s.totalForms, coveragePct: s.coveragePct,
      missingForms: s.missingForms, safeLemmas: s.safeLemmaCount,
      totalActions: s.totalActions,
      globalForms: s.globalFormsUnlocked, longSurahRoi: s.longSurahRoi,
    })),
    top30Lemmas: topLemmas.map((l) => ({
      lemma: l.lemma, lemmaId: l.lemmaId,
      forms: l.forms, occs: l.occs, surahs: l.surahs, quality: l.quality,
    })),
    scenarios: {
      A_LONG_SURAH_FIRST: {
        description: `Traiter la meilleure longue sourate: S${bestLong?.number} ${bestLong?.name}`,
        surah: bestLong?.number,
        safeLemmas: bestLong?.safeLemmaCount ?? 0,
        wordTranslations: bestLong?.reviewWordTrCount ?? 0,
        totalActions: bestLong?.totalActions ?? 0,
        globalForms: bestLong?.globalFormsUnlocked ?? 0,
        globalOccs: bestLong?.globalOccsUnlocked ?? 0,
        surahsAffected: bestLong?.globalSurahsAffected ?? 0,
        newFrForms: simLongSet.size - union.size,
        newReady: countSurahs(simLongSet),
        thresholdsAfter: thrCount(simLongSet),
      },
      B_LEXICAL_FIRST_TOP30: {
        description: "Traduire les 30 lemmes SAFE à plus forte propagation (toutes sourates confondues)",
        newFrForms: simLex.size - union.size,
        newReady: countSurahs(simLex),
        thresholdsAfter: thrCount(simLex),
      },
      C_HYBRID: {
        description: `LONG-SURAH-FIRST sur S${bestLong?.number} — résout une sourate READY tout en propageant ses lemmes globalement`,
        newFrForms: simLongSet.size - union.size,
        newReady: countSurahs(simLongSet),
        thresholdsAfter: thrCount(simLongSet),
      },
      thresholdsBaseline: thrCount(union),
    },
    recommendation: (() => {
      const bl = bestLong;
      return {
        nextLongSurah: bl?.number ?? null,
        name: bl?.name ?? null,
        totalForms: bl?.totalForms ?? 0,
        totalOccurrences: bl?.totalOccurrences ?? 0,
        coveragePct: bl?.coveragePct ?? 0,
        missingForms: bl?.missingForms ?? 0,
        safeLemmas: bl?.safeLemmaCount ?? 0,
        wordTranslations: bl?.reviewWordTrCount ?? 0,
        totalActions: bl?.totalActions ?? 0,
        globalFormsUnlocked: bl?.globalFormsUnlocked ?? 0,
        globalOccsUnlocked: bl?.globalOccsUnlocked ?? 0,
        globalSurahsAffected: bl?.globalSurahsAffected ?? 0,
        longSurahRoi: bl?.longSurahRoi ?? 0,
        rationale: "Sourate longue, riche lexicalement, SAFE lemmas à forte propagation, bon ratio global_forms/action.",
        alternatives: altS.map((a) => ({
          number: a.number, name: a.name, totalForms: a.totalForms,
          safeLemmas: a.safeLemmaCount, globalForms: a.globalFormsUnlocked,
          totalActions: a.totalActions, longSurahRoi: a.longSurahRoi,
        })),
      };
    })(),
    integrity: {
      orphan_quran: oq, orphan_wlm: ow, orphan_lo: ol, orphan_lt: olt, dir_wlm_conflict: dwc,
      S98: cr(98), S92: cr(92), S82: cr(82), S85: cr(85), S90: cr(90), S70: cr(70),
      classifySurahReadiness_unchanged: true,
    },
    invariants: { database_writes: 0, lexical_writes: 0, translation_writes: 0, curriculum_writes: 0, masaq_writes: 0, migrations: 0, seeds: 0 },
    tests: { run: false, note: "vitest · tsc · eslint" },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");

  console.log(`Rapport → ${OUTPUT}`);
  console.log(`\nFR union: ${union.size} (${ROUND(union.size/words.length*100,1)}%) · READY=${readyCount} IN_PREP=${inPrepCount}`);
  console.log(`Long surahs (>${longThreshold} forms): ${longSurahs.length} · Short: ${shortSurahs.length}`);
  console.log(`Best long surah: S${bestLong?.number} ${bestLong?.name} (${bestLong?.totalForms} forms, ROI=${bestLong?.longSurahRoi}, ${bestLong?.globalFormsUnlocked} global forms, ${bestLong?.globalSurahsAffected} surahs)`);
  console.log(`Top 3 alternatives: ${altS.map((a) => `S${a.number}(${a.longSurahRoi})`).join(" · ")}`);
  console.log(`Scenario C (hybrid): +${simLongSet.size - union.size} FR forms, new READY=${countSurahs(simLongSet)}`);
  console.log(`Top 5 lemmas: ${topLemmas.slice(0, 5).map((l) => `${l.lemma}(${l.forms}f/${l.surahs}s)`).join(" · ")}`);
  console.log(`Integrity: anomalies=${anom}`);
  console.log(`=== ${report.verdict} ===`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });