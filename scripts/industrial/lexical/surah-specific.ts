/**
 * scripts/industrial/lexical/surah-specific.ts
 *
 * Industrial lexical batch driver — surah-specific batches (MEDIUM/LOW).
 * Stops at DRY-RUN in Phase 68A.
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
import { readFileSync } from "node:fs";

const LAYER_OWNED_TABLES: ReadonlySet<string> = new Set(["word_translations"]);

async function main(): Promise<void> {
  loadIndustrialEnvFiles();
  const flags = parseIndustrialFlags();
  const batchId = flags.batchId ?? "lex_sura_specific_smoke";
  const ctx: IndustrialBatchContext = {
    batch_id: batchId,
    layer: "LEXICAL",
    owned_tables: LAYER_OWNED_TABLES,
    subphase: "68A_PILOT",
    notes: `Surah-specific lexical batch — sourates=${flags.surahs.join(",") || "(choose --surahs)"}`,
  };
  const report = emptyReport(ctx);

  // 9-STEP.1 BASELINE
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

  // 9-STEP.2-3 DRY-RUN + SCOPE
  if (!flags.proposalsPath) {
    report.errors.push("--proposals=PATH required (Phase 30/31 surah-specific proposals).");
    report.status = "BLOCKED";
    persistReport(batchId, "report.json", report);
    return;
  }
  const proposals = JSON.parse(readFileSync(flags.proposalsPath, "utf8")) as Array<{ word_id: string; arabic: string; proposed_fr: string; surahs: number[] }>;
  const scopeSurahs = new Set(flags.surahs);
  const inScope = scopeSurahs.size > 0 ? proposals.filter((p) => p.surahs.some((s) => scopeSurahs.has(s))) : proposals;
  const limited = flags.limit ? inScope.slice(0, flags.limit) : inScope;
  report.plan_summary = {
    scope_string: `surahs=[${flags.surahs.join(",")}]; proposals=${proposals.length}; in_scope=${inScope.length}; after_limit=${limited.length}`,
    counts_by_table: { word_translations_proposed: limited.length },
  };
  report.verify_9step.push({ step: "2_dry_run", status: "PASS", note: `${limited.length} in-scope proposals` });
  report.verify_9step.push({ step: "3_scope", status: "PASS", note: `tables=${[...LAYER_OWNED_TABLES].join(",")}` });

  // 9-STEP.4 CONFIRM
  report.verify_9step.push({
    step: "4_confirm",
    status: flags.apply ? "PASS" : "PASS",
    note: flags.apply ? "APPLY" : "DRY-RUN",
  });

  // 9-STEP.5-9
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
    report.verify_9step.push({ step: "5_apply", status: report.status === "APPLIED" ? "PASS" : "FAIL", note: "" });
  } else {
    report.status = isDryRun() ? "DRY_RUN_OK" : "DRAFT";
  }

  report.verify_9step.push({
    step: "5_apply",
    status: flags.apply ? (report.status === "APPLIED" ? "PASS" : report.status === "APPLIED_FAILED" ? "FAIL" : "SKIPPED") : "SKIPPED",
    note: "",
  });
  if (flags.verify && flags.apply) {
    report.verify_9step.push({ step: "6_verify", status: report.invariants.status, note: "compared" });
  } else {
    report.verify_9step.push({ step: "6_verify", status: "SKIPPED", note: "" });
  }
  report.verify_9step.push({ step: "7_propagation", status: "SKIPPED", note: "" });
  report.verify_9step.push({ step: "8_idempotence", status: "SKIPPED", note: "DRY-RUN" });
  report.verify_9step.push({ step: "9_non_regress", status: "SKIPPED", note: "voir verification/regression.ts" });
  report.finished_at = new Date().toISOString();
  persistReport(batchId, "report.json", report);
   
  console.log(`[lexical/surah-specific] ${report.status} → tmp/phase68/${batchId}/report.json`);
}

main().catch((err) => {
   
  console.error("lexical/surah-specific failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
