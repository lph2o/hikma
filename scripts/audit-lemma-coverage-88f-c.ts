/**
 * PHASE 88F-C — POST-IMPORT LEXICAL COVERAGE AUDIT & BATCH 2 PRIORITIZATION
 *
 * STRICT READ-ONLY — 0 DB write. Aucune modification du code métier.
 *
 * Livrable : reports/phase-88f-c-post-import-audit.json
 *  1. Snapshot DB actuel (recalculé depuis la base)
 *  2. Réconciliation READY des 114 sourates (divergence 24 vs 23 expliquée)
 *  3. Couverture FR exacte par word_id (A, B, A∩B, UNION, sans FR)
 *  4. Occurrences (dédupliquées par occurrence)
 *  5. Lemmes (total / actifs / avec glose / sans glose; formes, occs, sourates)
 *  6. Batch-2 candidates (tous les lemmes sans lemma_translation FR)
 *  7. Priority score transparent (composantes séparées)
 *  8. TOP 100 avec classification SAFE_CANDIDATE / REVIEW_REQUIRED /
 *     HIGH_RISK / DO_NOT_IMPORT
 *  9. Simulations TOP 10/20/30/50/100 par union réelle des word_id
 * 10. Quick-win analysis (sourates proches de READY, décomposition du besoin)
 * 11. Roadmap 114/114 (projection réaliste, sans inventer de nombre de batches)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

const SELECT_PAGE_SIZE = 1000;

type Candidate = {
  lemmaId: string;
  arabic: string;
  numberOfForms: number;
  newUncoveredForms: number;
  newUncoveredOccurrences: number;
  distinctSurahs: number;
  uncoveredSurahs: number;
  percentageOfFormsStillUncovered: number;
  editorialConfidence: number;
  hikmaGlossEvidence: string | null;
  hamidullahEvidence: null;
  kazimirskiEvidence: null;
  masaqMappingQuality: number | null;
  excluded: boolean;
  reason?: string;
  scoreComponents?: { distinctSurahs: number; log2_1_plus_forms: number; log2_1_plus_occs: number; editorialConfidence: number };
  priorityScore?: number;
  classification?: string;
};
const SOURCE_NAME = "Hikma — lexique éditorial";
const MASAQ_NAME = "MASAQ";
const OUTPUT = "reports/phase-88f-c-post-import-audit.json";
const ROUND = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

// Gloses éditoriales Hikma connues (évidence existante pour la priorisation —
// jamais écrites en DB, jamais utilisées comme source d'import).
const HIKMA_GLOSS_EVIDENCE: Record<string, string> = {
  قلب: "cœur",
  عظيم: "immense / formidable",
  غفور: "pardonneur",
  رحيم: "miséricordieux",
  بصير: "qui voit tout / clairvoyant",
  حكيم: "sage",
  قدير: "tout-puissant / capable",
  ولي: "allié / protecteur / proche",
  هدى: "guidance / guider",
  ضل: "égarer / s'égarer",
  غفر: "pardonner",
  رجع: "revenir / retourner",
  أخذ: "prendre / saisir",
  جعل: "faire / rendre / placer",
  بعث: "envoyer / ressusciter",
  أتى: "venir / apporter",
  شهد: "témoigner / être témoin",
  عمل: "œuvrer / agir / œuvre",
  بين: "entre / rendre clair, manifester",
  أمر: "ordre / commandement / affaire",
  قبل: "avant / accepter",
  ذكر: "rappel / invocation / mention",
  ملك: "roi / royaume / posséder",
  ظلم: "injustice / ténèbres / être injuste",
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

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const t0 = Date.now();

  console.log("=== PHASE 88F-C — POST-IMPORT LEXICAL COVERAGE AUDIT (READ-ONLY) ===");

  // ─── 1. Sources ──────────────────────────────────────────────────────────
  const { data: srcRows } = await client.from("sources").select("id, name").in("name", [SOURCE_NAME, MASAQ_NAME]);
  const srcList = (srcRows ?? []) as Array<{ id: string; name: string }>;
  const hikmaId = srcList.find(s => s.name === SOURCE_NAME)?.id ?? "";
  const masaqId = srcList.find(s => s.name === MASAQ_NAME)?.id ?? null;
  if (!hikmaId) throw new Error(`Source ${SOURCE_NAME} introuvable.`);
  console.log(`  sources: Hikma=${hikmaId} MASAQ=${masaqId ?? "ABSENT"}`);

  // ─── 2. Chargement des tables de référence ───────────────────────────────
  console.log("→ Chargement…");
  const surahRows = await selectAll<{ id: string; number: number; name_transliteration: string | null }>(client, "surahs", "id, number, name_transliteration");
  const ayahRows = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");
  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null }>(client, "quran_words", "id, arabic, lemma_id");
  const occRows = await selectAll<{ id: string; word_id: string; ayah_id: string }>(client, "word_occurrences", "id, word_id, ayah_id");
  const lemmaRows = await selectAll<{ id: string; arabic: string }>(client, "lemmas", "id, arabic");
  const wlmRows = await selectAll<{ id: string; word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "id, word_id, lemma_id");
  const wtRows = await selectAll<{ id: string; word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null }>(client, "word_translations", "id, word_id, text, language, is_validated, source_id");
  const ltRows = await selectAll<{ id: string; lemma_id: string; language: string; text: string; is_validated: boolean; source_id: string | null }>(client, "lemma_translations", "id, lemma_id, language, text, is_validated, source_id");
  const loRows = await selectAll<{ id: string; word_occurrence_id: string; hikma_lemma_id: string | null; lemma_mapping_status: string; masaq_gloss_en: string | null }>(client, "linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, lemma_mapping_status, masaq_gloss_en");
  console.log(`  corpus: surahs=${surahRows.length} ayahs=${ayahRows.length} words=${wordRows.length} occs=${occRows.length} lemmas=${lemmaRows.length} wlm=${wlmRows.length} wt=${wtRows.length} lt=${ltRows.length} lo=${loRows.length}`);

  // ─── 3. Résolution finale mot → lemme ────────────────────────────────────
  const finalLemma = new Map<string, string>();
  for (const w of wordRows) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlmRows) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  const occToWord = new Map(occRows.map(o => [o.id, o.word_id]));
  for (const l of loRows) {
    if (!l.hikma_lemma_id) continue;
    const wid = occToWord.get(l.word_occurrence_id);
    if (wid && !finalLemma.has(wid)) finalLemma.set(wid, l.hikma_lemma_id);
  }
  console.log(`  résolution: ${finalLemma.size}/${wordRows.length} mots avec lemme`);

  // ─── 4. FR validé (Hikma) et union ───────────────────────────────────────
  const wtFr = new Map<string, string>();
  for (const r of wtRows) if (r.language === "fr" && r.is_validated && r.source_id === hikmaId) wtFr.set(r.word_id, r.text);
  const ltFr = new Map<string, string>();
  for (const r of ltRows) if (r.language === "fr" && r.is_validated && r.source_id === hikmaId) ltFr.set(r.lemma_id, r.text);

  const A = new Set(wtFr.keys());
  const B = new Set<string>();
  for (const [wid, lid] of finalLemma) if (ltFr.has(lid)) B.add(wid);
  const union = new Set<string>(A);
  for (const wid of B) union.add(wid);
  const inter = [...A].filter(w => B.has(w)).length;
  const noFr = wordRows.filter(w => !union.has(w.id));

  const occCountByWord = new Map<string, number>();
  for (const o of occRows) occCountByWord.set(o.word_id, (occCountByWord.get(o.word_id) ?? 0) + 1);
  let occCovered = 0;
  for (const wid of union) occCovered += occCountByWord.get(wid) ?? 0;
  const occTotal = occRows.length;
  const occWithout = occTotal - occCovered;

  console.log(`  FR: A=${A.size} B=${B.size} A∩B=${inter} UNION=${union.size} sansFR=${noFr.length}`);

  // ─── 5. Lemmes ───────────────────────────────────────────────────────────
  const lemmaFormCount = new Map<string, number>();
  const lemmaOccCount = new Map<string, number>();
  const lemmaSurahSet = new Map<string, Set<number>>();
  const ayahToSurah = new Map(ayahRows.map(a => [a.id, a.surah_id]));
  const surahNumById = new Map(surahRows.map(s => [s.id, s.number]));
  const surahIdByNumber = new Map(surahRows.map(s => [s.number, s.id]));

  for (const [wid, lid] of finalLemma) {
    lemmaFormCount.set(lid, (lemmaFormCount.get(lid) ?? 0) + 1);
    lemmaOccCount.set(lid, (lemmaOccCount.get(lid) ?? 0) + (occCountByWord.get(wid) ?? 0));
  }
  for (const o of occRows) {
    const lid = finalLemma.get(o.word_id);
    if (!lid) continue;
    const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
    if (sn !== undefined) {
      let set = lemmaSurahSet.get(lid);
      if (!set) { set = new Set(); lemmaSurahSet.set(lid, set); }
      set.add(sn);
    }
  }

  const lemmasWithFr = new Set(ltFr.keys());
  const activeLemmas = new Set(finalLemma.values());
  const gloslessLemmas = lemmaRows.filter(l => !ltFr.has(l.id));
  let formsMappedNoGloss = 0, occMappedNoGloss = 0;
  const gloslessSurahs = new Set<number>();
  for (const [wid, lid] of finalLemma) {
    if (ltFr.has(lid)) continue;
    formsMappedNoGloss++;
    occMappedNoGloss += occCountByWord.get(wid) ?? 0;
    for (const o of occRows) {
      if (o.word_id !== wid) continue;
      const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
      if (sn !== undefined) gloslessSurahs.add(sn);
    }
  }
  console.log(`  lemmas: total=${lemmaRows.length} actifs=${activeLemmas.size} avecFR=${lemmasWithFr.size} sansFR=${gloslessLemmas.length}`);
  console.log(`  formes mappées sans glose=${formsMappedNoGloss} · occs=${occMappedNoGloss} · sourates=${gloslessSurahs.size}`);

  // ─── 6. Sourates ─────────────────────────────────────────────────────────
  const surahForms = new Map<number, Set<string>>();
  const surahOccs = new Map<number, number>();
  for (const o of occRows) {
    const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
    if (sn === undefined) continue;
    let set = surahForms.get(sn);
    if (!set) { set = new Set(); surahForms.set(sn, set); }
    set.add(o.word_id);
    surahOccs.set(sn, (surahOccs.get(sn) ?? 0) + 1);
  }

  const surahCoverage: Array<{
    number: number; name: string; totalForms: number; coveredForms: number; uncoveredForms: number;
    coveragePct: number; totalOccs: number; coveredOccs: number; uncoveredOccs: number; state: string;
    missingMappedNoGloss: number; missingUnmapped: number; missingWordTr: number;
  }> = [];
  for (const [sn, forms] of surahForms) {
    let covered = 0;
    for (const wid of forms) if (union.has(wid)) covered++;
    let missingMappedNoGloss = 0, missingUnmapped = 0, missingWordTr = 0;
    for (const wid of forms) {
      if (union.has(wid)) continue;
      const lid = finalLemma.get(wid);
      if (lid && !ltFr.has(lid)) missingMappedNoGloss++;
      else if (!lid) missingUnmapped++;
      else missingWordTr++;
    }
    const name = surahRows.find(s => s.number === sn)?.name_transliteration ?? `Surah ${sn}`;
    // Occurrences couvertes DANS cette sourate uniquement.
    let coveredOccs = 0;
    for (const o of occRows) {
      if (o.word_id && union.has(o.word_id) && ayahToSurah.get(o.ayah_id) === surahIdByNumber.get(sn)) {
        coveredOccs++;
      }
    }
    surahCoverage.push({
      number: sn, name, totalForms: forms.size, coveredForms: covered, uncoveredForms: forms.size - covered,
      coveragePct: ROUND(covered / forms.size, 4),
      totalOccs: surahOccs.get(sn) ?? 0,
      coveredOccs,
      uncoveredOccs: (surahOccs.get(sn) ?? 0) - coveredOccs,
      state: sn === 1 ? "REFERENCE" : (covered / forms.size >= 1 ? "READY" : "IN_PREPARATION"),
      missingMappedNoGloss, missingUnmapped, missingWordTr,
    });
  }
  surahCoverage.sort((a, b) => a.number - b.number);
  const readyCount = surahCoverage.filter(s => s.state === "READY").length;
  const inPrepCount = surahCoverage.filter(s => s.state === "IN_PREPARATION").length;
  console.log(`  sourates: READY=${readyCount} IN_PREPARATION=${inPrepCount} REFERENCE=${surahCoverage.filter(s => s.state === "REFERENCE").length}`);

  // ─── 7. Batch-2 candidates ───────────────────────────────────────────────
  console.log("→ Batch-2 candidates…");
  const candidates: Candidate[] = [];
  for (const l of lemmaRows) {
    if (ltFr.has(l.id)) continue;
    const formsTotal = lemmaFormCount.get(l.id) ?? 0;
    if (formsTotal === 0) continue; // lemme sans forme → exclu
    
    const formIds = [...finalLemma].filter(([, lid]) => lid === l.id).map(([wid]) => wid);
    const newUncovered = formIds.filter(wid => !union.has(wid));
    const newUncoveredOccs = newUncovered.reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0);
    const distinctSurahs = lemmaSurahSet.get(l.id)?.size ?? 0;

    const uncoveredSurahs = new Set<number>();
    for (const wid of newUncovered) {
      for (const o of occRows) {
        if (o.word_id !== wid) continue;
        const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
        if (sn !== undefined) uncoveredSurahs.add(sn);
      }
    }

    // MASAQ mapping quality pour ce lemme
    const masaqStatuses: string[] = [];
    for (const m of loRows) {
      const wid = occToWord.get(m.word_occurrence_id);
      if (wid !== undefined && finalLemma.get(wid) === l.id && m.hikma_lemma_id === l.id) {
        masaqStatuses.push(m.lemma_mapping_status);
      }
    }
    const masaqQuality = masaqStatuses.length > 0
      ? ROUND(masaqStatuses.filter(s => s === "EXACT").length / masaqStatuses.length, 2)
      : null;

    const hikmaGloss = HIKMA_GLOSS_EVIDENCE[l.arabic] ?? null;
    const editorialConfidence = hikmaGloss ? 1 : 0.6;

    candidates.push({
      lemmaId: l.id,
      arabic: l.arabic,
      numberOfForms: formsTotal,
      newUncoveredForms: newUncovered.length,
      newUncoveredOccurrences: newUncoveredOccs,
      distinctSurahs,
      uncoveredSurahs: uncoveredSurahs.size,
      percentageOfFormsStillUncovered: ROUND(newUncovered.length / formsTotal, 2),
      editorialConfidence,
      hikmaGlossEvidence: hikmaGloss,
      hamidullahEvidence: null,   // non calculable directement (traductions par ayah, pas par lemme)
      kazimirskiEvidence: null,    // idem
      masaqMappingQuality: masaqQuality,
      excluded: false,
    });
  }

  // Exclusions
  for (const c of candidates) {
    if (c.newUncoveredForms === 0) { c.excluded = true; c.reason = "déjà couvert"; continue; }
    if (c.distinctSurahs === 0 && c.newUncoveredForms > 0) { c.excluded = true; c.reason = "sans sourate"; continue; }
    if (c.masaqMappingQuality !== null && c.masaqMappingQuality < 0.5 && !c.hikmaGlossEvidence) { c.excluded = true; c.reason = "mapping MASAQ ambigu"; }
  }
  const activeCandidates = candidates.filter(c => !c.excluded);
  console.log(`  candidates: total=${candidates.length} actifs=${activeCandidates.length}`);

  // Score transparent
  for (const c of activeCandidates) {
    const formsLog = Math.log2(1 + c.newUncoveredForms);
    const occsLog = Math.log2(1 + c.newUncoveredOccurrences);
    c.scoreComponents = {
      distinctSurahs: c.distinctSurahs,
      log2_1_plus_forms: ROUND(formsLog, 2),
      log2_1_plus_occs: ROUND(occsLog, 2),
      editorialConfidence: c.editorialConfidence,
    };
    c.priorityScore = ROUND(c.distinctSurahs * formsLog * occsLog * c.editorialConfidence, 2);
  }
  activeCandidates.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

  // ─── 8. TOP 100 + classification ─────────────────────────────────────────
  const top100 = (activeCandidates.slice(0, 100) as Candidate[]).map(c => {
    let classification: string;
    if (c.excluded) classification = "DO_NOT_IMPORT";
    else if (c.editorialConfidence === 0.6 && (c.masaqMappingQuality ?? 0) < 0.5) classification = "REVIEW_REQUIRED";
    else if (c.newUncoveredForms > 30 || c.newUncoveredOccurrences > 200) classification = "HIGH_RISK";
    else classification = "SAFE_CANDIDATE";
    return { ...c, classification };
  });
  const classCounts = top100.reduce((acc, c) => { acc[c.classification] = (acc[c.classification] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  console.log(`  TOP100: ${JSON.stringify(classCounts)}`);

  // ─── 9. Simulations (union réelle de word_id) ────────────────────────────
  const allFormIdsByLemma = new Map<string, Set<string>>();
  for (const [wid, lid] of finalLemma) {
    let set = allFormIdsByLemma.get(lid);
    if (!set) { set = new Set(); allFormIdsByLemma.set(lid, set); }
    set.add(wid);
  }
  const simResults: Array<Record<string, unknown>> = [];
  for (const [label, count] of [["TOP_10", 10], ["TOP_20", 20], ["TOP_30", 30], ["TOP_50", 50], ["TOP_100", 100]] as const) {
    const list = top100.slice(0, count);
    const newFormSet = new Set<string>();
    for (const c of list) {
      for (const wid of allFormIdsByLemma.get(c.lemmaId) ?? []) {
        if (!union.has(wid)) newFormSet.add(wid);
      }
    }
    const newOcc = [...newFormSet].reduce((sum, wid) => sum + (occCountByWord.get(wid) ?? 0), 0);
    const simUnion = new Set(union);
    for (const wid of newFormSet) simUnion.add(wid);

    const newReady: number[] = [];
    let improved = 0;
    for (const [sn, forms] of surahForms) {
      if (sn === 1) continue;
      let covBefore = 0, covAfter = 0;
      for (const wid of forms) {
        if (union.has(wid)) covBefore++;
        if (simUnion.has(wid)) covAfter++;
      }
      if (covBefore < forms.size && covAfter === forms.size) newReady.push(sn);
      if (covAfter > covBefore) improved++;
    }
    simResults.push({
      scenario: label,
      candidates: list.length,
      newForms: newFormSet.size,
      newOccurrences: newOcc,
      unionFrAfter: simUnion.size,
      formsWithoutFrAfter: wordRows.length - simUnion.size,
      coveragePctAfter: ROUND(simUnion.size / wordRows.length, 3),
      newReadySurahs: newReady,
      improvedSurahs: improved,
      newReadyCount: newReady.length,
    });
  }

  // ─── 10. Quick-win (sourates les plus proches de READY) ─────────────────
  const quickWins = surahCoverage
    .filter(s => s.state === "IN_PREPARATION")
    .map(s => ({
      number: s.number, name: s.name,
      coveragePct: ROUND(s.coveragePct * 100, 1),
      missingForms: s.uncoveredForms,
      missingOccurrences: s.uncoveredOccs,
      missingMappedNoGloss: s.missingMappedNoGloss,
      missingUnmapped: s.missingUnmapped,
      missingWordTr: s.missingWordTr,
      category: s.missingMappedNoGloss > 0 && s.missingUnmapped === 0
        ? "A" // déblocable par lemma translations (toutes les formes manquantes ont un lemme sans glose)
        : (s.missingUnmapped > 0 ? "B" : "C"),
    }))
    .sort((a, b) => b.coveragePct - a.coveragePct)
    .slice(0, 15);
  const quickWinCategories = {
    A: quickWins.filter(q => q.category === "A").length,
    B: quickWins.filter(q => q.category === "B").length,
    C: quickWins.filter(q => q.category === "C").length,
  };

  // ─── 11. Roadmap 114/114 ─────────────────────────────────────────────────
  let mappedNoFr = 0, mappedNoFrOccs = 0;
  const unmappedForms = new Set<string>();
  for (const w of wordRows) {
    if (union.has(w.id)) continue;
    if (finalLemma.has(w.id)) {
      mappedNoFr++;
      mappedNoFrOccs += occCountByWord.get(w.id) ?? 0;
    } else {
      unmappedForms.add(w.id);
    }
  }
  const masaqSurahs = new Set<number>();
  for (const m of loRows) {
    const wid = occToWord.get(m.word_occurrence_id);
    if (!wid) continue;
    for (const o of occRows) {
      if (o.word_id !== wid) continue;
      const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
      if (sn !== undefined) masaqSurahs.add(sn);
    }
  }
  const surahsWithoutMasaq = surahCoverage.filter(s => !masaqSurahs.has(s.number)).map(s => s.number);
  const noMasaqForms = surahsWithoutMasaq.reduce((s, n) => s + (surahForms.get(n)?.size ?? 0), 0);
  const roadmap = {
    currentUnion: union.size,
    currentUnionPct: ROUND(union.size / wordRows.length, 3),
    mappedLemmaNoFr: mappedNoFr,
    mappedLemmaNoFrOccs: mappedNoFrOccs,
    unmappedFormsWithoutLemma: unmappedForms.size,
    unmappedFormsOccs: [...unmappedForms].reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0),
    surahsWithMasaq: masaqSurahs.size,
    surahsWithoutMasaq: surahsWithoutMasaq.length,
    surahsWithoutMasaqNums: surahsWithoutMasaq,
    noMasaqForms: noMasaqForms,
    residualFormsAfterAllMappedLemmaGlosses: unmappedForms.size,
    note: "potentiel si TOUS les lemmes actuellement mappés reçoivent une glose FR : union → union + mappedNoFr (formes mappées sans glose) ; le reste = formes sans lemme (infra requise)",
  };

  // ─── 12. Rapport ─────────────────────────────────────────────────────────
  const report = {
    phase: "88F-C",
    mode: "READ_ONLY_AUDIT",
    timestamp: new Date().toISOString(),
    verdict: "PHASE_88F_C_COMPLETE",
    writes: { database: 0, lexical: 0, translation: 0, curriculum: 0, masaq: 0, migrations: 0, seeds: 0 },
    snapshot: {
      quranWords: wordRows.length,
      wordOccurrences: occTotal,
      lemmas: lemmaRows.length,
      lemmasActive: activeLemmas.size,
      wordLemmaMapping: wlmRows.length,
      wordTranslationsHikmaFrValidated: wtFr.size,
      lemmaTranslationsHikmaFrValidated: ltFr.size,
      linguisticOccurrences: loRows.length,
      ayahs: ayahRows.length,
      surahs: surahRows.length,
    },
    readyReconciliation: {
      ready: readyCount,
      inPreparation: inPrepCount,
      reference: 1,
      total: surahCoverage.length,
      divergenceNote: "l'ancien rapport (88E-C) listait 'readySurahs' dans son résumé via un comptage ≥90% ? Non : 88E-C comptait lemmas avec >90% de couverture de lemmes. 88F-B a compté READY = 100% FR. L'écart 23 vs 24 vient du comptage 88E-C qui utilisait >=90% de formes-avec-lemme (pas FR). La présente audit recalcule : READY = coverage_pct === 1.0 (100 % des formes résolues FR)",
      readyDefinition: "coverage_pct === 1.0 (toutes les formes de la sourate ont une résolution FR : word_translation OU lemma_translation)",
      surah1IsReference: true,
    },
    surahCoverage,
    frCoverage: {
      A: A.size,
      B: B.size,
      intersectionAB: inter,
      union: union.size,
      unionPct: ROUND(union.size / wordRows.length, 4),
      withoutFr: noFr.length,
    },
    occurrences: {
      total: occTotal,
      covered: occCovered,
      withoutFr: occWithout,
      coveragePct: ROUND(occCovered / occTotal, 4),
    },
    lemmas: {
      total: lemmaRows.length,
      active: activeLemmas.size,
      withFr: lemmasWithFr.size,
      withoutFr: gloslessLemmas.length,
      formsMappedToGlosless: formsMappedNoGloss,
      occurrencesMappedToGlosless: occMappedNoGloss,
      affectedSurahs: gloslessSurahs.size,
    },
    batch2: {
      totalCandidates: activeCandidates.length,
      classCounts,
      top100,
    },
    simulations: simResults,
    quickWins: { list: quickWins, categoryCounts: quickWinCategories },
    roadmap,
    nextPhase: "PHASE 88F-D — BATCH 2 EDITORIAL PROPOSAL AUDIT (si les données permettent de sélectionner un batch sûr)",
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nRapport → ${OUTPUT}`);
  console.log(`Durée totale : ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log("\n=== PHASE 88F-C — AUDIT TERMINÉ (0 écriture DB) ===");
  console.log("PHASE_88F_C_COMPLETE");
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(1); });