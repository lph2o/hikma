// Hikma — Content Studio (Phase B2) : CONTRATS VIDÉO.
//
// Séparation STRICTE contenu / présentation :
//   - VideoContent   : données ÉDITORIALES dérivées des payloads Content API V1
//                      (aucune invention — chaque champ provient du contrat) ;
//   - VideoSceneData : données de MONTAGE (scènes ordonnées + durées + layout),
//                      ce que Remotion consomme pour le rendu.
//
// Remotion ne reçoit JAMAIS le payload brut : uniquement VideoSceneData.
// Les données éditoriales ne contiennent AUCUN composant React.

/** Langues V1 (gelé Phase A : fr uniquement). */
export type VideoLanguage = "fr";

/** Templates vidéo-ables supportés par le moteur Remotion. */
export type VideoTemplateKey =
  | "WORD_REVEAL_V1"
  | "WORD_QUIZ_V1"
  | "VERSE_DEEP_DIVE_V1"
  | "FREQUENCY_FACT_V1"
  | "SURAH_HIGHLIGHT_V1"
  | "VOCAB_SPEED_RUN_V1";

/** Confiance de la glose (politique Phase A : FORME→VERIFIED, LEMME→PARTIAL). */
export type VideoMeaningConfidence = "VERIFIED" | "PARTIAL";

/**
 * Contenu éditorial vidéo — projection déterministe d'un payload contractuel
 * (RevealPayloadV1 ou QuizPayloadV1). Aucun champ n'est inventé : si une donnée
 * n'existe pas dans le payload, elle est null (jamais substituée).
 */
export type VideoContent = {
  contentKey: string;
  language: VideoLanguage;
  templateKey: VideoTemplateKey;
  word: {
    id: string;
    arabic: string;
    transliteration: string | null;
  };
  /** Texte de hook rendu depuis la banque HOOKS_V1 (payload.hookVariant.id). */
  hook: string;
  /** Glose FR validée (payload.meaning.text). */
  meaning: string;
  meaningConfidence: VideoMeaningConfidence;
  /** Présent sur WORD_REVEAL_V1 ; null sur WORD_QUIZ_V1 (champ absent du payload). */
  occurrenceCount: number | null;
  /** Première occurrence réelle (min surah×1000+ayah) — null si indisponible. */
  firstOccurrence: {
    surahNumber: number;
    surahName: string;
    ayahNumber: number;
    excerptUthmani: string;
  } | null;
  /** Explication pédagogique validée, si présente (jamais générée). */
  explanation: string | null;
  /** Texte CTA (payload.cta?.text) — null si absent. */
  cta: string | null;
  /**
   * Speed Vocab (VOCAB_SPEED_RUN_V1) — liste complète des mots diffusés
   * (additif, ignoré par les autres templates). Chaque entrée provient du
   * payload validé : aucune invention.
   */
  speedVocabWords?: readonly {
    wordId: string;
    arabic: string;
    transliteration: string | null;
    meaning: string;
    occurrenceCount: number;
  }[];
  /** URLs audio réelles résolues (mot et verset) et durées en secondes. */
  audio?: {
    wordAudioUrl?: string | null;
    verseAudioUrl?: string | null;
    wordAudioDuration?: number | null;
    verseAudioDuration?: number | null;
    /** Audio MULTI-MOTS (Speed Vocab) : URL signée + durée par word_id. */
    wordAudioUrls?: Record<string, string | null>;
    wordAudioDurations?: Record<string, number>;
  };
  /** Traçabilité source + licence (instantanés du payload). */
  metadata: {
    meaningSourceId: string;
    meaningSourceTable: "word_translations" | "lemma_translations";
    ayahId: string | null;
    licenseSnapshot: {
      verseTranslation: string;
      audio: string;
      dataset: string;
      assets: string;
    };
  };
};

/** Types de scènes du format social 9:16. */
export type VideoSceneKind =
  | "intro"
  | "word"
  | "meaning"
  | "quran"
  | "explanation"
  | "cta";

// ---------------------------------------------------------------------------
// MOTION (Phase H1 — motion engine Hikma, additif et rétro-compatible).
// Une scène SANS `motion` reçoit automatiquement les presets par défaut de son
// `kind` (normalizeMotion). Tous les effets sont DÉTERMINISTES (frame-based,
// aucun aléa) et partagés par Preview (Player) et Render (renderMedia).
// ---------------------------------------------------------------------------

export type MotionPreset =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "scale"
  | "blur-in"
  | "soft-float"
  | "word-focus"
  | "light-sweep"
  | "golden-glint"
  | "soft-glow"
  | "breathing-scale";

/** Liste contractuelle des presets (validation serveur + hash stable). */
export const MOTION_PRESETS: readonly MotionPreset[] = [
  "fade",
  "fade-up",
  "fade-down",
  "scale",
  "blur-in",
  "soft-float",
  "word-focus",
  "light-sweep",
  "golden-glint",
  "soft-glow",
  "breathing-scale",
] as const;

export function isMotionPreset(value: string): value is MotionPreset {
  return (MOTION_PRESETS as readonly string[]).includes(value);
}

export type MotionIntensity = "low" | "medium";

/**
 * Configuration WORD HERO (Phase H2) — matériau argenté + contrôles visuels du
 * mot arabe. Additive et optionnelle : absente ⇒ défauts (tout ON, silver).
 * Champs numériques bornés (clamps serveur) : opacity/intensity 0..1,
 * blur 0..6, duration 10..60. Ordre de clés normalisé à la sanitisation.
 */
