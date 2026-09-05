// Hikma — Content Studio : DISPATCH UNIQUE payload → VideoContent.
//
// PROBLÈME RÉSOLU : la chaîne `templateKey === … ? build… : …` était dupliquée
// dans 4 sites (page admin, render ×2, export). Chaque nouveau template devait
// être ajouté dans les 4 — et un oubli faisait silencieusement tomber le
// template sur le builder Reveal (rendu/export faux, sans erreur).
//
// Ce module est LE SEUL endroit qui mappe une clé de template vers son builder.
// Tout nouveau format (LOT 3+) ajoute UNE branche ici, jamais une copie de
// chaîne. PREVIEW == RENDER est garanti par construction : les deux chemins
// appellent cette même fonction.

import type { ContentStudioAudio } from "@/lib/content-studio/audio";
import type { VideoContent } from "./types";
import {
  buildVideoContentFromFrequencyFact,
  buildVideoContentFromQuiz,
  buildVideoContentFromReveal,
  buildVideoContentFromSpeedVocab,
  buildVideoContentFromSurahHighlight,
  buildVideoContentFromDeepDive,
} from "./pipeline";

/**
 * Construit le VideoContent déterministe d'un item selon sa clé de template.
 * `payload` est casté par branche — la validité est garantie en amont par les
 * validators REJECT OVER GUESS de la Content API (aucun payload non validé
 * n'entre dans le registre `content_items`).
 */
export function buildVideoContentForTemplate(
  templateKey: string,
  payload: unknown,
  audio?: ContentStudioAudio,
): VideoContent {
  switch (templateKey) {
    case "WORD_QUIZ_V1":
      return buildVideoContentFromQuiz(payload as never, audio);
    case "VERSE_DEEP_DIVE_V1":
      return buildVideoContentFromDeepDive(payload as never, audio);
    case "FREQUENCY_FACT_V1":
      return buildVideoContentFromFrequencyFact(payload as never, audio);
    case "SURAH_HIGHLIGHT_V1":
      return buildVideoContentFromSurahHighlight(payload as never, audio);
    case "VOCAB_SPEED_RUN_V1":
      return buildVideoContentFromSpeedVocab(payload as never, audio);
    case "WORD_REVEAL_V1":
      return buildVideoContentFromReveal(payload as never, audio);
    default: {
      // Clé inconnue : on ne fabrique RIEN (jamais de builder par défaut).
      throw new Error(`Template sans builder VideoContent : ${templateKey}`);
    }
  }
}
