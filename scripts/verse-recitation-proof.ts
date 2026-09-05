// Hikma — PREUVE RÉELLE : récitation du verset dans le rendu MP4.
//
// Pipeline identique à la route de rendu :
//   payload Content API → resolveContentStudioAudio (durées EXACTES MP3/Opus)
//   → toVideoSceneData → bundle Remotion → renderMedia → MP4
// puis VÉRIFICATION ffprobe :
//   - piste audio présente (AAC) ;
//   - durée de la piste audio ≈ durée de la scène Coran (jamais de coupure) ;
//   - durée totale vidéo ≈ somme des scènes.
//
// Usage : npx tsx scripts/verse-recitation-proof.ts [wordId] [out.mp4]
// Aucune écriture DB. Le MP4 est un EXPORT local de preuve.

import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { ContentStudioService } from "../lib/content-api/service";
import { getContentStudioClient } from "../lib/content-api/client";
import { getContentStudioDbClient } from "../lib/content-studio/client";
import {
  buildVideoContentFromReveal,
  toVideoSceneData,
} from "../lib/content-studio/video/pipeline";
import { resolveContentStudioAudio } from "../lib/content-studio/audio";
import { COMPOSITION_ID, VIDEO_FPS } from "../remotion/Root";

const execFileAsync = promisify(execFile);

function loadEnvFiles(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      (process as { loadEnvFile?: (path?: string) => void }).loadEnvFile?.(file);
    } catch {
      // Fichier absent : ignoré.
    }
  }
}

async function ffprobeStreams(file: string): Promise<{
  video: { duration: number; width: number; height: number };
  audio: { duration: number; codec: string; channels: number } | null;
}> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_type,codec_name,duration,width,height,channels",
    "-of", "json",
    file,
  ]);
  const parsed = JSON.parse(stdout) as { streams?: Array<Record<string, unknown>> };
  let video = { duration: 0, width: 0, height: 0 };
  let audio: { duration: number; codec: string; channels: number } | null = null;
  for (const s of parsed.streams ?? []) {
    if (s.codec_type === "video") {
      video = {
        duration: Number(s.duration) || 0,
        width: Number(s.width) || 0,
        height: Number(s.height) || 0,
      };
    } else if (s.codec_type === "audio") {
      audio = {
        duration: Number(s.duration) || 0,
        codec: String(s.codec_name || ""),
        channels: Number(s.channels) || 0,
      };
    }
  }
  return { video, audio };
}

