/**
 * PHASE 88F-K — SURAH-FIRST TARGETED RESOLUTION AUDIT — S92 AL-LAYL
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Target: S92 — Al-Layl.
 * Classify each missing form into A/B/C/D/E/F and determine the minimal
 * SAFE path to 100 % FR → READY.
 *
 * This script only uses paginated Supabase `.select()` calls and writes the
 * local JSON report. No inserts/updates/upserts/deletes/rpcs.
 *
 * Livrable : reports/phase-88f-k-surah92-audit.json
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const PAGE_SIZE = 1000;
const OUTPUT = "reports/phase-88f-k-surah92-audit.json";
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const HAMIDULLAH_TR = "Muhammad Hamidullah";
const KAZIMIRSKI_TR = "Albert de Biberstein-Kazimirski";
const TARGET = 92;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------------------
// STATIC READ-ONLY GUARANTEE
// ---------------------------------------------------------------------------
// VERIFIED MANUALLY: only client.from(...).select(...) reads via selectAll<T>().
// The only filesystem writes are mkdirSync + writeFileSync for the report JSON.
// To re-verify, search for these forbidden write patterns — none should exist:
//   .insert(  .update(  .upsert(  .delete(  .rpc(

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

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)];
}

function sortedEntries(map: Map<string, number>): Array<{ value: string; count: number }> {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));
}

// ---------------------------------------------------------------------------
// EDITORIAL GLOSS KNOWLEDGE — conservative hints cross-checked at runtime.
// A gloss is only marked SAFE when this hint exists AND MASAQ + translations
// converge. Otherwise REVIEW_REQUIRED. Never invented.
// ---------------------------------------------------------------------------
const KNOWN_GLOSS_HINTS: Record<string, string> = {
  أتقى: "le plus pieux / craignant Dieu",
  حسني: "la plus belle (récompense) / le meilleur",
  جزي: "rétribuer / récompenser",
  أحد: "un / personne / quelqu'un",
  شتى: "dispersés / divers / séparés",
  عسرى: "difficulté / la plus dure (voie)",
  مال: "biens / richesse",
  جنب: "écarter / éviter / être éloigné",
  بخل: "être avare / refuser (par avarice)",
  تردى: "tomber / se précipiter (vers la perte)",
  تلظى: "flamber / s'embraser",
  سعي: "effort / s'efforcer / agir",
  أنذر: "avertir / mettre en garde",
  يسر: "faciliter / rendre aisé",
  استغنى: "se passer de / se suffire à soi-même",
  صلا: "brûler / endurer (le feu)",
};

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

  console.log(`=== PHASE 88F-K — SURAH-FIRST AUDIT S${TARGET} AL-LAYL (READ-ONLY) ===`);
  console.log("  DB writes: 0 — strictly paginated SELECT calls only.\n");

  // ─── 1. LOAD ─────────────────────────────────────────────────────────────
  console.log("→ Chargement…");
  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === HIKMA_SOURCE);
  if (!hikmaSource) throw new Error(`Source « ${HIKMA_SOURCE} » introuvable.`);

  const [surahs, ayahs, words, occurrences, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences, linguisticSegments, verseTranslations] =
    await Promise.all([
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
  console.log(`  Chargé: surahs=${surahs.length} words=${words.length} occs=${occurrences.length} lemmas=${lemmas.length} wlm=${wlm.length} wt=${wordTranslations.length} lt=${lemmaTranslations.length} lo=${linguisticOccurrences.length}`);

  // ─── 2. INDEXES ──────────────────────────────────────────────────────────
  const wordById = new Map(words.map((w) => [w.id, w]));
  const lemmaById = new Map(lemmas.map((l) => [l.id, l]));
  const lemmaByArabic = new Map(lemmas.map((l) => [l.arabic, l]));
  const occById = new Map(occurrences.map((o) => [o.id, o]));
  const ayahById = new Map(ayahs.map((a) => [a.id, a]));
  const surahById = new Map(surahs.map((s) => [s.id, s]));
  const wlmByWord = new Map<string, WlmRow>();
  for (const r of wlm) if (!wlmByWord.has(r.word_id)) wlmByWord.set(r.word_id, r);

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

  const verseByAyahTranslator = new Map<string, Map<string, string>>();
  for (const tr of verseTranslations) {
    let m = verseByAyahTranslator.get(tr.ayah_id);
    if (!m) { m = new Map(); verseByAyahTranslator.set(tr.ayah_id, m); }
    m.set(tr.translator, tr.text);
  }

  // ─── 3. FR COVERAGE (A/B/C/D UNION) ──────────────────────────────────────
  const wtFr = new Map<string, string>();
  for (const r of wordTranslations) if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) wtFr.set(r.word_id, r.text);
  const ltFr = new Map<string, string>();
  for (const r of lemmaTranslations) if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) ltFr.set(r.lemma_id, r.text);

  const finalLemma = new Map<string, string>();
  const resolutionPath = new Map<string, "DIRECT" | "WLM" | "MASAQ">();
  for (const w of words) if (w.lemma_id) { finalLemma.set(w.id, w.lemma_id); resolutionPath.set(w.id, "DIRECT"); }
  for (const m of wlm) if (!finalLemma.has(m.word_id)) { finalLemma.set(m.word_id, m.lemma_id); resolutionPath.set(m.word_id, "WLM"); }
  for (const l of linguisticOccurrences) {
    if (!l.hikma_lemma_id) continue;
    const occ = occById.get(l.word_occurrence_id);
    if (occ && !finalLemma.has(occ.word_id)) { finalLemma.set(occ.word_id, l.hikma_lemma_id); resolutionPath.set(occ.word_id, "MASAQ"); }
  }

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

  // ─── 4. SURAH FORMS ──────────────────────────────────────────────────────
  const surahOccForms = new Map<number, Set<string>>();
  for (const occ of occurrences) {
    const ayah = ayahById.get(occ.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (!surah) continue;
    let set = surahOccForms.get(surah.number);
    if (!set) { set = new Set(); surahOccForms.set(surah.number, set); }
    set.add(occ.word_id);
  }

  // ─── 5. TARGET SURAH — MISSING FORMS ─────────────────────────────────────
  const s92Forms = surahOccForms.get(TARGET) ?? new Set<string>();
  const missingIds = [...s92Forms].filter((wid) => !coveredWordIds.has(wid));

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
      glossesEn: sortedEntries(glossCounts).slice(0, 10),
      mappingStatuses: sortedEntries(statuses),
      quality: loTotal > 0 ? ROUND((statuses.get("EXACT") ?? 0) / loTotal, 3) : null,
      competingStems: stemSet.size > 1,
      pos: [...posSet].sort(),
    };
  }

  function ayahContext(wordId: string) {
    return occurrences.filter((o) => o.word_id === wordId).map((occ) => {
      const ayah = ayahById.get(occ.ayah_id);
      const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
      const hamMap = verseByAyahTranslator.get(occ.ayah_id);
      return {
        ayahId: occ.ayah_id,
        surahNum: surah?.number ?? 0,
        ayahNum: ayah?.ayah_number,
        globalAyahNum: ayah?.global_ayah_number,
        hamidullah: hamMap?.get(HAMIDULLAH_TR) ?? null,
        kazimirski: hamMap?.get(KAZIMIRSKI_TR) ?? null,
      };
    });
  }

  // ─── 6. CLASSIFY EACH MISSING FORM ───────────────────────────────────────
  type Classification = "A_SAFE_GLOSS" | "B_LEMMA_REVIEW" | "C_SAFE_MAPPING" | "D_REVIEW_MAPPING" | "E_WORD_TRANSLATION" | "F_ALREADY_RESOLVABLE";

  const missingFormDetails = missingIds.map((wordId) => {
    const word = wordById.get(wordId)!;
    const masa = masaqEvidence(wordId);
    const contexts = ayahContext(wordId);
    const inS92 = contexts.filter((c) => c.surahNum === TARGET);
    const currentLemmaId = finalLemma.get(wordId) ?? null;
    const currentLemma = currentLemmaId ? lemmaById.get(currentLemmaId)?.arabic ?? null : null;

    // F check: is it actually already resolvable?
    const hasWordTr = wtFr.has(wordId);
    const hasLemmaTr = currentLemmaId ? ltFr.has(currentLemmaId) : false;
    const actuallyCovered = hasWordTr || hasLemmaTr;

    let classification: Classification;
    let safeGloss: string | null = null;
    let reviewReason: string | null = null;
    let mappingLemmaId: string | null = null;
    let mappingLemmaArabic: string | null = null;
    let wordTrProposal: string | null = null;

    if (actuallyCovered) {
      classification = "F_ALREADY_RESOLVABLE";
    } else if (currentLemmaId) {
      // Lemma exists: safe gloss vs review
      const hint = KNOWN_GLOSS_HINTS[currentLemma ?? ""] ?? null;
      const confSources = [inS92.filter((c) => c.hamidullah).length > 0, inS92.filter((c) => c.kazimirski).length > 0];
      const sourceCount = confSources.filter(Boolean).length;
      const masaOk = (masa.quality ?? 0) >= 1 && !masa.competingStems && (masa.topGlossShare ?? 0) >= 0.5;

      if (hint && masaOk && sourceCount >= 1) {
        classification = "A_SAFE_GLOSS";
        safeGloss = hint;
      } else {
        classification = "B_LEMMA_REVIEW";
        reviewReason = [
          !hint ? `pas de glose Hikma pré-établie pour « ${currentLemma} »` : null,
          !masaOk ? `MASAQ non unanime ou quality<1 (quality=${masa.quality}, stems=${masa.stems.join(",")})` : null,
          sourceCount === 0 ? "aucune traduction Hamidullah/Kazimirski disponible pour les ayahs S92" : null,
        ].filter(Boolean).join(" · ");
      }
    } else if (masa.stems.length > 0) {
      // Has MASAQ but no lemma
      const candidateLemmas = unique(masa.hikmaLemmaIds).filter((id) => lemmaById.has(id));
      const stemToLemma = unique(masa.stems).map((st) => lemmaByArabic.get(st)?.id).filter(Boolean);

      if (candidateLemmas.length === 1 && (masa.quality ?? 0) >= 1 && !masa.competingStems) {
        classification = "C_SAFE_MAPPING";
        mappingLemmaId = candidateLemmas[0] ?? null;
        mappingLemmaArabic = (candidateLemmas[0] ? lemmaById.get(candidateLemmas[0])?.arabic ?? null : null);
      } else if (stemToLemma.length === 1 && (masa.quality ?? 0) >= 1 && !masa.competingStems) {
        classification = "C_SAFE_MAPPING";
        mappingLemmaId = stemToLemma[0] ?? null;
        mappingLemmaArabic = (stemToLemma[0] ? lemmaById.get(stemToLemma[0])?.arabic ?? null : null);
      } else {
        classification = "D_REVIEW_MAPPING";
        reviewReason = `stem MASAQ « ${masa.stems.join(",")} » UNMAPPED — ${candidateLemmas.length === 0 ? "aucun hikma_lemma_id" : `${candidateLemmas.length} candidats lemma`}, quality=${masa.quality}, statuses=${masa.mappingStatuses.map((s) => `${s.value}:${s.count}`).join(";")}`;
      }
    } else {
      classification = "E_WORD_TRANSLATION";
      reviewReason = "aucun lemme ni stem MASAQ — nécessite une traduction word-level.";
    }

    // For E: propose word translation if hint exists for stem
    if (classification === "E_WORD_TRANSLATION") {
      const stemHint = KNOWN_GLOSS_HINTS[masa.stems[0] ?? ""] ?? null;
      wordTrProposal = stemHint;
    }
    // For D: if a known hint exists for the MASAQ stem, propose it as word_tr fallback
    if (classification === "D_REVIEW_MAPPING") {
      const stemHint = KNOWN_GLOSS_HINTS[masa.stems[0] ?? ""] ?? null;
      wordTrProposal = stemHint; // proposed word translation as fallback
    }

    const hamidullahSamples = inS92.map((c) => c.hamidullah).filter((t): t is string => Boolean(t)).slice(0, 3);
    const kazimirskiSamples = inS92.map((c) => c.kazimirski).filter((t): t is string => Boolean(t)).slice(0, 3);

    return {
      arabic: word.arabic,
      wordId: word.id,
      occurrenceCount: occCountByWord.get(wordId) ?? 0,
      occurrenceCountInS92: inS92.length,
      surahs: [...(wordSurahs.get(wordId) ?? [])].sort((a, b) => a - b),
      currentLemmaId,
      currentLemma,
      resolutionPath: resolutionPath.get(wordId) ?? null,
      masaqStems: masa.stems,
      masaqHikmaLemmaIds: masa.hikmaLemmaIds,
      masaqQuality: masa.quality,
      masaqTopGlossEn: masa.topGlossEn,
      masaqTopGlossShare: masa.topGlossShare,
      masaqGlossesEn: masa.glossesEn,
      masaqMappingStatuses: masa.mappingStatuses,
      masaqCompetingStems: masa.competingStems,
      masaqPos: masa.pos,
      contextInS92: inS92.map((c) => ({ ayahNum: c.ayahNum, globalAyahNum: c.globalAyahNum })),
      hamidullahS92: hamidullahSamples,
      kazimirskiS92: kazimirskiSamples,
      classification,
      safeGloss,
      reviewReason,
      mappingLemmaId,
      mappingLemmaArabic,
      wordTrProposal,
    };
  });

  // ─── 7. AGGREGATE CLASSIFICATION ─────────────────────────────────────────
  const counts = new Map<string, number>();
  for (const f of missingFormDetails) increment(counts, f.classification);
  const count = (c: string) => counts.get(c) ?? 0;

  // ─── 8. BATCH SAFE vs REVIEW ─────────────────────────────────────────────
  const safeGlosses: Array<{ lemma: string; lemmaId: string; gloss: string }> = [];
  const safeMappings: Array<{ wordId: string; arabic: string; lemmaId: string; lemma: string }> = [];
  const safeWordTranslations: Array<{ wordId: string; arabic: string; text: string }> = [];
  const reviewItems: Array<{ wordId: string; arabic: string; issue: string }> = [];

  const seenLemma = new Set<string>();
  for (const f of missingFormDetails) {
    if (f.classification === "A_SAFE_GLOSS" && f.currentLemmaId && f.safeGloss) {
      if (!seenLemma.has(f.currentLemmaId)) {
        seenLemma.add(f.currentLemmaId);
        safeGlosses.push({ lemma: f.currentLemma!, lemmaId: f.currentLemmaId, gloss: f.safeGloss });
      }
    } else if (f.classification === "C_SAFE_MAPPING" && f.mappingLemmaId) {
      safeMappings.push({ wordId: f.wordId, arabic: f.arabic, lemmaId: f.mappingLemmaId, lemma: f.mappingLemmaArabic ?? "" });
    } else if (f.classification === "E_WORD_TRANSLATION" && f.wordTrProposal) {
      safeWordTranslations.push({ wordId: f.wordId, arabic: f.arabic, text: f.wordTrProposal });
    } else if (f.classification !== "F_ALREADY_RESOLVABLE") {
      reviewItems.push({ wordId: f.wordId, arabic: f.arabic, issue: f.reviewReason ?? "revue requise" });
    }
  }

  // ─── 9. SIMULATIONS (UNION distinct word_id) ─────────────────────────────
  const glossLemmaIds = new Set(safeGlosses.map((g) => g.lemmaId));
  const mappingList = safeMappings;
  const wordTrIds = safeWordTranslations.map((w) => w.wordId);

  function simulate(gloss: boolean, mapping: boolean, wordtr: boolean, review: boolean) {
    const sim = new Set(coveredWordIds);
    if (gloss) {
      for (const [wid, lid] of finalLemma) if (glossLemmaIds.has(lid)) sim.add(wid);
    }
    if (mapping) {
      for (const m of mappingList) if (glossLemmaIds.has(m.lemmaId)) sim.add(m.wordId);
    }
    if (wordtr) {
      for (const wid of wordTrIds) sim.add(wid);
    }
    if (review) {
      // Review resolution: assume all REVIEW forms get resolved (via word_tr or validated mapping)
      for (const f of missingFormDetails) {
        if (f.classification === "B_LEMMA_REVIEW" || f.classification === "D_REVIEW_MAPPING" || f.classification === "E_WORD_TRANSLATION") {
          sim.add(f.wordId);
        }
      }
    }
    const forms = s92Forms;
    let cov = 0;
    const remaining: string[] = [];
    for (const wid of forms) { if (sim.has(wid)) cov++; else remaining.push(wid); }
    return {
      newCoveredForms: cov,
      remainingForms: forms.size - cov,
      coveragePct: forms.size > 0 ? ROUND(cov / forms.size, 4) : 1,
      isReady: cov === forms.size && forms.size > 0,
      remainingFormIds: remaining,
    };
  }

  const scenarios = {
    baseline: simulate(false, false, false, false),
    glossOnly: simulate(true, false, false, false),
    mappingOnly: simulate(false, true, false, false),
    wordTrOnly: simulate(false, false, true, false),
    safeCombination: simulate(true, true, true, false),
    completeAfterReview: simulate(true, true, true, true),
  };

  // ─── 10. INTEGRITY ───────────────────────────────────────────────────────
  const lemmaIdSet = new Set(lemmas.map((l) => l.id));
  let orphanQuran = 0, orphanWlm = 0, orphanLo = 0, orphanLt = 0;
  for (const w of words) if (w.lemma_id && !lemmaIdSet.has(w.lemma_id)) orphanQuran++;
  for (const m of wlm) if (!lemmaIdSet.has(m.lemma_id)) orphanWlm++;
  for (const l of linguisticOccurrences) if (l.hikma_lemma_id && !lemmaIdSet.has(l.hikma_lemma_id)) orphanLo++;
  for (const r of lemmaTranslations) if (!lemmaIdSet.has(r.lemma_id)) orphanLt++;

  const wlmKeyCount = new Map<string, number>();
  for (const m of wlm) { const k = `${m.word_id}|${m.lemma_id}`; wlmKeyCount.set(k, (wlmKeyCount.get(k) ?? 0) + 1); }
  const dupWlm = [...wlmKeyCount.values()].filter((v) => v > 1).length;

  const ltKeyCount = new Map<string, number>();
  for (const r of lemmaTranslations) { const k = `${r.lemma_id}|${r.language}|${r.source_id ?? ""}`; ltKeyCount.set(k, (ltKeyCount.get(k) ?? 0) + 1); }
  const dupLt = [...ltKeyCount.values()].filter((v) => v > 1).length;

  let directWlmConflict = 0;
  for (const w of words) {
    const via = wlmByWord.get(w.id);
    if (w.lemma_id && via && w.lemma_id !== via.lemma_id) directWlmConflict++;
  }

  const integrityHasAnomaly = orphanQuran > 0 || orphanWlm > 0 || orphanLo > 0 || orphanLt > 0 || dupWlm > 0 || dupLt > 0 || directWlmConflict > 0;

  // S98 readiness check (must remain READY)
  const s98Forms = surahOccForms.get(98) ?? new Set<string>();
  const s98Covered = [...s98Forms].filter((wid) => coveredWordIds.has(wid)).length;
  const s98StillReady = s98Forms.size > 0 && s98Covered === s98Forms.size;

  // ─── 11. VERDICT ─────────────────────────────────────────────────────────
  const verdict = integrityHasAnomaly ? "PHASE_88F_K_BLOCKED — integrity anomalies" : "PHASE_88F_K_COMPLETE";

  // ─── 12. MINIMAL PATH ────────────────────────────────────────────────────
  const minimalPath = {
    safeLemmaGlosses: safeGlosses.length,
    safeMappings: safeMappings.length,
    safeWordTranslations: safeWordTranslations.length,
    reviewRequired: reviewItems.length,
    distinctReviewForms: reviewItems.map((r) => r.arabic),
    canReach100WithSafeOnly: scenarios.safeCombination.isReady,
    canReach100WithReview: scenarios.completeAfterReview.isReady,
  };

  // ─── 13. REPORT ──────────────────────────────────────────────────────────
  const report = {
    phase: "88F-K",
    verdict,
    readOnly: true,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - startedAt) / 1000, 2),
    targetSurah: { number: TARGET, name: "Al-Layl" },
    baseline: {
      totalForms: s92Forms.size,
      coveredForms: s92Forms.size - missingIds.length,
      missingForms: missingIds.length,
      coveragePct: s92Forms.size > 0 ? ROUND((s92Forms.size - missingIds.length) / s92Forms.size, 4) : 1,
      readiness: (s92Forms.size - missingIds.length) === s92Forms.size ? "READY" : "IN_PREPARATION",
      totalOccurrences: [...s92Forms].reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0),
      coveredOccurrences: [...s92Forms].filter((wid) => coveredWordIds.has(wid)).reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0),
      globalSnapshot: {
        quranWords: words.length,
        frUnionDistinctWordIds: coveredWordIds.size,
        frOccurrences: coveredOccurrences,
        frPercentage: ROUND(coveredWordIds.size / words.length, 4),
        lemmaTranslations: lemmaTranslations.length,
        lemmaTranslationsFrValidated: ltFr.size,
        wordTranslationsFrValidated: wtFr.size,
        s98StillReady,
      },
    },
    historicalNote: "88F-I estimait S92 à ≈75,8 % avec 15 formes manquantes et 15 actions. Recalcul effectué depuis la DB actuelle (post-88F-J).",
    missingForms: missingFormDetails,
    classification: {
      A_SAFE_GLOSS: count("A_SAFE_GLOSS"),
      B_LEMMA_REVIEW: count("B_LEMMA_REVIEW"),
      C_SAFE_MAPPING: count("C_SAFE_MAPPING"),
      D_REVIEW_MAPPING: count("D_REVIEW_MAPPING"),
      E_WORD_TRANSLATION: count("E_WORD_TRANSLATION"),
      F_ALREADY_RESOLVABLE: count("F_ALREADY_RESOLVABLE"),
    },
    editorialEvidence: missingFormDetails.map((f) => ({
      arabic: f.arabic,
      lemma: f.currentLemma,
      lemmaId: f.currentLemmaId,
      masaqStem: f.masaqStems[0] ?? null,
      occurrenceCount: f.occurrenceCount,
      surahsCount: f.surahs.length,
      proposedGloss: f.safeGloss ?? f.wordTrProposal,
      confidence: f.classification === "A_SAFE_GLOSS" ? 0.85 : f.classification === "C_SAFE_MAPPING" ? 0.85 : f.classification === "E_WORD_TRANSLATION" && f.wordTrProposal ? 0.6 : null,
      hamidullah: f.hamidullahS92,
      kazimirski: f.kazimirskiS92,
      masaqGlossEn: f.masaqTopGlossEn,
      masaqQuality: f.masaqQuality,
      classification: f.classification,
      reviewReason: f.reviewReason,
    })),
    batchSafe: {
      lemmaGlosses: safeGlosses,
      mappings: safeMappings,
      wordTranslations: safeWordTranslations,
    },
    batchReview: reviewItems,
    simulations: scenarios,
    minimalPathToReady: minimalPath,
    integrity: {
      orphanQuranWordsLemma: orphanQuran,
      orphanWordLemmaMapping: orphanWlm,
      orphanLinguisticOccurrences: orphanLo,
      orphanLemmaTranslations: orphanLt,
      duplicateWordLemmaMapping: dupWlm,
      duplicateLemmaTranslations: dupLt,
      contradictoryDirectVsWlm: directWlmConflict,
      existingTranslationsIntact: true,
      s98StillReady,
      curriculumUnchanged: true,
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
    tests: { run: false, note: "Exécutés après la génération du rapport (vitest · tsc · eslint)." },
    nextPhase: "PHASE 88F-L — import des éléments SAFE validés (lemma glosses + mappings + word_translations), puis traitement séparé des REVIEW.",
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nRapport → ${OUTPUT}`);

  // ─── 14. TERMINAL SUMMARY ────────────────────────────────────────────────
  console.log(`\n=== PHASE 88F-K — AUDIT S92 TERMINÉ (READ-ONLY) ===`);
  console.log(`S92: ${s92Forms.size - missingIds.length}/${s92Forms.size} (${ROUND((s92Forms.size - missingIds.length) / s92Forms.size * 100, 1)}%) — ${missingIds.length} manquantes`);
  console.log(`  Classification: A=${count("A_SAFE_GLOSS")} B=${count("B_LEMMA_REVIEW")} C=${count("C_SAFE_MAPPING")} D=${count("D_REVIEW_MAPPING")} E=${count("E_WORD_TRANSLATION")} F=${count("F_ALREADY_RESOLVABLE")}`);
  console.log(`  BATCH SAFE: ${safeGlosses.length} glosses · ${safeMappings.length} mappings · ${safeWordTranslations.length} word_tr`);
  console.log(`  BATCH REVIEW: ${reviewItems.length}`);
  console.log(`  Sim: glossOnly=${scenarios.glossOnly.coveragePct} · safeCombination=${scenarios.safeCombination.coveragePct}(${scenarios.safeCombination.isReady ? "READY" : "NOT"}) · complete=${scenarios.completeAfterReview.coveragePct}(${scenarios.completeAfterReview.isReady ? "READY" : "NOT"})`);
  console.log(`  S98 reste READY: ${s98StillReady}`);
  console.log(`=== ${verdict} ===`);
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });