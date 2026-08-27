import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canExport,
  canTransition,
  isTerminal,
  requiresReapproval,
} from "../lib/content-studio/workflow";

describe("machine à états éditoriale (workflow.ts)", () => {
  it("chemin nominal complet autorisé", () => {
    expect(canTransition("DRAFT", "REVIEW")).toBe(true);
    expect(canTransition("REVIEW", "APPROVED")).toBe(true);
    expect(canTransition("APPROVED", "SCHEDULED")).toBe(true);
    expect(canTransition("SCHEDULED", "PUBLISHED")).toBe(true);
  });

  it("DRAFT → PUBLISHED INTERDIT (approval obligatoire)", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(false);
    expect(canTransition("REVIEW", "PUBLISHED")).toBe(false);
    expect(() => assertTransition("DRAFT", "PUBLISHED")).toThrow(/INVALID_TRANSITION/);
    expect(() => assertTransition("REVIEW", "PUBLISHED")).toThrow(/INVALID_TRANSITION/);
  });

  it("toutes les transitions interdites listées", () => {
    // DRAFT : review/rejected/archived/exported seulement
    for (const to of ["PUBLISHED", "APPROVED", "SCHEDULED"] as const) {
      expect(canTransition("DRAFT", to)).toBe(false);
    }
    // REVIEW : rien vers PUBLISHED directement
    expect(canTransition("REVIEW", "SCHEDULED")).toBe(false);
    // APPROVED : pas de skip du scheduling vers PUBLISHED sans SCHEDULED
    expect(canTransition("APPROVED", "PUBLISHED")).toBe(false);
  });

  it("rejet et retravail", () => {
    expect(canTransition("REVIEW", "REJECTED")).toBe(true);
    expect(canTransition("REJECTED", "DRAFT")).toBe(true); // retravail
  });

  it("archive/restauration", () => {
    expect(canTransition("PUBLISHED", "ARCHIVED")).toBe(true);
    expect(canTransition("ARCHIVED", "DRAFT")).toBe(true);
    // PUBLISHED est quasi-terminal
    expect(canTransition("PUBLISHED", "DRAFT")).toBe(false);
    expect(isTerminal("ARCHIVED")).toBe(true);
  });

  it("export : DRAFT/REVIEW/APPROVED/SCHEDULED oui ; PUBLISHED/REJECTED/ARCHIVED/EXPORTED non", () => {
    expect(canExport("DRAFT")).toBe(true);
    expect(canExport("REVIEW")).toBe(true);
    expect(canExport("APPROVED")).toBe(true);
    expect(canExport("SCHEDULED")).toBe(true);
    expect(canExport("PUBLISHED")).toBe(false);
    expect(canExport("REJECTED")).toBe(false);
    expect(canExport("ARCHIVED")).toBe(false);
    expect(canExport("EXPORTED")).toBe(false);
  });

  it("modification substantielle d'un contenu engagé ⇒ nouvelle validation", () => {
    expect(requiresReapproval("APPROVED")).toBe(true);
    expect(requiresReapproval("SCHEDULED")).toBe(true);
    expect(requiresReapproval("EXPORTED")).toBe(true);
    expect(requiresReapproval("PUBLISHED")).toBe(true);
    expect(requiresReapproval("DRAFT")).toBe(false);
    expect(requiresReapproval("REVIEW")).toBe(false);
    expect(requiresReapproval("REJECTED")).toBe(false);
    expect(requiresReapproval("ARCHIVED")).toBe(false);
  });
});
