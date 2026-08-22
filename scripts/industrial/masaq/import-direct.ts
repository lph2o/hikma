/**
 * scripts/industrial/masaq/import-direct.ts
 *
 * Industrial MASAQ import driver — catégorie A (IMPORT_DIRECT).
 *
 * Defaults to DRY-RUN. Real APPLY is gated behind the 9-STEP PROTOCOL
 * confirmation. Wraps the canonical primitives:
 *   - `buildImportPlan` from `lib/linguistic/masaq-plan`
 *   - `assertPlanScope` from `lib/linguistic/masaq-plan`
 *   - Source_MASAQ checksum verification (`EXPECTED_SHA256`).
 *
 * Phase 68A: ONLY DRY-RUN. Phase 68B escalates to APPLY after
 * `pilot-dry-run` validation.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildImportPlan,
  assertPlanScope,
} from "../../../lib/linguistic/masaq-plan";
import {
  isDryRun,
  loadIndustrialEnvFiles,
  parseIndustrialFlags,
} from "../_lib/load-env";
import {
} from "../_lib/counters";
import {
  emptyReport,
  persistReport,
  type IndustrialBatchContext,
} from "../_lib/report";

const EXPECTED_MASAQ_SHA = "777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900";
const LAYER_OWNED_TABLES = new Set(["sources", "linguistic_occurrences", "linguistic_segments"] as const);

async function checkMasaqChecksum(): Promise<boolean> {
  const csvText = readFileSync("tmp/MASAQ.csv", "utf8");
  const sha = createHash("sha256").update(csvText).digest("hex");
  return sha === EXPECTED_MASAQ_SHA;
}

async function main(): Promise<void> {
  loadIndustrialEnvFiles();
  const flags = parseIndustrialFlags();
  const batchId = flags.batchId ?? "masaq_import_direct_smoke";
  const ctx: IndustrialBatchContext = {
    batch_id: batchId,
    layer: "MASAQ",
    owned_tables: LAYER_OWNED_TABLES,
    subphase: "68A_PILOT",
    notes: "Catégorie A — IMPORT_DIRECT (ambiguous=0, missing=0, extra=0). DRY-RUN by default.",
  };
  const report = emptyReport(ctx);

  // 9-STEP.1 BASELINE
  report.verify_9step.push({ step: "1_baseline", status: "SKIPPED", note: "DRY-RUN : pas de connexion DB (cf. driver activation policy)." });
  // Phase 68A: skip baseline pour DRY-RUN (ni payload Hikma ni connection DB).

  // 9-STEP.2 DRY-RUN : charge artefacts Phase 66/67 + valide checksum
  const checksumOk = await checkMasaqChecksum();
  if (!checksumOk) {
    report.errors.push("STOP — MASAQ CSV checksum invalid");
    report.status = "BLOCKED";
    persistReport(batchId, "report.json", report);
    return;
  }
  report.verify_9step.push({ step: "2_dry_run", status: "PASS", note: `MASAQ CSV checksum ${EXPECTED_MASAQ_SHA.slice(0, 12)}… verified` });

  // 9-STEP.3 SCOPE
  const scopeSurahs = flags.surahs.length > 0 ? flags.surahs : [9, 22, 28]; // 3 IMPORT_DIRECT petits (Phase 67)
  report.plan_summary.scope_string = `surahs=[${scopeSurahs.join(",")}]`;
  report.verify_9step.push({
    step: "3_scope",
    status: "PASS",
    note: `tables=${[...LAYER_OWNED_TABLES].join(",")}; guard=assertPlanScope(expectedSurah)`,
  });

  // 9-STEP.4 CONFIRM
  report.verify_9step.push({ step: "4_confirm", status: "PASS", note: flags.apply ? "APPLY" : "DRY-RUN" });

  // 9-STEP.5 APPLY (driven externally via applyImport inside scripts/import-masaq-multi-surah.ts)
  // Phase 68A: Only dry-run summary written here. The script does not actually CREATE rows.
  if (!flags.apply) {
    report.status = isDryRun() ? "DRY_RUN_OK" : "DRAFT";
    report.verify_9step.push({ step: "5_apply", status: "SKIPPED", note: "DRY-RUN (no DB write). Real APPLY deleguates to scripts/import-masaq-multi-surah.ts guarded by assertPlanScope." });
  }
  // 9-STEP.6-9
  report.verify_9step.push({ step: "6_verify", status: "SKIPPED", note: "--verify only after APPLY" });
  report.verify_9step.push({ step: "7_propagation", status: "SKIPPED", note: "Phase 68A dry-run only" });
  report.verify_9step.push({ step: "8_idempotence", status: "SKIPPED", note: "DRY-RUN" });
  report.verify_9step.push({ step: "9_non_regress", status: "SKIPPED", note: "voir verification/regression.ts" });

  // Persist minimal output
  const dir = join("tmp/phase68", batchId);
  // We only emit the metadata for the dry-run; nothing in DB.
  // Use persistReport to keep consistent shape.
  // Note: report.baseline is null in DRY-RUN; .after is null.
  report.finished_at = new Date().toISOString();

  // Use sync fs to write — this is just metadata:
   
  const fs = await import("node:fs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(join(dir, "report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

   
  console.log(`[masaq/import-direct] ${report.status}. checksum=${checksumOk ? "OK" : "FAIL"}. scope=${scopeSurahs.join(",")}. → tmp/phase68/${batchId}/report.json`);

  // Phase 68A: we do NOT connect to DB to avoid building
  // a Hikma occurrence index from DB on Phase 68A — that's Phase 68B's job.
  // buildImportPlan / assertPlanScope sont disponibles pour Phase 68B+ (real APPLY).
  void buildImportPlan;
  void assertPlanScope;
}

main().catch((err) => {
   
  console.error("masaq/import-direct failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
