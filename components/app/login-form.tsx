"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircleIcon, CheckCircle2Icon, MailIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/app/auth/password-input";
import { authenticate } from "@/lib/learning/actions";
import { cn } from "@/lib/utils";

export type AuthMode = "sign-in" | "sign-up";

export function LoginForm({ initialMode = "sign-in" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [state, formAction, pending] = useActionState(authenticate, {
    error: null,
    info: null,
  });

  return (
    <div className="w-full rounded-2xl border border-border bg-surface-elevated p-6 shadow-elevated sm:p-8">
      {/* En-tête du formulaire */}
      <div className="mb-6 flex flex-col gap-1 text-center sm:text-left">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {mode === "sign-in" ? "Bienvenue sur Hikma" : "Créer votre compte"}
        </h1>
        <p className="text-body-sm text-muted-foreground">
          {mode === "sign-in"
            ? "Connectez-vous pour continuer votre apprentissage coranique."
            : "Rejoignez Hikma et commencez à comprendre le Coran mot par mot."}
        </p>
      </div>

      {/* Sélecteur d'onglets Connexion / Inscription */}
      <div
        className="mb-6 grid grid-cols-2 rounded-xl border border-border-subtle bg-surface-subtle p-1"
        role="tablist"
        aria-label="Mode d'authentification"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-in"}
          onClick={() => setMode("sign-in")}
          className={cn(
            "h-10 rounded-lg text-sm font-semibold transition-all duration-150 ease-[var(--ease-hikma)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            mode === "sign-in"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Se connecter
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "sign-up"}
          onClick={() => setMode("sign-up")}
          className={cn(
            "h-10 rounded-lg text-sm font-semibold transition-all duration-150 ease-[var(--ease-hikma)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            mode === "sign-up"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Créer un compte
        </button>
      </div>

      {/* Formulaire Supabase Auth */}
      <form action={formAction} className="flex flex-col gap-4.5" aria-busy={pending}>
        <input type="hidden" name="mode" value={mode} />

        {/* Champ Email */}
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

        {/* Champ Mot de passe */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-body-sm font-medium text-foreground">
              Mot de passe
            </Label>
            {mode === "sign-in" ? (
              <Link
                href="/forgot-password"
                className="text-body-sm font-medium text-hikma-teal-700 hover:text-hikma-teal-800 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            ) : (
              <span className="text-caption text-muted-foreground">Min. 6 caractères</span>
            )}
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={6}
            disabled={pending}
            placeholder="••••••••"
          />
        </div>

        {/* Retours d'erreur & d'information */}
        {state.error ? (
          <Alert variant="error" className="animate-feedback-in">
            <AlertCircleIcon className="size-4 shrink-0" />
            <div>
              <AlertTitle>Connexion impossible</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {state.info ? (
          <Alert variant="info" className="animate-feedback-in">
            <CheckCircle2Icon className="size-4 shrink-0 text-success" />
            <div>
              <AlertTitle>Compte créé</AlertTitle>
              <AlertDescription>{state.info}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {/* Bouton CTA Principal */}
        <Button
          type="submit"
          size="lg"
          loading={pending}
          className="mt-1 h-12 w-full rounded-xl bg-hikma-teal-700 font-semibold text-white shadow-sm transition-transform hover:bg-hikma-teal-800 active:scale-[0.99]"
        >
          {mode === "sign-in" ? "Se connecter" : "Créer mon compte"}
        </Button>

        {pending ? (
          <span className="sr-only" aria-live="polite">
            {mode === "sign-in" ? "Connexion en cours…" : "Création du compte…"}
          </span>
        ) : null}

        {/* Bascule secondaire en bas de formulaire */}
        <p className="mt-2 text-center text-body-sm text-muted-foreground">
          {mode === "sign-in" ? (
            <>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className="font-semibold text-hikma-teal-700 hover:text-hikma-teal-800 hover:underline"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{" "}
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className="font-semibold text-hikma-teal-700 hover:text-hikma-teal-800 hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
