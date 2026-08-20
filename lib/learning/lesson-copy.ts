// Copie de la leçon (Phase 36C) — fonctions PURES, déterministes, sans I/O.
//
// Aucune donnée n'est inventée : chaque texte dérive des données réelles
// passées en argument (contexte d'ayah, nombre de mots, nom de sourate). Ces
// fonctions n'ont aucun effet sur le grading, le scoring, le SRS, la maîtrise,
// le scheduler ou le curriculum — elles ne font que présenter la session.

import { normalizeArabicGrading } from "@/lib/exercises/grading";

/**
 * Signature Hikma « ce mot, tu le récites déjà » — affichée UNIQUEMENT lorsqu'un
 * contexte d'ayah RÉEL est disponible. Si `ayahRef` est null (contexte absent),
 * on ne montre rien : on n'invente jamais de relation mot ↔ ayah.
 */
export function getSignatureCopy(ayahRef: string | null): string | null {
  if (!ayahRef) return null;
  return `Ce mot, tu le récites peut-être déjà — il apparaît dans ${ayahRef}.`;
}

/**
 * Anticipation de session — jamais de durée fictive. Le nombre de mots vient du
 * contenu réel de la leçon ; la durée reste volontairement qualitative.
 */
export function getAnticipationCopy(wordCount: number): string {
  if (wordCount <= 0) return "Une courte session.";
  return `${wordCount} mot${wordCount > 1 ? "s" : ""} · une courte session.`;
}

/** Interstitiel d'entrée de la mini-révision. */
export function getMiniReviewIntroCopy(count: number): {
  title: string;
  message: string;
} {
  return {
    title: "Un dernier rappel ?",
    message: `${count} mot${count > 1 ? "s" : ""} mérite${count > 1 ? "nt" : ""} encore un petit rappel.`,
  };
}

/** Résumé de fin de mini-révision (micro-célébration, pas de confettis). */
export function getMiniReviewDoneCopy(count: number): {
  title: string;
  message: string;
} {
  return {
    title: "C'est bon 👏",
    message: `Tu viens de renforcer ${count} mot${count > 1 ? "s" : ""}.`,
  };
}

/**
 * Ligne de progression en fin de leçon (si le nom de sourate est connu).
 * Retourne null si le nom est absent — jamais de sourate inventée.
 */
export function getLessonProgressCopy(surahName: string | null): string | null {
  if (!surahName) return null;
  return `Tu progresses dans ${surahName}.`;
}

// ---------------------------------------------------------------------------
// Retry d'écriture arabe (Phase 36E) — renforcement LOCAL, jamais noté
// ---------------------------------------------------------------------------

/**
 * Comparaison LOCALE et STRICTEMENT CONTRÔLÉE du retry arabe. Utilisée
 * UNIQUEMENT pour afficher un encouragement local (« Bien joué ») — JAMAIS par
 * `validateAnswer`, jamais pour modifier grading/SRS/mastery. On réutilise la
 * normalisation du correcteur (présentation + variantes d'alef) en CONSERVANT
 * les diacritiques : la forme canonique complète est exigée pour féliciter.
 */
export function isArabicRewriteExact(input: string, expected: string): boolean {
  const user = normalizeArabicGrading(input);
  const exp = normalizeArabicGrading(expected);
  return user.length > 0 && exp.length > 0 && user === exp;
}

/** Interstitiel d'entrée du retry arabe. */
export function getArabicRewriteIntroCopy(count: number): {
  title: string;
  message: string;
} {
  return {
    title: "Renforçons ton arabe ✨",
    message:
      count <= 1
        ? "Tu as hésité sur un mot. Prends quelques secondes pour le réécrire."
        : `Tu as hésité sur ${count} mots. Prends quelques secondes pour les réécrire.`,
  };
}

/** Feedback d'une réécriture exacte (local, jamais noté). */
export function getArabicRewriteExactCopy(): string {
  return "Bien joué ✨ — tu viens de le réécrire de mémoire.";
}

/** Feedback d'une réécriture différente (jamais punitif). */
export function getArabicRewriteMismatchCopy(): string {
  return "Pas encore — c'est justement ce qu'on veut renforcer. La forme correcte est :";
}

/** Feedback d'une réécriture vide (jamais bloquant, jamais punitif). */
export function getArabicRewriteEmptyCopy(): string {
  return "Pas de souci — voici la forme à retenir :";
}

/** Réassurance : cette tentative est locale, jamais notée. */
export function getArabicRewriteReassuranceCopy(): string {
  return "Cette tentative ne change pas ton score.";
}

/** Interstitiel combiné retry arabe + mini-révision (quand les deux coexistent). */
export function getCombinedMiniReviewIntroCopy(
  arabicCount: number,
  selfCount: number,
): { title: string; message: string } {
  if (arabicCount > 0 && selfCount > 0) {
    return {
      title: "Un dernier renforcement",
      message: `${arabicCount} mot${arabicCount > 1 ? "s" : ""} à réécrire et ${selfCount} à revoir.`,
    };
  }
  if (arabicCount > 0) return getArabicRewriteIntroCopy(arabicCount);
  return getMiniReviewIntroCopy(selfCount);
}
