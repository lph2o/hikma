// Hikma — FIXTURE RÉFÉRENCE (valeurs RÉELLES gelées B3-FINAL : يَوْمَ).
// Ces valeurs proviennent de la DB Hikma (wordId fc581cb3-…, occurrenceCount
// 131, digest contentKey 1f419c…). Utilisées par les tests du pipeline et par
// le script de rendu lorsque la DB n'est pas joignable — jamais inventées.

import { LICENSES_V1, RENDER_V1 } from "@/lib/content-api/banks";
import type { RevealPayloadV1 } from "@/lib/content-api/types";

export const FIXTURE_WORD_ID = "fc581cb3-8d05-410f-9373-a428c8d17e57";
export const FIXTURE_ARABIC = "يَوْمَ";
export const FIXTURE_CONTENT_KEY =
  "1f419cf7aac14afe30f1a0afc5b7a73b14aa9dfa1a4f0ad1ab843caafc03df60";

export const REVEAL_FIXTURE_YAWMA: RevealPayloadV1 = {
  contentKey: FIXTURE_CONTENT_KEY,
  templateKey: "WORD_REVEAL_V1",
  templateVersion: "1",
  language: "fr",
  status: "GENERATED",
  word: {
    id: FIXTURE_WORD_ID,
    arabic: FIXTURE_ARABIC,
    transliteration: "yawma",
    lemmaId: null,
  },
  meaning: {
    text: "jour",
    sourceType: "FORME",
    sourceId: "wt-row-2",
    validated: true,
    validatedAt: "2026-08-20T00:00:00.000+00:00",
  },
  explanation: null,
  occurrenceCount: 131,
  firstOccurrence: {
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayahNumber: 113,
    excerptUthmani: "ٱلْقِيَـٰمَةِ يَوْمَ",
    verseTranslationFr: null,
  },
  quiz: null,
  series: null,
  hookVariant: { id: "HOOK_H1", version: 1 },
  cta: {
    id: "CTA_LEARN_01",
    version: 1,
    funnelStage: "LEARNING",
    text: "Apprends un mot coranique à la fois.",
  },
  caption: {
    text: "« يَوْمَ » apparaît 131 fois dans le Coran — signifie jour.",
    language: "fr",
    hashtags: ["#hikma", "#vocabulairecoranique", "#coran", "#apprendrelarabe"],
  },
  licenses: LICENSES_V1,
  sources: {
    wordId: FIXTURE_WORD_ID,
    meaningSourceId: "wt-row-2",
    meaningSourceTable: "word_translations",
    lemmaSourceId: null,
    explanationSourceId: null,
    ayahId: "a-2113",
  },
  render: RENDER_V1,
};
