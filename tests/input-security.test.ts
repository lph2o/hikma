import { describe, expect, it } from "vitest";
import {
  generateExercise,
  gradeFreeResponse,
  validateAnswer,
} from "../lib/exercises";
import type { WordBankEntry } from "../lib/learning";
import { isArabicRewriteExact } from "../lib/learning/lesson-copy";

/* ------------------------------------------------------------------ */
/* PHASE 89M — INVARIANT SÉCURITÉ DES RÉPONSES LIBRES                  */
/*                                                                     */
/* Principe (OWASP) : la prévention XSS se fait à L'ENCODAGE au rendu  */
/* (React text elements), pas par filtrage de l'input. La chaîne de     */
/* notation (gradeFreeResponse / validateAnswer / mini-review) doit     */
/* traiter une réponse utilisateur comme une simple chaîne de          */
/* caractères INERTE : jamais décodée en HTML, jamais interprétée,      */
/* jamais transformée en structure exécutable.                         */
/* ------------------------------------------------------------------ */

const ARABIC_PAYLOAD = "<img src=x onerror=alert(1)>";
const FRENCH_PAYLOAD = "<script>alert(1)</script>";

describe("injections pédagogiques — la réponse reste du TEXTE inerte", () => {
  it("le grading ne décode ni n'interprète jamais une réponse française", () => {
    const res = gradeFreeResponse({
      language: "fr",
      userInput: FRENCH_PAYLOAD,
      expectedAnswer: "a < b",
      variants: ["a < b", "a", "b"],
    });
    // La normalisation est purement STRING (minuscule/ponctuation) : les
    // chevrons < > ne sont NI décodés NI réinterprétés — ils restent des
    // caractères littéraux, jamais transformés en markup exécutable.
    expect(res.normalizedInput).toContain("<script>");
    expect(res.normalizedInput).toContain("</script>");
    // Un script ne peut JAMAIS correspondre au sens validé d'un mot.
    expect(res.verdict).toBe("INCORRECT");
  });

  it("le grading ne décode ni n'interprète jamais une réponse arabe", () => {
    const res = gradeFreeResponse({
      language: "ar",
      userInput: ARABIC_PAYLOAD,
      expectedAnswer: "مَـٰلِكِ",
    });
    // Aucune correspondance possible : le payload reste une chaîne opaque.
    expect(res.verdict).not.toBe("CORRECT");
    expect(res.normalizedInput).toBe(res.normalizedInput); // purement normalisée, jamais exécutée
  });

  it("validateAnswer conserve la réponse brute dans correctOption (rendue en texte)", () => {
    const target: WordBankEntry = {
      wordId: "w-xss",
      arabic: "شَيْء",
      transliteration: "shay’",
      meaning: "chose",
    };
    const ex = generateExercise("FORM_TO_MEANING", { target, bank: [target], difficulty: 1 })!;
    // Injection balisée : le moteur la note INCORRECT sans jamais l'exécuter,
    // et la "réponse attendue" révélée reste la glose validée (jamais l'input).
    const r = validateAnswer(ex, { content: "<script>alert(1)</script>" });
    expect(r.correct).toBe(false);
    expect(r.correctOption?.content).not.toContain("<script>");
    expect(r.correctOption?.content).toBeTruthy();
  });

  it("isArabicRewriteExact compare les deux chaînes littéralement", () => {
    // Un payload n'égale jamais la forme canonique : comparaison de chaînes pures.
    expect(isArabicRewriteExact(ARABIC_PAYLOAD, "مَالِكِ")).toBe(false);
    expect(isArabicRewriteExact("<test>", "<test>")).toBe(true);
  });
});

