/**
 * PHASE 88F-W — SURAH-FIRST S70 AL-MA'ARIJ RESOLUTION & IMPORT
 *
 * Target: S70 — Al-Ma'arij (189 forms → 100 % FR → READY).
 *
 * Batch A: 25 lemma_translations (SAFE per 88F-V).
 * Batch B: 13 word_translations for REVIEW forms (word-level, no mapping).
 *
 * APPLY=1 → execute both batches + audit.
 * APPLY=2 → idempotence check (0 writes).
 * Default → DRY_RUN.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const OUTPUT = "reports/phase-88f-w-surah70-resolution.json";
const SOURCE_NAME = "Hikma — lexique éditorial";
const LANGUAGE = "fr";
const PAGE_SIZE = 1000;
const MODE = process.env.APPLY === "1" ? "APPLY" : process.env.APPLY === "2" ? "IDEMPOTENCE" : "DRY_RUN";
const TARGET_SURAH = 70;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

const EXPECTED_BEFORE_S70 = {
  totalForms: 189, coveredForms: 151, missingForms: 38,
  coveragePct: ROUND(151 / 189, 4), readiness: "IN_PREPARATION",
} as const;

// ─── BATCH A — 25 LEMMA_TRANSLATIONS (SAFE per 88F-V) ─────────────────────
const BATCH_A_GLOSSES: Record<string, { lemmaId: string; text: string }> = {
  "قبل":   { lemmaId: "c7343702-80d4-4a1c-855f-d810deda0d60", text: "avant / auparavant / accepter / recevoir" },
  "صدق":   { lemmaId: "5f2c35e4-00d3-45fe-a340-63551704172c", text: "véridique / sincère / confirmer" },
  "جمع":   { lemmaId: "7971f5ef-28d1-4829-bad3-bc3db02938ca", text: "rassembler / réunir / collecter" },
  "حميم":   { lemmaId: "0fc6806a-bec0-440e-a9a9-d1a96c63d367", text: "ami intime / proche / eau bouillante" },
  "بن":     { lemmaId: "1ead6083-63b0-4fd6-9c1c-197231c90849", text: "fils de / enfant de" },
  "قائم":   { lemmaId: "7becf1f6-75f7-4630-b2cb-819e115cb798", text: "debout / qui se tient droit / établi" },
  "نصب":    { lemmaId: "91fbfc50-9597-4233-931f-b0b80a86d3f1", text: "dresser / ériger / fatiguer / peine" },
  "سائل":   { lemmaId: "c58a52e0-9883-4240-a854-f408670b8b2b", text: "qui demande / mendiant / questionneur" },
  "واقع":   { lemmaId: "ca85fb80-a074-4a32-bb51-f67e4632ed49", text: "tombant / survenant / inéluctable" },
  "دافع":   { lemmaId: "29baa3ea-b1d5-4315-8fc4-851f0555dfe3", text: "repousser / écarter / défenseur" },
  "مقدار":  { lemmaId: "febd7b39-bfb8-4a14-9de8-11d882cfaebd", text: "mesure / quantité / durée déterminée" },
  "شهاد":   { lemmaId: "0f74e077-691b-406c-8c22-37622754dfed", text: "témoignage / attestation" },
  "جميل":   { lemmaId: "7da07998-bd03-4a74-968b-36d8ee644440", text: "beau / bon / patient (beau pardon)" },
  "دائم":   { lemmaId: "0213339b-f9f7-4825-b84d-7c82b851a39d", text: "permanent / durable / éternel" },
  "عز":     { lemmaId: "89b54827-00af-4e65-8d06-0a2f2a3c0565", text: "puissant / cher / honorer / fortifier" },
  "معارج":  { lemmaId: "3e11d1cf-fbda-4aea-9685-840f1802f402", text: "degrés / ascensions / voies d'ascension" },
  "فصيل":   { lemmaId: "0fdfc47b-af3c-416d-a898-a37a63c9b0d7", text: "sevré / séparé (du sein) / clan" },
  "لظى":    { lemmaId: "29c441a4-b5d3-4f9e-890a-ad4fa3ef52f8", text: "flamme / brasier / feu ardent" },
  "نزاع":   { lemmaId: "29f521d4-a563-472c-a776-9903cc78324a", text: "arracher / ôter violemment / dispute" },
  "شوى":    { lemmaId: "bed6e0f3-b8be-4fb6-8d52-8ab3b577b658", text: "griller / rôtir / cuir chevelu / extrémités" },
  "هلوع":   { lemmaId: "3f2e65a2-8447-4b5d-83d2-159e1203f9e2", text: "anxieux / impatient / inquiet" },
  "جزوع":   { lemmaId: "dd445a08-f78c-4e73-9de9-17174533c2f7", text: "impatient / qui s'angoisse / prompt à se lamenter" },
  "منوع":   { lemmaId: "361c91c8-a33b-4c67-b17d-d81a54afd743", text: "qui empêche / avare / qui refuse" },
  "مأمون":  { lemmaId: "451e6245-26be-41fd-b78a-8ce1c4e72793", text: "en sécurité / à l'abri / digne de confiance" },
  "مغارب":  { lemmaId: "90e42b9f-578b-440f-8bfc-ff5bd9e60f6e", text: "occidents / couchers / lieux où l'on disparaît" },
};

// ─── BATCH B — 13 WORD_TRANSLATIONS (REVIEW per 88F-V) ────────────────────
const BATCH_B_WORD_TRANSLATIONS: Record<string, { wordId: string; text: string }> = {
  "سأل":   { wordId: "64d6cbd1-7de1-42a6-8be4-044ea8773449", text: "demander / interroger" },
  "عرج":   { wordId: "2fc5c6f8-f002-4097-83ae-ac0ed2dba1e6", text: "monter / s'élever / gravir" },
  "ر":     { wordId: "09e4e5be-fca1-4d42-a03a-439c729d26e9", text: "ils le verront / ils le considéreront" },
  "را":    { wordId: "90c80563-52f6-4141-a6a1-f6984c989fee", text: "et nous le voyons / nous le considérons" },
  "فتدي":  { wordId: "388965bc-ba73-4398-bd8c-67744872f1c0", text: "se racheter / payer une rançon" },
  "ؤوي":   { wordId: "fa4807d6-c4ac-4016-a9da-3d8ffe1990f3", text: "abriter / héberger / donner refuge" },
  "نجي":   { wordId: "8d26b9de-d31a-4a0e-b583-ffe6e419ace3", text: "sauver / délivrer / secourir" },
  "أوعى":  { wordId: "f6680c7c-c20d-4202-918f-22aaa8d5dbe1", text: "amasser / thésauriser / garder avec avarice" },
  "طمع":   { wordId: "e7697ef7-c053-4de8-8e7e-d5793902dc25", text: "convoiter / espérer avidement" },
  "دخل":   { wordId: "4159c124-28b0-4fa1-a3bb-88e90dea262a", text: "entrer / être introduit" },
  "سراع":  { wordId: "58d4e089-bcf7-41b6-b201-baca27e98ed6", text: "rapides / se précipitant / en hâte" },
  "وفض":   { wordId: "27356ceb-bdfb-4423-a462-8dab8bf8cb8d", text: "se hâter / se précipiter / courir" },
  "ذل":    { wordId: "55a4e2ae-d296-49c0-96b6-d5bde85bbb09", text: "humiliation / abaissement / soumission" },
};

const PROTECTED_TABLES = ["quran_words", "word_lemma_mapping", "linguistic_occurrences", "lemmas", "learning_paths", "units", "lessons"] as const;

type DbRow = Record<string, unknown>;
type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccurrenceRow = { id: string; word_id: string; ayah_id: string };
type AyahRow = { id: string; surah_id: string };
type SurahRow = { id: string; number: number; name_transliteration: string | null };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { word_id: string; lemma_id: string };
type WordTranslationRow = { word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null; validated_at?: string | null };
type LemmaTranslationRow = { id: string; lemma_id: string; language: string; text: string; source_id: string | null; is_validated: boolean; validated_at: string | null };
type LinguisticOccurrenceRow = { word_occurrence_id: string; hikma_lemma_id: string | null };
type SourceRow = { id: string; name: string };
type LoadedState = {
  raw: Record<string, DbRow[]>; words: WordRow[]; occurrences: OccurrenceRow[]; ayahs: AyahRow[];
  surahs: SurahRow[]; lemmas: LemmaRow[]; wlm: WlmRow[];
  wordTranslations: WordTranslationRow[]; lemmaTranslations: LemmaTranslationRow[];
  linguisticOccurrences: LinguisticOccurrenceRow[];
};
type TableSnapshot = { count: number; sha256: string };

function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) { try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch { /* OK */ } }
}
async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).order("id").range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const page = (data ?? []) as T[]; rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") { const o = value as Record<string, unknown>; return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stableJson(o[k])}`).join(",")}}`; }
  return JSON.stringify(value);
}
function snapshotRows(rows: DbRow[]): TableSnapshot { return { count: rows.length, sha256: createHash("sha256").update(rows.map(stableJson).sort().join("\n")).digest("hex") }; }
function increment(map: Map<string, number>, key: string): void { map.set(key, (map.get(key) ?? 0) + 1); }

