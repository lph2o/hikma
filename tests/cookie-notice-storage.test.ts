import { describe, expect, it } from "vitest";
import {
  buildAcknowledgedState,
  COOKIE_NOTICE_KEY,
  COOKIE_NOTICE_VERSION,
  createCookieNoticeStorage,
  parseNoticeState,
  visibilityFromRaw,
} from "../lib/privacy/cookie-notice-storage";

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    dump: () => Object.fromEntries(map),
  };
}

describe("parseNoticeState / visibilityFromRaw", () => {
  it("absence de valeur → notice visible", () => {
    expect(visibilityFromRaw(null)).toEqual({ visible: true, acknowledged: false });
  });

  it("v1 enregistrée → notice masquée", () => {
    const raw = JSON.stringify(buildAcknowledgedState(new Date("2026-08-25T00:00:00Z")));
    expect(parseNoticeState(raw)?.version).toBe(COOKIE_NOTICE_VERSION);
    expect(visibilityFromRaw(raw)).toEqual({ visible: false, acknowledged: true });
  });

  it("version inconnue / ancienne → notice visible (évolution de politique)", () => {
    const old = JSON.stringify({ version: 0, acknowledgedAt: "2025-01-01T00:00:00Z", categories: { necessary: true } });
    expect(visibilityFromRaw(old)).toEqual({ visible: true, acknowledged: false });
  });

  it("valeur corrompue → comportement sûr (notice visible)", () => {
    expect(visibilityFromRaw("{not json")).toEqual({ visible: true, acknowledged: false });
    expect(visibilityFromRaw("42")).toEqual({ visible: true, acknowledged: false });
    expect(visibilityFromRaw(JSON.stringify({ version: 1 }))).toEqual({ visible: true, acknowledged: false });
    expect(visibilityFromRaw(JSON.stringify({ version: 1, acknowledgedAt: "x", categories: { necessary: false } }))).toEqual({ visible: true, acknowledged: false });
  });
});

describe("createCookieNoticeStorage", () => {
  it("read() sans stockage (SSR) → visible", () => {
    const storage = createCookieNoticeStorage(undefined);
    expect(storage.read().visible).toBe(true);
    expect(() => storage.acknowledge()).not.toThrow();
  });

  it("acknowledge() persiste la bonne structure, sans catégorie inexistante", () => {
    const s = fakeStorage();
    const storage = createCookieNoticeStorage(s);
    storage.acknowledge(new Date("2026-08-25T10:00:00Z"));

    const raw = s.dump()[COOKIE_NOTICE_KEY];
    expect(raw).toBeDefined();
    const state = JSON.parse(raw as string) as ReturnType<typeof buildAcknowledgedState>;
    expect(state.version).toBe(COOKIE_NOTICE_VERSION);
    expect(state.acknowledgedAt).toBe("2026-08-25T10:00:00.000Z");
    expect(state.categories).toEqual({ necessary: true });
    expect("analytics" in state.categories).toBe(false);
    expect("marketing" in state.categories).toBe(false);
  });

  it("après acknowledge(), read() → masquée", () => {
    const s = fakeStorage();
    const storage = createCookieNoticeStorage(s);
    expect(storage.read().visible).toBe(true);
    storage.acknowledge();
    expect(storage.read().visible).toBe(false);
  });

  it("storage indisponible (exception) → comportement sûr", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    const storage = createCookieNoticeStorage(broken);
    expect(storage.read().visible).toBe(true);
    expect(() => storage.acknowledge()).not.toThrow();
  });
});
