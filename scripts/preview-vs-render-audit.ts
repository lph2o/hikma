// Hikma — AUDIT COMPARATIF Preview vs Render : mêmes scènes effectives ?
// Construit les scènes EXACTEMENT comme page.tsx (preview) et render.ts (MP4)
// pour le même item, puis affiche un tableau de divergence.
// Usage : npx tsx scripts/preview-vs-render-audit.ts [contentKey]
// Aucune écriture DB.

import { ContentRegistryService } from "../lib/content-studio/registry";
import { getContentStudioDbClient } from "../lib/content-studio/client";
import { createClient } from "@supabase/supabase-js";
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

  if (!item) {
    console.error("Aucun item trouvé.");
    process.exit(1);
  }

  const payloadAny = item.payload as {
    sources?: { ayahId?: string | null };
    firstOccurrence?: { surahNumber?: number; ayahNumber?: number; globalAyahNumber?: number | null };
  } | null;

  // --- Preview (page.tsx) : client anon + session (createClient) ---
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const previewAudio = await resolveContentStudioAudio(anonClient, {
    wordId: item.wordId,
    ayahId: payloadAny?.sources?.ayahId,
    globalAyahNumber: payloadAny?.firstOccurrence?.globalAyahNumber,
    surahNumber: payloadAny?.firstOccurrence?.surahNumber,
    ayahNumber: payloadAny?.firstOccurrence?.ayahNumber,
  });

  // --- Render (render.ts) : client service role ---
  const srClient = getContentStudioDbClient();
  const renderAudio = await resolveContentStudioAudio(srClient, {
    wordId: item.wordId,
    ayahId: payloadAny?.sources?.ayahId,
    globalAyahNumber: payloadAny?.firstOccurrence?.globalAyahNumber,
    surahNumber: payloadAny?.firstOccurrence?.surahNumber,
    ayahNumber: payloadAny?.firstOccurrence?.ayahNumber,
  });

  const previewData = toVideoSceneData(buildContent(item, previewAudio));
  const renderData = toVideoSceneData(buildContent(item, renderAudio));
  const previewScenes = resolveEffectiveSceneData(buildContent(item, previewAudio), item.editorState as never).scenes;
  const renderScenes = resolveEffectiveSceneData(buildContent(item, renderAudio), item.editorState as never).scenes;

  const fmt = (s: typeof renderScenes[number] | undefined) => {
    if (!s) return "(absente)";
    return JSON.stringify({
      kind: s.kind,
      durationInFrames: s.durationInFrames,
      audioUrl: s.audioUrl ? (s.audioUrl.includes("cdn.islamic.network") ? "CDN-verse" : s.audioUrl.includes("supabase") || s.audioUrl.includes("storage") ? "STORAGE-word" : s.audioUrl.slice(0, 40)) : null,
      audioDuration: s.audioDuration,
      audioStartFrom: s.audioStartFrom,
      audioVolume: s.audioVolume,
      audioMuted: s.audioMuted,
      verseConfig: s.verseConfig ? { mode: s.verseConfig.mode, followerEnabled: s.verseConfig.follower?.enabled, wordCount: s.verseConfig.follower?.words?.length ?? null } : null,
    });
  };

  console.log(`Item : ${item.contentKey.slice(0, 16)}… · ${item.templateKey} · wordId ${item.wordId}`);
  console.log(`editor_state : ${item.editorState ? (Array.isArray((item.editorState as { scenes?: unknown }).scenes) ? `${((item.editorState as { scenes: unknown[] }).scenes).length} scènes` : "objet sans scenes") : "null"}`);
  console.log("");
  console.log("=== AUDIO RÉSOLU ===");
  console.log(`PREVIEW word: ${previewAudio.wordAudioUrl ? "ok" : "null"} (${previewAudio.wordAudioDuration}s)  verse: ${previewAudio.verseAudioUrl ? "ok" : "null"} (${previewAudio.verseAudioDuration}s)`);
  console.log(`RENDER  word: ${renderAudio.wordAudioUrl ? "ok" : "null"} (${renderAudio.wordAudioDuration}s)  verse: ${renderAudio.verseAudioUrl ? "ok" : "null"} (${renderAudio.verseAudioDuration}s)`);
  console.log("");
  console.log("=== SCÈNES EFFECTIVES ===");
  const max = Math.max(previewScenes.length, renderScenes.length);
  for (let i = 0; i < max; i++) {
    const p = previewScenes[i];
    const r = renderScenes[i];
    const pj = fmt(p);
    const rj = fmt(r);
    const same = pj === rj;
    console.log(`[${i}] ${same ? "IDENTIQUE" : "⚠️ DIFFÉRENT"}`);
    console.log(`    PREVIEW : ${pj}`);
    if (!same) console.log(`    RENDER  : ${rj}`);
  }
  console.log("");
  console.log(`PREVIEW durée totale : ${previewScenes.reduce((a, s) => a + s.durationInFrames, 0)} frames @ ${previewData.fps}`);
  console.log(`RENDER  durée totale : ${renderScenes.reduce((a, s) => a + s.durationInFrames, 0)} frames @ ${renderData.fps}`);
  const quranP = previewScenes.find((s) => s.kind === "quran");
  const quranR = renderScenes.find((s) => s.kind === "quran");
  console.log(`Scène Coran PREVIEW : ${quranP?.durationInFrames} frames (${((quranP?.durationInFrames ?? 0) / 30).toFixed(2)} s)`);
  console.log(`Scène Coran RENDER  : ${quranR?.durationInFrames} frames (${((quranR?.durationInFrames ?? 0) / 30).toFixed(2)} s)`);
}

main().catch((err) => {
  console.error("AUDIT_ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
