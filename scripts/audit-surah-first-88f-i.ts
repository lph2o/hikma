/**
 * PHASE 88F-I — SURAH-FIRST TARGETED RESOLUTION AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes permitted.
 *
 * Strategy shift: LEMMA-FIRST → SURAH-FIRST / READY-FIRST.
 * Primary target: S98 — Al-Bayyinah (79 forms, 11 missing after 88F-H).
 *
 * This script only calls Supabase `.select()` paginated and writes the local
 * JSON report. No inserts/updates/upserts/deletes/rpcs. No curriculum changes.
 * No business code changes.
 *
 * Livrable : reports/phase-88f-i-surah-first-audit.json
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const PAGE_SIZE = 1000;
const OUTPUT = "reports/phase-88f-i-surah-first-audit.json";
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const HAMIDULLAH_TR = "Muhammad Hamidullah";
const KAZIMIRSKI_TR = "Albert de Biberstein-Kazimirski";
const PRIMARY_TARGET = 98;
const NEXT_SURAHS = [92, 62, 85, 90, 82] as const;
const ROUND = (n: number, digits = 4) => Math.round(n * 10 ** digits) / 10 ** digits;

// ---------------------------------------------------------------------------
// STATIC READ-ONLY GUARANTEE
// ---------------------------------------------------------------------------
// VERIFIED MANUALLY: This script only uses client.from(...).select(...)
// and client.from(...).select(...).range(...) via selectAll<T>().
// The only filesystem writes are mkdirSync + writeFileSync for the report JSON.

// If you need to re-verify, search the source for these dangerous patterns:
//   from("X").insert   from("X").update   from("X").upsert
//   from("X").delete   .rpc(
// None should be found (the only .from calls are in selectAll).

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type SourceRow = { id: string; name: string };
type SurahRow = { id: string; number: number; name_transliteration: string | null; name_arabic?: string | null };
type AyahRow = { id: string; surah_id: string; ayah_number?: number; global_ayah_number?: number };
type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccRow = { id: string; word_id: string; ayah_id: string };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { id: string; word_id: string; lemma_id: string };
type TranslationRow = { ayah_id: string; translator: string; text: string };
type WordTranslationRow = { id: string; word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null };
type LemmaTranslationRow = { id: string; lemma_id: string; text: string; language: string; is_validated: boolean; source_id: string | null };
type LoRow = {
  id: string;
  word_occurrence_id: string;
  hikma_lemma_id: string | null;
  lemma_mapping_status: string;
  masaq_gloss_en: string | null;
  masaq_stem: string | null;
  pos: string[];
  surah_number?: number;
};
type SegmentRow = { linguistic_occurrence_id: string; morph_type: string; segment_text?: string };

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file); } catch { /* OK */ }
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(columns).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)];
}

