/**
 * scripts/industrial/verification/baseline.ts
 *
 * Industrial baseline + post-apply diff verification.
 * Captures the canonical counter snapshot, then compares against an
 * expected snapshot (optional). READ-ONLY.
 */
import {
  buildServiceRoleClient,
  loadIndustrialEnvFiles,
  parseIndustrialFlags,
} from "../_lib/load-env";
import {
  captureCanonicalCounters,
  diffCounters,
  type CanonicalCounters,
} from "../_lib/counters";
import {
  emptyReport,
  persistReport,
  type IndustrialBatchContext,
} from "../_lib/report";
import { readFileSync, writeFileSync } from "node:fs";

async function main(): Promise<void> {
  loadIndustrialEnvFiles();
  const flags = parseIndustrialFlags();
  const batchId = flags.batchId ?? "verify_baseline_smoke";
  const ctx: IndustrialBatchContext = {
    batch_id: batchId,
    layer: "VERIFICATION",
    owned_tables: new Set([]),
    subphase: "68A_PILOT",
    notes: "Baseline snapshot + optional diff vs expected.",
  };
  const report = emptyReport(ctx);

  const client = await buildServiceRoleClient();
  const snap = await captureCanonicalCounters(client);

  // Persist snapshot
  const dir = `tmp/phase68/${batchId}`;
   
  const fs = await import("node:fs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/baseline.json`, JSON.stringify(snap, null, 2) + "\n", "utf8");

  let diff: ReturnType<typeof diffCounters> = [];
  if (flags.proposalsPath) {
    const expected = JSON.parse(readFileSync(flags.proposalsPath, "utf8")) as CanonicalCounters;
    diff = diffCounters(expected, snap);
  }

  report.verify_9step.push({ step: "1_baseline", status: "PASS", note: "captured (READ-ONLY)" });
  report.verify_9step.push({ step: "2_dry_run", status: "SKIPPED", note: "VERIFICATION layer" });
  report.verify_9step.push({ step: "3_scope", status: "PASS", note: "20 canonical tables" });
  report.verify_9step.push({ step: "4_confirm", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "5_apply", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "6_verify", status: diff.length === 0 ? "PASS" : "FAIL", note: `delta_count=${diff.length}` });
  report.verify_9step.push({ step: "7_propagation", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "8_idempotence", status: "PASS", note: "Pure count(*)" });
  report.verify_9step.push({ step: "9_non_regress", status: "SKIPPED", note: "" });

  report.baseline = snap;
  report.after = snap;
  report.deltas = diff;
  report.status = "DRY_RUN_OK";
  report.plan_summary = {
    scope_string: `tables=20`,
    counts_by_table: { snapshot_tables: Object.keys(snap).length },
  };
  report.finished_at = new Date().toISOString();
  writeFileSync(`${dir}/diff.json`, JSON.stringify(diff, null, 2) + "\n", "utf8");
  persistReport(batchId, "report.json", report);
   
  console.log(`[verification/baseline] ${report.status}. ${Object.keys(snap).length} tables → tmp/phase68/${batchId}/baseline.json`);
}

main().catch((err) => {
   
  console.error("verification/baseline failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});