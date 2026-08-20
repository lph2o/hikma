import type { GeneratedExercise, GeneratorContext } from "../types";
import { detectTranslationExposure } from "../context-integrity";
import {
  DEFAULT_OPTION_COUNT,
  buildOptions,
  selectDistractors,
  withWordIds,
} from "./shared";

/**
 * CONTEXT_RECOGNITION — reconnaître/retrouver le sens d'une forme DANS son
 * verset coranique réel. Le contexte (ayah + traduction FR du verset) vient des
 * données réelles (`getWordAyahContexts`) : sans contexte, l'exercice n'est pas
 * généré (aucun texte coranique inventé, aucun QCM « décoré »).
 *
 * La question cible LA forme dans LE verset : « Dans ce verset, que signifie
 * « X » ? », et la correction est un QCM de sens (1 bonne réponse + distracteurs
 * issus du bank). Alimente la compétence context_recognition.
 */
export function contextRecognition(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, bank, difficulty, context } = ctx;
  if (!context?.arabic) return null;
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
    type: "CONTEXT_RECOGNITION",
    prompt: `Dans ce verset, que signifie « ${target.arabic} » ?`,
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: false,
      context,
      translationExposure: detectTranslationExposure(context.french, [target.meaning]),
    },
  };
}
