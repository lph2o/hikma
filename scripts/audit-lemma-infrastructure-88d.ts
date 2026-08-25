/**
 * Phase 88D — Audit infrastructure lemma + word_translations.
 * READ-ONLY STRICT — 0 écriture DB.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "node:fs";

const SELECT_PAGE_SIZE = 1000;

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try { (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file); } catch {}
  }
}

async function selectAll<T>(client: ReturnType<typeof createClient>, table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += SELECT_PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(from, from + SELECT_PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < SELECT_PAGE_SIZE) break;
  }
  return rows;
}

type WtRow = { word_id: string; text: string; language: string; is_validated: boolean; source_id: string };
type SourceRow = { id: string; name: string; type: string };
type LemmaRow = { id: string; arabic: string };
type WlmRow = { word_id: string; lemma_id: string; confidence: string };
type LtRow = { lemma_id: string; text: string; language: string; is_validated: boolean; source_id: string };

async function main() {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY requis.");
  const client = createClient(url, key, { auth: { persistSession: false } });

  console.log("=== PHASE 88D — AUDIT INFRASTRUCTURE LEMMA (READ-ONLY) ===\n");

  // ─── 0. Charger les tables nécessaires ────────────────────────────
  const sourceRows = await selectAll<SourceRow>(client, "sources", "id, name, type");
  const sourceById = new Map(sourceRows.map(s => [s.id, s]));

  const wtRows = await selectAll<WtRow>(client, "word_translations", "word_id, text, language, is_validated, source_id");
  const lemmaRows = await selectAll<LemmaRow>(client, "lemmas", "id, arabic");
  const wlmRows = await selectAll<WlmRow>(client, "word_lemma_mapping", "word_id, lemma_id, confidence");
  const ltRows = await selectAll<LtRow>(client, "lemma_translations", "lemma_id, text, language, is_validated, source_id");

  // Source Hikma éditoriale
  const hikmaSource = sourceRows.find(s => s.name === "Hikma — lexique éditorial");
  const hikmaId = hikmaSource?.id ?? "";
  console.log(`Source Hikma : ${hikmaId.slice(0, 8)}…`);

  // ─── 1. AUDIT EXACT DES WORD_TRANSLATIONS ─────────────────────────
  console.log("\n━━━ 1. AUDIT WORD_TRANSLATIONS ━━━");

  // Par source
  const wtBySource = new Map<string, { name: string; lang: Map<string, { val: number; unv: number }> }>();
  for (const r of wtRows) {
    const src = sourceById.get(r.source_id);
    const srcName = src?.name ?? r.source_id.slice(0, 8);
    let entry = wtBySource.get(r.source_id);
    if (!entry) { entry = { name: srcName, lang: new Map() }; wtBySource.set(r.source_id, entry); }
    let le = entry.lang.get(r.language);
    if (!le) { le = { val: 0, unv: 0 }; entry.lang.set(r.language, le); }
    if (r.is_validated) le.val++; else le.unv++;
  }

  console.log("\nword_translations par source :");
  for (const [sid, e] of wtBySource) {
    console.log(`  ${sid.slice(0, 10)}…  ${e.name.padEnd(45)}`);
    for (const [lang, counts] of e.lang) {
      console.log(`    ${lang}: ${counts.val} validated, ${counts.unv} unvalidated`);
    }
  }

  // FR validées Hikma
  const hikmaFrVal = wtRows.filter(r => r.source_id === hikmaId && r.language === "fr" && r.is_validated);
  console.log(`\n  Hikma FR validated : ${hikmaFrVal.length} entrées`);
  console.log(`  Hikma FR validated distinct word_ids : ${new Set(hikmaFrVal.map(r => r.word_id)).size}`);

  // Doublons (même word_id + même source + même langue)
  const dupKey = new Map<string, number>();
  for (const r of wtRows) {
    const k = `${r.word_id}::${r.source_id}::${r.language}`;
    dupKey.set(k, (dupKey.get(k) ?? 0) + 1);
  }
  const dupCount = [...dupKey].filter(([, c]) => c > 1).length;
  if (dupCount > 0) {
    console.log(`\n  ⚠ Doublons (word_id+source+langue) : ${dupCount}`);
    for (const [k, c] of [...dupKey].filter(([, c]) => c > 1).slice(0, 10)) {
      console.log(`    ${k.split("::")[0].slice(0, 12)}… ×${c}`);
    }
  } else {
    console.log(`\n  ✅ Aucun doublon word_id+source+langue.`);
  }

  // Divergences (même word_id, même langue, sources différentes, textes différents)
  const divergent = new Map<string, Map<string, string>>();
  for (const r of wtRows) {
    const k = `${r.word_id}::${r.language}`;
    let m = divergent.get(k);
    if (!m) { m = new Map(); divergent.set(k, m); }
    m.set(r.source_id, r.text);
  }
  const divCount = [...divergent].filter(([, m]) => m.size > 1 && new Set(m.values()).size > 1).length;
  console.log(`\n  Divergences inter-sources (texte différent) : ${divCount}`);

  // Entrées non-Hikma
  const nonHikma = wtRows.filter(r => r.source_id !== hikmaId);
  console.log(`\n  Entrées NON-Hikma : ${nonHikma.length}`);
  const nonHikmaBySrc = new Map<string, number>();
  for (const r of nonHikma) {
    nonHikmaBySrc.set(r.source_id, (nonHikmaBySrc.get(r.source_id) ?? 0) + 1);
  }
  for (const [sid, c] of nonHikmaBySrc) {
    const s = sourceById.get(sid);
    console.log(`    ${sid.slice(0, 10)}… ${(s?.name ?? "?").padEnd(40)} ${c}`);
  }

  // FR non-Hikma (potentiellement réutilisables)
  const frNonHikma = nonHikma.filter(r => r.language === "fr");
  console.log(`\n  FR non-Hikma total : ${frNonHikma.length}`);
  const frNonHikmaVal = frNonHikma.filter(r => r.is_validated);
  const frNonHikmaUnv = frNonHikma.filter(r => !r.is_validated);
  console.log(`    validées   : ${frNonHikmaVal.length}`);
  console.log(`    non validées : ${frNonHikmaUnv.length}`);

  // ─── 2. AUDIT LEMMA INFRASTRUCTURE ─────────────────────────────────
  console.log("\n━━━ 2. AUDIT LEMMA INFRASTRUCTURE ━━━");

  console.log(`  lemmas : ${lemmaRows.length}`);
  console.log(`  word_lemma_mapping : ${wlmRows.length}`);

  // Mappings par confidence
  const byConf = new Map<string, number>();
  for (const m of wlmRows) {
    byConf.set(m.confidence, (byConf.get(m.confidence) ?? 0) + 1);
  }
  console.log("  confidences :", [...byConf].map(([c, n]) => `${c}=${n}`).join(", "));

  // Combien de word_ids distincts dans wlm ?
  const wlmWordIds = new Set(wlmRows.map(m => m.word_id));
  const wlmLemmaIds = new Set(wlmRows.map(m => m.lemma_id));
  console.log(`  word_ids mappés    : ${wlmWordIds.size}`);
  console.log(`  lemma_ids distincts : ${wlmLemmaIds.size}`);

  // ─── 3. EXPLICATION 188 mappings → 213 formes via lemma ───────────
  console.log("\n━━━ 3. EXPLICATION 188 MAPPINGS → 213 FORMES VIA LEMMA ━━━");

  // quran_words.lemma_id (direct)
  const wordRows = await selectAll<{ id: string; arabic: string; lemma_id: string | null }>(client, "quran_words", "id, arabic, lemma_id");
  const directLemmaCount = wordRows.filter(w => w.lemma_id).length;

  // Mappings effectifs (direct prioritaire)
  const effectiveMapping = new Map<string, string>();
  for (const w of wordRows) {
    if (w.lemma_id) effectiveMapping.set(w.id, w.lemma_id);
  }
  for (const m of wlmRows) {
    if (!effectiveMapping.has(m.word_id)) effectiveMapping.set(m.word_id, m.lemma_id);
  }

  // Formes avec FR via lemme
  const lemmaFrSet = new Set(
    ltRows
      .filter(r => r.language === "fr" && r.is_validated && r.source_id === hikmaId)
      .map(r => r.lemma_id)
  );

  // Comptage exact
  let frViaDirectLemma = 0;
  let frViaWlmLemma = 0;
  for (const w of wordRows) {
    const hikmaFormFr = hikmaFrVal.some(r => r.word_id === w.id);
    if (hikmaFormFr) continue; // déjà couvert par forme
    const lemmaId = effectiveMapping.get(w.id);
    if (lemmaId && lemmaFrSet.has(lemmaId)) {
      if (w.lemma_id && w.lemma_id === lemmaId) frViaDirectLemma++;
      else frViaWlmLemma++;
    }
  }

  console.log(`  quran_words avec lemma_id direct  : ${directLemmaCount}`);
  console.log(`  word_lemma_mapping entries        : ${wlmRows.length}`);
  console.log(`  Formes avec mapping effectif      : ${effectiveMapping.size}`);
  console.log(`  lemma_translations FR val (Hikma) : ${lemmaFrSet.size}`);
  console.log(`  Formes FR via lemme direct        : ${frViaDirectLemma}`);
  console.log(`  Formes FR via WLM mapping         : ${frViaWlmLemma}`);
  console.log(`  Total FR via lemme                : ${frViaDirectLemma + frViaWlmLemma}`);

  // Le chiffre 213 = formes couvertes par lemme FR (incluant peut-être des comptages différents)
  // Calculons avec les word_occurrences
  const occRows = await selectAll<{ word_id: string }>(client, "word_occurrences", "word_id");
  const wordIdsInOccs = new Set(occRows.map(o => o.word_id));
  let lemmaFrInOccs = 0;
  for (const w of wordRows) {
    if (!wordIdsInOccs.has(w.id)) continue;
    if (hikmaFrVal.some(r => r.word_id === w.id)) continue;
    const lemmaId = effectiveMapping.get(w.id);
    if (lemmaId && lemmaFrSet.has(lemmaId)) lemmaFrInOccs++;
  }
  console.log(`  Formes (dans occurrences) FR via lemme : ${lemmaFrInOccs}`);

  // ─── 4. AUDIT DES SOURCES MORPHOLOGIQUES ──────────────────────────
  console.log("\n━━━ 4. SOURCES MORPHOLOGIQUES ━━━");

  // Lister toutes les sources
  console.log("\nSources disponibles :");
  for (const s of sourceRows) {
    console.log(`  ${s.id.slice(0, 10)}…  ${s.name.padEnd(48)} [${s.type}]`);
  }

  // Vérifier si Quran.com API contient des données morphologiques
  // Les quran_words ont-ils des champs lemma/root ?
  const { data: wordSample } = await client.from("quran_words").select("*").limit(5);
  if (wordSample && wordSample.length > 0) {
    const cols = Object.keys(wordSample[0] as object);
    console.log(`\nColonnes quran_words : ${cols.join(", ")}`);
  }

  // Vérifier manuellement les tables connues
  console.log("\nVérification tables linguistiques :");
  for (const t of ["linguistic_occurrences", "linguistic_layer", "word_explanations", "masaq"]) {
    try {
      const { count, error } = await client.from(t).select("*", { count: "exact", head: true });
      if (!error) console.log(`  ${t.padEnd(28)} : ${count?.toLocaleString() ?? "?"} rows`);
      else console.log(`  ${t.padEnd(28)} : ${error.message}`);
    } catch {
      console.log(`  ${t.padEnd(28)} : table absente`);
    }
  }

  // ─── 5. SIMULATION : QUE SE PASSE-T-IL SI ON MAPPE TOUT ? ─────────
  console.log("\n━━━ 5. SIMULATION — POTENTIEL LEMMA-FIRST ━━━");

  // Pour estimer le potentiel : calculer ce que donnerait un mapping complet
  // via stemming arabe léger (déduplication par forme normalisée).
  // Ce n'est PAS un lemme réel — c'est une estimation du nombre de "groupes de formes".

  // Regroupement simple par racine des 3 premières lettres (approximation grossière)
  const byPrefix = new Map<string, number>();
  for (const w of wordRows) {
    const prefix = w.arabic.slice(0, Math.min(3, w.arabic.length));
    byPrefix.set(prefix, (byPrefix.get(prefix) ?? 0) + 1);
  }

  // Groupes de formes apparentées (même texte sans diacritiques partielles)
  const stripTashkeel = (s: string) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
  const byBare = new Map<string, string[]>();
  for (const w of wordRows) {
    const bare = stripTashkeel(w.arabic);
    const arr = byBare.get(bare) ?? [];
    arr.push(w.id);
    byBare.set(bare, arr);
  }

  const groupsWithMultiple = [...byBare].filter(([, ids]) => ids.length > 1);
  const totalClusters = byBare.size;
  const multiFormClusters = groupsWithMultiple.length;
  const formsInMultiClusters = groupsWithMultiple.reduce((sum, [, ids]) => sum + ids.length, 0);

  console.log(`  Total "formes nues" distinctes    : ${totalClusters}`);
  console.log(`  Dont groupes multi-formes         : ${multiFormClusters}`);
  console.log(`  Formes dans groupes multi-formes  : ${formsInMultiClusters}`);
  console.log(`  Économie potentielle (regroupement): ${wordRows.length - totalClusters}`);

  // Estimation : un lemme couvre ~3-5 formes en moyenne dans le Coran
  // (basé sur la morphologie arabe : un verbe peut avoir ~10 formes,
  // un nom ~3-5, une particule ~1)
  const estimatedLemmas = Math.round(totalClusters / 3.5);
  console.log(`\n  Estimation grossière lemmes      : ~${estimatedLemmas}`);

  // ─── 6. TOP 50 FORMES MANQUANTES CROSS-SURAH ──────────────────────
  console.log("\n━━━ 6. TOP 50 FORMES SANS FR (cross-surah) ━━━");

  const wordSurahs = new Map<string, Set<number>>();
  const surahRows = await selectAll<{ id: string; number: number }>(client, "surahs", "id, number");
  const surahByIdInst = new Map(surahRows.map(s => [s.id, s.number]));
  const ayahRowsB = await selectAll<{ id: string; surah_id: string }>(client, "ayahs", "id, surah_id");

  const surahByAyahId = new Map<string, number>();
  for (const a of ayahRowsB) {
    const sn = surahByIdInst.get(a.surah_id);
    if (sn !== undefined) surahByAyahId.set(a.id, sn);
  }

  for (const o of occRows) {
    const sn = surahByAyahId.get(o.word_id); // correction: need to map occurrence to ayah to surah
  }
  // Corrigé : occurrence → ayah
  const occWithAyah = await selectAll<{ word_id: string; ayah_id: string }>(client, "word_occurrences", "word_id, ayah_id");
  for (const o of occWithAyah) {
    const sn = surahByAyahId.get(o.ayah_id);
    if (sn === undefined) continue;
    let set = wordSurahs.get(o.word_id);
    if (!set) { set = new Set(); wordSurahs.set(o.word_id, set); }
    set.add(sn);
  }

  // Formes sans FR
  const withoutFr = wordRows.filter(w => {
    if (hikmaFrVal.some(r => r.word_id === w.id)) return false;
    const lemmaId = effectiveMapping.get(w.id);
    if (lemmaId && lemmaFrSet.has(lemmaId)) return false;
    return true;
  });

  const ranked = withoutFr
    .map(w => {
      const occCount = occWithAyah.filter(o => o.word_id === w.id).length;
      const surahCount = wordSurahs.get(w.id)?.size ?? 0;
      return { word_id: w.id, arabic: w.arabic, surahs: surahCount, occs: occCount };
    })
    .sort((a, b) => b.surahs - a.surahs || b.occs - a.occs);

  console.log(`  Total formes sans FR: ${withoutFr.length}`);
  console.log(`\n  Top 50 :`);
  for (let i = 0; i < Math.min(50, ranked.length); i++) {
    const r = ranked[i];
    console.log(`  ${String(i + 1).padStart(3)}. ${r.arabic.padEnd(28)} ${r.surahs.toString().padStart(3)} surahs, ${r.occs.toString().padStart(5)} occs`);
  }

  // ─── 7. RAPPORT JSON ──────────────────────────────────────────────
  const report = {
    phase: "88D",
    mode: "AUDIT_READ_ONLY",
    timestamp: new Date().toISOString(),
    wordTranslations: {
      total: wtRows.length,
      bySource: [...wtBySource].map(([sid, e]) => ({
        sourceId: sid,
        sourceName: e.name,
        languages: [...e.lang].map(([l, c]) => ({ language: l, validated: c.val, unvalidated: c.unv })),
      })),
      hikmaFrValidated: hikmaFrVal.length,
      hikmaFrValidatedDistinct: new Set(hikmaFrVal.map(r => r.word_id)).size,
      nonHikmaTotal: nonHikma.length,
      nonHikmaFr: frNonHikma.length,
      nonHikmaFrValidated: frNonHikmaVal.length,
      duplicates: dupCount,
      interSourceDivergences: divCount,
    },
    lemmaInfrastructure: {
      lemmasTotal: lemmaRows.length,
      wlmMappingsTotal: wlmRows.length,
      wlmByConfidence: [...byConf].map(([c, n]) => ({ confidence: c, count: n })),
      wlmDistinctWordIds: wlmWordIds.size,
      wlmDistinctLemmaIds: wlmLemmaIds.size,
      directLemmaIdCount: directLemmaCount,
      effectiveMappingsTotal: effectiveMapping.size,
      frViaDirectLemma: frViaDirectLemma,
      frViaWlm: frViaWlmLemma,
      frViaLemmaTotal: frViaDirectLemma + frViaWlmLemma,
    },
    morphologyEstimate: {
      bareFormClusters: totalClusters,
      multiFormClusters,
      formsInMultiClusters,
      potentialEconomy: wordRows.length - totalClusters,
      estimatedLemmas: estimatedLemmas,
    },
    formsWithoutFr: {
      total: withoutFr.length,
      top50: ranked.slice(0, 50).map(r => ({
        word_id: r.word_id,
        arabic: r.arabic,
        surahs: r.surahs,
        occurrences: r.occs,
      })),
    },
  };

  mkdirSync("reports", { recursive: true });
  writeFileSync("reports/phase-88d-lemma-infrastructure-audit.json", JSON.stringify(report, null, 2) + "\n");
  console.log(`\n  Rapport → reports/phase-88d-lemma-infrastructure-audit.json`);
  console.log(`\n=== PHASE 88D — AUDIT TERMINÉ (0 écriture DB) ===`);
}

main().catch(err => {
  console.error("Phase 88D échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});