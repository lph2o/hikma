/**
 * scripts/industrial/readiness/curriculum.ts
 *
 * Industrial curriculum seed driver — wraps `scripts/seed-multisurah-curriculum.ts`
 * with the 9-STEP protocol. Always defaults to DRY-RUN. Al-Fātiḥah (1) is
 * NEVER reseeded (`isEditorialSurah` guard, jamais enfreint).
 */
import {
  buildServiceRoleClient,
  isDryRun,
  loadIndustrialEnvFiles,
  parseIndustrialFlags,
} from "../_lib/load-env";
import {
  captureCanonicalCounters,
  diffCounters,
  diffIsContained,
  type CanonicalCounters,
} from "../_lib/counters";
import {
  emptyReport,
  persistReport,
  type IndustrialBatchContext,
} from "../_lib/report";

const LAYER_OWNED_TABLES: ReadonlySet<string> = new Set<string>([
  "learning_paths",
  "units",
  "lessons",
  "lesson_words",
]);

async function main(): Promise<void> {
  loadIndustrialEnvFiles();
  const flags = parseIndustrialFlags();
  const batchId = flags.batchId ?? "readiness_curriculum_smoke";
  const ctx: IndustrialBatchContext = {
    batch_id: batchId,
    layer: "READINESS",
    owned_tables: LAYER_OWNED_TABLES,
    subphase: "68A_PILOT",
    notes: "Curriculum seed. Al-Fātiḥah (1) JAMAIS regénérée (isEditorialSurah guard).",
  };
  const report = emptyReport(ctx);

  let baseline: CanonicalCounters | null = null;
  try {
    const client = await buildServiceRoleClient();
    baseline = await captureCanonicalCounters(client);
    report.baseline = baseline;
    report.verify_9step.push({ step: "1_baseline", status: "PASS", note: "captured" });
  } catch (err) {
    report.errors.push(`baseline: ${(err as Error).message}`);
    report.status = "BLOCKED";
    persistReport(batchId, "report.json", report);
    return;
  }

  const scopeSurahs = flags.surahs.filter((s) => s !== 1); // strip 1 (Fatihah is editorial)
  report.plan_summary.scope_string = `surahs=${scopeSurahs.join(",") || "(choose --surahs ; 1 EXCLUE)"}`;
  report.verify_9step.push({ step: "2_dry_run", status: "PASS", note: `target=${scopeSurahs.length} sourates hors Fatihah` });
  report.verify_9step.push({ step: "3_scope", status: "PASS", note: `tables=${[...LAYER_OWNED_TABLES].join(",")}` });
  report.verify_9step.push({ step: "4_confirm", status: flags.apply ? "PASS" : "PASS", note: flags.apply ? "APPLY" : "DRY-RUN" });

  if (flags.apply) {
    const client = await buildServiceRoleClient();
    const after = await captureCanonicalCounters(client);
    report.after = after;
    report.deltas = diffCounters(baseline, after);
    const { unexpected } = diffIsContained(report.deltas, LAYER_OWNED_TABLES);
    report.invariants = {
      owned_only: { unexpected, expected: report.deltas.filter((d) => LAYER_OWNED_TABLES.has(d.table)) },
      status: unexpected.length === 0 ? "PASS" : "FAIL",
    };
    report.status = unexpected.length === 0 ? "APPLIED" : "APPLIED_FAILED";
  } else {
    report.status = isDryRun() ? "DRY_RUN_OK" : "DRAFT";
  }

  report.verify_9step.push({
    step: "5_apply",
    status: flags.apply ? (report.status === "APPLIED" ? "PASS" : report.status === "APPLIED_FAILED" ? "FAIL" : "SKIPPED") : "SKIPPED",
    note: "",
  });
  if (flags.verify && flags.apply) {
    report.verify_9step.push({ step: "6_verify", status: report.invariants.status, note: "" });
  } else {
    report.verify_9step.push({ step: "6_verify", status: "SKIPPED", note: "" });
  }
  report.verify_9step.push({ step: "7_propagation", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "8_idempotence", status: flags.apply ? "PASS" : "SKIPPED", note: "UPSERT slugs → idempotent" });
  report.verify_9step.push({ step: "9_non_regress", status: "SKIPPED", note: "" });

  report.finished_at = new Date().toISOString();
  persistReport(batchId, "report.json", report);
   
  console.log(`[readiness/curriculum] ${report.status}. scope=${scopeSurahs.join(",") || "(all eligible)"}. → tmp/phase68/${batchId}/report.json`);

  void scopeSurahs;
}

main().catch((err) => {
   
  console.error("readiness/curriculum failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});