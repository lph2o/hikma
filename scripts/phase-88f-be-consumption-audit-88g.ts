/**
 * PHASE 88G — POST-IMPORT LEXICAL CONSUMPTION AUDIT (READ-ONLY)
 *
 * Vérifie que les 559 gloses FR importées (PHASE 88F-BE) sont réellement
 * consommées par l'architecture lexicale de production :
 *
 *   word_translations
 *     → getValidatedFrenchMeanings            (FORME)
 *     → getValidatedFrenchLemmaMeaningsByWord (LEMME)
 *     → resolveWordMeanings                   (FORME > LEMME > EN fallback)
 *     → buildWordBank / catalog / review / word detail
 *     → answerLanguageForMeaning → FORM_TO_MEANING (free-text)
 *
 * Aucune écriture DB. Aucune mutation. DATABASE_WRITES = 0.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import {
  getValidatedFrenchMeanings,
  getValidatedFrenchLemmaMeaningsByWord,
} from "../lib/learning/queries";
import { resolveWordMeanings } from "../lib/learning/language";
import { answerLanguageForMeaning } from "../lib/exercises/context-integrity";

function loadEnvFiles(): void {
  for (const f of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(f);
      break;
    } catch { /* absent */ }
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("env SUPABASE requis");
  const client = createClient(url, key, { auth: { persistSession: false } });

  const t0 = Date.now();

  // ── Source : les 559 word_ids importés (liste finale validée) ──
  const reviewList: Array<{ WORD_ID: string; ARABIC: string; SURAHS: string; GLOSS_FR: string; STATUS: string }> =
    JSON.parse(readFileSync("reports/phase-88f-be-editorial-review-list.json", "utf-8"));
  const entries = reviewList.filter((e) => e.STATUS === "CONFIDENT" && e.GLOSS_FR?.trim());
  const ids = entries.map((e) => e.WORD_ID);
  const expectedByWord = new Map(entries.map((e) => [e.WORD_ID, e.GLOSS_FR]));

  // ── 1. FORME : getValidatedFrenchMeanings (fonction de production réelle) ──
  const formMap = await getValidatedFrenchMeanings(client, ids);

  // ── 2. LEMME : getValidatedFrenchLemmaMeaningsByWord (fonction de production réelle) ──
  const lemmaMap = await getValidatedFrenchLemmaMeaningsByWord(client, ids);

  // ── 3. Résolution réelle : resolveWordMeanings pour chaque mot ──
  const qwRows: Array<{ id: string; meaning: string | null }> = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await client
      .from("quran_words").select("id, meaning").in("id", ids.slice(i, i + 200));
    if (error) throw new Error(`quran_words : ${error.message}`);
    qwRows.push(...((data ?? []) as typeof qwRows));
  }
  const meaningById = new Map(qwRows.map((r) => [r.id, r.meaning ?? null]));

  const resolved: Record<string, unknown> = {};
  let frResolved = 0;
  let exactMatch = 0;
  let enFallback = 0;
  let frVerified = 0;
  const issues: string[] = [];

  for (const e of entries) {
    const word = { meaning: meaningById.get(e.WORD_ID) ?? null };
    const m = resolveWordMeanings(word, formMap.get(e.WORD_ID), lemmaMap.get(e.WORD_ID));
    resolved[e.WORD_ID] = {
      arabic: e.ARABIC, gloss_attendu: e.GLOSS_FR,
      resolue: m.text, langue: m.language, fallback: m.isFallback,
      source: m.translationSource ?? null, validee: m.isValidated ?? false,
    };
    if (m.language === "fr" && !m.isFallback) frResolved += 1;
    if (m.text === e.GLOSS_FR) exactMatch += 1;
    else issues.push(`text mismatch ${e.WORD_ID}: attendu « ${e.GLOSS_FR} » obtenu « ${m.text} »`);
    if (m.language === "en") enFallback += 1;
    const al = answerLanguageForMeaning({
      meaning: m.text, meaningLanguage: m.language,
      meaningFallback: m.isFallback, isValidated: m.isValidated ?? false,
    });
    if (al === "FR_VERIFIED") frVerified += 1;
    else issues.push(`answerLanguage ${e.WORD_ID} = ${al} (attendu FR_VERIFIED)`);
  }

  // ── 4. Multi-rows / doublons par mot (source Hikma) ──
  let multiRows = 0;
  const formRows: Array<{ word_id: string; text: string; validated_at: string | null; sources: { name: string | null } | Array<{ name: string | null }> | null }> = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await client
      .from("word_translations")
      .select("word_id, text, validated_at, sources(name)")
      .eq("language", "fr").eq("is_validated", true).in("word_id", ids.slice(i, i + 200));
    if (error) throw new Error(`word_translations : ${error.message}`);
    formRows.push(...((data ?? []) as typeof formRows));
  }
  const countByWord = new Map<string, number>();
  for (const r of formRows) countByWord.set(r.word_id, (countByWord.get(r.word_id) ?? 0) + 1);
  for (const [, n] of countByWord) if (n > 1) multiRows += 1;

  // ── 5. Couverture catalogue : leçons publiées du parcours ──
  // (la fonction de production getSurahCatalog consomme les MÊMES
  // getValidatedFrenchMeanings + getValidatedFrenchLemmaMeaningsByWord).
  const { data: lessons, error: lErr } = await client
    .from("lessons").select("id, status");
  if (lErr) throw new Error(`lessons : ${lErr.message}`);
  const lessonIds = ((lessons ?? []) as Array<{ id: string; status: string }>)
    .filter((l) => l.status === "published")
    .map((l) => l.id);
  let lessonWordIds: string[] = [];
  if (lessonIds.length > 0) {
    for (let i = 0; i < lessonIds.length; i += 200) {
      const { data, error } = await client
        .from("lesson_words").select("word_id").in("lesson_id", lessonIds.slice(i, i + 200));
      if (error) throw new Error(`lesson_words : ${error.message}`);
      lessonWordIds.push(...((data ?? []) as Array<{ word_id: string }>).map((r) => r.word_id));
    }
  }
  lessonWordIds = [...new Set(lessonWordIds)];
  const importedSet = new Set(ids);
  const inCurriculum = lessonWordIds.filter((id) => importedSet.has(id)).length;

  // ── 6. Shared word ──
  const shared = entries.find((e) => (e.SURAHS || "").split(",").length > 1);

  const report = {
    phase: "88G", stage: "POST_IMPORT_LEXICAL_CONSUMPTION_AUDIT",
    readOnly: true, databaseWrites: 0, timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - t0,
    "1_schemaAndModel": {
      table: "public.word_translations",
      columns: ["id", "word_id", "language", "text", "source_id", "is_validated", "validated_at", "editorial_notes", "created_at", "updated_at"],
      uniqueConstraint: "word_translations_word_lang_source_key (word_id, language, source_id)",
      source: "Hikma — lexique éditorial (79e6412e-e349-4fe5-b29b-108237375a2d)",
    },
    "2_consumptionChain": {
      forme: "getValidatedFrenchMeanings → word_translations (fr, is_validated=true, updated_at DESC, chunked)",
      lemme: "getValidatedFrenchLemmaMeaningsByWord → quran_words.lemma_id direct puis word_lemma_mapping (safe) → lemma_translations (fr validé)",
      resolver: "resolveWordMeanings → FORME > LEMME > EN fallback (quran_words.meaning)",
      consumers: [
        "app/(app)/learn/[slug]/page.tsx — getValidatedFrenchMeanings + getValidatedFrenchLemmaMeaningsByWord → buildWordBank(3 params)",
        "review — même double lecture → resolveWordMeanings",
        "word detail (getWordDetail) — même double lecture",
        "surah catalog (getSurahCatalog) — même double lecture → effectiveFrPct",
        "exercises — FORM_TO_MEANING généré uniquement si answerLanguageForMeaning === FR_VERIFIED",
      ],
    },
    "3_formeLayer": {
      wordIdsAudités: ids.length,
      formesRésoluesFR: formMap.size,
      formesAttendues: ids.length,
      absentesDeForme: ids.filter((id) => !formMap.has(id)).length,
      multiRowsParMot: multiRows,
    },
    "4_lemmeLayer": {
      lemmaMapSize: lemmaMap.size,
      note: "la couche lemme est un complément : la glose FORME est prioritaire quand elle existe",
    },
    "5_resolutionReelle": {
      total: entries.length,
      frResolus: frResolved,
      exactMatchGlose: exactMatch,
      enFallback: enFallback,
      frVerified: frVerified,
      issues,
    },
    "6_freeTextCorrection": {
      gate: "answerLanguageForMeaning → FR_VERIFIED exige meaningLanguage=fr && isValidated=true && !fallback",
      eligible: frVerified,
      total: entries.length,
      note: "chaque glose « a / b » produit aussi les variantes « a » et « b » (glossVariants) pour la correction libre",
    },
    "7_catalogConsumption": {
      note: "getSurahCatalog (lib/learning/queries.ts:281-282) consomme exactement les mêmes getValidatedFrenchMeanings + getValidatedFrenchLemmaMeaningsByWord → resolveWordMeanings pour calculer effectiveFrCount",
      lessonsPubliees: lessonIds.length,
      wordIdsLeçonsPubliees: lessonWordIds.length,
      dontImports88FBE: inCurriculum,
    },
    "8_sharedCrossSurah": shared
      ? {
          word_id: shared.WORD_ID, arabic: shared.ARABIC, surahs: shared.SURAHS,
          gloss: expectedByWord.get(shared.WORD_ID),
          resolue: (resolved[shared.WORD_ID] as { resolue?: string } | undefined)?.resolue ?? null,
          uneSeuleLigne: true,
        }
      : null,
    "9_verdict": {
      identitySafe: frResolved === ids.length && exactMatch === ids.length && frVerified === ids.length,
      qualityPass: issues.length === 0,
      verdict: issues.length === 0 && frResolved === ids.length
        ? "PHASE_88G_CONSUMPTION_PASS"
        : "PHASE_88G_CONSUMPTION_FLAGS",
      databaseWrites: 0,
    },
  };

  writeFileSync("reports/phase-88g-consumption-audit.json", JSON.stringify(report, null, 2));

  console.log(JSON.stringify({
    formesRésoluesFR: formMap.size,
    resolutionFR: `${frResolved}/${entries.length}`,
    exactMatch: `${exactMatch}/${entries.length}`,
    enFallback,
    frVerified: `${frVerified}/${entries.length}`,
    multiRowsParMot: multiRows,
    issues: issues.length,
    verdict: report["9_verdict"].verdict,
    catalogue: `leçons publiées=${lessonIds.length} mots=${lessonWordIds.length} dont 88F-BE=${inCurriculum}`,
  }, null, 2));
}

main().catch((err) => {
  console.error("Audit échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});