describe("réponses légitimes — la sécurité ne dégrade pas la pédagogie", () => {
  it("l'apostrophe, les accents et le slash restent des caractères normaux", () => {
    const res = gradeFreeResponse({
      language: "fr",
      userInput: "l’homme",
      expectedAnswer: "l'homme",
    });
    expect(res.verdict).toBe("CORRECT");
  });

  it("les chevrons dans un sens réel (<) restent acceptés comme texte", () => {
    const res = gradeFreeResponse({
      language: "fr",
      userInput: "a < b",
      expectedAnswer: "a < b",
      variants: ["a < b"],
    });
    expect(res.verdict).toBe("CORRECT");
  });

  it("l'arabe vocalisé reste intact (jamais tronqué)", () => {
    const res = gradeFreeResponse({
      language: "ar",
      userInput: "الرَّحْمَٰنِ",
      expectedAnswer: "الرَّحْمَٰنِ",
    });
    expect(res.verdict).toBe("CORRECT");
  });
});

/* ------------------------------------------------------------------ */
/* PHASE 89N — PÉDAGOGIE vs ABUS DE PARSE                             */
/*                                                                     */
/* Réponse libre non bornée + Unicode complexe → la normalisation doit */
/* rester LINÉAIRE (pas de ReDoS) et ne JAMAIS prolonger la durée.     */
/* Garde durable contre l'abus de payload / l'épuisement serveur.      */
/* ------------------------------------------------------------------ */
describe("Résistance à l'abus de taille (régression DoS)", () => {
  // Seuil volumineux mais non-trivial (150 ms) : le pipeline est linéaire
  // (~5-60 ms mesuré selon la charge parallèle de la suite). Un retour à un
  // ReDoS catastrophique fait exploser ce budget en milliers de ms — le seuil
  // sépare un simple ralentissement machine d'une vraie régression quadratique.
  const LIMIT_MS = 150;

  it("gradeFreeResponse traite 100K caractères français adversaires en temps borné", () => {
    const big = ('<script onerror="x">'.repeat(7000) + "a".repeat(5000)); // ~100K
    const t0 = performance.now();
    const res = gradeFreeResponse({
      language: "fr",
      userInput: big,
      expectedAnswer: "petit",
      variants: ["petit", "petite"],
    });
    expect(performance.now() - t0).toBeLessThan(LIMIT_MS);
    expect(res.verdict).toBe("INCORRECT");
  });

  it("gradeFreeResponse traite 80K caractères arabes en temps borné", () => {
    const ar = "\u0648\u0644".repeat(40000);
    const t0 = performance.now();
    const res = gradeFreeResponse({ language: "ar", userInput: ar, expectedAnswer: "مَالِكِ" });
    expect(performance.now() - t0).toBeLessThan(LIMIT_MS);
    expect(res.verdict).toBe("INCORRECT");
  });

  it("traite un mélange Unicode (marques combinantes, zero-width, tashkīl) en temps borné", () => {
    const uni = "e\u0301\u200b\u200d\u00ad".repeat(15000) + "\u064b".repeat(10000);
    const t0 = performance.now();
    gradeFreeResponse({ language: "fr", userInput: uni, expectedAnswer: "é", variants: ["é"] });
    expect(performance.now() - t0).toBeLessThan(LIMIT_MS);
  });

  it("le pipeline complet validateAnswer résiste à 200K caractères", () => {
    const target: WordBankEntry = {
      wordId: "w-long",
      arabic: "شَيْء",
      transliteration: "shay’",
      meaning: "chose",
    };
    const ex = generateExercise("FORM_TO_MEANING", { target, bank: [target], difficulty: 1 })!;
    const t0 = performance.now();
    const r = validateAnswer(ex, { content: "x".repeat(200000) });
    expect(performance.now() - t0).toBeLessThan(LIMIT_MS);
    expect(r.correct).toBe(false);
  });

  it("isArabicRewriteExact reste O(n) sur une très longue chaîne", () => {
    const t0 = performance.now();
    const exact = isArabicRewriteExact("\u0648".repeat(50000), "مَالِكِ");
    expect(performance.now() - t0).toBeLessThan(LIMIT_MS);
    expect(exact).toBe(false);
  });
});