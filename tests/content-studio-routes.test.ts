import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listItems, POST as generateItem } from "../app/api/internal/content-studio/v1/items/route";
import { GET as getItem, PATCH as patchItem } from "../app/api/internal/content-studio/v1/items/[contentKey]/route";
import { POST as exportItem } from "../app/api/internal/content-studio/v1/items/[contentKey]/export/route";
import { contentStudioRateLimiter } from "../lib/content-api/http";
import { REVEAL_FIXTURE_YAWMA } from "../lib/content-studio/video/fixtures";

// ---------------------------------------------------------------------------
// Modules mockés : génération + registre + clients DB. Les ROUTES réelles sont
// exécutées (auth, rate limit, mapping d'erreurs, réponses).
// ---------------------------------------------------------------------------

const { generateMock, listMock, getMock, setStatusMock, isExportAllowedMock, setRenderStatusMock } =
  vi.hoisted(() => ({
    generateMock: vi.fn(),
    listMock: vi.fn(),
    getMock: vi.fn(),
    setStatusMock: vi.fn(),
    isExportAllowedMock: vi.fn(),
    setRenderStatusMock: vi.fn(),
  }));

vi.mock("../lib/content-studio/generate", () => ({
  ContentGenerationService: vi.fn().mockImplementation(function (this: unknown) {
    return { generate: generateMock };
  }),
}));

vi.mock("../lib/content-studio/registry", () => ({
  ContentRegistryService: vi.fn().mockImplementation(function (this: unknown) {
    return {
      list: listMock,
      getByContentKey: getMock,
      setStatus: setStatusMock,
      setRenderStatus: setRenderStatusMock,
      isExportAllowed: isExportAllowedMock,
    };
  }),
}));

vi.mock("../lib/content-studio/client", () => ({
  getContentStudioDbClient: () => ({ mock: true }),
}));

const TOKEN = "studio-test-token";
const IP = "198.51.100.7";
const CONTENT_KEY = "1f419cf7aac14afe30f1a0afc5b7a73b14aa9dfa1a4f0ad1ab843caafc03df60";

const ITEM = {
  id: "id-1",
  contentKey: CONTENT_KEY,
  templateKey: "WORD_REVEAL_V1",
  templateVersion: "1",
  language: "fr",
  wordId: REVEAL_FIXTURE_YAWMA.word.id,
  hookVariantId: "HOOK_H1",
  ctaId: "CTA_LEARN_01",
  status: "DRAFT",
  version: 1,
  renderStatus: "NOT_RENDERED",
  renderedAt: null,
  renderError: null,
  renderPath: null,
  payload: REVEAL_FIXTURE_YAWMA as unknown as Record<string, unknown>,
  sources: REVEAL_FIXTURE_YAWMA.sources as unknown as Record<string, unknown>,
  licenses: REVEAL_FIXTURE_YAWMA.licenses as unknown as Record<string, unknown>,
  createdAt: "2026-08-27T09:00:00.000Z",
  updatedAt: "2026-08-27T09:00:00.000Z",
};

function authed(path: string, method = "GET") {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
  });
}

beforeEach(() => {
  process.env.CONTENT_API_TOKEN = TOKEN;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  contentStudioRateLimiter.reset();
  vi.clearAllMocks();
  isExportAllowedMock.mockReturnValue(true);
});

afterEach(() => {
  delete process.env.CONTENT_API_TOKEN;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  contentStudioRateLimiter.reset();
});

describe("auth + rate limit (mêmes gardes que la Content API)", () => {
  it("sans token → 401, aucun détail", async () => {
    const res = await listItems(new Request("http://localhost/x"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { code: "UNAUTHORIZED" } });
    expect(listMock).not.toHaveBeenCalled();
  });

  it("token invalide → 401 sans fuite", async () => {
    const res = await listItems(
      new Request("http://localhost/x", {
        headers: { authorization: "Bearer mauvais", "x-forwarded-for": IP },
      }),
    );
    expect(res.status).toBe(401);
    expect(JSON.stringify(await res.json())).not.toContain("mauvais");
  });

  it("au-delà de 60 req/min/IP → 429 avant tout traitement", async () => {
    listMock.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 });
    for (let i = 0; i < 60; i += 1) {
      const res = await listItems(authed("/api/internal/content-studio/v1/items"));
      expect(res.status).toBe(200);
    }
    const limited = await listItems(authed("/api/internal/content-studio/v1/items"));
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.code).toBe("RATE_LIMITED");
  });
});

describe("GET /items", () => {
  it("liste avec filtre statut + pagination", async () => {
    listMock.mockResolvedValue({ items: [ITEM], total: 1, limit: 50, offset: 0 });
    const res = await listItems(authed("/api/internal/content-studio/v1/items?status=DRAFT&limit=50"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items[0].contentKey).toBe(CONTENT_KEY);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ status: "DRAFT", limit: 50 }));
  });

  it("statut inconnu → ignoré (pas de 500)", async () => {
    listMock.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 });
    const res = await listItems(authed("/api/internal/content-studio/v1/items?status=FOO"));
    expect(res.status).toBe(200);
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ status: undefined }));
  });
});

