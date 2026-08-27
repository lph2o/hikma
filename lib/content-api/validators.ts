// Hikma Content Studio — VALIDATEURS V1 (purs, sans I/O).
//
// Politique figée B3 §25 : REJECT OVER GUESS. Un seul validateur en échec ⇒
// payload REJECTED. Aucun "best effort", aucune valeur inventée.

import type {
  FirstOccurrenceBlock,
  LicensesBlock,
  MeaningBlock,
  QuizBlock,
  QuizOptionBlock,
  RejectCode,
} from "./types";

export type ValidatorResult =
  | { ok: true }
  | { ok: false; code: RejectCode; message: string };

const ok: ValidatorResult = { ok: true };

function reject(code: RejectCode, message: string): ValidatorResult {
  return { ok: false, code, message };
}

// ---------------------------------------------------------------------------
// Blocs élémentaires
// ---------------------------------------------------------------------------

export function validateMeaning(m: unknown): ValidatorResult {
  if (typeof m !== "object" || m === null) return reject("NO_VALIDATED_MEANING", "meaning absent");
  const r = m as Partial<MeaningBlock>;
  if (r.validated !== true) return reject("NO_VALIDATED_MEANING", "meaning.validated !== true");
  // FALLBACK_EN : jamais de canal anglais/fallback dans une réponse FR.
  if ((r as { isFallback?: boolean }).isFallback === true) return reject("FALLBACK_EN", "resolver isFallback");
  if (typeof r.text !== "string" || r.text.trim() === "") return reject("NO_VALIDATED_MEANING", "glose vide");
  if (r.sourceType !== "FORME" && r.sourceType !== "LEMME")
    return reject("INVENTED_METADATA", "sourceType hors contrat");
  if (typeof r.sourceId !== "string" || r.sourceId.length === 0)
    return reject("INVENTED_METADATA", "sourceId manquant — TASK A1 obligatoire");
  if ("language" in r && r.language !== undefined)
    return reject("FALLBACK_EN", "champ language interdit sur meaning FR");
  if (
    typeof r.validatedAt !== "string" &&
    r.validatedAt !== null
  )
    return reject("INVENTED_METADATA", "validatedAt non string|null");
  return ok;
}

export function validateArabicIdentity(arabic: unknown): ValidatorResult {
  if (typeof arabic !== "string") return reject("MISSING_ARABIC", "arabic absent");
  if (arabic.trim() === "") return reject("MISSING_ARABIC", "arabic vide");
  if (/[\u0000-\u001f\u007f]/.test(arabic))
    return reject("ARABIC_ALTERED", "caractères de contrôle détectés");
  return ok;
}

/**
 * ARABIC_ALTERED par comparaison à la valeur DB attendue. Le service injecte
 * la ligne DB elle-même, donc l'égalité est vérifiée par construction ;
 * ce validateur existe pour être testable contre toute altération future
 * (normalisation Unicode, trim, remplacement de diacritiques…).
 */
export function validateArabicUnaltered(actual: string, expectedDbValue: string): ValidatorResult {
  return actual === expectedDbValue
    ? ok
    : reject("ARABIC_ALTERED", "l'arabe retourné diffère de quran_words.arabic");
}

export function validateOccurrenceCount(n: unknown): ValidatorResult {
  if (!Number.isInteger(n) || (n as number) <= 0)
    return reject("INVENTED_METADATA", `occurrenceCount non entier positif (${String(n)})`);
  return ok;
}

export function validateFirstOccurrence(fo: unknown): ValidatorResult {
  if (typeof fo !== "object" || fo === null) return reject("INVENTED_METADATA", "firstOccurrence absent");
  const f = fo as Partial<FirstOccurrenceBlock>;
  if (!Number.isInteger(f.surahNumber) || (f.surahNumber as number) < 1 || (f.surahNumber as number) > 114)
    return reject("INVENTED_METADATA", "surahNumber hors 1..114");
  if (!Number.isInteger(f.ayahNumber) || (f.ayahNumber as number) < 1)
    return reject("INVENTED_METADATA", "ayahNumber invalide");
  if (typeof f.excerptUthmani !== "string" || f.excerptUthmani.trim() === "")
    return reject("INVENTED_METADATA", "excerptUthmani vide");
  if (f.verseTranslationFr !== null && typeof f.verseTranslationFr !== "undefined")
    return reject("LICENSE_BLOCKED", "verseTranslationFr doit rester null (Hamidullah REVIEW_REQUIRED)");
  return ok;
}

export function validateLicenses(l: unknown): ValidatorResult {
  if (typeof l !== "object" || l === null) return reject("LICENSE_BLOCKED", "licenses absent");
  const b = l as Partial<LicensesBlock>;
  if (b.audio !== "DISABLED") return reject("LICENSE_BLOCKED", "audio doit être DISABLED en V1");
  if (b.verseTranslation !== "REVIEW_REQUIRED")
    return reject("LICENSE_BLOCKED", "verseTranslation verrouillé REVIEW_REQUIRED en V1");
  if (b.dataset !== "SAFE" || b.assets !== "SAFE")
    return reject("LICENSE_BLOCKED", "dataset/assets doivent être SAFE");
  return ok;
}

export function validateRender(r: unknown): ValidatorResult {
  const expected = JSON.stringify({
    width: 1080, height: 1920, fps: 30, aspectRatio: "9:16",
    safeZones: { topPx: 160, bottomPx: 220, rightRailPx: 140 },
    audioDisabled: true,
  });
  if (JSON.stringify(r) !== expected)
    return reject("INVENTED_METADATA", "render ne respecte pas le bloc contractuel gelé");
  return ok;
}