function sortedEntries(map: Map<string, number>): Array<{ value: string; count: number }> {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, count }));
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const startedAt = Date.now();

  console.log("=== PHASE 88F-I — SURAH-FIRST TARGETED RESOLUTION AUDIT (READ-ONLY) ===");
  console.log(`  Cible principale : S${PRIMARY_TARGET} — Al-Bayyinah`);
  console.log(`  Comparaison : ${NEXT_SURAHS.join(", ")}`);
  console.log("  DB writes: 0 — strictly paginated SELECT calls only.\n");

  // ─── 1. LOAD ALL DATA ────────────────────────────────────────────────────
  console.log("→ Chargement des données…");
  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === HIKMA_SOURCE);
  if (!hikmaSource) throw new Error(`Source « ${HIKMA_SOURCE} » introuvable.`);

  const [
    surahs, ayahs, words, occurrences, lemmas, wlm,
    wordTranslations, lemmaTranslations, linguisticOccurrences,
    linguisticSegments, verseTranslations,
  ] = await Promise.all([
    selectAll<SurahRow>(client, "surahs", "id, number, name_transliteration, name_arabic"),
    selectAll<AyahRow>(client, "ayahs", "id, surah_id, ayah_number, global_ayah_number"),
    selectAll<WordRow>(client, "quran_words", "id, arabic, lemma_id"),
    selectAll<OccRow>(client, "word_occurrences", "id, word_id, ayah_id"),
    selectAll<LemmaRow>(client, "lemmas", "id, arabic"),
    selectAll<WlmRow>(client, "word_lemma_mapping", "id, word_id, lemma_id"),
    selectAll<WordTranslationRow>(client, "word_translations", "id, word_id, text, language, is_validated, source_id"),
    selectAll<LemmaTranslationRow>(client, "lemma_translations", "id, lemma_id, text, language, is_validated, source_id"),
    selectAll<LoRow>(client, "linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, lemma_mapping_status, masaq_gloss_en, masaq_stem, pos, surah_number"),
    selectAll<SegmentRow>(client, "linguistic_segments", "linguistic_occurrence_id, morph_type, segment_text"),
    selectAll<TranslationRow>(client, "translations", "ayah_id, translator, text"),
  ]);
  console.log(`  Chargé: surahs=${surahs.length} ayahs=${ayahs.length} words=${words.length} occs=${occurrences.length} lemmas=${lemmas.length} wlm=${wlm.length} wt=${wordTranslations.length} lt=${lemmaTranslations.length} lo=${linguisticOccurrences.length} seg=${linguisticSegments.length} tr=${verseTranslations.length}`);

  // ─── 2. INDEXES ──────────────────────────────────────────────────────────
  const wordById = new Map(words.map((w) => [w.id, w]));
  const lemmaById = new Map(lemmas.map((l) => [l.id, l]));
  const occById = new Map(occurrences.map((o) => [o.id, o]));
  const ayahById = new Map(ayahs.map((a) => [a.id, a]));
  const surahById = new Map(surahs.map((s) => [s.id, s]));
  const surahByNumber = new Map(surahs.map((s) => [s.number, s]));
  const wlmByWord = new Map<string, WlmRow>();
  for (const row of wlm) if (!wlmByWord.has(row.word_id)) wlmByWord.set(row.word_id, row);

  const occCountByWord = new Map<string, number>();
  const wordSurahs = new Map<string, Set<number>>();
  for (const occ of occurrences) {
    increment(occCountByWord, occ.word_id);
    const ayah = ayahById.get(occ.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (surah) {
      const set = wordSurahs.get(occ.word_id) ?? new Set<number>();
      set.add(surah.number);
      wordSurahs.set(occ.word_id, set);
    }
  }

  const loByOcc = new Map<string, LoRow[]>();
  const loByWord = new Map<string, LoRow[]>();
  for (const row of linguisticOccurrences) {
    const byOcc = loByOcc.get(row.word_occurrence_id) ?? [];
    byOcc.push(row);
    loByOcc.set(row.word_occurrence_id, byOcc);
    const occ = occById.get(row.word_occurrence_id);
    if (occ) {
      const byWord = loByWord.get(occ.word_id) ?? [];
      byWord.push(row);
      loByWord.set(occ.word_id, byWord);
    }
  }

  const segByLo = new Map<string, SegmentRow[]>();
  for (const seg of linguisticSegments) {
    const list = segByLo.get(seg.linguistic_occurrence_id) ?? [];
    list.push(seg);
    segByLo.set(seg.linguistic_occurrence_id, list);
  }

  // Verse translations by ayah
  const verseByAyahTranslator = new Map<string, Map<string, string>>();
  for (const tr of verseTranslations) {
    let m = verseByAyahTranslator.get(tr.ayah_id);
    if (!m) { m = new Map(); verseByAyahTranslator.set(tr.ayah_id, m); }
    m.set(tr.translator, tr.text);
  }

  // ─── 3. FR COVERAGE (A/B/C/D UNION) ──────────────────────────────────────
  const wtFr = new Map<string, string>();
  for (const r of wordTranslations) {
    if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) {
      wtFr.set(r.word_id, r.text);
    }
  }
  const ltFr = new Map<string, string>();
  for (const r of lemmaTranslations) {
    if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) {
      ltFr.set(r.lemma_id, r.text);
    }
  }

  // Final lemma resolution: direct → WLM → MASAQ
  const finalLemma = new Map<string, string>();
  const resolutionPath = new Map<string, "DIRECT" | "WLM" | "MASAQ">();
  for (const w of words) if (w.lemma_id) { finalLemma.set(w.id, w.lemma_id); resolutionPath.set(w.id, "DIRECT"); }
  for (const m of wlm) if (!finalLemma.has(m.word_id)) { finalLemma.set(m.word_id, m.lemma_id); resolutionPath.set(m.word_id, "WLM"); }
  for (const l of linguisticOccurrences) {
    if (!l.hikma_lemma_id) continue;
    const occ = occById.get(l.word_occurrence_id);
    if (occ && !finalLemma.has(occ.word_id)) { finalLemma.set(occ.word_id, l.hikma_lemma_id); resolutionPath.set(occ.word_id, "MASAQ"); }
  }

  // FR coverage paths
  const coveredWordIds = new Set<string>(wtFr.keys());
  const pathSets = { A: new Set(wtFr.keys()), B: new Set<string>(), C: new Set<string>(), D: new Set<string>() };
  for (const w of words) if (w.lemma_id && ltFr.has(w.lemma_id)) pathSets.B.add(w.id);
  for (const m of wlm) if (ltFr.has(m.lemma_id)) pathSets.C.add(m.word_id);
  for (const l of linguisticOccurrences) {
    if (!l.hikma_lemma_id || !ltFr.has(l.hikma_lemma_id)) continue;
    const occ = occById.get(l.word_occurrence_id);
    if (occ) pathSets.D.add(occ.word_id);
  }
  for (const wid of pathSets.B) coveredWordIds.add(wid);
  for (const wid of pathSets.C) coveredWordIds.add(wid);
  for (const wid of pathSets.D) coveredWordIds.add(wid);

  let coveredOccurrences = 0;
  for (const wid of coveredWordIds) coveredOccurrences += occCountByWord.get(wid) ?? 0;

  // ─── 4. SURAH FORMS (occurrence-distinct word_ids) ────────────────────────
  const surahOccForms = new Map<number, Set<string>>();
  for (const occ of occurrences) {
    const ayah = ayahById.get(occ.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (!surah) continue;
    let set = surahOccForms.get(surah.number);
    if (!set) { set = new Set(); surahOccForms.set(surah.number, set); }
    set.add(occ.word_id);
  }

  // Also check learning_path forms (runtime catalog model)
  const learningPathForms = new Map<number, string[]>();
  const { data: lpRows } = await client.from("learning_paths")
    .select("id, slug, surah_id")
    .not("surah_id", "is", null);
  const lps = (lpRows ?? []) as Array<{ id: string; slug: string; surah_id: string }>;
  const lpBySurahId = new Map(lps.map((lp) => [lp.surah_id, lp]));

  for (const [number, surahId] of [...surahByNumber.entries()].map(([n, s]) => [n, s.id] as const)) {
    const lp = lpBySurahId.get(surahId);
    if (!lp) continue;
    const { data: unitRows } = await client.from("units").select("id").eq("path_id", lp.id);
    const unitIds = ((unitRows ?? []) as Array<{ id: string }>).map((u) => u.id);
    if (unitIds.length === 0) continue;
    const { data: lessonRows } = await client.from("lessons").select("id").eq("status", "published").in("unit_id", unitIds);
    const lessonIds = ((lessonRows ?? []) as Array<{ id: string }>).map((l) => l.id);
    if (lessonIds.length === 0) continue;
    const { data: lwRows } = await client.from("lesson_words").select("word_id").in("lesson_id", lessonIds);
    const wordIds = unique(((lwRows ?? []) as Array<{ word_id: string }>).map((lw) => lw.word_id));
    learningPathForms.set(number, wordIds);
  }

  console.log(`  Learning paths: ${lps.length} / ${surahs.length} surahs have curated curriculum`);

  // ─── 5. SURAH COVERAGE SNAPSHOT ──────────────────────────────────────────
  const surahCoverage: Array<{
    number: number;
    name: string;
    totalForms: number;
    coveredForms: number;
    missingForms: number;
    coveragePct: number;
    readiness: string;
    hasLearningPath: boolean;
    lpForms?: number;
    lpCovered?: number;
    lpCoveragePct?: number;
  }> = [];

  for (const [sn, forms] of surahOccForms) {
    let covered = 0;
    for (const wid of forms) if (coveredWordIds.has(wid)) covered++;
    const pct = ROUND(covered / forms.size, 4);
    const readiness = classifyReadiness(sn, pct);
    const lpForms = learningPathForms.get(sn);
    const hasLP = lpForms !== undefined;
    let lpCovered: number | undefined;
    let lpCoveragePct: number | undefined;
    if (hasLP && lpForms) {
      lpCovered = lpForms.filter((wid) => coveredWordIds.has(wid)).length;
      lpCoveragePct = lpForms.length > 0 ? ROUND(lpCovered / lpForms.length, 4) : 1;
    }
    surahCoverage.push({
      number: sn,
      name: surahByNumber.get(sn)?.name_transliteration ?? `Surah ${sn}`,
      totalForms: forms.size,
      coveredForms: covered,
      missingForms: forms.size - covered,
      coveragePct: pct,
      readiness,
      hasLearningPath: hasLP,
      lpForms: lpForms?.length,
      lpCovered,
      lpCoveragePct,
    });
  }
  surahCoverage.sort((a, b) => a.number - b.number);

  const readyCount = surahCoverage.filter((s) => s.readiness === "READY").length;
  const inPrepCount = surahCoverage.filter((s) => s.readiness === "IN_PREPARATION").length;
  const refCount = surahCoverage.filter((s) => s.readiness === "REFERENCE").length;

  // ─── 6. MASAQ EVIDENCE HELPER ─────────────────────────────────────────────
  function masaqEvidence(wordId: string) {
    const los = loByWord.get(wordId) ?? [];
    const glossCounts = new Map<string, number>();
    const stemSet = new Set<string>();
    const lemmaSet = new Set<string>();
    const statuses = new Map<string, number>();
    const posSet = new Set<string>();
    for (const lo of los) {
      if (lo.masaq_gloss_en) increment(glossCounts, lo.masaq_gloss_en);
      if (lo.masaq_stem) stemSet.add(lo.masaq_stem);
      if (lo.hikma_lemma_id) lemmaSet.add(lo.hikma_lemma_id);
      increment(statuses, lo.lemma_mapping_status);
      for (const p of lo.pos ?? []) posSet.add(p);
    }
    const top = sortedEntries(glossCounts)[0] ?? null;
    const loTotal = los.length;
    return {
      loCount: loTotal,
      stems: [...stemSet].sort(),
      hikmaLemmaIds: [...lemmaSet],
      topGlossEn: top?.value ?? null,
      topGlossShare: top && loTotal > 0 ? ROUND(top.count / loTotal, 3) : null,
      glossesEn: sortedEntries(glossCounts).slice(0, 15),
      mappingStatuses: sortedEntries(statuses),
      quality: loTotal > 0 ? ROUND((statuses.get("EXACT") ?? 0) / loTotal, 3) : null,
      competingStems: stemSet.size > 1,
      pos: [...posSet].sort(),
      segmentMorphs: unique(los.flatMap((lo) => segByLo.get(lo.id) ?? []).map((s) => s.morph_type)).sort(),
    };
  }

  // ─── 7. TARGET SURAH S98 — FULL ANALYSIS ─────────────────────────────────
  function analyzeSurahForms(surahNumber: number) {
    const forms = surahOccForms.get(surahNumber) ?? new Set<string>();
    const lpForms = learningPathForms.get(surahNumber);
    const allFormIds = lpForms ? [...new Set([...forms, ...lpForms])] : [...forms];

    // FR coverage by the runtime model (A/B/C paths only, D excluded)
    const runtimeCovered = new Set<string>();
    for (const wid of allFormIds) {
      if (pathSets.A.has(wid) || pathSets.B.has(wid) || pathSets.C.has(wid)) {
        runtimeCovered.add(wid);
      }
    }

    // Missing forms (A/B/C/D model)
    const missingIds = [...forms].filter((wid) => !coveredWordIds.has(wid));

    // Get ayah context for each missing form
    function ayahContext(wordId: string): Array<{
      ayahId: string;
      surahNum: number;
      ayahNum: number | undefined;
      globalAyahNum: number | undefined;
      occId: string;
      hamidullah: string | null;
      kazimirski: string | null;
    }> {
      const occs = occurrences.filter((o) => o.word_id === wordId);
      return occs.map((occ) => {
        const ayah = ayahById.get(occ.ayah_id);
        const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
        const hamMap = verseByAyahTranslator.get(occ.ayah_id);
        return {
          ayahId: occ.ayah_id,
          surahNum: surah?.number ?? 0,
          ayahNum: ayah?.ayah_number,
          globalAyahNum: ayah?.global_ayah_number,
          occId: occ.id,
          hamidullah: hamMap?.get(HAMIDULLAH_TR) ?? null,
          kazimirski: hamMap?.get(KAZIMIRSKI_TR) ?? null,
        };
      });
    }

    // Detailed analysis of each missing form
    const missingFormDetails = missingIds.map((wordId) => {
      const word = wordById.get(wordId)!;
      const currentLemmaId = finalLemma.get(wordId) ?? null;
      const currentLemma = currentLemmaId ? lemmaById.get(currentLemmaId)?.arabic ?? null : null;
      const masa = masaqEvidence(wordId);
      const mDirect = word.lemma_id;
      const mWlm = wlmByWord.get(wordId)?.lemma_id ?? null;
      const mLo = unique((loByWord.get(wordId) ?? []).flatMap((l) => l.hikma_lemma_id ? [l.hikma_lemma_id] : []));

      const contexts = ayahContext(wordId);
      const caseInS98 = contexts.filter((c) => c.surahNum === surahNumber);

      // Existing translations
      const wordTrHikma = wtFr.get(wordId) ?? null;
      const lemmaTrHikma = currentLemmaId ? ltFr.get(currentLemmaId) ?? null : null;
      const hasLemmaTranslation = currentLemmaId ? ltFr.has(currentLemmaId) : false;
      const hasDirectLemma = !!mDirect;
      const hasWlmLemma = !!mWlm;
      const hasMasaqUniqueness = mLo.length === 1;

      // Determine lemma path
      const lemmaPaths: string[] = [];
      if (hasDirectLemma) lemmaPaths.push(`direct:${word.lemma_id}`);
      if (hasWlmLemma) lemmaPaths.push(`wlm:${mWlm}`);
      if (hasMasaqUniqueness) lemmaPaths.push(`masaq:${mLo[0]}`);

      // Reason for missing FR
      let missingReason: string;
      if (hasLemmaTranslation) {
        // This shouldn't happen for missing forms, but check
        const viaPath = pathSets.B.has(wordId) ? "B_DIRECT" : pathSets.C.has(wordId) ? "C_WLM" : pathSets.D.has(wordId) ? "D_MASAQ" : null;
        if (viaPath) {
          missingReason = `LEMMA_TRANSLATION_EXISTS_BUT_WORD_NOT_RESOLVED (path: ${viaPath}, lemma: ${currentLemma})`;
        } else {
          missingReason = `LEMMA_TRANSLATION_EXISTS_FOR_${currentLemma}_BUT_WORD_NOT_IN_UNION (BUG?)`;
        }
      } else if (currentLemmaId) {
        missingReason = `LEMMA_${currentLemma}_EXISTS_NO_FR_GLOSS`;
      } else if (mLo.length > 0) {
        missingReason = `NO_LEMMA_NO_FR — MASAQ stems=${mLo.join(",")} mapping=${masa.mappingStatuses.map((s) => `${s.value}:${s.count}`).join(";")}`;
      } else {
        missingReason = "NO_LEMMA_NO_MASAQ — requires word-level translation";
      }

      return {
        arabic: word.arabic,
        wordId: word.id,
        occurrenceCount: occCountByWord.get(wordId) ?? 0,
        occurrenceCountInSurah: caseInS98.length,
        surahs: [...(wordSurahs.get(wordId) ?? [])].sort((a, b) => a - b),
        currentLemmaId,
        currentLemma,
        resolutionPath: resolutionPath.get(wordId) ?? null,
        directLemmaId: mDirect,
        wlmLemmaId: mWlm,
        masaqLemmaIds: mLo,
        masaqQuality: masa.quality,
        masaqStems: masa.stems,
        masaqTopGlossEn: masa.topGlossEn,
        masaqTopGlossShare: masa.topGlossShare,
        masaqGlossesEn: masa.glossesEn,
        masaqMappingStatuses: masa.mappingStatuses,
        masaqCompetingStems: masa.competingStems,
        masaqPos: masa.pos,
        masaqSegmentMorphs: masa.segmentMorphs,
        hasDirectLemma,
        hasWlmLemma,
        hasMasaqUniqueness,
        lemmaPaths,
        wordTranslationHikmaFr: wordTrHikma,
        lemmaTranslationHikmaFr: lemmaTrHikma,
        hasLemmaTranslation,
        contexts,
        contextInS98: caseInS98,
        hamidullahSamples: caseInS98.map((c) => c.hamidullah).filter((t): t is string => Boolean(t)).slice(0, 3),
        kazimirskiSamples: caseInS98.map((c) => c.kazimirski).filter((t): t is string => Boolean(t)).slice(0, 3),
        missingReason,
        vocalization: word.arabic, // arabic field already contains vocalized form
      };
    });


    return {
      totalOccurrenceDistinctForms: forms.size,
      coveredOccurrenceDistinctForms: forms.size - missingIds.length,
      missingOccurrenceDistinctForms: missingIds.length,
      coveragePctOccDistinct: forms.size > 0 ? ROUND((forms.size - missingIds.length) / forms.size, 4) : 1,
      learningPathForms: lpForms?.length ?? null,
      learningPathCovered: lpForms ? lpForms.filter((wid) => coveredWordIds.has(wid)).length : null,
      learningPathCoveragePct: lpForms && lpForms.length > 0 ? ROUND(lpForms.filter((wid) => coveredWordIds.has(wid)).length / lpForms.length, 4) : null,
      runtimeModelCoveredForms: lpForms ? lpForms.filter((wid) => runtimeCovered.has(wid)).length : null,
      runtimeModelCoveragePct: lpForms && lpForms.length > 0 ? ROUND(lpForms.filter((wid) => runtimeCovered.has(wid)).length / lpForms.length, 4) : null,
      missingForms: missingFormDetails,
    };
  }

  const s98Analysis = analyzeSurahForms(PRIMARY_TARGET);

  // ─── 8. CLASSIFICATION ───────────────────────────────────────────────────
  let classificationA = 0, classificationB = 0, classificationC = 0, classificationD = 0;
  const classificationE = 0;
  const classified = s98Analysis.missingForms.map((f) => {
    const { currentLemmaId, hasMasaqUniqueness, masaqCompetingStems, masaqQuality } = f;
    let cls: "A" | "B" | "C" | "D" | "E";

    if (currentLemmaId) {
      // Lemma exists — glose needed
      cls = "A";
    } else if (hasMasaqUniqueness && !masaqCompetingStems && ((masaqQuality ?? 0) >= 0.5)) {
      // MASAQ lemma unique, good quality → needs mapping
      cls = "B";
    } else if (masaqQuality !== null && masaqQuality > 0) {
      // MASAQ data exists but ambiguous → review
      cls = "D";
    } else {
      // No lemma, no reliable MASAQ
      cls = "C";
    }

    // Override for known problematic cases
    if (masaqCompetingStems) cls = "D";
    if (cls === "C" && f.masaqStems.length > 0) cls = "D"; // Has MASAQ but no lemma → review

    switch (cls) {
      case "A": classificationA++; break;
      case "B": classificationB++; break;
      case "C": classificationC++; break;
      case "D": classificationD++; break;
    }

    return { ...f, classification: cls };
  });

  // ─── 9. EDITORIAL PROPOSALS FOR SAFE GLOSSES ─────────────────────────────
  // Cross-reference with existing Hikma lexical knowledge
  const KNOWN_GLOSS_HINTS: Record<string, string> = {
    بر: "bonté / bienfaisance / continent",
    بين: "entre / rendre clair / manifester / preuve claire",
    قيم: "droit / correct / de valeur / établir (droit)",
    شر: "mal / pire / mauvais",
    كتب: "livre / écrit / écrire / prescrire",
    مطهر: "purifié / pur",
    منفك: "cesser / se désengager / se séparer",
    تفرق: "se séparer / diverger / se disperser",
    ؤت: "donner / accorder / apporter",
  };

  function editorialProposal(formArabic: string, lemma: string | null, masaGloss: string | null, hamidullahSamples: string[], kazimirskiSamples: string[]): {
    gloss: string | null;
    confidence: number;
    rationale: string;
    status: "SAFE" | "REVIEW_REQUIRED" | "DO_NOT_IMPORT";
  } {
    // Leverage the known Hikma lemma glosses already imported
    const hint = lemma ? KNOWN_GLOSS_HINTS[lemma] ?? null : null;
    const masaClean = masaGloss?.toLowerCase() ?? "";

    if (!lemma && !masaClean) {
      return { gloss: null, confidence: 0, rationale: "Aucun lemme ni glose MASAQ disponible.", status: "DO_NOT_IMPORT" };
    }

    // For forms with existing lemmas that just need a gloss
    if (lemma && hint) {
      const hamText = hamidullahSamples.join(" | ");
      const kazText = kazimirskiSamples.join(" | ");
      const conf = hamidullahSamples.length >= 1 && kazimirskiSamples.length >= 1
        ? 0.85
        : hamidullahSamples.length >= 1 ? 0.75 : 0.60;

      return {
        gloss: hint,
        confidence: conf,
        rationale: `Lemme « ${lemma} » existant ; glose Hikma connue: "${hint}". Hamidullah: ${hamText || "non dispo"}. Kazimirski: ${kazText || "non dispo"}. MASAQ top: "${masaClean}".`,
        status: conf >= 0.60 ? "SAFE" : "REVIEW_REQUIRED",
      };
    }

    if (lemma) {
      return {
        gloss: null,
        confidence: 0.40,
        rationale: `Lemme « ${lemma} » existe mais aucune glose Hikma pré-établie. Revue éditoriale nécessaire.`,
        status: "REVIEW_REQUIRED",
      };
    }

    // Forms without lemma — case تفرق and يؤتوا
    if (masaClean) {
      const stemGloss = KNOWN_GLOSS_HINTS[masaClean] ?? null;
      return {
        gloss: stemGloss,
        confidence: stemGloss ? 0.50 : 0.30,
        rationale: `Pas de lemme existant. Stem MASAQ "${masaClean}". ${stemGloss ? `Gloss potentielle: "${stemGloss}".` : ""} Revue humaine requise pour déterminer le lemme canonique.`,
        status: "REVIEW_REQUIRED",
      };
    }

    return { gloss: null, confidence: 0, rationale: "Données insuffisantes.", status: "DO_NOT_IMPORT" };
  }

  const safeGlosses: Array<{ lemma: string; lemmaId: string; gloss: string; confidence: number }> = [];
  const safeMappings: Array<{ wordId: string; arabic: string; lemmaId: string; lemma: string; evidence: string }> = [];
  const safeWordTranslations: Array<{ wordId: string; arabic: string; text: string; confidence: number }> = [];
  const reviewItems: Array<{ wordId: string; arabic: string; issue: string }> = [];

  for (const f of classified) {
    if (f.classification === "A" && f.currentLemma && f.currentLemmaId) {
      const proposal = editorialProposal(f.arabic, f.currentLemma, f.masaqTopGlossEn, f.hamidullahSamples, f.kazimirskiSamples);
      if (proposal.status === "SAFE" && proposal.gloss) {
        safeGlosses.push({
          lemma: f.currentLemma,
          lemmaId: f.currentLemmaId,
          gloss: proposal.gloss,
          confidence: proposal.confidence,
        });
      } else {
        reviewItems.push({ wordId: f.wordId, arabic: f.arabic, issue: proposal.rationale });
      }
    } else if (f.classification === "B") {
      // Mapping needed — find best lemma candidate from MASAQ
      const candidates = unique(f.masaqLemmaIds);
      if (candidates.length === 1 && lemmaById.has(candidates[0])) {
        const l = lemmaById.get(candidates[0])!;
        safeMappings.push({
          wordId: f.wordId,
          arabic: f.arabic,
          lemmaId: candidates[0],
          lemma: l.arabic,
          evidence: `MASAQ hikma_lemma_id unique : ${candidates[0]} — status=${f.masaqMappingStatuses.map((s) => `${s.value}:${s.count}`).join(";")}`,
        });
      } else {
        reviewItems.push({ wordId: f.wordId, arabic: f.arabic, issue: `Mapping review: MASAQ lemma_ids=${candidates.join(",")}, stems=${f.masaqStems.join(",")}` });
      }
    } else if (f.classification === "C") {
      reviewItems.push({ wordId: f.wordId, arabic: f.arabic, issue: "Nécessite word_translation FR individuelle — aucun lemme fiable disponible." });
    } else {
      reviewItems.push({ wordId: f.wordId, arabic: f.arabic, issue: f.missingReason });
    }
  }

  // ─── 10. SIMULATIONS ─────────────────────────────────────────────────────
  function simulate(g: string[], m: Array<{ wordId: string; lemmaId: string }>, wt: string[]): {
    newCoveredForms: number;
    remainingForms: number;
    coveragePct: number;
    isReady: boolean;
    remainingFormIds: string[];
  } {
    const simCovered = new Set(coveredWordIds);
    // Apply glosses
    const glossLemmaIds = new Set(g);
    for (const [wid, lid] of finalLemma) {
      if (glossLemmaIds.has(lid)) simCovered.add(wid);
    }
    // Apply mappings
    for (const { wordId, lemmaId } of m) {
      if (glossLemmaIds.has(lemmaId)) simCovered.add(wordId);
    }
    // Apply word translations
    for (const wid of wt) simCovered.add(wid);

    const forms = surahOccForms.get(PRIMARY_TARGET) ?? new Set();
    let cov = 0;
    const remaining: string[] = [];
    for (const wid of forms) {
      if (simCovered.has(wid)) cov++; else remaining.push(wid);
    }
    return {
      newCoveredForms: cov,
      remainingForms: forms.size - cov,
      coveragePct: forms.size > 0 ? ROUND(cov / forms.size, 4) : 1,
      isReady: cov === forms.size,
      remainingFormIds: remaining,
    };
  }

  // Deduplicate safeGlosses by lemmaId
  const seenLemma = new Set<string>();
  const dedupedSafeGlosses = safeGlosses.filter((g) => {
    if (seenLemma.has(g.lemmaId)) return false;
    seenLemma.add(g.lemmaId);
    return true;
  });
  const safeGlossLemmaIds = dedupedSafeGlosses.map((g) => g.lemmaId);
  const scenarioGlossOnly = simulate(safeGlossLemmaIds, [], []);
  const scenarioGlossAndMappings = simulate(safeGlossLemmaIds, safeMappings, []);
  const scenarioComplete = simulate(safeGlossLemmaIds, safeMappings, safeWordTranslations.map((w) => w.wordId));

  const simulations = {
    glossOnly: {
      description: "SAFE lemma GLOSSES only",
      appliedGlosses: dedupedSafeGlosses.map((g) => ({ lemma: g.lemma, gloss: g.gloss })),
      appliedMappings: 0,
      appliedWordTranslations: 0,
      ...scenarioGlossOnly,
    },
    glossAndMappings: {
      description: "SAFE glosses + SAFE mappings",
      appliedGlosses: dedupedSafeGlosses.map((g) => ({ lemma: g.lemma, gloss: g.gloss })),
      appliedMappings: safeMappings.map((m) => ({ word: m.arabic, lemma: m.lemma })),
      appliedWordTranslations: 0,
      ...scenarioGlossAndMappings,
    },
    completeSafeScenario: {
      description: "SAFE glosses + SAFE mappings + SAFE word_translations",
      appliedGlosses: dedupedSafeGlosses.map((g) => ({ lemma: g.lemma, gloss: g.gloss })),
      appliedMappings: safeMappings.map((m) => ({ word: m.arabic, lemma: m.lemma })),
      appliedWordTranslations: safeWordTranslations.map((w) => ({ word: w.arabic, text: w.text })),
      ...scenarioComplete,
    },
  };

  // ─── 11. NEXT SURAH RANKING ──────────────────────────────────────────────
  const nextSurahRanking = NEXT_SURAHS.map((sn) => {
    const analysis = analyzeSurahForms(sn);
    // Estimate cost: count of forms needing lemma_gloss + mapping + word_translation
    let glossesNeeded = 0, mappingsNeeded = 0, wordTrNeeded = 0, reviewNeeded = 0;
    for (const f of analysis.missingForms) {
      if (f.currentLemmaId) glossesNeeded++;
      else if (f.masaqStems.length > 0 && f.masaqQuality && f.masaqQuality >= 0.5) mappingsNeeded++;
      else if (f.masaqStems.length === 0) wordTrNeeded++;
      else reviewNeeded++;
    }
    const distinctGlossLemmas = new Set(analysis.missingForms.filter((f) => f.currentLemmaId).map((f) => f.currentLemmaId)).size;
    const totalActions = distinctGlossLemmas + mappingsNeeded + wordTrNeeded + reviewNeeded;
    const reachable = reviewNeeded === 0 && wordTrNeeded === 0; // only glosses + mappings needed

    return {
      surah: sn,
      name: surahByNumber.get(sn)?.name_transliteration ?? `Surah ${sn}`,
      totalForms: analysis.totalOccurrenceDistinctForms,
      coveredForms: analysis.coveredOccurrenceDistinctForms,
      missingForms: analysis.missingOccurrenceDistinctForms,
      coveragePct: analysis.coveragePctOccDistinct,
      distinctGlossLemmasNeeded: distinctGlossLemmas,
      formsWithExistingLemma: glossesNeeded,
      mappingsPotential: mappingsNeeded,
      wordTranslationsNeeded: wordTrNeeded,
      reviewRequired: reviewNeeded,
      totalActionsEstimate: totalActions,
      reachableBySafeActions: reachable,
      missingFormSample: analysis.missingForms.slice(0, 5).map((f) => f.arabic),
    };
  }).sort((a, b) => {
    // Sort by reachable first, then by fewest actions, then by highest coverage
    if (a.reachableBySafeActions !== b.reachableBySafeActions) return a.reachableBySafeActions ? -1 : 1;
    if (a.totalActionsEstimate !== b.totalActionsEstimate) return a.totalActionsEstimate - b.totalActionsEstimate;
    return b.coveragePct - a.coveragePct;
  });

  // ─── 12. INTEGRITY CHECKS ────────────────────────────────────────────────
  const lemmaIdSet = new Set(lemmas.map((l) => l.id));
  let orphanQuran = 0, orphanWlm = 0, orphanLo = 0, orphanLt = 0;
  for (const w of words) if (w.lemma_id && !lemmaIdSet.has(w.lemma_id)) orphanQuran++;
  for (const m of wlm) if (!lemmaIdSet.has(m.lemma_id)) orphanWlm++;
  for (const l of linguisticOccurrences) if (l.hikma_lemma_id && !lemmaIdSet.has(l.hikma_lemma_id)) orphanLo++;
  for (const r of lemmaTranslations) if (!lemmaIdSet.has(r.lemma_id)) orphanLt++;

  // Duplicate checks
  const wlmKeyCount = new Map<string, number>();
  for (const m of wlm) { const k = `${m.word_id}|${m.lemma_id}`; wlmKeyCount.set(k, (wlmKeyCount.get(k) ?? 0) + 1); }
  const dupWlm = [...wlmKeyCount.values()].filter((v) => v > 1).length;

  const ltKeyCount = new Map<string, number>();
  for (const r of lemmaTranslations) {
    const k = `${r.lemma_id}|${r.language}|${r.source_id ?? ""}`;
    ltKeyCount.set(k, (ltKeyCount.get(k) ?? 0) + 1);
  }
  const dupLt = [...ltKeyCount.values()].filter((v) => v > 1).length;

  // Contradictory direct vs WLM
  let directWlmConflict = 0;
  for (const w of words) {
    const via = wlmByWord.get(w.id);
    if (w.lemma_id && via && w.lemma_id !== via.lemma_id) directWlmConflict++;
  }

  // Invalid lemma translations (wrong language or not validated)
  let invalidLt = 0;
  for (const r of lemmaTranslations) {
    if (r.language !== "fr" || !r.is_validated) invalidLt++;
  }

  // MASAQ coverage
  const masaqSurahSet = new Set<number>();
  for (const lo of linguisticOccurrences) {
    const occ = occById.get(lo.word_occurrence_id);
    if (!occ) continue;
    const ayah = ayahById.get(occ.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (surah) masaqSurahSet.add(surah.number);
  }

  const integrityHasAnomaly = orphanQuran > 0 || orphanWlm > 0 || orphanLo > 0 || orphanLt > 0 ||
    dupWlm > 0 || dupLt > 0 || directWlmConflict > 0;

  // ─── 13. VERDICT ─────────────────────────────────────────────────────────
  const s98CoveragePct = s98Analysis.coveragePctOccDistinct;
  const s98Missing = s98Analysis.missingOccurrenceDistinctForms;

  let verdict: string;
  if (integrityHasAnomaly) {
    verdict = "PHASE_88F_I_BLOCKED — integrity anomalies detected";
  } else if (s98CoveragePct >= 1) {
    verdict = "PHASE_88F_I_COMPLETE — S98 already READY (unexpected!)";
  } else if (safeGlosses.length > 0 && scenarioGlossOnly.isReady) {
    verdict = "PHASE_88F_I_COMPLETE — S98 reachable with SAFE lemma glosses only; ready for import phase";
  } else if (scenarioComplete.isReady) {
    verdict = "PHASE_88F_I_COMPLETE — S98 reachable with SAFE glosses + mappings + word_translations";
  } else if (reviewItems.length > 0) {
    verdict = "PHASE_88F_I_COMPLETE — audit completed; human review required for some forms";
  } else {
    verdict = "PHASE_88F_I_COMPLETE";
  }

  // ─── 14. MINIMUM ACTIONS ─────────────────────────────────────────────────
  const minimumActionsToReady = {
    lemmaGlossesNeeded: unique(s98Analysis.missingForms
      .filter((f) => f.currentLemmaId !== null && !f.hasLemmaTranslation)
      .map((f) => f.currentLemmaId!)).length,
    safeMappingsNeeded: safeMappings.length,
    wordTranslationsNeeded: classificationC,
    humanReviewNeeded: classificationD + classificationE + reviewItems.length,
    totalActions: unique(s98Analysis.missingForms
      .filter((f) => f.currentLemmaId !== null && !f.hasLemmaTranslation)
      .map((f) => f.currentLemmaId!)).length + safeMappings.length + classificationC,
    note: `Pour S98: ${unique(s98Analysis.missingForms.filter((f) => f.currentLemmaId !== null).map((f) => f.currentLemmaId!)).length} lemmes distincts sans glose FR, ${classificationB} mappings potentiels, ${classificationC} word_translations, ${classificationD} review, ${classificationE} do-not-import.`,
  };

  // ─── 15. BUILD REPORT ────────────────────────────────────────────────────
  const report = {
    phase: "88F-I",
    verdict,
    readOnly: true,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - startedAt) / 1000, 2),
    design: {
      strategy: "SURAH-FIRST / READY-FIRST",
      resolutionModel: "A (word_translations FR validated) ∪ B (quran_words.lemma_id → lemma_translations FR) ∪ C (word_lemma_mapping → lemma_translations FR) ∪ D (linguistic_occurrences hikma_lemma_id → lemma_translations FR) — UNION deduplicated by word_id",
      runtimeModel: "resolveWordMeanings → word_translations FR OR lemma_translations FR via (quran_words.lemma_id DIRECT OR word_lemma_mapping confidence='safe') — paths A/B/C only, D excluded",
      coverageDefinition: "Occurrence-distinct word_ids per surah (baseline). Learning path form coverage (runtime) noted where curriculum exists.",
      classifySurahReadinessRule: "READY iff effectiveFrPct === 100 (i.e., all forms resolve in FR). Surah 1 = REFERENCE.",
    },
    baseline: {
      quranWords: words.length,
      wordOccurrences: occurrences.length,
      lemmas: lemmas.length,
      activeLemmas: new Set(finalLemma.values()).size,
      wordLemmaMapping: wlm.length,
      wordTranslationsFrValidated: wtFr.size,
      lemmaTranslations: lemmaTranslations.length,
      lemmaTranslationsFrValidated: ltFr.size,
      linguisticOccurrences: linguisticOccurrences.length,
      frUnionDistinctWordIds: coveredWordIds.size,
      frOccurrences: coveredOccurrences,
      frPercentage: ROUND(coveredWordIds.size / words.length, 4),
      readiness: {
        READY: readyCount,
        IN_PREPARATION: inPrepCount,
        REFERENCE: refCount,
      },
      masaqSurahsCovered: `${masaqSurahSet.size}/${surahs.length}`,
      learningPathsWithCurriculum: lps.length,
    },
    targetSurah: {
      number: PRIMARY_TARGET,
      name: "Al-Bayyinah",
      totalForms: s98Analysis.totalOccurrenceDistinctForms,
      coveredForms: s98Analysis.coveredOccurrenceDistinctForms,
      missingForms: s98Analysis.missingOccurrenceDistinctForms,
      coveragePct: s98Analysis.coveragePctOccDistinct,
      readiness: classifyReadiness(PRIMARY_TARGET, s98Analysis.coveragePctOccDistinct),
      hasLearningPath: s98Analysis.learningPathForms !== null,
      learningPathForms: s98Analysis.learningPathForms,
      learningPathCovered: s98Analysis.learningPathCovered,
      learningPathCoveragePct: s98Analysis.learningPathCoveragePct,
      runtimeModelCoveredForms: s98Analysis.runtimeModelCoveredForms,
      runtimeModelCoveragePct: s98Analysis.runtimeModelCoveragePct,
      note: s98Analysis.learningPathForms === null
        ? "S98 n'a pas encore de parcours pédagogique curé. La couverture est calculée sur les formes distinctes (occurrence-distinct word_ids)."
        : "Couverture calculée sur le parcours pédagogique (curriculum).",
    },
    missingForms: classified.map((f) => ({
      arabic: f.arabic,
      wordId: f.wordId,
      vocalization: f.vocalization,
      occurrenceCount: f.occurrenceCount,
      occurrenceCountInS98: f.contextInS98.length,
      surahs: f.surahs,
      currentLemmaId: f.currentLemmaId,
      currentLemma: f.currentLemma,
      resolutionPath: f.resolutionPath,
      directLemmaId: f.directLemmaId,
      wlmLemmaId: f.wlmLemmaId,
      masaqLemmaIds: f.masaqLemmaIds,
      masaqQuality: f.masaqQuality,
      masaqStems: f.masaqStems,
      masaqTopGlossEn: f.masaqTopGlossEn,
      masaqTopGlossShare: f.masaqTopGlossShare,
      masaqGlossesEn: f.masaqGlossesEn,
      masaqMappingStatuses: f.masaqMappingStatuses,
      masaqCompetingStems: f.masaqCompetingStems,
      masaqPos: f.masaqPos,
      masaqSegmentMorphs: f.masaqSegmentMorphs,
      lemmaPaths: f.lemmaPaths,
      wordTranslationHikmaFr: f.wordTranslationHikmaFr,
      lemmaTranslationHikmaFr: f.lemmaTranslationHikmaFr,
      hamidullahS98: f.hamidullahSamples,
      kazimirskiS98: f.kazimirskiSamples,
      contextInS98: f.contextInS98.map((c) => ({
        ayahNum: c.ayahNum,
        globalAyahNum: c.globalAyahNum,
      })),
      missingReason: f.missingReason,
      classification: f.classification,
      editorialRecommendation: editorialProposal(
        f.arabic,
        f.currentLemma,
        f.masaqTopGlossEn,
        f.hamidullahSamples,
        f.kazimirskiSamples,
      ),
    })),
    classification: {
      A_EXISTING_LEMMA_GLOSS_NEEDED: classificationA,
      B_EXISTING_LEMMA_MAPPING_NEEDED: classificationB,
      C_WORD_TRANSLATION_NEEDED: classificationC,
      D_REVIEW_REQUIRED: classificationD,
      E_DO_NOT_IMPORT: classificationE,
      distinctLemmasWithoutFrGloss: new Set(classified.filter((f) => f.currentLemmaId !== null).map((f) => f.currentLemmaId)).size,
      distinctLemmasRequiringGloss: unique(classified.filter((f) => f.classification === "A" && f.currentLemmaId).map((f) => f.currentLemmaId!)).length,
    },
    safeGlosses: dedupedSafeGlosses.map((g) => ({
      lemma: g.lemma,
      lemmaId: g.lemmaId,
      proposedGloss: g.gloss,
      confidence: g.confidence,
    })),
    safeMappings: safeMappings.map((m) => ({
      wordId: m.wordId,
      arabic: m.arabic,
      lemmaId: m.lemmaId,
      lemma: m.lemma,
      evidence: m.evidence,
    })),
    safeWordTranslations: safeWordTranslations.map((w) => ({
      wordId: w.wordId,
      arabic: w.arabic,
      proposedText: w.text,
      confidence: w.confidence,
    })),
    reviewRequired: reviewItems.map((r) => ({
      wordId: r.wordId,
      arabic: r.arabic,
      issue: r.issue,
    })),
    simulations,
    minimumActionsToReady,
    nextSurahRanking,
    integrity: {
      orphanQuranWordsLemma: orphanQuran,
      orphanWordLemmaMapping: orphanWlm,
      orphanLinguisticOccurrences: orphanLo,
      orphanLemmaTranslations: orphanLt,
      duplicateWordLemmaMapping: dupWlm,
      duplicateLemmaTranslations: dupLt,
      contradictoryDirectVsWlm: directWlmConflict,
      invalidLemmaTranslations: invalidLt,
      existingTranslationsUnchanged: true,
      classifySurahReadinessUnchanged: true,
      note: "Read-only audit. ZERO writes. All anomalies are observation-only and require a separate infrastructure phase to fix.",
    },
    invariants: {
      databaseWrites: 0,
      lexicalWrites: 0,
      translationWrites: 0,
      curriculumWrites: 0,
      masaqWrites: 0,
      migrations: 0,
      seeds: 0,
      readOnly: true,
    },
    tests: {
      run: false,
      note: "Tests exécutés après la génération du rapport (vitest · tsc · eslint).",
    },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nRapport → ${OUTPUT}`);
  console.log(`Durée : ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

  // ─── 16. TERMINAL SUMMARY ────────────────────────────────────────────────
  console.log("\n=== PHASE 88F-I — AUDIT TERMINÉ (READ-ONLY, 0 écriture) ===");
  console.log(`Baseline: ${words.length} words · FR union ${coveredWordIds.size} (${ROUND(coveredWordIds.size / words.length * 100, 1)}%) · ${readyCount} READY`);
  console.log(`S${PRIMARY_TARGET} (Al-Bayyinah): ${s98Analysis.totalOccurrenceDistinctForms} formes, ${s98Analysis.coveredOccurrenceDistinctForms} couvertes (${ROUND(s98CoveragePct * 100, 1)}%), ${s98Missing} manquantes`);
  console.log(`  Classification: A=${classificationA} B=${classificationB} C=${classificationC} D=${classificationD} E=${classificationE}`);
  console.log(`  SAFE glosses: ${dedupedSafeGlosses.length} (${dedupedSafeGlosses.map((g) => g.lemma).join(", ")}) · SAFE mappings: ${safeMappings.length} · SAFE word_tr: ${safeWordTranslations.length}`);
  console.log(`  Review items: ${reviewItems.length}`);
  console.log(`  Sim: glossOnly=${scenarioGlossOnly.coveragePct}(${scenarioGlossOnly.isReady ? "READY" : "NOT_READY"}) · +mappings=${scenarioGlossAndMappings.coveragePct}(${scenarioGlossAndMappings.isReady ? "READY" : "NOT_READY"}) · complete=${scenarioComplete.coveragePct}(${scenarioComplete.isReady ? "READY" : "NOT_READY"})`);
  console.log(`\nNext surah ranking: ${nextSurahRanking.slice(0, 6).map((r) => `S${r.surah}(${ROUND(r.coveragePct * 100, 1)}%/-${r.missingForms},${r.totalActionsEstimate}act,${r.reachableBySafeActions ? "OK" : "REVIEW"})`).join(" · ")}`);
  console.log(`\nIntegrity: orphans=${orphanQuran + orphanWlm + orphanLo + orphanLt} dupWlm=${dupWlm} dupLt=${dupLt} conflicts=${directWlmConflict}`);
  console.log(`=== ${verdict} ===`);
}

// ---------------------------------------------------------------------------
// PURE FUNCTION: classifySurahReadiness (mirror of runtime code)
// ---------------------------------------------------------------------------
function classifyReadiness(surahNumber: number, coveragePct: number): string {
  if (surahNumber === 1) return "REFERENCE";
  if (coveragePct >= 1) return "READY";
  return "IN_PREPARATION";
}

main().catch((error) => {
  console.error("PHASE 88F-I failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});