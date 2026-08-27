// Hikma — Content Studio (B10) : SCHEDULER DE PUBLICATION (abstraction pure).
//
// INDÉPENDANT de LeitnerScheduler (SRS d'apprentissage) : il ne planifie que
// des publications de contenu. Timezone EXPLICITE, idempotence par contentKey
// (un seul SCHEDULED actif par contenu — garanti par le registre), retry
// contrôlé (borné, jamais infini). Le pipeline fonctionne SANS scheduler :
// si aucun schedule n'est actif, rien n'est publié.

import type { PublishingPlatform } from "./publishing";

/** Fuseau explicite du studio (décision V1, réglable). */
export const CONTENT_SCHEDULE_TIMEZONE = "Europe/Paris" as const;

export type PublishSchedule = {
  contentKey: string;
  version: number;
  /**
   * ISO 8601. Avec décalage explicite (…+02:00 / …Z) : interprété tel quel.
   * Sans décalage (ex. "2026-08-27T01:30:00") : interprété comme heure LOCALE
   * dans `timezone`.
   */
  publishAt: string;
  timezone: string;
  platform: PublishingPlatform;
};

/** Retry borné : 3 tentatives max, backoff 5 min (jamais infini). */
export const PUBLISH_MAX_ATTEMPTS = 3 as const;
export const PUBLISH_RETRY_BACKOFF_MS = 300_000 as const;

const OFFSET_RE = /(Z|[+-]\d{2}:\d{2})$/;

/**
 * Résout l'instant de publication :
 *   - offset explicite → parsing direct (instantané sans ambiguïté) ;
 *   - heure locale sans offset → conversion dans le fuseau cible.
 * Fonction PURE — aucune I/O.
 */
export function parsePublishAt(iso: string, timezone: string): Date {
  if (OFFSET_RE.test(iso)) return new Date(iso);
  return parseWallClockInTimezone(iso, timezone);
}

/**
 * Interprète une heure murale ("YYYY-MM-DDTHH:mm[:ss]") dans un fuseau
 * explicite : itère pour converger vers l'instant dont l'affichage local
 * correspond exactement à l'heure murale (algorithme standard de conversion
 * de fuseau, déterministe — max 4 itérations).
 */
export function parseWallClockInTimezone(iso: string, timezone: string): Date {
  const [datePart, timePart = "00:00"] = iso.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi, s = 0] = timePart.split(":").map(Number);
  const target = Date.UTC(y, mo - 1, d, h, mi, s);

  const displayedInTimezoneAsUtc = (instant: Date): number => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((p) => [p.type, p.value]),
    );
    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second),
    );
  };

  // Départ : l'heure murale interprétée comme UTC, puis on décale l'estimation
  // de l'écart entre l'heure AFFICHÉE (dans le fuseau) et l'heure cible.
  let estimate = target;
  for (let i = 0; i < 4; i += 1) {
    const drift = displayedInTimezoneAsUtc(new Date(estimate)) - target;
    if (drift === 0) break;
    estimate -= drift;
  }
  return new Date(estimate);
}

/**
 * Un schedule est dû si l'instant de publication résolu est ≤ `now`.
 */
export function isPublishDue(schedule: PublishSchedule, now: Date): boolean {
  return parsePublishAt(schedule.publishAt, schedule.timezone).getTime() <= now.getTime();
}
