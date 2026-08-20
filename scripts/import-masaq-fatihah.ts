// Hikma — Phase 24G : import contrôlé MASAQ (Al-Fātiḥah UNIQUEMENT).
//
// Usage :
//   npx tsx scripts/import-masaq-fatihah.ts          → DRY-RUN (aucune écriture DB)
//   APPLY=1 npx tsx scripts/import-masaq-fatihah.ts  → import réel (idempotent)
//
// Périmètre STRICT : sourate 1 uniquement (29 occurrences), couche linguistique
// isolée (linguistic_occurrences + linguistic_segments). Aucune racine, aucun
// schème, aucune glose FR, aucune modification de quran_words / word_occurrences /
// lemmas / word_translations / lemma_translations / word_lemma_mapping /
// translations / curriculum / runtime.
//
// Idempotence : UNIQUE(source_id, source_record_id) + vérification explicite
// avant insertion. RUN 2 → INSERTED=0, DUPLICATES=29, ERRORS=0.
//
// Provenance : source `sources` (name=MASAQ, type=linguistic, version=v2),
// DOI 10.17632/9yvrzxktmr.2, CC BY (3.0 page / 4.0 DataCite), checksum vérifié.
//
// Pré-requis : migration 0028_linguistic_layer.sql appliquée (tables créées).

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  assertPlanScope,
  buildImportPlan,
  type HikmaOccurrenceInput,
} from "../lib/linguistic/masaq-plan";

const APPLY = process.env.APPLY === "1";

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

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

type OccRow = {
  id: string;
  position: number;
  text: string;
  word_id: string;
  quran_words: { id: string; arabic: string; lemma_id: string | null };
  ayahs: { id: string; ayah_number: number; surahs: { number: number } };
};

async function count(client: SupabaseClient, table: string): Promise<number> {
  try {
    const { count: c } = await client
      .from(table)
      .select("id", { count: "exact", head: true });
    return c ?? 0;
  } catch {
    // Table absente (ex. linguistic_* avant migration) → 0.
    return 0;
  }
}

async function captureSnapshot(client: SupabaseClient): Promise<Record<string, unknown>> {
  const core: Record<string, number> = {};
  for (const t of [
    "quran_words",
    "word_occurrences",
    "ayahs",
    "translations",
    "lemmas",
    "word_translations",
    "lemma_translations",
    "word_lemma_mapping",
  ]) {
    core[t] = await count(client, t);
  }

  // ---- Al-Fātiḥah (occurrences déjà chargées dans le script principal) ----
  // Rempli par l'appelant via `attachFatihahCounts` pour éviter un second chargement.
  const linguistic: Record<string, number> = {};
  for (const t of [
    "linguistic_occurrences",
    "linguistic_segments",
    "linguistic_lemmas",
    "linguistic_roots",
  ]) {
    linguistic[t] = await count(client, t);
  }

  return { core, linguistic };
}

interface FatihahCounts {
  lessons: number;
  forms: number;
  occurrences: number;
  audio: number;
  word_glosses_fr: number;
  lemma_mappings: number;
  translations_rows: number;
  translators: number;
}

async function fetchFatihahCounts(
  client: SupabaseClient,
  occRows: Array<{
    id: string;
    word_id: string;
    ayah_id: string;
  }>,
): Promise<FatihahCounts> {
  const wordIds = [...new Set(occRows.map((o) => o.word_id))];
  const ayahIds = [...new Set(occRows.map((o) => o.ayah_id))];

  // Lessons du parcours Al-Fātiḥah (learning_paths.surah_id → units → lessons).
  const { data: surahs } = await client
    .from("surahs")
    .select("id")
    .eq("number", 1)
    .limit(1);
  const surahId = (surahs as Array<{ id: string }> | null)?.[0]?.id;
  let lessons = 0;
  if (surahId) {
    const { data: paths } = await client
      .from("learning_paths")
      .select("id")
      .eq("surah_id", surahId);
    const pathIds = (paths ?? []).map((p) => p.id as string);
    if (pathIds.length > 0) {
      const { data: units } = await client.from("units").select("id").in("path_id", pathIds);
      const unitIds = (units ?? []).map((u) => u.id as string);
      if (unitIds.length > 0) {
        const { count: lessonCount } = await client
          .from("lessons")
          .select("id", { count: "exact", head: true })
          .in("unit_id", unitIds);
        lessons = lessonCount ?? 0;
      }
    }
  }

  // Audio (word_audio) pour les formes d'Al-Fātiḥah.
  const { data: audioRows } = await client
    .from("word_audio")
    .select("word_id")
    .in("word_id", wordIds);
  const audio = new Set((audioRows ?? []).map((a) => a.word_id)).size;

  // Gloses FR (word_translations validées) pour les formes d'Al-Fātiḥah.
  const { data: glossRows } = await client
    .from("word_translations")
    .select("word_id")
    .in("word_id", wordIds)
    .eq("language", "fr")
    .eq("is_validated", true);
  const wordGlossesFr = new Set((glossRows ?? []).map((g) => g.word_id)).size;

  // Mappings de lemme pour les formes d'Al-Fātiḥah.
  const { data: mapRows } = await client
    .from("word_lemma_mapping")
    .select("word_id")
    .in("word_id", wordIds);
  const lemmaMappings = new Set((mapRows ?? []).map((m) => m.word_id)).size;

  // Traductions des versets d'Al-Fātiḥah (4 traducteurs).
  const { data: trRows } = await client
    .from("translations")
    .select("translator")
    .in("ayah_id", ayahIds);
  const translators = new Set((trRows ?? []).map((t) => t.translator)).size;

  return {
    lessons,
    forms: wordIds.length,
    occurrences: occRows.length,
    audio,
    word_glosses_fr: wordGlossesFr,
    lemma_mappings: lemmaMappings,
    translations_rows: (trRows ?? []).length,
    translators,
  };
}

