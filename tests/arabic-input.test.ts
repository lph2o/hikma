import { describe, expect, it } from "vitest";
import {
  ARABIC_KEYBOARD_DIACRITICS,
  ARABIC_KEYBOARD_LETTERS,
  backspaceAtCursor,
  insertTextAtCursor,
} from "../lib/ui/arabic-input";

describe("clavier arabe — jeux de caractères", () => {
  it("expose toutes les lettres requises sans doublon", () => {
    const letters = ARABIC_KEYBOARD_LETTERS.flat();
    const required = [
      "ا", "أ", "إ", "آ", "ء", "ؤ", "ئ", "ة", "ى", "ي", "و",
      "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س",
      "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل",
      "م", "ن", "ه",
    ];
    for (const r of required) expect(letters).toContain(r);
    expect(new Set(letters).size).toBe(letters.length);
  });

  it("fournit les diacritiques sur une couche secondaire (dont dagger alef et wasla)", () => {
    expect(ARABIC_KEYBOARD_DIACRITICS).toContain("\u064E"); // fatha
    expect(ARABIC_KEYBOARD_DIACRITICS).toContain("\u0651"); // shadda
    expect(ARABIC_KEYBOARD_DIACRITICS).toContain("\u0670"); // dagger alef
    expect(ARABIC_KEYBOARD_DIACRITICS).toContain("\u0671"); // wasla
  });
});

describe("clavier arabe — insertion à la position du curseur", () => {
  it("insère à la fin quand le curseur est en fin de chaîne", () => {
    const { value, caret } = insertTextAtCursor("ما", 2, 2, "ل");
    expect(value).toBe("مال");
    expect(caret).toBe(3);
  });

  it("insère au milieu (position du curseur)", () => {
    const { value, caret } = insertTextAtCursor("مال", 2, 2, "ا");
    expect(value).toBe("ماال");
    expect(caret).toBe(3);
  });

  it("remplace la sélection lors d'une insertion", () => {
    const { value, caret } = insertTextAtCursor("مالك", 1, 3, "ل");
    expect(value).toBe("ملك");
    expect(caret).toBe(2);
  });

  it("borne le curseur hors limites", () => {
    const { value } = insertTextAtCursor("ما", 99, 99, "ل");
    expect(value).toBe("مال");
  });
});

describe("clavier arabe — suppression arrière", () => {
  it("supprime le caractère précédent le curseur", () => {
    // م ا ل ك → curseur en fin (4) supprime ك → م ا ل
    const { value, caret } = backspaceAtCursor("مالك", 4, 4);
    expect(value).toBe("مال");
    expect(caret).toBe(3);
  });

  it("supprime la sélection en bloc", () => {
    const { value, caret } = backspaceAtCursor("مالك", 1, 3);
    expect(value).toBe("مك");
    expect(caret).toBe(1);
  });

  it("ne fait rien au début de la chaîne", () => {
    const { value, caret } = backspaceAtCursor("ما", 0, 0);
    expect(value).toBe("ما");
    expect(caret).toBe(0);
  });
});
