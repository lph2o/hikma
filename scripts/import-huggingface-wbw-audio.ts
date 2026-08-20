// Phase 22E — import réel de l'audio mot-à-mot Hugging Face, style MUALLIM
// uniquement (zaibihassan/Quranic-Word-By-Word-Audio-Data).
//
// Usage :
//   npm run import:wbw-audio                       → DRY-RUN (aucune écriture)
//   IMPORT=1 npm run import:wbw-audio              → import réel (reprend, idempotent)
//   IMPORT=1 BATCH_LIMIT=100 npm run import:wbw-audio → pilote : 100 nouveaux fichiers max
//   IMPORT=1 USE_CACHE=1 npm run import:wbw-audio  → reprise SANS re-lister HF (cache plan)
//
// Garanties :
//   - MUALLIM uniquement (STYLE=mujawwad → IMPORT_ABORTED, interdit en 22E) ;
//   - mapping EXCLUSIVEMENT positionnel : SURAH + AYAH + WORD_POSITION
//     → word_occurrences → word_id (aucun fuzzy, aucun normalized_text) ;
//   - déduplication par (word_id) → UNE ligne word_audio par forme (recitation unique) ;
//   - jamais ne modifie quran_words / word_occurrences / lemmas / resolver / UI ;
//   - idempotent + reprise : saute les word_id déjà importés ;
//   - compensation : si l'écriture DB échoue après upload, le fichier Storage
//     fraîchement uploadé est supprimé (sinon journalisé comme orphelin) ;
//   - réversible par source : toutes les lignes portent source_id = source HF.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  buildOccurrenceIndex,
  huggingfaceResolveUrl,
  parseWbwFiles,
  planWbwImport,
  type PlannedWbwAudio,
} from "../lib/quran/wbw-plan";

const REPO = "zaibihassan/Quranic-Word-By-Word-Audio-Data";
const TREE = `https://huggingface.co/api/datasets/${REPO}/tree/main`;
const STYLE = "muallim"; // Phase 22E : MUALLIM uniquement.
const SOURCE_NAME = "Hugging Face — Quranic Word By Word Audio Data (zaibihassan)";
const SOURCE_VERSION = "main";
const RECITATION_NAME = "WBW Muallim (Hugging Face zaibihassan)";
const BUCKET = "word-audio";
const PLAN_CACHE = "tmp/phase22e-wbw-plan.json";
const PAGE = 1000;
const LIST_CONCURRENCY = 3;
const UPLOAD_CONCURRENCY = 5;
const DOWNLOAD_ATTEMPTS = 8;

