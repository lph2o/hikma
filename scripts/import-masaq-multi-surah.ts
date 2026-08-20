// Hikma — Phase 27 : import contrôlé MASAQ multi-sourates (108 / 112 / 113 / 114).
//
// Usage :
//   npx tsx scripts/import-masaq-multi-surah.ts            → DRY-RUN (aucune écriture)
//   APPLY=1 npx tsx scripts/import-masaq-multi-surah.ts    → import réel (idempotent)
//   SURAH=108,112 APPLY=1 npx tsx ...                      → sous-ensemble explicite
//
// Périmètre : couche linguistique isolée (linguistic_occurrences +
// linguistic_segments) UNIQUEMENT. Réutilise les tables créées en 24F. Aucune
// racine, aucun schème, aucune glose FR, aucune modification de quran_words /
// word_occurrences / lemmas / word_translations / lemma_translations /
// word_lemma_mapping / translations / curriculum / runtime / grading / SRS.
//
// Alignement OBLIGATOIRE : (surah, ayah, position) — jamais la chaîne arabe.
// Garde-fou : refuse MISSING / EXTRA / AMBIGUOUS (IMPORT_BLOCKED sinon).
// Idempotence : UNIQUE(source_id, source_record_id). RUN 2 → 0 insert, N doublons.
//
// Segments : les marqueurs i3rab vides MASAQ (Morph_Type="Other_i3rab" /
// Morph_Tag="None") sont exclus par buildImportPlan (non conformes au CHECK
// 'Prefix'/'Stem'/'Suffix' ET artefacts sans forme réelle — AVAILABLE ≠ INFERABLE).

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertPlanScope,
  buildImportPlan,
  type HikmaOccurrenceInput,
} from "../lib/linguistic/masaq-plan";

const APPLY = process.env.APPLY === "1";
const TARGET_SURAHS = (process.env.SURAH ?? "108,112,113,114")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);

// Checksum SHA-256 vérifié Phase 24D (ne JAMAIS remplacer par une valeur inventée).
const EXPECTED_SHA256 =
  "777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900";

const SOURCE_ROW = {
  name: "MASAQ",
  type: "linguistic",
  version: "v2",
  url: "https://doi.org/10.17632/9yvrzxktmr.2",
  license: "CC BY 3.0 (page) / CC BY 4.0 (DataCite)",
  metadata: {
    doi: "10.17632/9yvrzxktmr.2",
    attribution:
      "MASAQ — Majdi Sawalha, University of Jordan (2024), Mendeley Data, DOI 10.17632/9yvrzxktmr.2",
    checksum_sha256: EXPECTED_SHA256,
    file: "tmp/MASAQ.csv",
  },
};

// Nombre d'occurrences MASAQ attendu par sourate (Phase 26 : 68/68 au total).
const EXPECTED_OCCURRENCES: Record<number, number> = {
  108: 10,
  112: 15,
  113: 23,
  114: 20,
};

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

async function count(client: SupabaseClient, table: string): Promise<number> {
  const { count: c } = await client.from(table).select("id", { count: "exact", head: true });
  return c ?? 0;
}

async function resolveSource(client: SupabaseClient, mode: string): Promise<{ id: string; created: boolean }> {
  const { data } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_ROW.name)
    .eq("version", SOURCE_ROW.version)
    .limit(1);
  const existing = (data as Array<{ id: string }> | null)?.[0];
  if (existing) return { id: existing.id, created: false };
  if (mode !== "APPLY") return { id: "(would-create)", created: false };

  const { data: ins, error } = await client
    .from("sources")
    .insert({ ...SOURCE_ROW, retrieved_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      const { data: again } = await client
        .from("sources")
        .select("id")
        .eq("name", SOURCE_ROW.name)
        .eq("version", SOURCE_ROW.version)
        .limit(1);
      const race = (again as Array<{ id: string }> | null)?.[0];
      if (race) return { id: race.id, created: false };
    }
    throw new Error(`sources : ${error.message}`);
  }
  return { id: (ins as { id: string }).id, created: true };
}

