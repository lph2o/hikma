// Hikma — Génère out/preview-audit/scenes.json : scènes EFFECTIVES réelles
// (même construction que page.tsx) pour la page Player d'audit navigateur.
// Usage : npx tsx scripts/preview-audit-scenes.ts [contentKey]

import { mkdir, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { ContentRegistryService } from "../lib/content-studio/registry";
import { getContentStudioDbClient } from "../lib/content-studio/client";
import {
  buildVideoContentFromQuiz,
  buildVideoContentFromReveal,
  buildVideoContentFromDeepDive,
  buildVideoContentFromFrequencyFact,
  buildVideoContentFromSurahHighlight,
  toVideoSceneData,
} from "../lib/content-studio/video/pipeline";
import { resolveEffectiveSceneData } from "../lib/content-studio/editor/state";
import { resolveContentStudioAudio } from "../lib/content-studio/audio";
import type { ContentStudioItem } from "../lib/content-studio/types";

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // absent
    }
  }
}

function buildContent(item: ContentStudioItem, audio?: unknown) {
  const payload = item.payload as never;
  switch (item.templateKey) {
    case "WORD_QUIZ_V1": return buildVideoContentFromQuiz(payload, audio as never);
    case "VERSE_DEEP_DIVE_V1": return buildVideoContentFromDeepDive(payload, audio as never);
    case "FREQUENCY_FACT_V1": return buildVideoContentFromFrequencyFact(payload, audio as never);
    case "SURAH_HIGHLIGHT_V1": return buildVideoContentFromSurahHighlight(payload, audio as never);
    default: return buildVideoContentFromReveal(payload, audio as never);
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const registry = new ContentRegistryService(getContentStudioDbClient());
  const contentKey = process.argv[2];
  const item = contentKey
    ? await registry.getByContentKey(contentKey)
    : (await registry.list({ limit: 20 })).items[0];
  if (!item) throw new Error("Aucun item.");

  const payloadAny = item.payload as {
    sources?: { ayahId?: string | null };
    firstOccurrence?: { surahNumber?: number; ayahNumber?: number; globalAyahNumber?: number | null };
  } | null;

  // Même résolution audio que page.tsx (Preview).
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const audio = await resolveContentStudioAudio(anonClient, {
    wordId: item.wordId,
    ayahId: payloadAny?.sources?.ayahId,
    globalAyahNumber: payloadAny?.firstOccurrence?.globalAyahNumber,
    surahNumber: payloadAny?.firstOccurrence?.surahNumber,
    ayahNumber: payloadAny?.firstOccurrence?.ayahNumber,
  });

  const content = buildContent(item, audio);
  const data = toVideoSceneData(content);
  const { scenes } = resolveEffectiveSceneData(content, item.editorState as never);

  await mkdir("out/preview-audit", { recursive: true });
  await writeFile(
    "out/preview-audit/scenes.json",
    JSON.stringify({ scenes, fps: data.fps, width: data.width, height: data.height, contentKey: item.contentKey }, null, 2),
  );
  const quran = scenes.find((s) => s.kind === "quran");
  console.log(`Scènes écrites : ${scenes.map((s) => s.kind).join(" → ")}`);
  console.log(`Durée totale : ${scenes.reduce((a, s) => a + s.durationInFrames, 0)} frames`);
  console.log(`Scène Coran : ${quran?.durationInFrames} frames · audio ${quran?.audioDuration}s · ${quran?.audioUrl?.includes("cdn.islamic.network") ? "CDN verse" : quran?.audioUrl ? "autre" : "AUCUN"}`);
  console.log(`Verse audio URL : ${quran?.audioUrl}`);
}

main().catch((err) => {
  console.error("GEN_ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
