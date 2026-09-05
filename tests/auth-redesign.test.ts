import { describe, expect, it } from "vitest";
import { validateEmailForReset, validatePasswordResetInput } from "@/lib/auth/password-reset";

describe("Auth Redesign — Validation & Logic Integrity", () => {
  describe("Password Reset validation constraints", () => {
    it("rejects empty email and invalid formats", () => {
      expect(validateEmailForReset("")).toBe("Renseigne ton adresse e-mail.");
      expect(validateEmailForReset("notanemail")).toBe(
        "Cette adresse e-mail semble invalide.",
      );
      expect(validateEmailForReset("valid.user@hikma.top")).toBeNull();
    });

    it("enforces minimum 6 characters on new password", () => {
      expect(validatePasswordResetInput("", "")).toBe(
        "Renseigne un nouveau mot de passe.",
      );
      expect(validatePasswordResetInput("12345", "12345")).toBe(
        "Le mot de passe doit contenir au moins 6 caractères.",
      );
      expect(validatePasswordResetInput("123456", "different")).toBe(
        "Les deux mots de passe ne correspondent pas.",
      );
      expect(validatePasswordResetInput("123456", "123456")).toBeNull();
    });
  });

  describe("Anti-enumeration & Security contracts", () => {
    it("requestPasswordResetCore returns neutral confirmation info for any well-formed email", async () => {
      const { requestPasswordResetCore } = await import("@/lib/auth/password-reset");
      const mockReset = async () => ({ data: {}, error: null });

      const result = await requestPasswordResetCore(
        "test@hikma.top",
        "https://hikma.top",
        mockReset,
      );

      expect(result.error).toBeNull();
      expect(result.info).toContain("tu recevras un e-mail avec les instructions");
    });
  });
});
