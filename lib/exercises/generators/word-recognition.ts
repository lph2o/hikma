import type { GeneratedExercise, GeneratedOption, GeneratorContext } from "../types";

/**
 * WORD_RECOGNITION — auto-évaluation : « connais-tu ce mot ? ».
 * Non noté (aucune option « correcte ») : le moteur accepte toute réponse.
 * La validation structurelle est assouplie pour ce type (pas d'option correcte).
 */
export function wordRecognition(ctx: GeneratorContext): GeneratedExercise {
  const { target, difficulty } = ctx;
  const options: GeneratedOption[] = [
    { position: 1, content: "Oui, je le connais", isCorrect: false, wordId: null },
    { position: 2, content: "Pas encore", isCorrect: false, wordId: null },
  ];

  return {
    type: "WORD_RECOGNITION",
    prompt: "Reconnais-tu ce mot ?",
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: true,
      selfAssessed: true,
    },
  };
}
