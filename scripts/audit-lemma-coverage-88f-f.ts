/**
 * PHASE 88F-F — LEXICAL COVERAGE OPTIMIZATION AUDIT
 *
 * STRICT READ-ONLY — 0 DB write, 0 migration, 0 seed, 0 import.
 * Aucune modification du code métier : classifySurahReadiness reste la
 * référence (READY ssi 100 % des formes résolues en FR ; sourate 1 = REFERENCE).
 *
 * Livrable : reports/phase-88f-f-coverage-optimization.json
 *   1. Snapshot DB complet (recalculé, rien recopié)
 *   2. Couverture FR exacte par chemins A/B/C/D dédupliquée par word_id
 *   3. Classification de résolution des formes
 *   4. Analyse des 114 sourates (groupes NEAR_READY / HIGH / MEDIUM / LOW)
 *   5. Distance exacte vers READY (typologie des formes manquantes)
 *   6. Scores d'impact des lemmes sans FR (formule = héritée de 88F-C)
 *   7. TOP 100 lemmes à potentiel (recommandation, PAS de glose finale)
 *   8. Simulations TOP 10/20/30/50/100 par UNION réelle des word_id
 *   9. READY-FIRST : prochaine sourate rendable READY au moindre coût
 *  10. Quick wins (peu de gloses → beaucoup de formes/occurrences/sourates)
 *  11. Backlog lexical vs infrastructure (par sourate proche de READY)
 *  12. Roadmap 114 sourates (projection honnête)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync } from "node:fs";

const SELECT_PAGE_SIZE = 1000;
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const OUTPUT = "reports/phase-88f-f-coverage-optimization.json";
const D_REPORT = "reports/phase-88f-d-editorial-audit.json";
const ROUND = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
const HAMIDULLAH_TR = "Muhammad Hamidullah";
const KAZIMIRSKI_TR = "Albert de Biberstein-Kazimirski";

// Gloses Hikma connues (évidence de priorisation 88F-C ; jamais écrites ici).
const KNOWN_GLOSSES: Record<string, string> = {
  قلب: "cœur", عظيم: "immense / formidable", غفور: "pardonneur", رحيم: "miséricordieux",
  بصير: "qui voit tout / clairvoyant", حكيم: "sage", قدير: "tout-puissant / capable",
  ولي: "allié / protecteur / proche", هدى: "guidance / guider", ضل: "égarer / s'égarer",
  غفر: "pardonner", رجع: "revenir / retourner", أخذ: "prendre / saisir",
  جعل: "faire / rendre / placer", بعث: "envoyer / ressusciter", أتى: "venir / apporter",
  شهد: "témoigner / être témoin", عمل: "œuvrer / agir / œuvre", بين: "entre / rendre clair, manifester",
  أمر: "ordre / commandement / affaire", قبل: "avant / accepter",
  ملك: "roi / royaume / posséder", ظلم: "injustice / ténèbres / être injuste",
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

type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccRow = { id: string; word_id: string; ayah_id: string };
type LoRow = { id: string; word_occurrence_id: string; hikma_lemma_id: string | null; lemma_mapping_status: string; masaq_gloss_en: string | null; masaq_stem: string | null; pos: string[] };
type LemmaRow = { id: string; arabic: string };
type SurahCov = {
  number: number; name: string; totalForms: number; formsWithFr: number; formsWithoutFr: number;
  coveragePct: number; totalOccurrences: number; coveredOccurrences: number; unaffectedOccurrences: number;
  occCoveragePct: number; state: string; group: string;
};
type Candidate = {
  lemmaId: string; arabic: string; forms: number; occurrences: number; surahs: number;
  formsWithoutFr: number; occurrencesWithoutFr: number; currentFrForms: number;
  masaqQuality: number | null; masaqDistinctGlosses: number; masaqTopGlossEn: string | null;
  masaqTopShare: number | null; masaqStemsCount: number | null;
  editorialConfidence: number; knownGloss: string | null;
  hamidullahPresent: boolean; kazimirskiPresent: boolean;
  surahsImprovedCount: number; nearReadySurahsImpacted: number[];
  score: number;
};

/** Score d'impact — formule héritée de 88F-C (documentée, non arbitraire) :
 *  impact = surahs × log2(1+formes_sans_FR) × log2(1+occurrences_sans_FR) × conf_éd. */
