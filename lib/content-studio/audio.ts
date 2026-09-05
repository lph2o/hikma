// Hikma — Content Studio : RÉSOLUTION DES PISTES AUDIO (Phase Audio Fix).
//
// Deux sources audio réelles et officielles :
//   1. Audio du mot : Bucket Storage privé 'word-audio' (Muallim) via getWordAudioState
//      (génère une URL signée avec TTL de 3600 secondes).
//   2. Audio du verset : CDN Al Quran Cloud (cdn.islamic.network) via getAyahAudioUrl
//      (utilise global_ayah_number du verset, récitation Al-Afasy 128kbps CBR).
//
// Aucune donnée inventée, aucun fallback audio simulé, aucune écriture DB.
//
// MESURE DE DURÉE EXACTE (fix critique) :
//   L'estimation `bytes * 8 / 128000` (CBR pur) est NON FIABLE :
//   - les fichiers Alafasy contiennent des tags ID3 volumineux (pochette) inclus
//     dans Content-Length ⇒ durée surestimée (ex. 1:1 = 6,03 s réels, estimés 9,18 s) ;
//   - certains fichiers sont VBR.
//   → Pour tout MP3, on télécharge le fichier (50–250 Ko) et on scanne les frames
//     MPEG (comptage exact) : durée = nbFrames × échantillons/frame / sampleRate.
//     Fonction 100 % pure Node (aucun binaire externe) : fonctionne en dev, sur
//     Vercel et en self-hosted. L'ancienne estimation CBR reste en fallback.

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
  /**
   * Audios MULTI-MOTS (Speed Vocab et futurs formats en série) : URL signée
   * par word_id. Additif — `wordAudioUrl` reste l'audio du mot principal
   * (rétro-compatibilité totale avec les templates mono-mot).
   */
  wordAudioUrls?: Record<string, string | null>;
  /** Durée réelle (s) par word_id, quand l'URL existe. */
  wordAudioDurations?: Record<string, number>;
};

export type ContentStudioAudioParams = {
  wordId: string;
  /**
   * Mots ADDITIONNELS dont il faut résoudre l'audio (Speed Vocab : les mots
   * 2–5). Résolution en UN batch `getWordAudioState` (aucun N+1).
   */
  extraWordIds?: readonly string[];
  ayahId?: string | null;
  globalAyahNumber?: number | null;
  surahNumber?: number | null;
  ayahNumber?: number | null;
};

// ---------------------------------------------------------------------------
// Parseur MP3 pur Node (aucun binaire) — scan des frames MPEG.
// ---------------------------------------------------------------------------

/** Tableaux de débits (kbps) par version MPEG — Layer III et II. */
const BITRATE_MPEG1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const BITRATE_MPEG2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];

/** Fréquences d'échantillonnage (Hz) : MPEG1 / MPEG2 / MPEG2.5. */
const SAMPLE_RATE_MPEG1 = [44100, 48000, 32000];
const SAMPLE_RATE_MPEG2 = [22050, 24000, 16000];
const SAMPLE_RATE_MPEG25 = [11025, 12000, 8000];

/**
 * Parse la durée réelle (secondes) d'un buffer MP3 en comptant les frames MPEG.
 * Gère CBR ET VBR, tags ID3v2 (+ footer) et ID3v1. Retourne null si le buffer
 * ne contient pas de flux MP3 valide.
 */
