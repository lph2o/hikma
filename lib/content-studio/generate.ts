// Hikma — Content Studio (B3) : GÉNÉRATION DE CONTENU.
//
// Consomme la Content API V1 (les MÊMES builders que les endpoints /words/:id
// et /quiz/:wordId — aucun resolver/quiz recréé) puis upsert IDEMPOTENT dans
// le registre. Un payload REJECTED par la Content API n'entre JAMAIS dans le
// registre (les reject codes du contrat restent les seuls blocages techniques).

import { computeContentKey } from "@/lib/content-api/content-key";
import type { ContentStudioService } from "@/lib/content-api/service";
import {
  isGeneratableTemplate,
  type ContentItemStatus,
  type ContentStudioItem,
  type GeneratableTemplateKey,
  type StudioTemplateKey,
} from "./types";
import type { ContentRegistryService } from "./registry";

export type GenerateOutcome =
  | { status: "GENERATED"; item: ContentStudioItem; created: boolean }
  | { status: "REJECTED"; code: string; message: string };

export class ContentGenerationService {
  constructor(
    private readonly contentApi: ContentStudioService,
    private readonly registry: ContentRegistryService,
  ) {}

  async generate(params: {
    wordId: string;
    templateKey: GeneratableTemplateKey;
  }): Promise<GenerateOutcome> {
    if (!isGeneratableTemplate(params.templateKey)) {
      return {
        status: "REJECTED",
        code: "NOT_IMPLEMENTED",
        message: `Template non supporté : ${params.templateKey}`,
      };
    }

    const outcome =
      params.templateKey === "WORD_QUIZ_V1"
        ? await this.contentApi.buildQuiz(params.wordId)
        : await this.contentApi.buildReveal(params.wordId);

    if (outcome.status === "REJECTED") {
      return { status: "REJECTED", code: outcome.code, message: outcome.message };
    }

    const payload = outcome.payload;
    let templateKey: StudioTemplateKey = payload.templateKey;
    let contentKey = payload.contentKey;

    if (params.templateKey !== "WORD_QUIZ_V1" && params.templateKey !== "WORD_REVEAL_V1") {
      templateKey = params.templateKey;
      contentKey = computeContentKey({
        wordId: payload.word.id,
        templateKey: params.templateKey,
        templateVersion: payload.templateVersion,
        hookVariantId: payload.hookVariant.id,
        language: payload.language,
      });
      (payload as Record<string, unknown>).templateKey = templateKey;
      (payload as Record<string, unknown>).contentKey = contentKey;
    }

    const result = await this.registry.upsert({
      contentKey,
      templateKey,
      templateVersion: payload.templateVersion,
      language: payload.language,
      wordId: payload.word.id,
      hookVariantId: payload.hookVariant.id,
      ctaId: "cta" in payload && payload.cta ? payload.cta.id : null,
      payload: payload as unknown as Record<string, unknown>,
      sources: payload.sources as unknown as Record<string, unknown>,
      licenses: payload.licenses as unknown as Record<string, unknown>,
    });
    return { status: "GENERATED", item: result.item, created: result.created };
  }
}

export type { ContentItemStatus };
