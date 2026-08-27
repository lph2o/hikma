// Hikma — Content Studio : RÉSOLUTION DES PISTES AUDIO (Phase Audio Fix).
//
// Deux sources audio réelles et officielles :
//   1. Audio du mot : Bucket Storage privé 'word-audio' (Muallim) via getWordAudioState
//      (génère une URL signée avec TTL de 3600 secondes).
//   2. Audio du verset : CDN Al Quran Cloud (cdn.islamic.network) via getAyahAudioUrl
//      (utilise global_ayah_number du verset, récitation Al-Afasy 128kbps CBR).
//
// Aucune donnée inventée, aucun fallback audio simulé, aucune écriture DB.

import https from "node:https";
import http from "node:http";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getWordAudioState } from "@/lib/learning/queries";
import { getAyahAudioUrl } from "@/lib/quran/ayah-audio";

export type ContentStudioAudio = {
  wordAudioUrl: string | null;
  verseAudioUrl: string | null;
  wordAudioDuration?: number | null; // durée réelle en secondes
  verseAudioDuration?: number | null; // durée réelle en secondes
};

export type ContentStudioAudioParams = {
  wordId: string;
  ayahId?: string | null;
  globalAyahNumber?: number | null;
  surahNumber?: number | null;
  ayahNumber?: number | null;
};

/**
 * Calcule la durée réelle d'un fichier audio (en secondes) via requête HEAD :
 * - Récitation Coran Al-Afasy CDN : MP3 CBR 128 kbps => duration = bytes * 8 / 128000
 * - Prononciation Muallim Storage : Opus ~48 kbps => duration = bytes * 8 / 48000
 */
export async function getRemoteAudioDurationInSeconds(url: string): Promise<number | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const clientModule = parsed.protocol === "https:" ? https : http;
      const req = clientModule.request(
        url,
        { method: "HEAD", timeout: 4000 },
        (res) => {
          const cl = res.headers["content-length"];
          if (cl) {
            const bytes = parseInt(cl, 10);
            if (Number.isFinite(bytes) && bytes > 0) {
              if (url.includes("cdn.islamic.network") || url.endsWith(".mp3")) {
                const sec = (bytes * 8) / 128000;
                return resolve(Math.round(sec * 100) / 100);
              }
              if (url.includes("word-audio") || url.endsWith(".opus")) {
                const sec = (bytes * 8) / 48000;
                return resolve(Math.round(sec * 100) / 100);
              }
              const sec = (bytes * 8) / 128000;
              return resolve(Math.round(sec * 100) / 100);
            }
          }
          resolve(null);
        },
      );
      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
      req.end();
    } catch {
      resolve(null);
    }
  });
}

/**
 * Résout les URLs audio réelles et leurs durées exactes pour un contenu vidéo :
 * - wordAudioUrl + wordAudioDuration : URL signée et durée du mot
 * - verseAudioUrl + verseAudioDuration : URL CDN et durée du verset
 */
export async function resolveContentStudioAudio(
  client: SupabaseClient,
  params: ContentStudioAudioParams,
): Promise<ContentStudioAudio> {
  let wordAudioUrl: string | null = null;
  let verseAudioUrl: string | null = null;
  let wordAudioDuration: number | null = null;
  let verseAudioDuration: number | null = null;

  // 1. Audio du mot (word_audio -> URL signée Storage)
  if (params.wordId) {
    try {
      const state = await getWordAudioState(client, [params.wordId]);
      wordAudioUrl = state.urls.get(params.wordId) ?? null;
      if (wordAudioUrl) {
        wordAudioDuration = await getRemoteAudioDurationInSeconds(wordAudioUrl);
      }
    } catch (err) {
      console.error(
        `[content-studio-audio] Erreur résolution word_audio word_id=${params.wordId}:`,
        err,
      );
    }
  }

  // 2. Audio du verset (ayahs -> global_ayah_number -> URL CDN Al-Afasy)
  let resolvedGlobalAyah: number | null = null;

  if (
    typeof params.globalAyahNumber === "number" &&
    params.globalAyahNumber >= 1 &&
    params.globalAyahNumber <= 6236
  ) {
    resolvedGlobalAyah = params.globalAyahNumber;
  } else if (params.ayahId) {
    try {
      const { data, error } = await client
        .from("ayahs")
        .select("global_ayah_number")
        .eq("id", params.ayahId)
        .maybeSingle();

      if (!error && data) {
        const num = (data as { global_ayah_number?: number | null }).global_ayah_number;
        if (typeof num === "number" && num >= 1 && num <= 6236) {
          resolvedGlobalAyah = num;
        }
      }
    } catch (err) {
      console.error(
        `[content-studio-audio] Erreur résolution ayah_audio ayah_id=${params.ayahId}:`,
        err,
      );
    }
  } else if (
    typeof params.surahNumber === "number" &&
    typeof params.ayahNumber === "number"
  ) {
    try {
      const { data, error } = await client
        .from("ayahs")
        .select("global_ayah_number, surah:surahs!inner(number)")
        .eq("surah.number", params.surahNumber)
        .eq("ayah_number", params.ayahNumber)
        .maybeSingle();

      if (!error && data) {
        const num = (data as { global_ayah_number?: number | null }).global_ayah_number;
        if (typeof num === "number" && num >= 1 && num <= 6236) {
          resolvedGlobalAyah = num;
        }
      }
    } catch (err) {
      console.error(
        `[content-studio-audio] Erreur résolution ayah_audio sourate=${params.surahNumber} verset=${params.ayahNumber}:`,
        err,
      );
    }
  }

  if (resolvedGlobalAyah) {
    verseAudioUrl = getAyahAudioUrl(resolvedGlobalAyah);
    verseAudioDuration = await getRemoteAudioDurationInSeconds(verseAudioUrl);
  }

  return {
    wordAudioUrl,
    verseAudioUrl,
    wordAudioDuration,
    verseAudioDuration,
  };
}
