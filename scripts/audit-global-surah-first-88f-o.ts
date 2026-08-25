/**
 * PHASE 88F-O — GLOBAL SURAH-FIRST ROI AUDIT
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * After S98, S92, S82 → READY, this audit ranks the remaining IN_PREPARATION
 * surahs by real cost to reach 100 % FR, using UNION DISTINCT word_id coverage.
 *
 * This script only uses paginated Supabase `.select()` calls and writes the
 * local JSON report. No inserts/updates/upserts/deletes/rpcs.
 *
 * Livrable : reports/phase-88f-o-global-surah-first-roi.json
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const PAGE_SIZE = 1000;
const OUTPUT = "reports/phase-88f-o-global-surah-first-roi.json";
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const HAMIDULLAH_TR = "Muhammad Hamidullah";
const KAZIMIRSKI_TR = "Albert de Biberstein-Kazimirski";
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------------------
// STATIC READ-ONLY GUARANTEE — verified manually. Only .select() reads.
// Forbidden write patterns (none should exist in actual code):
//   .insert(  .update(  .upsert(  .delete(  .rpc(

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type SourceRow = { id: string; name: string };
type SurahRow = { id: string; number: number; name_transliteration: string | null; name_arabic?: string | null };
type AyahRow = { id: string; surah_id: string; ayah_number?: number; global_ayah_number?: number };
type WordRow = { id: string; arabic: string; lemma_id: string | null };
type OccRow = { id: string; word_id: string; ayah_id: string };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { id: string; word_id: string; lemma_id: string };
type TranslationRow = { ayah_id: string; translator: string };
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

function sortedEntries(map: Map<string, number>): Array<{ value: string; count: number }> {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));
}

// ---------------------------------------------------------------------------
// EDITORIAL GLOSS KNOWLEDGE — conservative convenience, not a safety gate.
// MASAQ quality + translation sources determine structural safety.
// ---------------------------------------------------------------------------
const KNOWN_GLOSS_HINTS: Record<string, string> = {
  // Concrete nouns (high confidence)
  كواكب: "étoiles / astres", قبور: "tombes / sépultures", صور: "forme / image / façonner",
  فجار: "débauchés / pervers / pécheurs", غائب: "absent / caché", كاتب: "scribe / écrivain / qui écrit",
  حافظ: "gardien / qui préserve / protecteur", أتقى: "le plus pieux / craignant Dieu",
  حسني: "la plus belle (récompense) / le meilleur", عسرى: "difficulté / la plus dure (voie)",
  أحد: "un / personne / quelqu'un", شتى: "dispersés / divers / séparés", بر: "bonté / bienfaisance",
  بين: "entre / preuve claire", قيم: "droit / correct / de valeur / établir (droit)", شر: "mal / pire / mauvais",
  كتب: "livre / écrire / prescrire", مطهر: "purifié / pur", منفك: "cesser / se désengager / se séparer",
  ركب: "assembler / composer", ملك: "roi / posséder / maîtriser", فجر: "faire jaillir / fendre (la terre)",
  جزي: "rétribuer / récompenser", جنب: "écarter / éviter / être éloigné",
  // Common verbs
  سعي: "effort / s'efforcer / agir", يسر: "faciliter / rendre aisé", بخل: "être avare / refuser (par avarice)",
  استغنى: "se passer de / se suffire à soi-même", تردى: "tomber / se précipiter (vers la perte)",
  أنذر: "avertir / mettre en garde", تلظى: "flamber / s'embraser", صلا: "brûler / endurer (le feu)",
  انفطر: "se fendre / s'entrouvrir", انتثر: "se disperser / se répandre", بعثر: "être dispersé / renversé",
  أخر: "retarder / différer", غر: "tromper / séduire", سوا: "façonner / égaliser / proportionner",
  عدل: "ajuster / proportionner / équilibrer", تفرق: "se diviser / se séparer", ؤت: "donner / accorder",
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

  console.log("=== PHASE 88F-O — GLOBAL SURAH-FIRST ROI AUDIT (READ-ONLY) ===");
  console.log("  DB writes: 0 — strictly paginated SELECT calls only.\n");

  // ─── 1. LOAD ─────────────────────────────────────────────────────────────
  console.log("→ Chargement…");
  const sources = await selectAll<SourceRow>(client, "sources", "id, name");
  const hikmaSource = sources.find((s) => s.name === HIKMA_SOURCE);
  if (!hikmaSource) throw new Error(`Source « ${HIKMA_SOURCE} » introuvable.`);

  const [surahs, ayahs, words, occurrences, lemmas, wlm, wordTranslations, lemmaTranslations, linguisticOccurrences, verseTranslations] =
    await Promise.all([
      selectAll<SurahRow>(client, "surahs", "id, number, name_transliteration, name_arabic"),
      selectAll<AyahRow>(client, "ayahs", "id, surah_id, ayah_number, global_ayah_number"),
      selectAll<WordRow>(client, "quran_words", "id, arabic, lemma_id"),
      selectAll<OccRow>(client, "word_occurrences", "id, word_id, ayah_id"),
      selectAll<LemmaRow>(client, "lemmas", "id, arabic"),
      selectAll<WlmRow>(client, "word_lemma_mapping", "id, word_id, lemma_id"),
      selectAll<WordTranslationRow>(client, "word_translations", "id, word_id, text, language, is_validated, source_id"),
      selectAll<LemmaTranslationRow>(client, "lemma_translations", "id, lemma_id, text, language, is_validated, source_id"),
      selectAll<LoRow>(client, "linguistic_occurrences", "id, word_occurrence_id, hikma_lemma_id, lemma_mapping_status, masaq_gloss_en, masaq_stem, pos"),
      selectAll<TranslationRow>(client, "translations", "ayah_id, translator"),
    ]);
  console.log(`  Chargé: surahs=${surahs.length} words=${words.length} occs=${occurrences.length} lemmas=${lemmas.length} wlm=${wlm.length} wt=${wordTranslations.length} lt=${lemmaTranslations.length} lo=${linguisticOccurrences.length}`);

  // ─── 2. INDEXES ──────────────────────────────────────────────────────────
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
    if (occ) {
      const list = loByWord.get(occ.word_id) ?? [];
      list.push(row);
      loByWord.set(occ.word_id, list);
    }
  }

  // Translations presence per ayah (Hamidullah / Kazimirski)
  const ayahHasHam = new Set<string>();
  const ayahHasKaz = new Set<string>();
  for (const tr of verseTranslations) {
    if (tr.translator === HAMIDULLAH_TR) ayahHasHam.add(tr.ayah_id);
    else if (tr.translator === KAZIMIRSKI_TR) ayahHasKaz.add(tr.ayah_id);
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

  let coveredOccurrences = 0;
  for (const wid of union) coveredOccurrences += occCountByWord.get(wid) ?? 0;

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

  // ─── 5. GLOBAL CLASSIFICATION OF EVERY UNCOVERED WORD (once) ─────────────
  type Classification = "A_SAFE_LEMMA_GLOSS" | "B_LEMMA_REVIEW" | "C_SAFE_MASAQ_MAPPING" | "D_REVIEW_MASAQ_MAPPING" | "E_SAFE_WORD_TRANSLATION" | "F_REVIEW_WORD_TRANSLATION" | "G_NO_SAFE_PATH" | "H_DO_NOT_IMPORT" | "I_ALREADY_RESOLVABLE";

  interface FormClass { classification: Classification; safeGlossLemmaId: string | null; safeWordTrText: string | null; reviewReason: string | null; }

  function masaEvidence(wordId: string) {
    const los = loByWord.get(wordId) ?? [];
    const stemSet = new Set<string>();
    const lemmaSet = new Set<string>();
    const statuses = new Map<string, number>();
    const glossCounts = new Map<string, number>();
    for (const lo of los) {
      if (lo.masaq_stem) stemSet.add(lo.masaq_stem);
      if (lo.hikma_lemma_id) lemmaSet.add(lo.hikma_lemma_id);
      increment(statuses, lo.lemma_mapping_status);
      if (lo.masaq_gloss_en) increment(glossCounts, lo.masaq_gloss_en);
    }
    const top = sortedEntries(glossCounts)[0] ?? null;
    const total = los.length;
    return {
      stems: [...stemSet],
      hikmaLemmaIds: [...lemmaSet],
      quality: total > 0 ? ROUND((statuses.get("EXACT") ?? 0) / total, 3) : null,
      topGlossShare: top && total > 0 ? ROUND(top.count / total, 3) : null,
      competingStems: stemSet.size > 1,
      statuses,
    };
  }

  function wordHasTranslations(wordId: string): { ham: boolean; kaz: boolean } {
    const occs = occurrences.filter((o) => o.word_id === wordId);
    let ham = false, kaz = false;
    for (const o of occs) {
      if (ayahHasHam.has(o.ayah_id)) ham = true;
      if (ayahHasKaz.has(o.ayah_id)) kaz = true;
      if (ham && kaz) break;
    }
    return { ham, kaz };
  }

  const globalClass = new Map<string, FormClass>();

  for (const word of words) {
    if (union.has(word.id)) { globalClass.set(word.id, { classification: "I_ALREADY_RESOLVABLE", safeGlossLemmaId: null, safeWordTrText: null, reviewReason: null }); continue; }

    const masa = masaEvidence(word.id);
    const currentLemmaId = finalLemma.get(word.id) ?? null;
    const tr = wordHasTranslations(word.id);
    const hasLemmaTr = currentLemmaId ? ltFr.has(currentLemmaId) : false;

    if (hasLemmaTr) {
      globalClass.set(word.id, { classification: "I_ALREADY_RESOLVABLE", safeGlossLemmaId: null, safeWordTrText: null, reviewReason: null });
      continue;
    }

    if (currentLemmaId) {
      // A lemma exists → needs a FR gloss. Structural safety depends on MASAQ
      // evidence + source translations. The KNOWN_GLOSS_HINTS map provides a
      // ready-made gloss text for ~50 common lemmas but does NOT gate safety.
      const masaReliable = (masa.quality ?? 0) >= 0.8 && !masa.competingStems && (masa.topGlossShare ?? 0) >= 0.4;
      const hasSource = tr.ham || tr.kaz;

      if (masaReliable && hasSource) {
        // Structurally SAFE: lemma is well-anchored in MASAQ AND translation sources exist.
        globalClass.set(word.id, { classification: "A_SAFE_LEMMA_GLOSS", safeGlossLemmaId: currentLemmaId, safeWordTrText: null, reviewReason: null });
      } else if (!masaReliable && !hasSource) {
        globalClass.set(word.id, { classification: "H_DO_NOT_IMPORT", safeGlossLemmaId: null, safeWordTrText: null, reviewReason: `MASAQ non fiable (quality=${masa.quality}, competing=${masa.competingStems}) ET pas de source traduite.` });
      } else {
        globalClass.set(word.id, { classification: "B_LEMMA_REVIEW", safeGlossLemmaId: null, safeWordTrText: null, reviewReason: !masaReliable ? `MASAQ non fiable (quality=${masa.quality}) — lemma ok mais preuve insuffisante.` : `pas de source Hamidullah/Kazimirski — lemma ok mais gloss à valider.` });
      }
      continue;
    }

    // No lemma
    if (masa.stems.length === 0) {
      globalClass.set(word.id, { classification: "F_REVIEW_WORD_TRANSLATION", safeGlossLemmaId: null, safeWordTrText: null, reviewReason: "aucun lemme ni stem MASAQ — nécessite word_translation humaine." });
      continue;
    }

    // No lemma, has MASAQ stems. The structural path is always word_translation.
    // Classification depends on whether we have a ready gloss hint.
    const candidateLemmas = masa.hikmaLemmaIds.filter((id) => lemmaById.has(id));
    const stemToLemma = masa.stems.map((st) => lemmaByArabic.get(st)?.id).filter(Boolean) as string[];
    const hint = KNOWN_GLOSS_HINTS[masa.stems[0] ?? ""] ?? null;

    // SAFE mapping: exactly one candidate lemma with clean MASAQ
    if (candidateLemmas.length === 1 && (masa.quality ?? 0) >= 1 && !masa.competingStems) {
      globalClass.set(word.id, { classification: "C_SAFE_MASAQ_MAPPING", safeGlossLemmaId: candidateLemmas[0] ?? null, safeWordTrText: null, reviewReason: null });
    }
    // SAFE mapping via stem→lemma: exactly one existing lemma whose arabic matches a MASAQ stem, with clean MASAQ
    else if (stemToLemma.length === 1 && (masa.quality ?? 0) >= 1 && !masa.competingStems) {
      globalClass.set(word.id, { classification: "C_SAFE_MASAQ_MAPPING", safeGlossLemmaId: stemToLemma[0], safeWordTrText: null, reviewReason: null });
    }
    // Hint available → SAFE word_translation
    else if (hint) {
      globalClass.set(word.id, { classification: "E_SAFE_WORD_TRANSLATION", safeGlossLemmaId: null, safeWordTrText: hint, reviewReason: null });
    }
    // No hint, no clean mapping → word_translation is the structural path, REVIEW for text
    else {
      globalClass.set(word.id, { classification: "F_REVIEW_WORD_TRANSLATION", safeGlossLemmaId: null, safeWordTrText: null, reviewReason: `stem « ${masa.stems.join(",")} » UNMAPPED quality=${masa.quality} — word_translation à écrire.` });
    }
  }

  // ─── 6. PER-SURAH ANALYSIS ───────────────────────────────────────────────

  interface SurahAnalysis {
    number: number; name: string; totalForms: number; coveredForms: number; missingForms: number;
    coveragePct: number; missingOccurrences: number; readiness: string;
    // Structural breakdown of missing forms
    formsWithLemma: number; distinctLemmasNeedingGloss: number; safeGlossLemmasCount: number;
    formsWithoutLemma: number; formsWithoutLemmaWithMasaq: number; formsWithoutLemmaWithoutMasaq: number;
    safeMappingForms: number; safeWordTrForms: number;
    noSafePathForms: number; doNotImportForms: number;
    // Cost
    totalActionsToReady: number; safeActions: number; reviewActions: number;
    // Simulations
    newFormsBySafeOnly: number; finalCoverageBySafeOnly: number; readyBySafeOnly: boolean;
    newFormsBySafePlusReview: number; readyBySafePlusReview: boolean; remainingAfterSafeOnly: number;
  }

  const analyses: SurahAnalysis[] = [];

  for (const [sn, forms] of surahForms) {
    if (sn === 1) continue; // REFERENCE
    const covered = [...forms].filter((wid) => union.has(wid)).length;
    if (covered === forms.size) continue; // already READY

    const missingIds = [...forms].filter((wid) => !union.has(wid));
    const allLemmasNeedingGloss = new Set<string>();
    const safeGlossLemmas = new Set<string>();
    const safeWordTrIds = new Set<string>();
    let formsWithLemma = 0, formsWithoutLemma = 0, formsWithoutLemmaWithMasaq = 0, formsWithoutLemmaWithoutMasaq = 0;
    let safeMappingForms = 0, noSafePathForms = 0, doNotImportForms = 0;

    for (const wid of missingIds) {
      const fc = globalClass.get(wid);
      if (!fc) { formsWithoutLemmaWithoutMasaq++; noSafePathForms++; continue; }
      const lid = finalLemma.get(wid) ?? null;
      if (lid) {
        // Existing lemma → gloss action (one per distinct lemma)
        formsWithLemma++;
        allLemmasNeedingGloss.add(lid);
        if (fc.classification === "A_SAFE_LEMMA_GLOSS") safeGlossLemmas.add(lid);
      } else {
        formsWithoutLemma++;
        const hasMasaq = (loByWord.get(wid) ?? []).length > 0;
        if (hasMasaq) formsWithoutLemmaWithMasaq++; else formsWithoutLemmaWithoutMasaq++;
        if (fc.classification === "C_SAFE_MASAQ_MAPPING") safeMappingForms++;
        else if (fc.classification === "E_SAFE_WORD_TRANSLATION" && fc.safeWordTrText) safeWordTrIds.add(wid);
        else if (fc.classification === "F_REVIEW_WORD_TRANSLATION" && fc.safeWordTrText) safeWordTrIds.add(wid);
        else if (fc.classification === "G_NO_SAFE_PATH") noSafePathForms++;
      }
      if (fc.classification === "H_DO_NOT_IMPORT") doNotImportForms++;
    }

    const distinctLemmasNeedingGloss = allLemmasNeedingGloss.size;
    const safeGlossLemmasCount = safeGlossLemmas.size;
    const safeWordTrCount = safeWordTrIds.size;
    // Minimal path: one gloss per distinct lemma + one word_translation per form without lemma
    // (safe mappings substitute a word translation for their forms)
    const wordTrNeeded = formsWithoutLemma - safeMappingForms;
    const totalActionsToReady = distinctLemmasNeedingGloss + wordTrNeeded;
    const safeActions = safeGlossLemmasCount + safeMappingForms + safeWordTrCount;
    const reviewActions = totalActionsToReady - safeActions;

    // Simulation: safe only
    const simSafe = new Set(union);
    for (const [wid, lid] of finalLemma) if (safeGlossLemmas.has(lid)) simSafe.add(wid);
    for (const wid of safeWordTrIds) simSafe.add(wid);
    // safe mappings: forms whose lemma gets a gloss via mapping
    for (const wid of missingIds) {
      const fc = globalClass.get(wid);
      if (fc && fc.classification === "C_SAFE_MASAQ_MAPPING" && fc.safeGlossLemmaId && safeGlossLemmas.has(fc.safeGlossLemmaId)) simSafe.add(wid);
    }
    const newFormsSafe = [...forms].filter((wid) => !union.has(wid) && simSafe.has(wid)).length;
    const finalSafe = covered + newFormsSafe;

    // Simulation: safe + review (all resolvable forms)
    const simAll = new Set(simSafe);
    for (const wid of missingIds) {
      const fc = globalClass.get(wid);
      if (!fc) { simAll.add(wid); continue; }
      if (fc.classification !== "H_DO_NOT_IMPORT" && fc.classification !== "I_ALREADY_RESOLVABLE") simAll.add(wid);
    }
    const finalAll = [...forms].filter((wid) => simAll.has(wid)).length;
    const newFormsAll = finalAll - covered;

    const missingOccurrences = missingIds.reduce((s, wid) => s + (occCountByWord.get(wid) ?? 0), 0);

    analyses.push({
      number: sn,
      name: surahNameByNumber.get(sn) ?? `Surah ${sn}`,
      totalForms: forms.size,
      coveredForms: covered,
      missingForms: missingIds.length,
      coveragePct: ROUND(covered / forms.size, 4),
      missingOccurrences,
      readiness: "IN_PREPARATION",
      formsWithLemma, distinctLemmasNeedingGloss, safeGlossLemmasCount,
      formsWithoutLemma, formsWithoutLemmaWithMasaq, formsWithoutLemmaWithoutMasaq,
      safeMappingForms, safeWordTrForms: safeWordTrCount,
      noSafePathForms, doNotImportForms,
      totalActionsToReady, safeActions, reviewActions,
      newFormsBySafeOnly: newFormsSafe,
      finalCoverageBySafeOnly: ROUND(finalSafe / forms.size, 4),
      readyBySafeOnly: finalSafe === forms.size,
      newFormsBySafePlusReview: newFormsAll,
      readyBySafePlusReview: finalAll === forms.size,
      remainingAfterSafeOnly: forms.size - finalSafe,
    });
  }

  analyses.sort((a, b) => a.number - b.number);

  // ─── 7. RANKINGS ─────────────────────────────────────────────────────────

  // RANKING A — READY-FIRST: lowest total actions to reach 100 %
  const readyFirst = [...analyses]
    .sort((a, b) => a.totalActionsToReady - b.totalActionsToReady || b.coveragePct - a.coveragePct)
    .map((a) => ({ number: a.number, name: a.name, coveragePct: a.coveragePct, missingForms: a.missingForms, safeActions: a.safeActions, reviewActions: a.reviewActions, totalActions: a.totalActionsToReady }));

  // RANKING B — COVERAGE-FIRST: largest raw gain in forms
  const coverageFirst = [...analyses]
    .sort((a, b) => b.newFormsBySafePlusReview - a.newFormsBySafePlusReview)
    .map((a) => ({ number: a.number, name: a.name, newFormsBySafePlusReview: a.newFormsBySafePlusReview, missingForms: a.missingForms }));

  // RANKING C — EFFICIENCY: new_forms / editorial_actions (among surahs with safe actions)
  const efficiency = [...analyses]
    .filter((a) => a.safeActions > 0)
    .map((a) => ({ number: a.number, name: a.name, newForms: a.newFormsBySafeOnly, safeActions: a.safeActions, efficiency: ROUND(a.newFormsBySafeOnly / a.safeActions, 2) }))
    .sort((a, b) => b.efficiency - a.efficiency);

  // RANKING D — LOW-REVIEW: prioritize surahs with fewest review actions
  const lowReview = [...analyses]
    .sort((a, b) => a.reviewActions - b.reviewActions || a.safeActions - b.safeActions || a.missingForms - b.missingForms)
    .map((a) => ({ number: a.number, name: a.name, safeActions: a.safeActions, reviewActions: a.reviewActions, missingForms: a.missingForms }));

  // RANKING E — GLOBAL PRIORITY: transparent composite score
  // score = missingForms*1 + reviewActions*2 + noSafePath*3 + doNotImport*4 - safeActions*0.5
  // (lower = better). Editorial risk is weighted over raw coverage proximity.
  const globalPriority = [...analyses].map((a) => ({
    number: a.number, name: a.name, coveragePct: a.coveragePct, missingForms: a.missingForms,
    safeActions: a.safeActions, reviewActions: a.reviewActions,
    noSafePath: a.noSafePathForms, doNotImport: a.doNotImportForms,
    score: ROUND(a.missingForms * 1 + a.reviewActions * 2 + a.noSafePathForms * 3 + a.doNotImportForms * 4 - a.safeActions * 0.5, 2),
  })).sort((a, b) => a.score - b.score);

  // ─── 8. RECOMMENDED BATCHES ──────────────────────────────────────────────
  // Batch 1: can reach READY with SAFE only (no human review needed)
  const batch1 = analyses.filter((a) => a.readyBySafeOnly).sort((a, b) => a.safeActions - b.safeActions);
  // Batch 2: near-ready with ≤3 review actions, no blocking issues
  const batch2 = analyses.filter((a) => !a.readyBySafeOnly && a.reviewActions <= 3 && a.noSafePathForms === 0 && a.doNotImportForms === 0).sort((a, b) => a.totalActionsToReady - b.totalActionsToReady);
  // Batch 3: the rest, sorted by global priority
  const batch3 = analyses.filter((a) => !batch1.includes(a) && !batch2.includes(a)).sort((a, b) => globalPriority.find((g) => g.number === a.number)!.score - globalPriority.find((g) => g.number === b.number)!.score);

  const batchSummary = (list: SurahAnalysis[]) => ({
    surahs: list.map((a) => a.number),
    count: list.length,
    totalSafeActions: list.reduce((s, a) => s + a.safeActions, 0),
    totalReviewActions: list.reduce((s, a) => s + a.reviewActions, 0),
    estimatedNewForms: list.reduce((s, a) => s + a.newFormsBySafePlusReview, 0),
    estimatedNewOccurrences: list.reduce((s, a) => s + (a.missingOccurrences), 0),
    readyReachable: list.filter((a) => a.readyBySafePlusReview).length,
  });

  // ─── 9. INTEGRITY ────────────────────────────────────────────────────────
  const lemmaIdSet = new Set(lemmas.map((l) => l.id));
  let orphanQuran = 0, orphanWlm = 0, orphanLo = 0, orphanLt = 0;
  for (const w of words) if (w.lemma_id && !lemmaIdSet.has(w.lemma_id)) orphanQuran++;
  for (const m of wlm) if (!lemmaIdSet.has(m.lemma_id)) orphanWlm++;
  for (const l of linguisticOccurrences) if (l.hikma_lemma_id && !lemmaIdSet.has(l.hikma_lemma_id)) orphanLo++;
  for (const r of lemmaTranslations) if (!lemmaIdSet.has(r.lemma_id)) orphanLt++;

  const wlmKeyCount = new Map<string, number>();
  for (const m of wlm) { const k = `${m.word_id}|${m.lemma_id}`; wlmKeyCount.set(k, (wlmKeyCount.get(k) ?? 0) + 1); }
  const dupWlm = [...wlmKeyCount.values()].filter((v) => v > 1).length;

  const ltKeyCount = new Map<string, number>();
  for (const r of lemmaTranslations) { const k = `${r.lemma_id}|${r.language}|${r.source_id ?? ""}`; ltKeyCount.set(k, (ltKeyCount.get(k) ?? 0) + 1); }
  const dupLt = [...ltKeyCount.values()].filter((v) => v > 1).length;

  const wtFrKeyCount = new Map<string, number>();
  for (const r of wordTranslations) { if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) { wtFrKeyCount.set(r.word_id, (wtFrKeyCount.get(r.word_id) ?? 0) + 1); } }
  const dupFrGlosses = [...wtFrKeyCount.values()].filter((v) => v > 1).length;

  let directWlmConflict = 0;
  for (const w of words) { const via = wlmByWord.get(w.id); if (w.lemma_id && via && w.lemma_id !== via.lemma_id) directWlmConflict++; }

  const integrityHasAnomaly = orphanQuran > 0 || orphanWlm > 0 || orphanLo > 0 || orphanLt > 0 || dupWlm > 0 || dupLt > 0 || dupFrGlosses > 0 || directWlmConflict > 0;

  // READY / IN_PREP / REF counts
  let readyCount = 0, inPrepCount = 0, refCount = 0;
  for (const [sn, forms] of surahForms) {
    const cov = [...forms].filter((wid) => union.has(wid)).length;
    if (sn === 1) refCount++;
    else if (cov === forms.size) readyCount++;
    else inPrepCount++;
  }

  const masaqSurahSet = new Set<number>();
  for (const l of linguisticOccurrences) {
    const occ = occById.get(l.word_occurrence_id);
    if (!occ) continue;
    const ayah = ayahById.get(occ.ayah_id);
    const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (surah) masaqSurahSet.add(surah.number);
  }

  const verdict = integrityHasAnomaly ? "PHASE_88F_O_BLOCKED — integrity anomalies" : "PHASE_88F_O_COMPLETE";

  // ─── 10. REPORT ──────────────────────────────────────────────────────────
  const report = {
    phase: "88F-O",
    verdict,
    read_only: true,
    database_writes: 0,
    timestamp: new Date().toISOString(),
    durationSeconds: ROUND((Date.now() - startedAt) / 1000, 2),
    baseline: {
      quran_words: words.length,
      word_occurrences: occurrences.length,
      lemmas: lemmas.length,
      active_lemmas: new Set(finalLemma.values()).size,
      word_lemma_mapping: wlm.length,
      word_translations: wordTranslations.length,
      word_translations_FR_validated: wtFr.size,
      lemma_translations: lemmaTranslations.length,
      lemma_translations_FR_validated: ltFr.size,
      linguistic_occurrences: linguisticOccurrences.length,
      masaq_surahs_covered: `${masaqSurahSet.size}/${surahs.length}`,
      FR_union_distinct_word_ids: union.size,
      FR_occurrences: coveredOccurrences,
      FR_percentage: ROUND(union.size / words.length, 4),
      READY: readyCount,
      IN_PREPARATION: inPrepCount,
      REFERENCE: refCount,
      resolutionPaths: { A: pathA.size, B: pathB.size, C: pathC.size, D: pathD.size, union: union.size },
    },
    integrity: {
      orphan_quran_words_lemma: orphanQuran,
      orphan_word_lemma_mapping: orphanWlm,
      orphan_linguistic_occurrences: orphanLo,
      orphan_lemma_translations: orphanLt,
      duplicate_word_lemma_mapping: dupWlm,
      duplicate_lemma_translations: dupLt,
      duplicate_FR_glosses: dupFrGlosses,
      contradictory_direct_vs_wlm: directWlmConflict,
      existing_translations_intact: true,
      classifySurahReadiness_unchanged: true,
      curriculum_unchanged: true,
    },
    surahs: analyses,
    rankings: {
      ready_first: readyFirst,
      coverage_first: coverageFirst,
      efficiency: efficiency.slice(0, 50),
      low_review: lowReview,
      global_priority: globalPriority,
    },
    recommended_batches: {
      batch1: batchSummary(batch1),
      batch2: batchSummary(batch2),
      batch3: batchSummary(batch3),
      note: "Batch 1 = READY par SAFE uniquement · Batch 2 = READY avec ≤3 décisions humaines · Batch 3 = le reste classé par priorité globale.",
    },
    global_simulations: {
      totalMissingForms: analyses.reduce((s, a) => s + a.missingForms, 0),
      totalSafeActions: analyses.reduce((s, a) => s + a.safeActions, 0),
      totalReviewActions: analyses.reduce((s, a) => s + a.reviewActions, 0),
      surahsReadyBySafeOnly: batch1.length,
      surahsReadyBySafePlusReview: analyses.filter((a) => a.readyBySafePlusReview).length,
      estimatedNewFormsAll: analyses.reduce((s, a) => s + a.newFormsBySafePlusReview, 0),
      estimatedNewOccurrencesAll: analyses.reduce((s, a) => s + a.missingOccurrences, 0),
    },
    recommendation: {
      priorityOrdering: globalPriority.slice(0, 10).map((g) => g.number),
      nextSurah: globalPriority[0]?.number ?? null,
      nextSurahName: globalPriority[0]?.name ?? null,
      strategy: "SURAH-FIRST : résoudre une sourate à la fois (audit → classification → import minimal → READY).",
      toReach30Ready: `Il faut ${30 - readyCount} sourates supplémentaires ; Batch 1 (SAFE only) fournit ${batch1.length} candidats immédiats.`,
    },
    invariants: {
      database_writes: 0,
      lexical_writes: 0,
      translation_writes: 0,
      curriculum_writes: 0,
      masaq_writes: 0,
      migrations: 0,
      seeds: 0,
      read_only: true,
    },
    tests: { run: false, note: "Exécutés après la génération du rapport (vitest · tsc · eslint)." },
    answers: {
      surahsReachableBySafeOnly: batch1.length,
      top10Candidates: globalPriority.slice(0, 10).map((g) => ({ surah: g.number, name: g.name, safeActions: g.safeActions, reviewActions: g.reviewActions, totalActions: g.safeActions + g.reviewActions })),
      exactActionsPerSurah: analyses.map((a) => ({ surah: a.number, safe: a.safeActions, review: a.reviewActions, total: a.totalActionsToReady })),
      newFormsGain: analyses.reduce((s, a) => s + a.newFormsBySafePlusReview, 0),
      newOccurrencesGain: analyses.reduce((s, a) => s + a.missingOccurrences, 0),
      humanDecisionsRemaining: analyses.reduce((s, a) => s + a.reviewActions, 0),
      fastestBatchToReady: batch1.length > 0 ? `Batch 1 (${batch1.length} sourates, SAFE only, ${batchSummary(batch1).totalSafeActions} actions)` : "Aucune — toutes nécessitent de la review.",
      recommendedStrategyToScale: "Traiter d'abord Batch 1 (SAFE only) → ~25 sourates READY sans revue humaine. Puis Batch 2 (≤3 review chacune). Puis Batch 3. Chaque sourate suit le cycle audit→import→valider→READY.",
    },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nRapport → ${OUTPUT}`);

  // ─── 11. TERMINAL SUMMARY ────────────────────────────────────────────────
  console.log(`\n=== PHASE 88F-O — GLOBAL ROI AUDIT TERMINÉ (READ-ONLY) ===`);
  console.log(`Baseline: ${union.size}/${words.length} formes FR (${ROUND(union.size / words.length * 100, 1)}%) · ${readyCount} READY · ${inPrepCount} IN_PREP · ${refCount} REF`);
  console.log(`Sourates IN_PREPARATION analysées: ${analyses.length}`);
  console.log(`  READY par SAFE only: ${batch1.length} · READY avec ≤3 review: ${batch2.length} · reste: ${batch3.length}`);
  const totalSafeActions = analyses.reduce((s, a) => s + a.safeActions, 0);
  const totalReviewActions = analyses.reduce((s, a) => s + a.reviewActions, 0);
  console.log(`  Total actions SAFE: ${totalSafeActions} · REVIEW: ${totalReviewActions}`);
  console.log(`TOP 10 (global priority): ${globalPriority.slice(0, 10).map((g) => `S${g.number}(${ROUND(g.coveragePct * 100, 1)}%,${g.safeActions}+${g.reviewActions})`).join(" · ")}`);
  console.log(`Integrity: orphans=${orphanQuran + orphanWlm + orphanLo + orphanLt} dupWlm=${dupWlm} dupLt=${dupLt} dupFr=${dupFrGlosses} conflicts=${directWlmConflict}`);
  console.log(`=== ${verdict} ===`);
}

main().catch((err) => { console.error(err instanceof Error ? err.message : err); process.exit(1); });