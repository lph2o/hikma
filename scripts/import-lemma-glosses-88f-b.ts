/**
 * Phase 88F-B — SAFE LEMMA GLOSS IMPORT
 *
 * Imports the 30 READY_FOR_IMPORT proposals validated by Phase 88F-B0
 * (reports/phase-88f-b0-reconciliation.json) into `lemma_translations`.
 * First real lexical writes since the start of the 88F series.
 *
 * SAFETY MODEL
 * ────────────
 * 1. Source EXCLUSIVE : reports/phase-88f-b0-reconciliation.json (entries with
 *    status READY_FOR_IMPORT only). No editorial recomputation.
 * 2. Anti-divergence : before any write, every (lemma_id, language, source_id)
 *    key is probed (lemma_id ∈ 30, language='fr', source=Hikma).
 *    EXISTING_SAME → skipped (no duplicate). CONFLICT (different text) → ABORT,
 *    0 writes. Never overwrites an existing translation. No destructive upsert.
 * 3. Atomicity : the rows are written in ONE bulk .insert([...]). Supabase-js
 *    maps this to a single Postgres `INSERT ... VALUES (…),(…)…` statement,
 *    which is atomic : either all rows land or none (a unique-constraint
 *    violation aborts the whole statement). No partial write can remain.
 * 4. is_validated=true requires validated_at NOT NULL (DB check constraint) —
 *    both are set.
 *
 * Usage :
 *   npx tsx scripts/import-lemma-glosses-88f-b.ts          → DRY-RUN (default)
 *   APPLY=1 npx tsx scripts/import-lemma-glosses-88f-b.ts  → real import
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const B0_REPORT = "reports/phase-88f-b0-reconciliation.json";
const OUTPUT = "reports/phase-88f-b-import.json";
const APPLY = process.env.APPLY === "1";
const SELECT_PAGE_SIZE = 1000;

// Tables whose metrics MUST NOT change during this import (§5 invariants).
const INVARIANT_TABLES = [
  "word_translations",
  "quran_words",
  "word_lemma_mapping",
  "linguistic_occurrences",
  "lemmas",
  "learning_paths",
  "units",
  "lessons",
] as const;

type B0Entry = {
  rank: number;
  lemmaId: string;
  arabic: string;
  proposedFrGloss: string;
  status: string;
  lemmaExists: boolean;
  existingLtCount: number;
  existingLtTexts: string[];
  trueNewForms: number;
  trueNewOccs: number;
};

type Coverage = {
  quranWordsTotal: number;
  wordTranslationsFrValidated: number; // lignes word_translations FR validées (= word_id distincts ici)
  lemmaTranslationsFrValidated: number; // lignes lemma_translations FR validées
  formsCoveredByWord: number; // word_id distincts couverts via word_translation
  formsCoveredByLemma: number; // word_id distincts couverts via lemma_translation
  unionFr: number; // word_id distincts couverts (union dédupliquée, jamais d'addition simple)
  formsWithoutFr: number;
  occurrencesCovered: number;
  occurrencesTotal: number;
  readySurahs: number; // 100 % des formes résolvent en FR (hors sourate 1)
  inPreparationSurahs: number;
  referenceSurahs: number; // sourate 1 uniquement
  unionFormIds: string[]; // word_id couverts (pour le calcul du gain)
};

function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch { /* ok */ }
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += SELECT_PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < SELECT_PAGE_SIZE) break;
  }
  return rows;
}

async function countRows(client: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await client.from(table).select("id", { count: "exact", head: true });
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return count ?? 0;
}

/**
 * Résolution finale mot → lemme, identique à 88E-C / B0 :
 * direct (quran_words.lemma_id) → word_lemma_mapping → MASAQ indirect
 * (linguistic_occurrences.hikma_lemma_id). Premier gagnant, jamais d'écrasement.
 */