async function main(): Promise<void> {
  loadEnvFiles();
  const wordId = process.argv[2] ?? "fc581cb3-8d05-410f-9373-a428c8d17e57"; // يَوْمَ
  const outputArg = process.argv[3];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("DB non configurée (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY requis).");
  }

  const service = new ContentStudioService(getContentStudioClient());
  const outcome = await service.buildReveal(wordId);
  if (outcome.status === "REJECTED") {
    throw new Error(`REJECTED ${outcome.code}: ${outcome.message}`);
  }
  const payload = outcome.payload;

  // Résolution audio EXACTE (même chemin que renderEffectiveVideoToFile :
  // ayahId → global_ayah_number → URL CDN ; la durée est mesurée par scan MPEG).
  const audio = await resolveContentStudioAudio(getContentStudioDbClient(), {
    wordId,
    ayahId: payload.sources.ayahId ?? null,
    surahNumber: payload.firstOccurrence.surahNumber,
    ayahNumber: payload.firstOccurrence.ayahNumber,
  });

  const content = buildVideoContentFromReveal(payload, audio);
  const sceneData = toVideoSceneData(content);

  const quranScene = sceneData.scenes.find((s) => s.kind === "quran");
  const wordScene = sceneData.scenes.find((s) => s.kind === "word");

  console.log(`📖 Mot : ${payload.word.arabic} (${payload.word.transliteration})`);
  console.log(`   Première occurrence : Sourate ${payload.firstOccurrence.surahNumber} · verset ${payload.firstOccurrence.ayahNumber}`);
  console.log(`🎙️ Audio du verset : ${audio.verseAudioUrl}`);
  console.log(`   Durée RÉELLE du verset : ${audio.verseAudioDuration?.toFixed(2)} s`);
  console.log(`   Scène Coran : ${quranScene?.durationInFrames} frames (${((quranScene?.durationInFrames ?? 0) / VIDEO_FPS).toFixed(2)} s)`);
  console.log(`🎙️ Audio du mot : ${audio.wordAudioUrl ? "présent" : "absent"}`);
  console.log(`   Durée RÉELLE du mot : ${audio.wordAudioDuration?.toFixed(2)} s`);
  console.log(`   Scène Mot : ${wordScene?.durationInFrames} frames (${((wordScene?.durationInFrames ?? 0) / VIDEO_FPS).toFixed(2)} s)`);
  console.log(`   Scènes : ${sceneData.scenes.map((s) => s.kind).join(" → ")}`);
  console.log(`   Durée totale : ${sceneData.durationInFrames} frames (${(sceneData.durationInFrames / VIDEO_FPS).toFixed(2)} s)`);

  const entryPoint = join(process.cwd(), "remotion", "index.ts");
  console.log("📦 Bundle Remotion…");
  const serveUrl = await bundle({ entryPoint, onProgress: () => {} });

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: { scenes: sceneData.scenes },
  });

  const outputLocation = outputArg ?? join(process.cwd(), "out", "verse-recitation-proof.mp4");
  console.log("🎥 Rendu MP4…");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps: { scenes: sceneData.scenes },
  });

  // VÉRIFICATION ffprobe
  const { video, audio: mp4Audio } = await ffprobeStreams(outputLocation);
  console.log("");
  console.log("=== VÉRIFICATION ffprobe du MP4 ===");
  console.log(`VIDEO : ${video.width}×${video.height}, durée ${video.duration.toFixed(2)} s`);
  console.log(`AUDIO : ${mp4Audio ? `${mp4Audio.codec} ${mp4Audio.channels} canaux, durée ${mp4Audio.duration.toFixed(2)} s` : "ABSENT ❌"}`);

  const totalExpected = sceneData.durationInFrames / VIDEO_FPS;
  const verseReal = audio.verseAudioDuration ?? 0;
  const quranFrames = (quranScene?.durationInFrames ?? 0) / VIDEO_FPS;
  const audioOk = mp4Audio && mp4Audio.duration >= verseReal * 0.98;
  const quranSceneOk = quranFrames >= verseReal * 0.98;

  console.log("");
  console.log(`VERSE_AUDIO_URL = ${audio.verseAudioUrl}`);
  console.log(`VERSE_REAL_DURATION = ${verseReal.toFixed(2)} s`);
  console.log(`QURAN_SCENE_DURATION = ${quranFrames.toFixed(2)} s`);
  console.log(`QURAN_SCENE_COVERS_AUDIO = ${quranSceneOk ? "PASS ✓" : "FAIL ❌"}`);
  console.log(`MP4_AUDIO_TRACK_PRESENT = ${mp4Audio ? "PASS ✓" : "FAIL ❌"}`);
  console.log(`MP4_AUDIO_DURATION_COVERS_VERSE = ${audioOk ? "PASS ✓" : "FAIL ❌"}`);
  console.log(`MP4_TOTAL_DURATION = ${video.duration.toFixed(2)} s (attendu ~${totalExpected.toFixed(2)} s)`);
  console.log(`PROOF = ${quranSceneOk && audioOk && mp4Audio ? "VERSE_RECITATION_ALIGNED" : "VERSE_RECITATION_MISALIGNED"}`);
  console.log(`OUTPUT = ${outputLocation}`);
}

main().catch((err) => {
  console.error("PROOF_ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
});
