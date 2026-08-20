import { describe, expect, it } from "vitest";
import { stableOptionOrder } from "../components/learn/exercises/option-order";
import type { GeneratedOption } from "../lib/exercises";

const options: GeneratedOption[] = [
  { position: 1, content: "A", isCorrect: false, wordId: null },
  { position: 2, content: "B", isCorrect: false, wordId: null },
  { position: 3, content: "C", isCorrect: true, wordId: "word-1" },
  { position: 4, content: "D", isCorrect: false, wordId: null },
];

describe("stableOptionOrder", () => {
  it("produit le même ordre pour le même exercice", () => {
    expect(stableOptionOrder(options, "exercise-a")).toEqual(
      stableOptionOrder(options, "exercise-a"),
    );
  });

  it("peut produire des positions différentes pour deux exercices", () => {
    expect(stableOptionOrder(options, "exercise-a")).not.toEqual(
      stableOptionOrder(options, "exercise-c"),
    );
  });

  it("conserve toutes les options et l’identité de la bonne réponse", () => {
    const ordered = stableOptionOrder(options, "exercise-a");
    expect(ordered).toHaveLength(options.length);
    expect(new Set(ordered.map((option) => option.position))).toEqual(
      new Set(options.map((option) => option.position)),
    );
    expect(ordered.filter((option) => option.isCorrect)).toHaveLength(1);
    expect(ordered.find((option) => option.isCorrect)?.content).toBe("C");
  });

  it("ne dépend pas d’un tirage aléatoire et ne mute pas l’entrée", () => {
    const original = [...options];
    stableOptionOrder(options, "exercise-a");
    expect(options).toEqual(original);
  });
});
