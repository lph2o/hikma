import type { GeneratedExercise, GeneratedOption, GeneratorContext } from "../types";
import type { WordBankEntry } from "../../learning/types";
import { allPhoneticMarks, detectMarks, type PhoneticMark } from "../../learning/phonetics";

/**
 * PHONETIC_DISCRIMINATION (Phase 24H-Q2-B) — écouter le mot réel (Muallim) puis
 * identifier la caractéristique phonétique réellement présente dans la forme.
 *
 * La question n'est PAS « quel mot est-ce ? » (AUDIO_TO_WORD) mais « quelle
 * caractéristique entends-tu ? ». La bonne réponse est TOUJOURS dérivée de
 * `quran_words.arabic` via `detectMarks` (aucune donnée inventée, aucune paire
 * minimale fabriquée, aucun STT, aucun micro).
 *
 * Catalogue retenu (caractéristiques AUDIBLES, détectées de façon fiable et
 * compréhensibles par un débutant) — voir PHONETIC_DISCRIMINATION_TRAIT_ORDER.
 * Sont EXCLUSES de la discrimination à l'écoute :
 *   - `dagger_alef` : voyelle longue « ā » identique à l'oreille au madda / alef
 *     plein — c'est une distinction ORTHOGRAPHIQUE, pas un son discriminable ;
 *   - `wasla` : alif de liaison SILENCIEUX (absence de coup de glotte), notion
 *     trop fine et non audible comme « son » pour un débutant.
 *
 * Une forme ne contenant aucune des caractéristiques retenues ne produit pas
 * d'exercice (retour null) : jamais d'exercice vide ni de trait simulé.
 */

/** Ordre pédagogique (détermine la caractéristique ciblée si plusieurs présentes). */
export const PHONETIC_DISCRIMINATION_TRAIT_ORDER = [
  "hamza",
  "madda",
  "shadda",
  "sukun",
  "tanwin",
] as const;

export type PhoneticDiscriminationTraitKey =
  (typeof PHONETIC_DISCRIMINATION_TRAIT_ORDER)[number];

/** Nombre d'options par exercice (1 bonne réponse + jusqu'à 3 distracteurs). */
export const PHONETIC_DISCRIMINATION_OPTION_COUNT = 4;

/** Exposition limitée par leçon (le MVP n'ajoute pas massivement d'exercices). */
export const PHONETIC_DISCRIMINATION_MAX_PER_LESSON = 3;

/**
 * Génère un exercice de discrimination phonétique pour `target`.
 * Retourne null si : pas d'URL audio signée, OU aucune caractéristique retenue
 * réellement présente dans la forme arabe.
 */
export function phoneticDiscrimination(
  ctx: GeneratorContext,
): GeneratedExercise | null {
  const { target, difficulty, audioUrl } = ctx;
  if (!audioUrl || audioUrl === "") return null;

  const defByKey = new Map<string, PhoneticMark>(
    allPhoneticMarks().map((m) => [m.key, m]),
  );
  const present = new Set(detectMarks(target.arabic).map((m) => m.key));

  const targetKey = PHONETIC_DISCRIMINATION_TRAIT_ORDER.find((k) => present.has(k));
  if (!targetKey) return null;
  const targetMark = defByKey.get(targetKey);
  if (!targetMark) return null;

  // Distracteurs = caractéristiques retenues NON présentes dans la forme
  // (jamais un trait présent, jamais deux bonnes réponses simultanées).
  const distractors = PHONETIC_DISCRIMINATION_TRAIT_ORDER.filter(
    (k) => !present.has(k),
  )
    .slice(0, PHONETIC_DISCRIMINATION_OPTION_COUNT - 1)
    .map((k) => defByKey.get(k))
    .filter((m): m is PhoneticMark => m != null);

  // Bonne réponse en fin de liste (convention déterministe du projet).
  const optionDefs: Array<{ mark: PhoneticMark; isCorrect: boolean }> = [
    ...distractors.map((mark) => ({ mark, isCorrect: false })),
    { mark: targetMark, isCorrect: true },
  ];

  const options: GeneratedOption[] = optionDefs.map((d, i) => ({
    position: i + 1,
    content: d.mark.label,
    isCorrect: d.isCorrect,
    wordId: d.isCorrect ? target.wordId : null,
  }));

  const phoneticSymbols: Record<string, string> = {};
  for (const d of optionDefs) phoneticSymbols[d.mark.label] = d.mark.symbol;

  return {
    type: "PHONETIC_DISCRIMINATION",
    prompt: "Écoute, puis identifie la caractéristique que tu entends.",
    difficulty,
    options,
    metadata: {
      targetWordId: target.wordId,
      arabic: target.arabic,
      transliteration: target.transliteration,
      meaning: target.meaning,
      showArabic: false,
      audioUrl,
      /** Caractéristique ciblée (correcte) — symbole/libellé/explication. */
      phoneticTrait: targetMark,
      /** Libellé d'option → symbole, pour le rendu (symbole arabe + libellé latin). */
      phoneticSymbols,
    },
  };
}

/**
 * Génère, de façon déterministe et BORNÉE, les exercices de discrimination
 * d'une leçon : les premiers mots (ordre de leçon) ayant une URL audio ET une
 * caractéristique retenue, au maximum `max`.
 *
 * Utilisé par la page de leçon (24H-Q2-B) pour une exposition limitée, sans
 * modifier le séquenceur ni `DEFAULT_LESSON_EXERCISE_TYPES`.
 */
export function generatePhoneticDiscriminationSet(
  words: WordBankEntry[],
  audioByWord: Map<string, string>,
  difficulty: number,
  max: number = PHONETIC_DISCRIMINATION_MAX_PER_LESSON,
): GeneratedExercise[] {
  const out: GeneratedExercise[] = [];
  for (const target of words) {
    if (out.length >= max) break;
    const exercise = phoneticDiscrimination({
      target,
      bank: words,
      difficulty,
      audioUrl: audioByWord.get(target.wordId) ?? null,
    });
    if (exercise) out.push(exercise);
  }
  return out;
}
