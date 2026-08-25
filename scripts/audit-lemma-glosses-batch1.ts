// Phase 88B — Diagnostic TOP 50 LEMMES par CROSS_SURAH_VALUE.
//
// READ-ONLY STRICT : aucune écriture DB. Aucune modification de données.
// Sortie : `reports/phase-88b-batch1-lemma-proposals.json`
//
// Usage :
//   npx tsx scripts/audit-lemma-glosses-batch1.ts            → diagnostic complet
//   npx tsx scripts/audit-lemma-glosses-batch1.ts --verbose   → log détaillé
//
// CROSS_SURAH_VALUE = distinctSurahs × log2(1 + distinctForms) × log2(1 + occurrences)
//   × (1 − fractionAlreadyCovered)
//
// Cette formule privilégie :
//   1. Nombre de sourates touchées (cross-surah)
//   2. Nombre de formes distinctes (couverture potentielle)
//   3. Nombre d'occurrences (fréquence réelle)
//   4. Absence de couverture FR existante (ne pas prioriser ce qui est déjà fait)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

// ─── Types ─────────────────────────────────────────────────────────────────

type LemmaRow = {
  lemma_id: string;
  arabic: string;
};

type FormInfo = {
  word_id: string;
  arabic: string;
  surah_ids: string[];
  surah_numbers: number[];
  ayah_ids: string[];
  occurrence_count: number;
  has_form_fr: boolean;
  has_lemma_fr: boolean;
};

type LemmaDiagnostic = {
  lemmaId: string;
  arabic: string;
  lemmaGlossValidated: boolean;
  lemmaGlossText: string | null;
  distinctSurahs: number;
  surahNumbers: number[];
  distinctForms: number;
  formIds: string[];
  totalOccurrences: number;
  formsWithFormFr: number;
  formsWithLemmaFr: number;
  formsAlreadyCovered: number;
  formsMissing: number;
  crossSurahValue: number;
  editorialClass: "SAFE" | "REVIEW_REQUIRED" | "HIGH_RISK" | "DO_NOT_IMPORT";
  proposedGloss: string | null;
  supportingSources: string[];
};

type SurahCoverageSim = {
  surahNumber: number;
  name: string;
  totalForms: number;
  formsWithFrBefore: number;
  formsWithFrAfter: number;
  effectiveFrPctBefore: number;
  effectiveFrPctAfter: number;
  statusBefore: "READY" | "IN_PREPARATION" | "REFERENCE";
  statusAfter: "READY" | "IN_PREPARATION" | "REFERENCE";
  newlyReady: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const SOURCE_EDITORIAL = "Hikma — lexique éditorial";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch { /* absent — ok */ }
  }
}

const VERBOSE = process.argv.includes("--verbose");

function classifyStatus(surahNumber: number, pct: number): "REFERENCE" | "READY" | "IN_PREPARATION" {
  if (surahNumber === 1) return "REFERENCE";
  if (pct === 100) return "READY";
  return "IN_PREPARATION";
}

function crossSurahValue(
  distinctSurahs: number,
  distinctForms: number,
  totalOccurrences: number,
  fractionAlreadyCovered: number,
): number {
  if (distinctSurahs === 0) return 0;
  const uncoveredFactor = 1 - fractionAlreadyCovered;
  if (uncoveredFactor <= 0) return 0; // déjà entièrement couvert
  return (
    distinctSurahs *
    Math.log2(1 + distinctForms) *
    Math.log2(1 + totalOccurrences) *
    uncoveredFactor
  );
}

function editorialClass(lemma: {
  distinctForms: number;
  formsAlreadyCovered: number;
  formsMissing: number;
  distinctSurahs: number;
}): "SAFE" | "REVIEW_REQUIRED" | "HIGH_RISK" | "DO_NOT_IMPORT" {
  // Haute couverture déjà existante → probablement SAFE
  const coverageExisting = lemma.formsAlreadyCovered / Math.max(1, lemma.distinctForms);
  if (coverageExisting >= 0.6) return "SAFE";
  // Très peu de formes + beaucoup de sourates → probablement mot-outil SAFE
  if (lemma.distinctForms <= 3 && lemma.distinctSurahs >= 30) return "SAFE";
  // Beaucoup de formes → risque de polysémie
  if (lemma.distinctForms >= 20) return "HIGH_RISK";
  return "REVIEW_REQUIRED";
}

