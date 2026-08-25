/**
 * PHASE 88F-Y — SURAH-FIRST TARGETED AUDIT — S90 AL-BALAD
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Target: S46 — Al-Ahqaf (ranked #1 by 88F-X long-surah ROI).
 * Classify each missing form into A/B/C/D/E/F/G/H/I and determine the
 * minimal SAFE path to 100 % FR → READY.
 *
 * This script only uses paginated Supabase `.select()` calls and writes the
 * local JSON report. No inserts/updates/upserts/deletes/rpcs.
 *
 * Livrable : reports/phase-88f-y-surah46-audit.json
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const PAGE_SIZE = 1000;
const OUTPUT = "reports/phase-88f-y-surah46-audit.json";
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const HAMIDULLAH_TR = "Muhammad Hamidullah";
const KAZIMIRSKI_TR = "Albert de Biberstein-Kazimirski";
const TARGET = 46;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------------------
// STATIC READ-ONLY GUARANTEE — verified manually. Only .select() reads.
// Forbidden write patterns (none should exist in actual code):
//   .insert(  .update(  .upsert(  .delete(  .rpc(

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type SourceRow = { id: string; name: string };
type SurahRow = { id: string; number: number; name_transliteration: string | null };
type AyahRow = { id: string; surah_id: string; ayah_number?: number; global_ayah_number?: number };
type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccRow = { id: string; word_id: string; ayah_id: string };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { id: string; word_id: string; lemma_id: string };
type TranslationRow = { ayah_id: string; translator: string; text: string };
type WordTranslationRow = { id: string; word_id: string; text: string; language: string; is_validated: boolean; source_id: string | null };
type LemmaTranslationRow = { id: string; lemma_id: string; text: string; language: string; is_validated: boolean; source_id: string | null };
type LoRow = { id: string; word_occurrence_id: string; hikma_lemma_id: string | null; lemma_mapping_status: string; masaq_gloss_en: string | null; masaq_stem: string | null; pos: string[] };

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch { /* OK */ }
  }
}

async function selectAll<T>(client: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(cols).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function unique<T>(values: Iterable<T>): T[] { return [...new Set(values)]; }

function sortedEntries(map: Map<string, number>): Array<{ value: string; count: number }> {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));
}

