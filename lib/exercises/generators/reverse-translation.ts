import type { GeneratedExercise, GeneratorContext } from "../types";
import {
  DEFAULT_OPTION_COUNT,
  buildOptions,
  selectDistractors,
  withWordIds,
} from "./shared";

/**
 * REVERSE_TRANSLATION — sens seul (sans indice) → choisir le mot arabe.
 * Variante plus exigeante de TRANSLATION_TO_WORD (qui affiche la
 * translittération en indice).
 */
export function reverseTranslation(ctx: GeneratorContext): GeneratedExercise | null {
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

  return {
    type: "REVERSE_TRANSLATION",
    prompt: `Quel mot arabe signifie « ${target.meaning} » ?`,
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