type TreeEntry = { type: string; path: string; size: number; lfs?: { size?: number } };

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {}
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJsonRetry(
  url: string,
  attempt = 0,
): Promise<{ res: Response; data: TreeEntry[] }> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(60_000),
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`HF ${res.status} sur ${url} (abandon)`);
    await sleep(500 * 2 ** attempt + 200);
    return fetchJsonRetry(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HF tree ${res.status} sur ${url}`);
  const data = (await res.json()) as TreeEntry[];
  return { res, data: Array.isArray(data) ? data : [] };
}

async function fetchStyleFiles(style: string): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  const jobs: Array<() => Promise<void>> = [];
  for (let s = 1; s <= 114; s++) {
    jobs.push(async () => {
      const padded = String(s).padStart(3, "0");
      let nextUrl: string | null = `${TREE}/${style}/${padded}`;
      while (nextUrl) {
        const { res, data } = await fetchJsonRetry(nextUrl);
        for (const e of data) {
          if (e.type === "file" && e.path.endsWith(".opus")) {
            sizes.set(e.path, e.lfs?.size ?? e.size);
          }
        }
        nextUrl = null;
        const link = res.headers.get("link");
        const m = link && /<([^>]+)>;\s*rel="next"/.exec(link);
        if (m) nextUrl = m[1];
        await sleep(120);
      }
    });
  }
  let cursor = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = cursor++;
      if (i >= jobs.length) return;
      await jobs[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(LIST_CONCURRENCY, jobs.length) }, worker));
  return sizes;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("env Supabase manquant");
  const client = createClient(url, serviceRole, { auth: { persistSession: false } });
  const dryRun = process.env.IMPORT !== "1";
  const batchLimit = Number(process.env.BATCH_LIMIT ?? "0") || 0;
  const useCache = process.env.USE_CACHE === "1";

  if (process.env.STYLE && process.env.STYLE !== STYLE) {
    console.error("IMPORT_ABORTED — Phase 22E autorise uniquement le style MUALLIM.");
    process.exit(2);
  }

  async function all<T>(table: string, select: string): Promise<T[]> {
    const out: T[] = [];
    let from = 0;
    for (;;) {
      const { data, error } = await client
        .from(table)
        .select(select)
        .order("id")
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`${table}: ${error.message}`);
      out.push(...((data ?? []) as T[]));
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
    return out;
  }

  // ── Planification (listing HF + mapping) ou reprise depuis cache ─────────
  let planRows: PlannedWbwAudio[];
  if (useCache && existsSync(PLAN_CACHE)) {
    planRows = JSON.parse(readFileSync(PLAN_CACHE, "utf8")) as PlannedWbwAudio[];
    console.log(`plan chargé depuis cache : ${planRows.length} lignes`);
  } else {
    const sizes = await fetchStyleFiles(STYLE);
    const surahs = await all<{ id: string; number: number }>("surahs", "id, number");
    const ayahs = await all<{ id: string; surah_id: string; ayah_number: number }>(
      "ayahs",
      "id, surah_id, ayah_number",
    );
    const occurrences = await all<{ ayah_id: string; position: number; word_id: string }>(
      "word_occurrences",
      "ayah_id, position, word_id",
    );
    const index = buildOccurrenceIndex(surahs, ayahs, occurrences);
    const parsed = parseWbwFiles([...sizes.keys()]);
    const plan = planWbwImport(parsed.entries, index);

    const totalBytes = plan.rows.reduce(
      (sum, r) => sum + (sizes.get(r.source_path) ?? 0),
      0,
    );
    console.log(`fichiers listés (${STYLE}) : ${sizes.size}`);
    console.log(`lignes word_audio planifiées : ${plan.rows.length}`);
    console.log(`taille totale dédupliquée   : ${(totalBytes / 1024 / 1024).toFixed(1)} Mo`);
    console.log(`fichiers sans occurrence    : ${plan.unmapped_files.length}`);
    console.log(`clés dupliquées             : ${plan.duplicate_keys.length}`);
    planRows = plan.rows;
    writeFileSync(PLAN_CACHE, JSON.stringify(plan.rows));
    console.log(`plan mis en cache : ${PLAN_CACHE}`);
  }

  if (dryRun) {
    console.log("\nDRY-RUN — aucune écriture, aucun upload, aucune table modifiée.");
    return;
  }

  // ── Provenance + récitation + bucket (idempotents) ───────────────────────
  const { data: srcRows } = await client
    .from("sources")
    .select("id")
    .eq("name", SOURCE_NAME)
    .eq("version", SOURCE_VERSION)
    .limit(1);
  let sourceId = (srcRows?.[0] as { id: string } | undefined)?.id;
  if (!sourceId) {
    const { data: createdSrc, error: srcErr } = await client
      .from("sources")
      .insert({
        name: SOURCE_NAME,
        type: "word_audio",
        url: `https://huggingface.co/datasets/${REPO}`,
        version: SOURCE_VERSION,
        license: "Apache-2.0 (déclaré) — LEGAL_STATUS REVIEW_REQUIRED (provenance des enregistrements non divulguée)",
        metadata: {
          provider: "Hugging Face",
          dataset: REPO,
          style: "Muallim",
          provenance_status: "REVIEW_REQUIRED",
          owner_decision: "RISK_ACCEPTED",
          decision_date: "2026-08-15",
        },
      })
      .select("id")
      .single();
    if (srcErr) throw new Error(`sources insert: ${srcErr.message}`);
    sourceId = (createdSrc as { id: string }).id;
    console.log(`source créée : ${SOURCE_NAME}`);
  }

  const { data: recRows } = await client
    .from("recitations")
    .select("id")
    .eq("name", RECITATION_NAME)
    .limit(1);
  let recitationId = (recRows?.[0] as { id: string } | undefined)?.id;
  if (!recitationId) {
    const { data: createdRec, error: recErr } = await client
      .from("recitations")
      .insert({ name: RECITATION_NAME, style: STYLE, source_id: sourceId })
      .select("id")
      .single();
    if (recErr) throw new Error(`recitations insert: ${recErr.message}`);
    recitationId = (createdRec as { id: string }).id;
    console.log(`récitation créée : ${RECITATION_NAME}`);
  }

  const { data: buckets, error: bucketsErr } = await client.storage.listBuckets();
  if (bucketsErr) throw new Error(`listBuckets: ${bucketsErr.message}`);
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error: createErr } = await client.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["audio/opus", "audio/ogg", "application/octet-stream"],
    });
    if (createErr) throw new Error(`createBucket: ${createErr.message}`);
    console.log(`bucket créé : ${BUCKET} (privé)`);
  }

  // ── Reprise : sauter les word_id déjà importés ───────────────────────────
  const existing = await all<{ word_id: string }>("word_audio", "word_id");
  const importedSet = new Set(existing.map((r) => r.word_id));
  const pending = planRows.filter((r) => !importedSet.has(r.word_id));
  const toProcess = batchLimit > 0 ? pending.slice(0, batchLimit) : pending;
  console.log(
    `déjà importés : ${importedSet.size} · restants : ${pending.length} · à traiter ce run : ${toProcess.length}`,
  );

  // ── Import streaming (concurrence contrôlée + retry + compensation) ──────
  let uploaded = 0;
  let inserted = 0;
  let retries = 0;
  let importedBytes = 0;
  const failed: string[] = [];
  const orphans: string[] = [];

  let cursor = 0;
  async function uploadWorker(): Promise<void> {
    for (;;) {
      const i = cursor++;
      if (i >= toProcess.length) return;
      const row = toProcess[i];
      const storagePath = `${STYLE}/${row.word_id}.opus`;
      try {
        let res: Response | null = null;
        for (let attempt = 0; attempt < DOWNLOAD_ATTEMPTS; attempt++) {
          res = await fetch(huggingfaceResolveUrl(row.source_path));
          if (res.status === 429 || res.status >= 500) {
            retries++;
            await sleep(Math.min(10_000, 800 * 2 ** attempt) + 300);
            continue;
          }
          break;
        }
        if (!res || !res.ok) throw new Error(`download ${res?.status ?? "?"}`);
        const bytes = await res.arrayBuffer();
        if (bytes.byteLength === 0) throw new Error("fichier vide");
        const contentType = res.headers.get("content-type") ?? "audio/opus";
        if (!/audio|octet-stream/.test(contentType)) {
          throw new Error(`type inattendu ${contentType}`);
        }

        const { error: upErr } = await client.storage
          .from(BUCKET)
          .upload(storagePath, bytes, { upsert: true, contentType: "audio/opus" });
        if (upErr) throw new Error(`upload: ${upErr.message}`);

        const { error: insErr } = await client.from("word_audio").upsert(
          {
            word_id: row.word_id,
            recitation_id: recitationId,
            source_id: sourceId,
            audio_url: storagePath,
          },
          { onConflict: "word_id,recitation_id", ignoreDuplicates: true },
        );
        if (insErr) {
          const { error: delErr } = await client.storage.from(BUCKET).remove([storagePath]);
          if (delErr) orphans.push(`${storagePath} (${delErr.message})`);
          throw new Error(`word_audio: ${insErr.message}`);
        }

        uploaded++;
        inserted++;
        importedBytes += bytes.byteLength;
        if (inserted % 500 === 0) {
          console.log(`  … ${inserted} traités ce run · ${(importedBytes / 1024 / 1024).toFixed(1)} Mo`);
        }
      } catch (err) {
        failed.push(`${row.source_path}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(UPLOAD_CONCURRENCY, Math.max(toProcess.length, 1)) }, uploadWorker),
  );

  const summary = {
    status: failed.length ? "PARTIAL_IMPORT" : "IMPORT_COMPLETE",
    style: STYLE,
    plan_rows: planRows.length,
    processed_this_run: toProcess.length,
    uploaded,
    inserted,
    skipped_existing: importedSet.size,
    retries,
    imported_bytes: importedBytes,
    failed_count: failed.length,
    failed_sample: failed.slice(0, 100),
    orphan_files: orphans,
  };
  console.log("\n=== RÉSUMÉ IMPORT ===");
  console.log(JSON.stringify(summary, null, 2));
  writeFileSync(
    "tmp/phase22e-wbw-muallim-import-summary.json",
    JSON.stringify(summary, null, 2),
  );
}

main().catch((err) => {
  console.error("Échec :", err instanceof Error ? err.message : err);
  process.exit(1);
});
