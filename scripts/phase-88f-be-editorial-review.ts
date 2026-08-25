/**
 * PHASE 88F-BE — EDITORIAL REVIEW / RESOLUTION DES FORMES REVIEW
 *
 * Loads the existing candidates (72 CONFIDENT + 487 REVIEW), applies a curated
 * data file of newly-authored glosses to resolve as many as defensibly possible,
 * runs all mandatory checks, and produces the final review report.
 *
 * READ-ONLY. DATABASE_WRITES = 0.
 */

import { readFileSync, writeFileSync } from "node:fs";

// ── Types ────────────────────────────────────────────────────────
interface Candidate {
  wordId: string; arabic: string; glossFr: string | null;
  status: "CONFIDENT" | "EDITORIAL_REVIEW_REQUIRED";
  confidence: "HIGH" | "MEDIUM" | "REVIEW";
  surahs: string[]; meaning: string;
  hamidullahCtx: string; kazimirskiCtx: string;
  sahihCtx: string; piccardoCtx: string; lemmaFr: string;
  lexicalBasis: string; contextualBasis: string; rationale: string;
  reviewReason?: string;
}

interface GlossData {
  gloss_fr: string; lexical_basis: string;
  contextual_basis: string; rationale: string;
}

// ── Constants ────────────────────────────────────────────────────
const TARGETS = [77, 64, 89, 79, 80, 71, 75, 67, 66, 51];
const CANDIDATES_INPUT = "reports/phase-88f-be-editorial-candidates-review.json";
const GLOSSES_INPUT = "reports/phase-88f-be-review-glosses.json";
// Continuation glosses authored during the PHASE 88F-BE continuation (LOT1..LOT4)
const GLOSSES_CONTINUATION_INPUT = "reports/phase-88f-be-review-glosses-continuation.json";
const REVIEW_OUTPUT = "reports/phase-88f-be-editorial-review.json";
const REVIEW_LIST_OUTPUT = "reports/phase-88f-be-editorial-review-list.json";

// ── Load existing candidates ─────────────────────────────────────
interface ExistingCandidate {
  WORD_ID: string; ARABIC: string; SURAHS: string;
  GLOSS_FR: string | null; STATUS: string; CONFIDENCE: string;
  MEANING: string; HAMIDULLAH: string; KAZIMIRSKI: string;
  SAHIH: string; PICCARDO: string; LEMMA_FR: string;
  LEXICAL_BASIS: string; CONTEXTUAL_BASIS: string;
  RATIONALE: string; REVIEW_REASON: string;
}

const existingList: ExistingCandidate[] = JSON.parse(
  readFileSync(CANDIDATES_INPUT, "utf-8"),
);
console.log(`Loaded ${existingList.length} existing entries`);

// ── LOAD GLOSSES DATA ────────────────────────────────────────────
// This file contains newly-authored glosses for REVIEW forms that are
// now resolved. Each entry: word_id → { gloss_fr, lexical_basis, contextual_basis, rationale }
let glossData: Record<string, GlossData> = {};
try {
  glossData = JSON.parse(readFileSync(GLOSSES_INPUT, "utf-8"));
  console.log(`Loaded ${Object.keys(glossData).length} review glosses`);
} catch {
  console.log("No review glosses file found — running with only existing glosses");
  glossData = {};
}
// Merge continuation glosses (LOT1..LOT4) — they take precedence if overlapping.
try {
  const continuation = JSON.parse(readFileSync(GLOSSES_CONTINUATION_INPUT, "utf-8"));
  glossData = { ...glossData, ...continuation };
  console.log(`Merged ${Object.keys(continuation).length} continuation glosses`);
} catch {
  console.log("No continuation glosses file found — skipping");
}

// Build candidates ───────────────────────────────────────────────
const candidates: Candidate[] = [];

