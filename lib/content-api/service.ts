// Hikma Content Studio — SERVICE V1 ("thin mapping").
//
// RÈGLE ABSOLUE (B3) : ce module n'est PAS un moteur linguistique.
// - Sens FR : exclusivement getValidatedFrenchMeanings puis
//   getValidatedFrenchLemmaMeaningsByWord (précédence FORME > LEMME du
//   resolver ; la sélection row-level vit dans lib/learning/queries.ts) ;
// - Explication : exclusivement getValidatedWordExplanations ;
// - Quiz : exclusivement generateExercise("WORD_TO_TRANSLATION", …) du moteur
//   existant (engine/shared non modifiés), la confiance étant dérivée
//   AU-DESSUS du moteur ;
// - Aucun fallback EN, aucune invention, aucun ID reconstruit.
//
// Aucune persistence : la détection de collision contentKey est préparée via
// les options des validateurs ; le registre DB appartient à une phase ultérieure.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getValidatedFrenchMeanings,
  getValidatedFrenchLemmaMeaningsByWord,
  getValidatedWordExplanations,
} from "@/lib/learning/queries";
import { generateExercise } from "@/lib/exercises/engine";
import type { WordBankEntry } from "@/lib/learning/types";
import { computeContentKey } from "./content-key";
import {
  buildCaptionText,
  CTAS_V1,
  DEFAULT_CTA_BY_TEMPLATE,
  DEFAULT_HOOK_BY_TEMPLATE,
  HASHTAGS_FR,
  LICENSES_V1,
  RENDER_V1,
  renderHookText,
} from "./banks";
import {
  deriveOptionConfidence,
  validateArabicIdentity,
  validateOccurrenceCount,
  validateQuizBlock,
  validateRevealPayloadV1,
} from "./validators";
import {
  SPEED_VOCAB_MAX_WORDS,
  SPEED_VOCAB_MIN_WORDS,
  type SpeedVocabPayloadV1,
  type SpeedVocabWordEntry,
} from "./speed-vocab-types";
import { validateSpeedVocabPayloadV1 } from "./speed-vocab-validators";
import type {
  FirstOccurrenceBlock,
  MeaningSourceTable,
  QuizPayloadV1,
  RejectCode,
  RevealPayloadV1,
  WordCandidatesResult,
} from "./types";
import { ContentApiError } from "./errors";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CANDIDATES_MAX_LIMIT = 50;
const CANDIDATES_DEFAULT_LIMIT = 20;
const QUIZ_BANK_SIZE = 24; // gloses candidates pour distracteurs (ordre id.asc figé)
const FIRST_OCC_PAGE = 1000;
const FIRST_OCC_MAX_PAGES = 50; // garde-fou anti-dérive (50k occurrences ≫ corpus)

type Outcome<T> =
  | { status: "GENERATED"; payload: T }
  | { status: "REJECTED"; code: RejectCode; message: string };

function ensureUuid(wordId: string): string {
  if (!UUID_RE.test(wordId)) throw new ContentApiError("INVALID_WORD_ID", "wordId n'est pas un UUID");
  return wordId;
}

type WordRow = {
  id: string;
  arabic: string;
  transliteration: string | null;
  lemma_id: string | null;
};

async function fetchWordRow(client: SupabaseClient, wordId: string): Promise<WordRow | null> {
  const { data, error } = await client
    .from("quran_words")
    .select("id, arabic, transliteration, lemma_id")
    .eq("id", wordId)
    .maybeSingle();
  if (error) throw new Error(`quran_words : ${error.message}`);
  return (data as WordRow | null) ?? null;
}

/**
 * Sens FR par canal gagnant — B3-FINAL R2 :
 *   FORME (getValidatedFrenchMeanings) ↓ LEMME (…ByWord) ↓ null ⇒ REJECT.
 * Les deux fonctions ne retournent que `is_validated=true` ⇒ un fallback EN
 * est impossible PAR CONSTRUCTION ; aucune logique de résolution nouvelle.
 */
type ResolvedMeaning = {
  channel: "FORME" | "LEMME";
  text: string;
  sourceRowId: string;
  validatedAt: string | null;
};

