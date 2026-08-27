import { describe, expect, it } from "vitest";
import {
  deriveOptionConfidence,
  validateArabicIdentity,
  validateArabicUnaltered,
  validateCta,
  validateFirstOccurrence,
  validateLicenses,
  validateMeaning,
  validateOccurrenceCount,
  validateQuizBlock,
  validateRender,
  validateRevealPayloadV1,
} from "../lib/content-api/validators";
import { LICENSES_V1, RENDER_V1 } from "../lib/content-api/banks";
import type { QuizBlock } from "../lib/content-api/types";

const GOOD_MEANING = {
  text: "jour",
  sourceType: "FORME" as const,
  sourceId: "wt-row-2",
  validated: true as const,
  validatedAt: "2026-08-19T16:16:09.217+00:00",
};

const goodRevealBase = () => ({
  contentKey: "1f419cf7aac14afe30f1a0afc5b7a73b14aa9dfa1a4f0ad1ab843caafc03df60",
  templateKey: "WORD_REVEAL_V1" as const,
  status: "GENERATED",
  word: { arabic: "يَوْمَ" },
  meaning: { ...GOOD_MEANING },
  occurrenceCount: 131,
  firstOccurrence: {
    surahNumber: 2,
    surahName: "Al-Baqarah",
    ayahNumber: 113,
    excerptUthmani: "…يَوْمَ ٱلْقِيَـٰمَةِ…",
    verseTranslationFr: null,
  },
  quiz: null as null,
  licenses: { ...LICENSES_V1 },
  sources: { ayahId: "a42b8c0a-bcff-420a-9cf6-2027011a91bf" },
  render: JSON.parse(JSON.stringify(RENDER_V1)),
  cta: null as null,
});

describe("validateMeaning", () => {
  it("accepte une glose FR validée avec sourceId réel", () => {
    expect(validateMeaning({ ...GOOD_MEANING }).ok).toBe(true);
  });

  it("NO_VALIDATED_MEANING — glose absente / non validée / vide", () => {
    expect(validateMeaning(null).ok).toBe(false);
    expect(validateMeaning({ ...GOOD_MEANING, validated: false }).ok).toBe(false);
    expect(validateMeaning({ ...GOOD_MEANING, text: "" }).ok).toBe(false);
  });

  it("FALLBACK_EN — resolver isFallback OU langue étrangère détectée", () => {
    expect(
      validateMeaning({ ...GOOD_MEANING, isFallback: true }).ok,
    ).toBe(false);
    // (isFallback est un flag externe honnête ; le champ language explicite aussi)
    expect(
      validateMeaning({ ...GOOD_MEANING, language: "en" } as never).ok,
    ).toBe(false);
  });

  it("INVENTED_METADATA — sourceType invalide ou sourceId manquant", () => {
    expect(validateMeaning({ ...GOOD_MEANING, sourceType: "AUTRE" }).ok).toBe(false);
    expect(validateMeaning({ ...GOOD_MEANING, sourceId: "" }).ok).toBe(false);
  });
});

describe("identity & faits", () => {
  it("MISSING_ARABIC", () => {
    expect(validateArabicIdentity(undefined).ok).toBe(false);
    expect(validateArabicIdentity("").ok).toBe(false);
  });

  it("ARABIC_ALTERED — tout écart vs valeur DB", () => {
    expect(validateArabicUnaltered("يوم", "يَوْمَ").ok).toBe(false); // diacritiques supprimés = altéré
    expect(validateArabicUnaltered("يَوْمَ ", "يَوْمَ").ok).toBe(false); // trim interdit
    expect(validateArabicUnaltered("يَوْمَ", "يَوْمَ").ok).toBe(true);
  });

  it("INVENTED_METADATA — occurrenceCount non entier/0/négatif", () => {
    expect(validateOccurrenceCount(131).ok).toBe(true);
    expect(validateOccurrenceCount(130.5).ok).toBe(false);
    expect(validateOccurrenceCount(0).ok).toBe(false);
    expect(validateOccurrenceCount(-1).ok).toBe(false);
  });

  it("LICENSE_BLOCKED — verseTranslationFr doit rester null en V1", () => {
    expect(validateFirstOccurrence(goodRevealBase().firstOccurrence).ok).toBe(true);
    expect(
      validateFirstOccurrence({
        ...goodRevealBase().firstOccurrence,
        verseTranslationFr: { text: "Et les Juifs disent…", translator: "Muhammad Hamidullah" },
      }).ok,
    ).toBe(false);
  });

  it("LICENSE_BLOCKED — licenses doivent être verrouillées V1", () => {
    expect(validateLicenses(LICENSES_V1).ok).toBe(true);
    expect(
      validateLicenses({ ...LICENSES_V1, audio: "SAFE" }).ok,
    ).toBe(false);
    expect(
      validateLicenses({ ...LICENSES_V1, verseTranslation: "SAFE" }).ok,
    ).toBe(false);
  });

  it("INVENTED_METADATA — render ≠ bloc contractuel", () => {
    expect(validateRender(RENDER_V1).ok).toBe(true);
    expect(validateRender({ ...RENDER_V1, fps: 60 }).ok).toBe(false);
  });
});

