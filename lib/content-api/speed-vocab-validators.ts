// Hikma Content Studio — VALIDATEUR SPEED VOCAB (REJECT OVER GUESS).
//
// Même politique que la Content API V1 : un seul contrôle en échec ⇒ REJECTED.
// Aucun best effort, aucune valeur inventée. Module PUR (aucune I/O).

import type { RejectCode } from "./types";
import type { ValidatorResult } from "./validators";
import {
  SPEED_VOCAB_MAX_WORDS,
  SPEED_VOCAB_MIN_WORDS,
  type SpeedVocabPayloadV1,
  type SpeedVocabWordEntry,
} from "./speed-vocab-types";

const ok: ValidatorResult = { ok: true };

function reject(code: RejectCode, message: string): ValidatorResult {
  return { ok: false, code, message };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valide une entrée mot (identité arabe, glose validée, occurrences exactes). */
export function validateSpeedVocabWordEntry(w: unknown): ValidatorResult {
  if (typeof w !== "object" || w === null) return reject("INVENTED_METADATA", "word entry absente");
  const r = w as Partial<SpeedVocabWordEntry>;

  if (typeof r.wordId !== "string" || !UUID_RE.test(r.wordId))
    return reject("INVENTED_METADATA", "wordId non uuid");
  if (typeof r.arabic !== "string" || r.arabic.trim() === "")
    return reject("MISSING_ARABIC", "arabic absent/vide");
  if (/[\u0000-\u001f\u007f]/.test(r.arabic))
    return reject("ARABIC_ALTERED", "caractères de contrôle dans l'arabe");
  if (r.transliteration !== null && typeof r.transliteration !== "string")
    return reject("INVENTED_METADATA", "transliteration non string|null");
  if (typeof r.meaning !== "string" || r.meaning.trim() === "")
    return reject("NO_VALIDATED_MEANING", "glose vide");
  if (r.meaningSource !== "FORME" && r.meaningSource !== "LEMME")
    return reject("INVENTED_METADATA", "meaningSource hors contrat");
  if (typeof r.meaningSourceId !== "string" || r.meaningSourceId.length === 0)
    return reject("INVENTED_METADATA", "meaningSourceId manquant");
  if (!Number.isInteger(r.occurrenceCount) || (r.occurrenceCount as number) <= 0)
    return reject("INVENTED_METADATA", "occurrenceCount non entier positif");
  return ok;
}

/** Valide le payload Speed Vocab complet. */
export function validateSpeedVocabPayloadV1(
  p: SpeedVocabPayloadV1,
  opts: { seenContentKeys?: ReadonlySet<string> } = {},
): ValidatorResult {
  if (p.templateKey !== "VOCAB_SPEED_RUN_V1")
    return reject("UNKNOWN_TEMPLATE", `template inconnu : ${String(p.templateKey)}`);
  if (p.templateVersion !== "1") return reject("INVENTED_METADATA", "templateVersion != 1");
  if (p.language !== "fr") return reject("INVENTED_METADATA", "language != fr");
  if (p.status !== "GENERATED") return reject("INVENTED_METADATA", "status != GENERATED");

  if (opts.seenContentKeys?.has(p.contentKey)) return reject("DUPLICATE_KEY", "contentKey déjà généré");
  if (typeof p.contentKey !== "string" || !/^[0-9a-f]{64}$/.test(p.contentKey))
    return reject("DUPLICATE_KEY", "contentKey non conforme sha256-v1");

  if (!Array.isArray(p.words)) return reject("INVENTED_METADATA", "words absents");
  if (
    p.words.length < SPEED_VOCAB_MIN_WORDS ||
    p.words.length > SPEED_VOCAB_MAX_WORDS
  ) {
    return reject(
      "INVENTED_METADATA",
      `3 à 5 mots requis (reçu ${p.words.length})`,
    );
  }

  // Identités uniques (jamais deux fois le même mot).
  const ids = new Set<string>();
  for (const w of p.words) {
    const v = validateSpeedVocabWordEntry(w);
    if (!v.ok) return v;
    if (ids.has(w.wordId)) return reject("INVENTED_METADATA", `mot dupliqué : ${w.wordId}`);
    ids.add(w.wordId);
  }

  // Gloses uniques (évite l'effet « deux fois le même sens »).
  const meanings = new Set<string>(p.words.map((w) => w.meaning));
  if (meanings.size !== p.words.length)
    return reject("INVENTED_METADATA", "gloses dupliquées dans la liste");

  const ct = p.cta;
  if (
    ct !== null &&
    (typeof ct !== "object" ||
      typeof ct.id !== "string" ||
      typeof ct.funnelStage !== "string" ||
      typeof ct.text !== "string")
  ) {
    return reject("CTA_INVALID", "structure cta incomplète");
  }

  if (typeof p.caption?.text !== "string" || p.caption.text.trim() === "")
    return reject("INVENTED_METADATA", "caption vide");

  // Sources : traçabilité alignée sur words.
  const s = p.sources;
  if (
    typeof s !== "object" ||
    s === null ||
    s.wordId !== p.words[0].wordId ||
    !Array.isArray(s.meaningSourceIds) ||
    s.meaningSourceIds.length !== p.words.length ||
    (s.meaningSourceTable !== "word_translations" &&
      s.meaningSourceTable !== "lemma_translations" &&
      s.meaningSourceTable !== "mixed") ||
    s.ayahId !== null
  ) {
    return reject("INVENTED_METADATA", "sources non alignées sur words");
  }

  return ok;
}
