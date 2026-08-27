// Hikma — Content Studio : EXCLUSIVITÉ ADMIN (exigence produit).
//
// Le SEUL administrateur autorisé est thiamabda@gmail.com. Ces tests
// verrouillent le comportement de isAdminEmail (lib/content-studio/admin.ts) :
// source de vérité unique ADMIN_EMAILS, normalisation lowercase (convention
// d'auth existante), rejet de tout autre email.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAdminEmail } from "../lib/content-studio/admin";

const SOLE_ADMIN = "thiamabda@gmail.com";

describe("isAdminEmail — exclusivité admin (ADMIN_EMAILS)", () => {
  const original = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    process.env.ADMIN_EMAILS = SOLE_ADMIN;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = original;
  });

  it("reconnaît l'unique admin configuré", () => {
    expect(isAdminEmail(SOLE_ADMIN)).toBe(true);
  });

  it("rejette tout autre email", () => {
    expect(isAdminEmail("autre@example.com")).toBe(false);
    expect(isAdminEmail("admin@hikma.app")).toBe(false);
    expect(isAdminEmail("thiamabda@outlook.com")).toBe(false);
  });

  it("rejette les valeurs vides", () => {
    expect(isAdminEmail("")).toBe(false);
    expect(isAdminEmail("   ")).toBe(false);
  });

  it("rejette null et undefined", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("normalise la casse selon la convention d'auth existante (lowercase)", () => {
    // La politique de normalisation du projet est .toLowerCase() (côté
    // ADMIN_EMAILS et côté email fourni) — cohérente avec l'auth Supabase.
    expect(isAdminEmail("THIAMABDA@GMAIL.COM")).toBe(true);
    expect(isAdminEmail("Thiamabda@Gmail.com")).toBe(true);
  });

  it("ignore les espaces autour des emails de la liste", () => {
    process.env.ADMIN_EMAILS = `  ${SOLE_ADMIN}  `;
    expect(isAdminEmail(SOLE_ADMIN)).toBe(true);
  });

  it("sans ADMIN_EMAILS, personne n'est admin (défaut sûr)", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail(SOLE_ADMIN)).toBe(false);
  });

  it("ADMIN_EMAILS vide → personne admin (défaut sûr)", () => {
    process.env.ADMIN_EMAILS = "";
    expect(isAdminEmail(SOLE_ADMIN)).toBe(false);
  });

  it("la liste multi-email ne donne accès qu'aux adresses listées (pas de wildcard)", () => {
    process.env.ADMIN_EMAILS = `${SOLE_ADMIN}, alice@example.com`;
    expect(isAdminEmail(SOLE_ADMIN)).toBe(true);
    expect(isAdminEmail("alice@example.com")).toBe(true);
    expect(isAdminEmail("bob@example.com")).toBe(false);
  });

  it("aucune adresse ne correspond si l'email fourni est un préfixe/suffixe", () => {
    expect(isAdminEmail(`${SOLE_ADMIN}x`)).toBe(false);
    expect(isAdminEmail(`x${SOLE_ADMIN}`)).toBe(false);
    // Attaques explicites (exigence Phase D) : suffixe et préfixe.
    expect(isAdminEmail(`${SOLE_ADMIN}.evil`)).toBe(false);
    expect(isAdminEmail(`evil@${SOLE_ADMIN}`)).toBe(false);
  });
});
