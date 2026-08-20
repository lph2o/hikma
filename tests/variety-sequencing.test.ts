import { describe, expect, it } from "vitest";
import { buildInterleavedSequence } from "../lib/learning/sequencing";
import type { ExerciseType, GeneratedExercise } from "../lib/exercises";

const TYPES: ExerciseType[] = [
  "WORD_TO_TRANSLATION",
  "TRANSLATION_TO_WORD",
  "FORM_TO_MEANING",
  "MEANING_TO_FORM",
  "AUDIO_TO_WORD",
  "CONTEXT_RECOGNITION",
  "LEMMA_RELATION",
];

function exercise(type: ExerciseType, targetWordId: string, index: number): GeneratedExercise {
  return {
    id: `source-${index}`,
    type,
    prompt: `${type}-${targetWordId}-${index}`,
    difficulty: 1,
    options: [],
    metadata: {
      targetWordId,
      arabic: null,
      transliteration: null,
      meaning: null,
    },
  };
}

function maxStreak(values: string[]): number {
  let max = 0;
  let current = 0;
  let previous: string | undefined;
  for (const value of values) {
    current = value === previous ? current + 1 : 1;
    max = Math.max(max, current);
    previous = value;
  }
  return max;
}

describe("buildInterleavedSequence", () => {
  it("est déterministe et ne dépend pas d'un tirage aléatoire", () => {
    const source = TYPES.map((type, index) => exercise(type, `word-${index % 2}`, index));
    const first = buildInterleavedSequence(source);
    const second = buildInterleavedSequence(source);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
  });

  it("préfère A → B → A quand deux types compatibles existent", () => {
    const source = [
      exercise("WORD_TO_TRANSLATION", "a", 0),
      exercise("WORD_TO_TRANSLATION", "b", 1),
      exercise("WORD_TO_TRANSLATION", "c", 2),
      exercise("TRANSLATION_TO_WORD", "a", 3),
      exercise("TRANSLATION_TO_WORD", "b", 4),
      exercise("TRANSLATION_TO_WORD", "c", 5),
    ];
    const result = buildInterleavedSequence(source);
    expect(result.slice(0, 3).map((item) => item.type)).toEqual([
      "WORD_TO_TRANSLATION",
      "TRANSLATION_TO_WORD",
      "WORD_TO_TRANSLATION",
    ]);
  });

  it("respecte les phases pédagogiques avant la variété locale", () => {
    const source = [
      exercise("LEMMA_RELATION", "a", 0),
      exercise("MEANING_TO_FORM", "a", 1),
      exercise("AUDIO_TO_WORD", "a", 2),
      exercise("WORD_TO_TRANSLATION", "a", 3),
    ];
    expect(buildInterleavedSequence(source).map((item) => item.type)).toEqual([
      "WORD_TO_TRANSLATION",
      "MEANING_TO_FORM",
      "AUDIO_TO_WORD",
      "LEMMA_RELATION",
    ]);
  });

  it("conserve un petit ensemble mono-type sans inventer de variété", () => {
    const source = [0, 1, 2].map((index) => exercise("LEMMA_RELATION", `word-${index}`, index));
    expect(buildInterleavedSequence(source).map((item) => item.id)).toEqual([
      "source-0",
      "source-1",
      "source-2",
    ]);
  });

  it("ne perd ni ne duplique aucun exercice et réduit les longues séries", () => {
    const source = Array.from({ length: 8 }, (_, index) => [
      exercise("WORD_TO_TRANSLATION", `word-${index}`, index),
      exercise("TRANSLATION_TO_WORD", `word-${index}`, index + 8),
    ]).flat();
    const result = buildInterleavedSequence(source);
    expect(result).toHaveLength(source.length);
    expect(new Set(result.map((item) => item.id)).size).toBe(source.length);
    expect(maxStreak(result.map((item) => item.type))).toBeLessThanOrEqual(2);
  });
});
