/**
 * scripts/industrial/masaq/classifier-review.ts
 *
 * Industrial MASAQ classifier driver — catégorie B (CLASSIFIER_REVIEW).
 *
 * IMPORTANT: a classifier rule mutation MUST follow the Phase 64→65
 * precedent. This driver is purely READ-ONLY by nature (it doesn't WRITE
 * classifier code) — it lists eligible surates + samples per cause.
 *
 * Phase 68C will be the actual APPLY of a candidate rule, after the corpus
 * regression check is signed by a human.
 */
import { readFileSync } from "node:fs";
import {
  loadIndustrialEnvFiles,
  parseIndustrialFlags,
} from "../_lib/load-env";
import {
  emptyReport,
  persistReport,
  type IndustrialBatchContext,
} from "../_lib/report";

async function main(): Promise<void> {
  loadIndustrialEnvFiles();
  const flags = parseIndustrialFlags();
  const batchId = flags.batchId ?? "masaq_classifier_review_smoke";
  const ctx: IndustrialBatchContext = {
    batch_id: batchId,
    layer: "MASAQ",
    owned_tables: new Set(["linguistic_occurrences", "linguistic_segments"]),
    subphase: "68A_PILOT",
    notes: "Catégorie B — CLASSIFIER_REVIEW (sourates 1-5 ambig). Driver READ-ONLY strict.",
  };
  const report = emptyReport(ctx);

  const causeRoots = JSON.parse(readFileSync("tmp/phase67/masaq-root-causes.json", "utf8")) as {
    ambiguous_total: number;
    by_cause_root: Record<string, { count: number; surahs_affected: number; surahs_range: number[] }>;
  };

  // Pas de baseline ni d'apply : purement descriptif
  report.verify_9step.push({ step: "1_baseline", status: "SKIPPED", note: "READ-ONLY audit script" });
  report.verify_9step.push({ step: "2_dry_run", status: "PASS", note: "Cause-racines décomptées depuis tmp/phase67/masaq-root-causes.json" });
  report.verify_9step.push({
    step: "3_scope",
    status: "PASS",
    note: `causes=${Object.keys(causeRoots.by_cause_root).join(", ")}; total_amb=${causeRoots.ambiguous_total}`,
  });
  report.verify_9step.push({ step: "4_confirm", status: "SKIPPED", note: "READ-ONLY — pas apply classifier rule en Phase 68A." });
  report.verify_9step.push({ step: "5_apply", status: "SKIPPED", note: "obsolète — classifier_rule_apply est une sous-phase 68C dédiée." });
  report.verify_9step.push({ step: "6_verify", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "7_propagation", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "8_idempotence", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "9_non_regress", status: "SKIPPED", note: "Phase 68C prerequisite : test corpus complet AVANT commit." });

  report.status = "DRY_RUN_OK";
  report.plan_summary = {
    scope_string: `cause_roots=${Object.keys(causeRoots.by_cause_root).length}; ambiguous_total=${causeRoots.ambiguous_total}`,
    counts_by_table: { cause_roots: Object.keys(causeRoots.by_cause_root).length, ambiguous_total: causeRoots.ambiguous_total },
  };
  report.finished_at = new Date().toISOString();
  persistReport(batchId, "report.json", report);
   
  console.log(`[masaq/classifier-review] ${report.status}. ${causeRoots.ambiguous_total} AMBIGUOUS en ${Object.keys(causeRoots.by_cause_root).length} causes-racines. → tmp/phase68/${batchId}/report.json`);
}

main().catch((err) => {
   
  console.error("masaq/classifier-review failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
