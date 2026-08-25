/**
 * Hikma — Notice de confidentialité (Phase 89H-I).
 *
 * Stockage LOCAL versionné de la préférence « l'utilisateur a vu la notice ».
 *
 * IMPORTANT : ce n'est PAS un consentement marketing. Hikma n'utilise aucun
 * traceur nécessitant un consentement (un seul cookie, celui de session).
 * La clé signifie seulement : l'utilisateur a été informé.
 *
 * Structure (future-proof, sans activer de catégorie inexistante) :
 * {
 *   version: 1,
 *   acknowledgedAt: "ISO-8601",
 *   categories: { necessary: true }   // analytics / marketing absents : non utilisés
 * }
 */

export const COOKIE_NOTICE_KEY = "hikma:consent:v1";
export const COOKIE_NOTICE_VERSION = 1;

export type CookieNoticeState = {
  version: number;
  acknowledgedAt: string;
  categories: { necessary: true };
};

export type NoticeVisibility = {
  /** La notice doit-elle être affichée ? */
  visible: boolean;
  /** L'utilisateur a-t-il déjà vu/confirmé la notice ? */
  acknowledged: boolean;
};

/** Parseur sûr : toute valeur corrompue/inconnue → non reconnue (notice visible). */
export function parseNoticeState(raw: string | null): CookieNoticeState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieNoticeState>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      parsed.version !== COOKIE_NOTICE_VERSION ||
      typeof parsed.acknowledgedAt !== "string" ||
      !parsed.categories ||
      parsed.categories.necessary !== true
    ) {
      return null;
    }
    return parsed as CookieNoticeState;
  } catch {
    return null;
  }
}

/** État de visibilité depuis une valeur brute de stockage. */
export function visibilityFromRaw(raw: string | null): NoticeVisibility {
  const state = parseNoticeState(raw);
  return state ? { visible: false, acknowledged: true } : { visible: true, acknowledged: false };
}

/** Construit la valeur à persister après « Compris ». */
export function buildAcknowledgedState(now = new Date()): CookieNoticeState {
  return {
    version: COOKIE_NOTICE_VERSION,
    acknowledgedAt: now.toISOString(),
    categories: { necessary: true },
  };
}

/**
 * Lecteur/écrivain sûr (SSR-compatible : `storage` peut être undefined).
 * Aucun cookie, aucun appel réseau, aucune donnée envoyée.
 */
export function createCookieNoticeStorage(storage?: Pick<Storage, "getItem" | "setItem">) {
  return {
    read(): NoticeVisibility {
      if (!storage) return { visible: true, acknowledged: false };
      try {
        return visibilityFromRaw(storage.getItem(COOKIE_NOTICE_KEY));
      } catch {
        return { visible: true, acknowledged: false };
      }
    },
    acknowledge(now = new Date()): void {
      if (!storage) return;
      try {
        storage.setItem(COOKIE_NOTICE_KEY, JSON.stringify(buildAcknowledgedState(now)));
      } catch {
        // Stockage indisponible (mode privé plein) : la notice restera visible,
        // l'application continue de fonctionner normalement.
      }
    },
  };
}
