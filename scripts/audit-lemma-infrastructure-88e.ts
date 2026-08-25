/**
 * Phase 88E-A — Lemma Infrastructure Build
 * SAFE MAPPING GENERATION + SIMULATION — READ-ONLY
 *
 * Extracts MASAQ stems, normalizes, deduplicates, classifies candidates,
 * and simulates the impact of creating lemmas + word→lemma mappings.
 *
 * STRICT READ-ONLY : 0 DB writes. 0 code modifications.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { normalizeWordText } from "../lib/quran/normalize-text";

// ─── Re-use Hikma skeleton (from lemma-mapping.ts) ──────────────────────────
function skeleton(s: string): string {
  return normalizeWordText(s)
    .replace(/\u0649/g, "\u064A") // alif maqsura → ya
    .replace(/\u0622/g, "\u0627") // آ → alef
    .replace(/\u0653/g, "")       // madda ignorée
    .replace(/\u0670/g, "\u0627"); // dagger alef → alef
}

const SELECT_PAGE_SIZE = 1000;

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file); } catch {}
  }
}

async function selectAll<T>(client: ReturnType<typeof createClient>, table: string, columns: string): Promise<T[]> {
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

// ─── Types ──────────────────────────────────────────────────────────────────

type MasaqRow = {
  id: string;
  word_occurrence_id: string;
  surah_number: number;
  ayah_number: number;
  masaq_word: string;
  masaq_stem: string;
  masaq_gloss_en: string | null;
  hikma_lemma_id: string | null;
  lemma_mapping_status: string;
  pos: string[] | null;
  case_mood: string[] | null;
};

type LemmaCandidate = {
  masaqStem: string;
  stemSkeleton: string;
  normalized: string;
  occurrenceCount: number;
  distinctSurahs: number;
  distinctForms: number;
  distinctAyahs: number;
  posObserved: string[];
  glossEnSamples: string[];
  alreadyMapped: boolean;
  existingHikmaLemmaId: string | null;
  existingHikmaLemmaArabic: string | null;
  existingHikmaLemmaSkel: string | null;
  classification: "SAFE" | "NORMALIZATION_REVIEW" | "PARTIAL_REVIEW" | "LEXICAL_REVIEW" | "CONFLICT" | "DUPLICATE" | "UNRESOLVED";
  evidence: string[];
  distinctFormIds: string[];
  distinctWordIds: string[];
  formArabicSamples: string[];
};

type WordMappingCandidate = {
  wordId: string;
  formArabic: string;
  masaqStem: string;
  lemmaCandidateSkeleton: string;
  existingLemmaId: string | null;
  existingWlmMapping: boolean;
  classification: string;
  confidence: "safe" | "review_required" | "conflict";
  surahCount: number;
  occurrenceCount: number;
};

// ─── Classification helpers ─────────────────────────────────────────────────

/** Small function words that should NOT become lemmas */
const FUNCTION_WORD_PATTERNS = [
  /^[وبفل]$/,                  // single proclitics و ب ف ل
  /^[وبفل][وبفل]$/,            // double proclitics وب بل فل etc
  /^(ال|لل|بسم|فب|وب|فل|بل)$/, // common prefixes
];

function isFunctionWord(stem: string): boolean {
  return FUNCTION_WORD_PATTERNS.some(p => p.test(stem));
}

/** Proper noun indicators (capitalized names in English gloss) */
function isLikelyProperNoun(glossEn: string | null, stem: string): boolean {
  if (!glossEn) return false;
  // Capitalized word that is not just a grammatical gloss like "(the)-master"
  const clean = glossEn.replace(/[()\-]/g, " ").trim();
  return /^[A-Z][a-z]{2,}/.test(clean) && !stem.startsWith("ال");
}

