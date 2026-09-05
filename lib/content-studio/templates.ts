// Hikma — Content Studio : CATALOGUE ADMIN DES FORMATS VIDÉO (DÉRIVÉ).
//
// ⚠️ CE FICHIER N'EST PLUS UNE SOURCE DE VÉRITÉ. L'unique registre officiel
// est `lib/content-studio/formats/format-registry.ts` (VideoFormatId,
// statuts READY/BETA/COMING_SOON + createTemplate). Ce module projette le
// registre vers la forme historique consommée par le modal admin
// (`create-video-modal.tsx`) et les anciens tests : mêmes 11 formats, mêmes
// clés *_V1, mêmes catégories — les statuts sont DÉRIVÉS, donc toujours
// cohérents entre les deux couches.
//
// Statuts (dérivés du registre) :
//   - READY     → IMPLEMENTED (générable via createTemplate / Video Factory)
//   - BETA      → IMPLEMENTED (pipeline scènes admin existant, ex. quiz)
//   - COMING_SOON → COMING_SOON
//
// Les statuts ne sont jamais surchargés ici : un format n'apparaît
// IMPLEMENTED que lorsque le registre déclare qu'il est réellement générable
// ou branché sur le pipeline existant (règle anti-faux-DONE de la mission).

import { VIDEO_FORMATS } from "@/lib/content-studio/formats/format-registry";

export type VideoFormatCategory = "APPRENDRE" | "COMPRENDRE" | "RÉSEAUX SOCIAUX";

export type VideoFormatStatus = "IMPLEMENTED" | "COMING_SOON";

export type VideoFormatDefinition = {
  key: string;
  name: string;
  subtitle: string;
  description: string;
  category: VideoFormatCategory;
  status: VideoFormatStatus;
  badge?: string;
  platforms: string[];
  estimatedDuration: string;
  sceneKinds: string[];
};

/** Clés *_V1 dont la génération est réellement disponible aujourd'hui. */
export const IMPLEMENTED_FORMAT_KEYS = [
  "WORD_REVEAL_V1",
  "WORD_QUIZ_V1",
  "VERSE_DEEP_DIVE_V1",
  "FREQUENCY_FACT_V1",
  "SURAH_HIGHLIGHT_V1",
  "VOCAB_SPEED_RUN_V1",
] as const;

/** Mapping registre (VideoFormatId) → clé catalogue historique *_V1. */
const CATALOG_KEY_BY_ID: Record<string, string> = {
  WORD_REVEAL: "WORD_REVEAL_V1",
  WORD_QUIZ: "WORD_QUIZ_V1",
  FREQUENCY_FACT: "FREQUENCY_FACT_V1",
  ROOT_FAMILY: "ROOT_FAMILY_V1",
  NUANCE_FALSE_FRIENDS: "WORD_DUEL_V1",
  AYAH_IMMERSION: "VERSE_DEEP_DIVE_V1",
  SURAH_KEYWORDS: "SURAH_HIGHLIGHT_V1",
  LINGUISTIC_PEARL: "LINGUISTIC_GEM_V1",
  DAILY_WORD_CHALLENGE: "STREAK_CHALLENGE_V1",
  LISTEN_AND_FIND: "AUDIO_RECITE_CHALLENGE_V1",
  SPEED_VOCAB: "VOCAB_SPEED_RUN_V1",
};

/** Kinds de scènes du montage par défaut (intro/word/meaning/quran/cta…). */
const SCENE_KINDS_BY_ID: Record<string, string[]> = {
  WORD_REVEAL: ["intro", "word", "meaning", "quran", "explanation", "cta"],
  WORD_QUIZ: ["intro", "word", "meaning"],
  FREQUENCY_FACT: ["intro", "word", "meaning", "quran", "cta"],
  ROOT_FAMILY: ["intro", "word", "meaning", "cta"],
  NUANCE_FALSE_FRIENDS: ["intro", "word", "meaning", "explanation"],
  AYAH_IMMERSION: ["intro", "word", "quran", "explanation", "cta"],
  SURAH_KEYWORDS: ["intro", "word", "meaning", "quran", "cta"],
  LINGUISTIC_PEARL: ["intro", "word", "explanation", "cta"],
  DAILY_WORD_CHALLENGE: ["intro", "word", "cta"],
  LISTEN_AND_FIND: ["intro", "quran", "word", "cta"],
  SPEED_VOCAB: ["intro", "word", "meaning", "cta"],
};

function statusFromRegistry(status: string): VideoFormatStatus {
  // READY + BETA = générable dans le Content Studio ; le reste attend son lot.
  return status === "READY" || status === "BETA" ? "IMPLEMENTED" : "COMING_SOON";
}

/** Catalogue dérivé du registre — ordre du registre (source de vérité). */
export const VIDEO_FORMATS_CATALOG: readonly VideoFormatDefinition[] =
  VIDEO_FORMATS.map((f) => {
    const key = CATALOG_KEY_BY_ID[f.id] ?? f.id;
    // Garde-fou : WORD_REVEAL_V1 reste le pivot de la Video Factory.
    return {
      key,
      name: f.name,
      subtitle: f.subtitle,
      description: f.description,
      category: f.category,
      status: statusFromRegistry(f.status),
      badge: f.badge,
      platforms: f.platforms,
      estimatedDuration: f.recommendedDuration,
      sceneKinds: SCENE_KINDS_BY_ID[f.id] ?? ["intro", "word", "meaning", "cta"],
    };
  });

export function getFormatDefinition(key: string): VideoFormatDefinition | undefined {
  return VIDEO_FORMATS_CATALOG.find((f) => f.key === key);
}

export function isImplementedFormat(key: string): boolean {
  return (IMPLEMENTED_FORMAT_KEYS as readonly string[]).includes(key);
}