async function loadState(client: SupabaseClient): Promise<LoadedState> {
  const tables = ["quran_words","word_occurrences","ayahs","surahs","lemmas","word_lemma_mapping","word_translations","lemma_translations","linguistic_occurrences","learning_paths","units","lessons"] as const;
  const loaded = await Promise.all(tables.map(async (t) => [t, await selectAll<DbRow>(client, t, "*")] as const));
  const raw = Object.fromEntries(loaded) as Record<string, DbRow[]>;
  return { raw, words: raw.quran_words as unknown as WordRow[], occurrences: raw.word_occurrences as unknown as OccurrenceRow[], ayahs: raw.ayahs as unknown as AyahRow[], surahs: raw.surahs as unknown as SurahRow[], lemmas: raw.lemmas as unknown as LemmaRow[], wlm: raw.word_lemma_mapping as unknown as WlmRow[], wordTranslations: raw.word_translations as unknown as WordTranslationRow[], lemmaTranslations: raw.lemma_translations as unknown as LemmaTranslationRow[], linguisticOccurrences: raw.linguistic_occurrences as unknown as LinguisticOccurrenceRow[] };
}
function getProtectedSnapshots(state: LoadedState): Record<string, TableSnapshot> { return Object.fromEntries(PROTECTED_TABLES.map((t) => [t, snapshotRows(state.raw[t])])); }

