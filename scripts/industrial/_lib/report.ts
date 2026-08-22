/**
 * scripts/industrial/_lib/report.ts
 *
 * Standard report shape for every Phase 68 industrial batch.
 *
 * Every layer driver emits a `IndustrialBatchReport` JSON.
 * Stored under `tmp/phase68/<batch-id>/{baseline,plan,proposals,...}.json`.
 *
 * This module is I/O-light: it only writes JSON files. NEVER writes to DB.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CanonicalCounters } from "./counters";

export interface IndustrialBatchContext {
  /** Identifier (`lex_high_A`, `masaq_import_w7`, etc.). Required. */
  batch_id: string;
  /** Parent layer (LEXICAL | MASAQ | EXPLANATIONS | READINESS | VERIFICATION). */
  layer: "LEXICAL" | "MASAQ" | "EXPLANATIONS" | "READINESS" | "VERIFICATION";
  /** Authorised subset of canonical tables this batch is allowed to write to. */
  owned_tables: ReadonlySet<string>;
  /** Phase 68 subphase (`68A_PILOT`, `68B_IMPORT_DIRECT`, `68C_CLASSIFIER_REVIEW`, …) */
  subphase: string;
  /** Human-readable note (1 line). */
  notes: string;
}

export interface IndustrialBatchReport {
  context: IndustrialBatchContext;
  started_at: string;
  finished_at: string | null;
  status: "DRAFT" | "DRY_RUN_OK" | "APPLIED" | "APPLIED_FAILED" | "BLOCKED";
  applied: boolean;
  plan_summary: {
    scope_string: string;
    counts_by_table: Record<string, number>;
  };
  baseline: CanonicalCounters | null;
  after: CanonicalCounters | null;
  deltas: { table: string; delta: number }[];
  invariants: {
    owned_only: { unexpected: { table: string; delta: number }[]; expected: { table: string; delta: number }[] };
    status: "PASS" | "FAIL";
  };
  warnings: string[];
  errors: string[];
  verify_9step: Array<{ step: string; status: "PASS" | "FAIL" | "SKIPPED"; note: string }>;
}

export function emptyReport(context: IndustrialBatchContext): IndustrialBatchReport {
  return {
    context,
    started_at: new Date().toISOString(),
    finished_at: null,
    status: "DRAFT",
    applied: false,
    plan_summary: { scope_string: "(empty)", counts_by_table: {} },
    baseline: null,
    after: null,
    deltas: [],
    invariants: {
      owned_only: { unexpected: [], expected: [] },
      status: "PASS",
    },
    warnings: [],
    errors: [],
    verify_9step: [],
  };
}

export const NINE_STEP_PROTOCOL = [
  "1. BASELINE    : capture counter snapshot AVANT",
  "2. DRY-RUN     : calculer plan sans écrire",
  "3. SCOPE       : afficher périmètre (sourates, tables, UNIQUE constraints)",
  "4. CONFIRM     : humain valide (jamais auto-validation)",
  "5. APPLY       : exécuter l'écriture idempotente",
  "6. VERIFY      : revérifier les counters vs baseline",
  "7. PROPAGATION : recalculer readiness (S10 du plan Phase 67)",
  "8. IDEMPOTENCE : re-run → 0 nouveau write (UNIQUE respecté)",
  "9. NON-REGRESS : tsc/eslint/vitest + tests canoniques (assertPlanScope)",
] as const;

/**
 * Persists the report at `tmp/phase68/<batch-id>/<name>.json`.
 */
export function persistReport(batchId: string, name: string, payload: unknown): void {
  const dir = join("tmp/phase68", batchId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const p = join(dir, name);
  writeFileSync(p, JSON.stringify(payload, null, 2) + "\n", "utf8");
}