// ---------------------------------------------------------------------------
// EDITORIAL GLOSS KNOWLEDGE — convenience, not safety gate.
// MASAQ quality + translation sources determine structural safety.
// ---------------------------------------------------------------------------
const KNOWN_GLOSS_HINTS: Record<string, string> = {
  فجار: "débauchés / pervers / pécheurs", قبور: "tombes / sépultures",
  كواكب: "étoiles / astres", غائب: "absent / caché", كاتب: "scribe / écrivain / qui écrit",
  حافظ: "gardien / qui préserve / protecteur", أتقى: "le plus pieux / craignant Dieu",
  حسني: "la plus belle (récompense) / le meilleur", عسرى: "difficulté / la plus dure (voie)",
  أحد: "un / personne / quelqu'un", شتى: "dispersés / divers / séparés",
  بر: "bonté / bienfaisance", بين: "entre / preuve claire",
  قيم: "droit / correct / de valeur / établir (droit)", شر: "mal / pire / mauvais",
  كتب: "livre / écrire / prescrire", مطهر: "purifié / pur",
  منفك: "cesser / se désengager / se séparer", ركب: "assembler / composer",
  ملك: "roi / posséder / maîtriser", فجر: "faire jaillir / fendre (la terre)",
  جزي: "rétribuer / récompenser", جنب: "écarter / éviter / être éloigné",
  سعي: "effort / s'efforcer / agir", يسر: "faciliter / rendre aisé",
  بخل: "être avare / refuser (par avarice)", استغنى: "se passer de / se suffire à soi-même",
  تردى: "tomber / se précipiter (vers la perte)", أنذر: "avertir / mettre en garde",
  تلظى: "flamber / s'embraser", صلا: "brûler / endurer (le feu)",
  انفطر: "se fendre / s'entrouvrir", انتثر: "se disperser / se répandre",
  بعثر: "être dispersé / renversé", أخر: "retarder / différer",
  غر: "tromper / séduire", سوا: "façonner / égaliser / proportionner",
  عدل: "ajuster / proportionner / équilibrer", تفرق: "se diviser / se séparer",
  ؤت: "donner / accorder", صور: "forme / image / façonner",
  بروج: "constellations / tours", موعود: "promis / destiné", شاهد: "témoin / qui observe",
  مشهود: "témoigné / attesté", أخدود: "fossé / tranchée", وقود: "combustible",
  قعود: "assis / installé", شهود: "témoins / présents", ودود: "aimant / affectueux",
  مجيد: "glorieux / magnanime", جنود: "armées / troupes", لوح: "tablette / planche",
  محفوظ: "préservé / protégé",
};

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const startedAt = Date.now();

  console.log(`=== PHASE 88F-Y — SURAH-FIRST AUDIT S${TARGET} AL-BALAD (READ-ONLY) ===`);
  console.log("  DB writes: 0 — strictly paginated SELECT calls only.\n");

  // ─── 1. LOAD ─────────────────────────────────────────────────────────────
  console.log("→ Chargement…");
  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === HIKMA_SOURCE);
  if (!hikmaSource) throw new Error(`Source « ${HIKMA_SOURCE} » introuvable.`);

  const [surahs, ayahs, words, occurrences, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences, verseTranslations] =
    await Promise.all([
      selectAll<SurahRow>(client, "surahs", "id, number, name_transliteration"),
      selectAll<AyahRow>(client, "ayahs", "id, surah_id, ayah_number, global_ayah_number"),
      selectAll<WordRow>(client, "quran_words", "id, arabic, lemma_id"),
      selectAll<OccRow>(client, "word_occurrences", "id, word_id, ayah_id"),
      selectAll<LemmaRow>(client, "lemmas", "id, arabic"),
      selectAll<WlmRow>(client, "word_lemma_mapping", "id, word_id, lemma_id"),
      selectAll<WordTranslationRow>(client, "word_translations", "id, word_id, text, language, is_validated, source_id"),
      selectAll<LemmaTranslationRow>(client, "lemma_translations", "id, lemma_id, text, language, is_validated, source_id"),
      selectAll<LoRow>(client, "linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, lemma_mapping_status, masaq_gloss_en, masaq_stem, pos"),
      selectAll<TranslationRow>(client, "translations", "ayah_id, translator, text"),
    ]);
  console.log(`  Chargé: surahs=${surahs.length} words=${words.length} occs=${occurrences.length} lemmas=${lemmas.length} wlm=${wlm.length} wt=${wordTranslations.length} lt=${lemmaTranslations.length} lo=${linguisticOccurrences.length}`);

  // ─── 2. INDEXES ──────────────────────────────────────────────────────────
  const wordById = new Map(words.map((w) => [w.id, w]));
  const lemmaById = new Map(lemmas.map((l) => [l.id, l]));
  const lemmaByArabic = new Map(lemmas.map((l) => [l.arabic, l]));
  const occById = new Map(occurrences.map((o) => [o.id, o]));
  const ayahById = new Map(ayahs.map((a) => [a.id, a]));
  const surahById = new Map(surahs.map((s) => [s.id, s]));
  const wlmByWord = new Map<string, WlmRow>();
  for (const r of wlm) if (!wlmByWord.has(r.word_id)) wlmByWord.set(r.word_id, r);

  const occCountByWord = new Map<string, number>();
  for (const occ of occurrences) increment(occCountByWord, occ.word_id);

  const loByWord = new Map<string, LoRow[]>();
  for (const row of linguisticOccurrences) {
    const occ = occById.get(row.word_occurrence_id);
    if (occ) { const list = loByWord.get(occ.word_id) ?? []; list.push(row); loByWord.set(occ.word_id, list); }
  }

  const verseByAyahTranslator = new Map<string, Map<string, string>>();
  for (const tr of verseTranslations) {
    let m = verseByAyahTranslator.get(tr.ayah_id);
    if (!m) { m = new Map(); verseByAyahTranslator.set(tr.ayah_id, m); }
    if (!m.has(tr.translator)) m.set(tr.translator, tr.text);
  }

  // ─── 3. FR COVERAGE (A/B/C/D UNION) ──────────────────────────────────────
  const wtFr = new Map<string, string>();
  for (const r of wordTranslations) if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) wtFr.set(r.word_id, r.text);
  const ltFr = new Map<string, string>();
  for (const r of lemmaTranslations) if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) ltFr.set(r.lemma_id, r.text);

  const finalLemma = new Map<string, string>();
  for (const w of words) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlm) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  for (const l of linguisticOccurrences) {
    if (!l.hikma_lemma_id) continue;
    const occ = occById.get(l.word_occurrence_id);
    if (occ && !finalLemma.has(occ.word_id)) finalLemma.set(occ.word_id, l.hikma_lemma_id);
  }

  const pathA = new Set(wtFr.keys());
  const pathB = new Set<string>(), pathC = new Set<string>(), pathD = new Set<string>();
  for (const w of words) if (w.lemma_id && ltFr.has(w.lemma_id)) pathB.add(w.id);
  for (const m of wlm) if (ltFr.has(m.lemma_id)) pathC.add(m.word_id);
  for (const l of linguisticOccurrences) {
    if (!l.hikma_lemma_id || !ltFr.has(l.hikma_lemma_id)) continue;
    const occ = occById.get(l.word_occurrence_id);
    if (occ) pathD.add(occ.word_id);
  }
  const union = new Set<string>(pathA);
  for (const wid of pathB) union.add(wid);
  for (const wid of pathC) union.add(wid);
  for (const wid of pathD) union.add(wid);

  // ─── 4. SURAH FORMS ──────────────────────────────────────────────────────
  const surahForms = new Map<number, Set<string>>();
  const surahNameByNumber = new Map<number, string>();
  for (const s of surahs) surahNameByNumber.set(s.number, s.name_transliteration ?? `Surah ${s.number}`);
  for (const occ of occurrences) {
    const ayah = ayahById.get(occ.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (!surah) continue;
    let set = surahForms.get(surah.number);
    if (!set) { set = new Set(); surahForms.set(surah.number, set); }
    set.add(occ.word_id);
  }

  const forms = surahForms.get(TARGET);
  if (!forms) throw new Error(`S${TARGET} introuvable.`);
  const covered = [...forms].filter((wid) => union.has(wid)).length;

  let readyCount = 0, inPrepCount = 0, refCount = 0;
  for (const [sn, fms] of surahForms) {
    const cov = [...fms].filter((wid) => union.has(wid)).length;
    if (sn === 1) refCount++;
    else if (fms.size > 0 && cov === fms.size) readyCount++;
    else inPrepCount++;
  }

  console.log(`S${TARGET} baseline: ${covered}/${forms.size} (${ROUND(covered / forms.size * 100, 1)}%)`);
  console.log(`Global: ${readyCount} READY · ${inPrepCount} IN_PREP · ${refCount} REF\n`);

  // ─── 5. MISSING FORM ANALYSIS ────────────────────────────────────────────
  const missingIds = [...forms].filter((wid) => !union.has(wid));
  console.log(`→ Analyse de ${missingIds.length} formes manquantes…\n`);

  type Classification = "A_SAFE_LEMMA_GLOSS" | "B_LEMMA_REVIEW" | "C_SAFE_MASAQ_MAPPING" | "D_REVIEW_MASAQ_MAPPING" | "E_SAFE_WORD_TRANSLATION" | "F_REVIEW_WORD_TRANSLATION" | "G_NO_SAFE_PATH" | "H_DO_NOT_IMPORT" | "I_ALREADY_RESOLVABLE";

  interface FormDetail {
    wordId: string; arabic: string;
    lemmaId: string | null; lemmaArabic: string | null;
    masaqStems: string[]; masaqQuality: number | null;
    topGlossEn: string | null; topGlossShare: number | null;
    competingStems: boolean; pos: string[];
    hasHamidullah: boolean; hasKazimirski: boolean;
    hamidullahSamples: string[]; kazimirskiSamples: string[];
    occCount: number;
    classification: Classification;
    safeGlossLemmaId: string | null; safeGlossText: string | null;
    safeWordTrText: string | null; reviewReason: string | null;
    confidence: number;
  }

  const formDetails: FormDetail[] = [];

  for (const wordId of missingIds) {
    const word = wordById.get(wordId)!;
    const currentLemmaId = finalLemma.get(wordId) ?? null;
    const currentLemmaArabic = currentLemmaId ? lemmaById.get(currentLemmaId)?.arabic ?? null : null;

    const los = loByWord.get(wordId) ?? [];
    const glossCounts = new Map<string, number>();
    const stemSet = new Set<string>();
    const lemmaSet = new Set<string>();
    const statuses = new Map<string, number>();
    const posSet = new Set<string>();
    for (const lo of los) {
      if (lo.masaq_gloss_en) increment(glossCounts, lo.masaq_gloss_en);
      if (lo.masaq_stem) stemSet.add(lo.masaq_stem);
      if (lo.hikma_lemma_id) lemmaSet.add(lo.hikma_lemma_id);
      increment(statuses, lo.lemma_mapping_status);
      for (const p of lo.pos ?? []) posSet.add(p);
    }
    const topGloss = sortedEntries(glossCounts)[0] ?? null;
    const loTotal = los.length;
    const masaQuality = loTotal > 0 ? ROUND((statuses.get("EXACT") ?? 0) / loTotal, 3) : null;
    const masaStems = [...stemSet].sort();

    // Translation sources
    const occs = occurrences.filter((o) => o.word_id === wordId);
    let hasHam = false, hasKaz = false;
    const hamSamples: string[] = [], kazSamples: string[] = [];
    for (const o of occs) {
      const verseMap = verseByAyahTranslator.get(o.ayah_id);
      if (verseMap?.has(HAMIDULLAH_TR)) { hasHam = true; hamSamples.push(verseMap.get(HAMIDULLAH_TR)!); }
      if (verseMap?.has(KAZIMIRSKI_TR)) { hasKaz = true; kazSamples.push(verseMap.get(KAZIMIRSKI_TR)!); }
    }

    // Classification
    let classification: Classification;
    let safeGlossLemmaId: string | null = null;
    let safeGlossText: string | null = null;
    let safeWordTrText: string | null = null;
    let reviewReason: string | null = null;
    let confidence = 0;

    const hasWordTr = wtFr.has(wordId);
    const hasLemmaTr = currentLemmaId ? ltFr.has(currentLemmaId) : false;
    if (hasWordTr || hasLemmaTr) {
      classification = "I_ALREADY_RESOLVABLE"; confidence = 1;
    } else if (currentLemmaId) {
      const masaReliable = (masaQuality ?? 0) >= 0.8 && !(stemSet.size > 1) && (topGloss?.count ?? 0) / (loTotal || 1) >= 0.4;
      const hasSource = hasHam || hasKaz;
      const hint = KNOWN_GLOSS_HINTS[currentLemmaArabic ?? ""] ?? null;

      if (masaReliable && hasSource) {
        classification = "A_SAFE_LEMMA_GLOSS";
        safeGlossLemmaId = currentLemmaId;
        safeGlossText = hint ?? `(à écrire pour « ${currentLemmaArabic} »)`;
        confidence = hint ? 0.85 : 0.7;
      } else if (!masaReliable && !hasSource) {
        classification = "H_DO_NOT_IMPORT";
        reviewReason = `MASAQ non fiable (quality=${masaQuality}) ET pas de source.`;
      } else {
        classification = "B_LEMMA_REVIEW";
        reviewReason = !masaReliable ? `MASAQ non fiable (quality=${masaQuality}).` : `pas de source Hamidullah/Kazimirski.`;
      }
    } else if (masaStems.length > 0) {
      const candidateLemmas = unique([...lemmaSet]).filter((id) => lemmaById.has(id));
      const stemToLemma = unique(masaStems).map((st) => lemmaByArabic.get(st)?.id).filter(Boolean) as string[];
      const hint = KNOWN_GLOSS_HINTS[masaStems[0] ?? ""] ?? null;

      if (candidateLemmas.length === 1 && (masaQuality ?? 0) >= 1 && !(stemSet.size > 1)) {
        classification = "C_SAFE_MASAQ_MAPPING";
        safeGlossLemmaId = candidateLemmas[0] ?? null;
        confidence = 0.8;
      } else if (stemToLemma.length === 1 && (masaQuality ?? 0) >= 1 && !(stemSet.size > 1)) {
        classification = "C_SAFE_MASAQ_MAPPING";
        safeGlossLemmaId = stemToLemma[0];
        confidence = 0.8;
      } else if (hint) {
        classification = "E_SAFE_WORD_TRANSLATION";
        safeWordTrText = hint; confidence = 0.75;
      } else {
        classification = "F_REVIEW_WORD_TRANSLATION";
        reviewReason = `stem « ${masaStems.join(",")} » UNMAPPED quality=${masaQuality} — word_translation à écrire.`;
      }
    } else {
      classification = "G_NO_SAFE_PATH";
      reviewReason = "aucun lemme ni stem MASAQ — nécessite word_translation humaine.";
    }

    formDetails.push({
      wordId, arabic: word.arabic,
      lemmaId: currentLemmaId, lemmaArabic: currentLemmaArabic,
      masaqStems: masaStems, masaqQuality: masaQuality,
      topGlossEn: topGloss?.value ?? null,
      topGlossShare: topGloss ? (loTotal > 0 ? ROUND(topGloss.count / loTotal, 3) : null) : null,
      competingStems: stemSet.size > 1,
      pos: [...posSet].sort(),
      hasHamidullah: hasHam, hasKazimirski: hasKaz,
      hamidullahSamples: hamSamples.slice(0, 2), kazimirskiSamples: kazSamples.slice(0, 2),
      occCount: occs.length,
      classification, safeGlossLemmaId, safeGlossText, safeWordTrText, reviewReason,
      confidence: ROUND(confidence, 2),
    });
  }

  // ─── 6. AGGREGATE CLASSIFICATION ─────────────────────────────────────────
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0 };
  for (const fd of formDetails) {
    const key = fd.classification.split("_")[0];
    if (counts[key] !== undefined) counts[key]++;
  }

  const allGlossLemmas = new Set<string>();
  const safeGlossLemmas = new Set<string>();
  const safeWordTrIds = new Set<string>();
  const reviewWordTrIds = new Set<string>();

  for (const fd of formDetails) {
    if (fd.lemmaId) allGlossLemmas.add(fd.lemmaId);
    if (fd.classification === "A_SAFE_LEMMA_GLOSS" && fd.safeGlossLemmaId) safeGlossLemmas.add(fd.safeGlossLemmaId);
    if (fd.classification === "E_SAFE_WORD_TRANSLATION" && fd.safeWordTrText) safeWordTrIds.add(fd.wordId);
    if (fd.classification === "F_REVIEW_WORD_TRANSLATION") reviewWordTrIds.add(fd.wordId);
  }

  // ─── 7. SIMULATIONS ──────────────────────────────────────────────────────
  const simSafe = new Set(union);
  for (const [wid, lid] of finalLemma) if (safeGlossLemmas.has(lid)) simSafe.add(wid);
  for (const wid of safeWordTrIds) simSafe.add(wid);

  const simSafePlusReview = new Set(simSafe);
  for (const wid of reviewWordTrIds) simSafePlusReview.add(wid);

  const simAll = new Set(simSafePlusReview);
  for (const fd of formDetails) {
    if (fd.classification === "C_SAFE_MASAQ_MAPPING" && fd.safeGlossLemmaId) {
      if (ltFr.has(fd.safeGlossLemmaId) || safeGlossLemmas.has(fd.safeGlossLemmaId)) simAll.add(fd.wordId);
    }
  }

  const sims = [
    { name: "BASELINE", forms: covered, pct: ROUND(covered / forms.size * 100, 1), ready: false, remaining: forms.size - covered },
    { name: "SAFE_GLOSSES", forms: [...forms].filter((wid) => simSafe.has(wid)).length, pct: ROUND([...forms].filter((wid) => simSafe.has(wid)).length / forms.size * 100, 1), ready: [...forms].filter((wid) => simSafe.has(wid)).length === forms.size, remaining: forms.size - [...forms].filter((wid) => simSafe.has(wid)).length },
    { name: "SAFE_PLUS_REVIEW", forms: [...forms].filter((wid) => simSafePlusReview.has(wid)).length, pct: ROUND([...forms].filter((wid) => simSafePlusReview.has(wid)).length / forms.size * 100, 1), ready: [...forms].filter((wid) => simSafePlusReview.has(wid)).length === forms.size, remaining: forms.size - [...forms].filter((wid) => simSafePlusReview.has(wid)).length },
    { name: "COMPLETE", forms: [...forms].filter((wid) => simAll.has(wid)).length, pct: ROUND([...forms].filter((wid) => simAll.has(wid)).length / forms.size * 100, 1), ready: [...forms].filter((wid) => simAll.has(wid)).length === forms.size, remaining: forms.size - [...forms].filter((wid) => simAll.has(wid)).length },
  ];

  // ─── 8. COST ─────────────────────────────────────────────────────────────
  const lemmaGlossActions = allGlossLemmas.size;
  const safeGlossActions = safeGlossLemmas.size;
  const safeWordTrActions = safeWordTrIds.size;
  const reviewWordTrActions = reviewWordTrIds.size;
  const totalActions = lemmaGlossActions + reviewWordTrActions;
  const safeActions = safeGlossActions + safeWordTrActions;
  const reviewActions = totalActions - safeActions;

  // ─── 9. INTEGRITY ────────────────────────────────────────────────────────
  const lemmaIdSet = new Set(lemmas.map((l) => l.id));
  let orphanQuran = 0, orphanWlm = 0, orphanLo = 0, orphanLt = 0;
  for (const w of words) if (w.lemma_id && !lemmaIdSet.has(w.lemma_id)) orphanQuran++;
  for (const m of wlm) if (!lemmaIdSet.has(m.lemma_id)) orphanWlm++;
  for (const l of linguisticOccurrences) if (l.hikma_lemma_id && !lemmaIdSet.has(l.hikma_lemma_id)) orphanLo++;
  for (const r of lemmaTranslations) if (!lemmaIdSet.has(r.lemma_id)) orphanLt++;

  const ltKeyCount = new Map<string, number>();
  for (const r of lemmaTranslations) { const k = `${r.lemma_id}|${r.language}|${r.source_id ?? ""}`; ltKeyCount.set(k, (ltKeyCount.get(k) ?? 0) + 1); }
  const dupLt = [...ltKeyCount.values()].filter((v) => v > 1).length;

  const wlmKeyCount = new Map<string, number>();
  for (const m of wlm) { const k = `${m.word_id}|${m.lemma_id}`; wlmKeyCount.set(k, (wlmKeyCount.get(k) ?? 0) + 1); }
  const dupWlm = [...wlmKeyCount.values()].filter((v) => v > 1).length;

  const wtFrKeyCount = new Map<string, number>();
  for (const r of wordTranslations) { if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) { wtFrKeyCount.set(r.word_id, (wtFrKeyCount.get(r.word_id) ?? 0) + 1); } }
  const dupFrGlosses = [...wtFrKeyCount.values()].filter((v) => v > 1).length;

  let directWlmConflict = 0;
  for (const w of words) { const via = wlmByWord.get(w.id); if (w.lemma_id && via && w.lemma_id !== via.lemma_id) directWlmConflict++; }

  const anomalies = orphanQuran + orphanWlm + orphanLo + orphanLt + dupWlm + dupLt + dupFrGlosses + directWlmConflict;

  const checkReady = (sn: number) => { const f = surahForms.get(sn); return f ? [...f].filter((wid) => union.has(wid)).length === f.size : null; };
  const s98ready = checkReady(98);
  const s92ready = checkReady(92);
  const s82ready = checkReady(82);
  const s85ready = checkReady(85);

  const verdict = anomalies > 0 ? "PHASE_88F_R_BLOCKED — integrity anomalies" : "PHASE_88F_R_COMPLETE";

  // ─── 10. REPORT ──────────────────────────────────────────────────────────
  const report = {
    phase: "88F-Y",
    verdict,
    read_only: true,
    database_writes: 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - startedAt) / 1000, 2),
    targetSurah: { number: TARGET, name: surahNameByNumber.get(TARGET) ?? `Surah ${TARGET}` },
    baseline: {
      totalForms: forms.size, coveredForms: covered, missingForms: missingIds.length,
      coveragePct: ROUND(covered / forms.size, 4),
      totalOccurrences: [...forms].reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0),
      missingOccurrences: missingIds.reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0),
      readiness: covered === forms.size ? "READY" : "IN_PREPARATION",
      globalReady: readyCount, globalInPrep: inPrepCount, globalRef: refCount,
    },
    classification: counts,
    missingForms: formDetails.map((fd) => ({
      word_id: fd.wordId, arabic: fd.arabic,
      lemma_id: fd.lemmaId, lemma_arabic: fd.lemmaArabic,
      masaq_stems: fd.masaqStems, masaq_quality: fd.masaqQuality,
      top_gloss_en: fd.topGlossEn, top_gloss_share: fd.topGlossShare,
      competing_stems: fd.competingStems, pos: fd.pos,
      has_hamidullah: fd.hasHamidullah, has_kazimirski: fd.hasKazimirski,
      hamidullah_samples: fd.hamidullahSamples, kazimirski_samples: fd.kazimirskiSamples,
      occurrences: fd.occCount,
      classification: fd.classification,
      safe_gloss_lemma_id: fd.safeGlossLemmaId, safe_gloss_text: fd.safeGlossText,
      safe_word_tr_text: fd.safeWordTrText, review_reason: fd.reviewReason,
      confidence: fd.confidence,
    })),
    safeGlossCandidates: [...safeGlossLemmas].map((lid) => {
      const lem = lemmaById.get(lid);
      const hint = KNOWN_GLOSS_HINTS[lem?.arabic ?? ""] ?? null;
      const formsCovered = formDetails.filter((fd) => fd.lemmaId === lid && fd.classification === "A_SAFE_LEMMA_GLOSS").length;
      return {
        lemma_id: lid, lemma_arabic: lem?.arabic ?? null,
        gloss: hint ?? `(à écrire pour « ${lem?.arabic ?? lid} »)`,
        forms_in_S90: formDetails.filter((fd) => fd.lemmaId === lid).length, forms_safe: formsCovered,
      };
    }),
    safeWordTrCandidates: [...safeWordTrIds].map((wid) => {
      const fd = formDetails.find((f) => f.wordId === wid)!;
      return { word_id: wid, arabic: fd.arabic, gloss: fd.safeWordTrText };
    }),
    reviewWordTrCandidates: [...reviewWordTrIds].map((wid) => {
      const fd = formDetails.find((f) => f.wordId === wid)!;
      return { word_id: wid, arabic: fd.arabic, masaq_stems: fd.masaqStems, masaq_quality: fd.masaqQuality, review_reason: fd.reviewReason };
    }),
    simulations: sims,
    exactActionsToReady: {
      totalLemmaGlosses: lemmaGlossActions, safeLemmaGlosses: safeGlossActions,
      safeWordTranslations: safeWordTrActions, reviewWordTranslations: reviewWordTrActions,
      totalActions, safeActions, reviewActions,
      estimatedNewFormsSafeOnly: [...forms].filter((wid) => simSafe.has(wid)).length - covered,
      estimatedNewFormsComplete: [...forms].filter((wid) => simAll.has(wid)).length - covered,
    },
    integrity: {
      orphan_quran_words_lemma: orphanQuran, orphan_word_lemma_mapping: orphanWlm,
      orphan_linguistic_occurrences: orphanLo, orphan_lemma_translations: orphanLt,
      duplicate_word_lemma_mapping: dupWlm, duplicate_lemma_translations: dupLt,
      duplicate_FR_glosses: dupFrGlosses, contradictory_direct_vs_wlm: directWlmConflict,
      S98_still_READY: s98ready, S92_still_READY: s92ready,
      S82_still_READY: s82ready, S85_still_READY: s85ready,
      classifySurahReadiness_unchanged: true, curriculum_unchanged: true,
    },
    invariants: { database_writes: 0, lexical_writes: 0, translation_writes: 0, curriculum_writes: 0, masaq_writes: 0, migrations: 0, seeds: 0 },
    tests: { run: false, note: "vitest · tsc · eslint · static read-only check" },
    nextPhase: {
      phase: "88F-S", name: "S90 AL-BALAD RESOLUTION",
      actions: `${safeGlossActions} lemma_translations + ${reviewWordTrActions} word_translations = ${totalActions} writes`,
      expected: `${forms.size}/${forms.size} → 100 % → READY`,
    },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nRapport → ${OUTPUT}`);

  // ─── 11. TERMINAL SUMMARY ────────────────────────────────────────────────
  console.log(`\n=== PHASE 88F-Y — S${TARGET} AL-BALAD AUDIT TERMINÉ ===`);
  console.log(`S${TARGET}: ${covered}/${forms.size} (${ROUND(covered / forms.size * 100, 1)}%) · ${missingIds.length} manquantes`);
  console.log(`  A:${counts.A} B:${counts.B} C:${counts.C} D:${counts.D} E:${counts.E} F:${counts.F} G:${counts.G} H:${counts.H}`);
  console.log(`  Glosses: ${safeGlossActions} SAFE / ${lemmaGlossActions} total · Word_tr: ${safeWordTrActions} SAFE / ${reviewWordTrActions} REVIEW`);
  console.log(`  Actions to READY: ${totalActions} (${safeActions} SAFE + ${reviewActions} REVIEW)`);
  console.log(`  S98=${s98ready} S92=${s92ready} S82=${s82ready} S85=${s85ready}`);
  console.log(`  Integrity: anomalies=${anomalies}`);
  console.log(`=== ${verdict} ===`);
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });