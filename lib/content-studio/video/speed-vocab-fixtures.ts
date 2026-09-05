// Hikma — FIXTURE SPEED VOCAB (valeurs RÉELLES gelées, sonde du 2026-09-04).
// Sélection déterministe du service buildSpeedVocab : candidats (glose FORME
// fr validée) id ASC → occurrences DESC → 5 premiers. Chaque entrée provient
// des tables Hikma (quran_words, word_translations, word_occurrences COUNT
// exact). Utilisé par les tests et la démo quand la DB n'est pas joignable —
// jamais inventé.

import { LICENSES_V1, RENDER_V1 } from "@/lib/content-api/banks";
import type { SpeedVocabPayloadV1 } from "@/lib/content-api/speed-vocab-types";

export const SPEED_VOCAB_FIXTURE: SpeedVocabPayloadV1 = {
  // sha256-v1 réel (computeContentKey : wordId|template|version|hookVariant|lang)
  // avec hookVariantId = wordIds triés — même formule que buildSpeedVocab.
  contentKey: "2ce3a132e94c8f8c39c8b88a3aaeb54ebf29f45e6db7c60b5110db1bbb943828",
  templateKey: "VOCAB_SPEED_RUN_V1",
  templateVersion: "1",
  language: "fr",
  status: "GENERATED",
  words: [
    {
      wordId: "00e8fa7d-6e4b-4047-a21e-5ed2be85ab04",
      arabic: "ٱللَّهَ",
      transliteration: "l-laha",
      meaning: "Allah / Dieu (acc.)",
      meaningSource: "FORME",
      meaningSourceId: "f8595ed5-1c15-4802-be1c-7531fcb2aa8d",
      occurrenceCount: 567,
    },
    {
      wordId: "006d0cd1-595c-4899-aaf3-dbf275381270",
      arabic: "عَن",
      transliteration: "ʿan",
      meaning: "au sujet de",
      meaningSource: "FORME",
      meaningSourceId: "dd562671-dbc1-4797-81ba-83e3cfdd15de",
      occurrenceCount: 115,
    },
    {
      wordId: "03075dab-fbac-41f6-a43b-0581ad038076",
      arabic: "عِندَ",
      transliteration: "ʿinda",
      meaning: "auprès de / chez",
      meaningSource: "FORME",
      meaningSourceId: "b2491f04-3a41-442d-a3a9-4813cbc7b31e",
      occurrenceCount: 98,
    },
    {
      wordId: "00753602-644d-44bf-8394-fde9e9905338",
      arabic: "لَكَ",
      transliteration: "laka",
      meaning: "à toi",
      meaningSource: "FORME",
      meaningSourceId: "98f4122f-abbb-488e-b96c-fcb94b9e94b6",
      occurrenceCount: 55,
    },
    {
      wordId: "01148af7-b8d3-4af0-b38a-0b694f29d8c6",
      arabic: "عَنْهُمْ",
      transliteration: "ʿanhum",
      meaning: "d'eux / de leur part",
      meaningSource: "FORME",
      meaningSourceId: "207d7464-9958-4522-b1d5-e616e85d0277",
      occurrenceCount: 43,
    },
  ],
  hookVariant: { id: "HOOK_H2", version: 1 },
  cta: {
    id: "CTA_LEARN_02",
    version: 1,
    funnelStage: "CURIOSITY",
    text: "Découvre le prochain mot avec Hikma.",
  },
  caption: {
    text: "ٱللَّهَ · عَن · عِندَ · لَكَ · عَنْهُمْ — 5 mots coraniques en 60 secondes.",
    language: "fr",
    hashtags: ["#hikma", "#vocabulairecoranique", "#coran", "#apprendrelarabe"],
  },
  licenses: LICENSES_V1,
  sources: {
    wordId: "00e8fa7d-6e4b-4047-a21e-5ed2be85ab04",
    meaningSourceIds: [
      "f8595ed5-1c15-4802-be1c-7531fcb2aa8d",
      "dd562671-dbc1-4797-81ba-83e3cfdd15de",
      "b2491f04-3a41-442d-a3a9-4813cbc7b31e",
      "98f4122f-abbb-488e-b96c-fcb94b9e94b6",
      "207d7464-9958-4522-b1d5-e616e85d0277",
    ],
    meaningSourceTable: "word_translations",
    ayahId: null,
  },
  render: RENDER_V1,
};
