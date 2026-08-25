// Audio de récitation des versets (Phase 74) — couche PURE.
//
// Génère des URLs de CDN déterministes à partir du numéro global d'ayah.
// Aucune table supplémentaire : les URLs sont calculées dynamiquement.
// La table `ayah_audio` (migration 0009) existe comme point d'extension
// pour de futurs récitateurs multiples.
//
// Source CDN : Al Quran Cloud (cdn.islamic.network)
// Licence : streaming/embedding autorisé (usage éducatif).
// Redistribution commerciale : REVIEW_REQUIRED (droits des réciteurs).
//
// Format URL : https://cdn.islamic.network/quran/audio/{bitrate}/{reciter}/{globalAyahNumber}.mp3

/** Réciteur CDN disponible (édition AlQuran.cloud). */
export type AyahReciter = "ar.alafasy" | "ar.abdurrahmaansudais" | "ar.hudhaify" | "ar.minshawi" | "ar.muhammadayyoub" | "ar.abdulsamad";

/** Bitrate audio disponible (kbps). */
export type AyahBitrate = 32 | 40 | 48 | 64 | 128 | 192;

/** Réciteur par défaut — Al-Afasy (clarté pédagogique, largement disponible). */
export const DEFAULT_AYAH_RECITER: AyahReciter = "ar.alafasy";

/** Bitrate par défaut — 128 kbps (bon compromis qualité/taille). */
export const DEFAULT_AYAH_BITRATE: AyahBitrate = 128;

/**
 * Construit l'URL CDN d'un fichier audio de verset.
 *
 * @param globalAyahNumber — Numéro global d'ayah (1–6236), issu de `ayahs.global_ayah_number`.
 * @param reciter — Édition du réciteur (défaut : Al-Afasy).
 * @param bitrate — Qualité en kbps (défaut : 128).
 * @returns URL CDN complète, prête à être passée à AudioPlayer.
 */
export function getAyahAudioCdnUrl(
  globalAyahNumber: number,
  reciter: AyahReciter = DEFAULT_AYAH_RECITER,
  bitrate: AyahBitrate = DEFAULT_AYAH_BITRATE,
): string {
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${globalAyahNumber}.mp3`;
}

/**
 * Construit l'URL CDN à partir du numéro de sourate et du numéro de verset.
 * Nécessite `globalAyahNumber` pour fonctionner — c'est une fonction
 * d'aide pour les appels qui n'ont que (surahNumber, ayahNumber).
 *
 * @param globalAyahNumber — Résolu séparément (ex. via une query).
 */
export function getAyahAudioUrl(
  globalAyahNumber: number,
): string {
  return getAyahAudioCdnUrl(globalAyahNumber);
}

/**
 * Vérifie si un numéro global d'ayah est valide (1–6236).
 * Retourne false pour 0, null, undefined, NaN ou hors bornes.
 */
export function isValidGlobalAyahNumber(n: number | null | undefined): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 1 && n <= 6236;
}