describe("validateRevealPayloadV1", () => {
  it("payload conforme → GENERATED accepté", () => {
    expect(
      validateRevealPayloadV1(goodRevealBase() as never, {
        expectedArabicFromDb: "يَوْمَ",
      }),
    ).toEqual({ ok: true });
  });

  it("UNKNOWN_TEMPLATE", () => {
    expect(
      validateRevealPayloadV1(
        { ...goodRevealBase(), templateKey: "STORY_V1" } as never,
        { expectedArabicFromDb: "يَوْمَ" },
      ),
    ).toMatchObject({ ok: false, code: "UNKNOWN_TEMPLATE" });
  });

  it("DUPLICATE_KEY sur contentKey déjà vu + format sha256-v1 vérifié", () => {
    const p = goodRevealBase();
    expect(
      validateRevealPayloadV1(p as never, {
        expectedArabicFromDb: "يَوْمَ",
        seenContentKeys: new Set([p.contentKey]),
      }),
    ).toMatchObject({ ok: false, code: "DUPLICATE_KEY" });
    expect(
      validateRevealPayloadV1(
        { ...p, contentKey: "pas-un-sha256" } as never,
        { expectedArabicFromDb: "يَوْمَ" },
      ),
    ).toMatchObject({ ok: false, code: "DUPLICATE_KEY" });
  });

  it("INVENTED_METADATA — sources.ayahId requis pour WORD_REVEAL (R1)", () => {
    expect(
      validateRevealPayloadV1(
        { ...goodRevealBase(), sources: { ayahId: null } } as never,
        { expectedArabicFromDb: "يَوْمَ" },
      ),
    ).toMatchObject({ ok: false, code: "INVENTED_METADATA" });
  });
});

describe("quiz validators", () => {
  const channels = new Map<string, "FORME" | "LEMME">([
    ["w-target", "FORME"],
    ["d-1", "FORME"],
    ["d-2", "LEMME"],
    ["d-3", "FORME"],
  ]);

  it("options VERIFIED/PARTIAL issues du canal réel — UNKNOWN dérivé si wordId absent", () => {
    expect(deriveOptionConfidence("w-target", channels)).toBe("VERIFIED");
    expect(deriveOptionConfidence("d-2", channels)).toBe("PARTIAL");
    expect(deriveOptionConfidence("inconnu", channels)).toBe("UNKNOWN");
    expect(deriveOptionConfidence(null, channels)).toBe("UNKNOWN");
  });

  const goodQuiz = (): QuizBlock => ({
    question: "Que signifie ce mot ?",
    options: [
      { content: "journée", isCorrect: false, confidence: "VERIFIED" as const },
      { content: "nuit", isCorrect: false, confidence: "VERIFIED" as const },
      { content: "ciel", isCorrect: false, confidence: "PARTIAL" as const },
      { content: "jour", isCorrect: true, confidence: "VERIFIED" as const },
    ],
  });

  it("quiz conforme accepté", () => {
    expect(validateQuizBlock(goodQuiz())).toEqual({ ok: true });
  });

  it("QUIZ_SHAPE — pas 4 options / doublon / plusieurs correctes", () => {
    const three = goodQuiz();
    three.options.pop();
    expect(validateQuizBlock(three)).toMatchObject({ ok: false, code: "QUIZ_SHAPE" });

    const dup = goodQuiz();
    dup.options[1] = { ...dup.options[0], isCorrect: false, confidence: "VERIFIED" };
    expect(validateQuizBlock(dup)).toMatchObject({ ok: false, code: "QUIZ_SHAPE" });

    const twoCorrect = goodQuiz();
    twoCorrect.options[0].isCorrect = true;
    expect(validateQuizBlock(twoCorrect)).toMatchObject({ ok: false, code: "QUIZ_SHAPE" });
  });

  it("UNKNOWN_DISTRACTOR — jamais publiable en P0", () => {
    const q = goodQuiz();
    q.options[0].confidence = "UNKNOWN";
    expect(validateQuizBlock(q)).toMatchObject({ ok: false, code: "UNKNOWN_DISTRACTOR" });
  });
});

describe("CTA_INVALID — structure CTA non conforme", () => {
  it("null/absent accepté (formats engagement sans CTA)", () => {
    expect(validateCta(null)).toEqual({ ok: true });
    expect(validateCta(undefined)).toEqual({ ok: true });
  });

  it("CTA complet accepté", () => {
    expect(
      validateCta({
        id: "CTA_LEARN_01",
        version: 1,
        funnelStage: "LEARNING",
        text: "Apprends un mot coranique à la fois.",
      }),
    ).toEqual({ ok: true });
  });

  it("CTA_INVALID — structure incomplète ou funnelStage vide", () => {
    expect(validateCta({ id: "CTA_LEARN_01" })).toMatchObject({
      ok: false,
      code: "CTA_INVALID",
    });
    expect(
      validateCta({
        id: "CTA_LEARN_01",
        version: 1,
        funnelStage: "",
        text: "Apprends un mot coranique à la fois.",
      }),
    ).toMatchObject({ ok: false, code: "CTA_INVALID" });
  });
});