function computeCoverage(state: LoadedState, hikmaId: string) {
  const { words, occurrences, ayahs, surahs, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences } = state;
  const oi = new Map(occurrences.map((r) => [r.id, r])), ai = new Map(ayahs.map((r) => [r.id, r]));
  const fl = new Map<string, string>();
  for (const w of words) if (w.lemma_id) fl.set(w.id, w.lemma_id);
  for (const m of wlm) if (!fl.has(m.word_id)) fl.set(m.word_id, m.lemma_id);
  for (const l of linguisticOccurrences) { if (!l.hikma_lemma_id) continue; const o = oi.get(l.word_occurrence_id); if (o && !fl.has(o.word_id)) fl.set(o.word_id, l.hikma_lemma_id); }
  const wf = new Set(wordTranslations.filter((r) => r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId).map((r) => r.word_id));
  const lf = new Set(lemmaTranslations.filter((r) => r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId).map((r) => r.lemma_id));
  const un = new Set(wf); for (const [wid, lid] of fl) if (lf.has(lid)) un.add(wid);
  const oc = new Map<string, number>(); const sf = new Map<number, Set<string>>();
  for (const o of occurrences) { increment(oc, o.word_id); const a = ai.get(o.ayah_id); const s = a ? new Map(surahs.map((x) => [x.id, x])).get(a.surah_id) : undefined; if (s) { let f = sf.get(s.number); if (!f) { f = new Set(); sf.set(s.number, f); } f.add(o.word_id); } }
  let rdy = 0, ip = 0, rf = 0;
  for (const [n, f] of sf) { const c = [...f].filter((w) => un.has(w)).length; if (n === 1) rf++; else if (f.size > 0 && c === f.size) rdy++; else ip++; }
  return { masked: { READY: rdy, IN_PREPARATION: ip, REFERENCE: rf, surahForms: sf, union: un, occCountByWord: oc, finalLemma: fl } };
}
function computeSurahCoverage(state: LoadedState, cov: ReturnType<typeof computeCoverage>, sn: number) {
  const { surahForms, union } = cov.masked as { surahForms: Map<number, Set<string>>; union: Set<string> };
  const f = surahForms.get(sn) ?? new Set(); let c = 0; for (const w of f) if (union.has(w)) c++;
  const s = state.surahs.find((x) => x.number === sn);
  return { number: sn, name: s?.name_transliteration ?? `Surah ${sn}`, totalForms: f.size, coveredForms: c, coveragePct: f.size > 0 ? ROUND(c / f.size) : 1, readiness: sn === 1 ? "REFERENCE" : c === f.size && f.size > 0 ? "READY" : "IN_PREPARATION" };
}

