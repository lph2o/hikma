import type { WordBankEntry, WordContextData, WordLemmaData } from "@/lib/learning";
import type { LinguisticEvidence } from "@/lib/linguistic/explanation";
import type { RecallGrade } from "./grading";

/** Les 14 types d'exercices (reconnaissance + rappel libre + audio + contexte + lemme + phonétique). */
export type ExerciseType =
  | "WORD_TO_TRANSLATION"
  | "TRANSLATION_TO_WORD"
  | "MULTIPLE_CHOICE"
  | "WORD_RECOGNITION"
  | "AUDIO_TO_WORD"
  | "WORD_TO_AUDIO"
  | "COMPLETE_WORD"
  | "REVERSE_TRANSLATION"
  | "FORM_TO_MEANING"
  | "MEANING_TO_FORM"
  | "CONTEXT_RECOGNITION"
  | "LEMMA_RELATION"
  | "PRONUNCIATION_GUIDED"
  | "PHONETIC_DISCRIMINATION";

/** Option de réponse d'un exercice généré. */
export type GeneratedOption = {
  position: number;
  content: string;
  isCorrect: boolean;
  wordId: string | null;
  /** Relation pédagogique du distracteur ; UNKNOWN est honnête par défaut. */
  confidence?: "VERIFIED" | "PARTIAL" | "UNKNOWN";
};

export type AnswerLanguage = "FR_VERIFIED" | "EN_VERIFIED" | "UNKNOWN";
export type TranslationExposure = "SAFE_CONTEXT" | "REVEAL_RISK" | "UNKNOWN";

/** Exercice généré (même forme que les tables exercises + exercise_options). */
export type GeneratedExercise = {
  /** Identité UI optionnelle, sans rôle dans le grading ou la progression. */
  id?: string;
  type: ExerciseType;
  prompt: string;
  difficulty: number;
  options: GeneratedOption[];
  metadata: {
    targetWordId: string;
    arabic: string | null;
    transliteration: string | null;
    meaning: string | null;
    /** Si true, l'UI doit afficher le mot arabe (Amiri) en tête d'exercice. */
    showArabic?: boolean;
    /** Réponse à révéler (rappel libre) — la bonne réponse, jamais simulée. */
    revealContent?: string;
    /** true si l'exercice attend une réponse TEXTE LIBRE (non des options). */
    freeText?: boolean;
    /** Langue de la réponse libre attendue. */
    freeTextLang?: "fr" | "ar";
    /** Formulations françaises acceptées (FORM_TO_MEANING), déjà variantes. */
    acceptedAnswers?: string[];
    /** Forme arabe attendue (MEANING_TO_FORM). */
    expectedArabic?: string;
    /** Contexte du verset réel (CONTEXT_RECOGNITION). */
    context?: WordContextData | null;
    /** Relation forme → lemme (LEMMA_RELATION). */
    lemma?: WordLemmaData;
    /** URL audio signée déjà résolue côté serveur, si elle existe. */
    audioUrl?: string | null;
    /** Glose française validée au niveau du lemme, si elle existe. */
    lemmaMeaning?: string | null;
    /** Le sens exposé est issu d'une glose validée. */
    meaningValidated?: boolean;
    /**
     * Explication pédagogique de sens VALIDÉE (Phase 44B), résolue pour ce mot
     * (générique, ou override contextuel si l'occurrence du verset est couverte).
     * Couche passive d'EXPLICATION : aucun effet sur le grading, le SRS, la
     * mastery, le coverage, le curriculum ni la génération. null = aucune
     * explication disponible (jamais d'explication fabriquée).
     */
    senseExplanation?: string | null;
    /** Évidence linguistique MASAQ (brute) — couche d'EXPLICATION uniquement. */
    linguisticEvidence?: LinguisticEvidence | null;
    /** Langue réellement disponible pour un rappel de sens. */
    answerLanguage?: AnswerLanguage;
    /** État de confiance de la détection de fuite du contexte. */
    translationExposure?: TranslationExposure;
    [key: string]: unknown;
  };
};

/** Contexte fourni à un générateur. */
export type GeneratorContext = {
  /** Mot ciblé par l'exercice. */
  target: WordBankEntry;
  /** Ensemble des mots disponibles (cible + distracteurs potentiels). */
  bank: WordBankEntry[];
  difficulty: number;
  /** URL audio signée du mot cible (null/absent → exercices audio indisponibles). */
  audioUrl?: string | null;
  /** Contexte du verset réel du mot cible (null/absent → CONTEXT_RECOGNITION indisponible). */
  context?: WordContextData | null;
  /** Relation forme → lemme du mot cible (null/absent → LEMMA_RELATION indisponible). */
  lemma?: WordLemmaData | null;
};

/** Générateur : retourne null si le type n'est pas exploitable (ex. audio absent). */
export type ExerciseGenerator = (ctx: GeneratorContext) => GeneratedExercise | null;

/** Réponse utilisateur à un exercice. */
export type ExerciseAnswer = {
  /** Index de l'option choisie (optionnel si content fourni). */
  optionIndex?: number;
  /** Contenu exact de l'option choisie, ou réponse libre (rappel). */
  content?: string;
};

/** Résultat de validation d'une réponse. */
export type AnswerResult = {
  correct: boolean;
  /**
   * Issue de la notation du RAPPEL libre : CORRECT / INCORRECT / AMBIGUOUS.
   * Absent pour les QCM (options), dont la correction est binaire.
   */
  status?: RecallGrade;
  /** L'option correcte (null si l'exercice n'en a pas — rappel libre, auto-évaluation). */
  correctOption: GeneratedOption | null;
  /** Explication courte affichée après une erreur. */
  explanation: string | null;
};

/** Rapport de validation structurelle d'un exercice généré. */
export type ExerciseValidationIssue = {
  code: string;
  message: string;
};

export type ExerciseValidationReport = {
  valid: boolean;
  issues: ExerciseValidationIssue[];
};
