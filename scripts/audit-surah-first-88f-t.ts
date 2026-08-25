/**
 * PHASE 88F-T — SURAH-FIRST TARGETED AUDIT — S88 AL-GHASHIYAH
 *
 * STRICT READ-ONLY. ZERO database writes.
 *
 * Target: S88 — Al-Ghashiyah (ranked #3 by 88F-O global priority).
 * Classify each missing form and determine the minimal SAFE path to 100 % FR → READY.
 *
 * Livrable : reports/phase-88f-t-surah88-audit.json
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";

const PAGE_SIZE = 1000;
const OUTPUT = "reports/phase-88f-t-surah88-audit.json";
const HIKMA_SOURCE = "Hikma — lexique éditorial";
const HAMIDULLAH_TR = "Muhammad Hamidullah";
const KAZIMIRSKI_TR = "Albert de Biberstein-Kazimirski";
const TARGET = 88;
const ROUND = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// STATIC READ-ONLY GUARANTEE: only .select() reads. Write patterns:
//   .insert(  .update(  .upsert(  .delete(  .rpc(

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
function increment(map: Map<string, number>, key: string): void { map.set(key, (map.get(key) ?? 0) + 1); }
function unique<T>(values: Iterable<T>): T[] { return [...new Set(values)]; }
function sortedEntries(map: Map<string, number>): Array<{ value: string; count: number }> {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));
}

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
  بروج: "constellations / tours", موعود: "promis / destiné", شاهد: "témoin",
  مشهود: "témoigné / attesté", أخدود: "fossé / tranchée", وقود: "combustible",
  قعود: "assis / installé", شهود: "témoins / présents", ودود: "aimant / affectueux",
  مجيد: "glorieux / magnanime", جنود: "armées / troupes", لوح: "tablette / planche",
  محفوظ: "préservé / protégé",
};

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const startedAt = Date.now();

  console.log(`=== PHASE 88F-T — SURAH-FIRST AUDIT S${TARGET} AL-GHASHIYAH (READ-ONLY) ===\n`);

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
  console.log(`Chargé: surahs=${surahs.length} words=${words.length} occs=${occurrences.length} wlm=${wlm.length} wt=${wordTranslations.length} lt=${lemmaTranslations.length} lo=${linguisticOccurrences.length}`);

  const wordById = new Map(words.map((w) => [w.id, w]));
  const lemmaById = new Map(lemmas.map((l) => [l.id, l]));
  const lemmaByArabic = new Map(lemmas.map((l) => [l.arabic, l]));
  const occById = new Map(occurrences.map((o) => [o.id, o]));
  const ayahById = new Map(ayahs.map((a) => [a.id, a]));
  const surahById = new Map(surahs.map((s) => [s.id, s]));
  const surahNameByNumber = new Map(surahs.map((s) => [s.number, s.name_transliteration ?? `Surah ${s.number}`]));
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
    let m = verseByAyahTranslator.get(tr.ayah_id); if (!m) { m = new Map(); verseByAyahTranslator.set(tr.ayah_id, m); }
    if (!m.has(tr.translator)) m.set(tr.translator, tr.text);
  }

  // FR COVERAGE
  const wtFr = new Map<string, string>();
  for (const r of wordTranslations) if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) wtFr.set(r.word_id, r.text);
  const ltFr = new Map<string, string>();
  for (const r of lemmaTranslations) if (r.language === "fr" && r.is_validated && r.source_id === hikmaSource.id) ltFr.set(r.lemma_id, r.text);

  const finalLemma = new Map<string, string>();
  for (const w of words) if (w.lemma_id) finalLemma.set(w.id, w.lemma_id);
  for (const m of wlm) if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id);
  for (const l of linguisticOccurrences) {
    if (!l.hikma_lemma_id) continue; const occ = occById.get(l.word_occurrence_id);
    if (occ && !finalLemma.has(occ.word_id)) finalLemma.set(occ.word_id, l.hikma_lemma_id);
  }
  const pathA = new Set(wtFr.keys());
  const pathB = new Set<string>(), pathC = new Set<string>(), pathD = new Set<string>();
  for (const w of words) if (w.lemma_id && ltFr.has(w.lemma_id)) pathB.add(w.id);
  for (const m of wlm) if (ltFr.has(m.lemma_id)) pathC.add(m.word_id);
  for (const l of linguisticOccurrences) { if (!l.hikma_lemma_id || !ltFr.has(l.hikma_lemma_id)) continue; const occ = occById.get(l.word_occurrence_id); if (occ) pathD.add(occ.word_id); }
  const union = new Set<string>(pathA); for (const wid of pathB) union.add(wid); for (const wid of pathC) union.add(wid); for (const wid of pathD) union.add(wid);

  // SURAH FORMS
  const surahForms = new Map<number, Set<string>>();
  for (const occ of occurrences) {
    const ayah = ayahById.get(occ.ayah_id); const surah = ayah ? surahById.get(ayah.surah_id) : undefined;
    if (!surah) continue; let set = surahForms.get(surah.number); if (!set) { set = new Set(); surahForms.set(surah.number, set); } set.add(occ.word_id);
  }
  const forms = surahForms.get(TARGET);
  if (!forms) throw new Error(`S${TARGET} introuvable.`);
  const covered = [...forms].filter((wid) => union.has(wid)).length;
  let readyCount = 0, inPrepCount = 0, refCount = 0;
  for (const [sn, fms] of surahForms) { const cov = [...fms].filter((wid) => union.has(wid)).length; if (sn === 1) refCount++; else if (fms.size > 0 && cov === fms.size) readyCount++; else inPrepCount++; }
  console.log(`S${TARGET}: ${covered}/${forms.size} (${ROUND(covered / forms.size * 100, 1)}%) · Global: ${readyCount} READY ${inPrepCount} IN_PREP ${refCount} REF\n`);

  // MISSING FORM ANALYSIS
  const missingIds = [...forms].filter((wid) => !union.has(wid));
  console.log(`→ Analyse de ${missingIds.length} formes manquantes…\n`);

  type Classification = "A_SAFE_LEMMA_GLOSS" | "B_LEMMA_REVIEW" | "C_SAFE_MASAQ_MAPPING" | "D_REVIEW_MASAQ_MAPPING" | "E_SAFE_WORD_TRANSLATION" | "F_REVIEW_WORD_TRANSLATION" | "G_NO_SAFE_PATH" | "H_DO_NOT_IMPORT" | "I_ALREADY_RESOLVABLE";
  interface FD { wordId: string; arabic: string; lemmaId: string | null; lemmaArabic: string | null; masaqStems: string[]; masaqQuality: number | null; topGlossEn: string | null; topGlossShare: number | null; competingStems: boolean; pos: string[]; hasHamidullah: boolean; hasKazimirski: boolean; hamSamples: string[]; kazSamples: string[]; occCount: number; classification: Classification; safeGlossLemmaId: string | null; safeGlossText: string | null; safeWordTrText: string | null; reviewReason: string | null; confidence: number; }
  const fds: FD[] = [];

  for (const wordId of missingIds) {
    const word = wordById.get(wordId)!;
    const curLid = finalLemma.get(wordId) ?? null;
    const curLar = curLid ? lemmaById.get(curLid)?.arabic ?? null : null;
    const los = loByWord.get(wordId) ?? [];
    const gcm = new Map<string, number>(); const sset = new Set<string>(); const lset = new Set<string>(); const stm = new Map<string, number>(); const pset = new Set<string>();
    for (const lo of los) { if (lo.masaq_gloss_en) increment(gcm, lo.masaq_gloss_en); if (lo.masaq_stem) sset.add(lo.masaq_stem); if (lo.hikma_lemma_id) lset.add(lo.hikma_lemma_id); increment(stm, lo.lemma_mapping_status); for (const p of lo.pos ?? []) pset.add(p); }
    const tgl = sortedEntries(gcm)[0] ?? null; const lt = los.length;
    const mq = lt > 0 ? ROUND((stm.get("EXACT") ?? 0) / lt, 3) : null;
    const mstems = [...sset].sort();
    const occs = occurrences.filter((o) => o.word_id === wordId);
    let hh = false, hk = false; const hs: string[] = [], ks: string[] = [];
    for (const o of occs) { const vm = verseByAyahTranslator.get(o.ayah_id); if (vm?.has(HAMIDULLAH_TR)) { hh = true; hs.push(vm.get(HAMIDULLAH_TR)!); } if (vm?.has(KAZIMIRSKI_TR)) { hk = true; ks.push(vm.get(KAZIMIRSKI_TR)!); } }

    let cls: Classification; let sglid: string | null = null; let sglt: string | null = null; let swtt: string | null = null; let rr: string | null = null; let conf = 0;
    const hwt = wtFr.has(wordId), hlt = curLid ? ltFr.has(curLid) : false;
    if (hwt || hlt) { cls = "I_ALREADY_RESOLVABLE"; conf = 1; }
    else if (curLid) {
      const mr = (mq ?? 0) >= 0.8 && !(sset.size > 1) && (tgl?.count ?? 0) / (lt || 1) >= 0.4;
      const src = hh || hk; const hint = KNOWN_GLOSS_HINTS[curLar ?? ""] ?? null;
      if (mr && src) { cls = "A_SAFE_LEMMA_GLOSS"; sglid = curLid; sglt = hint ?? `(à écrire pour « ${curLar} »)`; conf = hint ? 0.85 : 0.7; }
      else if (!mr && !src) { cls = "H_DO_NOT_IMPORT"; rr = `MASAQ non fiable (quality=${mq}) ET pas de source.`; }
      else { cls = "B_LEMMA_REVIEW"; rr = !mr ? `MASAQ non fiable (quality=${mq}).` : `pas de source.`; }
    } else if (mstems.length > 0) {
      const cl = unique([...lset]).filter((id) => lemmaById.has(id));
      const stl = unique(mstems).map((st) => lemmaByArabic.get(st)?.id).filter(Boolean) as string[];
      const hint = KNOWN_GLOSS_HINTS[mstems[0] ?? ""] ?? null;
      if (cl.length === 1 && (mq ?? 0) >= 1 && !(sset.size > 1)) { cls = "C_SAFE_MASAQ_MAPPING"; sglid = cl[0] ?? null; conf = 0.8; }
      else if (stl.length === 1 && (mq ?? 0) >= 1 && !(sset.size > 1)) { cls = "C_SAFE_MASAQ_MAPPING"; sglid = stl[0]; conf = 0.8; }
      else if (hint) { cls = "E_SAFE_WORD_TRANSLATION"; swtt = hint; conf = 0.75; }
      else { cls = "F_REVIEW_WORD_TRANSLATION"; rr = `stem « ${mstems.join(",")} » UNMAPPED quality=${mq} — word_translation à écrire.`; }
    } else { cls = "G_NO_SAFE_PATH"; rr = "aucun lemme ni stem MASAQ."; }

    fds.push({ wordId, arabic: word.arabic, lemmaId: curLid, lemmaArabic: curLar, masaqStems: mstems, masaqQuality: mq, topGlossEn: tgl?.value ?? null, topGlossShare: tgl ? (lt > 0 ? ROUND(tgl.count / lt, 3) : null) : null, competingStems: sset.size > 1, pos: [...pset].sort(), hasHamidullah: hh, hasKazimirski: hk, hamSamples: hs.slice(0, 2), kazSamples: ks.slice(0, 2), occCount: occs.length, classification: cls, safeGlossLemmaId: sglid, safeGlossText: sglt, safeWordTrText: swtt, reviewReason: rr, confidence: ROUND(conf, 2) });
  }

  const counts: Record<string, number> = { A:0,B:0,C:0,D:0,E:0,F:0,G:0,H:0,I:0 };
  for (const fd of fds) { const k = fd.classification.split("_")[0]; if (counts[k] !== undefined) counts[k]++; }

  const allGl = new Set<string>(), safeGl = new Set<string>(), safeWt = new Set<string>(), revWt = new Set<string>();
  for (const fd of fds) { if (fd.lemmaId) allGl.add(fd.lemmaId); if (fd.classification === "A_SAFE_LEMMA_GLOSS" && fd.safeGlossLemmaId) safeGl.add(fd.safeGlossLemmaId); if (fd.classification === "E_SAFE_WORD_TRANSLATION" && fd.safeWordTrText) safeWt.add(fd.wordId); if (fd.classification === "F_REVIEW_WORD_TRANSLATION") revWt.add(fd.wordId); }

  const simSafe = new Set(union); for (const [wid, lid] of finalLemma) if (safeGl.has(lid)) simSafe.add(wid); for (const wid of safeWt) simSafe.add(wid);
  const simSR = new Set(simSafe); for (const wid of revWt) simSR.add(wid);
  const simAll = new Set(simSR); for (const fd of fds) { if (fd.classification === "C_SAFE_MASAQ_MAPPING" && fd.safeGlossLemmaId) { if (ltFr.has(fd.safeGlossLemmaId) || safeGl.has(fd.safeGlossLemmaId)) simAll.add(fd.wordId); } }
  const sims = [
    { name:"BASELINE", forms:covered, pct:ROUND(covered/forms.size*100,1), ready:false, remaining:forms.size-covered },
    { name:"SAFE_GLOSSES", forms:[...forms].filter((w)=>simSafe.has(w)).length, pct:ROUND([...forms].filter((w)=>simSafe.has(w)).length/forms.size*100,1), ready:[...forms].filter((w)=>simSafe.has(w)).length===forms.size, remaining:forms.size-[...forms].filter((w)=>simSafe.has(w)).length },
    { name:"SAFE_PLUS_REVIEW", forms:[...forms].filter((w)=>simSR.has(w)).length, pct:ROUND([...forms].filter((w)=>simSR.has(w)).length/forms.size*100,1), ready:[...forms].filter((w)=>simSR.has(w)).length===forms.size, remaining:forms.size-[...forms].filter((w)=>simSR.has(w)).length },
    { name:"COMPLETE", forms:[...forms].filter((w)=>simAll.has(w)).length, pct:ROUND([...forms].filter((w)=>simAll.has(w)).length/forms.size*100,1), ready:[...forms].filter((w)=>simAll.has(w)).length===forms.size, remaining:forms.size-[...forms].filter((w)=>simAll.has(w)).length },
  ];

  const lgActs = allGl.size, sgActs = safeGl.size, swActs = safeWt.size, rwActs = revWt.size;
  const totalActs = lgActs + rwActs, safeActs = sgActs + swActs, reviewActs = totalActs - safeActs;

  // INTEGRITY
  const lSet = new Set(lemmas.map((l) => l.id));
  let oq = 0, ow = 0, ol = 0, olt = 0;
  for (const w of words) if (w.lemma_id && !lSet.has(w.lemma_id)) oq++;
  for (const m of wlm) if (!lSet.has(m.lemma_id)) ow++;
  for (const l of linguisticOccurrences) if (l.hikma_lemma_id && !lSet.has(l.hikma_lemma_id)) ol++;
  for (const r of lemmaTranslations) if (!lSet.has(r.lemma_id)) olt++;
  const lkc = new Map<string, number>(); for (const r of lemmaTranslations) { const k = `${r.lemma_id}|${r.language}|${r.source_id??""}`; lkc.set(k, (lkc.get(k)??0)+1); }
  const wk = new Map<string, number>(); for (const m of wlm) { const k = `${m.word_id}|${m.lemma_id}`; wk.set(k, (wk.get(k)??0)+1); }
  const wfk = new Map<string, number>(); for (const r of wordTranslations) { if (r.language==="fr" && r.is_validated && r.source_id===hikmaSource.id) wfk.set(r.word_id, (wfk.get(r.word_id)??0)+1); }
  let dwc = 0; for (const w of words) { const v = wlmByWord.get(w.id); if (w.lemma_id && v && w.lemma_id !== v.lemma_id) dwc++; }
  const anom = oq+ow+ol+olt+[...wk.values()].filter((v)=>v>1).length+[...lkc.values()].filter((v)=>v>1).length+[...wfk.values()].filter((v)=>v>1).length+dwc;
  const cr = (sn:number) => { const f=surahForms.get(sn); return f ? [...f].filter((w)=>union.has(w)).length===f.size : null; };

  const report = {
    phase:"88F-T", verdict: anom>0?"PHASE_88F_T_BLOCKED":"PHASE_88F_T_COMPLETE", read_only:true, database_writes:0,
    timestamp: new Date().toISOString(), durationSeconds: ROUND((Date.now()-startedAt)/1000,2),
    targetSurah: { number:TARGET, name: surahNameByNumber.get(TARGET)??`Surah ${TARGET}` },
    baseline: { totalForms:forms.size, coveredForms:covered, missingForms:missingIds.length, coveragePct:ROUND(covered/forms.size,4),
      totalOccs: [...forms].reduce((s,w)=>s+(occCountByWord.get(w)??0),0), missingOccs: missingIds.reduce((s,w)=>s+(occCountByWord.get(w)??0),0),
      readiness: covered===forms.size?"READY":"IN_PREPARATION", globalReady:readyCount, globalInPrep:inPrepCount, globalRef:refCount },
    classification: counts,
    missingForms: fds.map((fd)=>({
      word_id:fd.wordId, arabic:fd.arabic, lemma_id:fd.lemmaId, lemma_arabic:fd.lemmaArabic,
      masaq_stems:fd.masaqStems, masaq_quality:fd.masaqQuality, top_gloss_en:fd.topGlossEn, top_gloss_share:fd.topGlossShare,
      competing_stems:fd.competingStems, pos:fd.pos, has_hamidullah:fd.hasHamidullah, has_kazimirski:fd.hasKazimirski,
      hamidullah_samples:fd.hamSamples, kazimirski_samples:fd.kazSamples, occurrences:fd.occCount,
      classification:fd.classification, safe_gloss_lemma_id:fd.safeGlossLemmaId, safe_gloss_text:fd.safeGlossText,
      safe_word_tr_text:fd.safeWordTrText, review_reason:fd.reviewReason, confidence:fd.confidence,
    })),
    safeGlossCandidates: [...safeGl].map((lid)=>{ const l=lemmaById.get(lid); const h=KNOWN_GLOSS_HINTS[l?.arabic??""]??null; return { lemma_id:lid, lemma_arabic:l?.arabic??null, gloss:h??`(à écrire)`, forms_in_S88: fds.filter((fd)=>fd.lemmaId===lid&&fd.classification==="A_SAFE_LEMMA_GLOSS").length }; }),
    safeWordTrCandidates: [...safeWt].map((wid)=>{ const f=fds.find((x)=>x.wordId===wid)!; return { word_id:wid, arabic:f.arabic, gloss:f.safeWordTrText }; }),
    reviewWordTrCandidates: [...revWt].map((wid)=>{ const f=fds.find((x)=>x.wordId===wid)!; return { word_id:wid, arabic:f.arabic, masaq_stems:f.masaqStems, masaq_quality:f.masaqQuality, review_reason:f.reviewReason }; }),
    simulations: sims,
    exactActionsToReady: { totalLemmaGlosses:lgActs, safeLemmaGlosses:sgActs, safeWordTranslations:swActs, reviewWordTranslations:rwActs, totalActions:totalActs, safeActions:safeActs, reviewActions:reviewActs },
    roi: { newFormsSafe: [...forms].filter((w)=>simSafe.has(w)).length-covered, newFormsComplete: [...forms].filter((w)=>simAll.has(w)).length-covered, ratio: totalActs>0?ROUND(([...forms].filter((w)=>simAll.has(w)).length-covered)/totalActs,2):0 },
    integrity: {
      orphan_quran:oq, orphan_wlm:ow, orphan_lo:ol, orphan_lt:olt,
      dup_wlm:[...wk.values()].filter((v)=>v>1).length, dup_lt:[...lkc.values()].filter((v)=>v>1).length, dup_fr_wt:[...wfk.values()].filter((v)=>v>1).length, dir_wlm_conflict:dwc,
      S98:cr(98), S92:cr(92), S82:cr(82), S85:cr(85), S90:cr(90),
    },
    invariants: { db_writes:0, lexical_writes:0, translation_writes:0, curriculum_writes:0, masaq_writes:0, migrations:0, seeds:0 },
    tests: { run:false, note:"vitest · tsc · eslint" },
    nextPhase: { phase:"88F-U", name:"S88 AL-GHASHIYAH RESOLUTION", actions:`${sgActs}+${rwActs}=${totalActs}`, expected:`${forms.size}/${forms.size} → 100 % → READY` },
  };
  mkdirSync("reports",{recursive:true}); writeFileSync(OUTPUT,JSON.stringify(report,null,2)+"\n");
  console.log(`Rapport → ${OUTPUT}`);
  console.log(`\n=== S${TARGET}: ${covered}/${forms.size} (${ROUND(covered/forms.size*100,1)}%) · ${missingIds.length} manquantes`);
  console.log(`  A:${counts.A} B:${counts.B} C:${counts.C} D:${counts.D} E:${counts.E} F:${counts.F} G:${counts.G} H:${counts.H}`);
  console.log(`  Glosses: ${sgActs}/${lgActs} SAFE · word_tr: ${swActs}/${rwActs} SAFE/REVIEW · Total actions: ${totalActs} (${safeActs}S+${reviewActs}R)`);
  console.log(`  S98=${cr(98)} S92=${cr(92)} S82=${cr(82)} S85=${cr(85)} S90=${cr(90)} · anomalies=${anom}`);
  console.log(`=== ${report.verdict} ===`);
}
main().catch((e)=>{console.error(e instanceof Error?e.message:e);process.exit(1);});