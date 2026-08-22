/**
 * scripts/industrial/masaq/source-alignment-review.ts
 *
 * Industrial MASAQ source-alignment driver — catégorie C (SOURCE_REVIEW).
 *
 * READ-ONLY by design: this category captures surates whose bloqueo is
 * upstream (data-source alignment, not classify rules). Never invents a
 * normalize transformation to mask a segmentation divergence.
 *
 * Phase 68D will open a dedicated sub-phase for any structural change
 * (PR-008 word-boundary reconciliation).
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
  const batchId = flags.batchId ?? "masaq_source_review_smoke";
  const ctx: IndustrialBatchContext = {
    batch_id: batchId,
    layer: "MASAQ",
    owned_tables: new Set(["linguistic_occurrences", "linguistic_segments"]),
    subphase: "68A_PILOT",
    notes: "Catégorie C — SOURCE_REVIEW. STOP si segmentation source diverge.",
  };
  const report = emptyReport(ctx);

  const masaq = JSON.parse(readFileSync("tmp/phase67/masaq-batches.json", "utf8")) as {
    batches: Array<{ bucket: string; total_surahs: number; total_occurrences_alignable: number; block_reasons: string[] }>;
  };
  const src = masaq.batches.find((b) => b.bucket === "SOURCE_ALIGNMENT_REVIEW");
  if (!src) {
    report.errors.push("STOP — batch SOURCE_ALIGNMENT_REVIEW introuvable dans tmp/phase67/masaq-batches.json");
    report.status = "BLOCKED";
    persistReport(batchId, "report.json", report);
    return;
  }

  report.verify_9step.push({ step: "1_baseline", status: "SKIPPED", note: "" });
  report.verify_9step.push({
    step: "2_dry_run",
    status: "PASS",
    note: `${src.total_surahs} sourates; ${src.total_occurrences_alignable} occ alignables potentielles.`,
  });
  report.verify_9step.push({ step: "3_scope", status: "PASS", note: "Source-upstream : aucun change de normalizeOrthographic." });
  report.verify_9step.push({ step: "4_confirm", status: "SKIPPED", note: "Sous-phase 68D dédiée AVANT toute action." });
  report.verify_9step.push({ step: "5_apply", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "6_verify", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "7_propagation", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "8_idempotence", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "9_non_regress", status: "SKIPPED", note: "" });

  report.status = "DRY_RUN_OK";
  report.plan_summary = {
    scope_string: `${src.total_surahs} sourates; ${src.total_occurrences_alignable} occ`,
    counts_by_table: { source_review_surahs: src.total_surahs, source_review_occurrences: src.total_occurrences_alignable },
  };
  report.warnings = src.block_reasons;
  report.finished_at = new Date().toISOString();
  persistReport(batchId, "report.json", report);
   
  console.log(`[masaq/source-alignment-review] ${report.status}. ${src.total_surahs} sourates source-review. → tmp/phase68/${batchId}/report.json`);
}

main().catch((err) => {
   
  console.error("masaq/source-alignment-review failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