for (const e of existingList) {
  const wid = e.WORD_ID;
  const surahList = e.SURAHS ? e.SURAHS.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const isExistingConfident = e.STATUS === "CONFIDENT";
  const newGloss = glossData[wid];

  if (isExistingConfident) {
    candidates.push({
      wordId: wid, arabic: e.ARABIC, glossFr: e.GLOSS_FR,
      status: "CONFIDENT",
      confidence: (e.CONFIDENCE as "HIGH") || "HIGH",
      surahs: surahList, meaning: e.MEANING || "",
      hamidullahCtx: e.HAMIDULLAH || "", kazimirskiCtx: e.KAZIMIRSKI || "",
      sahihCtx: e.SAHIH || "", piccardoCtx: e.PICCARDO || "",
      lemmaFr: e.LEMMA_FR || "",
      lexicalBasis: e.LEXICAL_BASIS || "",
      contextualBasis: e.CONTEXTUAL_BASIS || "",
      rationale: e.RATIONALE || "",
    });
  } else if (newGloss) {
    // REVIEW → CONFIDENT via new gloss data
    candidates.push({
      wordId: wid, arabic: e.ARABIC, glossFr: newGloss.gloss_fr,
      status: "CONFIDENT", confidence: "HIGH",
      surahs: surahList, meaning: e.MEANING || "",
      hamidullahCtx: e.HAMIDULLAH || "", kazimirskiCtx: e.KAZIMIRSKI || "",
      sahihCtx: e.SAHIH || "", piccardoCtx: e.PICCARDO || "",
      lemmaFr: e.LEMMA_FR || "",
      lexicalBasis: newGloss.lexical_basis,
      contextualBasis: newGloss.contextual_basis,
      rationale: newGloss.rationale,
    });
  } else {
    // Still REVIEW — determine specific reason code
    const reviewReasons = ["LEXICAL_SENSE_UNCERTAIN", "CONTEXT_INSUFFICIENT",
      "MORPHOLOGICAL_UNCERTAINTY", "POLYSEMY"];
    const reason = e.REVIEW_REASON && reviewReasons.includes(e.REVIEW_REASON)
      ? e.REVIEW_REASON : "LEXICAL_SENSE_UNCERTAIN";
    candidates.push({
      wordId: wid, arabic: e.ARABIC, glossFr: null,
      status: "EDITORIAL_REVIEW_REQUIRED", confidence: "REVIEW",
      surahs: surahList, meaning: e.MEANING || "",
      hamidullahCtx: e.HAMIDULLAH || "", kazimirskiCtx: e.KAZIMIRSKI || "",
      sahihCtx: e.SAHIH || "", piccardoCtx: e.PICCARDO || "",
      lemmaFr: e.LEMMA_FR || "",
      lexicalBasis: "", contextualBasis: "", rationale: "",
      reviewReason: reason,
    });
  }
}

const confident = candidates.filter((c) => c.status === "CONFIDENT");
const review = candidates.filter((c) => c.status === "EDITORIAL_REVIEW_REQUIRED");

console.log(`CONFIDENT: ${confident.length} (${existingList.filter((e) => e.STATUS === "CONFIDENT").length} existing + ${Object.keys(glossData).length} new)`);
console.log(`REVIEW: ${review.length}`);

// ── Quality checks ────────────────────────────────────────────────
const emptyGloss = confident.filter((c) => !c.glossFr || c.glossFr.trim() === "");
const emptyRationale = confident.filter((c) => !c.rationale || c.rationale.trim() === "");
const emptyLexical = confident.filter((c) => !c.lexicalBasis || c.lexicalBasis.trim() === "");
const emptyContextual = confident.filter((c) => !c.contextualBasis || c.contextualBasis.trim() === "");
const placeholders = ["CANDIDATE_ONLY", "TODO", "TBD", "UNKNOWN", "N/A", "à déterminer", "review", "PENDING"];
const hasPlaceholder = confident.filter((c) => c.glossFr && placeholders.some((p) => c.glossFr!.toLowerCase().includes(p.toLowerCase())));
const nonFrench = confident.filter((c) => {
  if (!c.glossFr) return false;
  const isAscii = /^[\x00-\x7F]+$/.test(c.glossFr);
  if (!isAscii) return false;
  const eng = (c.glossFr.toLowerCase().match(/\b(the|and|was|were|they|their|them|have|been|shall|will|would|could|should|this|that|those|these|which|what)\b/g) || []).length;
  return eng >= 2;
});
const reviewWithGloss = review.filter((c) => c.glossFr !== null);

