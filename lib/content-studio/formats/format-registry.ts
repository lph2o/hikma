// Hikma — Video Format System : REGISTRE CENTRAL DES FORMATS ÉDITORIAUX.
//
// Les 11 formats de la Hikma Video Factory (stratégie propre à Hikma — PAS
// OpenReel). Statuts honnêtes :
//   READY       = manipulable de bout en bout dans le Content Studio
//                 (créer → canvas → inspector → timeline → preview → MP4).
//   BETA        = moteur existant (pipeline scènes), flux format en cours.
//   COMING_SOON = analysé/modélisé, non générable.
//
// `createTemplate` n'existe QUE pour les formats générables : la génération
// produit des clips standards du Content Studio (jamais un renderer parallèle).

import type { RevealPayloadV1 } from "@/lib/content-api/types";
import type { SpeedVocabPayloadV1 } from "@/lib/content-api/speed-vocab-types";
import type { ContentStudioAudio } from "@/lib/content-studio/audio";
import { createWordRevealTemplate } from "@/lib/content-studio/formats/word-reveal";
import { createAyahImmersionTemplate } from "@/lib/content-studio/formats/ayah-immersion";
import { createSpeedVocabTemplate } from "@/lib/content-studio/formats/speed-vocab";
import type {
  FormatCategory,
  FormatStatus,
  VideoFormatDef,
  VideoFormatId,
} from "@/lib/content-studio/formats/format-types";

