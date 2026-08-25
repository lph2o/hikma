import { describe, expect, it, vi } from "vitest";
import {
  NEUTRAL_RESET_INFO,
  hasRecoverySession,
  requestPasswordResetCore,
  updatePasswordCore,
  validateEmailForReset,
  validatePasswordResetInput,
} from "../lib/auth/password-reset";

describe("validateEmailForReset", () => {
  it("e-mail vide → erreur", () => {
    expect(validateEmailForReset("")).toBe("Renseigne ton adresse e-mail.");
  });

  it("format invalide → erreur", () => {
    expect(validateEmailForReset("pas-un-email")).toBeTruthy();
    expect(validateEmailForReset("a@b")).toBeTruthy();
  });

  it("format valide → null", () => {
    expect(validateEmailForReset("toi@exemple.fr")).toBeNull();
  });
});

describe("validatePasswordResetInput", () => {
  it("mot de passe vide → erreur", () => {
    expect(validatePasswordResetInput("", "x")).toBe(
      "Renseigne un nouveau mot de passe.",
    );
  });

  it("trop court (< 6) → erreur", () => {
    expect(validatePasswordResetInput("abcde", "abcde")).toContain("6 caractères");
  });

  it("confirmation différente → erreur", () => {
    expect(validatePasswordResetInput("abcdef", "abcdefg")).toBe(
      "Les deux mots de passe ne correspondent pas.",
    );
  });

  it("valide (≥ 6, identiques) → null", () => {
    expect(validatePasswordResetInput("abcdef", "abcdef")).toBeNull();
  });
});

describe("hasRecoverySession", () => {
  it("session nulle / sans amr → false", () => {
    expect(hasRecoverySession(null)).toBe(false);
    expect(hasRecoverySession({})).toBe(false);
    expect(hasRecoverySession({ amr: null })).toBe(false);
    expect(hasRecoverySession({ amr: [] })).toBe(false);
  });

  it("session login normale (password) → false", () => {
    expect(hasRecoverySession({ amr: [{ method: "password" }] })).toBe(false);
  });

  it("session de récupération (amr recovery, objet) → true", () => {
    expect(hasRecoverySession({ amr: [{ method: "recovery" }] })).toBe(true);
    expect(
      hasRecoverySession({ amr: [{ method: "password" }, { method: "recovery" }] }),
    ).toBe(true);
  });

  it("amr sous forme de chaînes → géré", () => {
    expect(hasRecoverySession({ amr: ["recovery"] })).toBe(true);
    expect(hasRecoverySession({ amr: ["password"] })).toBe(false);
  });

  it("session sans amr mais JWT avec amr recovery (fallback token) → true", () => {
    const token = fakeJwt({ amr: [{ method: "recovery" }] });
    expect(hasRecoverySession({ access_token: token })).toBe(true);
  });

  it("session sans amr et JWT sans recovery → false", () => {
    const token = fakeJwt({ amr: [{ method: "password" }] });
    expect(hasRecoverySession({ access_token: token })).toBe(false);
  });

  it("JWT invalide → false (aucun crash)", () => {
    expect(hasRecoverySession({ access_token: "pas-un-jwt" })).toBe(false);
  });
});

/** Fabrique un faux JWT avec le payload donné (décodable par hasRecoverySession). */
function fakeJwt(payload: Record<string, unknown>): string {
  const enc = (o: Record<string, unknown>) =>
    btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${enc({ alg: "none" })}.${enc(payload)}.signature`;
}

describe("requestPasswordResetCore", () => {
  it("e-mail vide → erreur, aucun envoi", async () => {
    const send = vi.fn();
    const state = await requestPasswordResetCore("", "https://app.example", send);
    expect(state.error).toBeTruthy();
    expect(send).not.toHaveBeenCalled();
  });

  it("e-mail invalide → erreur, aucun envoi", async () => {
    const send = vi.fn();
    const state = await requestPasswordResetCore("nope", "https://app.example", send);
    expect(state.error).toBeTruthy();
    expect(send).not.toHaveBeenCalled();
  });

  it("e-mail valide → un seul appel avec redirectTo = base + /reset-password", async () => {
    const send = vi.fn().mockResolvedValue({ error: null });
    const state = await requestPasswordResetCore(
      "toi@exemple.fr",
      "https://app.example",
      send,
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("https://app.example/reset-password");
    expect(state.error).toBeNull();
    expect(state.info).toBe(NEUTRAL_RESET_INFO);
  });

  it("base avec slash final → pas de double slash", async () => {
    const send = vi.fn().mockResolvedValue({ error: null });
    await requestPasswordResetCore("toi@exemple.fr", "https://app.example/", send);
    expect(send).toHaveBeenCalledWith("https://app.example/reset-password");
  });

  it("erreur d'envoi → message générique neutre (pas d'énumération)", async () => {
    const send = vi.fn().mockResolvedValue({ error: { message: "rate limited" } });
    const state = await requestPasswordResetCore(
      "toi@exemple.fr",
      "https://app.example",
      send,
    );
    expect(state.error).toBeTruthy();
    expect(state.info).toBeNull();
  });

  it("le message neutre ne révèle jamais l'existence d'un compte", () => {
    expect(NEUTRAL_RESET_INFO.toLowerCase()).not.toContain("n'existe pas");
    expect(NEUTRAL_RESET_INFO.toLowerCase()).not.toContain("inexistant");
  });
});

describe("updatePasswordCore", () => {
  it("mot de passe vide → erreur, aucun appel", async () => {
    const change = vi.fn();
    const state = await updatePasswordCore("", "x", change);
    expect(state.error).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });

  it("confirmation différente → erreur, aucun appel", async () => {
    const change = vi.fn();
    const state = await updatePasswordCore("abcdef", "zzzzzz", change);
    expect(state.error).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });

  it("trop court → erreur, aucun appel", async () => {
    const change = vi.fn();
    const state = await updatePasswordCore("abcde", "abcde", change);
    expect(state.error).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });

  it("valide → un seul appel avec le nouveau mot de passe, succès", async () => {
    const change = vi.fn().mockResolvedValue({ error: null });
    const state = await updatePasswordCore("nouveau-mot-de-passe", "nouveau-mot-de-passe", change);
    expect(change).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledWith("nouveau-mot-de-passe");
    expect(state.error).toBeNull();
    expect(state.info).toContain("modifié");
  });

  it("erreur Supabase → message générique, jamais un token", async () => {
    const change = vi.fn().mockResolvedValue({ error: { message: "invalid token" } });
    const state = await updatePasswordCore("abcdef", "abcdef", change);
    expect(state.error).toBeTruthy();
    expect(state.error).not.toContain("token");
  });
});
