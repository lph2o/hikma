// Hikma Content Studio — BANQUES ÉDITORIALES V1 + constantes de licence/render.
//
// ⚠️ STATUT GELÉ (B3-FINAL §8) :
//   EDITORIAL_APPROVAL_REQUIRED_BEFORE_PRODUCTION
// Les textes ci-dessous sont techniquement consommables par Phase A mais
// NE SONT PAS éditorialement APPROVED. Ils sont PROPOSED_V1_EDITORIAL_BANK.

import type {
  FunnelStage,
  HookVariantRef,
  LicensesBlock,
  RenderBlock,
} from "./types";

export const EDITORIAL_BANK_STATUS =
  "EDITORIAL_APPROVAL_REQUIRED_BEFORE_PRODUCTION" as const;

/** Banque HOOKS V1 — {count} alimenté EXCLUSIVEMENT par occurrenceCount réel. */
export const HOOKS_V1 = {
  HOOK_H1: { version: 1, textTemplate: "Ce mot apparaît {count} fois dans le Coran." },
  HOOK_H2: { version: 1, textTemplate: "Tu connais ce mot en arabe ?" },
  HOOK_H3: { version: 1, textTemplate: "Un mot coranique à retenir aujourd'hui." },
} as const;

export type HookIdV1 = keyof typeof HOOKS_V1;

const HOOK_IDS = new Set<string>(Object.keys(HOOKS_V1));

/** Rend un hook avec la seule variable autorisée ; rejette tout id inconnu. */
export function renderHookText(
  id: HookIdV1,
  count: number,
): { ref: HookVariantRef; text: string } {
  const h = HOOKS_V1[id];
  return {
    ref: { id, version: h.version },
    text: h.textTemplate.replace("{count}", String(count)),
  };
}

export function isKnownHookId(id: string): id is HookIdV1 {
  return HOOK_IDS.has(id);
}

/** Banque CTA V1 (CTA_SOFT_01 officiellement supprimé par B3-FINAL). */
export const CTAS_V1 = {
  CTA_LEARN_01: { version: 1, funnelStage: "LEARNING", text: "Apprends un mot coranique à la fois." },
  CTA_LEARN_02: { version: 1, funnelStage: "CURIOSITY", text: "Découvre le prochain mot avec Hikma." },
  CTA_FOLLOW_01: { version: 1, funnelStage: "ENGAGEMENT", text: "Suis Hikma pour découvrir la suite." },
} satisfies Record<string, { version: 1; funnelStage: FunnelStage; text: string }>;

export type CtaIdV1 = keyof typeof CTAS_V1;

const CTA_IDS = new Set<string>(Object.keys(CTAS_V1));

export function isKnownCtaId(id: string): id is CtaIdV1 {
  return CTA_IDS.has(id);
}

/** CTA par défaut par template (engagement formats : pas de CTA ⇒ null). */
export const DEFAULT_CTA_BY_TEMPLATE = {
  WORD_QUIZ_V1: null,
  WORD_REVEAL_V1: "CTA_LEARN_01",
  FREQUENCY_FACT_V1: "CTA_LEARN_02",
} as const;

/** Hook par défaut par template (association technique V1, non APPROVED). */
export const DEFAULT_HOOK_BY_TEMPLATE = {
  WORD_QUIZ_V1: "HOOK_H2",
  WORD_REVEAL_V1: "HOOK_H1",
  FREQUENCY_FACT_V1: "HOOK_H1",
} as const;

/** Hashtags séparés du contenu pédagogique (B3 §19). */
export const HASHTAGS_FR = [
  "#hikma",
  "#vocabulairecoranique",
  "#coran",
  "#apprendrelarabe",
] as const;

/**
 * Caption dérivée STRICTEMENT de données validées (zéro paraphrase).
 * Gelée sur le modèle de l'exemple B3 (يَوْمَ).
 */
export function buildCaptionText(
  arabic: string,
  occurrenceCount: number,
  glossFr: string,
): string {
  return `« ${arabic} » apparaît ${occurrenceCount} fois dans le Coran — signifie ${glossFr}.`;
}

/** Bloc licences V1 — verrouillé au statut légal actuel (Hamidullah review). */
export const LICENSES_V1: LicensesBlock = {
  verseTranslation: "REVIEW_REQUIRED",
  audio: "DISABLED",
  dataset: "SAFE",
  assets: "SAFE",
};

/** Bloc render contractuel V1 — NON configurable (Phase A §28). */
export const RENDER_V1: RenderBlock = {
  width: 1080,
  height: 1920,
  fps: 30,
  aspectRatio: "9:16",
  safeZones: { topPx: 160, bottomPx: 220, rightRailPx: 140 },
  audioDisabled: true,
};