async function resolveSource(
  client: SupabaseClient,
  mode: string,
): Promise<{ id: string; created: boolean }> {
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

async function postValidate(
  client: SupabaseClient,
  sourceId: string,
  hikmaIds: Set<string>,
): Promise<Record<string, unknown>> {
  const { data: occs } = await client
    .from("linguistic_occurrences")
    .select("id, word_occurrence_id, surah_number, ayah_number, position")
    .eq("source_id", sourceId);
  const rows = occs ?? [];

  const { data: segs } = await client
    .from("linguistic_segments")
    .select("id, linguistic_occurrence_id");

  const nonSurah1 = rows.filter((r) => r.surah_number !== 1).length;
  const danglingWordOccurrence = rows.filter((r) => !hikmaIds.has(String(r.word_occurrence_id))).length;
  const surahs = rows.map((r) => r.surah_number as number);
  const minSurah = surahs.length ? Math.min(...surahs) : null;
  const maxSurah = surahs.length ? Math.max(...surahs) : null;

  return {
    linguistic_occurrences: rows.length,
    linguistic_segments: (segs ?? []).length,
    linguistic_lemmas: await count(client, "linguistic_lemmas"),
    linguistic_roots: await count(client, "linguistic_roots"),
    surah_1_only: nonSurah1 === 0,
    min_surah: minSurah,
    max_surah: maxSurah,
    non_surah_1_count: nonSurah1,
    word_occurrence_id_all_valid: danglingWordOccurrence === 0,
    dangling_word_occurrence: danglingWordOccurrence,
  };
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
  console.log(`=== PHASE 24G — IMPORT MASAQ AL-FĀTIḤAH (${mode}) ===`);

  // 1. Source + checksum.
  const csvPath = "tmp/MASAQ.csv";
  const csvBuffer = readFileSync(csvPath);
  const sha256 = createHash("sha256").update(csvBuffer).digest("hex");
  if (sha256 !== EXPECTED_SHA256) {
    throw new Error(
      `STOP — checksum MASAQ invalide : ${sha256} (attendu ${EXPECTED_SHA256}). Aucun import.`,
    );
  }
  console.log(`✅ checksum MASAQ vérifié (${sha256.slice(0, 8)}…)`);
  const csvText = csvBuffer.toString("utf8");

  // 2. Côté Hikma (read-only) : 29 occurrences Al-Fātiḥah + lemmes.
  const { data: occRows, error: occErr } = await client
    .from("word_occurrences")
    .select(
      `id, position, text, word_id,
       quran_words!inner(id, arabic, lemma_id),
       ayahs!inner(id, ayah_number, surahs!inner(number))`,
    )
    .eq("ayahs.surahs.number", 1)
    .order("position");
  if (occErr) throw occErr;
  const rows = occRows as unknown as OccRow[];

  const lemmaIds = [
    ...new Set(rows.map((o) => o.quran_words.lemma_id).filter(Boolean)),
  ];
  const lemmaBy = new Map<string, string>();
  if (lemmaIds.length > 0) {
    const { data: lemmaRows } = await client.from("lemmas").select("id, arabic").in("id", lemmaIds);
    for (const l of (lemmaRows ?? []) as Array<{ id: string; arabic: string }>) {
      lemmaBy.set(l.id, l.arabic);
    }
  }

  const hikma: HikmaOccurrenceInput[] = rows.map((o) => ({
    surah: o.ayahs.surahs.number,
    ayah: o.ayahs.ayah_number,
    position: o.position,
    text: o.text,
    wordOccurrenceId: o.id,
    quranWordId: o.quran_words.id,
    lemmaId: o.quran_words.lemma_id ?? null,
    lemmaArabic: o.quran_words.lemma_id ? (lemmaBy.get(o.quran_words.lemma_id) ?? null) : null,
  }));
  console.log(`Hikma occurrences Al-Fātiḥah : ${hikma.length}`);

  // 3. Plan + garde-fou de périmètre.
  const plan = buildImportPlan(hikma, csvText, { surah: 1 });
  const stats = assertPlanScope(plan, 1);
  console.log(
    `Plan : ${stats.aligned}/${stats.hikmaOccurrences} alignées · EXACT=${stats.exact} ` +
      `ORTHO=${stats.exactOrthographic} VARIANT=${stats.variantOrthographyDocumented} ` +
      `MISSING=${stats.missing.length} EXTRA=${stats.extra.length} AMBIGUOUS=${stats.ambiguous}`,
  );

  // 4. Snapshot AVANT toute écriture (non-régression).
  const fatihah = await fetchFatihahCounts(
    client,
    rows.map((o) => ({ id: o.id, word_id: o.word_id, ayah_id: o.ayahs.id })),
  );
  const snapshotCore = await captureSnapshot(client);
  const preSnapshot = {
    phase: "24G",
    stage: "PRE-IMPORT SNAPSHOT (aucune écriture)",
    mode,
    counters: snapshotCore.core,
    linguistic: snapshotCore.linguistic,
    fatihah,
    fatihah_reference_locked: true,
  };
  // Capturé UNE SEULE fois (avant le premier import) — jamais écrasé par les
  // relances idempotentes, afin de préserver l'état réel « avant import ».
  const snapshotPath = "tmp/phase24g-pre-import-snapshot.json";
  if (!existsSync(snapshotPath)) {
    writeFileSync(snapshotPath, JSON.stringify(preSnapshot, null, 2) + "\n", "utf8");
  }

  // 5. Source de provenance.
  const source = await resolveSource(client, mode);
  console.log(`Source MASAQ : ${source.id} ${source.created ? "(créée)" : "(existante)"}`);

  // 6. Rapport.
  const baseReport = {
    phase: "24G",
    mode,
    source: {
      ...SOURCE_ROW,
      sha256,
      id: source.id,
    },
    alignment: {
      hikma_occurrences: stats.hikmaOccurrences,
      masaq_words: stats.masaqWords,
      aligned: stats.aligned,
      exact: stats.exact,
      exact_orthographic: stats.exactOrthographic,
      variant_orthography_documented: stats.variantOrthographyDocumented,
      ambiguous: stats.ambiguous,
      missing: stats.missing.length,
      extra: stats.extra.length,
    },
    scope: {
      surah: 1,
      min_surah: stats.minSurah,
      max_surah: stats.maxSurah,
      roots: stats.roots,
      schemes: stats.schemes,
      pattern: "FUTURE_WORK",
    },
    coverage: {
      pos_distinct_tags: stats.distinctPosTags,
      segments: stats.segmentCount,
    },
  };

  if (!APPLY) {
    writeFileSync(
      "tmp/phase24g-masaq-import.json",
      JSON.stringify({ ...baseReport, dry_run: true, database_writes: 0 }, null, 2) + "\n",
      "utf8",
    );
    console.log("\nDRY-RUN terminé : aucune écriture DB. Relancer avec APPLY=1 pour importer.");
    return;
  }

  // 7. Import idempotent.
  const result = await applyImport(client, source.id, plan);
  console.log(
    `Import : INSERTED=${result.inserted} DUPLICATES=${result.duplicates} ` +
      `ERRORS=${result.errors} SEGMENTS=${result.segmentsInserted}`,
  );

  // 8. Validation post-import.
  const hikmaIds = new Set(hikma.map((h) => h.wordOccurrenceId as string));
  const post = await postValidate(client, source.id, hikmaIds);

  // 9. Non-régression (re-snapshot).
  const afterCore = await captureSnapshot(client);
  const afterFatihah = await fetchFatihahCounts(
    client,
    rows.map((o) => ({ id: o.id, word_id: o.word_id, ayah_id: o.ayahs.id })),
  );
  const nonRegression = {
    core_unchanged:
      JSON.stringify(afterCore.core) === JSON.stringify(snapshotCore.core),
    fatihah_unchanged: JSON.stringify(afterFatihah) === JSON.stringify(fatihah),
    before: { core: snapshotCore.core, fatihah },
    after: { core: afterCore.core, fatihah: afterFatihah },
  };

  const report = {
    ...baseReport,
    import: result,
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
  writeFileSync("tmp/phase24g-masaq-import.json", JSON.stringify(report, null, 2) + "\n", "utf8");
  writeFileSync(
    "tmp/phase24g-post-import-validation.json",
    JSON.stringify(post, null, 2) + "\n",
    "utf8",
  );
  console.log("\n=== RAPPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Phase 24G échouée :", err instanceof Error ? err.message : err);
  process.exit(1);
});