export function parseMp3DurationFromBuffer(buffer: Buffer): number | null {
  if (!buffer || buffer.length < 64) return null;

  let offset = 0;

  // Saute le tag ID3v2 (taille syncsafe) + footer optionnel.
  if (buffer.length >= 10 && buffer.toString("latin1", 0, 3) === "ID3") {
    const size =
      ((buffer[6] & 0x7f) << 21) |
      ((buffer[7] & 0x7f) << 14) |
      ((buffer[8] & 0x7f) << 7) |
      (buffer[9] & 0x7f);
    offset = 10 + size;
    // Footer ID3v2.4 présent si le flag (bit 4 de l'octet flags) est levé.
    if ((buffer[5] & 0x10) !== 0) offset += 10;
  }

  if (offset + 4 > buffer.length) return null;

  // 1. Trouve le premier header de frame valide (sync 0xFFE).
  let start = offset;
  let sampleRate = 0;
  let samplesPerFrame = 1152;
  let firstFrameLen = 0;

  while (start + 4 <= buffer.length) {
    if (buffer[start] === 0xff && (buffer[start + 1] & 0xe0) === 0xe0) {
      const header = buffer.readUInt32BE(start);
      const versionBits = (header >> 19) & 0x3;
      const layerBits = (header >> 17) & 0x3;
      const bitrateIdx = (header >> 12) & 0xf;
      const sampleIdx = (header >> 10) & 0x3;

      // Version 01 = réservée, Layer 00 = réservé, bitrate 0/15 et sample 3 = invalides.
      if (
        versionBits !== 1 &&
        layerBits !== 0 &&
        bitrateIdx !== 0 &&
        bitrateIdx !== 15 &&
        sampleIdx !== 3
      ) {
        const isMpeg1 = versionBits === 3;
        const bitrateKbps = (isMpeg1 ? BITRATE_MPEG1 : BITRATE_MPEG2)[bitrateIdx];
        const rates = isMpeg1
          ? SAMPLE_RATE_MPEG1
          : versionBits === 2
            ? SAMPLE_RATE_MPEG2
            : SAMPLE_RATE_MPEG25;
        const sr = rates[sampleIdx];
        const padding = (header >> 9) & 0x1;
        const isLayer3 = layerBits === 1;

        if (isLayer3) {
          samplesPerFrame = isMpeg1 ? 1152 : 576;
          firstFrameLen =
            (isMpeg1
              ? Math.floor((144 * bitrateKbps * 1000) / sr)
              : Math.floor((72 * bitrateKbps * 1000) / sr)) + padding;
        } else if (layerBits === 2) {
          // Layer II
          samplesPerFrame = 1152;
          firstFrameLen = Math.floor((144 * bitrateKbps * 1000) / sr) + padding;
        } else {
          // Layer I
          samplesPerFrame = 384;
          firstFrameLen = Math.floor((12 * bitrateKbps * 1000) / sr) * 4 + padding;
        }

        if (firstFrameLen > 0 && sr > 0) {
          sampleRate = sr;
          break;
        }
      }
    }
    start++;
  }

  if (sampleRate === 0 || firstFrameLen <= 0) return null;

  // 2. Compte les frames à partir du premier header trouvé.
  let pos = start;
  let frameCount = 0;

  while (pos + 4 <= buffer.length) {
    const b0 = buffer[pos];
    const b1 = buffer[pos + 1];
    if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) {
      // Données parasites entre frames : on s'arrête (flux inattendu).
      break;
    }
    const header = buffer.readUInt32BE(pos);
    const versionBits = (header >> 19) & 0x3;
    const layerBits = (header >> 17) & 0x3;
    const bitrateIdx = (header >> 12) & 0xf;
    const sampleIdx = (header >> 10) & 0x3;
    if (versionBits === 1 || layerBits === 0 || bitrateIdx === 0 || bitrateIdx === 15 || sampleIdx === 3) {
      break;
    }
    const isMpeg1 = versionBits === 3;
    const bitrateKbps = (isMpeg1 ? BITRATE_MPEG1 : BITRATE_MPEG2)[bitrateIdx];
    const rates = isMpeg1
      ? SAMPLE_RATE_MPEG1
      : versionBits === 2
        ? SAMPLE_RATE_MPEG2
        : SAMPLE_RATE_MPEG25;
    const sr = rates[sampleIdx];
    const padding = (header >> 9) & 0x1;

    let len: number;
    if (layerBits === 1) {
      len =
        (isMpeg1
          ? Math.floor((144 * bitrateKbps * 1000) / sr)
          : Math.floor((72 * bitrateKbps * 1000) / sr)) + padding;
    } else if (layerBits === 2) {
      len = Math.floor((144 * bitrateKbps * 1000) / sr) + padding;
    } else {
      len = Math.floor((12 * bitrateKbps * 1000) / sr) * 4 + padding;
    }

    if (len <= 0 || pos + len > buffer.length) break;
    frameCount++;
    pos += len;
  }

  if (frameCount === 0) return null;

  const durationSeconds = (frameCount * samplesPerFrame) / sampleRate;
  // L'encodage LAME ajoute un délai d'encodeur (~26 ms) ; on ne le soustrait pas
  // pour éviter de couper la récitation (marge de sécurité légère).
  return Math.round(durationSeconds * 100) / 100;
}

// ---------------------------------------------------------------------------
// Parseur Ogg/Opus pur Node (aucun binaire) — granule position + pre-skip.
// ---------------------------------------------------------------------------

/**
 * Parse la durée réelle (secondes) d'un buffer Ogg/Opus.
 * Durée = (granule position de la dernière page − pre-skip OpusHead) / 48000.
 * Retourne null si le buffer n'est pas un flux Ogg/Opus valide.
 */
