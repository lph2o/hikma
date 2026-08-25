import { describe, expect, it } from "vitest";
import { getLocalDateKey } from "../lib/learning/activity";

// ---------------------------------------------------------------------------
// getLocalDateKey — conversion timestamp → date locale (Phase 77)
// ---------------------------------------------------------------------------

describe("getLocalDateKey — timezone IANA", () => {
  it("sans timezone → identique à getActivityDate (UTC)", () => {
    const ts = new Date("2026-08-23T12:00:00.000Z");
    expect(getLocalDateKey(ts, null)).toBe("2026-08-23");
    expect(getLocalDateKey(ts, undefined)).toBe("2026-08-23");
    expect(getLocalDateKey(ts)).toBe("2026-08-23");
  });

  it("accepte une chaîne ISO en entrée", () => {
    expect(getLocalDateKey("2026-08-23T12:00:00.000Z", null)).toBe("2026-08-23");
  });

  // UTC
  it("UTC : midi → même jour", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T12:00:00.000Z"), "UTC"),
    ).toBe("2026-08-23");
  });

  it("UTC : proche de minuit → reste le même jour", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T23:59:00.000Z"), "UTC"),
    ).toBe("2026-08-23");
  });

  // Europe/Rome
  it("Europe/Rome : 22:30Z → 24 août (minuit passée à Rome)", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T22:30:00.000Z"), "Europe/Rome"),
    ).toBe("2026-08-24");
  });

  it("Europe/Rome : 20:00Z → 23 août (22:00 à Rome)", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T20:00:00.000Z"), "Europe/Rome"),
    ).toBe("2026-08-23");
  });

  it("Europe/Rome : midi → même jour", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T10:00:00.000Z"), "Europe/Rome"),
    ).toBe("2026-08-23");
  });

  // America/New_York
  it("America/New_York : 22:30Z → toujours le 23 (18:30 à NY)", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T22:30:00.000Z"), "America/New_York"),
    ).toBe("2026-08-23");
  });

  it("America/New_York : 04:00Z → 23 août (00:00 à NY)", () => {
    expect(
      getLocalDateKey(new Date("2026-08-24T04:00:00.000Z"), "America/New_York"),
    ).toBe("2026-08-24");
  });

  // Asia/Tokyo
  it("Asia/Tokyo : 15:00Z → 24 août (minuit passée à Tokyo)", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T15:00:00.000Z"), "Asia/Tokyo"),
    ).toBe("2026-08-24");
  });

  it("Asia/Tokyo : 14:00Z → toujours le 23 (23:00 à Tokyo)", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T14:00:00.000Z"), "Asia/Tokyo"),
    ).toBe("2026-08-23");
  });

  // DST : Europe/Paris en été (UTC+2)
  it("Europe/Paris été : 21:59Z → 23 août (23:59 à Paris)", () => {
    // Août = heure d'été en Europe
    expect(
      getLocalDateKey(new Date("2026-08-23T21:59:00.000Z"), "Europe/Paris"),
    ).toBe("2026-08-23");
  });

  it("Europe/Paris été : 22:00Z → 24 août (00:00 à Paris)", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T22:00:00.000Z"), "Europe/Paris"),
    ).toBe("2026-08-24");
  });

  // DST : Europe/Paris en hiver (UTC+1)
  it("Europe/Paris hiver : 22:59Z → même jour (23:59 à Paris)", () => {
    // Janvier = heure d'hiver en Europe
    expect(
      getLocalDateKey(new Date("2026-01-15T22:59:00.000Z"), "Europe/Paris"),
    ).toBe("2026-01-15");
  });

  it("Europe/Paris hiver : 23:00Z → jour suivant (00:00 à Paris)", () => {
    expect(
      getLocalDateKey(new Date("2026-01-15T23:00:00.000Z"), "Europe/Paris"),
    ).toBe("2026-01-16");
  });

  // Africa/Dakar (UTC+0, pas de DST)
  it("Africa/Dakar : 23:30Z → même jour (UTC+0)", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T23:30:00.000Z"), "Africa/Dakar"),
    ).toBe("2026-08-23");
  });

  it("Africa/Dakar : 00:30Z → 23 août", () => {
    expect(
      getLocalDateKey(new Date("2026-08-23T00:30:00.000Z"), "Africa/Dakar"),
    ).toBe("2026-08-23");
  });
});

describe("getLocalDateKey — robustesse", () => {
  it("timestamp identique, timezones différents → dates différentes", () => {
    const ts = new Date("2026-08-23T22:30:00.000Z");
    const utc = getLocalDateKey(ts, "UTC");
    const rome = getLocalDateKey(ts, "Europe/Rome");
    const ny = getLocalDateKey(ts, "America/New_York");
    // Rome = 24, UTC = 23, NY = 23
    expect(utc).toBe("2026-08-23");
    expect(rome).toBe("2026-08-24");
    expect(ny).toBe("2026-08-23");
  });

  it("timezone avec chaîne vide → UTC", () => {
    const ts = new Date("2026-08-23T22:30:00.000Z");
    expect(getLocalDateKey(ts, "")).toBe("2026-08-23");
  });

  it("timezone valide exotique : Pacific/Auckland", () => {
    // UTC+12 en août
    const ts = new Date("2026-08-23T11:00:00.000Z");
    expect(
      getLocalDateKey(ts, "Pacific/Auckland"),
    ).toBe("2026-08-23"); // 23:00 NZST same day
  });
});