async function resolveMeaningChannel(
  client: SupabaseClient,
  wordId: string,
): Promise<ResolvedMeaning | null> {
  const formMap = await getValidatedFrenchMeanings(client, [wordId]);
  const forme = formMap.get(wordId);
  if (forme?.text && forme.validated && forme.sourceRowId) {
    return {
      channel: "FORME",
      text: forme.text,
      sourceRowId: forme.sourceRowId,
      validatedAt: forme.validatedAt,
    };
  }
  const lemmaMap = await getValidatedFrenchLemmaMeaningsByWord(client, [wordId]);
  const lemme = lemmaMap.get(wordId);
  if (lemme?.text && lemme.validated && lemme.sourceRowId) {
    return {
      channel: "LEMME",
      text: lemme.text,
      sourceRowId: lemme.sourceRowId,
      validatedAt: lemme.validatedAt,
    };
  }
  return null;
}

/** COUNT exact PostgREST (`head:true`) — jamais de comptage par lignes. */
async function exactOccurrenceCount(client: SupabaseClient, wordId: string): Promise<number> {
  const { count, error } = await client
    .from("word_occurrences")
    .select("id", { count: "exact", head: true })
    .eq("word_id", wordId);
  if (error) throw new Error(`word_occurrences count : ${error.message}`);
  return count ?? 0;
}

type OccurrencePage = {
  a: {
    id: string;
    ayah_number: number;
    text_uthmani: string;
    surah: { number: number; name_transliteration: string };
  };
};

/**
 * firstOccurrence — règle gelée B3 : min(surahNumber × 1000 + ayahNumber)
 * sur les occurrences RÉELLES ; l'id `ayahs` réellement utilisé est retenu
 * (jamais reconstruit depuis sourate/verset).
 */
async function fetchFirstOccurrence(
  client: SupabaseClient,
  wordId: string,
  totalOccurrences: number,
): Promise<{ block: FirstOccurrenceBlock; ayahId: string }> {
  let best: { key: number; row: OccurrencePage["a"] } | null = null;
  const pages = Math.max(1, Math.ceil(totalOccurrences / FIRST_OCC_PAGE));
  if (pages > FIRST_OCC_MAX_PAGES)
    throw new ContentApiError("OCCURRENCE_SCAN_LIMIT");
  for (let page = 0; page < pages; page += 1) {
    const from = page * FIRST_OCC_PAGE;
    const { data, error } = await client
      .from("word_occurrences")
      .select(
        "a:ayahs(id,surah:surahs(number,name_transliteration),ayah_number,text_uthmani)",
      )
      .eq("word_id", wordId)
      .range(from, from + FIRST_OCC_PAGE - 1);
    if (error) throw new Error(`word_occurrences range : ${error.message}`);
    const rows = (data ?? []) as unknown as OccurrencePage[];
    for (const r of rows) {
      const key = r.a.surah.number * 1000 + r.a.ayah_number;
      if (!best || key < best.key) best = { key, row: r.a };
    }
  }
  if (!best) throw new ContentApiError("WORD_NOT_FOUND", "aucune occurrence réelle");
  return {
    ayahId: best.row.id,
    block: {
      surahNumber: best.row.surah.number,
      surahName: best.row.surah.name_transliteration,
      ayahNumber: best.row.ayah_number,
      excerptUthmani: best.row.text_uthmani,
      verseTranslationFr: null, // Hamidullah REVIEW_REQUIRED ⇒ toujours null en V1
    },
  };
}

/**
 * Résolution batchée par canal gagnant pour un ensemble de mots.
 * Retourne Map(word_id → canal) et Map(word_id → entrée WordBankEntry FR).
 * Le moteur reçoit UNIQUEMENT des sens FR validés : zéro fuite EN possible.
 */