// ─── Queries ────────────────────────────────────────────────────────────────

async function getSourceId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_EDITORIAL)
    .limit(1);
  if (error) throw new Error(`sources: ${error.message}`);
  const source = (data as Array<{ id: string }> | null)?.[0];
  if (!source) throw new Error(`Source « ${SOURCE_EDITORIAL} » introuvable.`);
  return source.id;
}

async function getLemmaMapping(client: SupabaseClient): Promise<{
  direct: Map<string, string>;   // word_id → lemma_id (quran_words.lemma_id)
  mapping: Map<string, string>;  // word_id → lemma_id (word_lemma_mapping safe)
  allById: Map<string, LemmaRow>;
}> {
  const direct = new Map<string, string>();
  const mapping = new Map<string, string>();
  const allById = new Map<string, LemmaRow>();

  // Lemmas (tous).
  const { data: lemmas, error: lemmaErr } = await client
    .from("lemmas")
    .select("id, arabic");
  if (lemmaErr) throw new Error(`lemmas: ${lemmaErr.message}`);
  for (const l of (lemmas ?? []) as Array<{ id: string; arabic: string }>) {
    allById.set(l.id, { lemma_id: l.id, arabic: l.arabic });
  }

  // Direct quran_words.lemma_id.
  const { data: words, error: wordErr } = await client
    .from("quran_words")
    .select("id, lemma_id");
  if (wordErr) throw new Error(`quran_words: ${wordErr.message}`);
  for (const w of (words ?? []) as Array<{ id: string; lemma_id: string | null }>) {
    if (w.lemma_id) direct.set(w.id, w.lemma_id);
  }

  // Surcouche word_lemma_mapping (safe uniquement).
  const { data: wlm, error: wlmErr } = await client
    .from("word_lemma_mapping")
    .select("word_id, lemma_id")
    .eq("confidence", "safe");
  if (wlmErr) throw new Error(`word_lemma_mapping: ${wlmErr.message}`);
  for (const m of (wlm ?? []) as Array<{ word_id: string; lemma_id: string }>) {
    // Ne jamais écraser un lemma_id direct.
    if (!direct.has(m.word_id)) mapping.set(m.word_id, m.lemma_id);
  }

  return { direct, mapping, allById };
}

/** Résout le lemma_id effectif d'un word_id (direct prioritaire, puis mapping safe). */
function effectiveLemma(
  wordId: string,
  direct: Map<string, string>,
  mapping: Map<string, string>,
): string | null {
  return direct.get(wordId) ?? mapping.get(wordId) ?? null;
}

async function getFormFrMap(client: SupabaseClient, sourceId: string): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  const { data, error } = await client
    .from("word_translations")
    .select("word_id")
    .eq("language", "fr")
    .eq("is_validated", true)
    .eq("source_id", sourceId);
  if (error) throw new Error(`word_translations: ${error.message}`);
  for (const r of (data ?? []) as Array<{ word_id: string }>) {
    map.set(r.word_id, true);
  }
  return map;
}

async function getLemmaFrMap(client: SupabaseClient, sourceId: string): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  const { data, error } = await client
    .from("lemma_translations")
    .select("lemma_id")
    .eq("language", "fr")
    .eq("is_validated", true)
    .eq("source_id", sourceId);
  if (error) throw new Error(`lemma_translations: ${error.message}`);
  for (const r of (data ?? []) as Array<{ lemma_id: string }>) {
    map.set(r.lemma_id, true);
  }
  return map;
}

async function getLemmaGlosses(client: SupabaseClient, sourceId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const { data, error } = await client
    .from("lemma_translations")
    .select("lemma_id, text")
    .eq("language", "fr")
    .eq("source_id", sourceId);
  if (error) throw new Error(`lemma_translations glosses: ${error.message}`);
  for (const r of (data ?? []) as Array<{ lemma_id: string; text: string }>) {
    map.set(r.lemma_id, r.text);
  }
  return map;
}

async function getSurahsMap(client: SupabaseClient): Promise<Map<string, { number: number; name: string; ayah_count: number }>> {
  const map = new Map();
  const { data, error } = await client
    .from("surahs")
    .select("id, number, name_transliteration, ayah_count");
  if (error) throw new Error(`surahs: ${error.message}`);
  for (const s of (data ?? []) as Array<{ id: string; number: number; name_transliteration: string | null; ayah_count: number }>) {
    map.set(s.id, { number: s.number, name: s.name_transliteration ?? `Sourate ${s.number}`, ayah_count: s.ayah_count });
  }
  return map;
}