export function validateCta(cta: unknown): ValidatorResult {
  if (cta === null || cta === undefined) return ok;
  const c = cta as Partial<{ id: string; version: number; funnelStage: string; text: string }>;
  if (typeof c.id !== "string" || typeof c.funnelStage !== "string" || typeof c.text !== "string")
    return reject("CTA_INVALID", "structure cta incomplète");
  if (c.funnelStage === "" ) return reject("CTA_INVALID", "funnelStage vide");
  return ok;
}

export function validateTemplateKey(templateKey: unknown): ValidatorResult {
  if (
    templateKey === "WORD_QUIZ_V1" ||
    templateKey === "WORD_REVEAL_V1" ||
    templateKey === "FREQUENCY_FACT_V1"
  )
    return ok;
  return reject("UNKNOWN_TEMPLATE", `template inconnu : ${String(templateKey)}`);
}

// ---------------------------------------------------------------------------
// Payload complet WORD_REVEAL_V1
// ---------------------------------------------------------------------------

type RevealLike = {
  contentKey: string;
  templateKey: unknown;
  status: string;
  word: { arabic: unknown };
  meaning: unknown;
  occurrenceCount: unknown;
  firstOccurrence: unknown;
  quiz: unknown;
  licenses: unknown;
  sources: { ayahId: string | null };
  render: unknown;
  cta: unknown;
};

export function validateRevealPayloadV1(
  p: RevealLike,
  opts: { expectedArabicFromDb: string; seenContentKeys?: ReadonlySet<string> },
): ValidatorResult {
  const t = validateTemplateKey(p.templateKey);
  if (!t.ok) return t;
  if (p.templateKey !== "WORD_REVEAL_V1") return reject("UNKNOWN_TEMPLATE", "template ≠ WORD_REVEAL_V1");

  if (opts.seenContentKeys?.has(p.contentKey)) return reject("DUPLICATE_KEY", "contentKey déjà généré");
  if (typeof p.contentKey !== "string" || !/^[0-9a-f]{64}$/.test(p.contentKey))
    return reject("DUPLICATE_KEY", "contentKey non conforme sha256-v1");

  const m = validateMeaning(p.meaning);
  if (!m.ok) return m;

  const a = validateArabicIdentity(p.word.arabic);
  if (!a.ok) return a;
  const u = validateArabicUnaltered(p.word.arabic as string, opts.expectedArabicFromDb);
  if (!u.ok) return u;

  const c = validateOccurrenceCount(p.occurrenceCount);
  if (!c.ok) return c;

  const f = validateFirstOccurrence(p.firstOccurrence);
  if (!f.ok) return f;

  if (p.quiz !== null) return reject("QUIZ_SHAPE", "quiz doit être null sur WORD_REVEAL_V1");
  if (p.status !== "GENERATED") return reject("INVENTED_METADATA", "status invalidé généré != GENERATED");

  const l = validateLicenses(p.licenses);
  if (!l.ok) return l;

  const r = validateRender(p.render);
  if (!r.ok) return r;

  // R1 (B3-FINAL) : WORD_REVEAL exige la traçabilité ayah réelle.
  const s = p.sources;
  if (typeof s?.ayahId !== "string" || s.ayahId.length === 0)
    return reject("INVENTED_METADATA", "sources.ayahId requis pour WORD_REVEAL_V1");

  const ct = validateCta(p.cta);
  if (!ct.ok) return ct;

  return ok;
}

// ---------------------------------------------------------------------------
// Quiz WORD_QUIZ_V1
// ---------------------------------------------------------------------------

export type QuizChannels = ReadonlyMap<string, "FORME" | "LEMME">;

/** Dérivation de confiance au-DESSUS du moteur (jamais dans engine/shared). */
export function deriveOptionConfidence(
  optionWordId: string | null | undefined,
  channels: QuizChannels,
): QuizOptionBlock["confidence"] {
  if (!optionWordId) return "UNKNOWN";
  const ch = channels.get(optionWordId);
  if (ch === "FORME") return "VERIFIED";
  if (ch === "LEMME") return "PARTIAL";
  return "UNKNOWN";
}

export function validateQuizBlock(q: unknown): ValidatorResult {
  if (typeof q !== "object" || q === null) return reject("QUIZ_SHAPE", "quiz absent");
  const b = q as Partial<QuizBlock>;

  if (typeof b.question !== "string" || b.question.trim() === "")
    return reject("QUIZ_SHAPE", "question vide");

  const options = b.options;
  if (!Array.isArray(options)) return reject("QUIZ_SHAPE", "options absentes");
  if (options.length !== 4) return reject("QUIZ_SHAPE", `exactement 4 options requis (reçu ${options.length})`);

  let correctCount = 0;
  const contents = new Set<string>();
  for (const o of options as QuizOptionBlock[]) {
    if (typeof o.content !== "string" || o.content.trim() === "")
      return reject("QUIZ_SHAPE", "option sans contenu");
    if (contents.has(o.content)) return reject("QUIZ_SHAPE", "option dupliquée");
    contents.add(o.content);
    if (o.isCorrect === true) correctCount += 1;
    else if (o.isCorrect !== false) return reject("QUIZ_SHAPE", "isCorrect non booléen");
    if (o.confidence === "UNKNOWN") return reject("UNKNOWN_DISTRACTOR", "confiance UNKNOWN non publiable en P0");
    if (o.confidence !== "VERIFIED" && o.confidence !== "PARTIAL")
      return reject("UNKNOWN_DISTRACTOR", "confiance dérivée invalide");
  }
  if (correctCount !== 1) return reject("QUIZ_SHAPE", `exactement 1 bonne réponse requise (reçu ${correctCount})`);
  return ok;
}
