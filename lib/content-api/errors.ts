// Hikma Content Studio — erreurs transport/HTTP. Les codes du CONTRAT
// (RejectCode, cf. validators.ts) sont distincts des codes de transport
// ci-dessous : le contrat décrit l'acceptation d'un payload ; les erreurs
// ici décrivent un problème HTTP (auth, paramètre, ressource absente…).

export type ContentApiTransportCode =
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "INVALID_WORD_ID"
  | "WORD_NOT_FOUND"
  | "SUPABASE_NOT_CONFIGURED"
  | "OCCURRENCE_SCAN_LIMIT"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ContentApiTransportCode, number> = {
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
  INVALID_WORD_ID: 400,
  WORD_NOT_FOUND: 404,
  SUPABASE_NOT_CONFIGURED: 503,
  OCCURRENCE_SCAN_LIMIT: 500,
  INTERNAL_ERROR: 500,
};

export class ContentApiError extends Error {
  readonly code: ContentApiTransportCode;
  readonly status: number;

  constructor(code: ContentApiTransportCode, message?: string) {
    super(message ?? code);
    this.name = "ContentApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
  }
}

/** Mappe un RejectCode du contrat vers un statut HTTP (police REJECT OVER GUESS). */
export function httpStatusForRejectCode(code: string): number {
  switch (code) {
    case "DUPLICATE_KEY":
      return 409;
    case "UNKNOWN_TEMPLATE":
      return 400;
    default:
      return 422;
  }
}