async function resolveLemmaMap(client: SupabaseClient): Promise<Map<string, string>> {
  const wordRows = await selectAll<{ id: string; lemma_id: string | null }>(client, "quran_words", "id, lemma_id");
  const wlmRows = await selectAll<{ word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "word_id, lemma_id");
  const occRows = await selectAll<{ id: string; word_id: string }>(client, "word_occurrences", "id, word_id");
  const masaqRows = await selectAll<{ word_occurrence_id: string; hikma_lemma_id: string | null }>(
    client, "linguistic_occurrences", "word_occurrence_id, hikma_lemma_id");

  const finalLemma = new Map<string, string>();
  for (const w of wordRows) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlmRows) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  const occToWord = new Map(occRows.map(o => [o.id, o.word_id]));
  for (const m of masaqRows) {
    if (!m.hikma_lemma_id) continue;
    const wid = occToWord.get(m.word_occurrence_id);
    if (wid && !finalLemma.has(wid)) finalLemma.set(wid, m.hikma_lemma_id);
  }
  return finalLemma;
}

/**
 * Union FR des formes (word_id dédupliqués) : word_translations FR validées
 * ∪ formes dont le lemme résolu possède une lemma_translation FR validée.
 */
async function computeUnionFr(
  client: SupabaseClient,
  hikmaSourceId: string,
): Promise<{ union: Set<string>; viaWord: Set<string>; viaLemma: Set<string> }> {
  const finalLemma = await resolveLemmaMap(client);
  const wtRows = await selectAll<{ word_id: string; language: string; is_validated: boolean }>(client, "word_translations", "word_id, language, is_validated");
  const ltRows = await selectAll<{ lemma_id: string; language: string; is_validated: boolean; source_id: string }>(client, "lemma_translations", "lemma_id, language, is_validated, source_id");

  const viaWord = new Set(wtRows.filter(r => r.language === "fr" && r.is_validated).map(r => r.word_id));
  const ltFrIds = new Set(
    ltRows.filter(r => r.language === "fr" && r.is_validated && r.source_id === hikmaSourceId).map(r => r.lemma_id),
  );
  const viaLemma = new Set<string>();
  for (const [wid, lid] of finalLemma) if (ltFrIds.has(lid)) viaLemma.add(wid);

  const union = new Set<string>(viaWord);
  for (const wid of viaLemma) union.add(wid);
  return { union, viaWord, viaLemma };
}

