/**
 * Logique pure du flux « mot de passe oublié » (Phase 89D, R-004).
 *
 * Module SANS "use server" et SANS import serveur (next/headers, supabase
 * server) : importable par les Client Components (contrôle de session de
 * récupération) et par les tests unitaires. Les actions serveur réelles
 * vivent dans `lib/learning/actions.ts` et injectent ici le client Supabase.
 */

export type PasswordResetState = {
  error: string | null;
  /** Message informatif (ex. lien envoyé, mot de passe modifié). */
  info: string | null;
};

/**
 * Message neutre systématique après une demande de lien : ne révèle jamais si
 * l'adresse correspond à un compte existant (anti-énumération).
 */
export const NEUTRAL_RESET_INFO =
  "Si un compte correspond à cette adresse, tu recevras un e-mail avec les instructions pour réinitialiser ton mot de passe.";

/** Vérifie qu'un e-mail est présent et a un format plausible. */
export function validateEmailForReset(email: string): string | null {
  if (!email) return "Renseigne ton adresse e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Cette adresse e-mail semble invalide.";
  }
  return null;
}

/** Valide un nouveau mot de passe + confirmation (règles côté serveur). */
export function validatePasswordResetInput(
  password: string,
  confirm: string,
): string | null {
  if (!password) return "Renseigne un nouveau mot de passe.";
  if (password.length < 6) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (password !== confirm) {
    return "Les deux mots de passe ne correspondent pas.";
  }
  return null;
}

/**
 * Lit la revendication `amr` d'un JWT d'accès (fallback : certaines versions
 * de supabase-js n'exposent pas `amr` sur l'objet Session alors que GoTrue
 * l'inclut dans le token). Retourne un tableau ou null.
 */
function readAmrFromToken(accessToken: string | undefined): unknown {
  if (!accessToken) return null;
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1] ?? ""));
    return Array.isArray(payload?.amr) ? payload.amr : null;
  } catch {
    return null;
  }
}

/**
 * Vrai si la session provient d'un lien de récupération (amr = "recovery").
 * Une session normale (login) ne peut pas réinitialiser le mot de passe via
 * ce parcours. Lit `amr` sur la session (lorsqu'exposé) puis, en repli, dans
 * le JWT d'accès — robuste quelle que soit la version de supabase-js.
 */
export function hasRecoverySession(
  session: { amr?: unknown; access_token?: string } | null,
): boolean {
  const amr = Array.isArray(session?.amr) && session.amr.length > 0
    ? session.amr
    : readAmrFromToken(session?.access_token);
  if (!Array.isArray(amr)) return false;
  return amr.some((entry) => {
    if (typeof entry === "string") return entry === "recovery";
    if (
      entry !== null &&
      typeof entry === "object" &&
      "method" in entry
    ) {
      return (entry as { method?: unknown }).method === "recovery";
    }
    return false;
  });
}

/**
 * Noyau testable : demande d'envoi du lien de réinitialisation.
 * - e-mail vide/invalide → erreur, aucun envoi ;
 * - envoi OK → message NEUTRE (jamais « cet e-mail n'existe pas ») ;
 * - erreur d'envoi → message générique neutre (pas d'énumération).
 */
export async function requestPasswordResetCore(
  email: string,
  baseRedirectTo: string,
  sendResetEmail: (
    redirectTo: string,
  ) => Promise<{ error: { message: string } | null }>,
): Promise<PasswordResetState> {
  const formatError = validateEmailForReset(email);
  if (formatError) return { error: formatError, info: null };

  const redirectTo = `${baseRedirectTo.replace(/\/+$/, "")}/reset-password`;
  const { error } = await sendResetEmail(redirectTo);
  if (error) {
    return {
      error: "Une erreur est survenue. Réessaie dans quelques instants.",
      info: null,
    };
  }
  return { error: null, info: NEUTRAL_RESET_INFO };
}

/**
 * Noyau testable : mise à jour du mot de passe.
 * La validation de la session de récupération est faite par l'action serveur
 * (hasRecoverySession) avant d'appeler ce noyau.
 */
export async function updatePasswordCore(
  password: string,
  confirm: string,
  changePassword: (
    password: string,
  ) => Promise<{ error: { message: string } | null }>,
): Promise<PasswordResetState> {
  const validationError = validatePasswordResetInput(password, confirm);
  if (validationError) return { error: validationError, info: null };

  const { error } = await changePassword(password);
  if (error) {
    return {
      error:
        "Impossible de modifier le mot de passe. Le lien est peut-être expiré.",
      info: null,
    };
  }
  return {
    error: null,
    info: "Ton mot de passe a été modifié. Tu peux maintenant te connecter.",
  };
}
