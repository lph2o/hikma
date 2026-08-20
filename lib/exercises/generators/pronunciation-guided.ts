import type { GeneratedExercise, GeneratorContext } from "../types";
import { detectMarks, phoneticHints } from "../../learning/phonetics";

/**
 * PRONUNCIATION_GUIDED (Phase 24H-Q1) — lecture guidée + production guidée.
 *
 * L'utilisateur écoute le modèle Muallim, observe la vocalisation, répète,
 * s'enregistre localement, se réécoute et recommence. Aucune analyse
 * automatique : le résultat est AUTO-ÉVALUÉ (« C'est bon » / « Je réessaie »),
 * jamais CORRECT/INCORRECT, et n'entre donc pas dans la maîtrise (compétence
 * null, comme WORD_RECOGNITION).
 *
 * Nécessite l'URL audio signée (ctx.audioUrl) : sans modèle à écouter, la
 * lecture guidée n'est pas générée (aucun audio simulé).
 */
export function pronunciationGuided(
  ctx: GeneratorContext,
): GeneratedExercise | null {
  const { target, difficulty, audioUrl } = ctx;
  if (!audioUrl || audioUrl === "") return null;

  return {
    type: "PRONUNCIATION_GUIDED",
    prompt: "Écoute, observe puis répète à ton tour.",
    difficulty,
    options: [],
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: true,
      audioUrl,
      selfAssessed: true,
      phoneticMarks: detectMarks(target.arabic),
      phoneticHints: phoneticHints(target.arabic),
    },
  };
}