export type WordHeroSettings = {
  /** Matériau du mot (V1 : silver uniquement). */
  material?: "silver";
  mirror?: {
    enabled?: boolean;
    opacity?: number;
    blur?: number;
  };
  lightSweep?: {
    enabled?: boolean;
    intensity?: number;
    duration?: number;
  };
  goldenGlint?: {
    enabled?: boolean;
    intensity?: number;
  };
  glow?: {
    enabled?: boolean;
    intensity?: number;
  };
  breathing?: {
    enabled?: boolean;
    intensity?: number;
  };
  depth?: {
    enabled?: boolean;
    intensity?: number;
  };
};

/**
 * Configuration de mouvement d'une scène (couche d'édition, additive).
 * Tous les champs optionnels : les valeurs manquantes sont comblées par les
 * défauts du `kind` (calmes, intensité low). `enter*` pilote l'entrée ;
 * `emphasis`/`emphasisDelay` pilote l'effet de mise en valeur (ex. light sweep
 * sur le mot).
 */
export type SceneMotion = {
  enter?: MotionPreset;
  enterDuration?: number; // frames (clamp serveur 5..120)
  enterDelay?: number; // frames (clamp serveur 0..300)
  emphasis?: MotionPreset;
  emphasisDelay?: number; // frames (clamp serveur 0..600)
  intensity?: MotionIntensity;
};

// ---------------------------------------------------------------------------
// VERSE DISPLAY & RECITATION FOLLOWER (Phase V2)
// ---------------------------------------------------------------------------

export type VerseDisplayMode =
  | "standard"
  | "large"
  | "highlight-word"
  | "line-by-line"
  | "progressive"
  | "word-focus";

export type VerseHighlightStyle =
  | "color"
  | "background"
  | "underline"
  | "glow"
  | "scale";

export type GoldenFollowerStyle =
  | "gold-highlight"
  | "gold-glow"
  | "gold-underline"
  | "gold-background"
  | "gold-sweep"
  | "gold-scale";

export type VerseWordTiming = {
  wordId?: string;
  arabic: string;
  startFrame: number;
  endFrame: number;
};

export type VerseDisplayConfig = {
  mode?: VerseDisplayMode;
  showTranslation?: boolean;
  translation?: {
    text?: string;
    language?: "fr" | "en" | "it";
    sourceName?: string;
    position?: "below" | "card" | "separate";
    fontSize?: number;
    opacity?: number;
  };
  typography?: {
    fontSize?: number;
    lineHeight?: number;
    alignment?: "center" | "right";
  };
  highlight?: {
    wordArabic?: string;
    style?: VerseHighlightStyle;
  };
  follower?: {
    enabled?: boolean;
    style?: GoldenFollowerStyle;
    intensity?: number;
    glow?: number;
    transition?: number;
    words?: VerseWordTiming[];
  };
};

/**
 * Une scène = données de montage PURE (durée + champs de rendu).
 * Les champs non pertinents pour le `kind` sont absents/undefined.
 * `motion` est la couche H1 (optionnelle, additive) — jamais requise.
 */
export type VideoScene = {
  kind: VideoSceneKind;
  durationInFrames: number;
  /** Titre / label de la scène (fr). */
  title?: string;
  /** Texte arabe (Uthmani, RTL, jamais normalisé). */
  arabic?: string;
  transliteration?: string | null;
  /** Texte principal (hook, glose, explication, CTA…). */
  text?: string;
  /** Texte secondaire (référence de verset, etc.). */
  subtext?: string | null;
  /** Configuration de mouvement (H1) — absente ⇒ défauts du kind. */
  motion?: SceneMotion;
  /** Configuration Word Hero (H2) — pertinente pour kind="word". */
  hero?: WordHeroSettings;
  /** Configuration d'affichage et suivi du verset coranique — pour kind="quran". */
  verseConfig?: VerseDisplayConfig;
  /** URL audio de la scène (mot ou verset) pour le rendu Remotion <Audio>. */
  audioUrl?: string | null;
  /** Durée réelle de la piste audio (en secondes). */
  audioDuration?: number | null;
  // -----------------------------------------------------------------------
  // AUDIO CONTROLS (Timeline Pro) — éditables depuis l'Inspector Audio.
  // Toutes les valeurs sont optionnelles ; les défauts Remotion s'appliquent
  // si absents (volume=1, muet=false, aucun fade, lecture depuis le début).
  // -----------------------------------------------------------------------
  /** Volume de la piste audio : 0 (silence) à 1 (plein). Défaut : 1. */
  audioVolume?: number;
  /** Piste audio en sourdine. Défaut : false. */
  audioMuted?: boolean;
  /** Durée du fondu entrant en frames. Défaut : 0. */
  audioFadeIn?: number;
  /** Durée du fondu sortant en frames. Défaut : 0. */
  audioFadeOut?: number;
  /** Offset de départ dans la source audio (frames). Défaut : 0. */
  audioStartFrom?: number;
};

/** Layout du format V1 (vertical). Extensible 1:1 / 16:9 sans réécrire le contenu. */
export type VideoLayout = "9:16";

export type VideoTheme = "HIKMA";

/** Données de montage complètes — l'unique entrée de la composition Remotion. */
export type VideoSceneData = {
  scenes: VideoScene[];
  durationInFrames: number;
  fps: 30;
  width: 1080;
  height: 1920;
  layout: VideoLayout;
  theme: VideoTheme;
};