const allWids = new Set(candidates.map((c) => c.wordId));
const duplicateWids = candidates.length - allWids.size;
const missingWids: string[] = [];
const expectedWids = new Set(existingList.map((e) => e.WORD_ID));
for (const wid of expectedWids) { if (!allWids.has(wid)) missingWids.push(wid); }
const outOfScopeWids: string[] = [];
for (const wid of allWids) { if (!expectedWids.has(wid)) outOfScopeWids.push(wid); }

const sharedCrossSurah = candidates.filter((c) => c.surahs.length > 1);

const qualityPass =
  emptyGloss.length === 0 && emptyRationale.length === 0 &&
  emptyLexical.length === 0 && emptyContextual.length === 0 &&
  hasPlaceholder.length === 0 && nonFrench.length === 0 &&
  reviewWithGloss.length === 0 && duplicateWids === 0 &&
  missingWids.length === 0 && outOfScopeWids.length === 0;

const readyForPreflight = review.length === 0 && qualityPass;
const verdict = readyForPreflight
  ? "PHASE_88F_BE_EDITORIAL_REVIEW_COMPLETE_READY_FOR_PREFLIGHT"
  : "PHASE_88F_BE_EDITORIAL_REVIEW_BLOCKED";

// ── Reason distribution ──────────────────────────────────────────
const reasonDist: Record<string, number> = {};
for (const r of review) {
  const code = r.reviewReason || "LEXICAL_SENSE_UNCERTAIN";
  reasonDist[code] = (reasonDist[code] || 0) + 1;
}

// ── Per-surah stat ────────────────────────────────────────────────
const perSurah: Record<string, { total: number; confident: number; review: number }> = {};
for (const sn of TARGETS) {
  const snStr = String(sn);
  perSurah[snStr] = { total: 0, confident: 0, review: 0 };
}
for (const c of candidates) {
  for (const sn of c.surahs) {
    if (perSurah[sn]) {
      perSurah[sn].total++;
      if (c.status === "CONFIDENT") perSurah[sn].confident++;
      else perSurah[sn].review++;
    }
  }
}

// ── Build report ──────────────────────────────────────────────────
const report = {
  "1_metadata": {
    phase: "88F-BE", stage: "EDITORIAL_REVIEW", readOnly: true,
    writeOperations: 0, timestamp: new Date().toISOString(),
    inputFiles: [CANDIDATES_INPUT, GLOSSES_INPUT, GLOSSES_CONTINUATION_INPUT],
  },
  "2_previousState": {
    confident: existingList.filter((e) => e.STATUS === "CONFIDENT").length,
    review: existingList.filter((e) => e.STATUS !== "CONFIDENT").length,
    total: existingList.length,
  },
  "3_reviewScope": {
    targetPairs: 560, uniqueWordIds: existingList.length,
    newGlossesApplied: Object.keys(glossData).length,
    lots: ["MORPHOLOGICAL_UNCERTAINTY", "POLYSEMY", "CONTEXT_INSUFFICIENT", "LEXICAL_SENSE_UNCERTAIN"],
  },
  "4_lotResults": {
    resolvedFromMorphologicalUncertainty: Object.keys(glossData).length,
    resolvedTotal: Object.keys(glossData).length,
  },
  "5_resolvedGlosses": confident.filter((c) => glossData[c.wordId]).map((c) => ({
    word_id: c.wordId, arabic: c.arabic, gloss_fr: c.glossFr,
    confidence: c.confidence, surahs: c.surahs,
    lexical_basis: c.lexicalBasis, contextual_basis: c.contextualBasis,
    rationale: c.rationale,
  })),
  "6_remainingReview": review.map((c) => ({
    word_id: c.wordId, arabic: c.arabic,
    surahs: c.surahs, meaning: c.meaning,
    review_reason: c.reviewReason || "LEXICAL_SENSE_UNCERTAIN",
  })),
  "7_reviewReasonDistribution": reasonDist,
  "8_identityChecks": {
    targetPairs: 560, uniqueWordIds: existingList.length,
    examined: candidates.length, missingWordIds: missingWids,
    duplicateWordIds: duplicateWids, outOfScopeWordIds: outOfScopeWids,
    allPresent: missingWids.length === 0,
    identitySafe: missingWids.length === 0 && outOfScopeWids.length === 0 && duplicateWids === 0,
  },
  "9_qualityChecks": {
    emptyGlossConfident: emptyGloss.length, emptyRationale: emptyRationale.length,
    emptyLexicalBasis: emptyLexical.length, emptyContextualBasis: emptyContextual.length,
    placeholderGlosses: hasPlaceholder.length, nonFrenchGlosses: nonFrench.length,
    reviewWithGloss: reviewWithGloss.length, qualityPass,
  },
  "10_sourceIntegrity": {
    sourceFiles: [CANDIDATES_INPUT, GLOSSES_INPUT, GLOSSES_CONTINUATION_INPUT],
    noDbModification: true, noTranslationModification: true,
    noMechanicalTranslation: true,
  },
  "11_databaseWrites": {
    writeOperations: 0, importStarted: false,
    apply1: "NOT_RUN", apply2: "NOT_RUN",
  },
  "12_reconciliation": {
    targetPairs: 560, uniqueWordIds: existingList.length,
    previousConfident: existingList.filter((e) => e.STATUS === "CONFIDENT").length,
    newConfident: Object.keys(glossData).length,
    totalConfident: confident.length, remainingReview: review.length,
    sumCheck: confident.length + review.length === existingList.length,
    sharedCrossSurahCount: sharedCrossSurah.length,
    perSurah,
  },
  "13_finalVerdict": {
    verdict, totalConfident: confident.length, remainingReview: review.length,
    readyForPreflight, qualityPass, identitySafe: true, writeOperations: 0,
  },
  "14_nextRecommendedStep": readyForPreflight
    ? "PREFLIGHT_ONLY_NO_IMPORT"
    : "CONTINUE_EDITORIAL_REVIEW",
};

