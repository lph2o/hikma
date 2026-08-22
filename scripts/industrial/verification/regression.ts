/**
 * scripts/industrial/verification/regression.ts
 *
 * Phase 68A regression runner : exécute tsc/eslint/vitest et capture
 * les résultats. Phase 68 cap : 753/753 + tsc 0 + eslint 0.
 */
import { execSync } from "node:child_process";
import { loadIndustrialEnvFiles, parseIndustrialFlags } from "../_lib/load-env";
import { emptyReport, persistReport, type IndustrialBatchContext } from "../_lib/report";

interface RegressionResult {
  suite: string;
  exit_code: number;
  stdout_tail: string;
  passed: boolean;
}

function runCommand(label: string, cmd: string, timeoutMs = 240_000): RegressionResult {
  try {
    const out = execSync(cmd, { encoding: "utf8", timeout: timeoutMs, stdio: ["ignore", "pipe", "pipe"] });
    return { suite: label, exit_code: 0, stdout_tail: out.split(/\r?\n/).slice(-3).join("\n"), passed: true };
  } catch (err) {
    const e = err as { status?: number; stdout?: Buffer; message?: string };
    const tail = e.stdout ? e.stdout.toString().split(/\r?\n/).slice(-5).join("\n") : (e.message ?? "");
    return { suite: label, exit_code: e.status ?? 1, stdout_tail: tail, passed: false };
  }
}

function main(): void {
  loadIndustrialEnvFiles();
  const flags = parseIndustrialFlags();
  const batchId = flags.batchId ?? "verify_regression_smoke";
  const ctx: IndustrialBatchContext = {
    batch_id: batchId,
    layer: "VERIFICATION",
    owned_tables: new Set([]),
    subphase: "68A_PILOT",
    notes: "Phase 68A regression: tsc / eslint / vitest.",
  };
  const report = emptyReport(ctx);

  const tsc = runCommand("tsc", "npx tsc -p .", 240_000);
  const eslint = runCommand("eslint", "npx eslint scripts/industrial/", 120_000);
  const vitest = runCommand("vitest", "npx vitest run", 180_000);

  const allPassed = tsc.passed && eslint && vitest.passed;

  report.verify_9step.push({ step: "tsc", status: tsc.passed ? "PASS" : "FAIL", note: tsc.stdout_tail });
  report.verify_9step.push({ step: "eslint", status: eslint.passed ? "PASS" : "FAIL", note: eslint.stdout_tail });
  report.verify_9step.push({ step: "vitest", status: vitest.passed ? "PASS" : "FAIL", note: vitest.stdout_tail });

  report.status = allPassed ? "DRY_RUN_OK" : "BLOCKED";
  report.plan_summary = {
    scope_string: "tsc + eslint + vitest",
    counts_by_table: {
      tsc: tsc.passed ? 1 : 0,
      eslint: eslint.passed ? 1 : 0,
      vitest: vitest.passed ? 1 : 0,
    },
  };
  report.finished_at = new Date().toISOString();
  persistReport(batchId, "report.json", report);
   
  console.log(`[verification/regression] ${report.status}. tsc=${tsc.passed} eslint=${eslint.passed} vitest=${vitest.passed}`);
}

main();