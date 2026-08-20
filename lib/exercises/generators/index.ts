import type { ExerciseGenerator, ExerciseType } from "../types";
import { wordToTranslation } from "./word-to-translation";
import { translationToWord } from "./translation-to-word";
import { reverseTranslation } from "./reverse-translation";
import { multipleChoice } from "./multiple-choice";
import { wordRecognition } from "./word-recognition";
import { completeWord } from "./complete-word";
import { audioToWord, wordToAudio } from "./audio";
import { formToMeaning, meaningToForm } from "./recall";
import { contextRecognition } from "./context";
import { lemmaRelation } from "./lemma";
import { pronunciationGuided } from "./pronunciation-guided";
import { phoneticDiscrimination } from "./phonetic-discrimination";

export { wordToTranslation } from "./word-to-translation";
export { translationToWord } from "./translation-to-word";
export { reverseTranslation } from "./reverse-translation";
export { multipleChoice } from "./multiple-choice";
export { wordRecognition } from "./word-recognition";
export { completeWord } from "./complete-word";
export { audioToWord, wordToAudio } from "./audio";
export { formToMeaning, meaningToForm } from "./recall";
export { contextRecognition } from "./context";
export { lemmaRelation } from "./lemma";
export { pronunciationGuided } from "./pronunciation-guided";
export { phoneticDiscrimination, generatePhoneticDiscriminationSet } from "./phonetic-discrimination";

/** Registre de tous les générateurs, indexé par type. */
export const GENERATORS: Record<ExerciseType, ExerciseGenerator> = {
  WORD_TO_TRANSLATION: wordToTranslation,
  TRANSLATION_TO_WORD: translationToWord,
  REVERSE_TRANSLATION: reverseTranslation,
  MULTIPLE_CHOICE: multipleChoice,
  WORD_RECOGNITION: wordRecognition,
  COMPLETE_WORD: completeWord,
  AUDIO_TO_WORD: audioToWord,
  WORD_TO_AUDIO: wordToAudio,
  FORM_TO_MEANING: formToMeaning,
  MEANING_TO_FORM: meaningToForm,
  CONTEXT_RECOGNITION: contextRecognition,
  LEMMA_RELATION: lemmaRelation,
  PRONUNCIATION_GUIDED: pronunciationGuided,
  PHONETIC_DISCRIMINATION: phoneticDiscrimination,
};