/** Registre central — source de vérité de la Video Factory. */
export const VIDEO_FORMATS: readonly VideoFormatDef[] = [
  // ── APPRENDRE ────────────────────────────────────────────────────────────
  {
    id: "WORD_REVEAL",
    templateKey: "WORD_REVEAL_V1",
    name: "Word Reveal",
    subtitle: "Découverte & Sens",
    category: "APPRENDRE",
    description:
      "Présentation premium d'un mot coranique : mot en or, révélation animée, glose française, occurrences et verset d'illustration.",
    recommendedDuration: "12–15s",
    platforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    status: "READY",
    badge: "Populaire",
    createTemplate: ((input: { payload: RevealPayloadV1; audio?: ContentStudioAudio }) =>
      createWordRevealTemplate(input)) as VideoFormatDef["createTemplate"],
  },
  {
    id: "WORD_QUIZ",
    templateKey: "WORD_QUIZ_V1",
    name: "Word Quiz",
    subtitle: "Test Interactif",
    category: "APPRENDRE",
    description:
      "Question flash, options à choix multiples, timer visuel déterministe (frames) et révélation de la bonne réponse.",
    recommendedDuration: "10–12s",
    platforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    status: "BETA",
    badge: "Interactif",
    createTemplate: null,
  },
  {
    id: "FREQUENCY_FACT",
    templateKey: "FREQUENCY_FACT_V1",
    name: "Frequency Fact",
    subtitle: "Statistique & Fréquence",
    category: "APPRENDRE",
    description:
      "« Ce mot apparaît X fois dans le Coran » : compteur animé par frames et répartition par sourate, données réelles uniquement.",
    recommendedDuration: "8–10s",
    platforms: ["Instagram Reels", "YouTube Shorts"],
    status: "BETA",
    badge: "Fréquence",
    createTemplate: null,
  },
  {
    id: "ROOT_FAMILY",
    templateKey: "ROOT_FAMILY_V1",
    name: "Famille de Racines",
    subtitle: "Morphologie & Dérivés",
    category: "APPRENDRE",
    description:
      "Racine trilitère coranique et 3 mots dérivés : sens commun puis exemples coraniques.",
    recommendedDuration: "15–20s",
    platforms: ["TikTok", "Instagram Reels"],
    status: "COMING_SOON",
    badge: "Bientôt",
    createTemplate: null,
  },
  {
    id: "NUANCE_FALSE_FRIENDS",
    templateKey: "WORD_DUEL_V1",
    name: "Nuances & Faux Amis",
    subtitle: "Comparaison Subtile",
    category: "APPRENDRE",
    description:
      "Split-screen de deux mots proches (الرَّحْمَٰنُ vs الرَّحِيمُ) : sens, exemples, différence clé.",
    recommendedDuration: "15–18s",
    platforms: ["TikTok", "Instagram Reels"],
    status: "COMING_SOON",
    badge: "Bientôt",
    createTemplate: null,
  },

  // ── COMPRENDRE ───────────────────────────────────────────────────────────
  {
    id: "AYAH_IMMERSION",
    templateKey: "VERSE_DEEP_DIVE_V1",
    name: "Immersion Verset",
    subtitle: "Mot au cœur de l'Ayah",
    category: "COMPRENDRE",
    description:
      "Récitation continue (une source audio), word-by-word highlighting, Golden Follower respectant la durée réelle, traduction, focus sur le mot cible.",
    recommendedDuration: "15–25s",
    platforms: ["Instagram Reels", "YouTube Shorts"],
    status: "READY",
    badge: "Immersion",
    createTemplate: ((input: { payload: RevealPayloadV1; audio?: ContentStudioAudio }) =>
      createAyahImmersionTemplate(input)) as VideoFormatDef["createTemplate"],
  },
  {
    id: "SURAH_KEYWORDS",
    templateKey: "SURAH_HIGHLIGHT_V1",
    name: "Mots Clés de Sourate",
    subtitle: "Survol Thématique",
    category: "COMPRENDRE",
    description:
      "Les mots essentiels d'une sourate, issus des données réelles Hikma, pour comprendre un passage.",
    recommendedDuration: "20–30s",
    platforms: ["TikTok", "YouTube Shorts"],
    // BETA : le pipeline scènes SURAH_HIGHLIGHT_V1 existe et est générable
    // via createVideoDraft (mono-mot) — le builder multi-mots dédié reste à venir.
    status: "BETA",
    badge: "Thématique",
    createTemplate: null,
  },
  {
    id: "LINGUISTIC_PEARL",
    templateKey: "LINGUISTIC_GEM_V1",
    name: "Perle Linguistique",
    subtitle: "Rhétorique & Balagha",
    category: "COMPRENDRE",
    description:
      "Pourquoi un terme précis a été choisi : mot arabe, traduction, comparaison, annotation, animation.",
    recommendedDuration: "15–20s",
    platforms: ["TikTok", "Instagram Reels"],
    status: "COMING_SOON",
    badge: "Bientôt",
    createTemplate: null,
  },

  // ── RÉSEAUX SOCIAUX ─────────────────────────────────────────────────────
  {
    id: "DAILY_WORD_CHALLENGE",
    templateKey: "STREAK_CHALLENGE_V1",
    name: "Défi 1 Jour 1 Mot",
    subtitle: "Régularité Quotidienne",
    category: "RÉSEAUX SOCIAUX",
    description:
      "Format quotidien reconnaissable : Jour #X, mot, sens, « À demain ». Numéros de série injectés, jamais hardcodés.",
    recommendedDuration: "8–10s",
    platforms: ["TikTok", "YouTube Shorts"],
    status: "COMING_SOON",
    badge: "Bientôt",
    createTemplate: null,
  },
  {
    id: "LISTEN_AND_FIND",
    templateKey: "AUDIO_RECITE_CHALLENGE_V1",
    name: "Écoute & Trouve",
    subtitle: "Challenge Auditif",
    category: "RÉSEAUX SOCIAUX",
    description:
      "L'utilisateur entend une récitation et identifie le mot parmi des options. BLOCKED_FOR_AUDIO_SYNC sans timings réels.",
    recommendedDuration: "12–15s",
    platforms: ["TikTok", "Instagram Reels"],
    status: "COMING_SOON",
    badge: "Bientôt",
    createTemplate: null,
  },
  {
    id: "SPEED_VOCAB",
    templateKey: "VOCAB_SPEED_RUN_V1",
    name: "Speed Vocab 60s",
    subtitle: "Série Rapide",
    category: "RÉSEAUX SOCIAUX",
    description:
      "Enchaînement rapide de 3 à 5 mots coraniques (arabe + sens + occurrences), rythme entièrement déterministe par frames.",
    recommendedDuration: "30–60s",
    platforms: ["TikTok", "Instagram Reels", "YouTube Shorts"],
    status: "READY",
    badge: "Série",
    createTemplate: ((input: { payload: SpeedVocabPayloadV1; audio?: ContentStudioAudio }) =>
      createSpeedVocabTemplate(input)) as VideoFormatDef["createTemplate"],
  },
];

export function getVideoFormat(id: VideoFormatId | string): VideoFormatDef | undefined {
  return VIDEO_FORMATS.find((f) => f.id === id);
}

export function isFormatGenerable(id: VideoFormatId | string): boolean {
  const def = getVideoFormat(id);
  return Boolean(def && def.status === "READY" && def.createTemplate);
}

/** Formats affichables dans le sélecteur (READY + BETA, jamais bloqués). */
export function selectableFormats(): readonly VideoFormatDef[] {
  return VIDEO_FORMATS.filter((f) => f.status !== "COMING_SOON");
}

/** Catégories du sélecteur (section 18). */
export const FORMAT_CATEGORIES: readonly ("TOUS" | FormatCategory)[] = [
  "TOUS",
  "APPRENDRE",
  "COMPRENDRE",
  "RÉSEAUX SOCIAUX",
];

export type { FormatCategory, FormatStatus, VideoFormatDef, VideoFormatId };
