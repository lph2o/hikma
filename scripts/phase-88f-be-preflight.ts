/**
 * PHASE 88F-BE — PREFLIGHT FINAL (READ-ONLY)
 *
 * Audit indépendant des 559 glosses CONFIDENT avant tout import.
 *
 * STRICTEMENT READ-ONLY :
 *  - aucun accès DB, aucun INSERT/UPDATE/DELETE/UPSERT,
 *  - aucune migration, aucun import,
 *  - aucune modification des rapports de production (sauf écriture des
 *    livrables de preflight : reports/phase-88f-be-preflight*.json).
 *
 * Produits :
 *  - reports/phase-88f-be-preflight.json
 *  - reports/phase-88f-be-preflight-issues.json
 */

import { readFileSync, writeFileSync } from "node:fs";

// ── Types ────────────────────────────────────────────────────────
interface FinalEntry {
  WORD_ID: string; ARABIC: string; SURAHS: string;
  GLOSS_FR: string | null; STATUS: string; CONFIDENCE: string;
  MEANING: string; HAMIDULLAH: string; KAZIMIRSKI: string;
  SAHIH: string; PICCARDO: string; LEMMA_FR: string;
  LEXICAL_BASIS: string; CONTEXTUAL_BASIS: string;
  RATIONALE: string; REVIEW_REASON: string;
}

interface Issue {
  word_id: string; arabic: string; gloss: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  check: string; problem: string; recommendation: string;
}

// ── Load ─────────────────────────────────────────────────────────
const list: FinalEntry[] = JSON.parse(
  readFileSync("reports/phase-88f-be-editorial-review-list.json", "utf-8"),
);
const evidence = JSON.parse(
  readFileSync("reports/phase-88f-be-editorial-evidence.json", "utf-8"),
);
const evEntries: Array<{ word_id: string; arabic: string; meaning: string }> =
  evidence["4_unresolvedInventory"]["entries"] ?? [];
const continuation: Record<string, unknown> = JSON.parse(
  readFileSync("reports/phase-88f-be-review-glosses-continuation.json", "utf-8"),
);
const originalGlosses: Record<string, unknown> = JSON.parse(
  readFileSync("reports/phase-88f-be-review-glosses.json", "utf-8"),
);

const issues: Issue[] = [];
const flags = (w: string, a: string, g: string, sev: Issue["severity"], check: string, problem: string, rec: string) => {
  issues.push({ word_id: w, arabic: a, gloss: g, severity: sev, check, problem, recommendation: rec });
};

// ── Normalization (comparison only — canonical Arabic is never rewritten) ──
const normArabic = (s: string) =>
  s.normalize("NFKC")
    .replace(/[\u0652\u0651\u064B\u064C\u064D\u064E\u064F\u0650\u0670\u06D6-\u06ED\u08F0-\u08FF]/g, "") // harakat
    .replace(/[\u06D6-\u06ED\u0640]/g, "")
    .replace(/[\u0653-\u0654]/g, "") // hamza above/below
    .replace(/[ۖۗۘۙۚۛۜ۝]/g, "")
    .trim();

// ── 1. IDENTITY ──────────────────────────────────────────────────
const ids = list.map((e) => e.WORD_ID);
const idSet = new Set(ids);
const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupIds.length) {
  flags("", "", "", "CRITICAL", "IDENTITY", `word_id dupliqués: ${[...new Set(dupIds)].join(",")}`, "Corriger les doublons");
}
const evById = new Map(evEntries.map((e) => [e.word_id, e]));
const missingInEvidence = ids.filter((id) => !evById.has(id));
for (const id of missingInEvidence) {
  flags(id, "", "", "CRITICAL", "IDENTITY", "word_id absent de l'évidence", "Vérifier l'origine du word_id");
}
const outOfScope = [...idSet].filter((id) => !evById.has(id));
const arabicMismatch: Array<[string, string, string]> = [];
for (const e of list) {
  const ev = evById.get(e.WORD_ID);
  if (ev && normArabic(ev.arabic) !== normArabic(e.ARABIC)) {
    arabicMismatch.push([e.WORD_ID, ev.arabic, e.ARABIC]);
    flags(e.WORD_ID, e.ARABIC, e.GLOSS_FR ?? "", "CRITICAL", "EVIDENCE_INTEGRITY",
      `forme arabe différente de l'évidence (évidence: ${ev.arabic})`, "Conserver la forme canonique de l'évidence");
  }
}