/** Snapshot complet de couverture lexicale FR (méthodologie 88E-C/B0). */
async function computeCoverage(client: SupabaseClient, hikmaSourceId: string): Promise<Coverage> {
  const wordRows = await selectAll<{ id: string }>(client, "quran_words", "id");
  const occRows = await selectAll<{ id: string; word_id: string; ayah_id: string }>(client, "word_occurrences", "id, word_id, ayah_id");
  const ayahRows = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");
  const surahRows = await selectAll<{ id: string; number: number }>(client, "surahs", "id, number");
  const ltRows = await selectAll<{ language: string; is_validated: boolean }>(client, "lemma_translations", "language, is_validated");
  const { union, viaWord, viaLemma } = await computeUnionFr(client, hikmaSourceId);

  const occCountByWord = new Map<string, number>();
  for (const o of occRows) occCountByWord.set(o.word_id, (occCountByWord.get(o.word_id) ?? 0) + 1);

  let occurrencesCovered = 0;
  for (const wid of union) occurrencesCovered += occCountByWord.get(wid) ?? 0;

  const surahNumById = new Map(surahRows.map(s => [s.id, s.number]));
  const ayahToSurah = new Map(ayahRows.map(a => [a.id, a.surah_id]));
  const surahForms = new Map<number, Set<string>>();
  for (const o of occRows) {
    const sid = ayahToSurah.get(o.ayah_id);
    const sn = sid ? surahNumById.get(sid) : undefined;
    if (sn === undefined) continue;
    let set = surahForms.get(sn);
    if (!set) { set = new Set(); surahForms.set(sn, set); }
    set.add(o.word_id);
  }

  let ready = 0, inPrep = 0, reference = 0;
  for (const [sn, forms] of surahForms) {
    let covered = 0;
    for (const wid of forms) if (union.has(wid)) covered++;
    const pct = forms.size > 0 ? covered / forms.size : 1;
    if (sn === 1) reference++;
    else if (pct >= 1) ready++;
    else inPrep++;
  }

  return {
    quranWordsTotal: wordRows.length,
    wordTranslationsFrValidated: viaWord.size,
    lemmaTranslationsFrValidated: ltRows.filter(r => r.language === "fr" && r.is_validated).length,
    formsCoveredByWord: viaWord.size,
    formsCoveredByLemma: viaLemma.size,
    unionFr: union.size,
    formsWithoutFr: wordRows.length - union.size,
    occurrencesCovered,
    occurrencesTotal: occRows.length,
    readySurahs: ready,
    inPreparationSurahs: inPrep,
    referenceSurahs: reference,
    unionFormIds: [...union],
  };
}

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  const client = createClient(url, key, { auth: { persistSession: false } });

  const mode = APPLY ? "APPLY" : "DRY-RUN";
  const timestamp = new Date().toISOString();
  console.log(`=== PHASE 88F-B — SAFE LEMMA GLOSS IMPORT (${mode}) ===`);

  // ─── 1. Source : rapport B0, READY_FOR_IMPORT uniquement ─────────────────
  const b0 = JSON.parse(readFileSync(B0_REPORT, "utf-8"));
  const allEntries = (b0.entries ?? []) as B0Entry[];
  const ready = allEntries.filter(e => e.status === "READY_FOR_IMPORT");
  const excluded = allEntries.filter(e => e.status !== "READY_FOR_IMPORT");
  if (ready.length !== 30 || excluded.length !== 0) {
    throw new Error(`B0 doit fournir exactement 30 READY_FOR_IMPORT (trouvé ${ready.length} ready, ${excluded.length} exclues). Aucune écriture.`);
  }
  if (ready.some(e => !e.lemmaExists)) throw new Error("B0 signale des lemma_id inexistants. Aucune écriture.");
  const trueNewFormsB0 = ready.reduce((s, e) => s + e.trueNewForms, 0);
  const trueNewOccsB0 = ready.reduce((s, e) => s + e.trueNewOccs, 0);
  console.log(`  Propositions : ${allEntries.length} | READY_FOR_IMPORT : ${ready.length} | exclues : ${excluded.length}`);
  console.log(`  Baseline B0  : TRUE_NEW_FORMS=${trueNewFormsB0} · TRUE_NEW_OCCURRENCES=${trueNewOccsB0}`);

  // ─── 2. Source Hikma ─────────────────────────────────────────────────────
  const { data: srcRows } = await client.from("sources").select("id").eq("name", SOURCE_NAME).limit(1);
  const hikmaSourceId = (srcRows?.[0] as { id: string } | undefined)?.id as string;
  if (!hikmaSourceId) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);

  // ─── 3. Anti-divergence (lemma_ids existants + clés (lemma,fr,hikma)) ────
  const lemmaIds = ready.map(e => e.lemmaId);
  const { data: lemmaRows } = await client.from("lemmas").select("id").in("id", lemmaIds);
  const lemmaFound = new Set((lemmaRows ?? []).map((l: { id: string }) => l.id));
  const missingLemmas = lemmaIds.filter(l => !lemmaFound.has(l));
  if (missingLemmas.length > 0) throw new Error(`Lemmas absents : ${missingLemmas.join(", ")}. Aucune écriture.`);

  const { data: existingRows } = await client
    .from("lemma_translations")
    .select("lemma_id, text")
    .in("lemma_id", lemmaIds)
    .eq("language", LANGUAGE)
    .eq("source_id", hikmaSourceId);
  const existingByLemma = new Map<string, string>(); // lemma_id → text
  for (const r of (existingRows ?? []) as Array<{ lemma_id: string; text: string }>) {
    existingByLemma.set(r.lemma_id, r.text);
  }

  const existingSame: B0Entry[] = [];
  const conflicts: string[] = [];
  const toInsert: B0Entry[] = [];
  for (const e of ready) {
    const existingText = existingByLemma.get(e.lemmaId);
    if (existingText === undefined) { toInsert.push(e); continue; }
    if (existingText === e.proposedFrGloss) { existingSame.push(e); continue; }
    conflicts.push(`#${e.rank} ${e.arabic} : base « ${existingText} » ≠ B0 « ${e.proposedFrGloss} »`);
  }
  if (conflicts.length > 0) {
    console.error(`CONFLIT — ${conflicts.length} traduction(s) existante(s) divergent :`);
    for (const c of conflicts) console.error(`  ${c}`);
    console.error("→ PHASE_88F_B_BLOCKED — aucune écriture (rollback), aucun doublon créé.");
    process.exit(1);
  }
  console.log(`  Pré-vol : lemma_ids OK (${lemmaIds.length}) · à insérer=${toInsert.length} · EXISTING_SAME=${existingSame.length} · CONFLICT=0`);

  // ─── 4. Snapshot AVANT (invariants + couverture) ─────────────────────────
  const beforeCounts: Record<string, number> = {};
  for (const t of INVARIANT_TABLES) beforeCounts[t] = await countRows(client, t);
  const beforeLt = await countRows(client, "lemma_translations");
  const beforeCoverage = await computeCoverage(client, hikmaSourceId);
  console.log(`  AVANT : lemma_translations=${beforeLt} · ${INVARIANT_TABLES.join("/")} = ${INVARIANT_TABLES.map(t => beforeCounts[t]).join("/")}`);
  console.log(`  Union FR avant = ${beforeCoverage.unionFormIds.length} formes (${beforeCoverage.formsWithoutFr} sans FR)`);

  // ─── 5. INSERT atomique unique (tout ou rien) ────────────────────────────
  if (toInsert.length > 0 && APPLY) {
    const nowIso = new Date().toISOString();
    const rows = toInsert.map(e => ({
      lemma_id: e.lemmaId,
      language: LANGUAGE,
      text: e.proposedFrGloss,
      source_id: hikmaSourceId,
      is_validated: true,
      validated_at: nowIso,
      editorial_notes: `Phase 88F-B — import B0 validé — ${timestamp}`,
    }));
    const { error: insErr } = await client.from("lemma_translations").insert(rows);
    if (insErr) {
      if (insErr.code === "23505") {
        console.error("Conflit d'unicité pendant l'INSERT (course) — la statement a échoué en entier, aucune écriture partielle.");
      }
      throw new Error(`lemma_translations insert : ${insErr.message}`);
    }
    console.log(`  INSERT : ${rows.length} lignes validées (is_validated=true, validated_at défini).`);
  } else if (toInsert.length > 0) {
    console.log(`  DRY-RUN : ${toInsert.length} lignes seraient insérées (APPLY=1 pour écrire) :`);
    for (const e of toInsert) console.log(`    #${e.rank.toString().padStart(3)} ${e.arabic.padEnd(22)} → « ${e.proposedFrGloss} »`);
  } else {
    console.log("  Rien à insérer (les 30 clés existent déjà avec le même texte).");
  }

  // ─── 6. Snapshot APRÈS + validation post-import A→F ──────────────────────
  const afterCounts: Record<string, number> = {};
  for (const t of INVARIANT_TABLES) afterCounts[t] = await countRows(client, t);
  const afterLt = await countRows(client, "lemma_translations");
  const afterCoverage = await computeCoverage(client, hikmaSourceId);

  const validation: Record<string, { ok: boolean; detail: string }> = {};

  // A. Les 30 lemma_ids présents (FR, source Hikma).
  const { data: postRows } = await client
    .from("lemma_translations")
    .select("lemma_id, language, text, source_id, is_validated, validated_at")
    .in("lemma_id", lemmaIds)
    .eq("language", LANGUAGE)
    .eq("source_id", hikmaSourceId);
  const postList = (postRows ?? []) as Array<{ lemma_id: string; language: string; text: string; source_id: string; is_validated: boolean; validated_at: string | null }>;
  const missingAfter = lemmaIds.filter(l => !postList.some(r => r.lemma_id === l));
  validation.A = {
    ok: missingAfter.length === 0,
    detail: `${postList.length}/30 lemma_id présents${missingAfter.length ? ` — absents : ${missingAfter.join(", ")}` : ""}`,
  };

  // B. language=fr · source=Hikma · is_validated=true (validated_at défini).
  const badB = postList.filter(r => r.language !== "fr" || r.source_id !== hikmaSourceId || !r.is_validated || !r.validated_at);
  validation.B = { ok: badB.length === 0, detail: `langue/source/validation OK pour ${postList.length - badB.length}/${postList.length}` };

  // C. Texte = proposition B0 exacte.
  const textByLemma = new Map(ready.map(e => [e.lemmaId, e.proposedFrGloss]));
  const badC = postList.filter(r => textByLemma.get(r.lemma_id) !== r.text);
  validation.C = { ok: badC.length === 0, detail: badC.length ? `textes différents : ${badC.map(m => m.lemma_id).join(", ")}` : "30/30 textes identiques à B0" };

  // D. Doublons (lemma_id, language, source_id) = 0 — sur toute la table.
  const allLtRows = await selectAll<{ lemma_id: string; language: string; source_id: string }>(client, "lemma_translations", "lemma_id, language, source_id");
  const keyCount = new Map<string, number>();
  for (const r of allLtRows) {
    const k = `${r.lemma_id}|${r.language}|${r.source_id}`;
    keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
  }
  const dupKeys = [...keyCount.entries()].filter(([, c]) => c > 1);
  validation.D = { ok: dupKeys.length === 0, detail: `clés dupliquées (lemma_id,language,source_id) = ${dupKeys.length}` };

  // E. Traductions conflictuelles = 0 (textes divergents sur l'une des 30 clés).
  const postByLemma = new Map(postList.map(r => [r.lemma_id, r.text]));
  const badE = ready.filter(e => postByLemma.get(e.lemmaId) !== e.proposedFrGloss);
  validation.E = { ok: badE.length === 0, detail: `conflits = ${badE.length}` };

  // F. Orphelins = 0 (lemma_translation dont le lemma_id n'existe pas).
  const allLemmas = await selectAll<{ id: string }>(client, "lemmas", "id");
  const lemmaIdSet = new Set(allLemmas.map(l => l.id));
  const orphanLt = allLtRows.filter(r => !lemmaIdSet.has(r.lemma_id));
  validation.F = { ok: orphanLt.length === 0, detail: `lemma_translations orphelines = ${orphanLt.length}` };

  // ─── 7. Gain réel (dédupliqué par word_id) et diagnostic vs B0 ───────────
  const beforeUnion = new Set(beforeCoverage.unionFormIds);
  const afterUnion = new Set(afterCoverage.unionFormIds);
  const newFormIds = [...afterUnion].filter(w => !beforeUnion.has(w));

  const occCountByWord = new Map<string, number>();
  const occIds = await selectAll<{ word_id: string }>(client, "word_occurrences", "word_id");
  for (const o of occIds) occCountByWord.set(o.word_id, (occCountByWord.get(o.word_id) ?? 0) + 1);
  const gainOccurrences = newFormIds.reduce((s, w) => s + (occCountByWord.get(w) ?? 0), 0);

  // Diagnostic par lemme : compare les gains réellement constatés aux 30 entrées B0.
  const finalLemma = await resolveLemmaMap(client);
  const gainPerLemma = ready.map(e => {
    const forms = newFormIds.filter(w => finalLemma.get(w) === e.lemmaId);
    const occs = forms.reduce((s, w) => s + (occCountByWord.get(w) ?? 0), 0);
    return {
      rank: e.rank,
      lemmaId: e.lemmaId,
      arabic: e.arabic,
      b0Forms: e.trueNewForms,
      b0Occs: e.trueNewOccs,
      actualForms: forms.length,
      actualOccs: occs,
      diff: forms.length !== e.trueNewForms || occs !== e.trueNewOccs,
    };
  });
  const gainMatchesBaseline =
    newFormIds.length === trueNewFormsB0 && gainOccurrences === trueNewOccsB0 && gainPerLemma.every(g => !g.diff);
  if (!gainMatchesBaseline) {
    console.error(`⚠ ÉCART vs baseline B0 : gain réel ${newFormIds.length} formes / ${gainOccurrences} occ ↔ attendu 183 / 221.`);
    for (const g of gainPerLemma.filter(x => x.diff)) {
      console.error(`  #${g.rank} ${g.arabic} : B0=${g.b0Forms}/${g.b0Occs} · réel=${g.actualForms}/${g.actualOccs}`);
    }
  }

  // ─── 8. Invariants ───────────────────────────────────────────────────────
  const invariantDelta: Record<string, number> = {};
  let invariantsOk = true;
  for (const t of INVARIANT_TABLES) {
    invariantDelta[t] = afterCounts[t] - beforeCounts[t];
    if (invariantDelta[t] !== 0) invariantsOk = false;
  }
  console.log(`  Invariants : ${Object.entries(invariantDelta).map(([t, d]) => `${t}=${d}`).join(" · ")}`);

  // ─── 9. Verdict ──────────────────────────────────────────────────────────
  const validationsOk = Object.values(validation).every(v => v.ok);
  // 1er passage : écritures effectuées + gain == baseline.
  // Re-run (état déjà en place) : EXISTING_SAME=30, delta 0 — l'état final EST
  // celui attendu ; le gain a été acquis lors du 1er passage. Les deux cas
  // constituent un état conforme → PHASE_88F_B_COMPLETE.
  const firstRunComplete = APPLY && toInsert.length > 0 && gainMatchesBaseline;
  const reRunComplete = APPLY && toInsert.length === 0 && existingSame.length === 30;
  const verdict =
    (firstRunComplete || reRunComplete) && validationsOk && invariantsOk && conflicts.length === 0
      ? "PHASE_88F_B_COMPLETE"
      : "PHASE_88F_B_BLOCKED";

  // ─── 10. Rapport ─────────────────────────────────────────────────────────
  const report = {
    phase: "88F-B",
    mode,
    timestamp,
    verdict,
    baselineB0: {
      totalProposals: allEntries.length,
      readyForImport: ready.length,
      trueNewForms: trueNewFormsB0,
      trueNewOccurrences: trueNewOccsB0,
    },
    import: {
      proposals: ready.length,
      inserted: APPLY ? toInsert.length : 0,
      existingSame: existingSame.length,
      existingSameLemmaIds: existingSame.map(e => e.lemmaId),
      conflict: conflicts.length,
      conflicts,
      errors: 0,
    },
    atomicityNote: "INSERT bulk unique (une seule statement Postgres) — atomique, aucune écriture partielle possible",
    snapshotDb: {
      before: { lemma_translations: beforeLt, ...beforeCounts },
      after: { lemma_translations: afterLt, ...afterCounts },
      lemmaTranslationsDelta: afterLt - beforeLt,
      invariantDelta,
    },
    coverage: {
      before: stripUnion(beforeCoverage),
      after: stripUnion(afterCoverage),
      gain: {
        newForms: newFormIds.length,
        newOccurrences: gainOccurrences,
        newFormIds,
        matchesBaselineB0: gainMatchesBaseline,
      },
      surahReady: { before: beforeCoverage.readySurahs, after: afterCoverage.readySurahs },
      surahInPreparation: { before: beforeCoverage.inPreparationSurahs, after: afterCoverage.inPreparationSurahs },
    },
    gainPerLemma,
    validation: { A: validation.A, B: validation.B, C: validation.C, D: validation.D, E: validation.E, F: validation.F },
    invariants: { ok: invariantsOk, delta: invariantDelta },
    tests: { run: false, note: "exécutés après import (vitest · tsc · eslint)" },
  };
  mkdirSync("reports", { recursive: true });
  // N'écrire le rapport que sur APPLY : un DRY-RUN ne doit pas écraser un
  // rapport d'import réel déjà généré (clobbering constaté en re-test).
  if (APPLY) writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\n=== RÉSULTAT ===`);
  console.log(`  lemma_translations : ${beforeLt} → ${afterLt} (delta ${afterLt - beforeLt})`);
  console.log(`  Gain réel (word_id dédupliqué) : +${newFormIds.length} formes · +${gainOccurrences} occurrences`);
  console.log(`  Verdict : ${verdict}`);
  if (APPLY) console.log(`  Rapport → ${OUTPUT}`);
  if (!APPLY && toInsert.length > 0) console.log("  DRY-RUN — relancer avec APPLY=1 pour importer réellement.");
  if (APPLY && toInsert.length === 0) console.log("  Idempotence OK : 2e passage sans écriture (EXISTING_SAME), état stable.");
}

function stripUnion(c: Coverage): Omit<Coverage, "unionFormIds"> {
  const { unionFormIds: _ignored, ...rest } = c;
  void _ignored;
  return rest;
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(1); });