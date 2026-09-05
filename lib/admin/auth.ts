import { redirect, notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Vérifie si une adresse e-mail fait partie des administrateurs autorisés (ADMIN_EMAILS).
 * Case-insensitive, tolérant aux espaces. Si ADMIN_EMAILS est vide ou absent, aucun admin n'est reconnu.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return false;
  return adminEmails.includes((email ?? "").toLowerCase());
}

/**
 * Garde d'authentification admin côté serveur.
 * - Non connecté -> redirection /login
 * - Connecté mais non admin -> notFound() (404 opaque de sécurité)
 * - Admin vérifié -> retourne l'utilisateur
 */
export async function requireAdmin(): Promise<User> {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    notFound();
  }

  return user;
}
