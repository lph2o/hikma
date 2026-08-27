import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getWord } from "../app/api/internal/content-studio/v1/words/[id]/route";
import { GET as getQuiz } from "../app/api/internal/content-studio/v1/quiz/[wordId]/route";
import { GET as getCandidates } from "../app/api/internal/content-studio/v1/word-candidates/route";
import { ContentApiError } from "../lib/content-api/errors";
import {
  contentStudioRateLimiter,
  errorResponse,
  isAuthorized,
  rejectedResponse,
} from "../lib/content-api/http";

// ---------------------------------------------------------------------------
// Service mocké au niveau module (vitest) : les routes réelles sont exécutées,
// seul ContentStudioService est remplacé — le comportement HTTP (auth, rate
// limit, erreurs, payload) est celui du code réel.
// ---------------------------------------------------------------------------

const { buildRevealMock, buildQuizMock, listCandidatesMock } = vi.hoisted(() => ({
  buildRevealMock: vi.fn(),
  buildQuizMock: vi.fn(),
  listCandidatesMock: vi.fn(),
}));

vi.mock("../lib/content-api/service", () => ({
  // Implementation constructable : les routes font `new ContentStudioService(...)`.
  ContentStudioService: vi.fn().mockImplementation(function (this: unknown) {
    return {
      buildReveal: buildRevealMock,
      buildQuiz: buildQuizMock,
      listWordCandidates: listCandidatesMock,
    };
  }),
}));

const TOKEN = "phase-a-test-token";
const IP = "203.0.113.42";

function authedRequest(path = "/api/internal/content-studio/v1/words/x", method = "GET") {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "x-forwarded-for": IP,
    },
  });
}

const PAYLOAD_REVEAL = { status: "GENERATED", templateKey: "WORD_REVEAL_V1" };
const PAYLOAD_QUIZ = { status: "GENERATED", templateKey: "WORD_QUIZ_V1" };
const PAYLOAD_CANDIDATES = {
  items: [{ wordId: "w-1", arabic: "يَوْمَ", transliteration: null, hasValidatedFrMeaning: true }],
  total: 6095,
  limit: 20,
  offset: 0,
};

beforeEach(() => {
  process.env.CONTENT_API_TOKEN = TOKEN;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  contentStudioRateLimiter.reset();
  vi.clearAllMocks();
});

afterEach(() => {
  delete process.env.CONTENT_API_TOKEN;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  contentStudioRateLimiter.reset();
});

