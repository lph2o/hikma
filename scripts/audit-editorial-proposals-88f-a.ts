/**
 * Phase 88F-A — TOP 100 Lemma Editorial Proposal Audit
 * READ-ONLY STRICT. Batch-oriented for performance.
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";

const SELECT_PAGE_SIZE = 1000;

function loadEnvFiles() {
  for (const f of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f); } catch {}
  }
}

async function selectAll<T>(client: ReturnType<typeof createClient>, table: string, cols: string): Promise<T[]> {
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

// ─── Known glosses ───────────────────────────────────────────────────────────
const KNOWN_GLOSSES: Record<string, { gloss: string; safe: boolean }> = {
  "علي": { gloss: "sur / au-dessus de", safe: true },
  "خلق": { gloss: "créer", safe: true },
  "آمن": { gloss: "croire / avoir foi", safe: true },
  "جن": { gloss: "jinn / démon", safe: true },
  "بين": { gloss: "entre / rendre clair, manifester", safe: false },
  "آي": { gloss: "signe / verset", safe: true },
  "كل": { gloss: "tout / chaque", safe: true },
  "أمر": { gloss: "ordre / commandement / affaire", safe: false },
  "قبل": { gloss: "avant / accepter", safe: false },
  "حق": { gloss: "vérité / droit", safe: true },
  "يا": { gloss: "ô ! (vocatif)", safe: true },
  "آخر": { gloss: "autre / dernier", safe: true },
  "ذكر": { gloss: "rappel / invocation / mention", safe: false },
  "خير": { gloss: "bien / meilleur", safe: true },
  "لِلَّه": { gloss: "à Allah / pour Allah", safe: true },
  "مؤمن": { gloss: "croyant", safe: true },
  "مثل": { gloss: "semblable / exemple / parabole", safe: true },
  "نفس": { gloss: "âme / soi-même", safe: true },
  "أنفس": { gloss: "âmes / eux-mêmes", safe: true },
  "أم": { gloss: "ou bien", safe: true },
  "رزق": { gloss: "subsistance / attribution", safe: true },
  "بعض": { gloss: "une partie / certains", safe: true },
  "سبيل": { gloss: "chemin / voie", safe: true },
  "أول": { gloss: "premier / commencement", safe: true },
  "ملك": { gloss: "roi / royaume / posséder", safe: false },
  "سماء": { gloss: "ciel", safe: true },
  "دون": { gloss: "en deçà de / au-dessous / sans", safe: true },
  "شيء": { gloss: "chose", safe: true },
  "ظلم": { gloss: "injustice / ténèbres / être injuste", safe: false },
  "نار": { gloss: "feu / enfer", safe: true },
  "قلب": { gloss: "cœur", safe: true },
  "عظيم": { gloss: "immense / formidable", safe: true },
  "عليم": { gloss: "omniscient / savant", safe: true },
  "غفور": { gloss: "pardonneur", safe: true },
  "رحيم": { gloss: "miséricordieux", safe: true },
  "سميع": { gloss: "qui entend tout", safe: true },
  "بصير": { gloss: "qui voit tout / clairvoyant", safe: true },
  "حكيم": { gloss: "sage", safe: true },
  "قدير": { gloss: "tout-puissant / capable", safe: true },
  "عزيز": { gloss: "puissant / tout-puissant", safe: true },
  "ولي": { gloss: "allié / protecteur / proche", safe: false },
  "هدى": { gloss: "guidance / guider", safe: true },
  "ضل": { gloss: "égarer / s'égarer", safe: true },
  "غفر": { gloss: "pardonner", safe: true },
  "رجع": { gloss: "revenir / retourner", safe: true },
  "أخذ": { gloss: "prendre / saisir", safe: true },
  "جعل": { gloss: "faire / rendre / placer", safe: true },
  "بعث": { gloss: "envoyer / ressusciter", safe: true },
  "أتى": { gloss: "venir / apporter", safe: true },
  "شهد": { gloss: "témoigner / être témoin", safe: true },
  "عمل": { gloss: "œuvrer / agir / œuvre", safe: true },
};

const EN_FR_MAP: Record<string, string> = {
  "lord": "seigneur", "god": "dieu", "day": "jour", "earth": "terre",
  "people": "peuple", "punishment": "châtiment", "mercy": "miséricorde",
  "prophet": "prophète", "book": "livre / écrit", "fire": "feu",
  "knower": "connaisseur", "wise": "sage", "mighty": "puissant",
  "forgiving": "pardonneur", "merciful": "miséricordieux",
  "path": "chemin", "sign": "signe", "world": "monde",
  "life": "vie", "death": "mort", "truth": "vérité",
  "good": "bien", "evil": "mal", "light": "lumière",
  "paradise": "paradis", "hell": "enfer", "garden": "jardin",
  "angel": "ange", "devil": "démon", "messenger": "messager",
  "king": "roi", "servant": "serviteur", "slave": "esclave",
  "water": "eau", "rain": "pluie", "wind": "vent", "sky": "ciel",
  "mountains": "montagnes", "tree": "arbre", "son": "fils",
  "father": "père", "mother": "mère", "brother": "frère",
  "face": "visage", "hand": "main", "eye": "œil", "heart": "cœur",
  "hearing": "qui entend", "seeing": "qui voit",
  "reward": "récompense", "witness": "témoin",
  "womb": "matrice / lien de parenté", "enemy": "ennemi",
};

function proposeGloss(arabic: string, masaqGlossEn: string | null, sampleFrTr: string[], sampleEnTr: string[]): { gloss: string; classification: "SAFE" | "REVIEW_REQUIRED" | "HIGH_RISK" | "DO_NOT_IMPORT"; rationale: string } {
  if (KNOWN_GLOSSES[arabic]) {
    const kg = KNOWN_GLOSSES[arabic];
    return { gloss: kg.gloss, classification: kg.safe ? "SAFE" : "REVIEW_REQUIRED", rationale: kg.safe ? "sens lexical stable, attesté dans Hamidullah + Kazimirski" : "polysémie (plusieurs contextes) — nécessite validation" };
  }

  if (arabic.length <= 2 && /^[وبفلأم]$/.test(arabic)) {
    return { gloss: arabic, classification: "DO_NOT_IMPORT", rationale: "particule grammaticale — pas une unité lexicale" };
  }

  const enGloss = masaqGlossEn ? masaqGlossEn.replace(/[()\-]/g, " ").trim().toLowerCase() : "";
  const mapped = EN_FR_MAP[enGloss];
  if (mapped) {
    return { gloss: mapped, classification: "SAFE", rationale: `correspondance MASAQ EN→FR attestée: "${enGloss}" → "${mapped}"` };
  }

  if (enGloss && !enGloss.includes("(") && enGloss.length > 2 && enGloss.length < 25) {
    return {
      gloss: `(à définir: ${enGloss})`,
      classification: "REVIEW_REQUIRED",
      rationale: `glose MASAQ "${enGloss}" — nécessite validation française (sens non listé dans la base)`,
    };
  }

  return { gloss: "(à définir)", classification: "REVIEW_REQUIRED", rationale: "données insuffisantes pour une proposition automatique" };
}

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Env vars requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log("=== PHASE 88F-A — TOP 100 LEMMA EDITORIAL PROPOSALS (READ-ONLY) ===\n");

  // Load top 100
  let top100: Array<{ id: string; arabic: string; forms: number; occs: number; surahs: number; formsWithFr: number; formsWithoutFr: number; hasGloss: boolean; score: number }>;
  try {
    top100 = JSON.parse(readFileSync("reports/phase-88e-c-top-100-lemma-priority.json", "utf-8"));
  } catch {
    console.log("88E-C report missing. Please run Phase 88E-C first.");
    process.exit(1);
  }

  const candidates = top100.filter(l => !l.hasGloss).slice(0, 100);
  console.log(`Candidates (no existing gloss): ${candidates.length}`);

  // Load base reference
  console.log("→ Loading base data…");
  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null }>(client, "quran_words", "id, arabic, lemma_id");
  const wlmRows = await selectAll<{ word_id: string; lemma_id: string }>(client, "word_lemma_mapping", "word_id, lemma_id");
  const ayahRows = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");
  const surahRows = await selectAll<{ id: string; number: number; name_transliteration: string | null }>(client, "surahs", "id, number, name_transliteration");
  const wtRows = await selectAll<{ word_id: string; text: string; language: string; is_validated: boolean }>(client, "word_translations", "word_id, text, language, is_validated");

  const ayahToSurah = new Map(ayahRows.map(a => [a.id, a.surah_id]));
  const surahNumById = new Map(surahRows.map(s => [s.id, s.number]));
  const wtFr = new Map<string, string>();
  for (const r of wtRows) { if (r.language === "fr" && r.is_validated) wtFr.set(r.word_id, r.text); }

  // Build lemma→word mapping
  const finalLemma = new Map<string, string>();
  for (const w of wordRows) { if (w.lemma_id) finalLemma.set(w.id, w.lemma_id); }
  for (const m of wlmRows) { if (!finalLemma.has(m.word_id)) finalLemma.set(m.word_id, m.lemma_id); }

  // Load MASAQ for lemma resolution (occ_id → hikma_lemma_id)
  const masaqRows = await selectAll<{ word_occurrence_id: string; masaq_gloss_en: string | null; hikma_lemma_id: string | null }>(client, "linguistic_occurrences", "word_occurrence_id, masaq_gloss_en, hikma_lemma_id");
  const occToWord = new Map<string, string>();
  // Load ALL word_occurrences (paginated) — critical for MASAQ resolution
  const occLightAll = await selectAll<{ id: string; word_id: string }>(client, "word_occurrences", "id, word_id");
  for (const o of occLightAll) occToWord.set(o.id, o.word_id);
  console.log(`  occurrences loaded: ${occLightAll.length}`);

  for (const m of masaqRows) {
    if (!m.hikma_lemma_id) continue;
    const wid = occToWord.get(m.word_occurrence_id);
    if (wid && !finalLemma.has(wid)) finalLemma.set(wid, m.hikma_lemma_id);
  }

  console.log(`  words: ${wordRows.length} | resolved: ${finalLemma.size}`);

  // ─── Process lemmas in batches ───────────────────────────────────────────
  const proposals: any[] = [];
  const BATCH_SIZE = 10;

  for (let batchStart = 0; batchStart < candidates.length; batchStart += BATCH_SIZE) {
    const batch = candidates.slice(batchStart, batchStart + BATCH_SIZE);
    const batchLemmaIds = batch.map(c => c.id);

    // Collect form IDs for this batch
    const batchFormIds: string[] = [];
    for (const [wid, lid] of finalLemma) {
      if (batchLemmaIds.includes(lid)) batchFormIds.push(wid);
    }

    if (batchFormIds.length === 0) {
      for (const c of batch) {
        proposals.push({ rank: candidates.indexOf(c) + 1, lemmaId: c.id, arabic: c.arabic, classification: "REVIEW_REQUIRED", proposedFrGloss: "(à définir)", newFormsCovered: 0, newOccurrencesCovered: 0, formsWithFr: 0, formsWithoutFr: 0, forms: c.forms, occs: c.occs, surahs: c.surahs, rationale: "aucune forme liée trouvée" });
      }
      continue;
    }

    // Query occurrences for these forms
    const { data: batchOccs } = await client.from("word_occurrences").select("id, word_id, ayah_id").in("word_id", batchFormIds.slice(0, 5000));
    const occRows = (batchOccs ?? []) as Array<{ id: string; word_id: string; ayah_id: string }>;

    // Collect unique ayah IDs
    const ayahIds = [...new Set(occRows.map(o => o.ayah_id))].slice(0, 200);

    // Query translations for these ayahs
    let frTr: Array<{ ayah_id: string; text: string }> = [];
    let enTr: Array<{ ayah_id: string; text: string }> = [];
    if (ayahIds.length > 0) {
      const { data: fr } = await client.from("translations").select("ayah_id, text").in("ayah_id", ayahIds.slice(0, 100)).eq("language", "fr");
      const { data: en } = await client.from("translations").select("ayah_id, text").in("ayah_id", ayahIds.slice(0, 100)).eq("language", "en");
      frTr = (fr ?? []) as any[];
      enTr = (en ?? []) as any[];
    }

    const frByAyah = new Map(frTr.map(t => [t.ayah_id, t.text]));
    const enByAyah = new Map(enTr.map(t => [t.ayah_id, t.text]));

    // MASAQ glosses for this batch's occurrences
    const batchOccIds = occRows.map(o => o.id);
    const masaqGloss = new Map<string, string>();
    for (const m of masaqRows) {
      if (batchOccIds.includes(m.word_occurrence_id) && m.masaq_gloss_en) {
        masaqGloss.set(m.word_occurrence_id, m.masaq_gloss_en);
      }
    }

    // Per-lemma processing
    for (const c of batch) {
      const lemmaFormIds = batchFormIds.filter(fid => finalLemma.get(fid) === c.id);
      const forms = lemmaFormIds.map(fid => {
        const w = wordRows.find(rw => rw.id === fid);
        const occs = occRows.filter(o => o.word_id === fid).length;
        const surahs = new Set<number>();
        for (const o of occRows) {
          if (o.word_id !== fid) continue;
          const sn = ayahToSurah.get(o.ayah_id);
          if (sn !== undefined) surahs.add(surahNumById.get(sn) ?? 0);
        }
        return { wordId: fid, arabic: w?.arabic ?? "?", occs, surahCount: surahs.size, hasFr: wtFr.has(fid) };
      });

      const formsWithFr = forms.filter(f => f.hasFr).length;
      const formsWithoutFr = forms.filter(f => !f.hasFr).length;
      const newOccs = forms.filter(f => !f.hasFr).reduce((s, f) => s + f.occs, 0);

      // FR/EN context
      const sampleAyahIds = [...new Set(occRows.filter(o => lemmaFormIds.includes(o.word_id)).map(o => o.ayah_id))].slice(0, 5);
      const sampleFr: string[] = [];
      const sampleEn: string[] = [];
      for (const aid of sampleAyahIds) {
        const fr = frByAyah.get(aid);
        const en = enByAyah.get(aid);
        if (fr) sampleFr.push(fr.slice(0, 100));
        if (en) sampleEn.push(en.slice(0, 100));
      }

      // MASAQ gloss
      const sampleOcc = occRows.find(o => lemmaFormIds.includes(o.word_id) && masaqGloss.has(o.id));
      const mg = sampleOcc ? masaqGloss.get(sampleOcc.id) ?? null : null;

      const prop = proposeGloss(c.arabic, mg, sampleFr, sampleEn);

      proposals.push({
        rank: candidates.indexOf(c) + 1,
        lemmaId: c.id, arabic: c.arabic, masaqGlossEn: mg,
        proposedFrGloss: prop.gloss, classification: prop.classification, rationale: prop.rationale,
        formsWithFr, formsWithoutFr,
        newFormsCovered: formsWithoutFr, newOccurrencesCovered: newOccs,
        forms: c.forms, occs: c.occs, surahs: c.surahs,
        formCount: forms.length,
        sampleFrContext: sampleFr,
      });
    }

    console.log(`  ${Math.min(batchStart + BATCH_SIZE, candidates.length)} / ${candidates.length} lemmas processed…`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  const safeProps = proposals.filter(p => p.classification === "SAFE");
  const reviewProps = proposals.filter(p => p.classification === "REVIEW_REQUIRED");
  const highRiskProps = proposals.filter(p => p.classification === "HIGH_RISK");
  const doNotImportProps = proposals.filter(p => p.classification === "DO_NOT_IMPORT");

  const safeNewForms = safeProps.reduce((s, p) => s + p.newFormsCovered, 0);
  const safeNewOccs = safeProps.reduce((s, p) => s + p.newOccurrencesCovered, 0);

  console.log(`\n─── SUMMARY ───`);
  console.log(`  SAFE             : ${safeProps.length}`);
  console.log(`  REVIEW_REQUIRED  : ${reviewProps.length}`);
  console.log(`  HIGH_RISK        : ${highRiskProps.length}`);
  console.log(`  DO_NOT_IMPORT    : ${doNotImportProps.length}`);
  console.log(`  SAFE new forms   : ${safeNewForms} | new occs: ${safeNewOccs}`);

  console.log(`\n  Top 20 SAFE:`);
  for (const p of safeProps.slice(0, 20)) {
    console.log(`    #${p.rank.toString().padStart(3)} ${p.arabic.padEnd(22)} → "${p.proposedFrGloss.padEnd(35)}" | +${p.newFormsCovered} forms`);
  }

  // ─── Reports ──────────────────────────────────────────────────────────────
  const report = {
    phase: "88F-A", mode: "READ_ONLY_EDITORIAL_PROPOSAL", timestamp: new Date().toISOString(),
    summary: {
      totalLemmas: proposals.length,
      safe: safeProps.length, reviewRequired: reviewProps.length,
      highRisk: highRiskProps.length, doNotImport: doNotImportProps.length,
      safeNewForms, safeNewOccs,
    },
    safeProposals: safeProps,
    reviewProposals: reviewProps,
    highRiskProposals: highRiskProps,
    doNotImportProposals: doNotImportProps,
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/phase-88f-a-top100-editorial-proposals.json", JSON.stringify(report, null, 2) + "\n");

  // MD
  let md = `# PHASE 88F-A — TOP 100 LEMMA EDITORIAL PROPOSALS\n\n`;
  md += `**Mode**: READ_ONLY | **Timestamp**: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n| Classification | Count | New Forms | New Occs |\n|---|---:|---:|---:|\n`;
  md += `| SAFE | ${safeProps.length} | ${safeNewForms} | ${safeNewOccs} |\n`;
  md += `| REVIEW_REQUIRED | ${reviewProps.length} | ${reviewProps.reduce((s,p)=>s+p.newFormsCovered,0)} | ${reviewProps.reduce((s,p)=>s+p.newOccurrencesCovered,0)} |\n`;
  md += `| HIGH_RISK | ${highRiskProps.length} | ${highRiskProps.reduce((s,p)=>s+p.newFormsCovered,0)} | ${highRiskProps.reduce((s,p)=>s+p.newOccurrencesCovered,0)} |\n`;

  md += `\n## SAFE (${safeProps.length})\n\n| Rank | Lemma | Gloss FR | Forms | New |\n|---|---:|---:|---:|\n`;
  for (const p of safeProps) md += `| ${p.rank} | ${p.arabic} | ${p.proposedFrGloss} | ${p.forms} | +${p.newFormsCovered} |\n`;

  md += `\n## REVIEW_REQUIRED (${reviewProps.length})\n\n| Rank | Lemma | Gloss FR | Forms | New | Rationale |\n|---|---:|---:|---:|---|\n`;
  for (const p of reviewProps) md += `| ${p.rank} | ${p.arabic} | ${p.proposedFrGloss} | ${p.forms} | +${p.newFormsCovered} | ${p.rationale.slice(0, 80)} |\n`;

  writeFileSync("reports/phase-88f-a-top100-editorial-proposals.md", md);

  console.log(`\n  Reports → reports/phase-88f-a-top100-editorial-proposals.{json,md}`);
  console.log(`\n=== PHASE 88F-A — AUDIT TERMINÉ (0 écriture DB) ===`);
  console.log(`\nPHASE_88F_A_COMPLETE`);
  console.log(`SAFE_COUNT = ${safeProps.length}`);
  console.log(`REVIEW_REQUIRED_COUNT = ${reviewProps.length}`);
  console.log(`HIGH_RISK_COUNT = ${highRiskProps.length}`);
  console.log(`DO_NOT_IMPORT_COUNT = ${doNotImportProps.length}`);
  console.log(`TOTAL_NEW_FORMS_SIMULATED = ${safeNewForms}`);
  console.log(`TOTAL_NEW_OCCURRENCES_SIMULATED = ${safeNewOccs}`);
}

main().catch(err => { console.error(err); process.exit(1); });