async function resolveChannelBatch(
  client: SupabaseClient,
  ids: string[],
): Promise<{
  channels: Map<string, "FORME" | "LEMME">;
  entries: Map<string, WordBankEntry>;
  /** TASK A1 : id de ligne réel par mot (word_translations|lemma_translations). */
  sourceRowIds: Map<string, string>;
}> {
  const channels = new Map<string, "FORME" | "LEMME">();
  const entries = new Map<string, WordBankEntry>();
  const sourceRowIds = new Map<string, string>();

  const entryFrom = (
    id: string,
    m: { text: string; sourceRowId: string },
    channel: "FORME" | "LEMME",
  ): void => {
    channels.set(id, channel);
    sourceRowIds.set(id, m.sourceRowId);
    entries.set(id, {
      wordId: id,
      arabic: "", // complété par un batch identités plus bas (pur affichage)
      transliteration: null,
      meaning: m.text, // texte validé à l'identique
      meaningLanguage: "fr",
      meaningFallback: false,
      isValidated: true,
    });
  };

  const formMap = await getValidatedFrenchMeanings(client, ids);
  const lemmaTargets: string[] = [];
  for (const id of ids) {
    const f = formMap.get(id);
    // `f.sourceRowId` est garanti non vide par le garde (TASK A1) ; on passe la
    // valeur resserrée plutôt que l'objet complet (sourceRowId: string | undefined).
    if (f?.text && f.validated && f.sourceRowId)
      entryFrom(id, { text: f.text, sourceRowId: f.sourceRowId }, "FORME");
    else lemmaTargets.push(id);
  }
  if (lemmaTargets.length > 0) {
    const lemmaMap = await getValidatedFrenchLemmaMeaningsByWord(client, lemmaTargets);
    for (const id of lemmaTargets) {
      const l = lemmaMap.get(id);
      if (l?.text && l.validated && l.sourceRowId)
        entryFrom(id, { text: l.text, sourceRowId: l.sourceRowId }, "LEMME");
    }
  }
  return { channels, entries, sourceRowIds };
}

export class ContentStudioService {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Candidats = mots possédant AU MOINS une glose FR validée au niveau FORME
   * (jointure interne PostgREST, lecture seule, count exact pour le total).
   * Supporte la recherche multi-critères : arabe, translittération ou sens français.
   * Ordre déterministe id ASC, limit ≤ 50.
   */
  async listWordCandidates(params: {
    limit?: number;
    offset?: number;
    query?: string;
  }): Promise<WordCandidatesResult> {
    const limit = Math.min(
      Math.max(Math.trunc(params.limit ?? CANDIDATES_DEFAULT_LIMIT), 1),
      CANDIDATES_MAX_LIMIT,
    );
    const offset = Math.max(Math.trunc(params.offset ?? 0), 0);
    const q = params.query?.trim();

    if (q && q.length > 0) {
      const isArabic = /[\u0600-\u06FF]/.test(q);
      if (isArabic) {
        const { data, error, count } = await this.client
          .from("quran_words")
          .select("id, arabic, transliteration, wts:word_translations!inner(id, text)", {
            count: "exact",
          })
          .eq("wts.language", "fr")
          .eq("wts.is_validated", true)
          .ilike("arabic", `%${q}%`)
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        if (error) throw new Error(`word-candidates search : ${error.message}`);

        const items = ((data ?? []) as Array<{
          id: string;
          arabic: string;
          transliteration: string | null;
          wts: Array<{ id: string; text?: string }> | { id: string; text?: string };
        }>).map((row) => {
          const wt = Array.isArray(row.wts) ? row.wts[0] : row.wts;
          return {
            wordId: row.id,
            arabic: row.arabic,
            transliteration: row.transliteration,
            meaning: wt?.text ?? null,
            hasValidatedFrMeaning: true as const,
          };
        });

        return { items, total: count ?? items.length, limit, offset };
      } else {
        // Recherche en alphabet latin (translittération OU sens français)
        const { data: transData } = await this.client
          .from("word_translations")
          .select("word_id")
          .eq("language", "fr")
          .eq("is_validated", true)
          .ilike("text", `%${q}%`)
          .limit(100);

        const transWordIds = (transData ?? []).map((t: { word_id: string }) => t.word_id);

        let queryBuilder = this.client
          .from("quran_words")
          .select("id, arabic, transliteration, wts:word_translations!inner(id, text)", {
            count: "exact",
          })
          .eq("wts.language", "fr")
          .eq("wts.is_validated", true);

        if (transWordIds.length > 0) {
          queryBuilder = queryBuilder.or(
            `transliteration.ilike.%${q}%,id.in.(${transWordIds.join(",")})`,
          );
        } else {
          queryBuilder = queryBuilder.ilike("transliteration", `%${q}%`);
        }

        const { data, error, count } = await queryBuilder
          .order("id", { ascending: true })
          .range(offset, offset + limit - 1);
        if (error) throw new Error(`word-candidates search : ${error.message}`);

        const items = ((data ?? []) as Array<{
          id: string;
          arabic: string;
          transliteration: string | null;
          wts: Array<{ id: string; text?: string }> | { id: string; text?: string };
        }>).map((row) => {
          const wt = Array.isArray(row.wts) ? row.wts[0] : row.wts;
          return {
            wordId: row.id,
            arabic: row.arabic,
            transliteration: row.transliteration,
            meaning: wt?.text ?? null,
            hasValidatedFrMeaning: true as const,
          };
        });

        return { items, total: count ?? items.length, limit, offset };
      }
    }

    const { data, error, count } = await this.client
      .from("quran_words")
      .select("id, arabic, transliteration, wts:word_translations!inner(id, text)", {
        count: "exact",
      })
      .eq("wts.language", "fr")
      .eq("wts.is_validated", true)
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`word-candidates : ${error.message}`);

