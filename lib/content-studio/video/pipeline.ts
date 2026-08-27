// Hikma — Content Studio (Phase B4) : PIPELINE CONTENU → SCÈNES.
//
// Fonctions PURES et DÉTERMINISTES : aucune I/O, aucun aléa.
//   payload Content API V1 (gelé)  →  VideoContent  →  VideoSceneData
//
// Aucune invention de données : chaque champ provient du payload contractuel.
// Le hook est rendu depuis la banque HOOKS_V1 (les IDs sont stables — le texte
// peut évoluer dans la couche Content Studio sans toucher au moteur).

import type { RevealPayloadV1, QuizPayloadV1 } from "@/lib/content-api/types";
import {
  renderHookText,
  type HookIdV1,
} from "@/lib/content-api/banks";
import type {
  VideoContent,
  VideoMeaningConfidence,
  VideoScene,
  VideoSceneData,
} from "./types";
import type { ContentStudioAudio } from "../audio";

// ---------------------------------------------------------------------------
// Durées de scènes (frames @30fps) — constantes déterministes.
// ---------------------------------------------------------------------------
export const SCENE_FRAMES = {
  intro: 45, // 1,5 s
  word: 60, // 2 s (base si pas d'audio ou audio plus court)
  meaning: 75, // 2,5 s
  quran: 90, // 3 s (fallback si pas d'audio de verset)
  explanation: 90, // 3 s
  cta: 45, // 1,5 s
} as const;

export const VIDEO_FPS = 30 as const;
export const VIDEO_WIDTH = 1080 as const;
export const VIDEO_HEIGHT = 1920 as const;

/** Confiance dérivée EXACTEMENT comme la Content API (FORME→VERIFIED, LEMME→PARTIAL). */
function confidenceFromSourceType(
  sourceType: RevealPayloadV1["meaning"]["sourceType"],
): VideoMeaningConfidence {
  return sourceType === "LEMME" ? "PARTIAL" : "VERIFIED";
}

/** WORD_REVEAL_V1 → VideoContent (source vidéo principale du milestone). */
export function buildVideoContentFromReveal(
  payload: RevealPayloadV1,
  audio?: ContentStudioAudio,
): VideoContent {
  const hook = renderHookText(
    payload.hookVariant.id as HookIdV1,
    payload.occurrenceCount,
  );
  return {
    contentKey: payload.contentKey,
    language: "fr",
    templateKey: "WORD_REVEAL_V1",
    word: {
      id: payload.word.id,
      arabic: payload.word.arabic,
      transliteration: payload.word.transliteration,
    },
    hook: hook.text,
    meaning: payload.meaning.text,
    meaningConfidence: confidenceFromSourceType(payload.meaning.sourceType),
    occurrenceCount: payload.occurrenceCount,
    firstOccurrence: {
      surahNumber: payload.firstOccurrence.surahNumber,
      surahName: payload.firstOccurrence.surahName,
      ayahNumber: payload.firstOccurrence.ayahNumber,
      excerptUthmani: payload.firstOccurrence.excerptUthmani,
    },
    explanation: payload.explanation?.text ?? null,
    cta: payload.cta?.text ?? null,
    audio,
    metadata: {
      meaningSourceId: payload.sources.meaningSourceId,
      meaningSourceTable: payload.sources.meaningSourceTable,
      ayahId: payload.sources.ayahId,
      licenseSnapshot: {
        verseTranslation: payload.licenses.verseTranslation,
        audio: payload.licenses.audio,
        dataset: payload.licenses.dataset,
        assets: payload.licenses.assets,
      },
    },
  };
}

/** WORD_QUIZ_V1 → VideoContent (format quiz — glose = option correcte). */
export function buildVideoContentFromQuiz(
  payload: QuizPayloadV1,
  audio?: ContentStudioAudio,
): VideoContent {
  const correct = payload.quiz.options.find((o) => o.isCorrect);
  const hook = renderHookText(
    payload.hookVariant.id as HookIdV1,
    0, // template HOOK_H2 sans {count}
  );
  return {
    contentKey: payload.contentKey,
    language: "fr",
    templateKey: "WORD_QUIZ_V1",
    word: {
      id: payload.word.id,
      arabic: payload.word.arabic,
      transliteration: payload.word.transliteration,
    },
    hook: hook.text,
    meaning: correct?.content ?? "",
    meaningConfidence: confidenceFromSourceType(
      payload.sources.meaningSourceTable === "lemma_translations"
        ? "LEMME"
        : "FORME",
    ),
    occurrenceCount: null, // absent du payload quiz (jamais inventé)
    firstOccurrence: null, // absent du payload quiz
    explanation: null, // absent du payload quiz
    cta: null, // le quiz n'a pas de CTA en V1
    audio,
    metadata: {
      meaningSourceId: payload.sources.meaningSourceId,
      meaningSourceTable: payload.sources.meaningSourceTable,
      ayahId: null,
      licenseSnapshot: {
        verseTranslation: payload.licenses.verseTranslation,
        audio: payload.licenses.audio,
        dataset: payload.licenses.dataset,
        assets: payload.licenses.assets,
      },
    },
  };
}

/** VERSE_DEEP_DIVE_V1 → VideoContent (Immersion Verset & Récitation). */
export function buildVideoContentFromDeepDive(
  payload: RevealPayloadV1,
  audio?: ContentStudioAudio,
): VideoContent {
  const base = buildVideoContentFromReveal(payload, audio);
  return {
    ...base,
    templateKey: "VERSE_DEEP_DIVE_V1",
    hook: `Découvre le verset où apparaît « ${payload.word.arabic} »`,
  };
}