async function fetchHikmaForSurah(
  client: SupabaseClient,
  surah: number,
): Promise<HikmaOccurrenceInput[]> {
  const { data: occRows, error } = await client
    .from("word_occurrences")
    .select(
      `id, position, text, word_id,
       quran_words!inner(id, arabic, lemma_id),
       ayahs!inner(id, ayah_number, surahs!inner(number))`,
    )
    .eq("ayahs.surahs.number", surah)
    .order("position");
  if (error) throw error;

  const rows = (occRows ?? []) as unknown as Array<{
    id: string;
    position: number;
    text: string;
    word_id: string;
    quran_words: { id: string; arabic: string; lemma_id: string | null };
    ayahs: { id: string; ayah_number: number; surahs: { number: number } };
  }>;

  const lemmaIds = [...new Set(rows.map((o) => o.quran_words.lemma_id).filter(Boolean))];
  const lemmaBy = new Map<string, string>();
  if (lemmaIds.length > 0) {
    const { data: lemmaRows } = await client.from("lemmas").select("id, arabic").in("id", lemmaIds);
    for (const l of (lemmaRows ?? []) as Array<{ id: string; arabic: string }>) {
      lemmaBy.set(l.id, l.arabic);
    }
  }

  return rows.map((o) => ({
    surah: o.ayahs.surahs.number,
    ayah: o.ayahs.ayah_number,
    position: o.position,
    text: o.text,
    wordOccurrenceId: o.id,
    quranWordId: o.quran_words.id,
    lemmaId: o.quran_words.lemma_id ?? null,
    lemmaArabic: o.quran_words.lemma_id ? (lemmaBy.get(o.quran_words.lemma_id) ?? null) : null,
  }));
}

async function applyImport(
  client: SupabaseClient,
  sourceId: string,
  plan: ReturnType<typeof buildImportPlan>,
): Promise<{ inserted: number; duplicates: number; errors: number; segmentsInserted: number }> {
  const existingRows = await client
    .from("linguistic_occurrences")
    .select("source_record_id")
    .eq("source_id", sourceId);
  const existing = new Set((existingRows.data ?? []).map((r) => r.source_record_id));

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;
  let segmentsInserted = 0;

  for (const o of plan.occurrences) {
    if (existing.has(o.source_record_id)) {
      duplicates += 1;
      continue;
    }
    const { data: occ, error: occErr } = await client
      .from("linguistic_occurrences")
      .insert({
        word_occurrence_id: o.wordOccurrenceId,
        source_id: sourceId,
        source_record_id: o.source_record_id,
        surah_number: o.surah,
        ayah_number: o.ayah,
        position: o.position,
        alignment_status: o.alignment_status,
        masaq_word: o.masaq_word,
        masaq_stem: o.masaq_stem,
        masaq_gloss_en: o.masaq_gloss_en,
        hikma_lemma_id: o.lemmaId,
        lemma_mapping_status: o.lemma_mapping_status,
        pos: o.masaq_pos,
        case_mood: o.masaq_case_mood,
        syntactic_roles: o.masaq_syntax,
      })
      .select("id")
      .single();
    if (occErr) {
      if (occErr.code === "23505") {
        duplicates += 1;
        continue;
      }
      errors += 1;
      console.error(`  ✗ occurrence ${o.source_record_id} : ${occErr.message}`);
      continue;
    }
    const occurrenceId = (occ as { id: string }).id;

    for (const seg of o.segments) {
      const { error: segErr } = await client.from("linguistic_segments").insert({
        linguistic_occurrence_id: occurrenceId,
        segment_no: seg.segment_no,
        segment_text: seg.segment_text,
        morph_type: seg.morph_type,
        morph_tag: seg.morph_tag,
        segment_kind: seg.segment_kind,
      });
      if (segErr) {
        errors += 1;
        console.error(`  ✗ segment ${o.source_record_id}/${seg.segment_no} : ${segErr.message}`);
      } else {
        segmentsInserted += 1;
      }
    }
    inserted += 1;
  }

  return { inserted, duplicates, errors, segmentsInserted };
}

async function fetchFatihahCounts(
  client: SupabaseClient,
): Promise<Record<string, number>> {
  // Al-Fātiḥah : 8 leçons / 26 formes / 29 occurrences / 26 audios (référence verrouillée).
  const { data: surahs } = await client.from("surahs").select("id").eq("number", 1).limit(1);
  const surahId = (surahs as Array<{ id: string }> | null)?.[0]?.id;
  let lessons = 0;
  if (surahId) {
    const { data: paths } = await client.from("learning_paths").select("id").eq("surah_id", surahId);
    const pathIds = (paths ?? []).map((p) => p.id as string);
    if (pathIds.length > 0) {
      const { data: units } = await client.from("units").select("id").in("path_id", pathIds);
      const unitIds = (units ?? []).map((u) => u.id as string);
      if (unitIds.length > 0) {
        const { count: c } = await client
          .from("lessons")
          .select("id", { count: "exact", head: true })
          .in("unit_id", unitIds);
        lessons = c ?? 0;
      }
    }
  }

  const { data: occs, error: occErr } = await client
    .from("word_occurrences")
    .select("id, word_id, ayahs!inner(id, surahs!inner(number))")
    .eq("ayahs.surahs.number", 1);
  if (occErr) throw occErr;
  const rows = (occs ?? []) as Array<{ id: string; word_id: string }>;
  const wordIds = [...new Set(rows.map((o) => o.word_id))];

  const { data: audioRows } = await client.from("word_audio").select("word_id").in("word_id", wordIds);
  const audio = new Set((audioRows ?? []).map((a) => a.word_id)).size;

  const { data: glossRows } = await client
    .from("word_translations")
    .select("word_id")
    .in("word_id", wordIds)
    .eq("language", "fr")
    .eq("is_validated", true);
  const glosses = new Set((glossRows ?? []).map((g) => g.word_id)).size;

  return {
    lessons,
    forms: wordIds.length,
    occurrences: rows.length,
    audio,
    word_glosses_fr: glosses,
  };
}

