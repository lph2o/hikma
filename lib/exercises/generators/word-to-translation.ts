import type { GeneratedExercise, GeneratorContext } from "../types";
import {
  DEFAULT_OPTION_COUNT,
  buildOptions,
  selectDistractors,
  withWordIds,
} from "./shared";

/**
 * WORD_TO_TRANSLATION — affiche le mot arabe, l'utilisateur choisit la
 * traduction (sens anglais fourni par la source word-by-word).
 * Ne renvoie rien si le mot n'a pas de sens (donnée absente → pas d'exercice).
 */
export function wordToTranslation(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, bank, difficulty } = ctx;
  if (target.meaning == null || target.meaning === "") return null;

  const distractors = selectDistractors(
    target,
    bank,
    "meaning",
    DEFAULT_OPTION_COUNT - 1,
  );
  const options = withWordIds(
    buildOptions(target, distractors, "meaning"),
    target,
    distractors,
    "meaning",
  );

  return {
    type: "WORD_TO_TRANSLATION",
    prompt: "Que signifie ce mot ?",
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: true,
    },
  };
}
