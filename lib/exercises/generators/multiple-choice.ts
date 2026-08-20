import type { GeneratedExercise, GeneratorContext } from "../types";
import {
  DEFAULT_OPTION_COUNT,
  buildOptions,
  selectDistractors,
  withWordIds,
} from "./shared";

/**
 * MULTIPLE_CHOICE — question générique à choix multiples.
 * Ici : affiche le mot arabe, l'utilisateur choisit sa translittération
 * (prononciation). Ne renvoie rien si la translittération est absente.
 */
export function multipleChoice(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, bank, difficulty } = ctx;
  if (target.transliteration == null || target.transliteration === "") return null;

  const distractors = selectDistractors(
    target,
    bank,
    "transliteration",
    DEFAULT_OPTION_COUNT - 1,
  );
  const options = withWordIds(
    buildOptions(target, distractors, "transliteration"),
    target,
    distractors,
    "transliteration",
  );

  return {
    type: "MULTIPLE_CHOICE",
    prompt: "Comment se prononce ce mot ?",
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
