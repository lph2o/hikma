"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircleIcon, ArrowLeftIcon, CheckCircle2Icon, MailIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/learning/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {
    error: null,
    info: null,
  });

  return (
    <div className="w-full rounded-2xl border border-border bg-surface-elevated p-6 shadow-elevated sm:p-8">
      {state.info ? (
        /* État de succès rassurant */
        <div className="flex flex-col items-center gap-5 text-center animate-feedback-in">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-success/15 text-success">
            <CheckCircle2Icon className="size-8" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Vérifiez vos e-mails
            </h1>
            <p className="text-body-sm text-muted-foreground">
              {state.info}
            </p>
          </div>

          <div className="w-full rounded-xl border border-border-subtle bg-surface-subtle p-4 text-caption text-muted-foreground text-left">
            <p className="font-semibold text-foreground mb-1">Vous n&apos;avez rien reçu ?</p>
            <p>Vérifiez vos courriers indésirables (spams) ou réessayez avec votre adresse e-mail.</p>
          </div>

          <Button
            render={<Link href="/login" />}
            size="lg"
            className="h-12 w-full rounded-xl bg-hikma-teal-700 font-semibold text-white hover:bg-hikma-teal-800"
          >
            Retour à la connexion
          </Button>
        </div>
      ) : (
        /* Formulaire de demande */
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Mot de passe oublié
            </h1>
            <p className="text-body-sm text-muted-foreground">
              Saisissez l&apos;adresse e-mail de votre compte pour recevoir un lien sécurisé de réinitialisation.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-5" aria-busy={pending}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-body-sm font-medium text-foreground">
                Adresse e-mail
              </Label>
              <div className="relative flex w-full items-center rounded-xl border border-border bg-surface text-foreground shadow-xs/5 transition-all duration-150 ease-[var(--ease-hikma)] focus-within:border-hikma-teal-700 focus-within:ring-2 focus-within:ring-hikma-teal-700/20">
                <div className="pointer-events-none flex items-center pl-3.5 text-muted-foreground/70">
                  <MailIcon className="size-4 shrink-0" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={pending}
                  placeholder="toi@exemple.fr"
                  className="h-12 w-full min-w-0 bg-transparent pl-2.5 pr-3.5 text-body-md text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:h-11"
                />
              </div>
            </div>

            {state.error ? (
              <Alert variant="error" className="animate-feedback-in">
                <AlertCircleIcon className="size-4 shrink-0" />
                <div>
                  <AlertTitle>Envoi impossible</AlertTitle>
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
              Envoyer le lien de réinitialisation
            </Button>

            {pending ? (
              <span className="sr-only" aria-live="polite">
                Envoi du lien en cours…
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
