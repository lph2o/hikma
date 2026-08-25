"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import Link from "next/link";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BodyMedium } from "@/components/ui/typography";
import { updatePassword } from "@/lib/learning/actions";
import { hasRecoverySession } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";

type LinkState = "checking" | "ready" | "invalid";

/**
 * Formulaire de nouveau mot de passe (Phase 89D, R-004).
 *
 * - Avec `code` (lien reçu par e-mail, flux PKCE) : échange le code via
 *   `exchangeCodeForSession`, nettoie l'URL (le code n'est jamais affiché ni
 *   loggé), puis vérifie la session de récupération avant d'afficher le
 *   formulaire.
 * - Sans `code` : la page serveur a déjà vérifié la session de récupération.
 * La mise à jour du mot de passe est exécutée par l'action serveur
 * `updatePassword`, qui re-vérifie la session de récupération côté serveur.
 */
export function ResetPasswordForm({ code }: { code: string | null }) {
  const [state, formAction, pending] = useActionState(updatePassword, {
    error: null,
    info: null,
  });
  const [linkState, setLinkState] = useState<LinkState>(
    code ? "checking" : "ready",
  );
  const exchanged = useRef(false);

  useEffect(() => {
    if (!code || exchanged.current) return;
    exchanged.current = true;
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.exchangeCodeForSession(code);
      // Le code ne doit jamais rester dans l'URL (ni être partagé/loggé).
      window.history.replaceState({}, "", "/reset-password");
      if (cancelled) return;
      if (error || !hasRecoverySession(session)) {
        setLinkState("invalid");
        return;
      }
      setLinkState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (linkState === "checking") {
    return (
      <BodyMedium className="text-center text-muted-foreground" aria-live="polite">
        Vérification du lien…
      </BodyMedium>
    );
  }

  if (linkState === "invalid") {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error">
          <AlertTriangleIcon />
          <AlertTitle>Lien invalide ou expiré</AlertTitle>
          <AlertDescription>
            Ce lien de réinitialisation est invalide, expiré ou déjà utilisé.
            Redemande un lien pour continuer.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href="/forgot-password" />} size="lg" className="min-h-11 w-full sm:w-auto">
            Redemander un lien
          </Button>
          <Button
            render={<Link href="/login" />}
            size="lg"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
          >
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" aria-busy={pending}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••••"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <Alert variant="error">
          <AlertTriangleIcon />
          <AlertTitle>Mot de passe non modifié</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.info ? (
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>Mot de passe modifié</AlertTitle>
          <AlertDescription>{state.info}</AlertDescription>
        </Alert>
      ) : null}

      {state.info ? (
        <Button render={<Link href="/dashboard" />} size="lg" className="w-full min-h-12">
          Continuer vers mon tableau de bord
        </Button>
      ) : (
        <Button type="submit" size="lg" loading={pending} className="w-full min-h-12">
          Modifier mon mot de passe
        </Button>
      )}

      {pending ? (
        <BodyMedium className="sr-only" aria-live="polite">
          Mise à jour du mot de passe…
        </BodyMedium>
      ) : null}

      <BodyMedium className="text-center text-muted-foreground">
        <Link href="/login" className="hover:underline">
          ← Retour à la connexion
        </Link>
      </BodyMedium>
    </form>
  );
}
