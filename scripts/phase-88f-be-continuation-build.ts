/**
 * PHASE 88F-BE — CONTINUATION — BUILD
 *
 * Fusionne les glosses authorées (LOT1..LOT4) dans :
 *   reports/phase-88f-be-review-glosses-continuation.json
 *
 * READ-ONLY : aucune écriture DB. Vérifie les comptes attendus.
 */

import { writeFileSync, readFileSync } from "node:fs";
import { LOT1_GLOSSES } from "./phase-88f-be-continuation-data-lot1";
import { LOT2_GLOSSES } from "./phase-88f-be-continuation-data-lot2";
import { LOT3_GLOSSES } from "./phase-88f-be-continuation-data-lot3";
import { LOT4A_GLOSSES } from "./phase-88f-be-continuation-data-lot4a";
import { LOT4B_GLOSSES } from "./phase-88f-be-continuation-data-lot4b";

interface GlossData {
  gloss_fr: string; lexical_basis: string;
  contextual_basis: string; rationale: string;
}

type Row = [string, string, string, string, string];

const EXPECTED = {
  MORPHOLOGICAL_UNCERTAINTY: 90,
  POLYSEMY: 29,
  CONTEXT_INSUFFICIENT: 50,
  LEXICAL_SENSE_UNCERTAIN: 280,
};

function toRecord(rows: Row[]): Record<string, GlossData> {
  const out: Record<string, GlossData> = {};
  for (const [wordId, glossFr, lexicalBasis, contextualBasis, rationale] of rows) {
    if (out[wordId]) {
      throw new Error(`Duplicate word_id in lot data: ${wordId}`);
    }
    out[wordId] = {
      gloss_fr: glossFr,
      lexical_basis: lexicalBasis,
      contextual_basis: contextualBasis,
      rationale,
    };
  }
  return out;
}

const lots: Array<[string, Row[], number]> = [
  ["MORPHOLOGICAL_UNCERTAINTY", LOT1_GLOSSES, EXPECTED.MORPHOLOGICAL_UNCERTAINTY],
  ["POLYSEMY", LOT2_GLOSSES, EXPECTED.POLYSEMY],
  ["CONTEXT_INSUFFICIENT", LOT3_GLOSSES, EXPECTED.CONTEXT_INSUFFICIENT],
  ["LEXICAL_SENSE_UNCERTAIN (A+B)", [...LOT4A_GLOSSES, ...LOT4B_GLOSSES], EXPECTED.LEXICAL_SENSE_UNCERTAIN],
];

const merged: Record<string, GlossData> = {};
const report: Record<string, unknown> = {};

for (const [name, rows, expected] of lots) {
  const rec = toRecord(rows);
  report[name] = { expected, actual: Object.keys(rec).length };
  if (Object.keys(rec).length !== expected) {
    throw new Error(`${name}: expected ${expected}, got ${Object.keys(rec).length}`);
  }
  Object.assign(merged, rec);
}

// Cross-lot duplicate check
const ids = Object.keys(merged);
if (new Set(ids).size !== ids.length) {
  throw new Error("Duplicate word_id across lots");
}

// Validate against the actual REVIEW working set (must be subset, no invented ids)
const working: Array<{ WORD_ID: string }> = JSON.parse(
  readFileSync("tmp/phase-88f-be-continuation/review-working.json", "utf-8"),
);
const workingIds = new Set(working.map((w) => w.WORD_ID));
const notInWorking = ids.filter((id) => !workingIds.has(id));
if (notInWorking.length > 0) {
  throw new Error(`Glosses for word_ids absent from REVIEW set: ${notInWorking.join(", ")}`);
}
const missingFromWorking = [...workingIds].filter((id) => !ids.includes(id));
report["workingSetCoverage"] = {
  workingTotal: workingIds.size,
  authored: ids.length,
  missingFromWorking: missingFromWorking.length,
};

// Quality: no empty fields
const empty = ids.filter((id) =>
  !merged[id].gloss_fr.trim() || !merged[id].lexical_basis.trim() ||
  !merged[id].contextual_basis.trim() || !merged[id].rationale.trim(),
);
report["emptyFields"] = empty;
if (empty.length > 0) {
  throw new Error(`Empty fields in ${empty.length} glosses`);
}

const OUTPUT = "reports/phase-88f-be-review-glosses-continuation.json";
writeFileSync(OUTPUT, JSON.stringify(merged, null, 2));
report["output"] = OUTPUT;
report["totalGlosses"] = ids.length;

console.log(JSON.stringify(report, null, 2));
console.log(`\nWrote ${ids.length} continuation glosses → ${OUTPUT}`);