describe("auth — Bearer CONTENT_API_TOKEN (server-only)", () => {
  it("sans en-tête Authorization → 401 UNAUTHORIZED", async () => {
    const res = await getWord(new Request("http://localhost/x"), {
      params: Promise.resolve({ id: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { code: "UNAUTHORIZED" } });
    expect(buildRevealMock).not.toHaveBeenCalled();
  });

  it("token invalide → 401, aucun détail interne révélé", async () => {
    const res = await getWord(
      new Request("http://localhost/x", {
        headers: { authorization: "Bearer mauvais-token", "x-forwarded-for": IP },
      }),
      { params: Promise.resolve({ id: "x" }) },
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("mauvais-token");
    expect(JSON.stringify(body)).not.toContain(TOKEN);
    expect(JSON.stringify(body)).not.toContain("phase-a-test-token");
  });

  it("token absent de l'environnement → refus sans branchement temporel visible", () => {
    delete process.env.CONTENT_API_TOKEN;
    expect(isAuthorized(authedRequest())).toBe(false);
  });

  it("token correct → isAuthorized vrai (comparaison constant-time)", () => {
    expect(isAuthorized(authedRequest())).toBe(true);
  });
});

describe("rate limit — SlidingWindowRateLimiter réutilisé", () => {
  it("au-delà de 60 req/min/IP → 429 RATE_LIMITED avant tout traitement", async () => {
    buildRevealMock.mockResolvedValue({ status: "GENERATED", payload: PAYLOAD_REVEAL });
    for (let i = 0; i < 60; i += 1) {
      const res = await getWord(authedRequest(), {
        params: Promise.resolve({ id: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
      });
      expect(res.status).toBe(200);
    }
    const limited = await getWord(authedRequest(), {
      params: Promise.resolve({ id: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
    });
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: { code: "RATE_LIMITED" } });
  });
});

describe("GET /words/:id — succès et erreurs", () => {
  it("succès → 200 avec le payload contractuel, aucun secret dans le corps", async () => {
    buildRevealMock.mockResolvedValue({ status: "GENERATED", payload: PAYLOAD_REVEAL });
    const res = await getWord(authedRequest(), {
      params: Promise.resolve({ id: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject(PAYLOAD_REVEAL);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
  });

  it("payload rejeté → REJECTED avec le code du contrat (422)", async () => {
    buildRevealMock.mockResolvedValue({
      status: "REJECTED",
      code: "NO_VALIDATED_MEANING",
      message: "Aucune glose FR validée",
    });
    const res = await getWord(authedRequest(), {
      params: Promise.resolve({ id: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
    });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      status: "REJECTED",
      error: { code: "NO_VALIDATED_MEANING", message: "Aucune glose FR validée" },
    });
  });

  it("paramètre invalide (non UUID) → 400 INVALID_WORD_ID", async () => {
    buildRevealMock.mockRejectedValue(new ContentApiError("INVALID_WORD_ID"));
    const res = await getWord(authedRequest(), {
      params: Promise.resolve({ id: "pas-un-uuid" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "INVALID_WORD_ID" } });
  });

  it("mot inconnu → 404 WORD_NOT_FOUND", async () => {
    buildRevealMock.mockRejectedValue(new ContentApiError("WORD_NOT_FOUND"));
    const res = await getWord(authedRequest(), {
      params: Promise.resolve({ id: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
    });
    expect(res.status).toBe(404);
  });

  it("erreur service inconnue → 500 INTERNAL_ERROR SANS stack trace ni message brut", async () => {
    buildRevealMock.mockRejectedValue(new Error("CONNEXION ÉCHOUÉE password=hunter2 secret"));
    const res = await getWord(authedRequest(), {
      params: Promise.resolve({ id: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: { code: "INTERNAL_ERROR" } });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("CONNEXION");
    expect(serialized).not.toContain("Error");
    expect(serialized).not.toContain("stack");
  });
});

describe("GET /quiz/:wordId", () => {
  it("succès → 200 payload quiz", async () => {
    buildQuizMock.mockResolvedValue({ status: "GENERATED", payload: PAYLOAD_QUIZ });
    const res = await getQuiz(authedRequest("/api/internal/content-studio/v1/quiz/x"), {
      params: Promise.resolve({ wordId: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject(PAYLOAD_QUIZ);
  });

  it("rejet du contrat → 422 REJECTED", async () => {
    buildQuizMock.mockResolvedValue({
      status: "REJECTED",
      code: "QUIZ_SHAPE",
      message: "exactement 4 options requis",
    });
    const res = await getQuiz(authedRequest(), {
      params: Promise.resolve({ wordId: "fc581cb3-8d05-410f-9373-a428c8d17e57" }),
    });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("QUIZ_SHAPE");
  });
});

describe("GET /word-candidates", () => {
  it("succès → 200 items + total réel", async () => {
    listCandidatesMock.mockResolvedValue(PAYLOAD_CANDIDATES);
    const res = await getCandidates(authedRequest("/api/internal/content-studio/v1/word-candidates?limit=20&offset=0"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(6095);
    expect(body.items[0].hasValidatedFrMeaning).toBe(true);
  });

  it("paramètre limit invalide → valeur par défaut (jamais NaN en base)", async () => {
    listCandidatesMock.mockResolvedValue(PAYLOAD_CANDIDATES);
    const res = await getCandidates(
      authedRequest("/api/internal/content-studio/v1/word-candidates?limit=abc"),
    );
    expect(res.status).toBe(200);
    expect(listCandidatesMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0 }),
    );
  });

  it("sans auth → 401", async () => {
    const res = await getCandidates(new Request("http://localhost/x"));
    expect(res.status).toBe(401);
  });
});

describe("réponses d'erreur déterministes (police REJECT OVER GUESS)", () => {
  it("mapping HTTP des codes de rejet du contrat", async () => {
    expect((await rejectedResponse("DUPLICATE_KEY", "d").json() as { error: { code: string } }).error.code).toBe("DUPLICATE_KEY");
    const dup = await rejectedResponse("DUPLICATE_KEY", "d");
    expect(dup.status).toBe(409);
    const unknownTemplate = await rejectedResponse("UNKNOWN_TEMPLATE", "d");
    expect(unknownTemplate.status).toBe(400);
    const other = await rejectedResponse("FALLBACK_EN", "d");
    expect(other.status).toBe(422);
  });

  it("errorResponse(ContentApiError) → body { error: { code } } sans message", async () => {
    const res = errorResponse(new ContentApiError("RATE_LIMITED"));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: { code: "RATE_LIMITED" } });
  });

  it("errorResponse(inconnu) → redaction des secrets", async () => {
    const res = errorResponse(new Error("token=SUPERSECRET123"));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("SUPERSECRET123");
  });
});
