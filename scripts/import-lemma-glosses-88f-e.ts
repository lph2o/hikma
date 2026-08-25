/**
 * PHASE 88F-E — SAFE LEMMA GLOSS IMPORT
 *
 * Imports the 57 SAFE candidates classified by PHASE 88F-D
 * (reports/phase-88f-d-editorial-audit.json → candidates.classification ===
 * "SAFE") into `lemma_translations`. Source EXCLUSIVE : the 88F-D report.
 * The list is NEVER rebuilt or re-ranked.
 *
 * WRITE MODEL (contrôlé)
 * ─────────────────────
 * Autorisation : `lemma_translations` uniquement.
 * Interdit     : word_translations, quran_words, word_lemma_mapping,
 *                linguistic_occurrences, lemmas, learning_paths, units,
 *                lessons, migrations, seeds, curriculum.
 *
 * SAFETY MODEL (hérité 88F-B, adapté 88F-E)
 * ─────────────────────────────────────────
 * 1. Preflight anti-divergence : chaque SAFE vérifié (lemma_id existe, langue
 *    fr, source Hikma, texte = exactement la proposition 88F-D, aucune
 *    traduction divergente existante, absence de doublon). Tout écart → STOP,
 *    0 écriture.
 * 2. Gain réel avant INSERT : UNION(word_id) recalculée — comparaison avec
 *    les attendus 88F-D (246 formes / 255 occurrences). Écart → STOP.
 * 3. Atomicité : un seul INSERT bulk (une statement Postgres) — tout ou rien.
 * 4. is_validated=true + validated_at NOT NULL (contrainte DB).
 *
 * Usage :
 *   npx tsx scripts/import-lemma-glosses-88f-e.ts          → DRY-RUN (défaut)
 *   APPLY=1 npx tsx scripts/import-lemma-glosses-88f-e.ts  → import contrôlé
 *   APPLY=1 … (2e passage)                                  → idempotence
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const D_REPORT = "reports/phase-88f-d-editorial-audit.json";
const OUTPUT = "reports/phase-88f-e-import.json";
const APPLY = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "RE_APPLY" : "DRY-RUN";
const SELECT_PAGE_SIZE = 1000;

// Tables dont les métriques NE doivent PAS changer (§9 invariants).
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

type SafeEntry = {
  lemmaId: string;
  arabic: string;
  rank: number;
  proposedFrGloss: string;
  newForms88d: number;
  newOccs88d: number;
};

type Coverage = {
  quranWordsTotal: number;
  wordTranslationsFrValidated: number;
  lemmaTranslationsFrValidated: number;
  formsCoveredByWord: number;
  formsCoveredByLemma: number;
  unionFr: number;
  formsWithoutFr: number;
  occurrencesCovered: number;
  occurrencesTotal: number;
  readySurahs: number;
  inPreparationSurahs: number;
  referenceSurahs: number;
  unionFormIds: string[];
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

/** Résolution finale mot → lemme (direct → WLM → MASAQ indirect). 88F-B/B0. */
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

/** Union FR des formes (word_id dédupliqués). */
async function computeUnionFr(
  client: SupabaseClient,
  hikmaSourceId: string,
): Promise<{ union: Set<string>; viaWord: Set<string>; viaLemma: Set<string> }> {
  const finalLemma = await resolveLemmaMap(client);
  const wtRows = await selectAll<{ word_id: string; language: string; is_validated: boolean }>(client, "word_translations", "word_id, language, is_validated");
  const ltRows = await selectAll<{ lemma_id: string; language: string; is_validated: boolean; source_id: string }>(client, "lemma_translations", "lemma_id, language, is_validated, source_id");

  const viaWord = new Set(wtRows.filter(r => r.language === "fr" && r.is_validated).map(r => r.word_id));
  const ltFrIds = new Set(ltRows.filter(r => r.language === "fr" && r.is_validated && r.source_id === hikmaSourceId).map(r => r.lemma_id));
  const viaLemma = new Set<string>();
  for (const [wid, lid] of finalLemma) if (ltFrIds.has(lid)) viaLemma.add(wid);

  const union = new Set<string>(viaWord);
  for (const wid of viaLemma) union.add(wid);
  return { union, viaWord, viaLemma };
}

