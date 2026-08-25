import { describe, expect, it } from "vitest";
import {
  buildServerErrorEvent,
  redactSensitive,
  sanitizeClientPayload,
  serializeEvent,
  SlidingWindowRateLimiter,
  truncate,
} from "../lib/observability/sanitize";

describe("redactSensitive", () => {
  it("redacte les tokens et secrets dans les messages", () => {
    const text = "auth failed: access_token=eyJhbGciOiJIUzI1NiJ9&code=abc123";
    const out = redactSensitive(text);
    expect(out).not.toContain("eyJhbGci");
    expect(out).not.toContain("abc123");
    expect(out).toContain("access_token=[REDACTED]");
    expect(out).toContain("code=[REDACTED]");
  });

  it("laisse le texte innocent intact", () => {
    expect(redactSensitive("mot de passe oublié")).toBe("mot de passe oublié");
  });
});

describe("truncate", () => {
  it("tronque au-delà de la limite", () => {
    expect(truncate("abcdef", 3)).toBe("abc…[truncated]");
    expect(truncate("abc", 3)).toBe("abc");
  });
});

describe("buildServerErrorEvent", () => {
  it("n'inclut jamais de headers, cookies ou query string", () => {
    const event = buildServerErrorEvent(
      new Error("boom"),
      { path: "/surahs/1?code=SECRET_TOKEN", method: "GET" },
      { routeType: "render" },
    );
    expect(event.kind).toBe("server");
    expect(event.context?.path).toBe("/surahs/1");
    expect(event.context?.path).not.toContain("SECRET_TOKEN");
    expect(event.context?.method).toBe("GET");
    expect(event.context?.routeType).toBe("render");
    expect(JSON.stringify(event)).not.toContain("headers");
    expect(JSON.stringify(event)).not.toContain("cookie");
  });

  it("redacte les secrets dans les messages d'erreur", () => {
    const event = buildServerErrorEvent(
      new Error("fetch failed: token=leakme"),
      { path: "/dashboard", method: "GET" },
      {},
    );
    expect(event.error.message).not.toContain("leakme");
  });

  it("gère les erreurs non-Error (string, null)", () => {
    const s = buildServerErrorEvent("plain string error", { path: "/", method: "GET" }, {});
    expect(s.error.message).toBe("plain string error");
    const n = buildServerErrorEvent(null, { path: "/", method: "GET" }, {});
    expect(n.error.name).toBe("UnknownError");
  });
});

describe("sanitizeClientPayload", () => {
  it("n'accepte que les champs en liste blanche et redacte", () => {
    const event = sanitizeClientPayload({
      name: "TypeError",
      message: "x is undefined token=zzz",
      stack: "at fn (app.js:1:2)",
      path: "/learn/basmala?token=zzz",
      source: "window.onerror",
      extraSecret: "should-not-appear",
      cookies: "sb-token=abc",
    });
    expect(event).not.toBeNull();
    expect(event?.error.message).not.toContain("zzz");
    expect(event?.context?.path).toBe("/learn/basmala");
    expect(event?.context?.source).toBe("window.onerror");
    expect(JSON.stringify(event)).not.toContain("extraSecret");
    expect(JSON.stringify(event)).not.toContain("cookies");
  });

  it("rejette les payloads invalides", () => {
    expect(sanitizeClientPayload(null)).toBeNull();
    expect(sanitizeClientPayload("nope")).toBeNull();
    expect(sanitizeClientPayload({})).toBeNull();
    expect(sanitizeClientPayload({ message: "", path: "/" })).toBeNull();
    expect(sanitizeClientPayload({ message: "x", path: 42 })).toBeNull();
  });
});

describe("serializeEvent", () => {
  it("produit une ligne JSON unique préfixée", () => {
    const line = serializeEvent({
      ts: "2026-01-01T00:00:00.000Z",
      env: "production",
      release: "abc123",
      kind: "server",
      error: { name: "Error", message: "boom" },
    });
    expect(line.startsWith("[hikma-observability] ")).toBe(true);
    expect(() => JSON.parse(line.slice("[hikma-observability] ".length))).not.toThrow();
  });
});

describe("SlidingWindowRateLimiter", () => {
  it("autorise puis bloque après le seuil sur la fenêtre", () => {
    const limiter = new SlidingWindowRateLimiter(3, 60_000);
    expect(limiter.allow("ip1", 1000)).toBe(true);
    expect(limiter.allow("ip1", 2000)).toBe(true);
    expect(limiter.allow("ip1", 3000)).toBe(true);
    expect(limiter.allow("ip1", 4000)).toBe(false);
  });

  it("n'affecte pas les autres clés", () => {
    const limiter = new SlidingWindowRateLimiter(1, 60_000);
    expect(limiter.allow("a", 1000)).toBe(true);
    expect(limiter.allow("b", 1000)).toBe(true);
    expect(limiter.allow("a", 2000)).toBe(false);
  });

  it("laisse expirer la fenêtre", () => {
    const limiter = new SlidingWindowRateLimiter(1, 100);
    expect(limiter.allow("ip1", 1000)).toBe(true);
    expect(limiter.allow("ip1", 1001)).toBe(false);
    expect(limiter.allow("ip1", 1101)).toBe(true);
  });
});