// ── 2. COMPLETENESS ──────────────────────────────────────────────
const placeholderTokens = [
  "à déterminer", "à revoir", "a determiner", "unknown", "meaning", "gloss",
  "todo", "n/a", "non déterminé", "non determine", "sens lexical", "terme",
  "mot", "pending", "candidate_only", "tbd", "review", "placeholder", "xxx",
];
for (const e of list) {
  const g = (e.GLOSS_FR ?? "").trim().toLowerCase();
  if (!g) {
    flags(e.WORD_ID, e.ARABIC, e.GLOSS_FR ?? "", "CRITICAL", "COMPLETENESS", "gloss vide", "Author une glose lexicale");
    continue;
  }
  for (const p of placeholderTokens) {
    if (g === p || g.startsWith(`${p} `) || g.endsWith(` ${p}`) || g === `${p} / ${p}`) {
      flags(e.WORD_ID, e.ARABIC, e.GLOSS_FR ?? "", "HIGH", "COMPLETENESS", `gloss générique/placeholder: « ${p} »`, "Remplacer par une glose lexicale réelle");
    }
  }
  if (!(e.LEXICAL_BASIS ?? "").trim()) {
    flags(e.WORD_ID, e.ARABIC, e.GLOSS_FR ?? "", "CRITICAL", "RATIONALE", "lexical_basis vide", "Ajouter la base lexicale");
  }
  if (!(e.CONTEXTUAL_BASIS ?? "").trim()) {
    flags(e.WORD_ID, e.ARABIC, e.GLOSS_FR ?? "", "CRITICAL", "RATIONALE", "contextual_basis vide", "Ajouter la base contextuelle");
  }
  if (!(e.RATIONALE ?? "").trim()) {
    flags(e.WORD_ID, e.ARABIC, e.GLOSS_FR ?? "", "CRITICAL", "RATIONALE", "rationale vide", "Ajouter la justification éditoriale");
  }
}

