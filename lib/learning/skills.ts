// Compétences pédagogiques (Phase 23B §4) — le cœur du moteur de maîtrise
// multi-dimensionnel. Une compétence = ce que l'utilisateur sait FAIRE sur un
// mot, indépendamment du simple « bon/mauvais QCM ».
//
// La distinction fondamentale entre RECONNAISSANCE (choisir parmi des options)
// et RAPPEL/PRODUCTION (retrouver sans aide) est portée par les compétences
// form_to_meaning / meaning_to_form, distinctes de la reconnaissance.

import type { ExerciseType } from "@/lib/exercises";

export const SKILLS = [
  "form_recognition",
  "meaning_recognition",
  "form_to_meaning",
  "meaning_to_form",
  "audio_recognition",
  "context_recognition",
  "lemma_relation",
  "retention",
] as const;

/** Une des 8 compétences de maîtrise. */
export type Skill = (typeof SKILLS)[number];

/** Libellés français (UI / rapports). */
export const SKILL_LABELS: Record<Skill, string> = {
  form_recognition: "Reconnaître la forme arabe",
  meaning_recognition: "Reconnaître la signification",
  form_to_meaning: "Rappeler le sens (forme → sens)",
  meaning_to_form: "Retrouver la forme (sens → forme)",
  audio_recognition: "Reconnaître à l'écoute",
  context_recognition: "Comprendre dans le verset",
  lemma_relation: "Relier les formes d'un même lemme",
  retention: "Retenir dans le temps",
};

/**
 * Ordre pédagogique d'introduction des compétences (du plus guidé au plus
 * exigeant). Utilisé par le séquenceur pour ne jamais commencer par la
 * production libre.
 */
export const SKILL_ORDER: Skill[] = [
  "meaning_recognition",
  "form_recognition",
  "form_to_meaning",
  "meaning_to_form",
  "audio_recognition",
  "context_recognition",
  "lemma_relation",
  "retention",
];

/**
 * Compétence ciblée par un type d'exercice (null si le type ne cible aucune
 * compétence de maîtrise — cas de l'auto-évaluation non notée).
 *
 * Mapping (audit réel des 8 générateurs + 2 nouveaux rappels) :
 *   - WORD_TO_TRANSLATION  : forme → CHOISIR le sens        → meaning_recognition ;
 *   - TRANSLATION_TO_WORD  : sens(+indice) → CHOISIR arabe  → form_recognition ;
 *   - REVERSE_TRANSLATION  : sens seul → CHOISIR arabe      → form_recognition ;
 *   - MULTIPLE_CHOICE      : forme → CHOISIR translittération → form_recognition ;
 *   - COMPLETE_WORD        : forme → compléter le sens      → meaning_recognition ;
 *   - WORD_RECOGNITION     : auto-évaluation (non notée)    → null ;
 *   - FORM_TO_MEANING      : forme → RAPPELER le sens       → form_to_meaning ;
 *   - MEANING_TO_FORM      : sens → RAPPELER la forme       → meaning_to_form ;
 *   - AUDIO_TO_WORD        : audio → identifier le mot      → audio_recognition ;
 *   - WORD_TO_AUDIO        : forme → vérifier à l'écoute    → audio_recognition.
 */
export function skillForExerciseType(type: ExerciseType): Skill | null {
  switch (type) {
    case "WORD_TO_TRANSLATION":
    case "COMPLETE_WORD":
      return "meaning_recognition";
    case "TRANSLATION_TO_WORD":
    case "REVERSE_TRANSLATION":
    case "MULTIPLE_CHOICE":
      return "form_recognition";
    case "FORM_TO_MEANING":
      return "form_to_meaning";
    case "MEANING_TO_FORM":
      return "meaning_to_form";
    case "AUDIO_TO_WORD":
    case "WORD_TO_AUDIO":
    case "PHONETIC_DISCRIMINATION":
      return "audio_recognition";
    case "CONTEXT_RECOGNITION":
      return "context_recognition";
    case "LEMMA_RELATION":
      return "lemma_relation";
    case "WORD_RECOGNITION":
    case "PRONUNCIATION_GUIDED":
      // Auto-évaluation non notée : aucune compétence de maîtrise (Q1 n'a pas
      // de verdict objectif de prononciation — cf. 24H-Q).
      return null;
  }
}

/** Compétences de RECONNAISSANCE (choix parmi options) — les moins exigeantes. */
export const RECOGNITION_SKILLS: readonly Skill[] = [
  "meaning_recognition",
  "form_recognition",
];

/** Compétences de RAPPEL / PRODUCTION (retrouver sans aide). */
export const RECALL_SKILLS: readonly Skill[] = [
  "form_to_meaning",
  "meaning_to_form",
];