describe("POST /items (génération)", () => {
  it("génération OK → 201 avec item + created, aucun secret", async () => {
    generateMock.mockResolvedValue({ status: "GENERATED", item: ITEM, created: true });
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      body: JSON.stringify({ wordId: "fc581cb3-8d05-410f-9373-a428c8d17e57", templateKey: "WORD_REVEAL_V1" }),
    });
    const res = await generateItem(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
  });

  it("payload REJECTED par la Content API → 422 REJECTED (reject codes respectés)", async () => {
    generateMock.mockResolvedValue({
      status: "REJECTED",
      code: "NO_VALIDATED_MEANING",
      message: "Aucune glose FR validée",
    });
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      body: JSON.stringify({ wordId: "fc581cb3-8d05-410f-9373-a428c8d17e57", templateKey: "WORD_REVEAL_V1" }),
    });
    const res = await generateItem(req);
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("NO_VALIDATED_MEANING");
  });

  it("corps invalide → 400 INVALID_REQUEST", async () => {
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      body: JSON.stringify({}),
    });
    const res = await generateItem(req);
    expect(res.status).toBe(400);
  });

  it("template non générable (ROOT_FAMILY_V1) → 400 INVALID_REQUEST (pas de builder en V1)", async () => {
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      body: JSON.stringify({ wordId: "fc581cb3-8d05-410f-9373-a428c8d17e57", templateKey: "ROOT_FAMILY_V1" }),
    });
    const res = await generateItem(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_REQUEST");
    expect(generateMock).not.toHaveBeenCalled();
  });
});

describe("GET/PATCH /items/:contentKey", () => {
  it("GET contenu existant → 200", async () => {
    getMock.mockResolvedValue(ITEM);
    const res = await getItem(authed("/x"), { params: Promise.resolve({ contentKey: CONTENT_KEY }) });
    expect(res.status).toBe(200);
  });

  it("GET inconnu → 404 CONTENT_NOT_FOUND", async () => {
    getMock.mockResolvedValue(null);
    const res = await getItem(authed("/x"), { params: Promise.resolve({ contentKey: CONTENT_KEY }) });
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("CONTENT_NOT_FOUND");
  });

  it("PATCH transition interdite → 409 INVALID_TRANSITION", async () => {
    setStatusMock.mockRejectedValue(new Error("INVALID_TRANSITION: DRAFT → PUBLISHED"));
    const req = new Request("http://localhost/x", {
      method: "PATCH",
      headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    const res = await patchItem(req, { params: Promise.resolve({ contentKey: CONTENT_KEY }) });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_TRANSITION");
    expect(JSON.stringify(body)).not.toContain("mauvais");
  });

  it("PATCH publication sans rendu → 422 RENDER_REQUIRED", async () => {
    setStatusMock.mockRejectedValue(new Error("RENDER_REQUIRED: PUBLISHED exige render_status = RENDERED"));
    const req = new Request("http://localhost/x", {
      method: "PATCH",
      headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    const res = await patchItem(req, { params: Promise.resolve({ contentKey: CONTENT_KEY }) });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe("RENDER_REQUIRED");
  });

  it("PATCH statut invalide → 400", async () => {
    const req = new Request("http://localhost/x", {
      method: "PATCH",
      headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      body: JSON.stringify({ status: "FOO" }),
    });
    const res = await patchItem(req, { params: Promise.resolve({ contentKey: CONTENT_KEY }) });
    expect(res.status).toBe(400);
  });
});

describe("POST /items/:contentKey/export", () => {
  it("export autorisé → bundle EXPORTED, published=false", async () => {
    getMock.mockResolvedValue(ITEM);
    setStatusMock.mockResolvedValue({ ...ITEM, status: "EXPORTED" });
    isExportAllowedMock.mockReturnValue(true);
    const res = await exportItem(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      }),
      { params: Promise.resolve({ contentKey: CONTENT_KEY }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bundle.status).toBe("EXPORTED");
    expect(body.bundle.published).toBe(false);
    expect(JSON.stringify(body)).not.toContain(TOKEN);
  });

  it("export depuis un statut interdit → 409", async () => {
    getMock.mockResolvedValue({ ...ITEM, status: "PUBLISHED" });
    isExportAllowedMock.mockReturnValue(false);
    const res = await exportItem(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      }),
      { params: Promise.resolve({ contentKey: CONTENT_KEY }) },
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("INVALID_TRANSITION");
  });

  it("contenu inconnu → 404", async () => {
    getMock.mockResolvedValue(null);
    const res = await exportItem(
      new Request("http://localhost/x", {
        method: "POST",
        headers: { authorization: `Bearer ${TOKEN}`, "x-forwarded-for": IP },
      }),
      { params: Promise.resolve({ contentKey: CONTENT_KEY }) },
    );
    expect(res.status).toBe(404);
  });
});