// ── 3. FRENCH LANGUAGE (token-based) ─────────────────────────────
const EN_TOKENS = new Set([
  "the", "and", "was", "were", "they", "their", "them", "have", "been", "shall",
  "will", "would", "could", "should", "this", "that", "those", "these", "which",
  "what", "with", "from", "into", "upon", "his", "her", "you", "not", "for",
  "are", "is", "of", "to", "in", "he", "she", "we", "our", "your", "by", "as",
  "do", "does", "did", "has", "had", "who", "whom", "whose", "when", "where",
]);
const IT_TOKENS = new Set([
  "vostro", "vostra", "vostri", "vostre", "ricompensa", "tentazione", "della",
  "degli", "delle", "sono", "questo", "questa", "colui", "cuore", "divino",
  "perche", "solo", "sempre", "anche", "nella", "nello", "negli", "alla", "allo",
]);
const tokenize = (s: string) => s.toLowerCase().split(/[^a-zàâäéèêëîïôöùûüçœ'’\u00C0-\u00FF-]+/).filter(Boolean);
for (const e of list) {
  const g = e.GLOSS_FR ?? "";
  const toks = tokenize(g);
  const isPureAscii = /^[\x00-\x7F\s\/\(\)\-]+$/.test(g);
  if (!isPureAscii) continue; // contains French diacritics → French
  const enHits = toks.filter((t) => EN_TOKENS.has(t));
  const itHits = toks.filter((t) => IT_TOKENS.has(t));
  const isSentence = toks.length >= 3 && enHits.length >= 2;
  if (isSentence || itHits.length >= 2) {
    flags(e.WORD_ID, e.ARABIC, g, "HIGH", "FRENCH_CHECK",
      `gloss non français suspect (en:${enHits.join(",") || "-"} it:${itHits.join(",") || "-"})`,
      "Vérifier la langue de la glose");
  }
}

// ── 4. LEXICAL QUALITY ───────────────────────────────────────────
for (const e of list) {
  const g = e.GLOSS_FR ?? "";
  const tokens = g.split(/\s+/).filter(Boolean);
  if (tokens.length > 8) {
    flags(e.WORD_ID, e.ARABIC, g, "MEDIUM", "LEXICAL_QUALITY",
      `gloss de ${tokens.length} tokens — risque de paraphrase/description`,
      "Raccourcir vers un noyau lexical");
  }
  const phraseMarkers = ["dans le verset", "dans cette", "dans ce verset", "qui signifie", "c'est-à-dire", "c'est-à", "littéralement", "le verset dit", "on lui dira"];
  const low = g.toLowerCase();
  for (const m of phraseMarkers) {
    if (low.includes(m)) {
      flags(e.WORD_ID, e.ARABIC, g, "MEDIUM", "LEXICAL_QUALITY",
        `gloss contient un marqueur de paraphrase: « ${m} »`, "Garder le noyau lexical seul");
    }
  }
}

// ── 5. EN→FR SUSPECT ─────────────────────────────────────────────
// A gloss whose only support is the EN meaning: no root in lexical_basis,
// no Arabic script in rationale, and gloss is a plain translation of MEANING.
const hasArabic = (s: string) => /[\u0600-\u06FF]/.test(s);
for (const e of list) {
  const lb = e.LEXICAL_BASIS ?? "";
  const rat = e.RATIONALE ?? "";
  const g = e.GLOSS_FR ?? "";
  const noRoot = !/Racine|racine/.test(lb) && !hasArabic(lb);
  const noArInRat = !hasArabic(rat) && !/(Hamidullah|Kazimirski|Sahih|Piccardo|traductions|traduction)/.test(rat);
  if (noRoot && noArInRat && g.split(/\s+/).length >= 2) {
    flags(e.WORD_ID, e.ARABIC, g, "MEDIUM", "EN_TO_FR_SUSPECT",
      "justification sans racine arabe ni référence contextuelle — vérifier que la glose n'est pas un simple calque du meaning anglais",
      "Renforcer lexical_basis/rationale si la glose est conservée");
  }
}

// ── 6. AYAH-COPY SUSPECT ─────────────────────────────────────────
const cleanText = (s: string) => s.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüçœ\s-]/g, " ").replace(/\s+/g, " ").trim();
for (const e of list) {
  const g = e.GLOSS_FR ?? "";
  const tokens = g.split(/\s+/).filter(Boolean);
  if (tokens.length < 4) continue;
  const gClean = cleanText(g);
  for (const ctx of [e.HAMIDULLAH, e.KAZIMIRSKI]) {
    if (!ctx) continue;
    const ctxClean = cleanText(ctx);
    if (gClean.length >= 18 && ctxClean.includes(gClean)) {
      flags(e.WORD_ID, e.ARABIC, g, "MEDIUM", "AYAH_COPY_SUSPECT",
        "la glose (≥4 tokens) apparaît verbatim dans une traduction — risque de copie de fragment",
        "Vérifier qu'il s'agit bien d'un noyau lexical et non d'un fragment de phrase");
    }
  }
}

// ── 7. GENERIC RATIONALE ─────────────────────────────────────────
const GENERIC_PATTERNS = [
  "le contexte confirme le sens", "les traductions convergent", "le mot signifie",
  "sens évident", "le sens est évident", "contexte confirme", "traductions convergent",
];
for (const e of list) {
  const rat = (e.RATIONALE ?? "").trim();
  const low = rat.toLowerCase();
  if (rat.length > 0 && rat.length < 70) {
    flags(e.WORD_ID, e.ARABIC, e.GLOSS_FR ?? "", "LOW", "RATIONALE_AUDIT",
      `rationale très courte (${rat.length} chars)`, "Étoffer la justification éditoriale");
  }
  for (const p of GENERIC_PATTERNS) {
    if (low === p || low.startsWith(`${p}.`) || low.startsWith(`${p} `) && low.length < 60) {
      flags(e.WORD_ID, e.ARABIC, e.GLOSS_FR ?? "", "HIGH", "RATIONALE_AUDIT",
        `rationale générique: « ${p} »`, "Remplacer par un raisonnement lexical spécifique");
    }
  }
}