// ─── Main Diagnostic ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  }
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });

  console.log("=== PHASE 88B — DIAGNOSTIC TOP 50 LEMMES (READ-ONLY) ===\n");

  // 0. Préparation.
  const sourceId = await getSourceId(client);
  console.log(`  source éditoriale : ${sourceId.slice(0, 8)}…`);

  const { direct, mapping, allById: lemmaById } = await getLemmaMapping(client);
  console.log(`  lemmas en base   : ${lemmaById.size}`);
  console.log(`  lemma_id directs : ${direct.size}`);
  console.log(`  lemma_id mappings: ${mapping.size}`);

  const formFrMap = await getFormFrMap(client, sourceId);
  const lemmaFrMap = await getLemmaFrMap(client, sourceId);
  const lemmaGlosses = await getLemmaGlosses(client, sourceId);
  console.log(`  word_translations FR validées  : ${formFrMap.size}`);
  console.log(`  lemma_translations FR validées : ${lemmaFrMap.size}`);

  // 1. Occurrences groupées par word_id (limite batch pour performance).
  //    On ne peut pas charger 17k × N lignes ; on agrège côté DB.
  console.log("\n  → calcul des statistiques par word_id…");

  // Récupère tous les word_id avec leurs infos de base.
  const { data: allWords, error: allErr } = await client
    .from("quran_words")
    .select("id, arabic");
  if (allErr) throw new Error(`quran_words: ${allErr.message}`);
  const wordIds = (allWords ?? []).map((w: { id: string }) => w.id);
  console.log(`  quran_words total : ${wordIds.length}`);

  // Récupère toutes les occurrences groupées.
  const { data: occRows, error: occErr } = await client
    .from("word_occurrences")
    .select("word_id, ayah_id, ayahs!inner(surah_id)");
  if (occErr) throw new Error(`word_occurrences: ${occErr.message}`);

  type OccRow = { word_id: string; ayah_id: string; ayahs: Array<{ surah_id: string }> };
  const occs = (occRows ?? []) as unknown as OccRow[];

  // Agrège : word_id → { surahs: Set<id>, ayahs: Set<id>, count }
  const wordStats = new Map<string, { surahs: Set<string>; ayahs: Set<string>; count: number }>();
  for (const o of occs) {
    const s = wordStats.get(o.word_id) ?? { surahs: new Set(), ayahs: new Set(), count: 0 };
    const surahRel = Array.isArray(o.ayahs) ? o.ayahs[0] : o.ayahs;
    if (surahRel) s.surahs.add(surahRel.surah_id);
    s.ayahs.add(o.ayah_id);
    s.count += 1;
    wordStats.set(o.word_id, s);
  }

  // 2. Groupe par lemme effectif.
  const lemmaForms = new Map<string, FormInfo[]>();
  const noLemmaForms: FormInfo[] = [];

  for (const w of (allWords ?? []) as Array<{ id: string; arabic: string }>) {
    const lemmaId = effectiveLemma(w.id, direct, mapping);
    const stats = wordStats.get(w.id) ?? { surahs: new Set(), ayahs: new Set(), count: 0 };
    const surahIds = [...stats.surahs];

    const formInfo: FormInfo = {
      word_id: w.id,
      arabic: w.arabic,
      surah_ids: surahIds,
      surah_numbers: [], // rempli après
      ayah_ids: [...stats.ayahs],
      occurrence_count: stats.count,
      has_form_fr: formFrMap.has(w.id),
      has_lemma_fr: lemmaId ? lemmaFrMap.has(lemmaId) : false,
    };

    if (lemmaId) {
      const arr = lemmaForms.get(lemmaId) ?? [];
      arr.push(formInfo);
      lemmaForms.set(lemmaId, arr);
    } else {
      noLemmaForms.push(formInfo);
    }
  }

  console.log(`  lemmas avec ≥1 forme  : ${lemmaForms.size}`);
  console.log(`  formes sans lemma      : ${noLemmaForms.length}`);

  // 3. Résout les surah_numbers pour chaque forme.
  const surahsMap = await getSurahsMap(client);
  const surahNumberById = new Map([...surahsMap].map(([id, s]) => [id, s.number]));

  for (const forms of lemmaForms.values()) {
    for (const f of forms) {
      f.surah_numbers = f.surah_ids
        .map((sid) => surahNumberById.get(sid) ?? 0)
        .filter((n) => n > 0)
        .sort((a, b) => a - b);
    }
  }
  for (const f of noLemmaForms) {
    f.surah_numbers = f.surah_ids
      .map((sid) => surahNumberById.get(sid) ?? 0)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
  }

  // 4. Construit les diagnostics par lemme.
  const diagnostics: LemmaDiagnostic[] = [];

  for (const [lemmaId, forms] of lemmaForms) {
    const lemma = lemmaById.get(lemmaId);
    if (!lemma) continue;

    const surahSet = new Set<number>();
    let totalOccs = 0;
    let formsWithFormFr = 0;
    let formsWithLemmaFr = 0;
    let formsAlreadyCovered = 0;

    for (const f of forms) {
      for (const sn of f.surah_numbers) surahSet.add(sn);
      totalOccs += f.occurrence_count;
      if (f.has_form_fr) formsWithFormFr++;
      if (f.has_lemma_fr) formsWithLemmaFr++;
      if (f.has_form_fr || f.has_lemma_fr) formsAlreadyCovered++;
    }

    const surahNumbers = [...surahSet].sort((a, b) => a - b);
    const distinctForms = forms.length;
    const formsMissing = distinctForms - formsAlreadyCovered;
    const fractionCovered = distinctForms > 0 ? formsAlreadyCovered / distinctForms : 0;

    const value = crossSurahValue(surahNumbers.length, distinctForms, totalOccs, fractionCovered);

    // Glose de lemme existante.
    const existingGloss = lemmaGlosses.get(lemmaId) ?? null;
    const lemmaValidated = lemmaFrMap.has(lemmaId);

    // Classification éditoriale.
    let cls = editorialClass({
      distinctForms,
      formsAlreadyCovered,
      formsMissing,
      distinctSurahs: surahNumbers.length,
    });
    // Si une glose validée existe déjà → SAFE (elle fonctionne déjà)
    if (lemmaValidated && existingGloss) cls = "SAFE";

    // Proposition de glose (simpliste : si déjà une glose, la réutiliser).
    const proposedGloss = existingGloss;

    diagnostics.push({
      lemmaId,
      arabic: lemma.arabic,
      lemmaGlossValidated: lemmaValidated,
      lemmaGlossText: existingGloss,
      distinctSurahs: surahNumbers.length,
      surahNumbers,
      distinctForms,
      formIds: forms.map((f) => f.word_id),
      totalOccurrences: totalOccs,
      formsWithFormFr,
      formsWithLemmaFr,
      formsAlreadyCovered,
      formsMissing,
      crossSurahValue: Math.round(value * 100) / 100,
      editorialClass: cls,
      proposedGloss,
      supportingSources: existingGloss
        ? [`lemma_translations (${SOURCE_EDITORIAL})`]
        : [],
    });
  }

  // Trie par CROSS_SURAH_VALUE décroissant.
  diagnostics.sort((a, b) => b.crossSurahValue - a.crossSurahValue);

  // 5. TOP 50.
  const top50 = diagnostics.slice(0, 50);
  console.log(`\n─── TOP 50 LEMMES ───\n`);
  console.log(
    ` Rang │ Lemme (arabe)          │ Surahs │ Forms │ Occs │ Missing │ CSV    │ Classe`,
  );
  console.log(`──────┼────────────────────────┼────────┼───────┼──────┼─────────┼────────┼────────`);
  for (let i = 0; i < top50.length; i++) {
    const d = top50[i];
    const arabic = d.arabic.padEnd(22).slice(0, 22);
    console.log(
      ` ${String(i + 1).padStart(3)} │ ${arabic} │ ${String(d.distinctSurahs).padStart(5)}  │ ${String(d.distinctForms).padStart(4)}  │ ${String(d.totalOccurrences).padStart(4)} │ ${String(d.formsMissing).padStart(6)}  │ ${String(d.crossSurahValue).padStart(6)} │ ${d.editorialClass.padEnd(6)}`,
    );
  }

  // 6. Simulation de couverture par sourate.
  console.log(`\n─── SIMULATION COUVERTURE SOURATE ───\n`);

  // 6a. Construit l'état « avant ».
  const surahForms = new Map<number, Set<string>>();
  for (const forms of lemmaForms.values()) {
    for (const f of forms) {
      for (const sn of f.surah_numbers) {
        const set = surahForms.get(sn) ?? new Set();
        set.add(f.word_id);
        surahForms.set(sn, set);
      }
    }
  }
  for (const f of noLemmaForms) {
    for (const sn of f.surah_numbers) {
      const set = surahForms.get(sn) ?? new Set();
      set.add(f.word_id);
      surahForms.set(sn, set);
    }
  }

  // 6b. Calcule les formes déjà FR et celles qui le seraient après import du top 50.
  const top50LemmaIds = new Set(top50.map((d) => d.lemmaId));

  const simulations: SurahCoverageSim[] = [];
  for (const [surahNum, formSet] of surahForms) {
    const surahEntry = [...surahsMap].find(([, s]) => s.number === surahNum);
    const surah = surahEntry ? surahsMap.get(surahEntry[0]) : undefined;
    const name = surah?.name ?? `Sourate ${surahNum}`;

    let frBefore = 0;
    let frAfter = 0;

    for (const wordId of formSet) {
      const hasFormFr = formFrMap.has(wordId);
      const lemmaId = effectiveLemma(wordId, direct, mapping);
      const hasLemmaFr = lemmaId ? lemmaFrMap.has(lemmaId) : false;
      const alreadyFr = hasFormFr || hasLemmaFr;

      if (alreadyFr) frBefore++;

      // Après top 50 : si le lemme est dans le top 50 + pas déjà couvert → devient FR.
      const wouldBeCoveredByTop50 = lemmaId && top50LemmaIds.has(lemmaId) && !alreadyFr;
      frAfter += alreadyFr || wouldBeCoveredByTop50 ? 1 : 0;
    }

    const totalForms = formSet.size;
    const pctBefore = totalForms > 0 ? Math.round((frBefore / totalForms) * 100) : 100;
    const pctAfter = totalForms > 0 ? Math.round((frAfter / totalForms) * 100) : 100;

    simulations.push({
      surahNumber: surahNum,
      name,
      totalForms,
      formsWithFrBefore: frBefore,
      formsWithFrAfter: frAfter,
      effectiveFrPctBefore: pctBefore,
      effectiveFrPctAfter: pctAfter,
      statusBefore: classifyStatus(surahNum, pctBefore),
      statusAfter: classifyStatus(surahNum, pctAfter),
      newlyReady: classifyStatus(surahNum, pctBefore) !== "READY" && classifyStatus(surahNum, pctAfter) === "READY",
    });
  }

  simulations.sort((a, b) => a.surahNumber - b.surahNumber);

  const newlyReady = simulations.filter((s) => s.newlyReady);
  const readyBefore = simulations.filter((s) => s.statusBefore === "READY" || s.statusBefore === "REFERENCE").length;
  const readyAfter = simulations.filter((s) => s.statusAfter === "READY" || s.statusAfter === "REFERENCE").length;

  // Affiche uniquement les changements significatifs.
  console.log(`  Sourates READY avant : ${readyBefore}`);
  console.log(`  Sourates READY après : ${readyAfter}`);
  console.log(`  Nouvellement READY   : ${newlyReady.length}`);
  if (newlyReady.length > 0) {
    console.log(`\n  Sourates débloquées :`);
    for (const s of newlyReady) {
      console.log(`    ${s.surahNumber.toString().padStart(3)} — ${s.name} (${s.effectiveFrPctBefore}% → ${s.effectiveFrPctAfter}%)`);
    }
  }

  // Sourates qui restent IN_PREPARATION.
  const stillNotReady = simulations.filter((s) => s.statusAfter === "IN_PREPARATION");
  if (stillNotReady.length > 0 && VERBOSE) {
    console.log(`\n  Toujours IN_PREPARATION (${stillNotReady.length}) :`);
    for (const s of stillNotReady.slice(0, 20)) {
      console.log(`    ${s.surahNumber.toString().padStart(3)} — ${s.name} (${s.effectiveFrPctBefore}% → ${s.effectiveFrPctAfter}%)`);
    }
    if (stillNotReady.length > 20) console.log(`    … +${stillNotReady.length - 20} autres`);
  }

  // 7. Récapitulatif éditorial.
  const safes = top50.filter((d) => d.editorialClass === "SAFE");
  const reviews = top50.filter((d) => d.editorialClass === "REVIEW_REQUIRED");
  const risks = top50.filter((d) => d.editorialClass === "HIGH_RISK");
  const blocked = top50.filter((d) => d.editorialClass === "DO_NOT_IMPORT");
  console.log(`\n─── CLASSIFICATION ÉDITORIALE ───`);
  console.log(`  SAFE             : ${safes.length}`);
  console.log(`  REVIEW_REQUIRED  : ${reviews.length}`);
  console.log(`  HIGH_RISK        : ${risks.length}`);
  console.log(`  DO_NOT_IMPORT    : ${blocked.length}`);

  // 8. Couverture globale.
  const allFormIds = [...formFrMap.keys()];
  const totalAllForms = wordIds.length;
  const frNow = allFormIds.length;
  // Estime les nouvelles formes couvertes par le top 50 (sans celles déjà couvertes).
  const top50FormIds = new Set(top50.flatMap((d) => d.formIds));
  let newFrFromTop50 = 0;
  for (const fid of top50FormIds) {
    if (!formFrMap.has(fid)) {
      const lemmaId = effectiveLemma(fid, direct, mapping);
      if (lemmaId && top50LemmaIds.has(lemmaId) && !lemmaFrMap.has(lemmaId)) {
        newFrFromTop50++;
      }
    }
  }

  console.log(`\n─── COUVERTURE GLOBALE ───`);
  console.log(`  Formes totales         : ${totalAllForms}`);
  console.log(`  Formes FR avant        : ${frNow} (${Math.round((frNow / Math.max(1, totalAllForms)) * 100)}%)`);
  console.log(`  Nouvelles FR (top 50)  : ~${newFrFromTop50}`);

  // 9. Sortie JSON.
  const report = {
    phase: "88B",
    mode: "DIAGNOSTIC_READ_ONLY",
    timestamp: new Date().toISOString(),
    sourceId,
    counts: {
      quranWords: wordIds.length,
      lemmasTotal: lemmaById.size,
      lemmaDirect: direct.size,
      lemmaMapping: mapping.size,
      formsWithoutLemma: noLemmaForms.length,
      wordTranslationsFr: formFrMap.size,
      lemmaTranslationsFr: lemmaFrMap.size,
    },
    crossSurahValueFormula:
      "distinctSurahs × log2(1 + distinctForms) × log2(1 + occurrences) × (1 − fractionAlreadyCovered)",
    top50Lemmas: top50.map((d) => ({
      rank: top50.indexOf(d) + 1,
      lemmaId: d.lemmaId,
      arabic: d.arabic,
      distinctSurahs: d.distinctSurahs,
      distinctForms: d.distinctForms,
      totalOccurrences: d.totalOccurrences,
      formsAlreadyCovered: d.formsAlreadyCovered,
      formsMissing: d.formsMissing,
      crossSurahValue: d.crossSurahValue,
      editorialClass: d.editorialClass,
      lemmaGlossValidated: d.lemmaGlossValidated,
      lemmaGlossText: d.lemmaGlossText,
      proposedGloss: d.proposedGloss,
      supportingSources: d.supportingSources,
      surahNumbers: d.surahNumbers,
    })),
    simulation: {
      readyBefore,
      readyAfter,
      newlyReady: newlyReady.length,
      newlyReadySurahs: newlyReady.map((s) => ({
        surahNumber: s.surahNumber,
        name: s.name,
        effectiveFrPctBefore: s.effectiveFrPctBefore,
        effectiveFrPctAfter: s.effectiveFrPctAfter,
      })),
    },
    editorialSummary: {
      safe: safes.length,
      reviewRequired: reviews.length,
      highRisk: risks.length,
      doNotImport: blocked.length,
    },
  };

  mkdirSync("reports", { recursive: true });
  const outPath = "reports/phase-88b-batch1-lemma-proposals.json";
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`\n  Rapport écrit → ${outPath}`);

  console.log(`\n=== PHASE 88B — DIAGNOSTIC TERMINÉ (0 écriture DB) ===`);
}

main().catch((err) => {
  console.error("Phase 88B échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});