export function parseOggOpusDurationFromBuffer(buffer: Buffer): number | null {
  if (!buffer || buffer.length < 64) return null;
  if (buffer.toString("latin1", 0, 4) !== "OggS") return null;

  let offset = 0;
  let lastGranule = 0;
  let preSkip = 0;
  let foundHead = false;

  while (offset + 27 <= buffer.length && buffer.toString("latin1", offset, offset + 4) === "OggS") {
    const granule = Number(buffer.readBigUInt64LE(offset + 6));
    const segCount = buffer[offset + 26];
    if (offset + 27 + segCount > buffer.length) break;

    let dataLen = 0;
    for (let i = 0; i < segCount; i++) dataLen += buffer[offset + 27 + i];
    const dataStart = offset + 27 + segCount;
    if (dataStart + dataLen > buffer.length) break;

    // Première page : packet OpusHead (version, canaux, pre-skip à l'octet 10).
    if (
      !foundHead &&
      dataLen >= 19 &&
      buffer.toString("latin1", dataStart, dataStart + 8) === "OpusHead"
    ) {
      preSkip = buffer.readUInt16LE(dataStart + 10);
      foundHead = true;
    }

    if (granule > 0) lastGranule = granule;
    offset = dataStart + dataLen;
  }

  if (!foundHead || lastGranule <= 0) return null;
  const durationSeconds = (lastGranule - preSkip) / 48000;
  return Math.round(durationSeconds * 100) / 100;
}

/** Télécharge une URL distante en mémoire (fichiers audio ≤ quelques centaines de Ko). */
async function downloadToBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const clientModule = parsed.protocol === "https:" ? https : http;
      const req = clientModule.get(
        url,
        { timeout: 8000 },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            return resolve(null);
          }
          const chunks: Buffer[] = [];
          let size = 0;
          res.on("data", (c: Buffer) => {
            chunks.push(c);
            size += c.length;
          });
          res.on("end", () => resolve(Buffer.concat(chunks, size)));
          res.on("error", () => resolve(null));
        },
      );
      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Calcule la durée RÉELLE d'un fichier audio (en secondes) :
 * - MP3 (verset CDN Al-Afasy) : téléchargement + scan exact des frames MPEG ;
 * - sinon (Opus Muallim Storage ~48 kbps) : estimation HEAD Content-Length.
 */
export async function getRemoteAudioDurationInSeconds(url: string): Promise<number | null> {
  if (!url) return null;

  // MP3 : mesure exacte (tags ID3/VBR inclus) — jamais de coupure de récitation.
  if (url.includes("cdn.islamic.network") || url.endsWith(".mp3")) {
    const buffer = await downloadToBuffer(url);
    if (buffer && buffer.length > 0) {
      const exact = parseMp3DurationFromBuffer(buffer);
      if (exact !== null && exact > 0) return exact;
    }
    // Échec de téléchargement : on retombe sur l'estimation CBR par HEAD.
  }

  // Ogg/Opus (audio du mot Muallim) : durée exacte par granule position.
  if (url.includes("word-audio") || url.endsWith(".opus") || url.endsWith(".ogg")) {
    const buffer = await downloadToBuffer(url);
    if (buffer && buffer.length > 0) {
      const exact = parseOggOpusDurationFromBuffer(buffer);
      if (exact !== null && exact > 0) return exact;
    }
  }

  return estimateDurationFromHead(url);
}

/**
 * Estimation de secours par HEAD Content-Length (ancien comportement) :
 * - MP3 CBR 128 kbps → bytes * 8 / 128000 ;
 * - Opus ~48 kbps → bytes * 8 / 48000.
 */
async function estimateDurationFromHead(url: string): Promise<number | null> {
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

  // 1. Audios des mots (word_audio -> URLs signées Storage) — batch unique.
  //    Le mot principal + les mots additionnels (Speed Vocab 2–5) partagent la
  //    même requête : `getWordAudioState` accepte déjà une liste d'ids.
  const allWordIds = [
    ...new Set(
      [params.wordId, ...(params.extraWordIds ?? [])].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];
  const wordAudioUrls: Record<string, string | null> = {};
  const wordAudioDurations: Record<string, number> = {};
  if (allWordIds.length > 0) {
    try {
      const state = await getWordAudioState(client, allWordIds);
      for (const id of allWordIds) {
        const url = state.urls.get(id) ?? null;
        wordAudioUrls[id] = url;
        if (url) {
          const d = await getRemoteAudioDurationInSeconds(url);
          if (typeof d === "number" && d > 0) wordAudioDurations[id] = d;
        }
      }
      wordAudioUrl = params.wordId ? (wordAudioUrls[params.wordId] ?? null) : null;
      wordAudioDuration =
        params.wordId ? (wordAudioDurations[params.wordId] ?? null) : null;
    } catch (err) {
      console.error(
        `[content-studio-audio] Erreur résolution word_audio ids=${allWordIds.length}:`,
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
    wordAudioUrls,
    wordAudioDurations,
  };
}