async function captureCoreCounters(client: SupabaseClient): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of [
    "quran_words",
    "word_occurrences",
    "ayahs",
    "translations",
    "lemmas",
    "word_translations",
    "lemma_translations",
    "word_lemma_mapping",
    "linguistic_occurrences",
    "linguistic_segments",
    "linguistic_lemmas",
    "linguistic_roots",
  ]) {
    out[t] = await count(client, t);
  }
  return out;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.");
  }
  const client = createClient(url, service, { auth: { persistSession: false } });
  const mode = APPLY ? "APPLY" : "DRY-RUN";
  console.log(`=== PHASE 27 — IMPORT MASAQ MULTI-SOURATES ${TARGET_SURAHS.join(",")} (${mode}) ===`);

  // 1. Checksum.
  const csvPath = "tmp/MASAQ.csv";
  const csvBuffer = readFileSync(csvPath);
  const sha256 = createHash("sha256").update(csvBuffer).digest("hex");
  if (sha256 !== EXPECTED_SHA256) {
    throw new Error(`STOP — checksum MASAQ invalide : ${sha256} (attendu ${EXPECTED_SHA256}).`);
  }
  console.log(`✅ checksum MASAQ vérifié (${sha256.slice(0, 8)}…)`);
  const csvText = csvBuffer.toString("utf8");

  // 2. Snapshot AVANT toute écriture.
  const beforeCounters = await captureCoreCounters(client);
  const beforeFatihah = await fetchFatihahCounts(client);

  // 3. Construire et valider le plan par sourate.
  const plans = new Map<number, ReturnType<typeof buildImportPlan>>();
  const planStats: Record<number, ReturnType<typeof assertPlanScope>> = {};
  for (const surah of TARGET_SURAHS) {
    const hikma = await fetchHikmaForSurah(client, surah);
    const plan = buildImportPlan(hikma, csvText, { surah });
    const stats = assertPlanScope(plan, surah);
    plans.set(surah, plan);
    planStats[surah] = stats;
    const expected = EXPECTED_OCCURRENCES[surah];
    if (expected != null && stats.aligned !== expected) {
      throw new Error(
        `STOP — sourate ${surah} : ${stats.aligned} alignées (attendu ${expected}).`,
      );
    }
    console.log(
      `Plan sourate ${surah} : ${stats.aligned}/${stats.hikmaOccurrences} alignées · ` +
        `EXACT=${stats.exact} ORTHO=${stats.exactOrthographic} VARIANT=${stats.variantOrthographyDocumented} ` +
        `MISSING=${stats.missing.length} EXTRA=${stats.extra.length} AMBIGUOUS=${stats.ambiguous} · ` +
        `segments=${stats.segmentCount}`,
    );
  }

  const totalAligned = [...plans.values()].reduce((n, p) => n + p.occurrences.length, 0);
  const totalSegments = [...plans.values()].reduce((n, p) => n + p.stats.segmentCount, 0);

  const baseReport = {
    phase: "27",
    mode,
    target_surahs: TARGET_SURAHS,
    source: { ...SOURCE_ROW, sha256 },
    per_surah: Object.fromEntries(
      [...plans.entries()].map(([surah, plan]) => [
        surah,
        {
          hikma_occurrences: plan.stats.hikmaOccurrences,
          masaq_words: plan.stats.masaqWords,
          aligned: plan.stats.aligned,
          exact: plan.stats.exact,
          exact_orthographic: plan.stats.exactOrthographic,
          variant_orthography_documented: plan.stats.variantOrthographyDocumented,
          ambiguous: plan.stats.ambiguous,
          missing: plan.stats.missing.length,
          extra: plan.stats.extra.length,
          segments: plan.stats.segmentCount,
          roots: plan.stats.roots,
          schemes: plan.stats.schemes,
        },
      ]),
    ),
    total: { aligned: totalAligned, segments: totalSegments, roots: 0, schemes: 0 },
    pattern: "FUTURE_WORK",
  };

  if (!APPLY) {
    writeFileSync(
      "tmp/phase27-multi-surah-linguistic-pedagogical.json",
      JSON.stringify(
        { ...baseReport, dry_run: true, database_writes: 0, before: { counters: beforeCounters, fatihah: beforeFatihah } },
        null,
        2,
      ) + "\n",
      "utf8",
    );
    console.log("\nDRY-RUN terminé : aucune écriture DB. Relancer avec APPLY=1 pour importer.");
    return;
  }

  // 4. Source de provenance (réutilisée pour toutes les sourates).
  const source = await resolveSource(client, mode);
  console.log(`Source MASAQ : ${source.id} ${source.created ? "(créée)" : "(existante)"}`);

  // 5. Import idempotent, sourate par sourate.
  const importResults: Record<number, unknown> = {};
  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;
  let totalSegmentsInserted = 0;
  for (const surah of TARGET_SURAHS) {
    const result = await applyImport(client, source.id, plans.get(surah)!);
    importResults[surah] = result;
    totalInserted += result.inserted;
    totalDuplicates += result.duplicates;
    totalErrors += result.errors;
    totalSegmentsInserted += result.segmentsInserted;
    console.log(
      `Sourate ${surah} : INSERTED=${result.inserted} DUPLICATES=${result.duplicates} ` +
        `ERRORS=${result.errors} SEGMENTS=${result.segmentsInserted}`,
    );
  }

  // 6. Post-validation.
  const afterCounters = await captureCoreCounters(client);
  const { data: lingRows } = await client
    .from("linguistic_occurrences")
    .select("surah_number")
    .eq("source_id", source.id);
  const perSurahDb = new Map<number, number>();
  for (const r of (lingRows ?? []) as Array<{ surah_number: number }>) {
    perSurahDb.set(r.surah_number, (perSurahDb.get(r.surah_number) ?? 0) + 1);
  }
  const perSurahValidation: Record<number, boolean> = {};
  for (const [surah, expected] of Object.entries(EXPECTED_OCCURRENCES)) {
    perSurahValidation[Number(surah)] = perSurahDb.get(Number(surah)) === expected;
  }
  perSurahValidation[1] = perSurahDb.get(1) === 29; // Fātiḥah inchangée.

  const post = {
    linguistic_occurrences: afterCounters.linguistic_occurrences,
    linguistic_segments: afterCounters.linguistic_segments,
    linguistic_lemmas: afterCounters.linguistic_lemmas,
    linguistic_roots: afterCounters.linguistic_roots,
    per_surah: Object.fromEntries([...perSurahDb.entries()].sort((a, b) => a[0] - b[0])),
    per_surah_expected_ok: perSurahValidation,
    fatihah_occurrences_unchanged: perSurahDb.get(1) === 29,
  };

  // 7. Non-régression.
  const afterFatihah = await fetchFatihahCounts(client);
  const nonRegression = {
    fatihah_unchanged: JSON.stringify(beforeFatihah) === JSON.stringify(afterFatihah),
    core_unchanged:
      JSON.stringify(pick(beforeCounters, ["quran_words", "word_occurrences", "ayahs", "translations", "lemmas", "word_translations", "lemma_translations", "word_lemma_mapping"])) ===
      JSON.stringify(pick(afterCounters, ["quran_words", "word_occurrences", "ayahs", "translations", "lemmas", "word_translations", "lemma_translations", "word_lemma_mapping"])),
    before: { counters: beforeCounters, fatihah: beforeFatihah },
    after: { counters: afterCounters, fatihah: afterFatihah },
  };

  const report = {
    ...baseReport,
    import: { total: { inserted: totalInserted, duplicates: totalDuplicates, errors: totalErrors, segmentsInserted: totalSegmentsInserted }, per_surah: importResults },
    post_validation: post,
    non_regression: nonRegression,
    provenance: {
      source_name: SOURCE_ROW.name,
      source_version: SOURCE_ROW.version,
      source_doi: SOURCE_ROW.metadata.doi,
      license: SOURCE_ROW.license,
      attribution: SOURCE_ROW.metadata.attribution,
      checksum: sha256,
    },
  };
  writeFileSync(
    "tmp/phase27-multi-surah-linguistic-pedagogical.json",
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );
  console.log("\n=== RAPPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

function pick(obj: Record<string, number>, keys: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}

main().catch((err) => {
  console.error("Phase 27 échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});