/** FREQUENCY_FACT_V1 → VideoContent (Statistiques de Fréquence). */
export function buildVideoContentFromFrequencyFact(
  payload: RevealPayloadV1,
  audio?: ContentStudioAudio,
): VideoContent {
  const base = buildVideoContentFromReveal(payload, audio);
  return {
    ...base,
    templateKey: "FREQUENCY_FACT_V1",
    hook: `Ce mot apparaît ${payload.occurrenceCount} fois dans le Noble Coran`,
  };
}

/** SURAH_HIGHLIGHT_V1 → VideoContent (Mots Clés de Sourate). */
export function buildVideoContentFromSurahHighlight(
  payload: RevealPayloadV1,
  audio?: ContentStudioAudio,
): VideoContent {
  const base = buildVideoContentFromReveal(payload, audio);
  return {
    ...base,
    templateKey: "SURAH_HIGHLIGHT_V1",
    hook: `Un mot clé de la Sourate ${payload.firstOccurrence.surahName}`,
  };
}

/** Ajoute une scène si sa condition est remplie (aucune scène vide). */
function pushScene(
  scenes: VideoScene[],
  scene: VideoScene | null,
): void {
  if (scene) scenes.push(scene);
}

/** VideoContent → VideoSceneData (montage 9:16 déterministe). */
export function toVideoSceneData(
  content: VideoContent,
  audioOverrides?: ContentStudioAudio,
): VideoSceneData {
  const scenes: VideoScene[] = [];
  const wordAudioUrl = audioOverrides?.wordAudioUrl ?? content.audio?.wordAudioUrl ?? null;
  const verseAudioUrl = audioOverrides?.verseAudioUrl ?? content.audio?.verseAudioUrl ?? null;
  const wordAudioDuration = audioOverrides?.wordAudioDuration ?? content.audio?.wordAudioDuration ?? null;
  const verseAudioDuration = audioOverrides?.verseAudioDuration ?? content.audio?.verseAudioDuration ?? null;

  // Durée synchronisée pour la scène Coran (exactement la durée de l'audio du verset)
  const quranDurationInFrames =
    typeof verseAudioDuration === "number" && verseAudioDuration > 0
      ? Math.max(1, Math.round(verseAudioDuration * VIDEO_FPS))
      : SCENE_FRAMES.quran;

  // Durée pour la scène Mot (englobe l'audio du mot)
  const wordDurationInFrames =
    typeof wordAudioDuration === "number" && wordAudioDuration > 0
      ? Math.max(SCENE_FRAMES.word, Math.round(wordAudioDuration * VIDEO_FPS))
      : SCENE_FRAMES.word;

  // 1. Intro — hook éditorial.
  pushScene(scenes, {
    kind: "intro",
    durationInFrames: SCENE_FRAMES.intro,
    title:
      content.templateKey === "VERSE_DEEP_DIVE_V1"
        ? "Hikma · Immersion Verset"
        : content.templateKey === "FREQUENCY_FACT_V1"
          ? "Hikma · Fréquence Coran"
          : content.templateKey === "SURAH_HIGHLIGHT_V1"
            ? "Hikma · Mots Clés"
            : "Hikma · Un mot du Coran",
    text: content.hook,
  });

  // 2. Mot — arabe Uthmani (RTL), jamais normalisé + audio du mot synchronisé.
  pushScene(scenes, {
    kind: "word",
    durationInFrames: wordDurationInFrames,
    title: "Le mot",
    arabic: content.word.arabic,
    transliteration: content.word.transliteration,
    audioUrl: wordAudioUrl,
    audioDuration: wordAudioDuration,
  });

  // 3. Sens — glose FR validée.
  pushScene(scenes, {
    kind: "meaning",
    durationInFrames: SCENE_FRAMES.meaning,
    title:
      content.templateKey === "FREQUENCY_FACT_V1"
        ? `Fréquence (${content.occurrenceCount} occurrences)`
        : "Que signifie ce mot ?",
    text: content.meaning,
    subtext: content.word.transliteration,
  });

  // 4. Coran — première occurrence réelle (excerpt inaltéré) + audio du verset synchronisé + Golden Follower.
  if (content.firstOccurrence) {
    pushScene(scenes, {
      kind: "quran",
      durationInFrames: quranDurationInFrames,
      title:
        content.templateKey === "VERSE_DEEP_DIVE_V1"
          ? `Verset · Sourate ${content.firstOccurrence.surahName}`
          : "Dans le Coran",
      arabic: content.firstOccurrence.excerptUthmani,
      subtext: `Sourate ${content.firstOccurrence.surahName} · verset ${content.firstOccurrence.ayahNumber}`,
      audioUrl: verseAudioUrl,
      audioDuration: verseAudioDuration,
      verseConfig: {
        mode: content.templateKey === "VERSE_DEEP_DIVE_V1" ? "large" : "standard",
        showTranslation: false, // configurable dans l'Inspector
        highlight: {
          wordArabic: content.word.arabic,
          style: "glow",
        },
        follower: {
          enabled: true,
          style: "gold-highlight",
          intensity: 1,
          glow: 0.8,
        },
      },
    });
  }

  // 5. Explication — uniquement si présente (jamais générée).
  if (content.explanation) {
    pushScene(scenes, {
      kind: "explanation",
      durationInFrames: SCENE_FRAMES.explanation,
      title: "Pour aller plus loin",
      text: content.explanation,
    });
  }

  // 6. CTA — uniquement si présent.
  if (content.cta) {
    pushScene(scenes, {
      kind: "cta",
      durationInFrames: SCENE_FRAMES.cta,
      title: "Hikma",
      text: content.cta,
    });
  }

  return {
    scenes,
    durationInFrames: scenes.reduce((acc, s) => acc + s.durationInFrames, 0),
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    layout: "9:16",
    theme: "HIKMA",
  };
}