/** Snapshot complet de couverture lexicale FR (méthodologie 88E-C/B0/D). */
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

  const mode = APPLY;
  const timestamp = new Date().toISOString();
  console.log(`=== PHASE 88F-E — SAFE LEMMA GLOSS IMPORT (${mode}) ===`);

  // ─── 1. Source exclusive : rapport 88F-D, SAFE uniquement ────────────────
  const d = JSON.parse(readFileSync(D_REPORT, "utf-8"));
  const allCands = (d.candidates ?? []) as Array<{ classification?: string; lemmaId?: unknown; arabic?: unknown; rank?: unknown; proposal?: { gloss?: unknown }; newForms?: unknown; newOccurrences?: unknown }>;
  const safe: SafeEntry[] = [];
  for (const c of allCands) {
    if (c.classification !== "SAFE") continue;
    if (typeof c.lemmaId !== "string" || typeof c.arabic !== "string" || typeof c.proposal?.gloss !== "string") {
      throw new Error("Candidat SAFE 88-D incomplet (lemmaId/arabic/proposal.gloss manquants). STOP.");
    }
    safe.push({
      lemmaId: c.lemmaId,
      arabic: c.arabic,
      rank: typeof c.rank === "number" ? c.rank : 0,
      proposedFrGloss: c.proposal.gloss,
      newForms88d: typeof c.newForms === "number" ? c.newForms : 0,
      newOccs88d: typeof c.newOccurrences === "number" ? c.newOccurrences : 0,
    });
  }

  // ─── 2. Source Hikma ─────────────────────────────────────────────────────
  const { data: srcRows } = await client.from("sources").select("id").eq("name", SOURCE_NAME).limit(1);
  const hikmaSourceId = (srcRows?.[0] as { id: string } | undefined)?.id as string;
  if (!hikmaSourceId) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);

  // ─── 3. Preflight anti-divergence ────────────────────────────────────────
  console.log(`  SAFE (88F-D) : ${safe.length} · attendu 57 — ${safe.length === 57 ? "OK" : "STOP"}`);
  if (safe.length !== 57) throw new Error(`Attendu exactement 57 SAFE — trouvé ${safe.length}. Aucune écriture.`);

  // 3a. lemma_id existants
  const { data: lemmaRows } = await client.from("lemmas").select("id").in("id", safe.map(e => e.lemmaId));
  const lemmaFound = new Set((lemmaRows ?? []).map((l: { id: string }) => l.id));
  const missing = safe.filter(e => !lemmaFound.has(e.lemmaId));
  if (missing.length > 0) throw new Error(`Lemmas absents : ${missing.map(m => m.arabic).join(", ")}. STOP.`);

  // 3b. clé (lemma_id, language=fr, source=Hikma) existante + texte
  const { data: existingRows } = await client
    .from("lemma_translations")
    .select("lemma_id, text")
    .in("lemma_id", safe.map(e => e.lemmaId))
    .eq("language", LANGUAGE)
    .eq("source_id", hikmaSourceId);
  const existingByLemma = new Map<string, string>();
  for (const r of (existingRows ?? []) as Array<{ lemma_id: string; text: string }>) existingByLemma.set(r.lemma_id, r.text);

  const toInsert: SafeEntry[] = [];
  const existingSame: SafeEntry[] = [];
  const conflicts: string[] = [];
  for (const e of safe) {
    const t = existingByLemma.get(e.lemmaId);
    if (t === undefined) { toInsert.push(e); continue; }
    if (t === e.proposedFrGloss) { existingSame.push(e); continue; }
    conflicts.push(`#${e.rank} ${e.arabic} : base « ${t} » ≠ 88F-D « ${e.proposedFrGloss} »`);
  }
  if (conflicts.length > 0) {
    for (const c of conflicts) console.error(`  ${c}`);
    throw new Error(`CONFLIT — ${conflicts.length} traduction(s) divergente(s). STOP, 0 écriture.`);
  }
  console.log(`  Preflight : lemma_ids OK · à insérer=${toInsert.length} · EXISTING_SAME=${existingSame.length} · CONFLICT=0`);

  // ─── 4. Baseline AVANT (couverture + invariants) ─────────────────────────
  const beforeLt = await countRows(client, "lemma_translations");
  const beforeCounts: Record<string, number> = {};
  for (const t of INVARIANT_TABLES) beforeCounts[t] = await countRows(client, t);
  const beforeCoverage = await computeCoverage(client, hikmaSourceId);
  console.log(`  Baseline AVANT : lemma_translations=${beforeLt} · union FR=${beforeCoverage.unionFr} formes · occ couvertes=${beforeCoverage.occurrencesCovered} · READY=${beforeCoverage.readySurahs}`);
  console.log(`  (attendu : 58 / 4986 / 55777 / READY 23 non compté ici)`);

  // ─── 5. Gain réel AVANT INSERT (dédupliqué par word_id, 1 seule passe) ───────
  const safeLemmaSet = new Set(safe.map(e => e.lemmaId));
  const finalLemmaBefore = await resolveLemmaMap(client);
  const occCountBefore = new Map<string, number>();
  const occIdsBefore = await selectAll<{ word_id: string }>(client, "word_occurrences", "word_id");
  for (const o of occIdsBefore) occCountBefore.set(o.word_id, (occCountBefore.get(o.word_id) ?? 0) + 1);
  const beforeUnionSet = new Set(beforeCoverage.unionFormIds); // Set construit une fois

  let trueNewForms = 0, trueNewOccs = 0;
  const trueNewFormIds: string[] = [];
  for (const [wid, lid] of finalLemmaBefore) {
    if (!safeLemmaSet.has(lid)) continue;
    if (beforeUnionSet.has(wid)) continue; // déjà couvert (via word ou autre lemme)
    trueNewForms++;
    trueNewOccs += occCountBefore.get(wid) ?? 0;
    trueNewFormIds.push(wid);
  }
  console.log(`  TRUE_NEW (recalculé, word_id dédupliqué) : ${trueNewForms} formes · ${trueNewOccs} occurrences`);
  console.log(`  Attendu 88F-D : 246 formes · 255 occurrences`);
  // Premier passage (état pré-import) : le gain doit être exactement 246/255.
  // Passages suivants (idempotence, APPLY ou RE_APPLY sur état déjà en place) :
  // l'état est déjà acquis → gain 0/0 acceptable.
  const gainAlreadyInPlace = trueNewForms === 0 && trueNewOccs === 0 && existingSame.length === 57 && toInsert.length === 0;
  if (!((trueNewForms === 246 && trueNewOccs === 255) || gainAlreadyInPlace)) {
    throw new Error(`Divergence gain vs baseline 88F-D (${trueNewForms}/${trueNewOccs} vs 246/255) — rapport de réconciliation nécessaire, STOP.`);
  }

  // ─── 6. INSERT atomique (tout ou rien) ───────────────────────────────────────
  if (toInsert.length > 0 && (mode === "APPLY" || mode === "RE_APPLY")) {
    const rows = toInsert.map(e => ({
      lemma_id: e.lemmaId,
      language: LANGUAGE,
      text: e.proposedFrGloss,
      source_id: hikmaSourceId,
      is_validated: true,
      validated_at: timestamp,
      editorial_notes: `Phase 88F-E — import SAFE 88F-D validé — ${timestamp}`,
    }));
    const { error } = await client.from("lemma_translations").insert(rows);
    if (error) {
      if (error.code === "23505") console.error("Conflit d'unicité — la statement a échoué en entier, aucune écriture partielle.");
      throw new Error(`lemma_translations insert : ${error.message}`);
    }
    console.log(`  INSERT : ${rows.length} lignes (is_validated=true, validated_at défini).`);
  } else if (toInsert.length > 0) {
    console.log(`  DRY-RUN (mode=${mode}) : ${toInsert.length} lignes seraient insérées ; APPLY=1 / APPLY=2 pour écrire.`);
  } else {
    console.log("  Rien à insérer : toutes les clés (lemma, fr, Hikma) existent déjà avec le même texte.");
  }

  // ─── 7. Snapshot APRÈS + validation post-import ──────────────────────────────
  const afterLt = await countRows(client, "lemma_translations");
  const afterCounts: Record<string, number> = {};
  for (const t of INVARIANT_TABLES) afterCounts[t] = await countRows(client, t);
  const afterCoverage = await computeCoverage(client, hikmaSourceId);

  const validation: Record<string, { ok: boolean; detail: string }> = {};

  // A. 57 lemma_id présents (fr, Hikma).
  const { data: postRows } = await client
    .from("lemma_translations")
    .select("lemma_id, language, text, source_id, is_validated, validated_at")
    .in("lemma_id", safe.map(e => e.lemmaId))
    .eq("language", LANGUAGE)
    .eq("source_id", hikmaSourceId);
  const postList = (postRows ?? []) as Array<{ lemma_id: string; language: string; text: string; source_id: string; is_validated: boolean; validated_at: string | null }>;
  const missingAfter = safe.filter(e => !postList.some(r => r.lemma_id === e.lemmaId));
  validation.A = { ok: missingAfter.length === 0, detail: `${postList.length}/57 lemma_id présents` };

  // B. language=fr · source=Hikma · is_validated=true (+validated_at).
  const badB = postList.filter(r => r.language !== "fr" || r.source_id !== hikmaSourceId || !r.is_validated || !r.validated_at);
  validation.B = { ok: badB.length === 0, detail: `langue/source/validation OK pour ${postList.length - badB.length}/${postList.length}` };

  // C. Texte = proposition 88F-D exacte.
  const textByLemma = new Map(safe.map(e => [e.lemmaId, e.proposedFrGloss]));
  const badC = postList.filter(r => textByLemma.get(r.lemma_id) !== r.text);
  validation.C = { ok: badC.length === 0, detail: badC.length ? `textes différents : ${badC.map(m => m.lemma_id).join(", ")}` : "57/57 textes identiques à 88F-D" };

  // D. Doublons (lemma_id, language, source_id) = 0 — sur toute la table.
  const allLtRows = await selectAll<{ lemma_id: string; language: string; source_id: string }>(client, "lemma_translations", "lemma_id, language, source_id");
  const keyCount = new Map<string, number>();
  for (const r of allLtRows) {
    const k = `${r.lemma_id}|${r.language}|${r.source_id}`;
    keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
  }
  const dupKeys = [...keyCount.entries()].filter(([, c]) => c > 1);
  validation.D = { ok: dupKeys.length === 0, detail: `clés dupliquées = ${dupKeys.length}` };

  // E. Conflits = 0 (textes divergents sur les 57 clés).
  const postByLemma = new Map(postList.map(r => [r.lemma_id, r.text]));
  const badE = safe.filter(e => postByLemma.get(e.lemmaId) !== e.proposedFrGloss);
  validation.E = { ok: badE.length === 0, detail: `${badE.length} conflits` };

  // F. Orphelins = 0.
  const allLemmas = await selectAll<{ id: string }>(client, "lemmas", "id");
  const lemmaIdSet = new Set(allLemmas.map(l => l.id));
  const orphanLt = allLtRows.filter(r => !lemmaIdSet.has(r.lemma_id));
  validation.F = { ok: orphanLt.length === 0, detail: `orphelines = ${orphanLt.length}` };

  // ─── 8. Gain réel constaté (déduplication par word_id) ──────────────────────
  const afterUnion = new Set(afterCoverage.unionFormIds);
  const newFormIds = [...afterUnion].filter(w => !beforeUnionSet.has(w));
  const occCountAfter = new Map<string, number>();
  const occIdsAfter = await selectAll<{ word_id: string }>(client, "word_occurrences", "word_id");
  for (const o of occIdsAfter) occCountAfter.set(o.word_id, (occCountAfter.get(o.word_id) ?? 0) + 1);
  const gainOccurrences = newFormIds.reduce((s, w) => s + (occCountAfter.get(w) ?? 0), 0);

  const gainPerLemma = safe.map(e => {
    const forms = newFormIds.filter(w => finalLemmaBefore.get(w) === e.lemmaId);
    const occs = forms.reduce((s, w) => s + (occCountAfter.get(w) ?? 0), 0);
    return {
      rank: e.rank, lemmaId: e.lemmaId, arabic: e.arabic,
      d88Forms: e.newForms88d, d88Occs: e.newOccs88d,
      actualForms: forms.length, actualOccs: occs,
      diff: forms.length !== e.newForms88d || occs !== e.newOccs88d,
    };
  });

  const gainMatchesExpected = newFormIds.length === 246 && gainOccurrences === 255 && gainPerLemma.every(g => !g.diff);

  // ─── 9. Contrôles d'intégrité (orphelins/duplicatas) ────────────────────────
  const wlmKeyCount = new Map<string, number>();
  const wlmRows = await selectAll<{ word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "word_id, lemma_id");
  for (const m of wlmRows) {
    const k = `${m.word_id}|${m.lemma_id}`;
    wlmKeyCount.set(k, (wlmKeyCount.get(k) ?? 0) + 1);
  }
  const dupWlm = [...wlmKeyCount.values()].filter(v => v > 1).length;
  const wlmByWord = new Map<string, string>();
  for (const m of wlmRows) wlmByWord.set(m.word_id, m.lemma_id);
  let contradictory = 0;
  const directRows = await selectAll<{ id: string; lemma_id: string | null }>(client, "quran_words", "id, lemma_id");
  for (const w of directRows) {
    const via = wlmByWord.get(w.id);
    if (w.lemma_id && via && w.lemma_id !== via) contradictory++;
  }

  // ─── 10. Verdict ─────────────────────────────────────────────────────────────
  const validationsOk = Object.values(validation).every(v => v.ok);
  const invariantsOk = INVARIANT_TABLES.every(t => afterCounts[t] - beforeCounts[t] === 0);
  const invariantDelta: Record<string, number> = {};
  for (const t of INVARIANT_TABLES) invariantDelta[t] = afterCounts[t] - beforeCounts[t];

  // Verdict : état final conforme = soit l'import vient d'écrire (57 lignes, gain
  // 246/255), soit l'état était déjà en place (57 EXISTING_SAME, delta 0) — les
  // deux configurations attestent du même état attendu.
  const firstRunOk = (mode === "APPLY") && (toInsert.length > 0 || existingSame.length === 57) && (gainMatchesExpected || gainAlreadyInPlace);
  // Le rapport principal ne doit PAS perdre la traçabilité du premier passage
  // (57 insertions, gain 246/255) quand il est régénéré à l'identique (idempotence).
  const importTrace = {
    expectedInserted: 57,
    expectedGainForms: 246,
    expectedGainOccs: 255,
  };
  const reRunOk = (mode === "RE_APPLY") && toInsert.length === 0 && existingSame.length === 57;
  const verdict = (firstRunOk || reRunOk) && validationsOk && invariantsOk && conflicts.length === 0
    ? "PHASE_88F_E_COMPLETE"
    : "PHASE_88F_E_BLOCKED";

  // ─── 11. Rapport ────────────────────────────────────────────────────────────
  const report = {
    phase: "88F-E",
    mode,
    timestamp,
    verdict,
    source: D_REPORT,
    baseline: {
      lemmaTranslations: beforeLt,
      frFormsUnion: beforeCoverage.unionFr,
      frOccurrences: beforeCoverage.occurrencesCovered,
      readySurahs: beforeCoverage.readySurahs,
      inPreparationSurahs: beforeCoverage.inPreparationSurahs,
    },
    preflight: {
      safeCandidates: safe.length,
      lemmaIdsFound: safe.length - missing.length,
      toInsert,
      existingSame: existingSame.map(e => e.lemmaId),
      conflicts,
      conflictCount: conflicts.length,
      glossExactMatch: conflicts.length === 0,
      language: LANGUAGE,
      source: SOURCE_NAME,
      validated: true,
    },
    trueNew: {
      expected: { forms: 246, occurrences: 255 },
      computed: { forms: trueNewForms, occurrences: trueNewOccs },
      matches: trueNewForms === 246 && trueNewOccs === 255,
      alreadyInPlace: gainAlreadyInPlace,
    },
    import: {
      inserted: (mode === "APPLY" || mode === "RE_APPLY") ? toInsert.length : 0,
      existingSame: existingSame.length,
      conflicts: conflicts.length,
      errors: 0,
      atomicity: "INSERT bulk unique (une seule statement Postgres) — atomique",
      trace: importTrace,
    },
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
        matchesExpected: gainMatchesExpected,
      },
      surahReady: { before: beforeCoverage.readySurahs, after: afterCoverage.readySurahs },
      surahInPreparation: { before: beforeCoverage.inPreparationSurahs, after: afterCoverage.inPreparationSurahs },
      expected: { formsAfter: 5232, occurrencesAfter: 56032, readyAfter: 23 },
    },
    gainPerLemma,
    validation,
    integrityChecks: {
      duplicateWordLemmaMapping: dupWlm,
      contradictoryDirectWlm: contradictory,
    },
    invariants: { ok: invariantsOk, delta: invariantDelta },
    tests: { run: false, note: "exécutés après import (vitest · tsc · eslint)" },
  };

  mkdirSync("reports", { recursive: true });
  // Rapport séparé par mode : l'identémence ne doit jamais écraser le rapport
  // d'import réel (clobbering évité comme 88F-B).
  if (mode === "APPLY") {
    writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  } else if (mode === "RE_APPLY") {
    writeFileSync(OUTPUT.replace(".json", "-idempotence.json"), JSON.stringify(report, null, 2) + "\n");
  }

  console.log(`\n=== RÉSULTAT ===`);
  console.log(`  lemma_translations : ${beforeLt} → ${afterLt} (delta ${afterLt - beforeLt})`);
  console.log(`  Gain constaté : +${newFormIds.length} formes · +${gainOccurrences} occurrences`);
  console.log(`  Verdict : ${verdict}`);
  if (mode === "APPLY") console.log(`  Rapport → ${OUTPUT}`);
  if (mode === "RE_APPLY") console.log(`  Rapport → ${OUTPUT.replace(".json", "-idempotence.json")}`);
  if (mode === "DRY-RUN" && toInsert.length > 0) console.log("  DRY-RUN — relancer avec APPLY=1 pour importer réellement (ou APPLY=2 pour ré-application).");
}

function stripUnion(c: Coverage): Omit<Coverage, "unionFormIds"> {
  const { unionFormIds: _ignored, ...rest } = c;
  void _ignored;
  return rest;
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(1); });