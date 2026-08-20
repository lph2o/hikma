import type { GeneratedExercise, GeneratedOption, GeneratorContext } from "../types";
import type { WordBankEntry } from "@/lib/learning";
import { DEFAULT_OPTION_COUNT, buildOptions, withWordIds } from "./shared";

/**
 * LEMMA_RELATION — comprendre la relation FORME → LEMME sans fusionner les
 * formes : « quel mot appartient au même lemme (même famille) que X ? ».
 *
 * La relation provient des données réelles (`getWordLemmaRelations`, soit
 * `quran_words.lemma_id` direct, soit `word_lemma_mapping` safe). Si la forme
 * n'a aucune relation fiable (pas de lemme, ou aucun « frère »), l'exercice
 * n'est PAS généré (DATA_UNAVAILABLE) — on ne fabrique jamais de relation
 * linguistique par similarité de texte. Les formes restent distinctes : on ne
 * fusionne jamais deux word_id.
 *
 * Alimente la compétence lemma_relation.
 */
export function lemmaRelation(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, bank, difficulty, lemma } = ctx;
  if (!lemma || lemma.siblings.length === 0) return null;
  if (!target.arabic) return null;

  // Premier « frère » (déterministe) = bonne réponse.
  const sibling = lemma.siblings[0]!;

  // Distracteurs : formes arabes du bank, hors cible et hors frères du même lemme.
  const siblingIds = new Set(lemma.siblings.map((s) => s.wordId));
  const distractors: WordBankEntry[] = [];
  for (const entry of bank) {
    if (distractors.length >= DEFAULT_OPTION_COUNT - 1) break;
    if (entry.wordId === target.wordId || siblingIds.has(entry.wordId)) continue;
    if (!entry.arabic) continue;
    distractors.push(entry);
  }

  const correctEntry: WordBankEntry = {
    wordId: sibling.wordId,
    arabic: sibling.arabic,
    transliteration: null,
    meaning: null,
  };
  const options: GeneratedOption[] = withWordIds(
    buildOptions(correctEntry, distractors, "arabic"),
    correctEntry,
    distractors,
    "arabic",
  );

  return {
    type: "LEMMA_RELATION",
    prompt: `Quel mot appartient au même lemme (même famille) que « ${target.arabic} » ?`,
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: true,
      lemma,
    },
  };
}
