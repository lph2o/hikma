"use client";

import { useActionState, useState } from "react";
import { AlertTriangleIcon, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BodyMedium } from "@/components/ui/typography";
import { authenticate } from "@/lib/learning/actions";
import { cn } from "@/lib/utils";

type Mode = "sign-in" | "sign-up";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [state, formAction, pending] = useActionState(authenticate, {
    error: null,
    info: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5" aria-busy={pending}>
      <input type="hidden" name="mode" value={mode} />

      <div className="grid grid-cols-2 rounded-lg border border-border bg-surface p-1" role="tablist" aria-label="Mode de connexion">
        {(["sign-in", "sign-up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "h-9 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "sign-in" ? "Se connecter" : "Créer un compte"}
          </button>
        ))}
      </div>

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

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          required
          minLength={6}
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <Alert variant="error">
          <AlertTriangleIcon />
          <AlertTitle>Connexion impossible</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.info ? (
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>Presque fini</AlertTitle>
          <AlertDescription>{state.info}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" loading={pending} className="w-full min-h-12">
        {mode === "sign-in" ? "Se connecter" : "Créer mon compte"}
      </Button>

      {pending ? (
        <BodyMedium className="sr-only" aria-live="polite">
          {mode === "sign-in" ? "Connexion en cours…" : "Création du compte…"}
        </BodyMedium>
      ) : null}

      <BodyMedium className="text-center text-muted-foreground">
        {mode === "sign-in"
          ? "Pas encore de compte ? Bascule sur « Créer un compte »."
          : "Déjà inscrit ? Bascule sur « Se connecter »."}
      </BodyMedium>
    </form>
  );
}
