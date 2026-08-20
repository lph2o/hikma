import type { GeneratedExercise, GeneratedOption, GeneratorContext } from "../types";
import {
  DEFAULT_OPTION_COUNT,
  buildOptions,
  selectDistractors,
  withWordIds,
} from "./shared";

/**
 * AUDIO_TO_WORD — écouter le mot (Muallim) puis identifier la forme arabe.
 * Nécessite une URL audio signée (ctx.audioUrl) : sans audio, l'exercice
 * n'est pas généré (aucun audio simulé). L'écoute est l'entrée, pas une
 * décoration : le texte cible est masqué avant la réponse.
 */
export function audioToWord(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, bank, difficulty, audioUrl } = ctx;
  if (!audioUrl || audioUrl === "") return null;

  const distractors = selectDistractors(
    target,
    bank,
    "arabic",
    DEFAULT_OPTION_COUNT - 1,
  );
  const options: GeneratedOption[] = withWordIds(
    buildOptions(target, distractors, "arabic"),
    target,
    distractors,
    "arabic",
  );

  return {
    type: "AUDIO_TO_WORD",
    prompt: "Écoute, puis retrouve le mot arabe.",
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: false,
      audioUrl,
    },
  };
}

/**
 * WORD_TO_AUDIO — forme affichée → écouter la prononciation Muallim, puis
 * confirmer qu'on reconnaît le mot à l'écoute (auto-évaluation notée).
 * Sans URL audio : non généré.
 */
export function wordToAudio(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, difficulty, audioUrl } = ctx;
  if (!audioUrl || audioUrl === "") return null;

  const options: GeneratedOption[] = [
    { position: 1, content: "Je le reconnais à l'écoute", isCorrect: true, wordId: target.wordId },
    { position: 2, content: "À revoir", isCorrect: false, wordId: null },
  ];

  return {
    type: "WORD_TO_AUDIO",
    prompt: "Écoute la prononciation. Reconnais-tu ce mot à l'écoute ?",
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: true,
      audioUrl,
    },
  };
}