function classifyStem(
  stem: string,
  skel: string,
  existingLemma: { id: string; arabic: string } | null,
  existingMapping: MasaqRow | null,
  lemmaMappingStatus: string | null,
  posObserved: string[],
  glossEn: string | null,
): LemmaCandidate["classification"] {
  // Already has a Hikma lemma_id → verify alignment
  if (existingMapping?.hikma_lemma_id) {
    if (existingLemma) {
      if (lemmaMappingStatus === "EXACT") return "SAFE";
      if (lemmaMappingStatus === "NORMALIZATION_DIFFERENCE") return "NORMALIZATION_REVIEW";
      if (lemmaMappingStatus === "PARTIAL") return "PARTIAL_REVIEW";
      if (lemmaMappingStatus === "LEXICAL_LEVEL_DIFFERENCE") return "LEXICAL_REVIEW";
      return "SAFE"; // mapped but status unknown → conservatively SAFE
    }
    // Has hikma_lemma_id but the lemma is not in our lemma table → CONFLICT
    return "CONFLICT";
  }

  // UNMAPPED — check if the stem collides with an existing Hikma lemma
  if (existingLemma) {
    // Stem skeleton matches existing lemma skeleton → DUPLICATE (should be mapped)
    return "DUPLICATE";
  }

  // UNMAPPED, no existing lemma — check if it's a function word
  if (isFunctionWord(stem)) return "UNRESOLVED";

  // Check POS for morphological plausibility
  const hasLexicalPos = posObserved.some(p =>
    p.startsWith("NOUN") || p.startsWith("VERB") || p.startsWith("ADJ"));
  const isOnlyParticle = posObserved.length > 0 && posObserved.every(p =>
    p.startsWith("PREP") || p.startsWith("CONJ") || p.startsWith("PART") || p === "INVARIABLE");

  if (isOnlyParticle && posObserved.length <= 2) return "UNRESOLVED";

  // Proper noun check
  if (isLikelyProperNoun(glossEn, stem)) return "PARTIAL_REVIEW";

  // Lexical word → SAFE candidate
  if (hasLexicalPos) return "SAFE";

  return "PARTIAL_REVIEW";
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log("=== PHASE 88E-A — LEMMA INFRASTRUCTURE BUILD (READ-ONLY) ===\n");

  // ─── 0. Load all reference data ───────────────────────────────────────────
  console.log("→ Loading reference data…");

  const lemmaRows = await selectAll<{ id: string; arabic: string }>(client, "lemmas", "id, arabic");
  console.log(`  lemmas Hikma : ${lemmaRows.length}`);

  const wlmRows = await selectAll<{ word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "word_id, lemma_id");
  console.log(`  word_lemma_mapping : ${wlmRows.length}`);

  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null; meaning: string | null }>(client, "quran_words", "id, arabic, lemma_id, meaning");
  console.log(`  quran_words : ${wordRows.length}`);

  const occRows = await selectAll<{ word_id: string; ayah_id: string }>(client, "word_occurrences", "word_id, ayah_id");
  console.log(`  occurrences : ${occRows.length}`);

  const ayahRows = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");
  const ayahToSurah = new Map(ayahRows.map(a => [a.id, a.surah_id]));
  const surahRows = await selectAll<{ id: string; number: number }>(client, "surahs", "id, number");
  const surahNumById = new Map(surahRows.map(s => [s.id, s.number]));

  // Build lookup maps
  const wordById = new Map(wordRows.map(w => [w.id, w]));
  const lemmaBySkeleton = new Map(lemmaRows.map(l => [skeleton(l.arabic), l]));
  const wlmByWordId = new Map(wlmRows.map(m => [m.word_id, m.lemma_id]));

  // Existing effective mapping (direct lemma_id + WLM)
  const existingMapping = new Map<string, string>();
  for (const w of wordRows) {
    if (w.lemma_id) existingMapping.set(w.id, w.lemma_id);
  }
  for (const m of wlmRows) {
    if (!existingMapping.has(m.word_id)) existingMapping.set(m.word_id, m.lemma_id);
  }

  // ─── 1. Load MASAQ data ───────────────────────────────────────────────────
  console.log("\n→ Loading MASAQ linguistic_occurrences (paginated)…");

  const masaqRows = await selectAll<MasaqRow>(
    client,
    "linguistic_occurrences",
    "id, word_occurrence_id, surah_number, ayah_number, masaq_word, masaq_stem, masaq_gloss_en, hikma_lemma_id, lemma_mapping_status, pos, case_mood"
  );
  console.log(`  linguistic_occurrences : ${masaqRows.length}`);

  // Surah coverage
  const masaqSurahs = new Set(masaqRows.map(r => r.surah_number));
  const missingSurahs: number[] = [];
  for (let i = 1; i <= 114; i++) {
    if (!masaqSurahs.has(i)) missingSurahs.push(i);
  }
  console.log(`  MASAQ surahs : ${masaqSurahs.size} / 114`);
  console.log(`  Missing      : ${missingSurahs.length}`);

  // ─── 2. Build occurrence→word mapping via word_occurrences ────────────────
  // word_occurrence_id → word_id (need to load occurrences table)
  const occById = new Map<string, string>();
  const { data: occFull } = await client.from("word_occurrences").select("id, word_id");
  for (const o of (occFull ?? []) as Array<{ id: string; word_id: string }>) {
    occById.set(o.id, o.word_id);
  }

  // ─── 3. Group MASAQ rows by masaq_stem ────────────────────────────────────
  console.log("\n→ Grouping by masaq_stem…");

  const stemGroups = new Map<string, {
    masaqRows: MasaqRow[];
    surahs: Set<number>;
    ayahs: Set<string>;
    wordIds: Set<string>;
    formArabicSet: Set<string>;
    posSet: Set<string>;
    glossEns: Set<string>;
    mappingStatuses: Set<string>;
    hikmaLemmaIds: Set<string>;
  }>();

  for (const r of masaqRows) {
    let g = stemGroups.get(r.masaq_stem);
    if (!g) {
      g = {
        masaqRows: [],
        surahs: new Set(),
        ayahs: new Set(),
        wordIds: new Set(),
        formArabicSet: new Set(),
        posSet: new Set(),
        glossEns: new Set(),
        mappingStatuses: new Set(),
        hikmaLemmaIds: new Set(),
      };
      stemGroups.set(r.masaq_stem, g);
    }
    g.masaqRows.push(r);
    g.surahs.add(r.surah_number);
    g.ayahs.add(`${r.surah_number}:${r.ayah_number}`);
    const wordId = occById.get(r.word_occurrence_id);
    if (wordId) g.wordIds.add(wordId);
    g.formArabicSet.add(r.masaq_word);
    if (r.pos) for (const p of r.pos) g.posSet.add(p);
    if (r.masaq_gloss_en) g.glossEns.add(r.masaq_gloss_en);
    g.mappingStatuses.add(r.lemma_mapping_status);
    if (r.hikma_lemma_id) g.hikmaLemmaIds.add(r.hikma_lemma_id);
  }

  console.log(`  Distinct stems : ${stemGroups.size}`);

  // ─── 4. Classify each stem ────────────────────────────────────────────────
  console.log("\n→ Classifying stems…");

  const candidates: LemmaCandidate[] = [];
  const skelToStem = new Map<string, string[]>(); // skeleton → [stem1, stem2…]

  for (const [stem, g] of stemGroups) {
    const skel = skeleton(stem);
    const existingLemma = lemmaBySkeleton.get(skel) ?? null;

    // Check for existing mapping (any MASAQ row with hikma_lemma_id)
    const mappedRow = g.masaqRows.find(r => r.hikma_lemma_id !== null);
    const primaryStatus = [...g.mappingStatuses][0] ?? null;

    // Classification
    const allUnmapped = [...g.mappingStatuses].every(s => s === "UNMAPPED" || s === "");
    const classification = classifyStem(
      stem, skel, existingLemma,
      mappedRow ?? null, primaryStatus,
      [...g.posSet],
      [...g.glossEns][0] ?? null,
    );

    // Build candidate
    const candidate: LemmaCandidate = {
      masaqStem: stem,
      stemSkeleton: skel,
      normalized: normalizeWordText(stem),
      occurrenceCount: g.masaqRows.length,
      distinctSurahs: g.surahs.size,
      distinctForms: g.formArabicSet.size,
      distinctAyahs: g.ayahs.size,
      posObserved: [...g.posSet],
      glossEnSamples: [...g.glossEns].slice(0, 5),
      alreadyMapped: !allUnmapped,
      existingHikmaLemmaId: existingLemma?.id ?? null,
      existingHikmaLemmaArabic: existingLemma?.arabic ?? null,
      existingHikmaLemmaSkel: existingLemma ? skeleton(existingLemma.arabic) : null,
      classification,
      evidence: [],
      distinctFormIds: [...g.wordIds],
      distinctWordIds: [...g.wordIds],
      formArabicSamples: [...g.formArabicSet].slice(0, 8),
    };

    // Add evidence
    if (existingLemma) candidate.evidence.push(`skeleton match with existing lemma « ${existingLemma.arabic} »`);
    if (g.hikmaLemmaIds.size > 0) candidate.evidence.push(`already mapped to Hikma lemma via ${[...g.mappingStatuses].join(", ")}`);
    if (!allUnmapped) candidate.evidence.push(`MASAQ status: ${[...g.mappingStatuses].join(", ")}`);
    if (g.glossEns.size > 0) candidate.evidence.push(`EN gloss samples: ${[...g.glossEns].slice(0, 3).join(" / ")}`);

    candidates.push(candidate);

    // Track skeletons for dedup
    const stems = skelToStem.get(skel) ?? [];
    stems.push(stem);
    skelToStem.set(skel, stems);
  }

  // ─── 5. Deduplication report ──────────────────────────────────────────────
  console.log("\n→ Deduplication…");

  let safeCount = 0;
  let normReviewCount = 0;
  let partReviewCount = 0;
  let lexReviewCount = 0;
  let conflictCount = 0;
  let duplicateCount = 0;
  let unresolvedCount = 0;

  for (const c of candidates) {
    switch (c.classification) {
      case "SAFE": safeCount++; break;
      case "NORMALIZATION_REVIEW": normReviewCount++; break;
      case "PARTIAL_REVIEW": partReviewCount++; break;
      case "LEXICAL_REVIEW": lexReviewCount++; break;
      case "CONFLICT": conflictCount++; break;
      case "DUPLICATE": duplicateCount++; break;
      case "UNRESOLVED": unresolvedCount++; break;
    }
  }

  // Mark multi-stem skeletons as DUPLICATE if already mapped
  const multiStemSkeletons = [...skelToStem].filter(([, s]) => s.length > 1);
  console.log(`  Multi-stem skeletons : ${multiStemSkeletons.length}`);

  for (const [skel] of multiStemSkeletons) {
    const stemCandidates = candidates.filter(c => c.stemSkeleton === skel);
    const alreadyMappedIdx = stemCandidates.findIndex(c => c.alreadyMapped);
    if (alreadyMappedIdx >= 0) {
      // Mark unmapped duplicates
      for (let i = 0; i < stemCandidates.length; i++) {
        if (i !== alreadyMappedIdx && stemCandidates[i].classification === "SAFE") {
          stemCandidates[i].classification = "DUPLICATE";
          stemCandidates[i].evidence.push(`skeleton duplicate of already-mapped stem « ${stemCandidates[alreadyMappedIdx].masaqStem} »`);
          safeCount--;
          duplicateCount++;
        }
      }
    }
  }

  console.log("\n─── CLASSIFICATION ───");
  console.log(`  SAFE                  : ${safeCount}`);
  console.log(`  NORMALIZATION_REVIEW  : ${normReviewCount}`);
  console.log(`  PARTIAL_REVIEW        : ${partReviewCount}`);
  console.log(`  LEXICAL_REVIEW        : ${lexReviewCount}`);
  console.log(`  CONFLICT              : ${conflictCount}`);
  console.log(`  DUPLICATE             : ${duplicateCount}`);
  console.log(`  UNRESOLVED            : ${unresolvedCount}`);

  // ─── 6. Build word→lemma mapping candidates ───────────────────────────────
  console.log("\n→ Building word→lemma mapping candidates…");

  const mappingCandidates: WordMappingCandidate[] = [];
  const safes = candidates.filter(c => c.classification === "SAFE");

  // Count distinct word_ids that would be newly mapped
  const newlyMappedWordIds = new Set<string>();

  for (const c of safes) {
    for (const wid of c.distinctFormIds) {
      if (existingMapping.has(wid)) continue; // already mapped — skip
      newlyMappedWordIds.add(wid);
      mappingCandidates.push({
        wordId: wid,
        formArabic: wordById.get(wid)?.arabic ?? "?",
        masaqStem: c.masaqStem,
        lemmaCandidateSkeleton: c.stemSkeleton,
        existingLemmaId: null,
        existingWlmMapping: wlmByWordId.has(wid),
        classification: "SAFE",
        confidence: "safe",
        surahCount: c.distinctSurahs,
        occurrenceCount: c.occurrenceCount,
      });
    }
  }

  console.log(`  New mapping candidates : ${mappingCandidates.length}`);
  console.log(`  Distinct word_ids      : ${newlyMappedWordIds.size}`);

  // ─── 7. Simulation ────────────────────────────────────────────────────────
  console.log("\n─── SIMULATION ───");

  const beforeMapped = existingMapping.size;
  const afterMapped = beforeMapped + newlyMappedWordIds.size;
  const totalForms = wordRows.length;

  console.log(`  Formes avec mapping avant : ${beforeMapped} (${Math.round(beforeMapped / totalForms * 100)}%)`);
  console.log(`  Formes avec mapping après : ${afterMapped} (${Math.round(afterMapped / totalForms * 100)}%)`);
  console.log(`  Gain                      : +${newlyMappedWordIds.size}`);

  // New lemmas needed
  const newLemmaSkeletons = new Set(safes.filter(c => !c.existingHikmaLemmaId).map(c => c.stemSkeleton));
  console.log(`  Nouveaux lemmas requis    : ${newLemmaSkeletons.size}`);
  console.log(`  Lemmas existants réutilisés : ${safes.filter(c => c.existingHikmaLemmaId).length}`);

  // ─── 8. Surahs impacted ───────────────────────────────────────────────────
  console.log("\n─── SURAH IMPACT ───");

  // Count affected surahs (from MASAQ data)
  const affectedSurahs = new Set<number>();
  for (const c of safes) {
    for (const sn of c.distinctFormIds) {
      // Get surahs for each word_id from occurrences
      for (const o of occRows) {
        if (o.word_id === sn) {
          const surahId = ayahToSurah.get(o.ayah_id);
          const snum = surahId ? surahNumById.get(surahId) : undefined;
          if (snum !== undefined) affectedSurahs.add(snum);
        }
      }
    }
  }

  console.log(`  Surahs with new mappings : ${affectedSurahs.size}`);

  // ─── 9. MASAQ coverage gaps ───────────────────────────────────────────────
  console.log("\n─── MASAQ COVERAGE ───");
  console.log(`  Covered : ${masaqSurahs.size} surahs`);
  console.log(`  Missing : ${missingSurahs.length} surahs`);

  if (missingSurahs.length <= 40) {
    // Group consecutive
    const groups: string[] = [];
    let start = missingSurahs[0];
    let end = missingSurahs[0];
    for (let i = 1; i < missingSurahs.length; i++) {
      if (missingSurahs[i] === end + 1) {
        end = missingSurahs[i];
      } else {
        groups.push(start === end ? `${start}` : `${start}-${end}`);
        start = missingSurahs[i];
        end = missingSurahs[i];
      }
    }
    groups.push(start === end ? `${start}` : `${start}-${end}`);
    console.log(`  Missing ranges : ${groups.join(", ")}`);
  }

  // ─── 10. Top SAFE candidates ──────────────────────────────────────────────
  console.log("\n─── TOP 30 SAFE CANDIDATES ───");
  const topSafe = safes
    .sort((a, b) => b.distinctSurahs - a.distinctSurahs || b.occurrenceCount - a.occurrenceCount)
    .slice(0, 30);

  console.log(`  Stem (arabic)            │ Surahs │ Occs │ Forms │ New lemma? │ Existing lemma`);
  console.log(`  ─────────────────────────┼────────┼──────┼───────┼────────────┼──────────────`);
  for (const c of topSafe) {
    const stem = c.masaqStem.padEnd(24).slice(0, 24);
    const newLemma = c.existingHikmaLemmaId ? "  (exists)" : "→ CREATE";
    const existing = c.existingHikmaLemmaArabic ?? "—";
    console.log(`  ${stem} │ ${String(c.distinctSurahs).padStart(5)}  │ ${String(c.occurrenceCount).padStart(4)} │ ${String(c.distinctForms).padStart(4)}  │ ${newLemma.padEnd(10)} │ ${existing}`);
  }

  // ─── 11. CONFLICTS ────────────────────────────────────────────────────────
  const conflicts = candidates.filter(c => c.classification === "CONFLICT");
  if (conflicts.length > 0) {
    console.log(`\n─── CONFLICTS (${conflicts.length}) ───`);
    for (const c of conflicts.slice(0, 10)) {
      console.log(`  ${c.masaqStem.padEnd(25)} | hikma_lemma_id exists but lemma not found`);
    }
  }

  // ─── 12. UNRESOLVED ───────────────────────────────────────────────────────
  console.log(`\n─── UNRESOLVED (${unresolvedCount}) ───`);
  if (unresolvedCount > 0) {
    console.log("  (function words, particles, proper nouns without clear lemma)");
    const unresolved = candidates.filter(c => c.classification === "UNRESOLVED");
    for (const c of unresolved.slice(0, 10)) {
      const pos = c.posObserved.join(", ").slice(0, 40);
      console.log(`  ${c.masaqStem.padEnd(25)} | POS: ${pos}`);
    }
  }

  // ─── 13. JSON Report ──────────────────────────────────────────────────────
  const report = {
    phase: "88E-A",
    mode: "READ_ONLY_SIMULATION",
    timestamp: new Date().toISOString(),
    snapshot: {
      quranWords: wordRows.length,
      occurrences: occRows.length,
      lemmasExisting: lemmaRows.length,
      wlmExisting: wlmRows.length,
      masaqRows: masaqRows.length,
      masaqSurahs: masaqSurahs.size,
      masaqMissingSurahs: missingSurahs,
    },
    classification: {
      safe: safeCount,
      normalizationReview: normReviewCount,
      partialReview: partReviewCount,
      lexicalReview: lexReviewCount,
      conflict: conflictCount,
      duplicate: duplicateCount,
      unresolved: unresolvedCount,
      newLemmaSkeletonsRequired: newLemmaSkeletons.size,
    },
    simulation: {
      formsWithMappingBefore: beforeMapped,
      formsWithMappingAfter: afterMapped,
      newMappingsCount: newlyMappedWordIds.size,
      affectedSurahs: affectedSurahs.size,
      distinctMappingCandidates: mappingCandidates.length,
    },
    topSafeCandidates: topSafe.map(c => ({
      masaqStem: c.masaqStem,
      stemSkeleton: c.stemSkeleton,
      distinctSurahs: c.distinctSurahs,
      occurrenceCount: c.occurrenceCount,
      distinctForms: c.distinctForms,
      existingHikmaLemmaId: c.existingHikmaLemmaId,
      existingHikmaLemmaArabic: c.existingHikmaLemmaArabic,
      posObserved: c.posObserved,
      glossEnSamples: c.glossEnSamples,
      formArabicSamples: c.formArabicSamples,
    })),
    conflicts: conflicts.slice(0, 20).map(c => ({
      masaqStem: c.masaqStem,
      hikmaLemmaIds: [...new Set(c.evidence)],
    })),
    unresolvedSample: candidates.filter(c => c.classification === "UNRESOLVED").slice(0, 30).map(c => ({
      masaqStem: c.masaqStem,
      posObserved: c.posObserved,
      occurrenceCount: c.occurrenceCount,
    })),
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/phase-88e-lemma-infrastructure-proposals.json", JSON.stringify(report, null, 2) + "\n");
  console.log(`\n  Rapport → reports/phase-88e-lemma-infrastructure-proposals.json`);

  console.log(`\n=== PHASE 88E-A — TERMINÉ (0 écriture DB) ===`);
}

main().catch(err => {
  console.error("Phase 88E-A échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});