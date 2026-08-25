"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BodyMedium } from "@/components/ui/typography";
import { requestPasswordReset } from "@/lib/learning/actions";

/**
 * Formulaire « mot de passe oublié » (Phase 89D, R-004).
 * Message neutre anti-énumération : aucune distinction entre un e-mail
 * existant et un e-mail inconnu.
 */
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {
    error: null,
    info: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" aria-busy={pending}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="toi@exemple.fr"
        />
      </div>

      {state.error ? (
        <Alert variant="error">
          <AlertTriangleIcon />
          <AlertTitle>Envoi impossible</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.info ? (
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>Vérifie ta boîte mail</AlertTitle>
          <AlertDescription>{state.info}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" loading={pending} className="w-full min-h-12">
        Envoyer le lien
      </Button>

      {pending ? (
        <BodyMedium className="sr-only" aria-live="polite">
          Envoi du lien en cours…
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