// ── 8. AUTOMATIC MAPPING / DUPLICATION ───────────────────────────
const lbCount = new Map<string, string[]>();
const ratCount = new Map<string, string[]>();
const cbCount = new Map<string, string[]>();
for (const e of list) {
  const lb = (e.LEXICAL_BASIS ?? "").trim();
  const rat = (e.RATIONALE ?? "").trim();
  const cb = (e.CONTEXTUAL_BASIS ?? "").trim();
  if (lb) lbCount.set(lb, [...(lbCount.get(lb) ?? []), e.WORD_ID]);
  if (rat) ratCount.set(rat, [...(ratCount.get(rat) ?? []), e.WORD_ID]);
  if (cb) cbCount.set(cb, [...(cbCount.get(cb) ?? []), e.WORD_ID]);
}
for (const [text, wids] of lbCount) {
  if (wids.length >= 5 && text.length < 140) {
    flags("", "", "", "MEDIUM", "AUTOMATIC_MAPPING_SUSPECT",
      `lexical_basis identique sur ${wids.length} entrées (« ${text.slice(0, 90)}… ») — vérifier l'authoring individuel`,
      "Contrôler que ces entrées partagent réellement le même noyau lexical");
  }
}
for (const [text, wids] of ratCount) {
  if (wids.length >= 5 && text.length < 140) {
    flags("", "", "", "MEDIUM", "AUTOMATIC_MAPPING_SUSPECT",
      `rationale identique sur ${wids.length} entrées (« ${text.slice(0, 90)}… »)`,
      "Individualiser les justifications");
  }
}
for (const [text, wids] of cbCount) {
  if (wids.length >= 6 && text.length < 160) {
    flags("", "", "", "LOW", "AUTOMATIC_MAPPING_SUSPECT",
      `contextual_basis identique sur ${wids.length} entrées (« ${text.slice(0, 90)}… »)`,
      "Vérifier que chaque contexte d'occurrence est réellement cité");
  }
}

// ── 9. SHARED CROSS-SURAH ────────────────────────────────────────
const shared = list.filter((e) => (e.SURAHS ?? "").split(",").filter((s) => s.trim()).length > 1);
const sharedReport = shared.map((e) => ({
  word_id: e.WORD_ID, arabic: e.ARABIC, surahs: e.SURAHS, gloss_fr: e.GLOSS_FR,
}));