function preflightBatchA(state: LoadedState, hikmaId: string) {
  const lIds = new Set(state.lemmas.map((l) => l.id)); const ex = new Map<string, LemmaTranslationRow[]>();
  for (const r of state.lemmaTranslations) { if (r.language !== LANGUAGE || r.source_id !== hikmaId) continue; let l = ex.get(r.lemma_id); if (!l) { l = []; ex.set(r.lemma_id, l); } l.push(r); }
  const rd: Array<{ arabic: string; lemmaId: string; text: string }> = [], es: Array<{ arabic: string; lemmaId: string; text: string }> = [], cf: string[] = [];
  for (const [a, e] of Object.entries(BATCH_A_GLOSSES)) {
    if (!lIds.has(e.lemmaId)) { cf.push(`${a}: abs`); continue; }
    const rs = ex.get(e.lemmaId) ?? [];
    if (rs.length === 0) { rd.push({ arabic: a, lemmaId: e.lemmaId, text: e.text }); continue; }
    if (rs.length > 1) { cf.push(`${a}: ${rs.length} rows`); continue; }
    if (rs[0].text === e.text && rs[0].is_validated && rs[0].validated_at) es.push({ arabic: a, lemmaId: e.lemmaId, text: e.text });
    else cf.push(`${a}: mismatch`);
  }
  return { ready: rd, existingSame: es, conflicts: cf };
}
function preflightBatchB(state: LoadedState, hikmaId: string) {
  const ex = new Map<string, string>();
  for (const r of state.wordTranslations) { if (r.language === LANGUAGE && r.is_validated && r.source_id === hikmaId) ex.set(r.word_id, r.text); }
  const rd: Array<{ stem: string; wordId: string; text: string }> = [], es: Array<{ stem: string; wordId: string; text: string }> = [], cf: string[] = [];
  for (const [st, e] of Object.entries(BATCH_B_WORD_TRANSLATIONS)) {
    const w = state.words.find((x) => x.id === e.wordId); if (!w) { cf.push(`${st}: abs`); continue; }
    const t = ex.get(e.wordId);
    if (!t) { rd.push({ stem: st, wordId: e.wordId, text: e.text }); continue; }
    if (t === e.text) es.push({ stem: st, wordId: e.wordId, text: e.text }); else cf.push(`${st}: mismatch`);
  }
  return { ready: rd, existingSame: es, conflicts: cf };
}
function validateBatchA(state: LoadedState, hikmaId: string) {
  const tids = new Set(Object.values(BATCH_A_GLOSSES).map((e) => e.lemmaId));
  const rs = state.lemmaTranslations.filter((r) => tids.has(r.lemma_id) && r.language === LANGUAGE && r.source_id === hikmaId);
  const ex = new Map(Object.entries(BATCH_A_GLOSSES).map(([, e]) => [e.lemmaId, e.text]));
  return { present: `${rs.length}/25`, ok: rs.length === 25 && rs.every((r) => r.language === LANGUAGE && r.is_validated && r.validated_at && ex.get(r.lemma_id) === r.text) };
}
function validateBatchB(state: LoadedState, hikmaId: string) {
  const tids = new Set(Object.values(BATCH_B_WORD_TRANSLATIONS).map((e) => e.wordId));
  const rs = state.wordTranslations.filter((r) => tids.has(r.word_id) && r.language === LANGUAGE && r.source_id === hikmaId);
  const ex = new Map(Object.entries(BATCH_B_WORD_TRANSLATIONS).map(([, e]) => [e.wordId, e.text]));
  return { present: `${rs.length}/13`, ok: rs.length === 13 && rs.every((r) => r.language === LANGUAGE && r.is_validated && ex.get(r.word_id) === r.text) };
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const ts = new Date().toISOString();

  console.log(`=== PHASE 88F-W — S${TARGET_SURAH} AL-MA'ARIJ RESOLUTION (${MODE}) ===`);
  console.log(`BATCH A: 25 lemma_translations · BATCH B: 13 word_translations\n`);

  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const h = sources.find((s) => s.name === SOURCE_NAME);
  if (!h) throw new Error(`Source « ${SOURCE_NAME} » introuvable.`);
  const hId = h.id;

  const before = await loadState(client);
  const bc = computeCoverage(before, hId);
  const bp = getProtectedSnapshots(before);
  const bs70 = computeSurahCoverage(before, bc, TARGET_SURAH);
  const bs98 = computeSurahCoverage(before, bc, 98), bs92 = computeSurahCoverage(before, bc, 92), bs82 = computeSurahCoverage(before, bc, 82), bs85 = computeSurahCoverage(before, bc, 85), bs90 = computeSurahCoverage(before, bc, 90);

  const bcs: string[] = [];
  if (bs70.totalForms !== EXPECTED_BEFORE_S70.totalForms) bcs.push("totalForms");
  if (bs70.coveredForms !== EXPECTED_BEFORE_S70.coveredForms) bcs.push("coveredForms");
  if (bs70.totalForms - bs70.coveredForms !== EXPECTED_BEFORE_S70.missingForms) bcs.push("missingForms");
  if (bs70.readiness !== EXPECTED_BEFORE_S70.readiness) bcs.push("readiness");

  if (MODE === "IDEMPOTENCE") { if (bs70.readiness !== "READY") throw new Error("Idempotence: S70 pas READY. Premier APPLY manquant ?"); }
  else if (bcs.length > 0) throw new Error(`Baseline S70 divergente vs 88F-V: ${bcs.join(", ")}. STOP.`);
  if (bs98.readiness !== "READY") throw new Error("S98 pas READY. STOP.");
  if (bs92.readiness !== "READY") throw new Error("S92 pas READY. STOP.");
  if (bs82.readiness !== "READY") throw new Error("S82 pas READY. STOP.");
  if (bs85.readiness !== "READY") throw new Error("S85 pas READY. STOP.");
  if (bs90.readiness !== "READY") throw new Error("S90 pas READY. STOP.");

  const rb = (bc.masked as { READY: number; IN_PREPARATION: number }).READY;
  console.log(`Baseline S70: ${bs70.coveredForms}/${bs70.totalForms} (${ROUND(bs70.coveragePct*100,1)}%) — ${bs70.readiness} · Global READY=${rb}`);

  const pa = preflightBatchA(before, hId), pb = preflightBatchB(before, hId);
  console.log(`Preflight A: READY=${pa.ready.length} SAME=${pa.existingSame.length} CONFLICT=${pa.conflicts.length}`);
  console.log(`Preflight B: READY=${pb.ready.length} SAME=${pb.existingSame.length} CONFLICT=${pb.conflicts.length}`);

  let ia: Array<{ id: string; lemma_id: string }> = [], ib: Array<{ id: string; word_id: string }> = [];

  if (MODE === "APPLY") {
    if (pa.ready.length !== 25 || pa.conflicts.length > 0 || pb.ready.length !== 13 || pb.conflicts.length > 0) throw new Error("Preflight fail.");
    const ra = pa.ready.map((e) => ({ lemma_id: e.lemmaId, language: LANGUAGE, source_id: hId, text: e.text, is_validated: true, validated_at: ts, editorial_notes: `Phase 88F-W — S70 Al-Ma'arij — ${ts}` }));
    const resA = await client.from("lemma_translations").insert(ra).select("id, lemma_id");
    if (resA.error) throw new Error(`INSERT lemma_translations: ${resA.error.message}`);
    ia = (resA.data ?? []) as typeof ia;
    console.log(`BATCH A: ${ia.length} lemma_translations inserted.`);

    const rb = pb.ready.map((e) => ({ word_id: e.wordId, language: LANGUAGE, source_id: hId, text: e.text, is_validated: true, validated_at: ts, editorial_notes: `Phase 88F-W — S70 REVIEW form — ${ts}` }));
    const resB = await client.from("word_translations").insert(rb).select("id, word_id");
    if (resB.error) throw new Error(`INSERT word_translations: ${resB.error.message}`);
    ib = (resB.data ?? []) as typeof ib;
    console.log(`BATCH B: ${ib.length} word_translations inserted.`);
  } else if (MODE === "IDEMPOTENCE") {
    if (pa.ready.length !== 0 || pb.ready.length !== 0) throw new Error("Idempotence: unexpected state.");
    console.log("Second pass: 0 writes.");
  } else { console.log("DRY-RUN: no writes."); }

  const after = await loadState(client);
  const ac = computeCoverage(after, hId);
  const ap = getProtectedSnapshots(after);
  const as70 = computeSurahCoverage(after, ac, TARGET_SURAH);
  const as98 = computeSurahCoverage(after, ac, 98), as92 = computeSurahCoverage(after, ac, 92), as82 = computeSurahCoverage(after, ac, 82), as85 = computeSurahCoverage(after, ac, 85), as90 = computeSurahCoverage(after, ac, 90);
  const va = validateBatchA(after, hId), vb = validateBatchB(after, hId);

  const pd: string[] = [];
  for (const t of PROTECTED_TABLES) { if (bp[t].sha256 !== ap[t].sha256) pd.push(t); }
  const ra = (ac.masked as { READY: number; IN_PREPARATION: number }).READY;

  // Propagation delta
  const bu = (bc.masked as { union: Set<string> }).union;
  const au = (ac.masked as { union: Set<string> }).union;
  const newGlobalForms = [...au].filter((w) => !bu.has(w)).length;

  // Merge idempotence
  let er: Record<string, unknown> = {};
  try { er = JSON.parse(readFileSync(OUTPUT, "utf-8")) as Record<string, unknown>; } catch { /* first */ }

  if (MODE === "IDEMPOTENCE") {
    er.verdict = "PHASE_88F_W_COMPLETE";
    er.idempotence = { mode: "APPLY=2", batchA: { existingSame: pa.existingSame.length, ready: pa.ready.length }, batchB: { existingSame: pb.existingSame.length, ready: pb.ready.length }, new: 0, dataWrites: 0, protectedDelta: pd.length > 0 ? pd : "aucun", s70after: as70 };
  } else {
    const rpt = {
      phase: "88F-W", verdict: as70.readiness === "READY" ? "PHASE_88F_W_COMPLETE" : "PHASE_88F_W_PARTIAL", mode: MODE,
      target: { number: TARGET_SURAH, name: "Al-Ma'arij" }, timestamp: ts, baseline: bs70,
      preflight: { batchA: { ready: pa.ready.length, existingSame: pa.existingSame.length, conflicts: pa.conflicts.length }, batchB: { ready: pb.ready.length, existingSame: pb.existingSame.length, conflicts: pb.conflicts.length } },
      writes: { batchA: ia.length, batchB: ib.length, total: ia.length + ib.length },
      validation: { batchA: va, batchB: vb },
      after: {
        s70: as70, s98: as98, s92: as92, s82: as82, s85: as85, s90: as90,
        global: { frUnionBefore: bu.size, frUnionAfter: au.size, newGlobalForms, readyBefore: rb, readyAfter: ra },
      },
      invariants: { protectedDelta: pd.length > 0 ? pd : "aucun", masaqWrites: 0, curriculumWrites: 0, migrations: 0, seeds: 0 },
      idempotence: null, tests: { run: false, note: "vitest · tsc · eslint" },
    };
    if (er.idempotence) (rpt as Record<string, unknown>).idempotence = er.idempotence;
    mkdirSync("reports", { recursive: true });
    writeFileSync(OUTPUT, JSON.stringify(rpt, null, 2) + "\n");
  }

  console.log(`\nAfter S70: ${as70.coveredForms}/${as70.totalForms} (${ROUND(as70.coveragePct*100,1)}%) — ${as70.readiness}`);
  console.log(`S98=${as98.readiness} S92=${as92.readiness} S82=${as82.readiness} S85=${as85.readiness} S90=${as90.readiness}`);
  console.log(`Global: FR union ${bu.size}→${au.size} (+${newGlobalForms}), READY ${rb}→${ra} (+${ra-rb})`);
  console.log(`Validation A: ${va.ok ? "OK" : "FAIL"} — B: ${vb.ok ? "OK" : "FAIL"} · Protected: ${pd.length > 0 ? pd.join(",") : "aucun"}`);
  console.log(`=== ${as70.readiness === "READY" ? "PHASE_88F_W_COMPLETE — S70 READY" : "PHASE_88F_W_PARTIAL"} ===`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });