import type { GeneratedExercise, GeneratorContext } from "../types";
import {
  DEFAULT_OPTION_COUNT,
  buildOptions,
  selectDistractors,
  withWordIds,
} from "./shared";

/**
 * TRANSLATION_TO_WORD — affiche le sens (et la translittération en indice),
 * l'utilisateur choisit le mot arabe. L'indice de translittération le rend
 * plus accessible que REVERSE_TRANSLATION (sens seul).
 */
export function translationToWord(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, bank, difficulty } = ctx;
  if (target.meaning == null || target.meaning === "") return null;

  const distractors = selectDistractors(
    target,
    bank,
    "arabic",
    DEFAULT_OPTION_COUNT - 1,
  );
  const options = withWordIds(
    buildOptions(target, distractors, "arabic"),
    target,
    distractors,
    "arabic",
  );

  const hint = target.transliteration ? ` (${target.transliteration})` : "";

  return {
    type: "TRANSLATION_TO_WORD",
    prompt: `« ${target.meaning} »${hint} — quel est le mot arabe ?`,
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: false,
    },
  };
}