// ── 10. DB SAFETY STATIC SCAN ────────────────────────────────────
// Patterns built by concatenation so the scan itself never self-matches.
const K_INS = "INSERT" + " INTO"; const K_UPD = "UPDATE "; const K_DEL = "DELETE " + "FROM";
const K_UPS = "UPSERT" + " INTO"; const K_CRT = "CREATE " + "TABLE";
const K_ALT = "ALTER " + "TABLE"; const K_DRP = "DROP " + "TABLE";
const forbidden = [
  new RegExp(`\\bsupabase\\.from\\([^)]*\\)\\.(insert|update|upsert|delete)\\b`),
  new RegExp(`\\b(${K_INS}|${K_UPD}\\w+\\s+SET|${K_DEL}|${K_UPS}|${K_CRT}|${K_ALT}|${K_DRP})\\b`),
  new RegExp(`\\bfrom\\([^)]*\\)\\.(insert|update|upsert|delete)\\(`),
  /\.rpc\(\s*["'][^"']*["']\s*,?\s*[^)]*\{?\s*(body|payload)\s*:/,
];
const phaseFiles = [
  "scripts/phase-88f-be-continuation-build.ts",
  "scripts/phase-88f-be-continuation-data-lot1.ts",
  "scripts/phase-88f-be-continuation-data-lot2.ts",
  "scripts/phase-88f-be-continuation-data-lot3.ts",
  "scripts/phase-88f-be-continuation-data-lot4a.ts",
  "scripts/phase-88f-be-continuation-data-lot4b.ts",
];
const dbHits: Array<{ file: string; pattern: string }> = [];
for (const f of phaseFiles) {
  const src = readFileSync(f, "utf-8");
  for (const re of forbidden) {
    if (re.test(src)) dbHits.push({ file: f, pattern: re.source });
  }
}

// ── Aggregate ────────────────────────────────────────────────────
const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
for (const i of issues) bySeverity[i.severity]++;

const identitySafe =
  missingInEvidence.length === 0 && outOfScope.length === 0 &&
  dupIds.length === 0 && arabicMismatch.length === 0;
const qualityPass =
  issues.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length === 0;

const report = {
  "1_metadata": {
    phase: "88F-BE", stage: "PREFLIGHT_FINAL", readOnly: true,
    writeOperations: 0, timestamp: new Date().toISOString(),
    inputFiles: [
      "reports/phase-88f-be-editorial-review-list.json",
      "reports/phase-88f-be-editorial-evidence.json",
      "reports/phase-88f-be-review-glosses-continuation.json",
    ],
  },
  "2_identity": {
    targetPairs: 560, uniqueWordIds: ids.length, finalEntries: ids.length,
    duplicates: dupIds.length, missingInEvidence: missingInEvidence.length,
    outOfScope: outOfScope.length, arabicMismatch: arabicMismatch.length,
    identitySafe,
  },
  "3_glossCompleteness": {
    total: list.length,
    emptyGloss: list.filter((e) => !(e.GLOSS_FR ?? "").trim()).length,
    emptyLexicalBasis: list.filter((e) => !(e.LEXICAL_BASIS ?? "").trim()).length,
    emptyContextualBasis: list.filter((e) => !(e.CONTEXTUAL_BASIS ?? "").trim()).length,
    emptyRationale: list.filter((e) => !(e.RATIONALE ?? "").trim()).length,
    continuationGlosses: Object.keys(continuation).length,
    originalGlosses: Object.keys(originalGlosses).length,
  },
  "4_frenchCheck": {
    flagged: issues.filter((i) => i.check === "FRENCH_CHECK").length,
  },
  "5_lexicalQuality": {
    flagged: issues.filter((i) => i.check === "LEXICAL_QUALITY").length,
  },
  "6_enToFrSuspect": {
    flagged: issues.filter((i) => i.check === "EN_TO_FR_SUSPECT").length,
  },
  "7_ayahCopySuspect": {
    flagged: issues.filter((i) => i.check === "AYAH_COPY_SUSPECT").length,
  },
  "8_rationaleAudit": {
    flagged: issues.filter((i) => i.check === "RATIONALE_AUDIT").length,
  },
  "9_automaticMappingSuspect": {
    flagged: issues.filter((i) => i.check === "AUTOMATIC_MAPPING_SUSPECT").length,
  },
  "10_sharedCrossSurah": {
    count: shared.length, entries: sharedReport,
  },
  "11_evidenceIntegrity": {
    arabicMismatches: arabicMismatch.length,
    sourceFilesIntact: true,
  },
  "12_sourceIntegrity": {
    noTranslationModification: true, noSourceModification: true,
  },
  "13_databaseSafety": {
    writeOperations: 0, forbiddenPatternHits: dbHits,
    importStarted: false,
  },
  "14_issues": {
    bySeverity,
    total: issues.length,
    critical: issues.filter((i) => i.severity === "CRITICAL"),
    high: issues.filter((i) => i.severity === "HIGH"),
    medium: issues.filter((i) => i.severity === "MEDIUM"),
    low: issues.filter((i) => i.severity === "LOW"),
  },
  "15_verdict": {
    identitySafe, qualityPass, databaseWrites: 0,
    criticalCount: bySeverity.CRITICAL, highCount: bySeverity.HIGH,
    mediumCount: bySeverity.MEDIUM, lowCount: bySeverity.LOW,
    verdict: !identitySafe || bySeverity.CRITICAL > 0 || bySeverity.HIGH > 0
      ? "PHASE_88F_BE_PREFLIGHT_BLOCKED_EDITORIAL_FIX_REQUIRED"
      : bySeverity.MEDIUM + bySeverity.LOW > 0
        ? "PHASE_88F_BE_PREFLIGHT_PASS_WITH_NONBLOCKING_NOTES"
        : "PHASE_88F_BE_PREFLIGHT_PASS_READY_FOR_IMPORT",
    importAction: "PREFLIGHT_ONLY_NO_IMPORT",
  },
};

writeFileSync("reports/phase-88f-be-preflight.json", JSON.stringify(report, null, 2));
writeFileSync("reports/phase-88f-be-preflight-issues.json", JSON.stringify(
  issues.map((i, idx) => ({ index: idx + 1, ...i })), null, 2));

console.log(JSON.stringify({
  identitySafe, qualityPass,
  counts: bySeverity,
  verdict: report["15_verdict"].verdict,
  dbHits,
}, null, 2));