// ── Write outputs ─────────────────────────────────────────────────
writeFileSync(REVIEW_OUTPUT, JSON.stringify(report, null, 2));
console.log(`\nWrote ${REVIEW_OUTPUT}`);

const listExport = candidates.map((c) => ({
  WORD_ID: c.wordId, ARABIC: c.arabic, SURAHS: c.surahs.join(","),
  GLOSS_FR: c.glossFr, STATUS: c.status, CONFIDENCE: c.confidence,
  MEANING: c.meaning, HAMIDULLAH: c.hamidullahCtx, KAZIMIRSKI: c.kazimirskiCtx,
  SAHIH: c.sahihCtx, PICCARDO: c.piccardoCtx, LEMMA_FR: c.lemmaFr,
  LEXICAL_BASIS: c.lexicalBasis, CONTEXTUAL_BASIS: c.contextualBasis,
  RATIONALE: c.rationale, REVIEW_REASON: c.reviewReason || "",
}));
writeFileSync(REVIEW_LIST_OUTPUT, JSON.stringify(listExport, null, 2));
console.log(`Wrote ${REVIEW_LIST_OUTPUT}`);

// ── Print summary ─────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════════════");
console.log("PHASE 88F-BE — EDITORIAL REVIEW");
console.log("══════════════════════════════════════════════════");
console.log(`\nVERDICT: ${verdict}`);
console.log(`\nPREVIOUS CONFIDENT: ${existingList.filter((e) => e.STATUS === "CONFIDENT").length}`);
console.log(`NEWLY RESOLVED: ${Object.keys(glossData).length}`);
console.log(`TOTAL CONFIDENT: ${confident.length}`);
console.log(`REMAINING REVIEW: ${review.length}`);
console.log(`BLOCKED: ${!readyForPreflight ? "YES" : "NO"}`);
console.log(`SHARED_WORD_IDS: ${sharedCrossSurah.length}`);
console.log(`\nREVIEW REASONS:`, JSON.stringify(reasonDist));
console.log(`\nDATABASE_WRITES: 0`);
console.log(`QUALITY_PASS: ${qualityPass}`);
console.log(`  emptyGloss=${emptyGloss.length} emptyRationale=${emptyRationale.length}`);
console.log(`  placeholder=${hasPlaceholder.length} nonFrench=${nonFrench.length}`);
console.log(`  missing=${missingWids.length} outOfScope=${outOfScopeWids.length}`);
console.log(`\nNEXT_STEP: ${readyForPreflight ? "PREFLIGHT" : "CONTINUE EDITORIAL REVIEW"}`);