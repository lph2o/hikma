import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Rafraîchit la session Supabase avant le rendu (session refresh).
 *
 * Si Supabase n'est pas encore configuré (variables d'environnement absentes),
 * les requêtes passent sans traitement — l'application démarre sans clés.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Les en-têtes (Cache-Control…) fournis par @supabase/ssr doivent être
        // reportés sur la réponse pour éviter la mise en cache de session.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Déclenche le rafraîchissement du token si nécessaire (sans bloquer le rendu).
  try {
    await supabase.auth.getClaims();
  } catch {
    // Session cassée : refresh token inconnu ou révoqué (ex. refresh_token_not_found
    // après rotation, réinitialisation de mot de passe, suppression de session).
    // Impossible de rafraîchir → on purge les cookies de session pour sortir de
    // l'état cassé, sinon chaque requête retente le refresh et échoue en boucle
    // (erreurs répétées + redirections erratiques).
    await supabase.auth.signOut().catch(() => {});
    const ref = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split(".")[0] : "";
    if (ref) {
      const name = `sb-${ref}-auth-token`;
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Ignore les assets statiques, les images optimisées et le favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