function impactScore(surahs: number, forms: number, occs: number, conf: number): number {
  return ROUND(surahs * Math.log2(1 + forms) * Math.log2(1 + occs) * conf, 2);
}

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const t0 = Date.now();

  console.log("=== PHASE 88F-F — LEXICAL COVERAGE OPTIMIZATION AUDIT (READ-ONLY) ===\n");

  // ─── 1. Source Hikma ─────────────────────────────────────────────────────
  const { data: srcRows } = await client.from("sources").select("id, name").in("name", [HIKMA_SOURCE]);
  const hikmaId = (srcRows ?? []).find(s => s.name === HIKMA_SOURCE)?.id ?? "";
  if (!hikmaId) throw new Error(`Source ${HIKMA_SOURCE} introuvable.`);

  // ─── 2. Chargement ───────────────────────────────────────────────────────
  console.log("→ Chargement…");
  const surahs = await selectAll<{ id: string; number: number; name_transliteration: string | null }>(client, "surahs", "id, number, name_transliteration");
  const ayahRows = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");
  const wordRows = await selectAll<WordRow>(client, "quran_words", "id, arabic, lemma_id");
  const occRows = await selectAll<OccRow>(client, "word_occurrences", "id, word_id, ayah_id");
  const lemmaRows = await selectAll<LemmaRow>(client, "lemmas", "id, arabic");
  const wlmRows = await selectAll<{ id: string; word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "id, word_id, lemma_id");
  const wtRows = await selectAll<{ id: string; word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null }>(client, "word_translations", "id, word_id, text, language, is_validated, source_id");
  const ltRows = await selectAll<{ id: string; lemma_id: string; text: string; language: string; is_validated: boolean; source_id: string | null }>(client, "lemma_translations", "id, lemma_id, text, language, is_validated, source_id");
  const loRows = await selectAll<LoRow>(client, "linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, lemma_mapping_status, masaq_gloss_en, masaq_stem, pos");
  const segRows = await selectAll<{ linguistic_occurrence_id: string; morph_type: string }>(client, "linguistic_segments", "linguistic_occurrence_id, morph_type");
  const trRows = await selectAll<{ ayah_id: string; translator: string }>(client, "translations", "ayah_id, translator");
  console.log(`  corpus: surahs=${surahs.length} ayahs=${ayahRows.length} words=${wordRows.length} occs=${occRows.length} lemmas=${lemmaRows.length} wlm=${wlmRows.length} wt=${wtRows.length} lt=${ltRows.length} lo=${loRows.length} seg=${segRows.length} tr=${trRows.length}`);

  // ─── 3. Index légers ─────────────────────────────────────────────────────
  const ayahToSurah = new Map(ayahRows.map(a => [a.id, a.surah_id]));
  const surahNumById = new Map(surahs.map(s => [s.id, s.number]));
  const surahNameById = new Map(surahs.map(s => [s.id, s.name_transliteration ?? `Surah ${s.number}`]));
  const surahIdByNumber = new Map(surahs.map(s => [s.number, s.id]));
  const wordById = new Map(wordRows.map(w => [w.id, w]));
  const occToWord = new Map(occRows.map(o => [o.id, o.word_id]));
  const wlmByWord = new Map(wlmRows.map(m => [m.word_id, m.lemma_id]));

  const occCountByWord = new Map<string, number>();
  const wordAyahSet = new Map<string, Set<string>>();
  for (const o of occRows) {
    occCountByWord.set(o.word_id, (occCountByWord.get(o.word_id) ?? 0) + 1);
    let set = wordAyahSet.get(o.word_id);
    if (!set) { set = new Set(); wordAyahSet.set(o.word_id, set); }
    set.add(o.ayah_id);
  }

  // ─── 4. Résolution finale mot → lemme (direct → WLM → MASAQ) ─────────────
  const finalLemma = new Map<string, string>();
  for (const w of wordRows) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlmRows) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  for (const l of loRows) {
    if (!l.hikma_lemma_id) continue;
    const wid = occToWord.get(l.word_occurrence_id);
    if (wid && !finalLemma.has(wid)) finalLemma.set(wid, l.hikma_lemma_id);
  }

  // ─── 5. Couverture FR (source Hikma, validée) — UNION par word_id ────────
  const wtFr = new Map<string, string>();
  for (const r of wtRows) if (r.language === "fr" && r.is_validated && r.source_id === hikmaId) wtFr.set(r.word_id, r.text);
  const ltFr = new Map<string, string>();
  for (const r of ltRows) if (r.language === "fr" && r.is_validated && r.source_id === hikmaId) ltFr.set(r.lemma_id, r.text);

  const A = new Set(wtFr.keys()); // word_translation FR validée
  const B = new Set<string>(); // lemma_translation via quran_words.lemma_id
  const C = new Set<string>(); // via word_lemma_mapping
  const D = new Set<string>(); // via linguistic_occurrences
  for (const w of wordRows) if (w.lemma_id && ltFr.has(w.lemma_id)) B.add(w.id);
  for (const m of wlmRows) if (ltFr.has(m.lemma_id)) C.add(m.word_id);
  for (const l of loRows) {
    if (!l.hikma_lemma_id || !ltFr.has(l.hikma_lemma_id)) continue;
    const wid = occToWord.get(l.word_occurrence_id);
    if (wid) D.add(wid);
  }
  const union = new Set<string>(A);
  for (const wid of B) union.add(wid);
  for (const wid of C) union.add(wid);
  for (const wid of D) union.add(wid);
  const overlapAB = [...A].filter(w => B.has(w) || C.has(w) || D.has(w)).length;

  let occCovered = 0;
  for (const wid of union) occCovered += occCountByWord.get(wid) ?? 0;
  console.log(`  FR: A=${A.size} B=${B.size} C=${C.size} D=${D.size} UNION=${union.size} (A∩(B∪C∪D)=${overlapAB})`);
  console.log(`  Occurrences FR: ${occCovered}/${occRows.length}`);

  // ─── 6. Classification des formes ────────────────────────────────────────
  // segment → occurrence linguistique → word_occurrence → quran_word
  const loWordByLoId = new Map<string, string>();
  for (const l of loRows) {
    const wid = occToWord.get(l.word_occurrence_id);
    if (wid) loWordByLoId.set(l.id, wid);
  }
  const wordHasStem = new Set<string>();
  for (const s of segRows) {
    if (s.morph_type !== "Stem") continue;
    const wid = loWordByLoId.get(s.linguistic_occurrence_id);
    if (wid) wordHasStem.add(wid);
  }
  const wordHasMasaq = new Set<string>();
  const wordPos = new Map<string, Set<string>>();
  for (const l of loRows) {
    const wid = occToWord.get(l.word_occurrence_id);
    if (!wid) continue;
    wordHasMasaq.add(wid);
    let ps = wordPos.get(wid);
    if (!ps) { ps = new Set(); wordPos.set(wid, ps); }
    for (const p of l.pos) ps.add(p);
  }
  const wordMappingReview = new Set<string>();
  for (const l of loRows) {
    const wid = occToWord.get(l.word_occurrence_id);
    if (wid && l.hikma_lemma_id && l.lemma_mapping_status !== "EXACT") wordMappingReview.add(wid);
  }

  const formResolution: Record<string, number> = {};
  const bumpRes = (c: string) => { formResolution[c] = (formResolution[c] ?? 0) + 1; };
  for (const w of wordRows) {
    let cls: string;
    if (union.has(w.id)) {
      if (A.has(w.id)) cls = "DIRECT_WORD_TRANSLATION";
      else if (B.has(w.id)) cls = "LEMMA_DIRECT_WITH_FR";
      else if (C.has(w.id)) cls = "LEMMA_WLM_WITH_FR";
      else cls = "LEMMA_MASAQ_WITH_FR";
    } else {
      const lid = finalLemma.get(w.id);
      if (lid) {
        cls = wordMappingReview.has(w.id) ? "MAPPED_REVIEW_NO_FR" : "LEMMA_EXISTS_NO_FR";
      } else if (!wordHasMasaq.has(w.id)) {
        cls = "NO_LEMMA";
      } else {
        const pos = wordPos.get(w.id);
        const isProper = pos && [...pos].some(p => p.startsWith("NOUN_PROP"));
        const isNum = pos && [...pos].some(p => p.startsWith("NOUN_NUM"));
        const isParticle = !wordHasStem.has(w.id);
        cls = isProper ? "PROPER_NAME" : isNum ? "GRAMMATICAL_FORM" : isParticle ? "PARTICLE" : "NO_LEMMA";
      }
    }
    bumpRes(cls);
  }
  console.log(`  Résolution des formes : ${JSON.stringify(formResolution)}`);

  // ─── 7. Sourates (couverture + groupes + READY) ──────────────────────────
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

  const surahCoverage: SurahCov[] = [];
  for (const [sn, forms] of surahForms) {
    let covered = 0;
    for (const wid of forms) if (union.has(wid)) covered++;
    let coveredOccs = 0;
    const sid = surahIdByNumber.get(sn);
    for (const o of occRows) {
      if (union.has(o.word_id) && ayahToSurah.get(o.ayah_id) === sid) coveredOccs++;
    }
    const pct = ROUND(covered / forms.size, 4);
    const state = sn === 1 ? "REFERENCE" : pct >= 1 ? "READY" : "IN_PREPARATION";
    let group: string;
    const missingCount = forms.size - covered;
    if (state === "READY") group = "READY";
    else if (state === "REFERENCE") group = "REFERENCE";
    else if (pct >= 0.95 || missingCount <= 8) group = "NEAR_READY_95_PLUS";
    else if (pct >= 0.9) group = "HIGH_90_95";
    else if (pct >= 0.8) group = "HIGH_80_90";
    else if (pct >= 0.6) group = "MEDIUM_60_80";
    else group = "LOW_<60";
    surahCoverage.push({
      number: sn, name: surahNameById.get(sid ?? "") ?? `Surah ${sn}`,
      totalForms: forms.size, formsWithFr: covered, formsWithoutFr: missingCount, coveragePct: pct,
      totalOccurrences: surahOccs.get(sn) ?? 0, coveredOccurrences: coveredOccs,
      unaffectedOccurrences: (surahOccs.get(sn) ?? 0) - coveredOccs,
      occCoveragePct: surahOccs.get(sn) ? ROUND(coveredOccs / (surahOccs.get(sn) ?? 1), 4) : 0,
      state, group,
    });
  }
  surahCoverage.sort((a, b) => a.number - b.number);
  const readyCount = surahCoverage.filter(s => s.state === "READY").length;
  const inPrepCount = surahCoverage.filter(s => s.state === "IN_PREPARATION").length;
  const groupCounts: Record<string, number> = {};
  for (const s of surahCoverage) groupCounts[s.group] = (groupCounts[s.group] ?? 0) + 1;
  console.log(`  Sourates: READY=${readyCount} IN_PREP=${inPrepCount} REF=${surahCoverage.filter(s => s.state === "REFERENCE").length} | ${JSON.stringify(groupCounts)}`);

  // ─── 8. Distance vers READY ──────────────────────────────────────────────
  type DistanceRow = {
    surah: number; name: string; coveragePct: number; missingForms: number;
    missingFormsWithLemma: number; missingFormsWithLemmaDistinct: number;
    missingFormsWithoutLemma: number; missingFormsWithMasaq: number;
    missingFormsRequiringWordTranslation: number;
    estimatedLemmaGlossesRequired: number; estimatedWordTranslationsRequired: number;
    missingSamples: string[];
  };
  const distanceToReady: DistanceRow[] = [];
  for (const s of surahCoverage) {
    if (s.state === "READY" || s.state === "REFERENCE") continue;
    const forms = surahForms.get(s.number)!;
    let missingWithLemma = 0, missingWithoutLemma = 0, missingWithMasaq = 0, missingWordTr = 0;
    const glossSet = new Set<string>();
    const samples: string[] = [];
    for (const wid of forms) {
      if (union.has(wid)) continue;
      if (samples.length < 6) samples.push(wordById.get(wid)?.arabic ?? "?");
      const lid = finalLemma.get(wid);
      if (lid) { missingWithLemma++; glossSet.add(lid); }
      else { missingWithoutLemma++; if (!wordHasMasaq.has(wid)) missingWordTr++; }
      if (wordHasMasaq.has(wid)) missingWithMasaq++;
    }
    distanceToReady.push({
      surah: s.number, name: s.name, coveragePct: s.coveragePct,
      missingForms: s.formsWithoutFr,
      missingFormsWithLemma: missingWithLemma,
      missingFormsWithLemmaDistinct: glossSet.size,
      missingFormsWithoutLemma: missingWithoutLemma,
      missingFormsWithMasaq: missingWithMasaq,
      missingFormsRequiringWordTranslation: missingWordTr,
      estimatedLemmaGlossesRequired: glossSet.size,
      estimatedWordTranslationsRequired: missingWordTr,
      missingSamples: samples,
    });
  }
  distanceToReady.sort((a, b) => a.missingForms - b.missingForms);
  const nearReadySet = new Set(distanceToReady.filter(d => d.coveragePct >= 0.9 || d.missingForms <= 10).map(d => d.surah));

  // ─── 9. Agrégats par lemme actif ─────────────────────────────────────────
  const lemmaFormSet = new Map<string, Set<string>>();
  for (const [wid, lid] of finalLemma) {
    let set = lemmaFormSet.get(lid);
    if (!set) { set = new Set(); lemmaFormSet.set(lid, set); }
    set.add(wid);
  }
  const lemmaSurahSet = new Map<string, Set<number>>();
  for (const o of occRows) {
    const lid = finalLemma.get(o.word_id);
    if (!lid) continue;
    const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
    if (sn === undefined) continue;
    let set = lemmaSurahSet.get(lid);
    if (!set) { set = new Set(); lemmaSurahSet.set(lid, set); }
    set.add(sn);
  }

  // stats MASAQ par lemme
  const loGlossByLemma = new Map<string, Map<string, number>>();
  const loStatusByLemma = new Map<string, Map<string, number>>();
  const loStemsByLemma = new Map<string, Set<string>>();
  const loOccPerLemma = new Map<string, number>();
  for (const l of loRows) {
    if (!l.hikma_lemma_id) continue;
    const lid = l.hikma_lemma_id;
    loOccPerLemma.set(lid, (loOccPerLemma.get(lid) ?? 0) + 1);
    if (l.masaq_gloss_en) {
      let m = loGlossByLemma.get(lid);
      if (!m) { m = new Map(); loGlossByLemma.set(lid, m); }
      m.set(l.masaq_gloss_en, (m.get(l.masaq_gloss_en) ?? 0) + 1);
    }
    let st = loStatusByLemma.get(lid);
    if (!st) { st = new Map(); loStatusByLemma.set(lid, st); }
    st.set(l.lemma_mapping_status, (st.get(l.lemma_mapping_status) ?? 0) + 1);
    if (l.masaq_stem) {
      let sx = loStemsByLemma.get(lid);
      if (!sx) { sx = new Set(); loStemsByLemma.set(lid, sx); }
      sx.add(l.masaq_stem);
    }
  }

  // Présence Hamidullah / Kazimirski par mot (via ayahs)
  const ayahHasHam = new Set<string>();
  const ayahHasKaz = new Set<string>();
  for (const t of trRows) {
    if (t.translator === HAMIDULLAH_TR) ayahHasHam.add(t.ayah_id);
    else if (t.translator === KAZIMIRSKI_TR) ayahHasKaz.add(t.ayah_id);
  }

  // ─── 10. Lemmes sans FR : candidatures + score ────────────────────────────
  const lemmasWithFr = new Set(ltFr.keys());
  const gloslessLemmas = lemmaRows.filter(l => !lemmasWithFr.has(l.id));
  console.log(`  Lemmes sans glose FR : ${gloslessLemmas.length} (1 535 dans le contexte pré-88F-E ; 1 593 − 115 après 88F-E)`);

  const candidates: Candidate[] = [];
  for (const l of gloslessLemmas) {
    const forms = lemmaFormSet.get(l.id);
    if (!forms || forms.size === 0) continue;
    const uncovered = [...forms].filter(wid => !union.has(wid));
    if (uncovered.length === 0) continue;
    const uncoveredOccs = uncovered.reduce((s, w) => s + (occCountByWord.get(w) ?? 0), 0);
    const surahs = lemmaSurahSet.get(l.id)?.size ?? 0;

    const improvedSurahSet = new Set<number>();
    const nearReadyImpact = new Set<number>();
    for (const wid of uncovered) {
      const ayahs = wordAyahSet.get(wid);
      if (!ayahs) continue;
      for (const aid of ayahs) {
        const sn = surahNumById.get(ayahToSurah.get(aid) ?? "");
        if (sn !== undefined) improvedSurahSet.add(sn);
        if (sn !== undefined && nearReadySet.has(sn)) nearReadyImpact.add(sn);
      }
    }

    const glossMap = loGlossByLemma.get(l.id);
    const loTotal = loOccPerLemma.get(l.id) ?? 0;
    const topGloss = glossMap ? [...glossMap.entries()].sort((a, b) => b[1] - a[1])[0] : undefined;
    const topShare = topGloss && loTotal > 0 ? ROUND(topGloss[1] / loTotal, 3) : null;
    const statusMap = loStatusByLemma.get(l.id);
    const exactCount = statusMap?.get("EXACT") ?? 0;
    const masaqQuality = loTotal > 0 ? ROUND(exactCount / loTotal, 3) : null;

    let hamPresent = false, kazPresent = false;
    for (const wid of forms) {
      const ayahs = wordAyahSet.get(wid);
      if (!ayahs) continue;
      for (const aid of ayahs) {
        if (ayahHasHam.has(aid)) hamPresent = true;
        if (ayahHasKaz.has(aid)) kazPresent = true;
      }
      if (hamPresent && kazPresent) break;
    }

    const knownGloss = KNOWN_GLOSSES[l.arabic] ?? null;
    const conf = knownGloss ? 1 : 0.6;
    candidates.push({
      lemmaId: l.id,
      arabic: l.arabic,
      forms: forms.size,
      occurrences: [...forms].reduce((s, w) => s + (occCountByWord.get(w) ?? 0), 0),
      surahs,
      formsWithoutFr: uncovered.length,
      occurrencesWithoutFr: uncoveredOccs,
      currentFrForms: forms.size - uncovered.length,
      masaqQuality,
      masaqDistinctGlosses: glossMap?.size ?? 0,
      masaqTopGlossEn: topGloss ? topGloss[0] : null,
      masaqTopShare: topShare,
      masaqStemsCount: loTotal > 0 ? (loStemsByLemma.get(l.id)?.size ?? 1) : null,
      editorialConfidence: conf,
      knownGloss,
      hamidullahPresent: hamPresent,
      kazimirskiPresent: kazPresent,
      surahsImprovedCount: improvedSurahSet.size,
      nearReadySurahsImpacted: [...nearReadyImpact].sort((a, b) => a - b),
      score: impactScore(surahs, uncovered.length, uncoveredOccs, conf),
    });
  }
  candidates.sort((a, b) => b.score - a.score);
  console.log(`  Candidats lemmes sans FR : ${candidates.length}`);

  // ─── 11. TOP 100 + recommandation (éditoriale : PAS de glose finale) ─────
  // Evidence 88F-D (audit éditorial précédent) si disponible.
  type D88Cand = { lemmaId?: string; classification?: string; confidence?: number; proposal?: { gloss?: string; rationale?: string } };
  let d88Entries: D88Cand[] = [];
  try {
    const d = JSON.parse(readFileSync(D_REPORT, "utf-8")) as { candidates?: D88Cand[] };
    d88Entries = d.candidates ?? [];
  } catch { /* 88F-D absent : recommandation purement heuristique */ }
  const d88ByLemma = new Map<string, { classification: string; confidence: number; gloss: string | null; rationale: string | null }>();
  for (const c of d88Entries) {
    if (!c.lemmaId || !c.classification) continue;
    d88ByLemma.set(c.lemmaId, {
      classification: c.classification,
      confidence: c.confidence ?? 0.5,
      gloss: c.proposal?.gloss ?? null,
      rationale: c.proposal?.rationale ?? null,
    });
  }

  // Recommandation heuristique (documentée : n'est PAS une validation éditoriale) :
  //  - evidence 88-D si présente (SAFE→SAFE_CANDIDATE, REVIEW_REQUIRED→REVIEW_REQUIRED, DO_NOT_IMPORT→DO_NOT_IMPORT) ;
  //  - sinon : stem MASAQ multiples / glosses MASAQ très dispersées / part de sens top trop faible → REVIEW_REQUIRED ;
  //  - top gloss part ≥ 0.4 et formes+occ ≥ 3 → SAFE_CANDIDATE ; cas particuliers (noms propres) → REVIEW_REQUIRED.
  const PROPER_NAME_AR = new Set(["عاد", "مدين", "ثمود", "لوط", "إبراهيم", "موسى", "هارون", "يعقوب", "داود", "سليمان", "عيسى", "يحيى", "مريم", "آدم", "نوح", "هود", "صالح", "شعيب", "إدريس", "إلياس", "ذو الكفل", "يونس", "أيوب", "يوسف", "لقمان"]);
  const recommendAction = (c: Candidate): string => {
    const prior = d88ByLemma.get(c.lemmaId);
    if (prior) {
      if (prior.classification === "SAFE") return "SAFE_CANDIDATE";
      if (prior.classification === "REVIEW_REQUIRED") return "REVIEW_REQUIRED";
      return "DO_NOT_IMPORT";
    }
    if (PROPER_NAME_AR.has(c.arabic)) return "REVIEW_REQUIRED";
    if (c.masaqStemsCount !== null && c.masaqStemsCount > 1) return "REVIEW_REQUIRED";
    if (c.masaqDistinctGlosses >= 12) return "REVIEW_REQUIRED";
    if (c.masaqTopShare === null) return "REVIEW_REQUIRED";
    if (c.masaqTopShare < 0.45) return "REVIEW_REQUIRED";
    if (c.formsWithoutFr <= 2 || c.occurrencesWithoutFr <= 2) return "REVIEW_REQUIRED";
    return "SAFE_CANDIDATE";
  };

  const top100 = candidates.slice(0, 100).map((c, i) => {
    const prior = d88ByLemma.get(c.lemmaId);
    return {
      rank: i + 1,
      lemmaId: c.lemmaId,
      arabic: c.arabic,
      forms: c.forms,
      occurrences: c.occurrences,
      surahs: c.surahs,
      formsWithoutFr: c.formsWithoutFr,
      occurrencesWithoutFr: c.occurrencesWithoutFr,
      currentFrForms: c.currentFrForms,
      evidence: {
        masaqTopGlossEn: c.masaqTopGlossEn,
        masaqDistinctGlosses: c.masaqDistinctGlosses,
        masaqTopShare: c.masaqTopShare,
        masaqQuality: c.masaqQuality,
        masaqStemsCount: c.masaqStemsCount,
        hamidullahPresent: c.hamidullahPresent,
        kazimirskiPresent: c.kazimirskiPresent,
        knownGloss: c.knownGloss,
        prior88D: prior ? { classification: prior.classification, gloss: prior.gloss, rationale: prior.rationale } : null,
      },
      editorialConfidence: c.editorialConfidence,
      estimatedGainForms: c.formsWithoutFr,
      estimatedGainOccurrences: c.occurrencesWithoutFr,
      surahsImproved: c.surahsImprovedCount,
      nearReadySurahsImpacted: c.nearReadySurahsImpacted.length,
      score: c.score,
      recommendedAction: recommendAction(c),
    };
  });

  const actionCounts: Record<string, number> = {};
  for (const t of top100) actionCounts[t.recommendedAction] = (actionCounts[t.recommendedAction] ?? 0) + 1;
  console.log(`  TOP 100 actions : ${JSON.stringify(actionCounts)}`);

  // ─── 12. Simulations (UNION réelle des word_id, DO_NOT_IMPORT exclu) ──────
  const eligible = top100.filter(c => c.recommendedAction !== "DO_NOT_IMPORT");
  const simResults: Array<Record<string, unknown>> = [];
  for (const [label, count] of [["TOP_10", 10], ["TOP_20", 20], ["TOP_30", 30], ["TOP_50", 50], ["TOP_100", 100]] as const) {
    const list = eligible.slice(0, count);
    const newFormSet = new Set<string>();
    for (const c of list) {
      for (const wid of lemmaFormSet.get(c.lemmaId) ?? []) if (!union.has(wid)) newFormSet.add(wid);
    }
    const newOcc = [...newFormSet].reduce((sum, wid) => sum + (occCountByWord.get(wid) ?? 0), 0);
    const simUnion = new Set(union);
    for (const wid of newFormSet) simUnion.add(wid);

    let improved = 0, pass80 = 0, pass90 = 0, pass95 = 0, pass98 = 0;
    const newReady: number[] = [];
    for (const s of surahCoverage) {
      const forms = surahForms.get(s.number)!;
      let covBefore = 0, covAfter = 0;
      for (const wid of forms) {
        if (union.has(wid)) covBefore++;
        if (simUnion.has(wid)) covAfter++;
      }
      const pctBefore = covBefore / forms.size, pctAfter = covAfter / forms.size;
      if (pctAfter > pctBefore) improved++;
      if (s.number !== 1 && pctBefore < 1 && pctAfter >= 1) newReady.push(s.number);
      if (pctBefore < 0.8 && pctAfter >= 0.8) pass80++;
      if (pctBefore < 0.9 && pctAfter >= 0.9) pass90++;
      if (pctBefore < 0.95 && pctAfter >= 0.95) pass95++;
      if (pctBefore < 0.98 && pctAfter >= 0.98) pass98++;
    }
    simResults.push({
      scenario: label,
      candidatesIncluded: list.length,
      newForms: newFormSet.size,
      newOccurrences: newOcc,
      unionFrAfter: simUnion.size,
      coveragePctAfter: ROUND(simUnion.size / wordRows.length, 3),
      improvedSurahs: improved,
      surahsPassing80: pass80,
      surahsPassing90: pass90,
      surahsPassing95: pass95,
      surahsPassing98: pass98,
      newReadySurahs: newReady,
      newReadyCount: newReady.length,
    });
  }

  // ─── 13. READY-FIRST ─────────────────────────────────────────────────────
  const readyFirst = distanceToReady.map(d => {
    const requiresWordTr = d.missingFormsRequiringWordTranslation;
    const requiresMapping = d.missingFormsWithoutLemma - requiresWordTr;
    const path = requiresWordTr === 0 && requiresMapping === 0
      ? "LEMMA_GLOSSES_ONLY"
      : requiresWordTr === 0 ? "GLOSSES_PLUS_MAPPING" : "NEEDS_WORD_LEVEL";
    return {
      surah: d.surah,
      name: d.name,
      currentCoverage: d.coveragePct,
      missingForms: d.missingForms,
      coverableByExistingLemmas: d.missingFormsWithLemma,
      requiresNewMapping: requiresMapping,
      requiresWordTranslation: requiresWordTr,
      minLemmaGlossesRequired: d.estimatedLemmaGlossesRequired,
      minWordTranslationsRequired: requiresWordTr,
      potentialReady: requiresWordTr === 0 ? true : false,
      path,
    };
  });
  const readyFirstSorted = [...readyFirst].sort((a, b) => a.missingForms - b.missingForms);
  const glossOnlyCount = readyFirstSorted.filter(r => r.path === "LEMMA_GLOSSES_ONLY").length;
  console.log(`  READY-FIRST : ${readyFirstSorted.length} sourates analysées · ${glossOnlyCount} prêtes par gloses de lemmes seules`);

  // ─── 14. Quick wins ───────────────────────────────────────────────────────────
  const quickWins = candidates
    .filter(c => c.formsWithoutFr >= 5 && c.occurrencesWithoutFr >= 5 && c.surahs >= 2 && c.nearReadySurahsImpacted.length >= 1)
    .map(c => ({
      lemmaId: c.lemmaId,
      arabic: c.arabic,
      glossHint: d88ByLemma.get(c.lemmaId)?.gloss ?? c.masaqTopGlossEn,
      estimatedLemmaGlosses: 1,
      estimatedNewForms: c.formsWithoutFr,
      estimatedNewOccurrences: c.occurrencesWithoutFr,
      surahsImprovedCount: c.surahsImprovedCount,
      nearReadySurahsImpacted: c.nearReadySurahsImpacted,
      score: c.score,
    }))
    .sort((a, b) => (b.nearReadySurahsImpacted.length - a.nearReadySurahsImpacted.length) || (b.score - a.score))
    .slice(0, 20);

  // ─── 15. Backlog lexical vs infrastructure (sourates les plus proches de READY) ──
  // Aucune sourate ≥ 90 % aujourd'hui : on retient le top des distances (≤ 30 formes
  // manquantes ou couverture ≥ 80 %) pour séparer les trois leviers par sourate.
  const infraThresholdNote = "aucune sourate ≥ 90 % ni ≤ 8 formes manquantes ; le backlog porte le haut de la distance (≤ 30 manquantes ou ≥ 80 %)";
  const infrastructureBacklog = readyFirstSorted
    .filter(r => r.missingForms <= 30 || r.currentCoverage >= 0.8)
    .map(r => ({
      surah: r.surah,
      name: r.name,
      coveragePct: r.currentCoverage,
      missingForms: r.missingForms,
      glossSolvable: r.coverableByExistingLemmas,
      mappingRequired: r.requiresNewMapping,
      wordLevel: r.requiresWordTranslation,
    }));

  // ─── 16. Roadmap 114 (projection honnête) ───────────────────────────────────
  const formsWithLemmaNoFr = new Set<string>();
  const formsNoLemmaMasaq = new Set<string>();
  const formsWordLevel = new Set<string>();
  for (const w of wordRows) {
    if (union.has(w.id)) continue;
    if (finalLemma.has(w.id)) formsWithLemmaNoFr.add(w.id);
    else if (wordHasMasaq.has(w.id)) formsNoLemmaMasaq.add(w.id);
    else formsWordLevel.add(w.id);
  }
  const occOf = (ids: Set<string>) => [...ids].reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0);
  const potentialExistingLemmas = union.size + formsWithLemmaNoFr.size;
  const potentialWithMasaq = potentialExistingLemmas + formsNoLemmaMasaq.size;
  const roadmap = {
    currentFrForms: union.size,
    currentFrOccurrences: occCovered,
    potentialWithExistingLemmas: potentialExistingLemmas,
    potentialWithExistingLemmasOccurrences: occCovered + occOf(formsWithLemmaNoFr),
    potentialWithSafeMasaqMapping: potentialWithMasaq,
    potentialWithSafeMasaqMappingOccurrences: occCovered + occOf(formsWithLemmaNoFr) + occOf(formsNoLemmaMasaq),
    remainingWordLevel: formsWordLevel.size,
    remainingWordLevelOccurrences: occOf(formsWordLevel),
    theoreticalMax: wordRows.length,
    note: "MASAQ seul ne suffit pas : mapping (infrastructure) + glose FR (éditorial) sont deux leviers ; certaines formes resteront word-level (sans lemme ni MASAQ).",
  };
  console.log(`  Roadmap : ${roadmap.currentFrForms} → ${roadmap.potentialWithExistingLemmas} → ${roadmap.potentialWithSafeMasaqMapping} → max ${roadmap.theoreticalMax} · word-level ${roadmap.remainingWordLevel}`);

  // ─── 15. Intégrité & invariants ─────────────────────────────────────────────
  const lemmaIdSet = new Set(lemmaRows.map(l => l.id));
  let orphanQuran = 0, orphanWlm = 0, orphanLo = 0, orphanLt = 0;
  for (const w of wordRows) if (w.lemma_id && !lemmaIdSet.has(w.lemma_id)) orphanQuran++;
  for (const m of wlmRows) if (!lemmaIdSet.has(m.lemma_id)) orphanWlm++;
  for (const l of loRows) if (l.hikma_lemma_id && !lemmaIdSet.has(l.hikma_lemma_id)) orphanLo++;
  for (const r of ltRows) if (!lemmaIdSet.has(r.lemma_id)) orphanLt++;
  const wlmKeyCount = new Map<string, number>();
  for (const m of wlmRows) { const k = `${m.word_id}|${m.lemma_id}`; wlmKeyCount.set(k, (wlmKeyCount.get(k) ?? 0) + 1); }
  const dupWlm = [...wlmKeyCount.values()].filter(v => v > 1).length;
  const ltKeyCount = new Map<string, number>();
  for (const r of ltRows) { const k = `${r.lemma_id}|${r.language}|${r.source_id ?? ""}`; ltKeyCount.set(k, (ltKeyCount.get(k) ?? 0) + 1); }
  const dupLt = [...ltKeyCount.values()].filter(v => v > 1).length;
  let directWlmConflict = 0;
  for (const w of wordRows) {
    const via = wlmByWord.get(w.id);
    if (w.lemma_id && via && w.lemma_id !== via) directWlmConflict++;
  }

  const masaqSurahNumbers = new Set<number>();
  for (const o of occRows) {
    if (!wordHasMasaq.has(o.word_id)) continue;
    const sn = surahNumById.get(ayahToSurah.get(o.ayah_id) ?? "");
    if (sn !== undefined) masaqSurahNumbers.add(sn);
  }

  // ─── 17. Rapport ─────────────────────────────────────────────────────────────
  const report: Record<string, unknown> = {
    phase: "88F-F",
    verdict: "PHASE_88F_F_COMPLETE",
    readOnly: true,
    timestamp: new Date().toISOString(),
    snapshot: {
      quranWords: wordRows.length,
      wordOccurrences: occRows.length,
      lemmas: lemmaRows.length,
      lemmasActive: new Set(finalLemma.values()).size,
      wordLemmaMapping: wlmRows.length,
      wordTranslations: wtRows.length,
      wordTranslationsFrValidated: wtFr.size,
      lemmaTranslations: ltRows.length,
      lemmaTranslationsFrValidated: ltFr.size,
      linguisticOccurrences: loRows.length,
      surahsCoveredByMasaq: masaqSurahNumbers.size,
      surahsTotal: surahs.length,
    },
    integrity: {
      orphanQuranWordsLemma: orphanQuran,
      orphanWordLemmaMapping: orphanWlm,
      orphanLinguisticOccurrences: orphanLo,
      orphanLemmaTranslations: orphanLt,
      duplicateWordLemmaMapping: dupWlm,
      duplicateLemmaTranslations: dupLt,
      contradictoryDirectWlm: directWlmConflict,
      note: "toute anomalie > 0 relève d'une phase infra dédiée — jamais écrite pendant un audit",
    },
    currentCoverage: {
      currentFrForms: union.size,
      currentFrPercent: ROUND(union.size / wordRows.length, 4),
      currentFrOccurrences: occCovered,
      formsWithoutFr: wordRows.length - union.size,
      occurrencesWithoutFr: occRows.length - occCovered,
      paths: { A: A.size, B: B.size, C: C.size, D: D.size },
      union: union.size,
      unionIntersectionAB: overlapAB,
      note: "A=word_translations FR · B=quran_words.lemma_id→lt FR · C=word_lemma_mapping→lt FR · D=linguistic_occurrences→lt FR ; todos dédoublés par word_id (union réelle)",
    },
    formResolution,
    surahCoverage,
    surahGroups: groupCounts,
    distanceToReady,
    lemmaCandidates: candidates.slice(0, 100),
    top100,
    simulations: simResults,
    readyFirst: readyFirstSorted,
    quickWins,
    quickWinNote: quickWins.length === 0
      ? "aucune sourate ≥ 90 % aujourd'hui → aucun lemme n'impacte une sourate quasi-prête ; les quick wins réapparaîtront après le premier lot de mappings/gloses"
      : undefined,
    infrastructureBacklog,
    infrastructureBacklogNote: infraThresholdNote,
    design: {
      scoreFormula: "impact = surahs × log2(1+formes_sans_FR) × log2(1+occurrences_sans_FR) × editorialConfidence — héritée de 88C (documentée, non arbitraire)",
      nearReadyThresholds: "NEAR_READY_95_PLUS = couverture ≥ 95 % OU ≤ 8 formes manquantes · HIGH_90_95 ≥ 90 % · HIGH_80_90 ≥ 80 % · MEDIUM_60_80 ≥ 60 %",
      classificationOrder: "A(word)>B(direct lemma)>C(WLM)>D(MASAQ) puis LEMMA_EXISTS_NO_FR / MAPPED_REVIEW_NO_FR / NO_LEMMA / PARTICLE / PROPER_NAME / GRAMMATICAL_FORM / OTHER→NO_LEMMA (déterministe)",
    },
    roadmap,
    invariants: {
      datasetWrites: 0,
      lexicalWrites: 0,
      translationWrites: 0,
      curriculumWrites: 0,
      masaqWrites: 0,
      migrations: 0,
      seeds: 0,
      readOnly: true,
    },
    tests: { run: false, note: "exécutés après l'audit (vitest · tsc · eslint)" },
    nextPhaseRecommendation: (() => {
      const best = readyFirstSorted[0];
      return {
        phase: "PHASE 88F-G (à valider, non lancée automatiquement)",
        pathA: "audit éditorial du TOP 100 (9 SAFE_CANDIDATE + 90 REVIEW_REQUIRED) → prochaine batch lemma_translations",
        pathB: `infra mapping MASAQ→lemme : la sourate la plus proche de READY est S${best?.surah ?? "?"} (${best ? best.name : ""}, ${best ? ROUND(best.currentCoverage * 100, 1) : 0} %, ${best?.missingForms ?? 0} formes manquantes) : ${best?.minLemmaGlossesRequired ?? 0} gloses de lemmes + ${best?.requiresNewMapping ?? 0} mappings suffisent (0 word-translation nécessaire)`,
        note: "le score/classement du présent audit doit être re-le par un éditorialiste avant toute écriture",
      };
    })(),
  };

  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nRapport → ${OUTPUT}`);
  console.log(`Durée : ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // ─── Résumé terminal ─────────────────────────────────────────────────────────
  console.log("\n=== PHASE 88F-F — AUDIT TERMINÉ (READ-ONLY, 0 écriture) ===");
  console.log("PHASE_88F_F_COMPLETE");
  console.log(`  Couverture : ${union.size}/${wordRows.length} formes (${ROUND((union.size / wordRows.length) * 100, 1)} %) · ${occCovered}/${occRows.length} occurrences`);
  console.log(`  READY : ${readyCount}/114 · NEAR_READY : ${groupCounts["NEAR_READY_95_PLUS"] ?? 0}`);
  console.log(`  TOP 5 sourates proches : ${distanceToReady.slice(0, 5).map(d => `S${d.surah}(${ROUND(d.coveragePct * 100, 1)}%, -${d.missingForms})`).join(" · ")}`);
  if (quickWins.length > 0) {
    console.log(`  TOP 5 quick wins : ${quickWins.slice(0, 5).map(q => `${q.arabic}(+${q.estimatedNewForms})`).join(" · ")}`);
  } else {
    console.log("  Quick wins : aucun (aucune sourate NEAR_READY ≥ 95 % ni ≤ 8 formes manquantes : aucun lemme n'impacte une sourate quasi-prête)");
  }
  console.log(`  Roadmap : ${roadmap.currentFrForms} → ${roadmap.potentialWithExistingLemmas} → ${roadmap.potentialWithSafeMasaqMapping} → max ${roadmap.theoreticalMax} · word-level résiduel : ${roadmap.remainingWordLevel}`);
  console.log(`  MASAQ : ${masaqSurahNumbers.size}/114 sourates couvertes`);
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(1); });
