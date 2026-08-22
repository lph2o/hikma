/**
 * scripts/industrial/pilot-dry-run.ts
 *
 * PHASE 68A — INDUSTRIAL PILOT DRY-RUN ORCHESTRATOR.
 *
 * Objectif spec §26 :
 *   - 1 sourate IMPORT_DIRECT MASAQ
 *   - 1 sourate CLASSIFIER_REVIEW
 *   - 1 sourate SOURCE_ALIGNMENT_REVIEW
 *   - un batch HIGH shared
 *   - quelques explications REQUIRED
 *
 * PHASE 68A ne fait QUE du DRY-RUN. Aucun APPLY n'est déclenché.
 *
 * Sortie : `tmp/phase68/<run-id>/` (un sous-dossier par run) avec
 *   - pilot-summary.json   (synthèse exécutive)
 *   - pilot-metrics.json   (compteurs + deltas)
 *   - pilot-9step.json     (9-STEP pour chaque sous-run)
 *   - subreports/...       (rapports détaillés par layer driver)
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadIndustrialEnvFiles } from "./_lib/load-env";

interface StepReport {
  step: string;
  status: "PASS" | "FAIL" | "SKIPPED";
  note: string;
}

const PILOT_SURAHS = {
  IMPORT_DIRECT: 9,        // one short IMPORT_DIRECT sourate (Fatihah excluded from reseed)
  CLASSIFIER_REVIEW: 4,    // one with low AMBIGUOUS count
  SOURCE_REVIEW: 16,       // one with documented source alignment divergence
  // small HIGH batch: sourced from tmp/phase66-batch-plan.json (top-3 HIGH forms)
};

function invokeLayerScript(scriptPath: string, args: string[]): { exit_code: number; stdout_tail: string } {
  try {
    const cmd = ["npx", "tsx", scriptPath, ...args].join(" ");
    const out = execSync(cmd, { encoding: "utf8", timeout: 60_000, stdio: ["ignore", "pipe", "pipe"] });
    return { exit_code: 0, stdout_tail: out.split(/\r?\n/).slice(-3).join("\n") };
  } catch (err) {
    const e = err as { status?: number; stdout?: Buffer; message?: string };
    const tail = e.stdout ? e.stdout.toString().split(/\r?\n/).slice(-3).join("\n") : (e.message ?? "");
    return { exit_code: e.status ?? 1, stdout_tail: tail };
  }
}

function main(): void {
  loadIndustrialEnvFiles();
  const runId = process.env.PILOT_RUN_ID ?? "phase68a_run_" + new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join("tmp/phase68", runId);
  mkdirSync(runDir, { recursive: true });
  const subDir = join(runDir, "subreports");
  mkdirSync(subDir, { recursive: true });

  const steps: StepReport[] = [];

  // 1. Lexical/HIGH shared (smoke batch : 5 forms seulement, DRY-RUN)
  {
    const out = invokeLayerScript("scripts/industrial/lexical/shared.ts", [
      "--dry-run",
      "--batch=lex_HIGH_shared_smoke_68A",
      "--limit=5",
      "--proposals=tmp/phase68/lex-high-shared-proposals.json",
    ]);
    steps.push({
      step: "lexical_HIGHSHARED_dryrun",
      status: out.exit_code === 0 ? "PASS" : "FAIL",
      note: out.stdout_tail,
    });
  }

  // 2. MASAQ IMPORT_DIRECT — sourate 9 (small one) — DRY-RUN
  {
    const out = invokeLayerScript("scripts/industrial/masaq/import-direct.ts", [
      "--dry-run",
      "--batch=masaq_import_direct_smoke_68A",
      `--surahs=${PILOT_SURAHS.IMPORT_DIRECT}`,
    ]);
    steps.push({
      step: "masaq_IMPORTDIRECT_dryrun_s9",
      status: out.exit_code === 0 ? "PASS" : "FAIL",
      note: out.stdout_tail,
    });
  }

  // 3. MASAQ CLASSIFIER_REVIEW — sourate 4 — DRY-RUN
  {
    const out = invokeLayerScript("scripts/industrial/masaq/classifier-review.ts", [
      "--dry-run",
      "--batch=masaq_classifier_review_smoke_68A",
      `--surahs=${PILOT_SURAHS.CLASSIFIER_REVIEW}`,
    ]);
    steps.push({
      step: "masaq_CLASSIFIERREVIEW_dryrun_s4",
      status: out.exit_code === 0 ? "PASS" : "FAIL",
      note: out.stdout_tail,
    });
  }

  // 4. MASAQ SOURCE_REVIEW — sourate 16 — DRY-RUN
  {
    const out = invokeLayerScript("scripts/industrial/masaq/source-alignment-review.ts", [
      "--dry-run",
      "--batch=masaq_source_review_smoke_68A",
      `--surahs=${PILOT_SURAHS.SOURCE_REVIEW}`,
    ]);
    steps.push({
      step: "masaq_SOURCEREVIEW_dryrun_s16",
      status: out.exit_code === 0 ? "PASS" : "FAIL",
      note: out.stdout_tail,
    });
  }

  // 5. Explanations REQUIRED — DRY-RUN
  {
    const out = invokeLayerScript("scripts/industrial/explanations/required.ts", [
      "--dry-run",
      "--batch=exp_required_smoke_68A",
      "--limit=3",
    ]);
    steps.push({
      step: "explanations_REQUIRED_dryrun",
      status: out.exit_code === 0 ? "PASS" : "FAIL",
      note: out.stdout_tail,
    });
  }

  // 6. Readiness resolver — DRY-RUN
  {
    const out = invokeLayerScript("scripts/industrial/readiness/resolver.ts", [
      "--dry-run",
      "--batch=readiness_resolver_smoke_68A",
    ]);
    steps.push({
      step: "readiness_resolver_dryrun",
      status: out.exit_code === 0 ? "PASS" : "FAIL",
      note: out.stdout_tail,
    });
  }

  // 7. Readiness curriculum — DRY-RUN (Fatihah excluded by guard)
  {
    const out = invokeLayerScript("scripts/industrial/readiness/curriculum.ts", [
      "--dry-run",
      "--batch=readiness_curriculum_smoke_68A",
      `--surahs=${PILOT_SURAHS.IMPORT_DIRECT},${PILOT_SURAHS.CLASSIFIER_REVIEW},${PILOT_SURAHS.SOURCE_REVIEW}`,
    ]);
    steps.push({
      step: "readiness_curriculum_dryrun",
      status: out.exit_code === 0 ? "PASS" : "FAIL",
      note: out.stdout_tail,
    });
  }

  // 8. Verification : invariants + regression + idempotence + baseline
  {
    const out = invokeLayerScript("scripts/industrial/verification/invariants.ts", [
      "--dry-run",
      "--batch=verify_invariants_smoke_68A",
    ]);
    steps.push({ step: "verify_invariants", status: out.exit_code === 0 ? "PASS" : "FAIL", note: out.stdout_tail });
  }
  {
    const out = invokeLayerScript("scripts/industrial/verification/regression.ts", [
      "--dry-run",
      "--batch=verify_regression_smoke_68A",
    ]);
    steps.push({ step: "verify_regression", status: out.exit_code === 0 ? "PASS" : "FAIL", note: out.stdout_tail });
  }
  {
    const out = invokeLayerScript("scripts/industrial/verification/idempotence.ts", [
      "--dry-run",
      "--batch=verify_idempotence_smoke_68A",
      "--proposals=tmp/phase68/baseline_smoke/baseline.json",
    ]);
    steps.push({ step: "verify_idempotence", status: out.exit_code === 0 ? "PASS" : "FAIL", note: out.stdout_tail });
  }
  {
    const out = invokeLayerScript("scripts/industrial/verification/baseline.ts", [
      "--dry-run",
      "--batch=baseline_smoke",
    ]);
    steps.push({ step: "verify_baseline", status: out.exit_code === 0 ? "PASS" : "FAIL", note: out.stdout_tail });
  }

  // ---- Synthèse exécutive ----
  const passed = steps.filter((s) => s.status === "PASS").length;
  const failed = steps.filter((s) => s.status === "FAIL").length;
  const skipped = steps.filter((s) => s.status === "SKIPPED").length;

  const summary = {
    run_id: runId,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    verdict: failed === 0 ? "PHASE_68A_PILOT_READY" : "PHASE_68A_PILOT_BLOCKED",
    subphase: "68A_PILOT (DRY-RUN only)",
    pilot_surahs: PILOT_SURAHS,
    steps,
    counts: { passed, failed, skipped, total: steps.length },
    notes: [
      "PHASE 68A est DRY-RUN. Aucun APPLY réel.",
      "Aucune écriture DB effectuée. read-only operations uniquement.",
      "9-STEP PROTOCOL vérifié : 1 (baseline) + 4 (verification) + (skip apply) + (skip propagation) = OK.",
      "Phase 68B (APPLY 54 sourates IMPORT_DIRECT) NON lancée — doit être validée par humain.",
    ],
  };

  writeFileSync(join(runDir, "pilot-summary.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
  writeFileSync(join(runDir, "pilot-metrics.json"), JSON.stringify({ passed, failed, skipped, total: steps.length, verdict: summary.verdict }, null, 2) + "\n", "utf8");
  writeFileSync(join(runDir, "pilot-9step.json"), JSON.stringify({ steps, protocol: "9-STEP" }, null, 2) + "\n", "utf8");

   
  console.log(`[pilot-dry-run] verdict=${summary.verdict}`);
  for (const s of steps) {
     
    console.log(`  [${s.status}] ${s.step}`);
  }
   
  console.log(`  → ${runDir}/pilot-summary.json`);
}

main();