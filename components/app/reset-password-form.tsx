"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import Link from "next/link";
import { AlertCircleIcon, ArrowLeftIcon, CheckCircle2Icon, KeyRoundIcon, RotateCcwIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/app/auth/password-input";
import { updatePassword } from "@/lib/learning/actions";
import { hasRecoverySession } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";

type LinkState = "checking" | "ready" | "invalid";

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
      // Le code ne doit jamais rester dans l'URL.
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
      <div className="w-full rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-elevated">
        <div className="my-6 flex flex-col items-center gap-3">
          <div className="flex size-12 animate-spin items-center justify-center rounded-full border-2 border-hikma-teal-700 border-t-transparent" />
          <p className="text-body-md font-medium text-foreground" aria-live="polite">
            Vérification du lien de réinitialisation…
          </p>
        </div>
      </div>
    );
  }

  if (linkState === "invalid") {
    return (
      <div className="w-full rounded-2xl border border-border bg-surface-elevated p-6 shadow-elevated sm:p-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <AlertCircleIcon className="size-8" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Lien invalide ou expiré
            </h1>
            <p className="text-body-sm text-muted-foreground">
              Ce lien de réinitialisation est invalide, a expiré ou a déjà été utilisé.
            </p>
          </div>

          <div className="mt-2 flex w-full flex-col gap-2.5 sm:flex-row">
            <Button
              render={<Link href="/forgot-password" />}
              size="lg"
              className="h-12 w-full rounded-xl bg-hikma-teal-700 font-semibold text-white hover:bg-hikma-teal-800"
            >
              <RotateCcwIcon className="size-4" />
              <span>Redemander un lien</span>
            </Button>
            <Button
              render={<Link href="/login" />}
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-xl"
            >
              <span>Connexion</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-border bg-surface-elevated p-6 shadow-elevated sm:p-8">
      {state.info ? (
        /* Succès : Mot de passe mis à jour */
        <div className="flex flex-col items-center gap-5 text-center animate-feedback-in">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-success/15 text-success">
            <CheckCircle2Icon className="size-8" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Mot de passe modifié !
            </h1>
            <p className="text-body-sm text-muted-foreground">
              Votre nouveau mot de passe est actif. Vous pouvez accéder à votre espace d&apos;apprentissage.
            </p>
          </div>

          <Button
            render={<Link href="/dashboard" />}
            size="lg"
            className="mt-2 h-12 w-full rounded-xl bg-hikma-teal-700 font-semibold text-white hover:bg-hikma-teal-800"
          >
            Accéder à mon tableau de bord
          </Button>
        </div>
      ) : (
        /* Formulaire de saisie */
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <div className="mb-2 flex items-center justify-center sm:justify-start">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-hikma-gold/15 text-hikma-teal-800">
                <KeyRoundIcon className="size-5" />
              </span>
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Nouveau mot de passe
            </h1>
            <p className="text-body-sm text-muted-foreground">
              Choisissez un mot de passe robuste d&apos;au moins 6 caractères.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4.5" aria-busy={pending}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-body-sm font-medium text-foreground">
                Nouveau mot de passe
              </Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={pending}
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-body-sm font-medium text-foreground">
                Confirmer le mot de passe
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={pending}
                placeholder="••••••••"
              />
            </div>

            {state.error ? (
              <Alert variant="error" className="animate-feedback-in">
                <AlertCircleIcon className="size-4 shrink-0" />
                <div>
                  <AlertTitle>Modification impossible</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </div>
              </Alert>
            ) : null}

            <Button
              type="submit"
              size="lg"
              loading={pending}
              className="mt-1 h-12 w-full rounded-xl bg-hikma-teal-700 font-semibold text-white shadow-sm transition-transform hover:bg-hikma-teal-800 active:scale-[0.99]"
            >
              Enregistrer le nouveau mot de passe
            </Button>

            {pending ? (
              <span className="sr-only" aria-live="polite">
                Mise à jour du mot de passe en cours…
              </span>
            ) : null}

            <div className="flex justify-center">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 text-body-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
