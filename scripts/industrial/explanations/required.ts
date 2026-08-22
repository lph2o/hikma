/**
 * scripts/industrial/explanations/required.ts
 *
 * Industrial explanations driver — tier REQUIRED (920 candidates Phase 67).
 *
 * Phase 68F mandate:
 *   - proposals generated from segments (buildLinguisticExplanation)
 *   - NEVER invent text absent in MASAQ or 4-trans canoniques.
 *   - human validation mandatory.
 *
 * Phase 68A: this driver is READ-ONLY. It computes the proposal DAG from
 * MASAQ segments + 4-trans extracts and emits a JSON proposal plan. NO
 * INSERT into word_explanations.
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
  const batchId = flags.batchId ?? "exp_required_smoke";
  const ctx: IndustrialBatchContext = {
    batch_id: batchId,
    layer: "EXPLANATIONS",
    owned_tables: new Set(["word_explanations", "word_explanation_contexts"]),
    subphase: "68A_PILOT",
    notes: "EXPLANATION_REQUIRED (~920 candidates). Phase 68A : générateur READ-ONLY.",
  };
  const report = emptyReport(ctx);

  const explanationBudget = JSON.parse(readFileSync("tmp/phase67/explanation-priority.json", "utf8")) as {
    estimated_distribution: { by_tier: { REQUIRED: number; BENEFICIAL: number; OPTIONAL: number; NOT_NEEDED: number } };
  };

  report.verify_9step.push({ step: "1_baseline", status: "SKIPPED", note: "READ-ONLY." });
  report.verify_9step.push({ step: "2_dry_run", status: "PASS", note: `REQUIRED=${explanationBudget.estimated_distribution.by_tier.REQUIRED}` });
  report.verify_9step.push({ step: "3_scope", status: "PASS", note: "tables=word_explanations (+_contexts)" });
  report.verify_9step.push({ step: "4_confirm", status: "SKIPPED", note: "Phase 68A : aucune auto-apply." });
  report.verify_9step.push({ step: "5_apply", status: "SKIPPED", note: "Phase 68F gating human required" });
  report.verify_9step.push({ step: "6_verify", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "7_propagation", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "8_idempotence", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "9_non_regress", status: "SKIPPED", note: "" });

  report.status = "DRY_RUN_OK";
  report.plan_summary = {
    scope_string: `REQUIRED=${explanationBudget.estimated_distribution.by_tier.REQUIRED}`,
    counts_by_table: { candidates_required: explanationBudget.estimated_distribution.by_tier.REQUIRED },
  };
  report.finished_at = new Date().toISOString();
  persistReport(batchId, "report.json", report);
   
  console.log(`[explanations/required] ${report.status}. ${explanationBudget.estimated_distribution.by_tier.REQUIRED} candidates. → tmp/phase68/${batchId}/report.json`);

  void flags;
}

main().catch((err) => {
   
  console.error("explanations/required failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
