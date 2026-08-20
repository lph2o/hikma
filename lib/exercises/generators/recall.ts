import type { GeneratedExercise, GeneratorContext } from "../types";
import { answerLanguageForMeaning } from "../context-integrity";

/**
 * RAPPEL LIBRE machine-noté (Phase 23F-B). L'utilisateur doit RETROUVER la
 * réponse de mémoire puis la SAISIR (pas la choisir) ; la notation est faite
 * par le moteur (`lib/exercises/grading.ts`), pas par auto-évaluation.
 *
 * La réponse attendue est portée par `metadata.revealContent` et les
 * formulations acceptées par `metadata.acceptedAnswers` (français) ou
 * `metadata.expectedArabic` (arabe). L'UI affiche d'abord l'indice (arabe ou
 * sens), un champ de saisie libre, puis la correction révélée.
 */

/**
 * Découpe une glose validée en variantes acceptées : la glose complète + ses
 * composantes séparées par « / », « · » ou « | » (ex. « souverain / maître »
 * → « souverain / maître », « souverain », « maître »). Aucune variante n'est
 * inventée au-delà de ces découpes.
 */
function glossVariants(meaning: string): string[] {
  const variants = new Set<string>([meaning.trim()]);
  for (const part of meaning.split(/[/·|]/)) {
    const trimmed = part.trim();
    if (trimmed) variants.add(trimmed);
  }
  return [...variants];
}

/**
 * FORM_TO_MEANING — rappeler le SENS à partir de la forme arabe (saisie libre).
 * Ne renvoie rien si le mot n'a pas de sens (donnée absente → pas d'exercice).
 */
export function formToMeaning(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, difficulty } = ctx;
  if (target.meaning == null || target.meaning === "") return null;
  // Le moteur de grading existant est volontairement gelé en français pour
  // cette phase. Ne générons donc pas un exercice qui annoncerait le français
  // avec une glose EN, plutôt que de créer une contradiction pédagogique.
  if (answerLanguageForMeaning(target) !== "FR_VERIFIED") return null;

  return {
    type: "FORM_TO_MEANING",
    prompt: "Que signifie ce mot ? Écris ta réponse en français.",
    difficulty,
    options: [],
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: true,
      revealContent: target.meaning,
      freeText: true,
      freeTextLang: "fr",
      acceptedAnswers: glossVariants(target.meaning),
      answerLanguage: "FR_VERIFIED",
    },
  };
}

/**
 * MEANING_TO_FORM — retrouver la FORME arabe à partir du sens (saisie libre).
 * Ne renvoie rien si le mot n'a pas de sens.
 */
export function meaningToForm(ctx: GeneratorContext): GeneratedExercise | null {
  const { target, difficulty } = ctx;
  if (target.meaning == null || target.meaning === "") return null;

  return {
    type: "MEANING_TO_FORM",
    prompt: `« ${target.meaning} » — quel est le mot arabe ? Écris ta réponse.`,
    difficulty,
    options: [],
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: false,
      revealContent: target.arabic,
      freeText: true,
      freeTextLang: "ar",
      expectedArabic: target.arabic,
    },
  };
}
