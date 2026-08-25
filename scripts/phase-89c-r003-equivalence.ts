/**
 * PHASE 89C — R-003 : baseline BEFORE / AFTER de `getCoverageBySurah`.
 *
 * STRICTEMENT READ-ONLY (DATABASE_WRITES = 0). Aucune écriture DB.
 *
 * Usage :
 *   npx tsx scripts/phase-89c-r003-equivalence.ts before
 *     → exécute la version COURANTE de getCoverageBySurah sur des datasets
 *       réels (lecture seule) et écrit reports/phase-89c-baseline-before.json
 *   npx tsx scripts/phase-89c-r003-equivalence.ts after
 *     → ré-exécute APRÈS le correctif de chunking et compare chaque cas à la
 *       baseline (équivalence stricte), écrit reports/phase-89c-equivalence-after.json
 *
 * Les entrées sont déterministes : premiers N word_ids distincts (triés) de
 * `quran_words` — mêmes entrées pour before et after, la DB n'étant pas modifiée.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import { getCoverageBySurah } from "../lib/learning/queries";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(file); }
    catch { /* absent */ }
  }
}

const PAGE = 1000;

type CaseResult = {
  inputCount: number;
  distinctCount: number;
  status: "ok" | "error";
  result: unknown[] | null;
  error: string | null;
};

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode !== "before" && mode !== "after") {
    throw new Error("usage : tsx scripts/phase-89c-r003-equivalence.ts before|after");
  }

  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("URL/ANON requis (lecture).");
  const client = createClient(url, anon, { auth: { persistSession: false } });

  // ---- Entrées déterministes : premiers word_ids distincts triés de quran_words ----
  const allIds: string[] = [];
  let from = 0;
  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = (await client.from("quran_words" as any).select("id").range(from, from + PAGE - 1)) as unknown as {
      data: Array<{ id: string }> | null; error: { message: string } | null };
    if (error) throw new Error(`quran_words read : ${error.message}`);
    allIds.push(...(data ?? []).map((r) => r.id));
    if ((data ?? []).length < PAGE) break;
    from += PAGE;
  }
  const ids = [...new Set(allIds)].sort();

  const cases: Array<{ name: string; input: string[] }> = [
    { name: "empty", input: [] },
    { name: "single", input: ids.slice(0, 1) },
    { name: "small", input: ids.slice(0, 10) },
    { name: "medium", input: ids.slice(0, 200) },
    { name: "boundary_minus_1", input: ids.slice(0, 249) },
    { name: "boundary_exact", input: ids.slice(0, 250) },
    { name: "boundary_plus_1", input: ids.slice(0, 251) },
    { name: "large_multichunk", input: ids.slice(0, 500) },
    { name: "duplicated_input", input: [...ids.slice(0, 250), ...ids.slice(0, 250)] },
    { name: "no_occurrences", input: ["00000000-0000-0000-0000-000000000000"] },
  ];

  const results: Record<string, CaseResult> = {};
  for (const c of cases) {
    const distinct = new Set(c.input).size;
    try {
      const result = await getCoverageBySurah(client, c.input);
      results[c.name] = {
        inputCount: c.input.length,
        distinctCount: distinct,
        status: "ok",
        result: result as unknown[],
        error: null,
      };
      console.log(`${mode} | ${c.name.padEnd(22)} input=${c.input.length} → OK (${result.length} sourates)`);
    } catch (err) {
      results[c.name] = {
        inputCount: c.input.length,
        distinctCount: distinct,
        status: "error",
        result: null,
        error: err instanceof Error ? err.message : String(err),
      };
      console.log(`${mode} | ${c.name.padEnd(22)} input=${c.input.length} → ERROR : ${results[c.name].error}`);
    }
  }

  const summary = { mode, generatedAt: new Date().toISOString(), cases: results };

  if (mode === "before") {
    fs.writeFileSync("reports/phase-89c-baseline-before.json", JSON.stringify(summary, null, 2));
    console.log("Baseline BEFORE écrite : reports/phase-89c-baseline-before.json");
    return;
  }

  // ---- after : comparaison stricte avec la baseline ----
  const baseline = JSON.parse(fs.readFileSync("reports/phase-89c-baseline-before.json", "utf8")) as {
    cases: Record<string, CaseResult>;
  };
  type Verdict = "EQUAL" | "FIXED_BY_R003" | "REGRESSION";
  const comparison: Array<{ name: string; before: string; after: string; verdict: Verdict }> = [];
  let regressions = 0;
  for (const c of cases) {
    const b = baseline.cases[c.name];
    const a = results[c.name];
    const bShape = b.status === "ok" ? JSON.stringify(b.result) : `ERROR:${b.error}`;
    const aShape = a.status === "ok" ? JSON.stringify(a.result) : `ERROR:${a.error}`;
    let verdict: Verdict;
    if (bShape === aShape) {
      verdict = "EQUAL";
    } else if (b.status === "error" && a.status === "ok") {
      // Avant : échec (fetch failed, bug R-003) → après : succès. C'est le
      // correctif, pas une régression.
      verdict = "FIXED_BY_R003";
    } else {
      verdict = "REGRESSION";
      regressions += 1;
    }
    comparison.push({ name: c.name, before: bShape.slice(0, 120), after: aShape.slice(0, 120), verdict });
    console.log(`${c.name.padEnd(22)} ${verdict}`);
  }

  // ---- Vérification indépendante du cas 500 ids (split en 2 moitiés) ----
  const big = results.large_multichunk;
  const splitCheck: Record<string, unknown> = { applicable: big.status === "ok" };
  if (big.status === "ok") {
    const half = Math.floor(ids.slice(0, 500).length / 2);
    const [left, right] = await Promise.all([
      getCoverageBySurah(client, ids.slice(0, half)),
      getCoverageBySurah(client, ids.slice(half, 500)),
    ]);
    const bigBySurah = new Map((big.result ?? []).map((r) => [
      (r as { surahNumber: number }).surahNumber,
      (r as { coveredAyahs: number }).coveredAyahs,
    ]));
    const leftBySurah = new Map(left.map((r) => [r.surahNumber, r.coveredAyahs]));
    const rightBySurah = new Map(right.map((r) => [r.surahNumber, r.coveredAyahs]));
    const unionSurahs = new Set([...leftBySurah.keys(), ...rightBySurah.keys()]);
    const surahSetEqual =
      unionSurahs.size === bigBySurah.size &&
      [...unionSurahs].every((n) => bigBySurah.has(n));
    // Borne de l'union : |A∪B| ≤ |A|+|B| et |A∪B| ≥ max(|A|,|B|).
    const countBoundsOk = [...unionSurahs].every((n) => {
      const bigCount = bigBySurah.get(n) ?? 0;
      const l = leftBySurah.get(n) ?? 0;
      const r = rightBySurah.get(n) ?? 0;
      return bigCount >= Math.max(l, r) && bigCount <= l + r;
    });
    splitCheck.surahSetEqual = surahSetEqual;
    splitCheck.countBoundsOk = countBoundsOk;
    splitCheck.surahCount500 = bigBySurah.size;
    console.log(`split-check 500 ids : surahSetEqual=${surahSetEqual} countBoundsOk=${countBoundsOk}`);
  }

  const globalPass = regressions === 0;
  fs.writeFileSync(
    "reports/phase-89c-equivalence-after.json",
    JSON.stringify(
      { mode: "after", generatedAt: new Date().toISOString(), globalPass, regressions, comparison, splitCheck, cases: results },
      null,
      2,
    ),
  );
  console.log(`ÉQUIVALENCE GLOBALE : ${globalPass ? "PASS (0 régression)" : `FAIL (${regressions} régression(s))`} → reports/phase-89c-equivalence-after.json`);
}

main().catch((err) => {
  console.error("Erreur :", err instanceof Error ? err.message : err);
  process.exit(1);
});
