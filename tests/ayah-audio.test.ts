import { describe, expect, it } from "vitest";
import {
  getAyahAudioCdnUrl,
  getAyahAudioUrl,
  isValidGlobalAyahNumber,
  DEFAULT_AYAH_RECITER,
  DEFAULT_AYAH_BITRATE,
  type AyahReciter,
  type AyahBitrate,
} from "../lib/quran/ayah-audio";

// ---------------------------------------------------------------------------
// isValidGlobalAyahNumber
// ---------------------------------------------------------------------------

describe("isValidGlobalAyahNumber", () => {
  it("1 → valide", () => {
    expect(isValidGlobalAyahNumber(1)).toBe(true);
  });

  it("6236 → valide", () => {
    expect(isValidGlobalAyahNumber(6236)).toBe(true);
  });

  it("7 → valide (milieu)", () => {
    expect(isValidGlobalAyahNumber(7)).toBe(true);
  });

  it("0 → invalide", () => {
    expect(isValidGlobalAyahNumber(0)).toBe(false);
  });

  it("6237 → invalide (hors bornes)", () => {
    expect(isValidGlobalAyahNumber(6237)).toBe(false);
  });

  it("-1 → invalide", () => {
    expect(isValidGlobalAyahNumber(-1)).toBe(false);
  });

  it("null → invalide", () => {
    expect(isValidGlobalAyahNumber(null)).toBe(false);
  });

  it("undefined → invalide", () => {
    expect(isValidGlobalAyahNumber(undefined)).toBe(false);
  });

  it("NaN → invalide", () => {
    expect(isValidGlobalAyahNumber(NaN)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getAyahAudioCdnUrl
// ---------------------------------------------------------------------------

describe("getAyahAudioCdnUrl", () => {
  it("génère une URL CDN correcte avec les défauts", () => {
    expect(getAyahAudioCdnUrl(1)).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3",
    );
  });

  it("génère une URL pour le dernier ayah (6236)", () => {
    expect(getAyahAudioCdnUrl(6236)).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6236.mp3",
    );
  });

  it("génère une URL pour un ayah médian (262 — Al-Baqarah 255)", () => {
    expect(getAyahAudioCdnUrl(262)).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3",
    );
  });

  it("accepte un réciteur personnalisé", () => {
    expect(
      getAyahAudioCdnUrl(1, "ar.hudhaify"),
    ).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.hudhaify/1.mp3",
    );
  });

  it("accepte un bitrate personnalisé", () => {
    expect(getAyahAudioCdnUrl(1, DEFAULT_AYAH_RECITER, 64)).toBe(
      "https://cdn.islamic.network/quran/audio/64/ar.alafasy/1.mp3",
    );
  });

  it("combine réciteur et bitrate personnalisés", () => {
    expect(getAyahAudioCdnUrl(450, "ar.abdulsamad", 192)).toBe(
      "https://cdn.islamic.network/quran/audio/192/ar.abdulsamad/450.mp3",
    );
  });
});

// ---------------------------------------------------------------------------
// getAyahAudioUrl — raccourci avec défauts
// ---------------------------------------------------------------------------

describe("getAyahAudioUrl", () => {
  it("est équivalent à getAyahAudioCdnUrl avec les défauts", () => {
    expect(getAyahAudioUrl(1)).toBe(getAyahAudioCdnUrl(1));
    expect(getAyahAudioUrl(262)).toBe(getAyahAudioCdnUrl(262));
    expect(getAyahAudioUrl(6236)).toBe(getAyahAudioCdnUrl(6236));
  });
});

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

describe("constantes", () => {
  it("DEFAULT_AYAH_RECITER est défini", () => {
    expect(DEFAULT_AYAH_RECITER).toBe("ar.alafasy");
  });

  it("DEFAULT_AYAH_BITRATE est défini", () => {
    expect(DEFAULT_AYAH_BITRATE).toBe(128);
  });
});

// ---------------------------------------------------------------------------
// Intégration — compatibilité avec le type LessonAyahContext
// ---------------------------------------------------------------------------

describe("intégration LessonAyahContext", () => {
  it("un contexte avec globalAyahNumber null → pas d'URL", () => {
    const ctx: { globalAyahNumber: number | null } = { globalAyahNumber: null };
    expect(isValidGlobalAyahNumber(ctx.globalAyahNumber)).toBe(false);
  });

  it("un contexte avec globalAyahNumber valide → URL générable", () => {
    const ctx = { surahNumber: 1, ayahNumber: 1, globalAyahNumber: 1 };
    expect(isValidGlobalAyahNumber(ctx.globalAyahNumber)).toBe(true);
    expect(getAyahAudioUrl(ctx.globalAyahNumber)).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3",
    );
  });

  it("surah 114, ayah 6 → globalAyahNumber 6236 → URL valide", () => {
    // An-Nas, dernier verset du Coran
    expect(getAyahAudioUrl(6236)).toBe(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6236.mp3",
    );
  });
});