    const items = ((data ?? []) as Array<{
      id: string;
      arabic: string;
      transliteration: string | null;
      wts: Array<{ id: string; text?: string }> | { id: string; text?: string };
    }>).map((row) => {
      const wt = Array.isArray(row.wts) ? row.wts[0] : row.wts;
      return {
        wordId: row.id,
        arabic: row.arabic,
        transliteration: row.transliteration,
        meaning: wt?.text ?? null,
        hasValidatedFrMeaning: true as const,
      };
    });

    return { items, total: count ?? items.length, limit, offset };
  }

  /** WORD_REVEAL_V1 complet — endpoint /words/:id. */
  async buildReveal(wordIdInput: string): Promise<
    Outcome<RevealPayloadV1>
  > {
    const wordId = ensureUuid(wordIdInput);
    const word = await fetchWordRow(this.client, wordId);
    if (!word) throw new ContentApiError("WORD_NOT_FOUND");

    // Garde IMMÉDIATE identité arabe (avant tout calcul coûteux).
    const arabicCheck = validateArabicIdentity(word.arabic);
    if (!arabicCheck.ok) return { status: "REJECTED", ...arabicCheck };

    const resolved = await resolveMeaningChannel(this.client, wordId);
    if (!resolved) {
      return {
        status: "REJECTED",
        code: "NO_VALIDATED_MEANING",
        message: "Aucune glose FR validée (FORME ni LEMME)",
      };
    }
    const meaningSourceTable: MeaningSourceTable =
      resolved.channel === "FORME" ? "word_translations" : "lemma_translations";

    const occurrenceCount = await exactOccurrenceCount(this.client, wordId);
    const occCheck = validateOccurrenceCount(occurrenceCount);
    if (!occCheck.ok) return { status: "REJECTED", ...occCheck };

    const { block: firstOccurrence, ayahId } = await fetchFirstOccurrence(
      this.client,
      wordId,
      occurrenceCount,
    );

    const explanations = await getValidatedWordExplanations(this.client, [wordId]);
    const explanation = explanations.get(wordId) ?? null;

    const hook = renderHookText(DEFAULT_HOOK_BY_TEMPLATE.WORD_REVEAL_V1, occurrenceCount);
    const ctaId = DEFAULT_CTA_BY_TEMPLATE.WORD_REVEAL_V1;
    const ctaDef = CTAS_V1[ctaId];

    const draft: RevealPayloadV1 = {
      contentKey: computeContentKey({
        wordId,
        templateKey: "WORD_REVEAL_V1",
        templateVersion: "1",
        hookVariantId: hook.ref.id,
        language: "fr",
      }),
      templateKey: "WORD_REVEAL_V1",
      templateVersion: "1",
      language: "fr",
      status: "GENERATED",
      word: {
        id: word.id,
        arabic: word.arabic, // valeur DB EXACTE, jamais normalisée
        transliteration: word.transliteration,
        lemmaId: word.lemma_id,
      },
      meaning: {
        text: resolved.text, // texte validé À L'IDENTIQUE
        sourceType: resolved.channel,
        sourceId: resolved.sourceRowId,
        validated: true,
        validatedAt: resolved.validatedAt,
      },
      explanation: explanation
        ? {
            text: explanation.text,
            sourceId: explanation.sourceRowId ?? "",
            validated: true,
            validatedAt: explanation.validatedAt,
          }
        : null,
      occurrenceCount,
      firstOccurrence,
      quiz: null,
      series: null, // registre séries ⇒ phase ultérieure (B3 §34 : pas de table en Phase A)
      hookVariant: hook.ref,
      cta: {
        id: ctaId,
        version: ctaDef.version,
        funnelStage: ctaDef.funnelStage,
        text: ctaDef.text,
      },
      caption: {
        text: buildCaptionText(word.arabic, occurrenceCount, resolved.text),
        language: "fr",
        hashtags: [...HASHTAGS_FR],
      },
      licenses: LICENSES_V1,
      sources: {
        wordId,
        meaningSourceId: resolved.sourceRowId,
        meaningSourceTable,
        lemmaSourceId: resolved.channel === "LEMME" ? resolved.sourceRowId : null,
        explanationSourceId: explanation?.sourceRowId ?? null,
        ayahId, // R1 : REQUIRED ici — réel id `ayahs`, jamais reconstruit
      },
      render: RENDER_V1,
    };

    // VALIDATION AVANT déclaration GENERATED (REJECT OVER GUESS).
    const verdict = validateRevealPayloadV1(draft, { expectedArabicFromDb: word.arabic });
    if (!verdict.ok) {
      return {
        status: "REJECTED",
        code: verdict.code,
        message: verdict.message,
      };
    }
    return { status: "GENERATED", payload: draft };
  }

  /** WORD_QUIZ_V1 — endpoint /quiz/:wordId. */
  async buildQuiz(wordIdInput: string): Promise<Outcome<QuizPayloadV1>> {
    const wordId = ensureUuid(wordIdInput);
    const word = await fetchWordRow(this.client, wordId);
    if (!word) throw new ContentApiError("WORD_NOT_FOUND");

    // Banque = candidats autres que la cible (ordre id ASC déterministe).
    const bankRes = await this.listWordCandidates({ limit: QUIZ_BANK_SIZE + 8, offset: 0 });
    const bankIds = bankRes.items
      .map((i) => i.wordId)
      .filter((id) => id !== wordId)
      .slice(0, QUIZ_BANK_SIZE);

    const { channels, entries, sourceRowIds } = await resolveChannelBatch(
      this.client,
      [wordId, ...bankIds],
    );

    const targetEntry = entries.get(wordId);
    if (!targetEntry || !targetEntry.meaning) {
      return {
        status: "REJECTED",
        code: "NO_VALIDATED_MEANING",
        message: "La cible n'a pas de glose FR validée exploitable",
      };
    }
    const targetChannel = channels.get(wordId) as "FORME" | "LEMME";

    // Identité arabe exacte pour chaque entrée (batch, jamais inventée).
    const allIds = [...entries.keys()];
    const wordRows = new Map<string, { arabic: string; transliteration: string | null }>();
    for (let i = 0; i < allIds.length; i += 200) {
      const batch = allIds.slice(i, i + 200);
      const { data, error } = await this.client
        .from("quran_words")
        .select("id, arabic, transliteration")
        .in("id", batch);
      if (error) throw new Error(`quiz bank quran_words : ${error.message}`);
      for (const row of (data ?? []) as Array<{
        id: string;
        arabic: string;
        transliteration: string | null;
      }>) {
        wordRows.set(row.id, { arabic: row.arabic, transliteration: row.transliteration });
      }
    }
    for (const e of entries.values()) {
      const w = wordRows.get(e.wordId);
      e.arabic = w?.arabic ?? "";
      e.transliteration = w?.transliteration ?? null;
    }

    const bank: WordBankEntry[] = [...entries.values()]
      .filter((e) => e.wordId !== wordId && e.meaning !== targetEntry.meaning)
      .sort((x, y) => (x.wordId < y.wordId ? -1 : x.wordId > y.wordId ? 1 : 0));

    // MOTEUR EXISTANT, INCHANGÉ — exactement l'appel sanctifié par B3 §23.
    const exercise = generateExercise("WORD_TO_TRANSLATION", {
      target: targetEntry,
      bank,
      difficulty: 1,
    });
    if (!exercise) {
      return {
        status: "REJECTED",
        code: "QUIZ_SHAPE",
        message: "Le moteur n'a pas pu produire de QCM pour ces données",
      };
    }

    // Confiance dérivée AU-DESSUS du moteur (toutes options = gloses FR validées).
    const options = exercise.options.map((o) => ({
      content: o.content,
      isCorrect: o.isCorrect,
      confidence: deriveOptionConfidence(o.wordId, channels),
    }));
    const quizBlock = { question: exercise.prompt, options };

    // VALIDATION AVANT GENERATED (4 options / 1 correcte / doublon / UNKNOWN).
    const verdict = validateQuizBlock(quizBlock);
    if (!verdict.ok) return { status: "REJECTED", ...verdict };

    const hookRef = renderHookText(DEFAULT_HOOK_BY_TEMPLATE.WORD_QUIZ_V1, 0).ref;

    const quiz: QuizPayloadV1 = {
      contentKey: computeContentKey({
        wordId,
        templateKey: "WORD_QUIZ_V1",
        templateVersion: "1",
        hookVariantId: hookRef.id,
        language: "fr",
      }),
      templateKey: "WORD_QUIZ_V1",
      templateVersion: "1",
      language: "fr",
      status: "GENERATED",
      word: {
        id: word.id,
        arabic: word.arabic,
        transliteration: word.transliteration,
      },
      quiz: quizBlock,
      hookVariant: hookRef,
      cta: null, // format engagement : pas de CTA (banque B3)
      caption: {
        text: renderHookText("HOOK_H2", 0).text,
        language: "fr",
        hashtags: [...HASHTAGS_FR],
      },
      licenses: LICENSES_V1,
      sources: {
        wordId,
        // TASK A1 : id RÉEL retourné par le resolver pour la cible.
        meaningSourceId: sourceRowIds.get(wordId) ?? "",
        meaningSourceTable:
          targetChannel === "LEMME" ? "lemma_translations" : "word_translations",
        lemmaSourceId: targetChannel === "LEMME" ? sourceRowIds.get(wordId) ?? null : null,
        explanationSourceId: null,
        ayahId: null, // R1 : MAY be null pour le quiz (aucun verset rendu)
      },
      render: RENDER_V1,
    };
    return { status: "GENERATED", payload: quiz };
  }

  /**
   * VOCAB_SPEED_RUN_V1 — Speed Vocab 60s (LOT 2 Video Factory).
   *
   * Sélection DÉTERMINISTE de 3–5 mots réels :
   *   1. candidats = mots avec ≥1 glose FR FORME validée (listWordCandidates,
   *      ordre id ASC — MÊME mécanique que le sélecteur admin) ;
   *   2. occurrences exactes par COUNT PostgREST (exactOccurrenceCount) ;
   *   3. tri occurrences DESC, tie-break id ASC → N premiers (N = 5 par défaut).
   *
   * Gloses : resolveChannelBatch (FORME > LEMME) — zéro glose non validée.
   * Aucune invention : si moins de 3 mots complets ⇒ REJECTED.
   */
  async buildSpeedVocab(params?: {
    targetCount?: number;
    seenContentKeys?: ReadonlySet<string>;
  }): Promise<Outcome<SpeedVocabPayloadV1>> {
    const targetCount = Math.min(
      Math.max(Math.trunc(params?.targetCount ?? SPEED_VOCAB_MAX_WORDS), SPEED_VOCAB_MIN_WORDS),
      SPEED_VOCAB_MAX_WORDS,
    );

    // 1. Candidats réels (id ASC déterministe) — largeur 3× la cible pour
    //    absorber les rejets de glose/occurrences sans détruire le déterminisme.
    const candRes = await this.listWordCandidates({
      limit: CANDIDATES_MAX_LIMIT,
      offset: 0,
    });
    const candidateIds = candRes.items.map((i) => i.wordId);
    if (candidateIds.length === 0) {
      return {
        status: "REJECTED",
        code: "NO_VALIDATED_MEANING",
        message: "Aucun candidat avec glose FR validée",
      };
    }

    // 2. Occurrences exactes par mot (COUNT head:true).
    const scored: { wordId: string; occ: number }[] = [];
    for (const id of candidateIds) {
      const occ = await exactOccurrenceCount(this.client, id);
      if (occ > 0) scored.push({ wordId: id, occ });
    }

    // 3. Tri déterministe : occurrences DESC, tie-break id ASC.
    scored.sort((a, b) =>
      b.occ !== a.occ ? b.occ - a.occ : a.wordId < b.wordId ? -1 : 1,
    );
    const picked = scored.slice(0, targetCount).map((s) => s.wordId);
    if (picked.length < SPEED_VOCAB_MIN_WORDS) {
      return {
        status: "REJECTED",
        code: "NO_VALIDATED_MEANING",
        message: `Seulement ${picked.length} mot(s) complet(s) — 3 requis minimum`,
      };
    }

    // 4. Gloses validées batch (FORME > LEMME) + identités arabes exactes.
    const { channels, entries, sourceRowIds } = await resolveChannelBatch(
      this.client,
      picked,
    );
    const wordRows = new Map<string, { arabic: string; transliteration: string | null }>();
    for (let i = 0; i < picked.length; i += 200) {
      const batch = picked.slice(i, i + 200);
      const { data, error } = await this.client
        .from("quran_words")
        .select("id, arabic, transliteration")
        .in("id", batch);
      if (error) throw new Error(`speed-vocab quran_words : ${error.message}`);
      for (const row of (data ?? []) as Array<{
        id: string;
        arabic: string;
        transliteration: string | null;
      }>) {
        wordRows.set(row.id, { arabic: row.arabic, transliteration: row.transliteration });
      }
    }

    // 5. Assemble les entrées COMPLÈTES uniquement (ordre `picked` conservé).
    const words: SpeedVocabWordEntry[] = [];
    for (const id of picked) {
      const entry = entries.get(id);
      const row = wordRows.get(id);
      const occ = scored.find((s) => s.wordId === id)?.occ ?? 0;
      const channel = channels.get(id);
      const srcId = sourceRowIds.get(id);
      if (!entry?.meaning || !row?.arabic || !channel || !srcId || occ <= 0) continue;
      const idCheck = validateArabicIdentity(row.arabic);
      if (!idCheck.ok) continue; // REJECT OVER GUESS : mot incomplet ⇒ exclu
      words.push({
        wordId: id,
        arabic: row.arabic, // valeur DB EXACTE
        transliteration: row.transliteration,
        meaning: entry.meaning,
        meaningSource: channel,
        meaningSourceId: srcId,
        occurrenceCount: occ,
      });
    }
    if (words.length < SPEED_VOCAB_MIN_WORDS) {
      return {
        status: "REJECTED",
        code: "NO_VALIDATED_MEANING",
        message: `Seulement ${words.length} mot(s) avec glose validée — 3 requis`,
      };
    }

    // 6. contentKey idempotent sur la liste triée (wordIds|template|version).
    const contentKey = computeContentKey({
      wordId: words[0].wordId,
      templateKey: "VOCAB_SPEED_RUN_V1",
      templateVersion: "1",
      hookVariantId: words.map((w) => w.wordId).sort().join(","),
      language: "fr",
    });

    const hook = renderHookText("HOOK_H2", 0);
    const ctaId = "CTA_LEARN_02" as const;
    const ctaDef = CTAS_V1[ctaId];

    const tables = new Set(words.map((w) =>
      w.meaningSource === "FORME" ? "word_translations" : "lemma_translations",
    ));
    const meaningSourceTable: "word_translations" | "lemma_translations" | "mixed" =
      tables.size === 1
        ? words[0].meaningSource === "FORME"
          ? "word_translations"
          : "lemma_translations"
        : "mixed";

    const captionText = words
      .map((w) => w.arabic)
      .join(" · ") + ` — ${words.length} mots coraniques en 60 secondes.`;

    const draft: SpeedVocabPayloadV1 = {
      contentKey,
      templateKey: "VOCAB_SPEED_RUN_V1",
      templateVersion: "1",
      language: "fr",
      status: "GENERATED",
      words,
      hookVariant: hook.ref,
      cta: {
        id: ctaId,
        version: ctaDef.version,
        funnelStage: ctaDef.funnelStage,
        text: ctaDef.text,
      },
      caption: {
        text: captionText,
        language: "fr",
        hashtags: [...HASHTAGS_FR],
      },
      licenses: LICENSES_V1,
      sources: {
        wordId: words[0].wordId, // colonne content_items.word_id NOT NULL
        meaningSourceIds: words.map((w) => w.meaningSourceId),
        meaningSourceTable,
        ayahId: null, // aucun verset rendu par ce format
      },
      render: RENDER_V1,
    };

    // VALIDATION AVANT GENERATED (REJECT OVER GUESS).
    const verdict = validateSpeedVocabPayloadV1(draft, {
      seenContentKeys: params?.seenContentKeys,
    });
    if (!verdict.ok) return { status: "REJECTED", ...verdict };
    return { status: "GENERATED", payload: draft };
  }

}
